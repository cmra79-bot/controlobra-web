// ---------------------------------------------------------------------------
// Fuente de datos de /analisis/ (plan Google → Precios Obra, Fase 2:
// PRECIOS_OBRA.md §10 en APP-CMP).
//
// Los ~1.191 análisis de precio unitario del catálogo, con su dibujo. Los
// dibujos son componentes React de la app y se pintan SOLO allá: el build de
// la app (`frontend/scripts/generar-seo-analisis.mjs`) publica este archivo en
// app.controlobra.ai y acá solo se lee. Así cada dibujo nuevo o corregido en
// el visor llega solo a controlobra.ai, sin mantener dos copias.
//
// Contenido «b» (decisión del 21-nov-2026): descripción y la lista de
// materiales, mano de obra y equipos SOLO por nombre. Sin cantidades ni
// precios: el desglose completo sigue en la app.
//
// Es un archivo estático público: no hace falta SEO_BUILD_KEY.
// ---------------------------------------------------------------------------
import { readFile } from 'node:fs/promises'

// `ANALISIS_URL` permite probar en local con un archivo (ruta) o con otra URL.
const ORIGEN = (process.env.ANALISIS_URL || 'https://app.controlobra.ai/precios-obra/analisis-publico.json').trim()

export const APP = 'https://app.controlobra.ai'

// Igual que precios.js: en el build de producción quedarse sin datos rompe el
// build (Cloudflare deja en línea el último deploy bueno) en vez de publicar
// el sitio sin /analisis/. En local solo avisa y no genera las páginas.
const EN_BUILD_REAL = !!(process.env.CF_PAGES || process.env.CI)
function sinDatos(motivo) {
  console.error(`\n[analisis] ✖ ${motivo}`)
  if (EN_BUILD_REAL) {
    console.error('[analisis]   Build abortado para no publicar el sitio sin los análisis.\n')
    process.exit(1)
  }
  console.error('[analisis]   (build local: sigue, pero sin páginas de /analisis/)\n')
}

const VACIO = { capitulos: [], dibujos: {}, partidas: [], estilo_dibujo: '' }

async function leer() {
  let texto
  if (/^https?:\/\//.test(ORIGEN)) {
    let ultimo
    for (let intento = 1; intento <= 3; intento++) {
      try {
        const r = await fetch(ORIGEN, { headers: { accept: 'application/json' } })
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        texto = await r.text()
        break
      } catch (e) {
        ultimo = e
        if (intento < 3) await new Promise((s) => setTimeout(s, intento * 1500))
      }
    }
    if (texto == null) return sinDatos(`no se pudo leer ${ORIGEN}: ${ultimo?.message}`), VACIO
  } else {
    try { texto = await readFile(ORIGEN, 'utf8') } catch (e) { return sinDatos(`no se pudo leer ${ORIGEN}: ${e.message}`), VACIO }
  }
  // La app es una SPA con catchall: una ruta que no existe contesta 200 con el
  // index.html. Por eso se valida el contenido y no solo el código HTTP.
  let datos
  try { datos = JSON.parse(texto) } catch {
    return sinDatos(`${ORIGEN} no es JSON (¿la app todavía no publica el archivo de análisis?)`), VACIO
  }
  if (datos?.version !== 1 || !Array.isArray(datos.partidas) || !datos.partidas.length) {
    return sinDatos(`${ORIGEN} vino sin partidas o con un formato que no conozco (version ${datos?.version})`), VACIO
  }
  return datos
}

let _datos
export function getAnalisis() {
  _datos ??= leer().then((d) => {
    const capitulos = (d.capitulos || []).map((c) => ({
      ...c,
      partidas: d.partidas.filter((p) => p.capitulo === c.slug),
    })).filter((c) => c.partidas.length)
    return { ...d, capitulos }
  })
  return _datos
}

export const GRUPOS = [
  { clave: 'material', nombre: 'Materiales', color: 'var(--t-material)', bg: 'var(--t-material-bg)' },
  { clave: 'mano_obra', nombre: 'Mano de obra', color: 'var(--t-mo)', bg: 'var(--t-mo-bg)' },
  { clave: 'equipo', nombre: 'Equipos', color: 'var(--t-equipos)', bg: 'var(--t-equipos-bg)' },
  { clave: 'subcontrato', nombre: 'Subcontratos', color: 'var(--t-transporte)', bg: 'var(--t-transporte-bg)' },
]

/** Los insumos agrupados como en la ficha de la app, sin repetir nombres. */
export function gruposDe(partida) {
  return GRUPOS.map((g) => {
    const vistos = new Set()
    const nombres = []
    for (const x of partida.insumos || []) {
      if (x.tipo !== g.clave) continue
      const n = (x.nombre || '').trim()
      const k = n.toLowerCase()
      if (!n || vistos.has(k)) continue
      vistos.add(k)
      nombres.push(n)
    }
    return { ...g, nombres }
  }).filter((g) => g.nombres.length)
}

/** "a, b y c" */
export function listaY(xs) {
  if (xs.length <= 1) return String(xs[0] ?? '')
  return `${xs.slice(0, -1).join(', ')} y ${xs[xs.length - 1]}`
}

/** Enlace a la ficha completa en la app (precio y desglose, con cuenta). */
export const enApp = (p) => `${APP}/precios-obra/analisis/${encodeURIComponent(p.codigo)}`
