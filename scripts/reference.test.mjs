import test from 'node:test';
import assert from 'node:assert/strict';
import { buildReferenceIndex, filterEntries, highlightSegments, plainText, readFilters, referenceSearch, resultStatus, writeFilters } from '../src/lib/reference.ts';

const data = { title: 'Měny', description: 'Použití měn', referenceCategory: 'ekonomika',
  lookupAliases: [{ term: 'Kina', aliases: ['Kinah'] }, { term: 'Kina', aliases: ['herní peníze'] }] };
const body = '## Obchod\n\n| Měna | Zdroj | Význam |\n| --- | --- | --- |\n| <span id="ref-kina">**Kina**</span> | [Market](../market/) | Použití &amp; cena |\n';
const docs = [{ id: 'reference/meny', data, body }];

test('deep links under root and Pages preserve all aliases and anchor queries', () => {
  const entries = buildReferenceIndex(docs, '/tarot-club-aion2/');
  assert.equal(entries.length, 2);
  const term = entries.find(entry => entry.kind === 'term');
  const { search, ...wireEntry } = term;
  assert.equal(referenceSearch(wireEntry), search);
  assert.equal(term.href, '/tarot-club-aion2/reference/meny/#ref-kina');
  assert.equal(term.summary, 'Zdroj: Market · Význam: Použití & cena');
  for (const q of ['KINAH', 'herni penize', '#ref-kina', 'REF KINA']) assert.equal(filterEntries(entries, { q, category: '', kind: '' }).length, 1);
  assert.equal(buildReferenceIndex(docs, '/').find(entry => entry.kind === 'term').href, '/reference/meny/#ref-kina');
});

test('fenced examples, ordinary tables, hub and noindex pages do not become terms', () => {
  const body = '~~~md\n| <span id="ref-example">**Example**</span> | Data |\n~~~\n```md\n| <span id="ref-other">**Other**</span> | Data |\n```\n| Normal row | Value |';
  const entries = buildReferenceIndex([
    { id: 'reference/test', data: { title: 'Test', referenceCategory: 'slovnik' }, body },
    { id: 'reference/prehled', data: { title: 'Hub', referenceCategory: 'slovnik', referenceHub: true }, body },
    { id: 'reference/legacy', data: { title: 'Legacy', referenceCategory: 'slovnik', pagefind: false }, body },
    { id: 'pruvodce/test', data: { title: 'Guide' }, body },
  ], '/');
  assert.deepEqual(entries.map(entry => entry.name), ['Test']);
});

test('recipe quantities include an authored heading and column label', () => {
  const body = '## Recept: True Dragon Lord\n\n| Surovina | Počet pro recept |\n| --- | --- |\n| <span id="ref-sword">**Sword**</span> | 1 |';
  const entries = buildReferenceIndex([{ id: 'predmety/crafting', data, body }], '/');
  assert.equal(entries[1].summary, 'Počet pro recept: 1 · Sekce: Recept: True Dragon Lord');
  const fallback = buildReferenceIndex([{ id: 'other', data, body: '| <span id="ref-x">**X**</span> | 1 |' }], '/').find(entry => entry.kind === 'term');
  assert.equal(fallback.summary, 'Údaj v tabulce: 1');
});

test('linked cells, escaped pipes and entities keep their own columns', () => {
  const body = '| Term | Popis | Další kontext |\n| --- | --- | --- |\n| <span id="ref-x">**X**</span> | [A](../a/) &quot;B&quot; &#269; &#x10D; &nbsp; | A \\| B |';
  const term = buildReferenceIndex([{ id: 'x', data, body }], '/').find(entry => entry.kind === 'term');
  assert.equal(term.summary, 'Popis: A "B" č č · Další kontext: A | B');
  assert.equal(plainText('&#99999999; &amp;'), '&#99999999; &');
});

test('identical names from different articles keep distinct links and combine filters', () => {
  const entries = buildReferenceIndex([...docs, { id: 'ekonomika/other', data: { ...data, referenceCategory: 'ucet' }, body }], '/');
  assert.equal(new Set(entries.map(entry => entry.href)).size, 4);
  assert.equal(filterEntries(entries, { q: 'kina cena', category: 'ucet', kind: 'term' }).length, 1);
  assert.equal(filterEntries(entries, { q: 'kina cena', category: 'ucet', kind: 'article' }).length, 0);
});

test('URL filters round trip while preserving other parameters, prefix and fragment', () => {
  const url = new URL('https://aion2.tarot-club.cz/project/reference/prehled/?keep=1#jak-hledat');
  const state = { q: 'kritický zásah', category: 'staty', kind: 'term' };
  const shared = writeFilters(url, state);
  assert.deepEqual(readFilters(shared.searchParams, ['staty']), state);
  assert.equal(shared.hash, url.hash); assert.equal(shared.pathname, url.pathname);
  assert.equal(writeFilters(shared, { q: '', category: '', kind: '' }).search, '?keep=1');
  assert.deepEqual(readFilters(new URLSearchParams('category=unknown&kind=html&q=x'), ['staty']), { q: 'x', category: '', kind: '' });
});

test('Czech counts and safe highlighting handle diacritics, overlapping words and HTML text', () => {
  assert.equal(resultStatus(0, 0), 'Nenalezen žádný výsledek.');
  assert.equal(resultStatus(1, 1), 'Zobrazen 1 výsledek z 1.');
  assert.equal(resultStatus(2, 9), 'Zobrazeny 2 výsledky z 9.');
  assert.equal(resultStatus(4, 9), 'Zobrazeny 4 výsledky z 9.');
  assert.equal(resultStatus(60, 521), 'Zobrazeno 60 výsledků z 521.');
  const text = 'Kritický zásah <img onerror="x">';
  const segments = highlightSegments(text, 'KRITICKY krit zasah img');
  assert.equal(segments.map(segment => segment.text).join(''), text);
  assert.deepEqual(segments.filter(segment => segment.match).map(segment => segment.text), ['Kritický', 'zásah', 'img']);
});
