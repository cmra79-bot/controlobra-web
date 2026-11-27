// Permisos y trámites de construcción en RD, con su fuente oficial.
//
// Mismo patrón que los enlaces a ferreterías de la app: cada valor guarda el
// enlace a la página oficial de donde sale y la fecha en que se revisó. No se
// lee solo (son PDF y páginas que cambian de formato pocas veces al año): se
// cargan a mano. Para actualizar, abrir cada `url`, comparar y cambiar el valor
// y `REVISADO`.

export const REVISADO = '2026-11-27'

export const FUENTES = {
  licencia: {
    nombre: 'MIVHED · Licencia de construcción y permisos asociados',
    url: 'https://mivhed.gob.do/permisos-y-licencias-de-construccion/licencia-de-construccion-y-permisos-asociados/',
  },
  tasas: {
    nombre: 'MIVHED · Actualización de tasas por servicios (PDF, junio 2026)',
    url: 'https://mivhed.gob.do/wp-content/uploads/2026/06/MIVHED-Actualizacion-Tasas.pdf',
  },
  vuc: {
    nombre: 'Ventanilla Única de Construcción (VUC)',
    url: 'https://www.vuc.gob.do/home',
  },
  profesionales: {
    nombre: 'MIVHED · Listado de profesionales habilitados',
    url: 'https://mivhed.gob.do/catalogo-de-servicios/listado-de-profesionales-habilitados/',
  },
}

// Lo que se paga por la licencia de una obra. `tipo`: 'fijo' (RD$), 'pct'
// (% del valor de la construcción), 'exento'. `cobra`: quién lo cobra.
export const TASAS = [
  { id: 'solicitud', nombre: 'Solicitud de licencia de construcción', cobra: 'MIVHED', tipo: 'fijo', valor: 6000, fuente: 'licencia' },
  { id: 'ayuntamiento', nombre: 'Arbitrio del ayuntamiento', cobra: 'Ayuntamiento del municipio', tipo: 'pct', valor: 2.5, fuente: 'licencia',
    nota: 'Del valor de la construcción. Se paga directo en el ayuntamiento.' },
  { id: 'codia', nombre: 'Arbitrio del CODIA', cobra: 'CODIA', tipo: 'pct', valor: 2, fuente: 'licencia',
    nota: 'Del valor de la construcción. Se paga directo en el CODIA.' },
  { id: 'licencia', nombre: 'Certificación y licencia de construcción', cobra: 'MIVHED', tipo: 'pct', valor: 0.1, fuente: 'tasas',
    nota: 'Del valor tasado, solo cuando pasa de RD$6,000,000.', desde: 6_000_000 },
  { id: 'inspeccion', nombre: 'Inspección por etapa (vivienda hasta 2 niveles)', cobra: 'MIVHED', tipo: 'fijo', valor: 3300, fuente: 'tasas',
    nota: 'Cada inspección, vertical (muros y columnas) u horizontal (losas, vigas, zapatas), por nivel.' },
  { id: 'final', nombre: 'Inspección final', cobra: 'MIVHED', tipo: 'fijo', valor: 11000, fuente: 'tasas',
    nota: 'Más un cargo por m² construido que depende del tipo de proyecto (ver el PDF).' },
]

// Otros servicios del MIVHED (tabla de tasas).
export const OTRAS = [
  { nombre: 'Vivienda de bajo costo (licencia)', valor: null, fuente: 'tasas' },
  { nombre: 'Permiso de inicio de obra', valor: null, fuente: 'tasas' },
  { nombre: 'Autorización de trabajo previo (obras preliminares)', valor: null, fuente: 'tasas' },
  { nombre: 'Renovación de la licencia', valor: 5700, fuente: 'tasas' },
  { nombre: 'Modificación de la licencia', valor: 8500, fuente: 'tasas' },
  { nombre: 'Certificación de la licencia', valor: 8500, fuente: 'tasas' },
  { nombre: 'Duplicado de la licencia', valor: 5000, fuente: 'tasas' },
  { nombre: 'Copia del expediente', valor: 5000, fuente: 'tasas' },
  { nombre: 'Resellado de planos (cada hoja)', valor: 500, fuente: 'tasas' },
  { nombre: 'Derecho de vía y drenaje pluvial (residencial)', valor: 8500, fuente: 'tasas' },
]

// Requisitos de la licencia (resumidos de la página del MIVHED).
export const REQUISITOS = [
  'Título de propiedad definitivo y plano de mensura catastral deslindado.',
  'Certificación de uso de suelo y retiros, y no objeción al proyecto (las da el ayuntamiento).',
  'Certificación o autorización ambiental del Ministerio de Medio Ambiente.',
  'Juego de planos arquitectónicos y técnicos de 24" × 36", sellados por el ayuntamiento.',
  'Memoria descriptiva, memoria de cálculo estructural y el archivo del modelo.',
  'Estudio de suelo hecho por una empresa habilitada por el MIVHED.',
  'Copia del carnet o certificado del CODIA del profesional responsable.',
  'Fotos del solar. Registro mercantil si el dueño es una empresa.',
]

export const PLAZOS = [
  { nombre: 'Licencia, proyecto no complejo (como una casa)', dias: 'hasta 60 días laborables' },
  { nombre: 'Licencia, proyecto complejo', dias: 'hasta 120 días laborables' },
  { nombre: 'Autorización de obras preliminares', dias: '5 a 10 días laborables' },
  { nombre: 'Inicio de obra parcial', dias: '5 días laborables' },
]

/**
 * Costo de la licencia de una vivienda de `niveles` niveles con `valor` RD$ de
 * construcción. Inspecciones: una vertical y una horizontal por nivel, más las
 * zapatas, más la final (sin el cargo por m²).
 */
export function costoPermisos(valor, niveles = 1) {
  const filas = TASAS.map((t) => {
    let monto = 0
    if (t.tipo === 'pct') monto = t.desde && valor <= t.desde ? 0 : (valor * t.valor) / 100
    else if (t.id === 'inspeccion') monto = t.valor * (2 * niveles + 1)
    else monto = t.valor
    return { ...t, monto }
  })
  return { filas, total: filas.reduce((s, f) => s + f.monto, 0) }
}

export const fechaRevisado = () => {
  const [a, m, d] = REVISADO.split('-').map(Number)
  return new Date(a, m - 1, d).toLocaleDateString('es-DO', { day: 'numeric', month: 'long', year: 'numeric' })
}
