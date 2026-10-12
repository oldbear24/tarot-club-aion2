// The articles own facts. This index adds context, aliases and links, never game rules.
export interface ReferenceEntry {
  name: string;
  summary: string;
  page: string;
  category: string;
  href: string;
  kind: 'article' | 'term';
  search: string;
  aliases?: string[];
}

export const categoryLabels: Record<string, string> = {
  slovnik: 'Slovník', ekonomika: 'Měny a obchody', materialy: 'Materiály', staty: 'Staty',
  vybava: 'Výbava', boj: 'Boj a efekty', aktivity: 'Aktivity', crafting: 'Crafting a sběr',
  kolekce: 'Kolekce', ucet: 'Inventář a účet', tridy: 'Třídy', dungeony: 'Dungeony',
  rozvoj: 'Začínáme a rozvoj', wiki: 'O wiki',
};

export function normalize(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('cs-CZ').trim();
}

export function plainText(value: string): string {
  const entities: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
  return value.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/<[^>]*>/g, '')
    .replace(/[*_`]/g, '').replace(/\\\|/g, '|')
    .replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (match, entity: string) => {
      if (!entity.startsWith('#')) return entities[entity.toLowerCase()] || match;
      const code = entity.toLowerCase().startsWith('#x') ? parseInt(entity.slice(2), 16) : Number(entity.slice(1));
      return code > 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff) ? String.fromCodePoint(code) : match;
    }).replace(/\s+/g, ' ').trim();
}

// Markdown escaped pipes are content, not column delimiters.
export function tableCells(line: string): string[] {
  const cells: string[] = [];
  let cell = '', escaped = false;
  for (const char of line.trim().slice(1, -1)) {
    if (char === '|' && !escaped) { cells.push(cell.trim()); cell = ''; }
    else cell += char;
    escaped = char === '\\' && !escaped;
  }
  cells.push(cell.trim());
  return cells;
}

interface ReferenceDoc {
  id: string;
  body?: string;
  data: { title: string; description?: string; aliases?: string[]; lookupAliases?: { term: string; aliases: string[] }[]; referenceCategory?: string; referenceHub?: boolean; pagefind?: boolean };
}

export function buildReferenceIndex(docs: ReferenceDoc[], base: string): ReferenceEntry[] {
  const prefix = '/' + base.split('/').filter(Boolean).join('/');
  const entries: ReferenceEntry[] = [];
  for (const doc of docs) {
    if (!doc.data.referenceCategory || doc.data.referenceHub || doc.data.pagefind === false) continue;
    const href = `${prefix}/${doc.id.replace(/\/$/, '')}/`.replace(/^\/\//, '/');
    const page = doc.data.title, category = doc.data.referenceCategory;
    entries.push({ name: page, summary: doc.data.description || '', page, category, href, kind: 'article',
      aliases: doc.data.aliases || [],
      search: normalize([page, doc.data.description, categoryLabels[category], ...(doc.data.aliases || [])].join(' ')) });
    let heading = '', headers: string[] = [], previous: string[] = [], fence = '';
    for (const line of (doc.body || '').split('\n')) {
      const fenced = line.match(/^\s{0,3}(`{3,}|~{3,})/);
      if (fenced) {
        if (!fence) fence = fenced[1];
        else if (fenced[1][0] === fence[0] && fenced[1].length >= fence.length) fence = '';
        continue;
      }
      if (fence) continue;
      const section = line.match(/^#{2,6}\s+(.+)$/);
      if (section) heading = plainText(section[1]);
      if (!/^\|.*\|\s*$/.test(line)) { headers = []; previous = []; continue; }
      const cells = tableCells(line);
      if (cells.every(cell => /^:?-{3,}:?$/.test(cell))) { headers = previous; continue; }
      previous = cells.map(plainText);
      const term = cells[0].match(/^<span id="(ref-[a-z0-9-]+)">\*\*(.*?)\*\*<\/span>$/);
      if (!term) continue;
      const name = plainText(term[2]);
      const values = cells.slice(1).map((cell, i) => {
        const value = plainText(cell);
        const label = headers[i + 1];
        return value ? `${label || 'Údaj v tabulce'}: ${value}` : '';
      }).filter(Boolean);
      // A recipe quantity is useful only with its authored section, never as a bare "1".
      if (heading && (cells.slice(1).some(cell => /^\d+(?:[.,]\d+)?$/.test(plainText(cell))) || !headers.length)) {
        values.push(`Sekce: ${heading}`);
      }
      const summary = values.join(' · ') || `Podrobnosti v článku ${page}${heading ? `, sekce ${heading}` : ''}.`;
      const aliases = (doc.data.lookupAliases || []).filter(item => normalize(item.term) === normalize(name)).flatMap(item => item.aliases);
      entries.push({ name, summary, page, category, href: href + '#' + term[1], kind: 'term',
        aliases,
        search: normalize([name, summary, page, categoryLabels[category], '#' + term[1], term[1].replaceAll('-', ' '), ...aliases].join(' ')) });
    }
  }
  return entries.sort((a, b) => a.name.localeCompare(b.name, 'cs'));
}

export interface ReferenceFilters { q: string; category: string; kind: string }
export function referenceSearch(entry: Omit<ReferenceEntry, 'search'>): string {
  const anchor = entry.href.split('#')[1] || '';
  return normalize([entry.name, entry.summary, entry.page, categoryLabels[entry.category], '#' + anchor, anchor.replaceAll('-', ' '), ...(entry.aliases || [])].join(' '));
}
export function readFilters(params: URLSearchParams, categories: string[]): ReferenceFilters {
  const category = params.get('category') || '', kind = params.get('kind') || '';
  return { q: params.get('q') || '', category: categories.includes(category) ? category : '', kind: ['article', 'term'].includes(kind) ? kind : '' };
}
export function writeFilters(url: URL, filters: ReferenceFilters): URL {
  const next = new URL(url);
  for (const key of ['q', 'category', 'kind'] as const) {
    if (filters[key]) next.searchParams.set(key, filters[key]);
    else next.searchParams.delete(key);
  }
  return next;
}
export function filterEntries(entries: ReferenceEntry[], filters: ReferenceFilters): ReferenceEntry[] {
  const words = normalize(filters.q).split(/\s+/).filter(Boolean);
  return entries.filter(entry => (!filters.category || entry.category === filters.category)
    && (!filters.kind || entry.kind === filters.kind) && words.every(word => entry.search.includes(word)));
}
export function resultStatus(shown: number, total: number): string {
  if (!total) return 'Nenalezen žádný výsledek.';
  if (shown === 1) return `Zobrazen 1 výsledek z ${total}.`;
  if (shown >= 2 && shown <= 4) return `Zobrazeny ${shown} výsledky z ${total}.`;
  return `Zobrazeno ${shown} výsledků z ${total}.`;
}

// Return text segments; callers render them with textContent and <mark>, never innerHTML.
export function highlightSegments(value: string, query: string): { text: string; match: boolean }[] {
  let folded = '', offset = 0;
  const offsets: { start: number; end: number }[] = [];
  for (const char of value) {
    const normalized = normalize(char);
    folded += normalized || (char.trim() ? '' : ' ');
    for (let i = 0; i < (normalized || (char.trim() ? '' : ' ')).length; i++) offsets.push({ start: offset, end: offset + char.length });
    offset += char.length;
  }
  const ranges: [number, number][] = [];
  for (const word of normalize(query).split(/\s+/).filter(Boolean)) {
    let start = folded.indexOf(word);
    while (start !== -1) {
      ranges.push([offsets[start].start, offsets[start + word.length - 1].end]);
      start = folded.indexOf(word, start + word.length);
    }
  }
  ranges.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const range of ranges) {
    const last = merged[merged.length - 1];
    if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1]);
    else merged.push([...range]);
  }
  const segments: { text: string; match: boolean }[] = [];
  let end = 0;
  for (const range of merged) {
    if (range[0] > end) segments.push({ text: value.slice(end, range[0]), match: false });
    segments.push({ text: value.slice(...range), match: true }); end = range[1];
  }
  if (end < value.length) segments.push({ text: value.slice(end), match: false });
  return segments;
}
