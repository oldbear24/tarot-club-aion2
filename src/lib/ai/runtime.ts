import { WebWorkerMLCEngine, prebuiltAppConfig } from '@mlc-ai/web-llm';
import type { ChatCompletionRequestStreaming } from '@mlc-ai/web-llm';
import { THINKING_TOKENS } from './config.ts';
import { answerSchema, buildPrompt, parseAnswer, splitThinking, SYSTEM_PROMPT } from './protocol.ts';
import type { Passage } from './types.ts';

export interface GenerateOptions { think?: boolean; onThinking?: (text: string) => void }

export class LocalModel {
  private worker: Worker;
  private engine: WebWorkerMLCEngine;
  private controller = new AbortController();
  private modelId: string;

  constructor(onProgress: (progress: number) => void, modelId: string) {
    this.modelId = modelId;
    const record = prebuiltAppConfig.model_list.find(model => model.model_id === modelId);
    if (!record) throw new Error('Model není v podporované konfiguraci WebLLM.');
    this.worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    this.engine = new WebWorkerMLCEngine(this.worker, {
      appConfig: { model_list: [record], cacheBackend: 'cache' }, logLevel: 'SILENT',
      initProgressCallback: report => onProgress(Math.max(0, Math.min(1, report.progress))),
    });
    this.worker.addEventListener('error', () => this.dispose('Výpočetní vlákno AI se nepodařilo spustit.'));
    this.worker.addEventListener('messageerror', () => this.dispose('Přerušilo se spojení s lokálním modelem.'));
  }

  private async guarded<T>(operation: () => Promise<T>, timeoutMs: number): Promise<T> {
    const signal = this.controller.signal;
    if (signal.aborted) throw signal.reason;
    let rejectAbort: () => void = () => {};
    const aborted = new Promise<never>((_, reject) => {
      rejectAbort = () => reject(signal.reason);
      signal.addEventListener('abort', rejectAbort, { once: true });
    });
    const timer = setTimeout(() => this.dispose('AI neodpovídá. Zkus ji znovu zapnout nebo použij vyhledávání.'), timeoutMs);
    try { return await Promise.race([operation(), aborted]); }
    finally { clearTimeout(timer); signal.removeEventListener('abort', rejectAbort); }
  }

  initialize(): Promise<void> {
    return this.guarded(() => this.engine.reload(this.modelId, { context_window_size: 4096 }), 360_000);
  }

  private async stream(request: Omit<ChatCompletionRequestStreaming, 'stream'>, onText: (text: string) => void): Promise<string> {
    const stream = await this.engine.chat.completions.create({ ...request, stream: true });
    let text = '';
    for await (const chunk of stream) {
      text += chunk.choices[0]?.delta.content || '';
      onText(text);
    }
    return text;
  }

  async generate(question: string, sources: Passage[], previousQuestion: string, onText: (text: string) => void,
    options: GenerateOptions = {}): Promise<string> {
    const messages = (analysis = '') => [{ role: 'system' as const, content: SYSTEM_PROMPT },
      { role: 'user' as const, content: buildPrompt(question, sources, previousQuestion, analysis) }];
    let analysis = '';
    if (options.think) {
      // Qwen3 recommends sampling in thinking mode; greedy decoding tends to loop.
      const draft = await this.guarded(() => this.stream({ messages: messages(), temperature: 0.6, top_p: 0.95,
        max_tokens: THINKING_TOKENS, extra_body: { enable_thinking: true } }, text => {
        const parts = splitThinking(text);
        options.onThinking?.(parts.thinking);
        onText(parts.answer);
      }), 240_000);
      const parts = splitThinking(draft);
      // Unconstrained output is used only when it already is a valid selection; otherwise the grammar pass decides.
      if (parseAnswer(parts.answer, sources, true).length) return parts.answer;
      analysis = parts.thinking;
    }
    return this.guarded(() => this.stream({ messages: messages(analysis), temperature: 0, max_tokens: 160,
      extra_body: { enable_thinking: false },
      response_format: { type: 'json_object', schema: answerSchema(sources) } }, onText), 120_000);
  }

  dispose(message = 'AI byla vypnuta.'): void {
    if (!this.controller.signal.aborted) this.controller.abort(new Error(message));
    this.worker.terminate();
  }
}
