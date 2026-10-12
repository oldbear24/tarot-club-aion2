import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, relative, sep } from 'node:path';
import { extractPassages } from './ai-index.mjs';
import { validateIndex } from '../src/lib/ai/retrieval.ts';

const root = resolve('dist');
const site = process.env.SITE_URL || 'https://aion2.tarot-club.cz';
const base = '/' + (process.env.BASE_PATH || '/').split('/').filter(Boolean).join('/') + '/';
const prefix = base.replace(/^\/\//, '/');
async function pages(dir) {
  const output = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = resolve(dir, entry.name);
    if (entry.isDirectory()) output.push(...await pages(path));
    else if (entry.name.endsWith('.html') && entry.name !== '404.html') output.push(path);
  }
  return output;
}
const passages = [];
for (const path of (await pages(root)).sort()) {
  const route = prefix + relative(root, path).split(sep).join('/').replace(/index\.html$/, '');
  passages.push(...extractPassages(await readFile(path, 'utf8'), route, site, prefix));
}
const index = validateIndex({ version: 1, passages }, site, prefix);
if (index.passages.length < 20) throw new Error('Index AI neobsahuje očekávané články.');
await mkdir(resolve(root, 'ai'), { recursive: true });
await writeFile(resolve(root, 'ai/wiki-index.json'), JSON.stringify(index));
console.log(`Tarot AI: ${passages.length} pasáží z publikovaných článků, skutečné kotvy a metadata zdrojů.`);
