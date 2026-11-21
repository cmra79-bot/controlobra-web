import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'
import { writeFile } from 'node:fs/promises'
import { provinciasIndexables, getCategorias } from './src/lib/precios.js'
import { getAnalisis } from './src/lib/analisis.js'

// Fecha del build. El sitio se reconstruye a diario (.github/workflows/rebuild-diario.yml)
// y en cada build se hornean los precios frescos del catálogo, así que para casi todas
// las páginas "fecha de build" == "fecha en que cambió el contenido".
const FECHA_BUILD = new Date()

// Páginas que NO leen del catálogo de precios: su lastmod es la fecha real en que se
// editaron, no la del build. Mentirle a Google diciendo que la portada cambia todos los
// días le enseña a ignorar el lastmod de todo el sitio.
const ESTATICAS = {
  '/': new Date('2026-11-21T00:00:00Z'),
}

// Provincias con directorio propio de ferreterías. Las demás se generan igual
// (se navegan desde /precios/) pero van `noindex` y fuera del sitemap: sus
// precios son los de su zona, así que anunciarlas solo gasta el rastreo que
// necesitan las páginas con contenido propio. Ver MIN_PROVEEDORES_INDEXABLE.
const INDEXABLES = await provinciasIndexables()
const ES_PROVINCIA = /^\/precios\/provincia\/([^/]+)\/$/

// Mudanza de los análisis (plan Google, Fase 2): las páginas viejas de la app,
// app.controlobra.ai/precios-obra/partidas/<slug>.html, llegan acá por una
// regla 301 de DigitalOcean que conserva la ruta. Este `_redirects` de
// Cloudflare Pages las lleva con otra 301 a /analisis/<slug>/ (mismo slug).
// Límite de Cloudflare: 2.000 reglas fijas + 100 dinámicas; son ~1.191 fijas y
// una dinámica por categoría (~30).
function redireccionesAnalisis() {
  return {
    name: 'redirecciones-analisis',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        const { partidas } = await getAnalisis()
        // Una entrada por slug (dos familias con el mismo nombre son una página).
        const cats = [...new Map((await getCategorias()).map((c) => [c.slug, c])).values()]
        const lineas = [
          '# Generado por astro.config.mjs en cada build. No editar a mano.',
          '/precios-obra/partidas.html /analisis/ 301',
          '/precios-obra/partidas /analisis/ 301',
          ...partidas.map((p) => `/precios-obra/partidas/${p.slug}.html /analisis/${p.slug}/ 301`),
          // Una partida que ya no está en el catálogo: al índice, no a un 404.
          '/precios-obra/partidas/* /analisis/ 301',
          // Las páginas de precios que armaba la app (retiradas el 21-nov-2026):
          // cada categoría, y sus páginas por zona, a la categoría de acá.
          '/precios-obra/precios.html /precios/ 301',
          ...cats.flatMap((c) => [
            `/precios-obra/precios/${c.slug}.html /precios/categoria/${c.slug}/ 301`,
            `/precios-obra/precios/${c.slug}/* /precios/categoria/${c.slug}/ 301`,
          ]),
          '/precios-obra/precios/* /precios/ 301',
          // Cualquier otra ruta de la app que llegue acá por error vuelve a la app.
          '/precios-obra/* https://app.controlobra.ai/precios-obra/:splat 302',
        ]
        await writeFile(new URL('_redirects', dir), lineas.join('\n') + '\n', 'utf8')
        console.log(`[analisis] _redirects con ${partidas.length} páginas viejas → /analisis/`)
      },
    },
  }
}

// https://astro.build/config
export default defineConfig({
  site: 'https://controlobra.ai',
  output: 'static',
  integrations: [
    redireccionesAnalisis(),
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
