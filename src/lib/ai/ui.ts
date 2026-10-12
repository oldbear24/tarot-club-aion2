import { MAX_QUESTION_LENGTH, retrievalQuery, retrievePassages, validateIndex } from './retrieval.ts';
import { parseAnswer } from './protocol.ts';
import { renderAnswer } from './render.ts';
import type { WikiIndex } from './types.ts';
import type { LocalModel } from './runtime.ts';

type GPUAccess = { requestAdapter(): Promise<unknown | null> };

function supportReason(): string | undefined {
  if (!window.isSecureContext) return 'Lokální AI potřebuje zabezpečené připojení HTTPS. Můžeš použít vyhledávání wiki.';
  if (!(navigator as unknown as { gpu?: GPUAccess }).gpu) return 'Tento prohlížeč nemá dostupné WebGPU. Zkus aktuální Chrome nebo Edge s podporovanou grafickou kartou, případně vyhledávání wiki.';
  if (!('Worker' in window)) return 'Prohlížeč nepodporuje výpočetní vlákna potřebná pro AI. Použij vyhledávání wiki.';
}

function failureMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : '';
  if (/memory|allocation|out of|buffer|device.*lost/i.test(message)) return 'Grafická karta nemá dostatek dostupné paměti nebo přestala odpovídat. Zavři náročné aplikace a zkus AI zapnout znovu, případně použij vyhledávání.';
  if (/fetch|network|offline|download/i.test(message)) return 'Nepodařilo se stáhnout potřebné soubory. Zkontroluj připojení a zkus AI zapnout znovu. Vyhledávání wiki zůstává dostupné.';
  return 'Lokální AI se nepodařilo připravit nebo výpočet selhal. Zkus ji znovu zapnout, případně použij vyhledávání wiki.';
}

export function initTarotChat(): void {
  const root = document.querySelector<HTMLElement>('[data-tarot-chat]');
  if (!root || root.dataset.initialized) return;
  root.dataset.initialized = 'true';
  const get = <T extends HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
  const input = get<HTMLTextAreaElement>('[data-ai-input]');
  const status = get<HTMLElement>('[data-ai-status]');
  const messages = get<HTMLElement>('[data-ai-messages]');
  const activate = get<HTMLButtonElement>('[data-ai-activate]');
  const deactivate = get<HTMLButtonElement>('[data-ai-deactivate]');
  const send = get<HTMLButtonElement>('[data-ai-send]');
  const reset = get<HTMLButtonElement>('[data-ai-reset]');
  const progress = get<HTMLProgressElement>('[data-ai-progress]');
  const base = import.meta.env.BASE_URL;
  let model: LocalModel | undefined;
  let ready = false, busy = false, loading = false;
  let generation = 0;
  let index: WikiIndex | undefined;
  let previousQuestion = '';
  let fetchController: AbortController | undefined;

  const updateControls = () => {
    send.disabled = !ready || busy || !input.value.trim();
    activate.disabled = loading || ready || !!supportReason();
    reset.disabled = busy;
    deactivate.hidden = !ready && !loading;
    deactivate.textContent = loading ? 'Zrušit načítání' : 'Vypnout AI';
    progress.hidden = !loading;
    messages.setAttribute('aria-busy', String(busy));
  };
  const disable = () => {
    generation++;
    model?.dispose(); model = undefined;
    fetchController?.abort();
    ready = false; busy = false; loading = false;
    updateControls();
  };
  const unsupported = supportReason();
  if (unsupported) status.textContent = unsupported;
  updateControls();

  activate.addEventListener('click', async () => {
    if (loading || ready || supportReason()) return;
    const current = ++generation;
    loading = true; progress.value = 0;
    status.textContent = 'Ověřuji podporu grafické karty…';
    updateControls();
    try {
      const gpu = (navigator as unknown as { gpu: GPUAccess }).gpu;
      if (!await gpu.requestAdapter()) throw new Error('no-adapter');
      if (current !== generation) return;
      const { LocalModel } = await import('./runtime.ts');
      if (current !== generation) return;
      model = new LocalModel(value => {
        if (current !== generation) return;
        progress.value = value;
        status.textContent = `Načítání modelu: ${Math.round(value * 100)} % (stažení a příprava).`;
      });
      await model.initialize();
      if (current !== generation) return;
      ready = true;
      status.textContent = 'AI je připravená. Odpovědi vznikají na tvém zařízení.';
    } catch (error) {
      if (current !== generation) return;
      model?.dispose(); model = undefined;
      ready = false;
      status.textContent = error instanceof Error && error.message === 'no-adapter'
        ? 'WebGPU je dostupné, ale prohlížeč nemá přístup k podporované grafické kartě. Použij vyhledávání wiki.' : failureMessage(error);
    } finally {
      if (current === generation) { loading = false; updateControls(); }
    }
  });
  deactivate.addEventListener('click', () => {
    const wasBusy = busy;
    disable();
    if (wasBusy) {
      const note = document.createElement('p');
      note.textContent = 'Výpočet byl ukončen vypnutím AI. Případná odpověď výše je neúplná.';
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
    status.textContent = ready ? 'Nový chat. AI je připravená.' : supportReason() || 'Nový chat. AI zapneš tlačítkem výše.';
    updateControls(); input.focus();
  });

  get<HTMLFormElement>('[data-ai-form]').addEventListener('submit', async event => {
    event.preventDefault();
    const question = input.value.trim();
    if (!ready || !model || busy || !question) return;
    if (question.length > MAX_QUESTION_LENGTH) { status.textContent = 'Zkrať prosím otázku na nejvýše 800 znaků.'; return; }
    const current = generation;
    busy = true;
    status.textContent = 'Hledám relevantní pasáže ve wiki…';
    const userMessage = document.createElement('div');
    userMessage.className = 'tarot-message tarot-message--question';
    userMessage.textContent = `Ty: ${question}`;
    const answer = document.createElement('div'); answer.className = 'tarot-message';
    answer.setAttribute('aria-label', 'Odpověď Tarot AI');
    answer.textContent = 'Hledám podklady…';
    messages.append(userMessage, answer);
    updateControls();
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
      if (!sources.length) {
        renderAnswer(answer, [], base, true); searchButton(answer, question);
        status.textContent = 'Pro tuto otázku jsem nenašel dostatečné podklady.';
        return;
      }
      status.textContent = 'AI vybírá vysvětlení z nalezených pasáží…';
      let rendered = '';
      const response = await model.generate(question, sources, previousQuestion, text => {
        if (current !== generation) return;
        const blocks = parseAnswer(text, sources, false);
        const signature = blocks.map(block => block.source.id).join(',');
        if (signature !== rendered) { rendered = signature; renderAnswer(answer, blocks, base, false); }
      });
      if (current !== generation) return;
      const blocks = parseAnswer(response, sources, true);
      renderAnswer(answer, blocks, base, true);
      if (!blocks.length) searchButton(answer, question);
      status.textContent = blocks.length ? 'Odpověď je hotová. Citace otevřou konkrétní pasáže wiki.' : 'Nalezené podklady odpověď nepotvrdily.';
    } catch (error) {
      if (current !== generation) return;
      answer.textContent = 'Odpověď se nepodařilo dokončit. Zkus vyhledat téma ve wiki.';
      searchButton(answer, question);
      model?.dispose(); model = undefined; ready = false;
      status.textContent = failureMessage(error);
    } finally {
      if (current === generation) { busy = false; previousQuestion = question; updateControls(); }
    }
  });
  const leavePage = () => { disable(); status.textContent = supportReason() || 'AI je vypnutá. Pro další použití ji znovu zapni.'; };
  window.addEventListener('pagehide', leavePage);
  document.addEventListener('astro:before-swap', leavePage, { once: true });
}
