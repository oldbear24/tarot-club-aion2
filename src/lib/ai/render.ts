import { NO_EVIDENCE } from './protocol.ts';
import { safeExternalUrl, safeWikiUrl } from './urls.ts';
import type { AnswerBlock } from './types.ts';

const scopeLabels = { global: 'Global', asian: 'KR/TW', technical: 'Technologie', unspecified: 'neurčeno' };
const evidenceLabels = { official: 'Oficiální podklady', community: 'Komunitní podklady; bez vlastního měření v Global',
  mixed: 'Oficiální i komunitní podklady; rozlišení v článku', editorial: 'Doporučení Tarot Clubu' };

function element<K extends keyof HTMLElementTagNameMap>(tag: K, text = ''): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.textContent = text;
  return node;
}

function wikiLink(url: string, label: string, base: string): HTMLAnchorElement | undefined {
  const href = safeWikiUrl(url, location.origin, base);
  if (!href) return;
  const link = element('a', label);
  link.href = href;
  return link;
}

// Plain text is deliberate: the model and articles cannot inject HTML or Markdown links.
export function renderAnswer(target: HTMLElement, blocks: AnswerBlock[], base: string, complete: boolean): void {
  const fragment = document.createDocumentFragment();
  if (!blocks.length) {
    fragment.append(element('p', complete ? NO_EVIDENCE : 'Procházím nalezené podklady…'));
    target.replaceChildren(fragment);
    return;
  }
  for (const { source, number } of blocks) {
    const paragraph = element('p', source.excerpt + ' ');
    const citation = wikiLink(source.url, `[${number}]`, base);
    if (!citation) continue;
    citation.className = 'tarot-citation';
    citation.setAttribute('aria-label', `Zdroj ${number}: ${source.title}${source.heading ? ' — ' + source.heading : ''}`);
    paragraph.append(citation);
    fragment.append(paragraph);
  }
  fragment.append(element('h3', 'Kde se dozvědět více'), element('h4', 'Na wiki · Zdroje z wiki'));
  const list = element('ul');
  const uniquePages = new Map<string, AnswerBlock>();
  for (const block of blocks) {
    const { source, number } = block;
    const item = element('li');
    item.append(element('strong', `[${number}] ${source.title}${source.heading ? ' → ' + source.heading : ''}`));
    const why = element('p', 'Tato pasáž je citovaná výše. ');
    const link = wikiLink(source.url, 'Otevřít článek', base);
    if (link) why.append(link);
    const note = element('p', `${evidenceLabels[source.evidence]} · Rešerše ${source.reviewedAt}.`);
    note.className = 'tarot-evidence-note';
    item.append(why, note);
    list.append(item);
    uniquePages.set(source.url.split('#')[0], block);
  }
  fragment.append(list);
  const external = element('ul');
  const seen = new Set<string>();
  for (const { source } of uniquePages.values()) {
    // No assertion-level mapping exists in frontmatter. Offer a small set as article background only.
    for (const original of source.sources.filter(item => item.scope !== 'technical').slice(0, 2)) {
      const href = safeExternalUrl(original.url);
      if (!href || seen.has(href) || seen.size >= 4) continue;
      seen.add(href);
      const item = element('li');
      item.append(element('strong', original.title));
      const info = element('p', `${scopeLabels[original.scope]} · Další podklad článku „${source.title}“. `);
      const link = element('a', 'Otevřít původní zdroj');
      link.href = href;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      info.append(link);
      item.append(info);
      external.append(item);
    }
  }
  fragment.append(element('h4', 'Původní podklady'));
  fragment.append(element('p', seen.size ? 'Podklady celých článků; přiřazení ke konkrétní větě nebylo ověřeno. Označení regionu nepotvrzuje platnost tvrzení pro Global.' : 'U použitých pasáží není dostupný samostatný externí podklad.'));
  if (seen.size) fragment.append(external);
  target.replaceChildren(fragment);
}
