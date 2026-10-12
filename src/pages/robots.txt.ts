import type { APIContext } from 'astro';
export function GET({ site }: APIContext) {
  const base = import.meta.env.BASE_URL;
  return new Response(`User-agent: *\nAllow: ${base}\nDisallow: ${base}404.html\nSitemap: ${new URL(`${base}sitemap-index.xml`, site).href}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
