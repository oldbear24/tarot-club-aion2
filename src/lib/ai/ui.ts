import { MAX_QUESTION_LENGTH, retrieveForQuestion, validateIndex } from './retrieval.ts';
import { NO_EVIDENCE, parseAnswer } from './protocol.ts';
import { renderAnswer } from './render.ts';
import type { WikiIndex } from './types.ts';
import type { LocalModel } from './runtime.ts';
import { DOWNLOAD_SIZE, modelFor } from './config.ts';

// Bump when the download changes substantially, so people are asked again.
const CONSENT_KEY = 'tarot-ai-download-consent';
const CONSENT_VALUE = 'gemma-4-e2b';

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
  const consent = get<HTMLDialogElement>('[data-ai-consent]');
  const base = import.meta.env.BASE_URL;
  let model: LocalModel | undefined;
  // `busy` covers the whole question, including the model download: only one question runs at a time.
  let ready = false, busy = false;
  let generation = 0;
  let index: WikiIndex | undefined;
  let previousQuestion = '';
  let fetchController: AbortController | undefined;
  // Progress line inside the answer bubble that is currently being worked on.
  let pending: { text: HTMLElement; bar: HTMLProgressElement } | undefined;

  const updateControls = () => {
    send.disabled = busy || !input.value.trim() || !!supportReason();
    reset.disabled = busy;
    deactivate.hidden = !ready && !busy;
    deactivate.textContent = busy ? 'Zastavit' : 'Vypnout AI';
    messages.setAttribute('aria-busy', String(busy));
  };
  // Keep the newest message in view unless the reader has scrolled up.
  const follow = (force = false) => {
    if (force || messages.scrollHeight - messages.scrollTop - messages.clientHeight < 80) messages.scrollTop = messages.scrollHeight;
  };
  const setPending = (text: string, progress?: number) => {
    if (!pending) return;
    pending.text.textContent = text;
    pending.bar.hidden = progress === undefined;
    if (progress !== undefined) pending.bar.value = progress;
  };
  const endPending = () => { pending?.text.parentElement?.remove(); pending = undefined; };
  const disable = () => {
    generation++;
    if (pending) {
      pending.text.textContent = 'Dotaz byl zastaven, odpověď je neúplná.';
      pending.bar.hidden = true;
      pending = undefined;
    }
    model?.dispose(); model = undefined;
    fetchController?.abort();
    if (consent.open) consent.close('cancel');
    ready = false; busy = false;
    updateControls();
  };
  status.textContent = supportReason() || '';
  updateControls();

  const askConsent = () => new Promise<boolean>(resolve => {
    consent.returnValue = '';
    consent.addEventListener('close', () => resolve(consent.returnValue === 'accept'), { once: true });
    consent.showModal();
  });

  // Throws on failure; the caller reports it in the answer.
  const loadModel = async (current: number) => {
    setPending('Ověřuji podporu grafické karty…');
    const gpu = (navigator as unknown as { gpu: GPUAccess }).gpu;
    const adapter = await gpu.requestAdapter();
    if (!adapter) throw new Error('no-adapter');
    if (current !== generation) return;
    const { LocalModel } = await import('./runtime.ts');
    if (current !== generation) return;
    setPending('Načítám model: 0 %', 0);
    model = new LocalModel(value => {
      if (current === generation) setPending(`Načítám model: ${Math.round(value * 100)} %`, value);
    }, modelFor(!!adapter.features?.has('shader-f16')));
    await model.initialize();
    if (current !== generation) return;
    ready = true;
  };

  deactivate.addEventListener('click', () => {
    disable();
    status.textContent = 'AI je vypnutá a paměť uvolněná. Model zůstává v cache a načte se s další otázkou.';
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
  const say = (target: HTMLElement, text: string, question: string) => {
    target.replaceChildren(Object.assign(document.createElement('p'), { textContent: text }));
    searchButton(target, question);
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
    status.textContent = supportReason() || '';
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
    status.textContent = '';
    const userMessage = document.createElement('div');
    userMessage.className = 'tarot-message tarot-message--question';
    userMessage.setAttribute('aria-label', 'Tvoje otázka');
    userMessage.textContent = question;
    const answer = document.createElement('div');
    answer.className = 'tarot-message tarot-message--answer';
    answer.setAttribute('aria-label', 'Odpověď Tarot AI');
    const body = document.createElement('div');
    const line = document.createElement('p');
    line.className = 'tarot-pending'; line.setAttribute('role', 'status');
    pending = { text: document.createElement('span'), bar: document.createElement('progress') };
    pending.bar.max = 1; pending.bar.setAttribute('aria-label', 'Průběh načítání modelu');
    line.append(pending.text, pending.bar);
    answer.append(body, line);
    messages.append(userMessage, answer);
    setPending('Hledám ve wiki…');
    follow(true);
    userMessage.scrollIntoView({ block: 'nearest' });
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
      const sources = retrieveForQuestion(index, question, previousQuestion);
      // Without evidence there is nothing for the model to work with, so nothing is downloaded.
      if (!sources.length) { say(body, NO_EVIDENCE, question); return; }
      if (!ready || !model) {
        if (!hasConsent()) {
          setPending(`Čekám na souhlas se stažením modelu (cca ${DOWNLOAD_SIZE})…`);
          const accepted = await askConsent();
          if (current !== generation) return;
          if (!accepted) { say(body, 'Model se nestáhl, proto AI neodpověděla. Při další otázce se zeptám znovu.', question); return; }
          storeConsent();
        }
        await loadModel(current);
        if (current !== generation || !model) return;
      }
      setPending('Píšu odpověď…');
      const response = await model.generate(question, sources, previousQuestion, text => {
        if (current === generation) { renderAnswer(body, parseAnswer(text, sources, false), base, false); follow(); }
      });
      if (current !== generation) return;
      const result = parseAnswer(response, sources, true);
      renderAnswer(body, result, base, true, sources);
      if (!result.parts.length) searchButton(body, question);
    } catch (error) {
      if (current !== generation) return;
      say(body, error instanceof Error && error.message === 'no-adapter'
        ? 'WebGPU je dostupné, ale prohlížeč nemá přístup k podporované grafické kartě. Použij vyhledávání wiki.' : failureMessage(error), question);
      model?.dispose(); model = undefined; ready = false;
    } finally {
      if (current === generation) { endPending(); follow(); busy = false; previousQuestion = question; updateControls(); }
    }
  });
  const leavePage = () => { disable(); status.textContent = supportReason() || ''; };
  window.addEventListener('pagehide', leavePage);
  document.addEventListener('astro:before-swap', leavePage, { once: true });
}
