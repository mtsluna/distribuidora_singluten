// @ts-check
import { readdirSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import { construirLastmod } from './src/lib/lastmod.mjs';

const SITE = 'https://www.distribuidorasingluten.com.ar';

const slugs = readdirSync('./src/content/categorias')
  .filter(f => f.endsWith('.yaml'))
  .map(f => f.replace(/\.yaml$/, ''));

const lastmod = construirLastmod(slugs);

// https://astro.build/config
export default defineConfig({
  site: SITE,
  vite: {
    plugins: [tailwindcss()]
  },
  integrations: [
    sitemap({
      // /llms.txt no es una página del sitio: no va al sitemap.
      filter: url => !url.endsWith('/llms.txt'),
      serialize(item) {
        const { pathname } = new URL(item.url);
        const fecha = lastmod.get(pathname);
        if (fecha) item.lastmod = fecha.toISOString();
        return item;
      }
    })
  ]
});
