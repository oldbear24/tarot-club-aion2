import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { readDocs } from './content.mjs';
import { sidebar } from '../src/lib/navigation.mjs';
import { buildReferenceIndex } from '../src/lib/reference.ts';
const docs = await readDocs();

test('every public article has exactly one thematic navigation home', () => {
  const slugs = sidebar.flatMap(group => group.items ? group.items.map(item => item.slug) : [group.slug || 'index']);
  assert.equal(slugs.length, new Set(slugs).size);
  assert.equal(sidebar.filter(group => group.items).length, 9);
  for (const doc of docs.filter(doc => doc.id !== '404')) assert.ok(slugs.includes(doc.id), doc.id);
  assert.equal(slugs.length, docs.length - 1);
});

test('catalog spans all subjects and preserves 148 base stats plus six extra names', () => {
  const entries = buildReferenceIndex(docs, '/');
  const articles = entries.filter(entry => entry.kind === 'article');
  for (const doc of docs.filter(doc => !['index', '404', 'reference/prehled'].includes(doc.id))) {
    assert.ok(articles.some(entry => entry.href === `/${doc.id}/`), doc.id);
  }
  assert.equal(entries.filter(entry => entry.kind === 'term' && entry.href.startsWith('/reference/staty/')).length, 154);
  assert.ok(entries.every(entry => !/^\d+$/.test(entry.summary)));
});

test('critical repeating values have a single owner and overview links to it', () => {
  const get = id => docs.find(doc => doc.id === id).body;
  assert.match(get('reference/pets'), /5 souls.*25.*75/);
  assert.doesNotMatch(get('pruvodce/cp-postava'), /\b(?:25|75)\b/);
  assert.match(get('pruvodce/cp-postava'), /reference\/pets/);
  assert.doesNotMatch(get('reference/aktivity'), /\b(?:560|840|07:00|09:00|08:00)\b/);
  assert.match(get('reference/aktivity'), /daily-weekly\/#denní/);
  for (const id of ['pruvodce/gs-progrese', 'pruvodce/daily-weekly']) assert.doesNotMatch(get(id), /\b(?:560|840)\b/);
  for (const id of ['pruvodce/nightmare', 'pruvodce/runy-specialni-sloty']) assert.doesNotMatch(get(id), /(?:300|500|1 500) Phantasmal Fragments/);
});

test('original evidence, dates, editions, aliases and source scopes survive the editorial pass', async () => {
  const original = JSON.parse(await readFile('scripts/evidence-baseline.json', 'utf8'));
  for (const doc of docs) {
    const baseline = original[doc.id]; assert.ok(baseline, doc.id);
    for (const key of ['edition', 'reviewedAt', 'evidence', 'aliases', 'lookupAliases']) assert.deepEqual(doc.data[key], baseline[key], `${doc.id}: ${key}`);
    for (const source of baseline.sources || []) assert.ok(doc.data.sources?.some(current => current.url === source.url && current.scope === source.scope), `${doc.id}: ${source.url}`);
  }
});
