// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Tailwind v4 runs via PostCSS (postcss.config.mjs) rather than the Vite
// plugin, which is incompatible with Astro 6's rolldown-based Vite.
// https://astro.build/config
export default defineConfig({
  site: 'https://siemsen.edutool.org',
  // Emits /sitemap-index.xml + /sitemap-0.xml at build, referenced from
  // robots.txt and submitted to Google/Bing Search Console.
  integrations: [sitemap()],
});
