import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'
import { provinciasIndexables } from './src/lib/precios.js'

// Fecha del build. El sitio se reconstruye a diario (.github/workflows/rebuild-diario.yml)
// y en cada build se hornean los precios frescos del catálogo, así que para casi todas
// las páginas "fecha de build" == "fecha en que cambió el contenido".
const FECHA_BUILD = new Date()

// Páginas que NO leen del catálogo de precios: su lastmod es la fecha real en que se
// editaron, no la del build. Mentirle a Google diciendo que la portada cambia todos los
// días le enseña a ignorar el lastmod de todo el sitio.
const ESTATICAS = {
  '/': new Date('2026-07-28T00:00:00Z'),
}

// Provincias con directorio propio de ferreterías. Las demás se generan igual
// (se navegan desde /precios/) pero van `noindex` y fuera del sitemap: sus
// precios son los de su zona, así que anunciarlas solo gasta el rastreo que
// necesitan las páginas con contenido propio. Ver MIN_PROVEEDORES_INDEXABLE.
const INDEXABLES = await provinciasIndexables()
const ES_PROVINCIA = /^\/precios\/provincia\/([^/]+)\/$/

// https://astro.build/config
export default defineConfig({
  site: 'https://controlobra.ai',
  output: 'static',
  integrations: [
    sitemap({
      filter(url) {
        const m = new URL(url).pathname.match(ES_PROVINCIA)
        return m ? INDEXABLES.has(m[1]) : true
      },
      serialize(item) {
        const ruta = new URL(item.url).pathname
        item.lastmod = ESTATICAS[ruta] ?? FECHA_BUILD
        return item
      },
    }),
  ],
  build: {
    // Genera la salida en `dist/` lista para Cloudflare Pages / Vercel.
    assets: '_assets',
  },
  server: {
    port: 4321,
    host: true,
  },
})
