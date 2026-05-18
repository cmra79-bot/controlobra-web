import { defineConfig } from 'astro/config'

// https://astro.build/config
export default defineConfig({
  site: 'https://controlobra.ai',
  output: 'static',
  build: {
    // Genera la salida en `dist/` lista para Cloudflare Pages / Vercel.
    assets: '_assets',
  },
  server: {
    port: 4321,
    host: true,
  },
})
