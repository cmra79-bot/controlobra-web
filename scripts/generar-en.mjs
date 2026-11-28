// Genera la portada en inglés (src/pages/en/index.html) a partir de la portada en
// español (src/pages/index.html) + el diccionario src/i18n/en.mjs.
//
// Corre solo en cada `astro dev` y `astro build` (integración en astro.config.mjs),
// y también a mano:  node scripts/generar-en.mjs
//
// No edites src/pages/en/index.html: se sobrescribe. Para cambiar un texto en
// inglés, cambialo en src/i18n/en.mjs.
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { RAW, TEXT } from '../src/i18n/en.mjs'

const RAIZ = new URL('..', import.meta.url)
const ORIGEN = new URL('src/pages/index.html', RAIZ)
const DESTINO = new URL('src/pages/en/index.html', RAIZ)

const norm = (s) => s.replace(/\s+/g, ' ').trim()
// Un texto "parece español" si tiene acentos/ñ/¿¡ o palabras muy comunes.
const ES = /[áéíóúñ¿¡]|\b(de|del|la|las|los|el|con|para|tu|tus|en|y|que|por|sin|una?)\b/i

const ATRIBUTOS = /\s(alt|aria-label|placeholder|title)="([^"]*)"/g

function traducirTag(tag, faltan) {
  return tag.replace(ATRIBUTOS, (m, k, v) => {
    const t = TEXT[norm(v)]
    if (t !== undefined) return ` ${k}="${t.replace(/"/g, '&quot;')}"`
    if (ES.test(v)) faltan.add(`@${k}: ${v}`)
    return m
  })
}

// Traduce los nodos de texto y atributos de un trozo de HTML. Salta <style>,
// <script> y las expresiones ${…} del template de la portada.
function traducirHtml(html, faltan) {
  const partes = html.split(/(<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>|<!--[\s\S]*?-->|\$\{[^}]*\}|<[^>]+>)/)
  return partes.map((p) => {
    if (!p) return p
    if (/^<(style|script)|^<!--|^\$\{/.test(p)) return p
    if (p.startsWith('<')) return traducirTag(p, faltan)
    const n = norm(p)
    if (!n) return p
    const t = TEXT[n]
    if (t !== undefined) {
      const ini = p.match(/^\s*/)[0], fin = p.match(/\s*$/)[0]
      return ini + t + fin
    }
    if (ES.test(n)) faltan.add(n)
    return p
  }).join('')
}

export async function generarEn({ log = console.log } = {}) {
  let html = await readFile(ORIGEN, 'utf8')
  const avisos = []

  for (const [es, en] of RAW) {
    if (!html.includes(es)) { avisos.push(`RAW no encontrado: ${es.slice(0, 90)}…`); continue }
    html = html.split(es).join(en)
  }

  // El cuerpo de la portada vive en un template de JS: `const html = \`…\`;`
  const faltan = new Set()
  const A = html.indexOf('const html = `')
  const B = A < 0 ? -1 : html.indexOf('\n`;', A)
  if (A < 0 || B < 0) {
    avisos.push('No encontré el template `const html = …` de la portada: el cuerpo quedó sin traducir.')
  } else {
    html = html.slice(0, A) + traducirHtml(html.slice(A, B), faltan) + html.slice(B)
  }

  html = html.replace('<head>', '<head>\n<!-- GENERADO por scripts/generar-en.mjs desde src/pages/index.html + src/i18n/en.mjs. No editar a mano. -->')

  await mkdir(new URL('.', DESTINO), { recursive: true })
  await writeFile(DESTINO, html, 'utf8')

  for (const t of faltan) avisos.push(`Sin traducir: ${t.slice(0, 120)}`)
  log(`[en] /en/ generada (${avisos.length ? avisos.length + ' avisos' : 'todo traducido'})`)
  for (const a of avisos) log(`[en]   · ${a}`)
  return avisos
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const avisos = await generarEn()
  process.exitCode = process.argv.includes('--estricto') && avisos.length ? 1 : 0
}
