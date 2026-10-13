import { NO_EVIDENCE } from './protocol.ts';
import { safeWikiUrl } from './urls.ts';
import type { Answer, Passage } from './types.ts';

const evidenceLabels = { official: 'Oficiální podklady', community: 'Komunitní podklady, bez vlastního měření v Global',
  mixed: 'Oficiální i komunitní podklady', editorial: 'Doporučení Tarot Clubu' };

function element<K extends keyof HTMLElementTagNameMap>(tag: K, text = ''): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.textContent = text;
  return node;
}

function wikiLink(source: Passage, label: string, base: string): HTMLAnchorElement | undefined {
  const href = safeWikiUrl(source.url, location.origin, base);
  if (!href) return;
  const link = element('a', label);
  link.href = href;
  link.title = `${evidenceLabels[source.evidence]} · rešerše ${source.reviewedAt}`;
  return link;
}

const sourceName = (source: Passage) => source.title + (source.heading ? ' → ' + source.heading : '');

function sourceList(label: string, sources: Passage[], base: string, numbered: boolean): HTMLElement {
  const wrapper = element('div');
  wrapper.className = 'tarot-sources';
  const list = element('ul');
  list.setAttribute('aria-label', label);
  sources.forEach((source, i) => {
    const link = wikiLink(source, (numbered ? `[${i + 1}] ` : '') + sourceName(source), base);
    if (!link) return;
    const item = element('li');
    item.append(link);
    list.append(item);
  });
  wrapper.append(element('span', label), list);
  return wrapper;
}

// Plain text is deliberate: the model and articles cannot inject HTML or Markdown links.
// `offered` are the retrieved passages, listed only when the model answered without citing any.
export function renderAnswer(target: HTMLElement, answer: Answer, base: string, complete: boolean, offered: Passage[] = []): void {
  if (!answer.parts.length) {
    target.replaceChildren(...(complete ? [element('p', NO_EVIDENCE)] : []));
    return;
  }
  const paragraph = element('p');
  for (const part of answer.parts) {
    if (typeof part === 'string') { paragraph.append(part); continue; }
    const source = answer.sources[part - 1];
    const citation = wikiLink(source, `[${part}]`, base);
    if (!citation) continue;
    citation.className = 'tarot-citation';
    citation.setAttribute('aria-label', `Zdroj ${part}: ${sourceName(source)}`);
    paragraph.append(citation);
  }
  const nodes: HTMLElement[] = [paragraph];
  if (answer.sources.length) nodes.push(sourceList('Zdroje', answer.sources, base, true));
  else if (complete && offered.length) nodes.push(sourceList('AI neuvedla zdroj. Ověř v článcích', offered, base, false));
  target.replaceChildren(...nodes);
}
