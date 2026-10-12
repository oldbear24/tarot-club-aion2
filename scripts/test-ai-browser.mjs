import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import { chromium } from '@playwright/test';

const root = resolve('dist');
const base = ('/' + (process.env.BASE_PATH || '/').split('/').filter(Boolean).join('/') + '/').replace(/^\/\//, '/');
let browser, server, origin;
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.wasm': 'application/wasm' };
before(async () => {
  server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url, 'http://localhost');
      if (!url.pathname.startsWith(base)) throw new Error('outside base');
      let path = resolve(root, decodeURIComponent(url.pathname.slice(base.length)));
      if (path !== root && !path.startsWith(root + sep)) throw new Error('outside root');
      if ((await stat(path)).isDirectory()) path = resolve(path, 'index.html');
      response.writeHead(200, { 'Content-Type': types[extname(path)] || 'application/octet-stream' });
      response.end(await readFile(path));
    } catch { response.writeHead(404); response.end('Not found'); }
  });
  await new Promise(done => server.listen(0, '127.0.0.1', done));
  origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}), args: ['--no-sandbox'] });
});
after(async () => { await browser?.close(); await new Promise(done => server?.close(done)); });

async function pageWithMock(options = {}) {
  const context = await browser.newContext({ viewport: options.mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(({ gpu, adapter, mode }) => {
    Object.defineProperty(navigator, 'gpu', { value: gpu ? { requestAdapter: async () => adapter ? {} : null } : undefined });
    window.__testMode = mode;
  }, { gpu: options.gpu !== false, adapter: options.adapter !== false, mode: options.mode || 'normal' });
  // This fixture verifies UI and lifecycle only. It never claims actual model inference.
  await page.route('**/_astro/runtime.*.js', route => route.fulfill({ contentType: 'text/javascript', body: `
    export class LocalModel {
      constructor(progress) { this.progress=progress; window.__aiLifecycle={disposed:0,calls:0}; }
      async initialize() { this.progress(.5); await new Promise(r=>setTimeout(r,80)); if(window.__testMode==='init-error') throw new Error('out of memory'); }
      async generate(question,sources,previous,onText) {
        window.__aiLifecycle.calls++;
        if(window.__testMode==='error') throw new Error('device lost');
        const source=sources.find(s=>s.title==='Základní atributy'&&s.heading==='Body nejsou procentní šance')||sources[0];
        const id=window.__testMode==='unknown'?'invented:999':source.id;
        // WebLLM keeps its prefilled empty thinking block in the streamed content.
        const text='<think>\n\n</think>\n\n'+JSON.stringify({sourceIds:[id]});
        onText(text.slice(0,-1)); await new Promise(r=>setTimeout(r,30)); onText(text); return text;
      }
      dispose() { window.__aiLifecycle.disposed++; }
    }` }));
  await page.goto(origin + base + 'ai/');
  await page.locator('[data-tarot-chat][data-initialized]').waitFor();
  return { page, context, errors };
}
async function activate(page) {
  await page.locator('[data-ai-activate]').click();
  await page.waitForFunction(() => document.querySelector('[data-ai-status]').textContent.includes('AI je připravená'));
}
async function ask(page, question) {
  await page.locator('[data-ai-input]').fill(question);
  await page.locator('[data-ai-send]').click();
  await page.waitForFunction(() => document.querySelector('[data-ai-messages]').getAttribute('aria-busy') === 'false');
}

test('ordinary pages and inactive AI make no model or index requests', async () => {
  const { page, context, errors } = await pageWithMock();
  const requests = [];
  page.on('request', request => requests.push(request.url()));
  await page.goto(origin + base + 'staty/zakladni/');
  assert.ok(await page.getByRole('link', { name: 'Zeptat se AI', exact: true }).count());
  await page.goto(origin + base + 'ai/');
  assert.equal(requests.filter(url => /runtime\.|worker-|wiki-index\.json|huggingface|binary-mlc/.test(url)).length, 0);
  assert.ok(await page.locator('[data-ai-send]').isDisabled());
  assert.deepEqual(errors, []);
  await context.close();
});

test('without WebGPU there is an accessible, working Pagefind fallback on mobile', async () => {
  const { page, context, errors } = await pageWithMock({ gpu: false, mobile: true });
  assert.match(await page.locator('[data-ai-status]').textContent(), /nemá dostupné WebGPU/);
  assert.ok(await page.locator('[data-ai-activate]').isDisabled());
  await page.locator('[data-ai-input]').fill('Precision');
  await page.waitForFunction(() => !!document.querySelector('site-search input'));
  await page.locator('[data-ai-search]').click();
  await page.locator('site-search dialog[open]').waitFor();
  await page.waitForFunction(() => document.querySelector('site-search').textContent.includes('Základní atributy'));
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  assert.deepEqual(errors, []);
  await context.close();
});

test('missing GPU adapter and memory failure leave usable controls', async () => {
  const noAdapter = await pageWithMock({ adapter: false });
  await noAdapter.page.locator('[data-ai-activate]').click();
  await noAdapter.page.waitForFunction(() => document.querySelector('[data-ai-status]').textContent.includes('nemá přístup'));
  assert.ok(await noAdapter.page.locator('[data-ai-send]').isDisabled());
  await noAdapter.context.close();
  const { page, context, errors } = await pageWithMock({ mode: 'init-error' });
  await page.locator('[data-ai-activate]').click();
  await page.waitForFunction(() => document.querySelector('[data-ai-status]').textContent.includes('dostatek'));
  assert.ok(await page.locator('[data-ai-activate]').isEnabled());
  assert.deepEqual(errors, []);
  await context.close();
});

test('streamed citations link to the real section and separate article background', async () => {
  const { page, context, errors } = await pageWithMock();
  await activate(page);
  await ask(page, 'Co dělá Precision?');
  const citation = page.locator('.tarot-citation').first();
  assert.match(await citation.getAttribute('href'), /staty\/zakladni\/#body-nejsou-/);
  assert.match(await page.locator('[data-ai-messages]').textContent(), /nikoli přímo procentní šanci/);
  assert.match(await page.locator('[data-ai-messages]').textContent(), /Původní podklady/);
  assert.match(await page.locator('[data-ai-messages]').textContent(), /přiřazení ke konkrétní větě nebylo ověřeno/);
  for (const link of await page.locator('[data-ai-messages] a[target="_blank"]').all()) assert.equal(await link.getAttribute('rel'), 'noopener noreferrer');
  await citation.click();
  assert.ok(await page.locator('[id="body-nejsou-procentní-šance"]').count());
  assert.deepEqual(errors, []);
  await context.close();
});

test('unknown subjects skip inference; unknown citation IDs do not produce links', async () => {
  const { page, context } = await pageWithMock();
  await activate(page);
  await ask(page, 'Co je sandwich?');
  assert.equal(await page.evaluate(() => window.__aiLifecycle.calls), 0);
  assert.match(await page.locator('[data-ai-messages]').textContent(), /nemám ve wiki ověřitelný zdroj/);
  assert.equal(await page.locator('.tarot-citation').count(), 0);
  await page.evaluate(() => { window.__testMode = 'unknown'; });
  await ask(page, 'Co dělá Precision?');
  assert.equal(await page.locator('.tarot-citation').count(), 0);
  assert.equal(await page.locator('[data-ai-messages] a').count(), 0);
  await context.close();
});

test('keyboard, session reset, text escaping and mobile light/dark layout', async () => {
  const { page, context, errors } = await pageWithMock({ mobile: true });
  await activate(page);
  await page.locator('[data-ai-input]').fill('Co dělá Precision?');
  await page.locator('[data-ai-input]').press('Shift+Enter');
  assert.match(await page.locator('[data-ai-input]').inputValue(), /\n$/);
  await page.locator('[data-ai-input]').press('Enter');
  await page.waitForFunction(() => document.querySelectorAll('.tarot-citation').length > 0 && document.querySelector('[data-ai-messages]').getAttribute('aria-busy') === 'false');
  for (const theme of ['light', 'dark']) {
    await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  }
  await ask(page, '<img src=x onerror=alert(1)>');
  assert.equal(await page.locator('[data-ai-messages] img').count(), 0);
  assert.match(await page.locator('[data-ai-messages]').textContent(), /<img src=x/);
  await page.locator('[data-ai-reset]').click();
  assert.equal(await page.locator('[data-ai-messages]').textContent(), '');
  assert.equal(await page.locator('[data-ai-input]').inputValue(), '');
  assert.deepEqual(errors, []);
  await context.close();
});

test('cancelled initialization cannot finish later, and inference failure permits retry', async () => {
  const { page, context, errors } = await pageWithMock();
  await page.locator('[data-ai-activate]').click();
  await page.locator('[data-ai-deactivate]').click();
  await page.waitForFunction(() => document.querySelector('[data-ai-status]').textContent.includes('vypnutá'));
  assert.ok(await page.locator('[data-ai-send]').isDisabled());
  await activate(page);
  await page.evaluate(() => { window.__testMode = 'error'; });
  await ask(page, 'Co dělá Precision?');
  assert.ok(await page.locator('[data-ai-activate]').isEnabled());
  assert.match(await page.locator('[data-ai-status]').textContent(), /paměti/);
  assert.deepEqual(errors, []);
  await context.close();
});
