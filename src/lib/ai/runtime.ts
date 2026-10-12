import { WebWorkerMLCEngine, prebuiltAppConfig } from '@mlc-ai/web-llm';
import { MODEL_ID } from './config.ts';
import { answerSchema, buildPrompt, SYSTEM_PROMPT } from './protocol.ts';
import type { Passage } from './types.ts';

export class LocalModel {
  private worker: Worker;
  private engine: WebWorkerMLCEngine;
  private controller = new AbortController();

  constructor(onProgress: (progress: number) => void) {
    const record = prebuiltAppConfig.model_list.find(model => model.model_id === MODEL_ID);
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
    return this.guarded(() => this.engine.reload(MODEL_ID, { context_window_size: 4096 }), 360_000);
  }

  async generate(question: string, sources: Passage[], previousQuestion: string, onText: (text: string) => void): Promise<string> {
    return this.guarded(async () => {
      const stream = await this.engine.chat.completions.create({
        messages: [{ role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildPrompt(question, sources, previousQuestion) }],
        stream: true, temperature: 0, max_tokens: 160,
        extra_body: { enable_thinking: false },
        response_format: { type: 'json_object', schema: answerSchema(sources) },
      });
      let text = '';
      for await (const chunk of stream) {
        text += chunk.choices[0]?.delta.content || '';
        onText(text);
      }
      return text;
    }, 120_000);
  }

  dispose(message = 'AI byla vypnuta.'): void {
    if (!this.controller.signal.aborted) this.controller.abort(new Error(message));
    this.worker.terminate();
  }
}
