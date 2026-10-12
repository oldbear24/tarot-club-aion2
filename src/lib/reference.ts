// Indexes the authored Markdown tables. Facts stay in one place: the articles.
export interface ReferenceEntry {
  name: string;
  summary: string;
  page: string;
  category: string;
  href: string;
  kind: 'article' | 'term';
  search: string;
}

export const categoryLabels: Record<string, string> = {
  slovnik: 'Slovník', ekonomika: 'Měny a obchody', materialy: 'Materiály', staty: 'Staty',
  vybava: 'Výbava', boj: 'Boj a efekty', aktivity: 'Aktivity', crafting: 'Crafting a sběr',
  kolekce: 'Kolekce', ucet: 'Inventář a účet', tridy: 'Třídy', dungeony: 'Dungeony',
};

export function normalize(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('cs-CZ').trim();
}

export function plainText(value: string): string {
  return value.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/<[^>]*>/g, '')
    .replace(/[*_`]/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

interface ReferenceDoc {
  id: string;
  body?: string;
  data: { title: string; description?: string; aliases?: string[]; lookupAliases?: { term: string; aliases: string[] }[]; referenceCategory?: string; referenceHub?: boolean };
}

export function buildReferenceIndex(docs: ReferenceDoc[], base: string): ReferenceEntry[] {
  const prefix = '/' + base.split('/').filter(Boolean).join('/');
  const entries: ReferenceEntry[] = [];
  for (const doc of docs) {
    if (!doc.data.referenceCategory || doc.data.referenceHub) continue;
    const href = `${prefix}/${doc.id.replace(/\/$/, '')}/`.replace(/^\/\//, '/');
    const page = doc.data.title;
    const category = doc.data.referenceCategory;
    entries.push({ name: page, summary: doc.data.description || '', page, category, href, kind: 'article',
      search: normalize([page, doc.data.description, ...(doc.data.aliases || [])].join(' ')) });
    // Only explicit reference rows are indexed. Ordinary tables and fenced examples are ignored.
    const body = (doc.body || '').replace(/```[\s\S]*?```/g, '');
    for (const line of body.split('\n')) {
      const row = line.match(/^\|\s*<span id="(ref-[a-z0-9-]+)">\*\*(.*?)\*\*<\/span>\s*\|(.*)\|\s*$/);
      if (!row) continue;
      const name = plainText(row[2]);
      const summary = row[3].split('|').map(plainText).filter(Boolean).join(' · ');
      const aliases = doc.data.lookupAliases?.find(item => normalize(item.term) === normalize(name))?.aliases || [];
      entries.push({ name, summary, page, category, href: href + '#' + row[1], kind: 'term',
        search: normalize([name, summary, page, ...aliases].join(' ')) });
    }
  }
  return entries.sort((a, b) => a.name.localeCompare(b.name, 'cs'));
}
