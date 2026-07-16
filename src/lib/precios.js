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
  {
    slug: 'tuberia',
    nombre: 'Tubería PVC',
    queries: ['tubo', 'tubería'],
    emoji: '🚰',
    unidad: 'unidad',
    h1: 'Precio de la tubería PVC en República Dominicana',
    seoTitle: 'Precio de la tubería PVC en RD 2026 · por diámetro y zona',
    seoDesc: 'Precio actualizado de la tubería PVC (hidrosanitaria y eléctrica) en República Dominicana por diámetro y por zona. Datos de la comunidad de Precios Obra.',
    intro: 'Precio de la tubería PVC en RD por diámetro y uso (drenaje, agua potable, eléctrica), y por zona, según los reportes de la comunidad de Precios Obra.',
    porque: 'El precio de la tubería PVC en RD depende del diámetro, del tipo (sanitaria, presión o eléctrica), del espesor de pared (SDR) y de la marca. A mayor diámetro y presión, mayor precio por tramo.',
  },
  {
    slug: 'cable',
    nombre: 'Cable eléctrico',
    queries: ['cable'],
    emoji: '🔌',
    unidad: 'unidad',
    h1: 'Precio del cable eléctrico en República Dominicana',
    seoTitle: 'Precio del cable eléctrico en RD 2026 · por calibre y zona',
    seoDesc: 'Precio actualizado del cable eléctrico (THHN, dúplex) en República Dominicana por calibre (AWG) y por zona. Datos de la comunidad de Precios Obra.',
    intro: 'Precio del cable eléctrico en RD por calibre (AWG) y tipo (THHN, dúplex, encauchetado), y por zona, según los reportes de la comunidad de Precios Obra.',
    porque: 'El precio del cable eléctrico en RD sigue de cerca el cobre internacional y varía por calibre (a menor número AWG, más grueso y más caro), por tipo de aislamiento y por la longitud del rollo.',
  },
  {
    slug: 'piso',
    nombre: 'Piso y porcelanato',
    queries: ['piso', 'porcelanato', 'cerámica'],
    emoji: '◻️',
    unidad: 'm²',
    h1: 'Precio del piso y porcelanato en República Dominicana',
    seoTitle: 'Precio del piso y porcelanato en RD 2026 · por m² y zona',
    seoDesc: 'Precio actualizado del piso cerámico y porcelanato en República Dominicana por metro cuadrado y por zona. Datos de la comunidad de Precios Obra.',
    intro: 'Precio del piso cerámico y porcelanato en RD por formato y calidad, y por zona, según los reportes de la comunidad de Precios Obra. Se cotiza por metro cuadrado.',
    porque: 'El precio del piso en RD depende del tipo (cerámica nacional, porcelanato importado), el formato de la pieza, el acabado (mate, pulido, rectificado) y la marca. El porcelanato de gran formato suele ser el más caro por m².',
  },
  {
    slug: 'sanitarios',
    nombre: 'Aparatos sanitarios',
    queries: ['inodoro', 'lavamanos', 'sanitario'],
    emoji: '🚽',
    unidad: 'unidad',
    h1: 'Precio de los aparatos sanitarios en República Dominicana',
    seoTitle: 'Precio de inodoros y lavamanos en RD 2026 · por zona',
    seoDesc: 'Precio actualizado de aparatos sanitarios (inodoros, lavamanos) en República Dominicana por zona. Datos de la comunidad de Precios Obra.',
    intro: 'Precio de los aparatos sanitarios en RD —inodoros, lavamanos y accesorios de baño— por tipo y por zona, según los reportes de la comunidad de Precios Obra.',
    porque: 'El precio de los aparatos sanitarios en RD depende de la marca, el tipo (one-piece, dos piezas, colgado), el acabado y si incluye grifería. Las líneas importadas de alta gama elevan bastante el precio por pieza.',
  },
  {
    slug: 'puertas',
    nombre: 'Puertas',
    queries: ['puerta'],
    emoji: '🚪',
    unidad: 'unidad',
    h1: 'Precio de las puertas en República Dominicana',
    seoTitle: 'Precio de las puertas en RD 2026 · madera y metal por zona',
    seoDesc: 'Precio actualizado de puertas (madera, metálicas, de baño) en República Dominicana por tipo y por zona. Datos de la comunidad de Precios Obra.',
    intro: 'Precio de las puertas en RD por material (madera, metálica, PVC) y tipo (principal, interior, de baño), y por zona, según los reportes de la comunidad de Precios Obra.',
    porque: 'El precio de una puerta en RD depende del material (madera maciza, MDF, metálica), del tamaño, del tipo (principal, interior, closet) y de si viene con marco y herrajes.',
  },
]

// Filtros de calidad por material: la búsqueda por palabra clave arrastra ruido
// (accesorios, ítems de otra categoría, servicios). Se limpia por slug:
//   soloUnidad: solo estas unidades  ·  incluir: el nombre debe contener alguno
//   excluir: descarta si el nombre contiene alguno (todo en minúsculas)
const FILTROS = {
  varilla:    { excluir: ['roscada'] },
  arena:      { excluir: ['acrílica', 'acrilica', 'pintura', 'spray'] },
  block:      { excluir: ['mortero'] },
  pintura:    { excluir: ['spray', 'spary', 'brocha', 'rodillo', 'removedor', 'diluyente'] },
  madera:     { excluir: ['clip', 'pincel', 'formaleta', 'tornillo', 'brocha', 'sierra', 'lija', 'espátula', 'espatula', 'llana', 'regla', 'mango', 'nivel', 'flexómetro'] },
  zinc:       { excluir: ['rejilla', 'puntilla', 'desagüe', 'tornillo'] },
  tuberia:    { incluir: ['pvc'], excluir: ['destupidor'] },
  cable:      { excluir: ['acero', 'coaxial', ' tv', 'utp', 'sujetador', 'tensor', 'conector', 'salida'] },
  piso:       { soloUnidad: ['M²', 'M2'], excluir: ['lavado', 'cristalizado', 'pulido'] },
  sanitarios: { incluir: ['inodoro', 'lavamanos'], excluir: ['arandela', 'cera', 'mueble', 'tornillo', 'asiento', 'llave', 'grifo', 'desagüe', 'sifón', 'sifon', 'abrazadera', 'cola de', 'manguera', 'flexible', 'tapón', 'limpiador', 'pera'] },
  puertas:    { incluir: ['puerta'], excluir: ['alarma', 'tirador', 'guia', 'guía', 'bisagra', 'cerradura', 'pomo', 'breaker', 'caja', 'circuito', 'gabinete', 'sensor', 'brazo', 'rueda', 'tope', 'riel', 'fuelle', 'burlete'] },
}

function pasaFiltro(it, f) {
  if (!f) return true
  const n = (it.nombre || '').toLowerCase()
  const u = (it.unidad || '').toUpperCase()
  if (f.soloUnidad && !f.soloUnidad.some((x) => x.toUpperCase() === u)) return false
  if (f.incluir && !f.incluir.some((t) => n.includes(t))) return false
  if (f.excluir && f.excluir.some((t) => n.includes(t))) return false
  return true
}

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

  // Varias búsquedas → se unen deduplicando por id de fila, y se limpia el ruido.
  const listas = await Promise.all(def.queries.map(fetchItems))
  const filtro = FILTROS[slug]
  const byId = new Map()
  for (const lista of listas)
    for (const it of lista)
      if (pasaFiltro(it, filtro)) byId.set(it.id, it)
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

// ---------------------------------------------------------------------------
// SISTEMA DE CATEGORÍAS — cubre TODA la base (7.6k ítems) con ~30 páginas, una
// por familia, en vez de una por ítem (que penalizaría SEO). Materiales, mano
// de obra, equipos, encofrados, aceros, tubería, etc.
// ---------------------------------------------------------------------------

// Estilo por tipo de recurso (idéntico a la app pública).
export const TIPOS = {
  MATERIAL:   { label: 'Material',      color: 'var(--t-material)',   bg: 'var(--t-material-bg)' },
  MANO_OBRA:  { label: 'Mano de obra',  color: 'var(--t-mo)',         bg: 'var(--t-mo-bg)' },
  EQUIPOS:    { label: 'Equipos',       color: 'var(--t-equipos)',    bg: 'var(--t-equipos-bg)' },
  TODO_COSTO: { label: 'Subcontratos',  color: 'var(--t-todo)',       bg: 'var(--t-todo-bg)' },
  TRANSPORTE: { label: 'Transporte',    color: 'var(--t-transporte)', bg: 'var(--t-transporte-bg)' },
}
export const ORDEN_TIPOS = ['MATERIAL', 'MANO_OBRA', 'EQUIPOS', 'TODO_COSTO', 'TRANSPORTE']

// Nombres SEO amigables por familia de la BD (mayúsculas técnicas → legible).
const CAT_NOMBRES = {
  'HIDROSANITARIAS': 'Plomería e hidrosanitario',
  'ELECTRICOS': 'Instalación eléctrica',
  'ACCESORIOS': 'Accesorios de construcción',
  'PINTURAS': 'Pintura (mano de obra)',
  'SISTEMAS LIVIANOS': 'Sistemas livianos y drywall',
  'EQUIPOS SANITARIOS': 'Equipos sanitarios',
  'PISOS': 'Colocación de pisos',
  'CARPINTERIA MADERA': 'Carpintería en madera',
  'HERRAMIENTA MENOR': 'Herramienta menor',
  'EQUIPOS': 'Equipos y maquinaria',
  'ENCOFRADOS': 'Encofrados',
  'ESTRUCTURA METÀLICAS': 'Estructuras metálicas',
  'ACEROS': 'Aceros y armado',
  'APARATOS SANITARIOS': 'Aparatos sanitarios (instalación)',
  'TERMINACIONES': 'Terminaciones',
  'REVESTIMIENTOS': 'Revestimientos',
  'URBANISMO': 'Urbanismo',
  'HORMIGONES': 'Hormigones',
  'JARDINERÍA': 'Jardinería',
  'ILUMINACIÓN': 'Iluminación',
  'SEÑALIZACIÓN': 'Señalización',
  'TRANSPORTE': 'Transporte y fletes',
  'MAMPOSTERIA': 'Mampostería',
  'CEMENTOS - MORTEROS': 'Cementos y morteros',
  'AGREGADOS': 'Agregados (arena y grava)',
  'ADITIVOS': 'Aditivos para hormigón',
  'DOTACION': 'Dotación y seguridad',
  'CARPINTERIA ALUMINIO': 'Carpintería de aluminio',
  'PRELIMINARES': 'Preliminares de obra',
  'JORNALES': 'Jornales',
}

function slugify(s) {
  const CM = new RegExp('[' + String.fromCharCode(0x300) + '-' + String.fromCharCode(0x36f) + ']', 'g')
  return (s || '')
    .toLowerCase()
    .normalize('NFD').replace(CM, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
function titulizar(s) {
  const t = (s || '').toLowerCase()
  return t.charAt(0).toUpperCase() + t.slice(1)
}

// Mínimo de productos para que una categoría tenga página propia.
const MIN_CAT = 12

// Memo del catálogo completo (una sola descarga por build).
let _allPromise = null
function fetchAll() {
  if (!_allPromise) {
    _allPromise = (async () => {
      const out = []
      for (let off = 0; off < 12000; off += 1000) {
        let batch = []
        try {
          const res = await fetch(`${API_BASE}/items?limit=1000&offset=${off}`)
          if (res.ok) batch = await res.json()
        } catch { batch = [] }
        out.push(...batch)
        if (batch.length < 1000) break
      }
      return out
    })()
  }
  return _allPromise
}

let _famPromise = null
function fetchFamilias() {
  if (!_famPromise) {
    _famPromise = (async () => {
      try {
        const res = await fetch(`${API_BASE}/familias`)
        return res.ok ? await res.json() : []
      } catch { return [] }
    })()
  }
  return _famPromise
}

// Lista de categorías con datos (para el índice y getStaticPaths).
export async function getCategorias() {
  const [items, familias] = await Promise.all([fetchAll(), fetchFamilias()])
  const famById = Object.fromEntries(familias.map((f) => [f.id, f]))
  const conteo = new Map()
  for (const it of items) {
    const key = it.familia_id
    if (!conteo.has(key)) conteo.set(key, { productos: new Set(), tipo: it.tipo_recurso })
    conteo.get(key).productos.add(it.codigo || it.nombre)
  }
  const cats = []
  for (const [famId, { productos, tipo }] of conteo) {
    const fam = famById[famId]
    if (!fam) continue
    const n = productos.size
    if (n < MIN_CAT) continue
    const nombre = CAT_NOMBRES[fam.nombre] || titulizar(fam.nombre)
    cats.push({
      slug: slugify(fam.nombre),
      famId,
      nombre,
      tipo: tipo || fam.tipo_recurso || 'MATERIAL',
      nProductos: n,
    })
  }
  return cats.sort((a, b) => b.nProductos - a.nProductos)
}

// Datos completos de una categoría por slug.
export async function getCategoria(slug) {
  const cats = await getCategorias()
  const def = cats.find((c) => c.slug === slug)
  if (!def) return null
  const items = await fetchAll()
  const filas = items.filter((it) => it.familia_id === def.famId)
  const todos = agrupar(filas)
  // Orden alfabético para catálogo; cap para no generar páginas gigantes.
  const MAX = 140
  const ordenados = [...todos].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
  return {
    ...def,
    productos: ordenados.slice(0, MAX),
    total: todos.length,
    truncado: todos.length > MAX,
    tipoLabel: (TIPOS[def.tipo] || TIPOS.MATERIAL).label,
    actualizado: fmtHoy(),
  }
}

// Páginas-resumen "los 30 principales por tipo" (materiales, equipos, mano de
// obra, subcontratos). Selección: productos con más cobertura de zonas y más
// recientes (no hay señal de popularidad en la BD).
export const TIPO_RESUMEN = {
  MATERIAL:   { slug: 'materiales',   nombre: 'materiales de construcción', emoji: '🧱',
                seoTitle: 'Precios de los materiales de construcción más usados en RD 2026',
                intro: 'Los precios de los principales materiales de construcción en República Dominicana, por zona, según los reportes de la comunidad de Precios Obra.' },
  EQUIPOS:    { slug: 'equipos',      nombre: 'equipos y maquinaria', emoji: '🚜',
                seoTitle: 'Precios de equipos y maquinaria de construcción en RD 2026',
                intro: 'Los precios de alquiler y compra de equipos y maquinaria de construcción en RD, por zona, según los reportes de la comunidad de Precios Obra.' },
  MANO_OBRA:  { slug: 'mano-de-obra', nombre: 'mano de obra', emoji: '👷',
                seoTitle: 'Precios de mano de obra de construcción en RD 2026',
                intro: 'Los precios de la mano de obra de construcción en República Dominicana (por partida y actividad), por zona, según los reportes de la comunidad de Precios Obra.' },
  TODO_COSTO: { slug: 'subcontratos', nombre: 'subcontratos', emoji: '📋',
                seoTitle: 'Precios de subcontratos de construcción en RD 2026',
                intro: 'Los precios de subcontratos de construcción en RD (partidas a todo costo: material + mano de obra), por zona, según los reportes de la comunidad de Precios Obra.' },
}

export async function getTopPorTipo(slug, n = 30) {
  const entry = Object.entries(TIPO_RESUMEN).find(([, v]) => v.slug === slug)
  if (!entry) return null
  const [tipo, def] = entry
  const items = await fetchAll()
  const productos = agrupar(items.filter((it) => it.tipo_recurso === tipo))
  // Selección: más zonas primero, luego más reciente.
  const zc = (p) => Object.keys(p.zonas).length
  const ranked = [...productos].sort((a, b) => zc(b) - zc(a) || (b.fecha || '').localeCompare(a.fecha || ''))
  const top = ranked.slice(0, n).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
  return {
    tipo, ...def,
    productos: top,
    total: productos.length,
    mostrados: top.length,
    actualizado: fmtHoy(),
  }
}

// Estadísticas del catálogo para la tarjeta "Estado del catálogo".
export async function getStats() {
  try {
    const res = await fetch(`${API_BASE}/stats`)
    if (!res.ok) return null
    const s = await res.json()
    const act30 = (s.zonas || []).reduce((a, z) => a + (z.actualizados_30d || 0), 0)
    return { total: s.items_total || 0, act30, contribuidores: s.contribuidores_activos || 0 }
  } catch { return null }
}

// ---------------------------------------------------------------------------
// Costo de construcción — alimenta la guía "cuánto cuesta construir una casa".
// Usa la MISMA configuración que la calculadora pública (bases, factores,
// indirectos, ITBIS), leída en build, para que los números coincidan exactos.
// ---------------------------------------------------------------------------

// Valores de respaldo si la API no responde en build (mismos que la config real).
const CALC_FALLBACK = {
  bases: [{ nombre: 'Casa 1 nivel', precio: 54000 }],
  niveles: [
    { nombre: 'Básico', factor: 0.85 },
    { nombre: 'Estándar', factor: 1 },
    { nombre: 'Premium', factor: 1.35 },
  ],
  zonas: [{ nombre: 'Norte', factor: 1 }],
  indirectos: [
    { nombre: 'Dirección técnica', pct: 5 },
    { nombre: 'Gastos administrativos', pct: 4 },
    { nombre: 'Seguros y fianzas', pct: 2 },
    { nombre: 'Imprevistos', pct: 5 },
    { nombre: 'Utilidad', pct: 8 },
  ],
}

async function fetchCalcConfig() {
  try {
    const res = await fetch(`${API_BASE}/calculadora-config`)
    if (!res.ok) return CALC_FALLBACK
    const r = await res.json()
    const d = r?.data
    return d && d.bases?.length ? d : CALC_FALLBACK
  } catch {
    return CALC_FALLBACK
  }
}

// Costo por m² con el mismo modelo de la calculadora:
//   directo = base × factorNivel × factorZona
//   indirecto = directo × (Σ indirectos %)
//   ITBIS = (directo + indirecto) × 10% × 18%
function costoM2(cfg, { basePrecio, factorNivel, factorZona }) {
  const directo = basePrecio * factorNivel * factorZona
  const indPct = (cfg.indirectos || []).reduce((s, i) => s + (Number(i.pct) || 0), 0) / 100
  const indirecto = directo * indPct
  const itbis = (directo + indirecto) * 0.1 * 0.18
  return { directo, indirecto, itbis, total: directo + indirecto + itbis }
}

// Devuelve los datos de la guía: costo/m² por terminación (Casa 1 nivel, zona
// Norte de referencia) + totales de ejemplo para tamaños de casa comunes.
export async function getCostoConstruccion() {
  const cfg = await fetchCalcConfig()
  const casa = (cfg.bases || []).find((b) => /casa\s*1|casa\s*un/i.test(b.nombre)) || cfg.bases[0]
  const norte = (cfg.zonas || []).find((z) => /norte/i.test(z.nombre)) || { factor: 1 }
  const indPct = (cfg.indirectos || []).reduce((s, i) => s + (Number(i.pct) || 0), 0)

  const porTerminacion = (cfg.niveles || []).map((n) => ({
    nombre: n.nombre,
    factor: Number(n.factor) || 1,
    ...costoM2(cfg, { basePrecio: casa.precio, factorNivel: Number(n.factor) || 1, factorZona: norte.factor }),
  }))

  const estandar = porTerminacion.find((t) => /est[aá]ndar/i.test(t.nombre)) || porTerminacion[0]
  const tamanos = [80, 120, 150, 200, 300].map((m2) => ({ m2, total: estandar.total * m2 }))

  return {
    baseNombre: casa.nombre,
    basePrecio: casa.precio,
    indirectoPct: indPct,
    porTerminacion,
    estandar,
    tamanos,
    actualizado: fmtHoy(),
  }
}
