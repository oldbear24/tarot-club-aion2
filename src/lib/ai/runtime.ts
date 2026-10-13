import { WebWorkerMLCEngine, prebuiltAppConfig } from '@mlc-ai/web-llm';
import type { ChatCompletionRequestStreaming } from '@mlc-ai/web-llm';
import { ANSWER_TOKENS } from './config.ts';
import { buildPrompt, SYSTEM_PROMPT } from './protocol.ts';
import type { Passage } from './types.ts';

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
    const timer = setTimeout(() => this.dispose('AI neodpovídá. Zkus otázku odeslat znovu nebo použij vyhledávání.'), timeoutMs);
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

  generate(question: string, sources: Passage[], previousQuestion: string, onText: (text: string) => void): Promise<string> {
    const messages = [{ role: 'system' as const, content: SYSTEM_PROMPT },
      { role: 'user' as const, content: buildPrompt(question, sources, previousQuestion) }];
    // Qwen3 non-thinking settings, slightly cooler so the answer stays close to the passages.
    return this.guarded(() => this.stream({ messages, temperature: 0.3, top_p: 0.8, presence_penalty: 0.5,
      max_tokens: ANSWER_TOKENS, extra_body: { enable_thinking: false } }, onText), 180_000);
  }

  dispose(message = 'AI byla vypnuta.'): void {
    if (!this.controller.signal.aborted) this.controller.abort(new Error(message));
    this.worker.terminate();
  }
}
