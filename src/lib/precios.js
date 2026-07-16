// ---------------------------------------------------------------------------
// Fuente de datos de las páginas de precios (SEO) de controlobra.ai
//
// LEE la API pública del ERP (app.controlobra.ai) en tiempo de BUILD y agrega
// los precios por producto y por zona. No escribe nada; el ERP no se modifica.
// Una sola fuente de verdad: la BD de Precios Obra.
// ---------------------------------------------------------------------------

const API_BASE = 'https://app.controlobra.ai/api/precios-obra'

// Zonas (ids fijos en la BD). Colores y nombres cortos para la UI.
export const ZONAS = [
  { id: 1, label: 'Norte', nombre: 'Cibao Norte', color: '#2A4FA0' },
  { id: 2, label: 'Sur', nombre: 'Sur', color: '#C24545' },
  { id: 3, label: 'Este', nombre: 'Este', color: '#1F8A5B' },
]

// Catálogo de materiales que tendrán página propia. Cada uno define cómo
// consultar el catálogo real (uno o varios términos de búsqueda) y su copy SEO.
// El slug es la URL: /precios/<slug>.
export const MATERIALES = [
  {
    slug: 'cemento',
    nombre: 'Cemento',
    queries: ['cemento gris', 'cemento blanco'],
    emoji: '🧱',
    unidad: 'funda',
    h1: 'Precio del cemento en República Dominicana',
    seoTitle: 'Precio del cemento en República Dominicana 2026 · por zona y marca',
    seoDesc: 'Precio actualizado de la funda de cemento gris y blanco en RD, por zona (Norte, Sur, Este). Datos de la comunidad de constructores.',
    intro: 'Cuánto cuesta hoy la funda de cemento en República Dominicana, con el precio por zona (Cibao Norte, Sur y Este) y por presentación, según los reportes de la comunidad de Precios Obra.',
    porque: 'El precio de la funda de cemento en RD depende de la zona (el flete lo encarece lejos de las plantas del Cibao y el Gran Santo Domingo), la presentación (gris de 94 lb, blanco de 40 kg) y el volumen de compra: comprar por palé o camión baja el precio por funda entre 5% y 12%.',
  },
  {
    slug: 'varilla',
    nombre: 'Varilla de acero',
    queries: ['varilla'],
    emoji: '🔩',
    unidad: 'unidad',
    h1: 'Precio de la varilla de acero en República Dominicana',
    seoTitle: 'Precio de la varilla en República Dominicana 2026 · acero por zona',
    seoDesc: 'Precio actualizado de la varilla de acero (1/4", 3/8", 1/2", 5/8") en RD por zona. Datos reales de la comunidad de Precios Obra.',
    intro: 'Precio de la varilla de acero de refuerzo en RD por calibre y por zona, según los reportes de la comunidad. La varilla es uno de los insumos que más pesa en el costo de una estructura.',
    porque: 'El precio de la varilla en RD sigue de cerca el acero internacional y el dólar, y varía por calibre (1/4", 3/8", 1/2", 5/8"), por zona y por cantidad. Conviene comparar el precio por unidad y por quintal antes de comprar.',
  },
  {
    slug: 'arena',
    nombre: 'Arena',
    queries: ['arena'],
    emoji: '⛰️',
    unidad: 'm³',
    h1: 'Precio de la arena en República Dominicana',
    seoTitle: 'Precio de la arena en República Dominicana 2026 · por m³ y zona',
    seoDesc: 'Precio actualizado de la arena (fina, gruesa, de río) en RD por metro cúbico y por zona. Datos de la comunidad de Precios Obra.',
    intro: 'Precio de la arena de construcción en RD por tipo (fina, gruesa, lavada) y por zona, según los reportes de la comunidad. El precio suele darse por metro cúbico (m³) puesto en obra.',
    porque: 'El precio de la arena en RD lo define sobre todo el transporte: mientras más lejos esté la obra del banco de arena o del río, más sube el flete. También cambia por tipo (fina, gruesa, de río o lavada) y por el volumen del pedido.',
  },
  {
    slug: 'gravilla',
    nombre: 'Grava y gravilla',
    queries: ['grava', 'gravilla'],
    emoji: '🪨',
    unidad: 'm³',
    h1: 'Precio de la grava y gravilla en República Dominicana',
    seoTitle: 'Precio de la grava y gravilla en RD 2026 · por m³ y zona',
    seoDesc: 'Precio actualizado de la grava y gravilla en República Dominicana por metro cúbico y por zona. Datos reales de la comunidad de Precios Obra.',
    intro: 'Precio de la grava y gravilla para hormigón en RD por tipo y por zona, según los reportes de la comunidad. Se cotiza por metro cúbico puesto en obra.',
    porque: 'Como todo agregado pétreo, el precio de la grava en RD depende del transporte desde la cantera, del tamaño del árido y del volumen del pedido. En zonas turísticas del Este suele ser algo más alto por la demanda.',
  },
  {
    slug: 'block',
    nombre: 'Block de hormigón',
    queries: ['block', 'bloque'],
    emoji: '🧱',
    unidad: 'unidad',
    h1: 'Precio del block de hormigón en República Dominicana',
    seoTitle: 'Precio del block en República Dominicana 2026 · por unidad y zona',
    seoDesc: 'Precio actualizado del block de hormigón (4", 6", 8") en RD por unidad y por zona. Datos de la comunidad de Precios Obra.',
    intro: 'Precio del block de hormigón en RD por espesor (4", 6", 8") y por zona, según los reportes de la comunidad. Se cotiza por unidad puesto en obra o en fábrica.',
    porque: 'El precio del block en RD varía por espesor (4", 6", 8"), por resistencia y por zona. El transporte pesa mucho porque es un material voluminoso; comprar en la bloquera más cercana suele salir más barato que traerlo de lejos.',
  },
  {
    slug: 'pintura',
    nombre: 'Pintura',
    queries: ['pintura'],
    emoji: '🎨',
    unidad: 'galón',
    h1: 'Precio de la pintura en República Dominicana',
    seoTitle: 'Precio de la pintura en República Dominicana 2026 · por galón y zona',
    seoDesc: 'Precio actualizado de la pintura (acrílica, de aceite, selladores) en RD por galón y por zona. Datos de la comunidad de Precios Obra.',
    intro: 'Precio de la pintura de construcción en RD por tipo (acrílica, de aceite, selladores) y por zona, según los reportes de la comunidad. Se cotiza por galón o cubeta.',
    porque: 'El precio de la pintura en RD depende del tipo (acrílica, esmalte, selladora), la calidad y el rendimiento por galón. Una pintura más cara suele rendir más metros cuadrados por galón, así que conviene comparar el costo por m² pintado, no solo el del envase.',
  },
  {
    slug: 'madera',
    nombre: 'Madera',
    queries: ['madera', 'tablon', 'plywood'],
    emoji: '🪵',
    unidad: 'unidad',
    h1: 'Precio de la madera en República Dominicana',
    seoTitle: 'Precio de la madera en República Dominicana 2026 · por zona',
    seoDesc: 'Precio actualizado de la madera de construcción (tablones, plywood, listones) en RD por zona. Datos de la comunidad de Precios Obra.',
    intro: 'Precio de la madera de construcción en RD por tipo (tablones, plywood, listones para encofrado) y por zona, según los reportes de la comunidad.',
    porque: 'El precio de la madera en RD depende del tipo y la escuadría, de si es nacional o importada, y de la zona. La madera de encofrado se cotiza aparte de la de terminación.',
  },
  {
    slug: 'zinc',
    nombre: 'Zinc y techado',
    queries: ['zinc'],
    emoji: '🏠',
    unidad: 'unidad',
    h1: 'Precio del zinc para techos en República Dominicana',
    seoTitle: 'Precio del zinc para techos en RD 2026 · láminas por zona',
    seoDesc: 'Precio actualizado de las láminas de zinc para techo en República Dominicana por calibre y por zona. Datos de la comunidad de Precios Obra.',
    intro: 'Precio de las láminas de zinc para techo en RD por calibre y largo, y por zona, según los reportes de la comunidad de Precios Obra.',
    porque: 'El precio del zinc en RD varía por calibre (a menor número, más grueso y más caro), por el largo de la lámina y por la zona. El zinc más grueso dura más pero cuesta más por lámina.',
  },
]

const fmtHoy = () => {
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
    'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
  const d = new Date()
  return `${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}`
}

// Trae items del catálogo (solo MATERIAL) para un término de búsqueda.
async function fetchItems(query) {
  const url = `${API_BASE}/items?q=${encodeURIComponent(query)}&tipo_recurso=MATERIAL&limit=1000`
  try {
    const res = await fetch(url)
    if (!res.ok) return []
    return await res.json()
  } catch (e) {
    console.warn(`[precios] no se pudo leer "${query}":`, e.message)
    return []
  }
}

// Agrupa las filas (una por zona) en productos con precio por zona.
function agrupar(filas) {
  const byProd = new Map()
  for (const it of filas) {
    const key = it.codigo || `${it.nombre}|${it.familia_id}|${it.unidad}`
    if (!byProd.has(key)) {
      byProd.set(key, {
        codigo: it.codigo || null,
        nombre: it.nombre,
        unidad: it.unidad || '',
        marca: it.marca || '',
        familia_id: it.familia_id,
        fecha: (it.fecha_actualizacion || '').slice(0, 10),
        zonas: {},
      })
    }
    const p = byProd.get(key)
    const precio = Number(it.precio_actual)
    if (Number.isFinite(precio) && precio > 0) p.zonas[it.zona_id] = precio
    const f = (it.fecha_actualizacion || '').slice(0, 10)
    if (f > p.fecha) p.fecha = f
  }
  // Promedio del producto entre las zonas con precio.
  for (const p of byProd.values()) {
    const vals = Object.values(p.zonas)
    p.prom = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
  }
  return [...byProd.values()]
    .filter((p) => p.prom != null)
    .sort((a, b) => (a.prom || 0) - (b.prom || 0))
}

// Mediana: valor típico robusto a extremos (mejor que el promedio cuando el
// material mezcla sub-tipos de precio muy distinto, ej. cemento gris vs blanco).
function mediana(vals) {
  const s = vals.filter(Number.isFinite).slice().sort((a, b) => a - b)
  if (!s.length) return null
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

// Estadísticas por zona (mediana de todos los productos en esa zona).
function statsPorZona(productos) {
  return ZONAS.map((z) => {
    const vals = productos.map((p) => p.zonas[z.id]).filter((v) => Number.isFinite(v))
    return { ...z, prom: mediana(vals), n: vals.length }
  })
}

// Devuelve todos los datos agregados de un material por su slug.
export async function getMaterial(slug) {
  const def = MATERIALES.find((m) => m.slug === slug)
  if (!def) return null

  // Varias búsquedas → se unen deduplicando por id de fila.
  const listas = await Promise.all(def.queries.map(fetchItems))
  const byId = new Map()
  for (const lista of listas) for (const it of lista) byId.set(it.id, it)
  const productos = agrupar([...byId.values()])

  // Todos los precios individuales (producto × zona) para rango + mediana.
  const todosLosPrecios = productos.flatMap((p) => Object.values(p.zonas)).filter((v) => Number.isFinite(v))
  const tipico = mediana(todosLosPrecios)
  const minPrecio = todosLosPrecios.length ? Math.min(...todosLosPrecios) : null
  const maxPrecio = todosLosPrecios.length ? Math.max(...todosLosPrecios) : null

  return {
    ...def,
    productos,
    zonaStats: statsPorZona(productos),
    tipico,
    minPrecio,
    maxPrecio,
    nProductos: productos.length,
    actualizado: fmtHoy(),
  }
}

// Lista para el índice /precios y para getStaticPaths.
export function listarMateriales() {
  return MATERIALES.map(({ slug, nombre, emoji, h1 }) => ({ slug, nombre, emoji, h1 }))
}
