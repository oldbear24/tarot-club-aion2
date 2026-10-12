import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { sidebar } from './src/lib/navigation.mjs';

// The GitHub workflow supplies these for project Pages; locally use /.
const site = process.env.SITE_URL || 'https://aion2.tarot-club.cz';
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
      MarkdownContent: './src/components/MarkdownContent.astro',
    },
    sidebar,
    tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 3 },
    pagination: true,
  })],
});
