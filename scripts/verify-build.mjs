import { readdir, readFile, stat } from 'node:fs/promises';
import { resolve, relative, sep } from 'node:path';

// Verify the actual output, including relative Markdown links under a Pages base.
const root = resolve('dist');
const origin = new URL(process.env.SITE_URL || 'https://aion2.tarot-club.cz').origin;
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
// Frozen inventory from f838fff: editorial changes must keep all published deep links.
const publicLinks = JSON.parse(await readFile('scripts/public-links.json', 'utf8'));
for (const [page, anchors] of Object.entries(publicLinks)) {
  try {
    const html = await readFile(resolve(root, page), 'utf8');
    const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
    for (const id of anchors) if (!ids.has(id)) errors.push(`${page}: ztracená veřejná kotva #${id}`);
  } catch { errors.push(`Ztracená veřejná stránka: ${page}`); }
}
const unescape = s => s.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
for (const page of pages) {
  const html = await readFile(page, 'utf8');
  const name = relative(root, page).split(sep).join('/');
  const url = new URL(base + name.replace(/index\.html$/, ''), origin);
  if (!/<html\b[^>]*\blang="cs"/.test(html)) errors.push(`${name}: chybí lang=cs`);
  if ((html.match(/<h1\b/g) || []).length !== 1) errors.push(`${name}: očekáván právě jeden h1`);
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m => unescape(m[1])));
  const allIds = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => unescape(m[1]));
  if (allIds.length !== ids.size) errors.push(`${name}: duplicitní HTML ID`);
  if (name !== '404.html') {
    const canonical = html.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/);
    if (!canonical || unescape(canonical[1]) !== url.href) errors.push(`${name}: nesprávná canonical URL`);
  }
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
const catalog = JSON.parse(await readFile(resolve(root, 'reference-index.json'), 'utf8'));
for (const entry of catalog) {
  const target = new URL(entry.href, origin);
  if (target.origin !== origin || !target.pathname.startsWith(base)) { errors.push(`Katalog: odkaz mimo base ${entry.href}`); continue; }
  try {
    const html = await readFile(resolve(root, target.pathname.slice(base.length), 'index.html'), 'utf8');
    if (target.hash && !html.includes(`id="${decodeURIComponent(target.hash.slice(1))}"`)) errors.push(`Katalog: chybí kotva ${entry.href}`);
  } catch { errors.push(`Katalog: chybí cíl ${entry.href}`); }
}
const sitemap = await readFile(resolve(root, 'sitemap-0.xml'), 'utf8');
const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
if (locations.length !== new Set(locations).size) errors.push('Sitemap: duplicitní URL');
for (const location of locations) if (!location.startsWith(origin + base)) errors.push(`Sitemap: nesprávná doména/base ${location}`);
if (locations.length !== pages.length - 1) errors.push('Sitemap neobsahuje všechny kanonické obsahové stránky.');
if (errors.length) { console.error([...new Set(errors)].join('\n')); process.exit(1); }
console.log(`Ověřeno ${pages.length} HTML stránek, ${checked} lokálních odkazů/assetů, ${catalog.length} položek katalogu, ${Object.values(publicLinks).flat().length} původních kotev, canonical, sitemap a Pagefind. Base: ${base}`);
