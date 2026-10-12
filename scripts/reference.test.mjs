import test from 'node:test';
import assert from 'node:assert/strict';
import { buildReferenceIndex } from '../src/lib/reference.ts';

test('reference deep links work under the GitHub Pages prefix and keep Czech aliases', () => {
  const docs = [{ id: 'reference/meny', data: { title: 'Měny', description: 'Použití měn', referenceCategory: 'ekonomika',
    lookupAliases: [{ term: 'Kina', aliases: ['Kinah', 'herní peníze'] }] },
    body: '| <span id="ref-kina">**Kina**</span> | [Market](../market/) | Použití &amp; cena |\n' }];
  const entries = buildReferenceIndex(docs, '/tarot-club-aion2/');
  assert.equal(entries.length, 2);
  const term = entries.find(entry => entry.kind === 'term');
  assert.equal(term.href, '/tarot-club-aion2/reference/meny/#ref-kina');
  assert.equal(term.summary, 'Market · Použití & cena');
  assert.ok(term.search.includes('kinah'));
  assert.ok(term.search.includes('herni penize'));
  assert.equal(buildReferenceIndex(docs, '/').find(entry => entry.kind === 'term').href, '/reference/meny/#ref-kina');
});

test('fenced examples, ordinary tables, hub and non-reference articles do not become terms', () => {
  const body = '```md\n| <span id="ref-example">**Example**</span> | Data |\n```\n| Not a reference row | Value |';
  const docs = [
    { id: 'reference/test', data: { title: 'Test', referenceCategory: 'slovnik' }, body },
    { id: 'reference/prehled', data: { title: 'Hub', referenceCategory: 'slovnik', referenceHub: true }, body },
    { id: 'pruvodce/test', data: { title: 'Guide' }, body },
  ];
  const entries = buildReferenceIndex(docs, '/');
  assert.deepEqual(entries.map(entry => entry.name), ['Test']);
});
