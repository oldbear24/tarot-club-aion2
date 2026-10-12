import { load } from 'cheerio';
import { safeExternalUrl, safeWikiUrl } from '../src/lib/ai/urls.ts';

const text = value => value.replace(/\s+/g, ' ').trim();

// Read the actual rendered headings and IDs. Do not duplicate Starlight's slugger.
export function extractPassages(html, pagePath, site, base) {
  const $ = load(html);
  const metadata = $('[data-tarot-document]').first().text();
  if (!metadata) return [];
  const meta = JSON.parse(metadata);
  if (meta.edition !== 'global-launch') return [];
  const canonical = $('link[rel="canonical"]').attr('href');
  let url = safeWikiUrl(pagePath, site, base);
  if (canonical) {
    const resolved = new URL(canonical, site);
    if (resolved.origin === new URL(site).origin) url = safeWikiUrl(resolved.pathname, site, base);
  }
  if (!url) throw new Error(`Odkaz mimo wiki: ${pagePath}`);
  const content = $('.sl-markdown-content').first();
  content.find('script, style, pre, [data-pagefind-ignore], .sl-anchor-link').remove();
  const actualIds = new Set($('[id]').toArray().map(element => $(element).attr('id')));
  const sources = (meta.sources || []).filter(source => safeExternalUrl(source.url));
  const passages = [];
  let heading = '', anchor;
  const nodes = content.find('h2, h3, h4, h5, h6, p, li, tr, .starlight-aside').toArray();
  for (const element of nodes) {
    const node = $(element);
    if (/^h[2-6]$/.test(element.tagName)) {
      heading = text(node.text());
      const candidate = node.attr('id');
      anchor = candidate && actualIds.has(candidate) ? candidate : undefined;
      continue;
    }
    if (node.parents('.starlight-aside').length || (element.tagName === 'li' && node.find('p, li').length) ||
        node.parents('li').length && element.tagName !== 'p') continue;
    if (element.tagName === 'tr' && node.find('th').length) continue;
    // Inline markup has no delimiter, but block titles/paragraphs do.
    const copy = node.clone();
    copy.find('p, .starlight-aside__title').each((_, block) => $(block).append(' '));
    let excerpt = text(copy.text());
    if (element.tagName === 'tr') {
      const table = node.closest('table');
      const labels = table.find('thead th').toArray().map(th => text($(th).text()));
      excerpt = node.find('td').toArray().map((td, i) => `${labels[i] || 'Údaj'}: ${text($(td).text())}`).join(' · ');
    }
    if (excerpt.length < 35) continue;
    // Never clip a negation or qualifier. Oversized blocks remain accessible via fulltext.
    if (excerpt.length > 1500) continue;
    const rowId = node.find('[id^="ref-"]').first().attr('id');
    const finalAnchor = rowId && actualIds.has(rowId) ? rowId : anchor;
    const id = `${pagePath.slice(base.length).replace(/\/$/, '')}:${passages.length + 1}`;
    passages.push({ id, title: meta.title, url: url + (finalAnchor ? '#' + encodeURIComponent(finalAnchor) : ''),
      heading: heading || undefined, anchor: finalAnchor, excerpt, sourceType: 'wiki', scope: meta.edition,
      aliases: meta.aliases || [], reviewedAt: meta.reviewedAt, evidence: meta.evidence, sources });
  }
  return passages;
}
