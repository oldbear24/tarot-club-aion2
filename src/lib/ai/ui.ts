import { MAX_QUESTION_LENGTH, retrievalQuery, retrievePassages, validateIndex } from './retrieval.ts';
import { parseAnswer } from './protocol.ts';
import { renderAnswer } from './render.ts';
import type { WikiIndex } from './types.ts';
import type { LocalModel } from './runtime.ts';
import { modelFor } from './config.ts';

// Bump when the download changes substantially, so people are asked again.
const CONSENT_KEY = 'tarot-ai-download-consent';
const CONSENT_VALUE = 'qwen3-1.7b';

function hasConsent(): boolean {
  try { return localStorage.getItem(CONSENT_KEY) === CONSENT_VALUE; } catch { return false; }
}

function storeConsent(): void {
  try { localStorage.setItem(CONSENT_KEY, CONSENT_VALUE); } catch { /* Private mode: ask again next time. */ }
}

type GPUAccess = { requestAdapter(): Promise<{ features?: { has(name: string): boolean } } | null> };

function supportReason(): string | undefined {
  if (!window.isSecureContext) return 'Lokální AI potřebuje zabezpečené připojení HTTPS. Můžeš použít vyhledávání wiki.';
  if (!(navigator as unknown as { gpu?: GPUAccess }).gpu) return 'Tento prohlížeč nemá dostupné WebGPU. Zkus aktuální Chrome nebo Edge s podporovanou grafickou kartou, případně vyhledávání wiki.';
  if (!('Worker' in window)) return 'Prohlížeč nepodporuje výpočetní vlákna potřebná pro AI. Použij vyhledávání wiki.';
}

function failureMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : '';
  if (/memory|allocation|out of|buffer|device.*lost/i.test(message)) return 'Grafická karta nemá dostatek dostupné paměti nebo přestala odpovídat. Zavři náročné aplikace a zkus otázku odeslat znovu, případně použij vyhledávání.';
  if (/fetch|network|offline|download/i.test(message)) return 'Nepodařilo se stáhnout potřebné soubory. Zkontroluj připojení a zkus otázku odeslat znovu. Vyhledávání wiki zůstává dostupné.';
  return 'Lokální AI se nepodařilo připravit nebo výpočet selhal. Zkus otázku odeslat znovu, případně použij vyhledávání wiki.';
}

export function initTarotChat(): void {
  const root = document.querySelector<HTMLElement>('[data-tarot-chat]');
  if (!root || root.dataset.initialized) return;
  root.dataset.initialized = 'true';
  const get = <T extends HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
  const input = get<HTMLTextAreaElement>('[data-ai-input]');
  const status = get<HTMLElement>('[data-ai-status]');
  const messages = get<HTMLElement>('[data-ai-messages]');
  const deactivate = get<HTMLButtonElement>('[data-ai-deactivate]');
  const send = get<HTMLButtonElement>('[data-ai-send]');
  const reset = get<HTMLButtonElement>('[data-ai-reset]');
  const progress = get<HTMLProgressElement>('[data-ai-progress]');
  const think = get<HTMLInputElement>('[data-ai-think]');
  const consent = get<HTMLDialogElement>('[data-ai-consent]');
  const base = import.meta.env.BASE_URL;
  let model: LocalModel | undefined;
  // `busy` covers the whole question, including the model download: only one question runs at a time.
  let ready = false, busy = false, loading = false;
  let generation = 0;
  let index: WikiIndex | undefined;
  let previousQuestion = '';
  let fetchController: AbortController | undefined;

  const updateControls = () => {
    send.disabled = busy || !input.value.trim() || !!supportReason();
    send.textContent = busy ? 'Čekej…' : 'Odeslat';
    reset.disabled = busy;
    deactivate.hidden = !ready && !busy;
    deactivate.textContent = busy ? 'Zastavit' : 'Vypnout AI';
    progress.hidden = !loading;
    messages.setAttribute('aria-busy', String(busy));
  };
  const disable = () => {
    generation++;
    model?.dispose(); model = undefined;
    fetchController?.abort();
    if (consent.open) consent.close('cancel');
    ready = false; busy = false; loading = false;
    updateControls();
  };
  const unsupported = supportReason();
  if (unsupported) status.textContent = unsupported;
  updateControls();

  const askConsent = () => new Promise<boolean>(resolve => {
    consent.returnValue = '';
    consent.addEventListener('close', () => resolve(consent.returnValue === 'accept'), { once: true });
    consent.showModal();
  });

  // Throws on failure; the caller reports it in the answer.
  const loadModel = async (current: number) => {
    loading = true; progress.value = 0;
    status.textContent = 'Ověřuji podporu grafické karty…';
    updateControls();
    try {
      const gpu = (navigator as unknown as { gpu: GPUAccess }).gpu;
      const adapter = await gpu.requestAdapter();
      if (!adapter) throw new Error('no-adapter');
      if (current !== generation) return;
      const { LocalModel } = await import('./runtime.ts');
      if (current !== generation) return;
      model = new LocalModel(value => {
        if (current !== generation) return;
        progress.value = value;
        status.textContent = `Načítání modelu: ${Math.round(value * 100)} % (stažení a příprava).`;
      }, modelFor(!!adapter.features?.has('shader-f16')));
      await model.initialize();
      if (current !== generation) return;
      ready = true;
    } finally {
      if (current === generation) { loading = false; updateControls(); }
    }
  };

  deactivate.addEventListener('click', () => {
    const wasBusy = busy;
    disable();
    if (wasBusy) {
      const note = document.createElement('p');
      note.textContent = 'Dotaz byl zastaven. Případná odpověď výše je neúplná.';
      messages.append(note);
    }
    status.textContent = 'AI je vypnutá, její paměť byla uvolněna. Stažené soubory zůstávají v cache prohlížeče.';
  });
  const openSearch = (event?: Event, query = input.value.trim()) => {
    // Starlight closes its dialog on outside clicks, including the original caller's click.
    event?.stopPropagation();
    const button = document.querySelector<HTMLButtonElement>('site-search [data-open-modal]');
    if (!button || button.disabled) {
      status.textContent = 'Vyhledávání se ještě připravuje. Použij tlačítko Hledat v hlavičce wiki.';
      return;
    }
    button.click();
    const fillQuery = (attempt = 0) => {
      const field = document.querySelector<HTMLInputElement>('site-search input');
      if (field && query) {
        field.value = query;
        field.dispatchEvent(new Event('input', { bubbles: true }));
      } else if (!field && attempt < 20) setTimeout(() => fillQuery(attempt + 1), 100);
    };
    fillQuery();
  };
  get<HTMLButtonElement>('[data-ai-search]').addEventListener('click', openSearch);
  const searchButton = (parent: HTMLElement, question: string) => {
    const button = document.createElement('button');
    button.type = 'button'; button.textContent = 'Vyhledat téma ve wiki';
    button.addEventListener('click', event => openSearch(event, question)); parent.append(button);
  };
  root.querySelectorAll<HTMLButtonElement>('[data-ai-example]').forEach(button => {
    button.addEventListener('click', () => {
      input.value = button.dataset.aiExample || ''; updateControls(); input.focus();
    });
  });
  input.addEventListener('input', updateControls);
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      if (!send.disabled) get<HTMLFormElement>('[data-ai-form]').requestSubmit();
    }
  });
  reset.addEventListener('click', () => {
    if (busy) return;
    messages.replaceChildren(); previousQuestion = ''; input.value = '';
    status.textContent = ready ? 'Nový chat. AI je připravená.' : supportReason() || 'Nový chat. Model se načte s první otázkou.';
    updateControls(); input.focus();
  });

  get<HTMLFormElement>('[data-ai-form]').addEventListener('submit', async event => {
    event.preventDefault();
    const question = input.value.trim();
    if (busy || !question || supportReason()) return;
    if (question.length > MAX_QUESTION_LENGTH) { status.textContent = 'Zkrať prosím otázku na nejvýše 800 znaků.'; return; }
    const current = generation;
    busy = true;
    input.value = '';
    status.textContent = 'Hledám relevantní pasáže ve wiki…';
    const userMessage = document.createElement('div');
    userMessage.className = 'tarot-message tarot-message--question';
    userMessage.textContent = `Ty: ${question}`;
    const answer = document.createElement('div'); answer.className = 'tarot-message';
    answer.setAttribute('aria-label', 'Odpověď Tarot AI');
    answer.textContent = 'Hledám podklady…';
    messages.append(userMessage, answer);
    userMessage.scrollIntoView({ block: 'nearest' });
    updateControls();
    let stage: 'model' | 'answer' = 'answer';
    try {
      if (!index) {
        fetchController = new AbortController();
        const timer = setTimeout(() => fetchController?.abort(), 15_000);
        try {
          const response = await fetch(`${base.replace(/\/$/, '')}/ai/wiki-index.json`, { signal: fetchController.signal, credentials: 'omit' });
          if (!response.ok) throw new Error('index-fetch');
          index = validateIndex(await response.json(), location.origin, base);
        } finally { clearTimeout(timer); }
      }
      if (current !== generation) return;
      const query = retrievalQuery(question, previousQuestion);
      const sources = retrievePassages(index, query);
      // Without evidence there is nothing for the model to choose, so nothing is downloaded.
      if (!sources.length) {
        renderAnswer(answer, [], base, true); searchButton(answer, question);
        status.textContent = 'Pro tuto otázku jsem nenašel dostatečné podklady.';
        return;
      }
      if (!ready || !model) {
        if (!hasConsent()) {
          answer.textContent = 'Čekám na souhlas se stažením modelu…';
          status.textContent = 'Před první odpovědí je potřeba stáhnout model (cca 1 GB).';
          const accepted = await askConsent();
          if (current !== generation) return;
          if (!accepted) {
            answer.textContent = 'Model se nestáhl, proto AI neodpověděla. Můžeš téma vyhledat ve wiki.';
            searchButton(answer, question);
            status.textContent = 'Stažení AI bylo zrušeno. Při další otázce se zeptám znovu.';
            return;
          }
          storeConsent();
        }
        stage = 'model';
        answer.textContent = 'Připravuji lokální AI…';
        await loadModel(current);
        if (current !== generation || !model) return;
        stage = 'answer';
      }
      const thinking = think.checked;
      status.textContent = thinking ? 'AI přemýšlí nad nalezenými pasážemi… Může to trvat i minutu.' : 'AI vybírá vysvětlení z nalezených pasáží…';
      let rendered = '';
      let reasoning: HTMLParagraphElement | undefined;
      const response = await model.generate(question, sources, previousQuestion, text => {
        if (current !== generation) return;
        const blocks = parseAnswer(text, sources, false);
        const signature = blocks.map(block => block.source.id).join(',');
        if (signature !== rendered) { rendered = signature; renderAnswer(answer, blocks, base, false); }
      }, { think: thinking, onThinking: text => {
        if (current !== generation || !text) return;
        if (!reasoning) {
          // Model-written prose is shown only as plain text and is never treated as a source.
          const details = document.createElement('details');
          details.className = 'tarot-reasoning';
          const summary = document.createElement('summary');
          summary.textContent = 'Jak AI přemýšlela (neověřená pracovní úvaha, není zdrojem)';
          reasoning = document.createElement('p');
          details.append(summary, reasoning);
          answer.before(details);
        }
        reasoning.textContent = text;
      } });
      if (current !== generation) return;
      const blocks = parseAnswer(response, sources, true);
      renderAnswer(answer, blocks, base, true);
      if (!blocks.length) searchButton(answer, question);
      status.textContent = blocks.length ? 'Odpověď je hotová. Citace otevřou konkrétní pasáže wiki.' : 'Nalezené podklady odpověď nepotvrdily.';
    } catch (error) {
      if (current !== generation) return;
      answer.textContent = stage === 'model' ? 'Lokální AI se nepodařilo připravit. Zkus otázku odeslat znovu nebo vyhledat téma ve wiki.'
        : 'Odpověď se nepodařilo dokončit. Zkus vyhledat téma ve wiki.';
      searchButton(answer, question);
      model?.dispose(); model = undefined; ready = false;
      status.textContent = error instanceof Error && error.message === 'no-adapter'
        ? 'WebGPU je dostupné, ale prohlížeč nemá přístup k podporované grafické kartě. Použij vyhledávání wiki.' : failureMessage(error);
    } finally {
      if (current === generation) { busy = false; previousQuestion = question; updateControls(); }
    }
  });
  const leavePage = () => { disable(); status.textContent = supportReason() || 'AI je vypnutá. Načte se znovu s další otázkou.'; };
  window.addEventListener('pagehide', leavePage);
  document.addEventListener('astro:before-swap', leavePage, { once: true });
}
