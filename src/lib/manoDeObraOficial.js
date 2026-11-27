// Mano de obra oficial de la construcción en RD, con su fuente oficial.
//
// Mismo patrón que src/lib/permisos.js: cada valor guarda el enlace a la
// resolución del Comité Nacional de Salarios (CNS) de donde sale y la fecha en
// que se revisó. Se cargan a mano (son PDF del Ministerio de Trabajo). Para
// actualizar: abrir cada `url`, comparar, cambiar el valor y `REVISADO`.

export const REVISADO = '2026-11-27'

const MT = 'https://mt.gob.do/transparencia/wp-content/uploads/sites/2/2026/08/'

export const LISTADO_OFICIAL = 'https://mt.gob.do/transparencia/?folder=645'
export const NOTA_OFICIAL = 'https://mt.gob.do/gobierno-acuerda-aumento-de-20-al-salario-minimo-de-los-trabajadores-de-la-construccion/'

export const RESOLUCION_SALARIOS = {
  numero: 'CNS-04-2026',
  nombre: 'Salario mínimo del sector construcción y sus afines',
  fecha: '2 de junio de 2026',
  url: `${MT}CNS-04-2026-CONSTRUCCION-Y-AFINES-Hora-Hombre.pdf`,
}

// Tarifa mínima por categoría. `antes`: Resolución 03/2024. `vigente`: tramo a)
// (+12 %, desde que entró en vigor). `jun2027`: tramo b) (+20 % sobre el
// anterior, desde el 1 de junio de 2027).
export const CATEGORIAS = [
  { nombre: 'Trabajador no calificado', antes: 980.59, vigente: 1098.26, jun2027: 1176.71 },
  { nombre: 'Trabajador calificado', antes: 1072.85, vigente: 1201.59, jun2027: 1287.42 },
  { nombre: 'Ayudante', antes: 1260.34, vigente: 1411.59, jun2027: 1512.41 },
  { nombre: 'Operario de 3ra categoría', antes: 1636.80, vigente: 1833.22, jun2027: 1964.16 },
  { nombre: 'Operario de 2da categoría', antes: 1867.44, vigente: 2091.53, jun2027: 2240.93 },
  { nombre: 'Operario de 1ra categoría', antes: 2334.67, vigente: 2614.83, jun2027: 2801.60 },
  { nombre: 'Maestro de cada una de las áreas', antes: 2941.78, vigente: 3294.79, jun2027: 3530.13 },
]

// Tarifas a destajo (por trabajo hecho) de cada oficio. `ejemplo`: una partida
// de muestra leída de la resolución; las tablas completas están en el PDF.
export const DESTAJO = [
  { oficio: 'Albañiles', numero: 'CNS-05-2026', url: `${MT}CNS-05-2026-ALBANILES-en-el-Area-de-la-Contruccion-1.pdf`,
    trae: 'Colocación de block, pañete, fino, pisos, revestimientos y más.' },
  { oficio: 'Varilleros', numero: 'CNS-06-2026', url: `${MT}RESOLUCION-CNS-06-2026-Varilleros-a-destajo-en-el-area-de-la-Construccion.pdf`,
    trae: 'Corte, doblado y colocación de acero.' },
  { oficio: 'Pintores', numero: 'CNS-07-2026', url: `${MT}CNS-07-2026-PINTORES-EN-EL-AREA-DE-LA-CONSTRUCCION.pdf`,
    trae: 'Pintura de agua, aceite, barnices e impermeabilizantes, por m² y por mano.',
    ejemplo: { partida: 'Pintura de agua, primera mano', unidad: 'm²', vigente: 54.25, jun2027: 58.12 } },
  { oficio: 'Plomeros', numero: 'CNS-08-2026', url: `${MT}CNS-08-2026-PLOMEROS-en-el-Area-de-la-Construccion.pdf`,
    trae: 'Aparatos sanitarios, desagües, tuberías, cisternas y tinacos.',
    ejemplo: { partida: 'Inodoro corriente de dos cuerpos', unidad: 'unidad', vigente: 1768.14, jun2027: 1894.44 } },
  { oficio: 'Electricistas', numero: 'CNS-09-2026', url: `${MT}CNS-09-2026-ELECTRICISTAS-EN-EL-AREA-DE-LA-CONSTRUCCION.pdf`,
    trae: 'Salidas de luz, tomas e interruptores, por salida.',
    ejemplo: { partida: 'Salida en tubería oculta de 1/2"', unidad: 'salida', vigente: 982.71, jun2027: 1052.90 } },
  { oficio: 'Carpinteros', numero: 'CNS-10-2026', url: `${MT}CNS-10-2026-Carpinteros-a-destajo-en-el-Area-de-la-Construccion_0001.pdf`,
    trae: 'Encofrados de columnas, vigas y losas, puertas, marcos y techos.',
    ejemplo: { partida: 'Moldes para columnas, 2 topes, hasta 0.10 m', unidad: 'ml', vigente: 364.43, jun2027: 390.48 } },
]

export const fechaRevisado = () => {
  const [a, m, d] = REVISADO.split('-').map(Number)
  return new Date(a, m - 1, d).toLocaleDateString('es-DO', { day: 'numeric', month: 'long', year: 'numeric' })
}
