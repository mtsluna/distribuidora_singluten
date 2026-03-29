// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // IMPORTANTE: Reemplazá con tu URL real de GitHub Pages
  // Ejemplo: site: 'https://tu-usuario.github.io', base: '/distribuidora_singluten'
  site: 'https://mtsluna.github.io',
  base: '/distribuidora_singluten',
  vite: {
    plugins: [tailwindcss()]
  },
  integrations: [sitemap()]
});
