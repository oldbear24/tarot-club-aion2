import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// The GitHub workflow supplies these for project Pages; locally use /.
const site = process.env.SITE_URL || 'https://oldbear24.github.io';
const base = process.env.BASE_PATH || '/';

export default defineConfig({
  site,
  base,
  output: 'static',
  trailingSlash: 'always',
  integrations: [starlight({
    title: 'Tarot Club',
    description: 'Česká wiki AION 2 pro globální launch. Staty, výbava a praktické tipy.',
    favicon: '/favicon.svg',
    locales: { root: { label: 'Čeština', lang: 'cs' } },
    customCss: ['./src/styles/wiki.css'],
    components: {
      Hero: './src/components/Hero.astro',
      PageTitle: './src/components/PageTitle.astro',
      Footer: './src/components/Footer.astro',
    },
    sidebar: [
      { label: 'Úvod', slug: '' },
      { label: 'Staty bez tajemství', items: [
        { label: 'Základní atributy', slug: 'staty/zakladni' },
        { label: 'Útok a poškození', slug: 'staty/utok' },
        { label: 'Critical, Perfect a Double', slug: 'staty/procy' },
        { label: 'Obrana a léčení', slug: 'staty/obrana' },
        { label: 'Pantheon / božské staty', slug: 'staty/pantheon' },
        { label: 'Limity a sporné hodnoty', slug: 'staty/limity' },
      ] },
      { label: 'Praktické průvodce', items: [{ autogenerate: { directory: 'pruvodce' } }] },
      { label: 'O wiki', items: [{ autogenerate: { directory: 'wiki' } }] },
    ],
    tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 3 },
    pagination: true,
  })],
});
