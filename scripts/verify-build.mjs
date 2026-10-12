import { readdir, readFile, stat } from 'node:fs/promises';
import { resolve, relative, sep } from 'node:path';

// Verify the actual output, including relative Markdown links under a Pages base.
const root = resolve('dist');
const origin = new URL(process.env.SITE_URL || 'https://oldbear24.github.io').origin;
const base = `/${(process.env.BASE_PATH || '/').split('/').filter(Boolean).join('/')}`.replace(/\/$/, '') + '/';
const errors = [];
let checked = 0;
async function files(dir) {
  const result = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = resolve(dir, entry.name);
    if (entry.isDirectory()) result.push(...await files(path));
    else result.push(path);
  }
  return result;
}
const output = await files(root);
const pages = output.filter(path => path.endsWith('.html'));
const unescape = s => s.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
for (const page of pages) {
  const html = await readFile(page, 'utf8');
  const name = relative(root, page).split(sep).join('/');
  const url = new URL(base + name.replace(/index\.html$/, ''), origin);
  if (!/<html\b[^>]*\blang="cs"/.test(html)) errors.push(`${name}: chybí lang=cs`);
  if ((html.match(/<h1\b/g) || []).length !== 1) errors.push(`${name}: očekáván právě jeden h1`);
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m => unescape(m[1])));
  for (const tag of html.matchAll(/<([a-z][a-z0-9-]*)\b([^>]+)>/g)) {
    // Canonical and alternate URLs are metadata, not navigable local links.
    if (tag[1] === 'link' && /\brel="(?:canonical|alternate)"/.test(tag[2])) continue;
    for (const match of tag[2].matchAll(/\b(?:href|src)=(?:"([^"]*)"|'([^']*)')/g)) {
    const value = unescape(match[1] ?? match[2]);
    if (!value || /^(?:data:|mailto:|tel:|javascript:)/i.test(value)) continue;
    let target;
    try { target = new URL(value, url); } catch { errors.push(`${name}: neplatná URL ${value}`); continue; }
    if (target.origin !== origin) continue;
    checked++;
    if (!target.pathname.startsWith(base)) { errors.push(`${name}: odkaz mimo base ${value}`); continue; }
    const targetPath = decodeURIComponent(target.pathname.slice(base.length));
    let path = resolve(root, targetPath);
    if (path !== root && !path.startsWith(root + sep)) { errors.push(`${name}: cesta mimo dist ${value}`); continue; }
    try {
      if ((await stat(path)).isDirectory()) path = resolve(path, 'index.html');
      if (!(await stat(path)).isFile()) throw new Error('není soubor');
      if (target.hash && path.endsWith('.html')) {
        const fragment = decodeURIComponent(target.hash.slice(1));
        const targetHtml = path === page ? html : await readFile(path, 'utf8');
        const exists = path === page ? ids.has(fragment) : [...targetHtml.matchAll(/\bid="([^"]+)"/g)].some(m => unescape(m[1]) === fragment);
        if (!exists) errors.push(`${name}: neexistující kotva ${value}`);
      }
    } catch { errors.push(`${name}: neexistující cíl ${value}`); }
    }
  }
}
if (pages.length < 20) errors.push('Očekáváno alespoň 19 obsahových stránek a 404.');
if (!output.some(path => path.endsWith('/pagefind.js'))) errors.push('Chybí Pagefind runtime.');
if (!output.some(path => path.includes('pagefind') && path.endsWith('.pf_index'))) errors.push('Chybí Pagefind index.');
if (errors.length) { console.error([...new Set(errors)].join('\n')); process.exit(1); }
console.log(`Ověřeno ${pages.length} HTML stránek, ${checked} lokálních odkazů/assetů, český jazyk, kotvy a Pagefind. Base: ${base}`);
