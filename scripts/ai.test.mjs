import test from 'node:test';
import assert from 'node:assert/strict';
import { prebuiltAppConfig } from '@mlc-ai/web-llm';
import { extractPassages } from './ai-index.mjs';
import { retrievePassages, retrievalQuery, validateIndex, CONTEXT_CHAR_LIMIT } from '../src/lib/ai/retrieval.ts';
import { parseAnswer, buildPrompt, stripThinking } from '../src/lib/ai/protocol.ts';
import { safeExternalUrl, safeWikiUrl } from '../src/lib/ai/urls.ts';
import { MODEL_IDS, modelFor } from '../src/lib/ai/config.ts';

const meta = { title: 'Základní atributy', aliases: ['Precision', 'GS'], sources: [
  { title: 'Tooltipy', url: 'https://example.com/stats', scope: 'unspecified' },
  { title: 'Unsafe', url: 'javascript:alert(1)', scope: 'global' }],
  edition: 'global-launch', reviewedAt: '2026-10-12', evidence: 'community' };
const html = `<link rel="canonical" href="https://wiki.test/club/staty/zakladni/"><script type="application/json" data-tarot-document>${JSON.stringify(meta)}</script>
<div class="sl-markdown-content"><h2 id="real-anchor-2">Body nejsou procentní šance<a class="sl-anchor-link">Odkaz</a></h2>
<p>Precision navyšuje Accuracy a Critical Hit; nejde o procentní šanci.</p>
<table><thead><tr><th>Stat</th><th>Efekt</th></tr></thead><tbody><tr><td><span id="ref-precision">Precision</span></td><td>Accuracy a Critical Hit increase.</td></tr></tbody></table>
<aside class="starlight-aside"><p class="starlight-aside__title">Pozor</p><p>Toto není vlastní měření v klientu Global.</p></aside>
<h2>Bez kotvy</h2><p>Další odstavec má dostatek textu, ale žádnou vymyšlenou kotvu.</p>
<script>alert('not indexed')</script><p data-pagefind-ignore>Ignore this long piece of navigation or generated content.</p>
</div>`;
const passages = extractPassages(html, '/club/staty/zakladni/', 'https://wiki.test', '/club/');

test('index uses rendered heading/row IDs, preserves warnings, strips scripts and validates external sources', () => {
  assert.equal(passages.length, 4);
  assert.equal(passages[0].url, '/club/staty/zakladni/#real-anchor-2');
  assert.equal(passages[0].heading, 'Body nejsou procentní šance');
  assert.equal(passages[1].url, '/club/staty/zakladni/#ref-precision');
  assert.match(passages[1].excerpt, /Stat: Precision · Efekt:/);
  assert.equal(passages[2].excerpt, 'Pozor Toto není vlastní měření v klientu Global.');
  assert.equal(passages[3].url, '/club/staty/zakladni/');
  assert.equal(passages[0].sources.length, 1);
  assert.ok(!JSON.stringify(passages).includes('not indexed'));
  assert.ok(!JSON.stringify(passages).includes('Ignore this'));
});

test('URLs respect custom site/base and actual trailing slash, with article fallback for absent IDs', () => {
  const never = html.replace('https://wiki.test/club/staty/zakladni/', 'https://wiki.test/club/staty/zakladni');
  assert.equal(extractPassages(never, '/club/staty/zakladni/', 'https://wiki.test', '/club/')[0].url,
    '/club/staty/zakladni#real-anchor-2');
  const root = html.replace('https://wiki.test/club/staty/zakladni/', 'https://wiki.test/staty/zakladni/');
  assert.equal(extractPassages(root, '/staty/zakladni/', 'https://wiki.test', '/')[0].url, '/staty/zakladni/#real-anchor-2');
  assert.equal(safeWikiUrl('/club/staty/zakladni/#real-anchor-2', 'https://wiki.test', '/club/'), passages[0].url);
});

test('dangerous schemes, credentials, traversal and foreign URLs are never citations', () => {
  for (const url of ['javascript:alert(1)', 'data:text/html,x', '//evil.test/', 'https://x:y@wiki.test/', 'https://wiki.test/\nfoo', 'https://wiki.test\\@evil.test']) assert.equal(safeExternalUrl(url), undefined);
  for (const url of ['//evil.test/club/', '/club/../../outside', '/outside/', 'https://wiki.test/club/', '/club/%5c%5cevil.test', '/club/path?query=x', 'javascript:alert(1)']) assert.equal(safeWikiUrl(url, 'https://wiki.test', '/club/'), undefined);
  assert.equal(safeExternalUrl('https://example.com/stats#precision'), 'https://example.com/stats#precision');
});

test('citations map only offered numbers, renumber by first use and never come from partial streams', () => {
  const sources = passages.slice(0, 3);
  const text = 'Precision navyšuje Accuracy [2] a Critical Hit [2, 1]. Není to procentní šance [1][9].';
  const answer = parseAnswer(text, sources, true);
  assert.deepEqual(answer.sources, [sources[1], sources[0]]);
  assert.deepEqual(answer.parts, ['Precision navyšuje Accuracy', 1, ' a Critical Hit', 1, 2, '. Není to procentní šance', 2, '.']);
  assert.deepEqual(parseAnswer('Precision [1', sources, false), { parts: ['Precision'], sources: [] }, 'an unfinished citation is held back');
  assert.deepEqual(parseAnswer('Precision [4] a [0].', sources, true).sources, [], 'unknown numbers are not citations');
  assert.deepEqual(parseAnswer('NEVÍM', sources, true), { parts: [], sources: [] });
  assert.deepEqual(parseAnswer('Nevim.', sources, true).parts, []);
  assert.deepEqual(parseAnswer('', sources, true).parts, []);
  assert.deepEqual(parseAnswer('**Precision** je stat [1].', sources, true).parts, ['Precision je stat', 1, '.'], 'Markdown stays out of plain text');
  const thinking = '<think>\n\n</think>\n\nPrecision je stat [1].';
  assert.deepEqual(parseAnswer(thinking, sources, true).parts, ['Precision je stat', 1, '.'], 'WebLLM empty thinking prefix is not part of the answer');
  assert.equal(stripThinking('<think>\nZvažuji [1]. Precision'), '', 'unfinished reasoning is never shown');
  assert.equal(parseAnswer('<think>Precision [1]', sources, false).parts.length, 0);
  assert.equal(stripThinking('Bez úvahy'), 'Bez úvahy');
});

test('retrieval handles Czech, aliases, unknown subjects and context limits without remote calls', () => {
  const index = { version: 1, passages };
  assert.ok(retrievePassages(index, 'Co dělá Precision?').some(item => item.id === passages[0].id));
  assert.equal(retrievePassages(index, 'Co je banana king drop rate?').length, 0);
  assert.equal(retrievePassages(index, 'Jaká je cena předmětu XYZ?').length, 0);
  assert.equal(retrievePassages(index, 'x'.repeat(1300)).length, 0);
  assert.equal(retrievalQuery('A jak?', 'Co dělá Precision?'), 'Co dělá Precision? A jak?');
  assert.equal(retrievalQuery('Co je sandwich?', 'Co dělá Precision?'), 'Co je sandwich?');
  const many = { version: 1, passages: Array.from({ length: 30 }, (_, i) => ({ ...passages[0], id: `doc/${i}:1`, url: `/club/doc/${i}/`, excerpt: 'Precision vysvětlení. '.repeat(65) })) };
  const found = retrievePassages(many, 'Precision');
  assert.ok(found.length <= 6);
  assert.ok(found.reduce((n, passage) => n + passage.excerpt.length, 0) <= CONTEXT_CHAR_LIMIT);
  assert.equal(retrievePassages(index, 'Jak zvýšit GS?').length, 0, 'unrelated article-wide aliases are not evidence');
  assert.ok(retrievePassages(index, 'Jak funguje Precision?').some(item => item.id === passages[0].id), 'filler verbs do not veto evidence');
  assert.ok(retrievePassages(index, 'Co dělá Precision v sandwich?').length, 'rare wiki terms outweigh one unknown word');
});

test('index validation rejects duplicate IDs, foreign article links and invalid evidence', () => {
  assert.equal(validateIndex({ version: 1, passages }, 'https://wiki.test', '/club/').passages.length, 4);
  assert.throws(() => validateIndex({ version: 1, passages: [passages[0], passages[0]] }, 'https://wiki.test', '/club/'));
  assert.throws(() => validateIndex({ version: 1, passages: [{ ...passages[0], url: '//evil.test/' }] }, 'https://wiki.test', '/club/'));
  assert.throws(() => validateIndex({ version: 1, passages: [{ ...passages[0], evidence: 'verified-global' }] }, 'https://wiki.test', '/club/'));
});

test('model is present in the pinned runtime and prompt contains data, never model-authored URLs', () => {
  for (const id of Object.values(MODEL_IDS)) {
    const record = prebuiltAppConfig.model_list.find(model => model.model_id === id);
    assert.ok(record, id);
    assert.match(record.model, /^https:\/\/huggingface.co\/mlc-ai\/Qwen3-1\.7B/);
  }
  assert.equal(modelFor(true), MODEL_IDS.f16);
  assert.equal(modelFor(false), MODEL_IDS.f32);
  const prompt = buildPrompt('Co dělá Precision?', passages, 'y'.repeat(600));
  assert.ok(!prompt.includes('https://example.com'));
  assert.ok(!prompt.includes('/club/staty/zakladni/'));
  assert.match(prompt, /^Podklady:\n\n\[1\] Základní atributy — Body nejsou procentní šance\n/);
  assert.ok(prompt.includes(`[${passages.length}] `));
  assert.match(prompt, /Předchozí otázka: y{400}\n\nOtázka: Co dělá Precision\?$/);
  assert.ok(!buildPrompt('Co?', passages).includes('Předchozí otázka'));
});
