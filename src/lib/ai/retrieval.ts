import { normalize } from '../reference.ts';
import { safeExternalUrl, safeWikiUrl } from './urls.ts';
import type { Passage, WikiIndex } from './types.ts';

export const MAX_QUESTION_LENGTH = 800;
export const CONTEXT_CHAR_LIMIT = 3500;
const stopWords = new Set(('jak jaka jake jaky co k ke na se si v ve z ze pro a i o do to je jsou ma mam mi me muj moje kde kdy kolik cim cem cemu ktery ktere prosim rychle efektivne zvysit zvysim zvyseni znamena delaji dela slouzi funguje fungujou fungovat ziskat ziskam ziskavat vybrat vyberu dostat dostanu dostanes udelat delat muzu muzes muze potrebuji potrebuju chci mit nejaky nejaka nejake jaky jakou jakym nebo ale tak uz jeste ted lepsi nejlepsi ' +
  // Conversational filler: rare enough in the wiki to outweigh the real subject of a question.
  'by bys bych jsi jsem jste jsme kvuli tomu toho tom tim tohle tomhle doporucil doporucila doporucis doporucujes doporucit poradil poradis poradit chodit chodim chodis hrat hraju hrajes mel mela meli mas bude budu budes nejlip nejvic vic hodne taky take pak potom nejak dobre dobry ' +
  'zvednu zvednout zvedat zvedam zlepsit zlepsim zlepsovat ' +
  // Pronouns point back at the previous question; on their own they match random passages.
  'ho mu ji jej jeho jeji jejich jim jimi nej nem nemu ni nich nim nimi on ona ono oni ten ta ty tento tato toto tyto tenhle tahle tohle tam tady sem ' +
  'what how does do is the can are aion 2').split(' '));
const aliases: Record<string, string[]> = {
  gs: ['gear score', 'item level', 'vybava'], cp: ['combat power', 'bojova sila'],
  runy: ['rune', 'runes', 'run'], rune: ['runy', 'runes'], runes: ['runy', 'rune'],
  denni: ['daily', 'den'], daily: ['denni'], tydenni: ['weekly'], weekly: ['tydenni'],
  abyss: ['propast'], enhancement: ['vylepsovani', 'posilovani'],
  precision: ['presnost'], presnost: ['precision', 'accuracy'],
  povolani: ['trida', 'class'], trida: ['class'], questy: ['quest', 'ukoly'], ukoly: ['quest', 'questy'],
  vybava: ['gear', 'equipment'], vybavu: ['vybava', 'gear'],
};
const words = (value: string) => normalize(value).match(/[\p{L}\p{N}]+/gu) || [];
function stem(word: string): string {
  const short = word.replace(/(?:ami|emi|ove|ova|ovi|ich|ych|ymi|imi|em|um|ou|u|a|e|y|i)$/, '');
  return short.length >= 4 ? short : word;
}
const matches = (a: string, b: string) => a === b || stem(a) === stem(b);

export function queryTerms(query: string): string[] {
  return [...new Set(words(query).filter(word => !stopWords.has(word)))];
}

// "A jaké…", "kvůli tomu", "jak ho…": the question continues the previous one.
const followUp = /^(?:a|i|a co|a jak|taky|jeste)\b|\b(?:tomu|toho|tom|tim|tohle|tomhle|tohoto|tomto|ho|mu|ji|jej|jeho|jeji|jejich|jim|nej|nem|nemu|nich|nim|tam)\b/;

export function retrievalQuery(question: string, previousQuestion = ''): string {
  // Resolve follow-ups only; an unrelated new question must not inherit old evidence.
  if (!previousQuestion || (queryTerms(question).length && !followUp.test(normalize(question)))) return question;
  return `${previousQuestion.slice(0, 400)} ${question}`;
}

// A follow-up that finds nothing together with the previous question may still stand on its own.
export function retrieveForQuestion(index: WikiIndex, question: string, previousQuestion = ''): Passage[] {
  const query = retrievalQuery(question, previousQuestion);
  const found = retrievePassages(index, query);
  return found.length || query === question ? found : retrievePassages(index, question);
}

export function retrievePassages(index: WikiIndex, question: string): Passage[] {
  const terms = queryTerms(question);
  if (!terms.length || question.length > MAX_QUESTION_LENGTH + 401) return [];
  const definition = /^(?:co|k cemu)\b/.test(normalize(question));
  const howTo = /^jak\b/.test(normalize(question));
  const rows = index.passages.map(passage => {
    const body = words(passage.excerpt);
    const heading = words(passage.heading || '');
    const title = words(passage.title);
    const metadata = words(passage.aliases.join(' '));
    const hits = terms.map(term => {
      const alternatives = [term, ...(aliases[term] || []).flatMap(words)];
      const has = (haystack: string[]) => alternatives.some(alt => haystack.some(word => matches(alt, word)));
      const exact = body.filter(word => word === term || (aliases[term] || []).includes(word)).length;
      return { exact, body: has(body), heading: has(heading), title: has(title), metadata: has(metadata) };
    });
    return { passage, hits };
  });
  // Rare wiki terms carry the question; filler words missing from the whole wiki must not veto every passage.
  const weights = terms.map((_, i) => {
    const frequency = rows.filter(row => row.hits[i].body || row.hits[i].heading).length;
    return frequency ? 1 + Math.log(rows.length / frequency) : 1;
  });
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const ranked = rows.map(({ passage, hits }) => {
    let covered = 0, score = 0;
    hits.forEach((hit, i) => {
      // A whole article's aliases cannot turn every unrelated row into evidence.
      if (hit.body || hit.heading) covered += weights[i];
      score += Math.min(hit.exact, 3) * 5 + (hit.body ? 3 : 0) + (hit.heading ? 5 : 0) + (hit.title ? 6 : 0) + (hit.metadata ? 1 : 0);
    });
    const prose = !passage.excerpt.includes(' · ');
    if (prose) score += 2;
    if (definition && prose && /\b(je|jsou|tedy|navysuje|znamena|slouzi)\b/.test(normalize(passage.excerpt))) score += 5;
    if (definition && prose && /\b(patri|souhrnny|posiluje|navysuje|slouzi)\b/.test(normalize(passage.excerpt))) score += 8;
    if (/^(podklady|pruvodce vychazi|datum reserse)/.test(normalize(passage.excerpt))) score -= 10;
    if (howTo && prose && /nejdriv|kontrola|zkontroluj|dopln|zapln/.test(normalize(passage.excerpt))) score += 8;
    return { passage, score, covered };
  }).filter(item => item.covered / totalWeight >= 0.6 && item.score >= 5)
    .sort((a, b) => b.score - a.score || a.passage.id.localeCompare(b.passage.id));
  const selected: Passage[] = [];
  const perPage = new Map<string, number>();
  let size = 0;
  for (const { passage } of ranked) {
    const page = passage.url.split('#')[0];
    if ((perPage.get(page) || 0) >= 3 || size + passage.excerpt.length > CONTEXT_CHAR_LIMIT) continue;
    selected.push(passage);
    size += passage.excerpt.length;
    perPage.set(page, (perPage.get(page) || 0) + 1);
    if (selected.length >= 6) break;
  }
  return selected;
}

export function validateIndex(value: unknown, site: string, base: string): WikiIndex {
  if (!value || typeof value !== 'object' || !('version' in value) || value.version !== 1 ||
      !('passages' in value) || !Array.isArray(value.passages)) throw new Error('Neplatný index wiki.');
  const ids = new Set<string>();
  const passages: Passage[] = [];
  for (const raw of value.passages) {
    if (!raw || typeof raw !== 'object' || typeof raw.id !== 'string' || !/^[a-z0-9/-]+:\d+$/.test(raw.id) || ids.has(raw.id) ||
        typeof raw.title !== 'string' || typeof raw.excerpt !== 'string' || !raw.excerpt.trim() || raw.excerpt.length > 1500 ||
        typeof raw.url !== 'string' || !safeWikiUrl(raw.url, site, base) || raw.sourceType !== 'wiki' || raw.scope !== 'global-launch' ||
        !['official', 'community', 'editorial', 'mixed'].includes(raw.evidence) || typeof raw.reviewedAt !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(raw.reviewedAt) || !Array.isArray(raw.aliases) || !raw.aliases.every((x: unknown) => typeof x === 'string') ||
        !Array.isArray(raw.sources)) throw new Error('Neplatné podklady wiki.');
    const sources = raw.sources.filter((s: unknown): s is Passage['sources'][number] => !!s && typeof s === 'object' &&
      'title' in s && typeof s.title === 'string' && 'url' in s && typeof s.url === 'string' && !!safeExternalUrl(s.url) &&
      'scope' in s && ['global', 'asian', 'technical', 'unspecified'].includes(String(s.scope)));
    ids.add(raw.id);
    passages.push({ ...raw, url: safeWikiUrl(raw.url, site, base)!, sources,
      heading: typeof raw.heading === 'string' ? raw.heading : undefined,
      anchor: typeof raw.anchor === 'string' ? raw.anchor : undefined });
  }
  return { version: 1, passages };
}
