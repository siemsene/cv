// @ts-check
import { defineConfig } from 'astro/config';

// Tailwind v4 runs via PostCSS (postcss.config.mjs) rather than the Vite
// plugin, which is incompatible with Astro 6's rolldown-based Vite.
// https://astro.build/config
export default defineConfig({
  site: 'https://siemsen.edutool.org',
});
