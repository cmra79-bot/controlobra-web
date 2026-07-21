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
    seoTitle: 'Precio del cemento en RD 2026 · funda de cemento gris y blanco por zona',
    seoDesc: 'Precio de la funda de cemento gris y blanco en República Dominicana, por zona. Cemento gris de 94 lb desde RD$ 535 la funda. Datos de la comunidad de Precios Obra.',
    intro: 'Precio de la funda de cemento gris y blanco en República Dominicana, por zona (Cibao Norte, Sur y Este) y por presentación, según los reportes de la comunidad de Precios Obra. El cemento es el material líder de toda obra: representa más del 90% del uso en construcción.',
    porque: 'El precio de la funda de cemento en RD depende de la zona (el flete lo encarece lejos de las plantas del Cibao y el Gran Santo Domingo), la presentación (gris de 94 lb, blanco de 40 kg) y el volumen de compra: comprar por palé o camión baja el precio por funda entre 5% y 12%.',
    notaTitulo: 'Precio del cemento por funda y por palé',
    nota: 'El <strong>cemento</strong> es el material líder de toda obra en RD: representa más del <strong>90% del uso</strong> en construcción. Se vende por <strong>funda (saco)</strong>: el <strong>cemento gris</strong> viene en fundas de <strong>94 libras (~42.6 kg)</strong> y el <strong>cemento blanco</strong> en fundas de <strong>40 kg</strong>. Según la comunidad, la funda de <strong>cemento gris</strong> ronda los <strong>RD$ 535</strong> y la de <strong>cemento blanco</strong> los <strong>RD$ 1,495</strong>. Comprar por <strong>palé</strong> baja el precio por funda entre 5% y 12%.',
    faq: [
      { q: '¿A cómo está la funda de cemento gris en RD?', a: 'La funda de <strong>cemento gris de 94 lb</strong> ronda los <strong>RD$ 535</strong> en República Dominicana, según los reportes de la comunidad. El precio varía por zona, marca y volumen (por palé sale más barato).' },
      { q: '¿Cuánto pesa una funda de cemento?', a: 'La funda de <strong>cemento gris</strong> pesa <strong>94 libras (~42.6 kg)</strong> y la de <strong>cemento blanco</strong>, <strong>40 kg</strong>. Es la presentación estándar en RD.' },
      { q: '¿Cuál es la diferencia entre cemento gris y blanco?', a: 'El <strong>cemento gris</strong> es el de uso estructural general (concreto, morteros) y el más económico. El <strong>cemento blanco</strong> se usa para acabados, juntas y decoración, y cuesta bastante más por funda.' },
      { q: '¿Cuántas fundas de cemento lleva 1 m³ de concreto?', a: 'Un m³ de concreto estructural lleva aproximadamente <strong>7 a 9 fundas</strong> de cemento gris, más arena y grava.' },
    ],
  },
  {
    slug: 'varilla',
    nombre: 'Varilla de acero',
    queries: ['varilla'],
    emoji: '🔩',
    unidad: 'quintal',
    h1: 'Precio de la varilla de acero en República Dominicana',
    seoTitle: 'Precio de la varilla de acero en RD 2026 · por quintal (qq), libra y unidad',
    seoDesc: 'Precio de la varilla de acero en República Dominicana: por quintal (qq), por libra y por unidad. Grado 40-60 y calibres 3/8", 1/2", 5/8". Datos de la comunidad de Precios Obra.',
    intro: 'Precio de la varilla de acero de refuerzo en República Dominicana, por quintal (qq), por libra y por unidad, y por zona (Cibao Norte, Sur y Este). La varilla de acero es uno de los insumos que más pesa en el costo de una estructura, y en RD se cotiza sobre todo por quintal.',
    porque: 'El precio de la varilla de acero en RD sigue de cerca el acero internacional y el dólar, y varía por calibre (3/8", 1/2", 5/8"), por grado (40 o 60), por zona y por cantidad. La varilla se vende por quintal (peso) y por unidad (varillas de 20 pies), así que conviene comparar el precio por quintal y por libra antes de comprar. Además de la varilla, el acero incluye las mallas electrosoldadas (para losas de techo y pisos) y los perfiles metálicos.',
    notaTitulo: 'Precio de la varilla de acero por quintal (qq) y por libra',
    nota: 'En República Dominicana el <strong>acero</strong> y la <strong>varilla</strong> se cotizan sobre todo por <strong>quintal (qq)</strong> —una medida de peso— y también por <strong>unidad</strong> (varillas de 20 pies). Un <strong>quintal equivale a 100 libras (lb)</strong> y a unos <strong>45.4 kg</strong>. Con el precio reportado por la comunidad —alrededor de <strong>RD$ 3,300 por quintal</strong> para la varilla de acero grado 40-60— la <strong>libra de acero</strong> sale a unos <strong>RD$ 33</strong>. Los calibres más usados en RD son 3/8", 1/2" y 5/8", en grado 40 y 60.',
    faq: [
      { q: '¿A cómo está el quintal de varilla de acero en RD?', a: 'La varilla de acero grado 40-60 se cotiza alrededor de <strong>RD$ 3,300 por quintal (qq)</strong> en República Dominicana, según los reportes de la comunidad de Precios Obra. Como un quintal tiene 100 libras, la <strong>libra de acero</strong> sale a unos <strong>RD$ 33</strong>.' },
      { q: '¿Cuántas libras tiene un quintal de acero?', a: 'Un <strong>quintal (qq)</strong> equivale a <strong>100 libras (lb)</strong> y a aproximadamente <strong>45.36 kg</strong>. Es la unidad de peso más usada para vender el acero y la varilla en República Dominicana.' },
      { q: '¿Cómo se vende la varilla de acero en República Dominicana?', a: 'La varilla de acero en RD se vende por <strong>quintal</strong> (por peso) y por <strong>unidad</strong> (varillas de 20 pies). Los calibres más usados son <strong>3/8", 1/2" y 5/8"</strong>, en grado 40 y 60. El precio varía por calibre, grado, zona y cantidad.' },
      { q: '¿Cuánto pesa una varilla de acero?', a: 'El peso depende del calibre: una varilla de 3/8" de 20 pies pesa alrededor de 5.6 libras; una de 1/2", unas 10 libras; y una de 5/8", cerca de 15.6 libras. Por eso el acero se compra por quintal (100 libras).' },
      { q: '¿A cómo está la malla electrosoldada en RD?', a: 'La <strong>malla electrosoldada de acero</strong> (para losas y contrapisos) va desde unos <strong>RD$ 17,000 hasta RD$ 30,000 por rollo</strong>, según el calibre (D2.90, D2.70…) y el tamaño del rollo. Se usa en la <strong>losa de techo</strong> y en pisos.' },
    ],
  },
  {
    slug: 'arena',
    nombre: 'Arena',
    queries: ['arena'],
    emoji: '⛰️',
    unidad: 'm³',
    h1: 'Precio de la arena en República Dominicana',
    seoTitle: 'Precio de la arena en RD 2026 · arena lavada por m³ y zona',
    seoDesc: 'Precio de la arena de construcción (lavada, fina, gruesa) en RD por metro cúbico (m³) y por zona. Desde RD$ 1,973 el m³ de arena lavada. Datos de Precios Obra.',
    intro: 'Precio de la arena de construcción en RD por tipo (lavada, fina, gruesa) y por zona, según los reportes de la comunidad. La arena es la base para preparar el concreto y los morteros en obra; se cotiza por metro cúbico (m³) puesto en sitio.',
    porque: 'El precio de la arena en RD lo define sobre todo el transporte: mientras más lejos esté la obra del banco de arena o del río, más sube el flete. También cambia por tipo (fina, gruesa, de río o lavada) y por el volumen del pedido.',
    notaTitulo: 'Precio de la arena lavada por m³ y cuánta lleva el concreto',
    nota: 'La <strong>arena</strong> es la base para preparar el <strong>concreto</strong> y los morteros en obra. Se vende por <strong>metro cúbico (m³)</strong> puesto en obra. Según la comunidad, la <strong>arena lavada</strong> ronda los <strong>RD$ 1,973 el m³</strong> y la <strong>arena fina de pañete</strong> unos <strong>RD$ 2,423</strong>. Para <strong>1 m³ de concreto</strong> se usa aproximadamente <strong>0.5 m³ de arena</strong>, más grava y cemento.',
    faq: [
      { q: '¿A cómo está el metro cúbico de arena en RD?', a: 'El m³ de <strong>arena lavada</strong> ronda los <strong>RD$ 1,973</strong> en República Dominicana, según la comunidad. La arena fina de pañete cuesta un poco más (~RD$ 2,423/m³). Varía por zona y por el flete.' },
      { q: '¿Qué arena se usa para el concreto?', a: 'Para <strong>concreto</strong> se usa <strong>arena lavada o gruesa</strong>; para <strong>pañete y acabados</strong>, arena fina. La arena de río lavada da mejor resistencia al concreto.' },
      { q: '¿Cuánta arena lleva 1 m³ de concreto?', a: 'Un m³ de concreto estructural lleva aproximadamente <strong>0.5 m³ de arena</strong> y <strong>0.8 m³ de grava</strong>, más 7 a 9 fundas de cemento.' },
    ],
  },
  {
    slug: 'gravilla',
    nombre: 'Grava y gravilla',
    queries: ['grava', 'gravilla'],
    emoji: '🪨',
    unidad: 'm³',
    h1: 'Precio de la grava y gravilla en República Dominicana',
    seoTitle: 'Precio de la grava y gravilla en RD 2026 · por m³ y zona',
    seoDesc: 'Precio de la grava y gravilla en República Dominicana por metro cúbico (m³) y por zona. Grava triturada desde RD$ 1,846 el m³. Datos de la comunidad de Precios Obra.',
    intro: 'Precio de la grava y gravilla para concreto en RD por tipo y por zona, según los reportes de la comunidad. Son el agregado grueso base del concreto; se cotizan por metro cúbico (m³) puesto en obra.',
    porque: 'Como todo agregado pétreo, el precio de la grava en RD depende del transporte desde la cantera, del tamaño del árido y del volumen del pedido. En zonas turísticas del Este suele ser algo más alto por la demanda.',
    notaTitulo: 'Precio de la grava por m³ y cuánta lleva el concreto',
    nota: 'La <strong>grava y gravilla</strong> son el <strong>agregado grueso</strong> para el <strong>concreto</strong>. Se venden por <strong>metro cúbico (m³)</strong>. Según la comunidad, la grava triturada de 3/8" ronda los <strong>RD$ 1,846 el m³</strong> y la de 3/4" unos <strong>RD$ 1,904</strong>. Para <strong>1 m³ de concreto</strong> se usa aproximadamente <strong>0.8 m³ de grava</strong>, más arena y cemento.',
    faq: [
      { q: '¿A cómo está el metro cúbico de grava en RD?', a: 'El m³ de <strong>grava triturada</strong> ronda los <strong>RD$ 1,846 (3/8")</strong> a <strong>RD$ 1,904 (3/4")</strong> en RD, según la comunidad. Varía por tamaño del árido, zona y flete.' },
      { q: '¿Qué diferencia hay entre grava y gravilla?', a: 'La <strong>gravilla</strong> es de menor tamaño (3/8"), ideal para concretos finos y losas; la <strong>grava</strong> (1/2" a 3/4") se usa en concreto estructural. Ambas son agregado grueso.' },
      { q: '¿Cuánta grava lleva 1 m³ de concreto?', a: 'Un m³ de concreto lleva aproximadamente <strong>0.8 m³ de grava</strong>, junto a 0.5 m³ de arena y 7 a 9 fundas de cemento.' },
    ],
  },
  {
    slug: 'block',
    nombre: 'Block de hormigón',
    queries: ['block', 'bloque'],
    emoji: '🧱',
    unidad: 'unidad',
    h1: 'Precio del block de hormigón en República Dominicana',
    seoTitle: 'Precio del block en RD 2026 · block de 4", 6" y 8" por unidad y zona',
    seoDesc: 'Precio del block de hormigón (4", 6", 8") en República Dominicana por unidad y por zona. Desde RD$ 45 el block industrial. Datos de la comunidad de Precios Obra.',
    intro: 'Precio del block de hormigón en RD por espesor (4", 6", 8") y por zona, según los reportes de la comunidad. El block es el material principal para levantar muros y paredes; se cotiza por unidad puesto en obra o en fábrica.',
    porque: 'El precio del block en RD varía por espesor (4", 6", 8"), por resistencia y por zona. El transporte pesa mucho porque es un material voluminoso; comprar en la bloquera más cercana suele salir más barato que traerlo de lejos.',
    notaTitulo: 'Precio del block de 4", 6" y 8" y cuántos por m²',
    nota: 'El <strong>block de hormigón</strong> es el material principal para levantar <strong>muros y paredes</strong> en RD. Los espesores más usados son <strong>4", 6" y 8"</strong>. Según la comunidad, el block industrial va desde unos <strong>RD$ 45 (4")</strong>, <strong>RD$ 46 (5")</strong> y <strong>RD$ 51 (6")</strong> por unidad. Para levantar <strong>1 m² de pared</strong> se necesitan aproximadamente <strong>12.5 blocks</strong> de 8"x16", más el mortero de pega.',
    faq: [
      { q: '¿A cómo está el block de 6" en RD?', a: 'El block industrial de 6" ronda los <strong>RD$ 51</strong> por unidad en República Dominicana, según la comunidad. El de 4" está cerca de <strong>RD$ 45</strong> y el de 5", <strong>RD$ 46</strong>. Varía por zona, resistencia y cantidad.' },
      { q: '¿Cuántos blocks se necesitan por metro cuadrado de pared?', a: 'Para <strong>1 m² de pared</strong> con block de 8"x16" se necesitan aproximadamente <strong>12.5 blocks</strong>, más el mortero de pega. Conviene sumar un 5% extra por roturas.' },
      { q: '¿Qué espesor de block conviene usar?', a: 'El <strong>block de 6"</strong> es el más usado para muros de carga y fachadas; el de <strong>4"</strong> para divisiones internas; y el de <strong>8"</strong> para muros de mayor resistencia o de contención.' },
    ],
  },
  {
    slug: 'pintura',
    nombre: 'Pintura',
    queries: ['pintura'],
    emoji: '🎨',
    unidad: 'galón',
    h1: 'Precio de la pintura en República Dominicana',
    seoTitle: 'Precio de la pintura en RD 2026 · galón de pintura acrílica por zona',
    seoDesc: 'Precio de la pintura acrílica en República Dominicana por galón y por zona. Galón desde RD$ 1,700. Cuánto rinde y cuánta necesitás. Datos de Precios Obra.',
    intro: 'Precio de la pintura de construcción en RD por tipo (acrílica, esmalte, selladores) y por zona, según los reportes de la comunidad. La pintura es uno de los acabados más cotizados para paredes y fachadas; se cotiza por galón o cubeta.',
    porque: 'El precio de la pintura en RD depende del tipo (acrílica, esmalte, selladora), la calidad y el rendimiento por galón. Una pintura más cara suele rendir más metros cuadrados por galón, así que conviene comparar el costo por m² pintado, no solo el del envase.',
    notaTitulo: 'Precio del galón de pintura y cuánto rinde',
    nota: 'La <strong>pintura</strong> es uno de los acabados más cotizados para <strong>paredes y fachadas</strong> en RD. Se vende por <strong>galón</strong> y por <strong>cubeta (5 galones)</strong>. Según la comunidad, el galón de <strong>pintura acrílica</strong> ronda los <strong>RD$ 1,700 a 1,900</strong>. Un galón rinde aproximadamente <strong>30 a 40 m² por mano</strong>; para dos manos (lo recomendado), calculá un galón cada 15 a 20 m².',
    faq: [
      { q: '¿A cómo está el galón de pintura acrílica en RD?', a: 'El galón de <strong>pintura acrílica</strong> ronda los <strong>RD$ 1,700 a 1,900</strong> en RD, según la comunidad. Las líneas premium y las de fachada cuestan más.' },
      { q: '¿Cuánto rinde un galón de pintura?', a: 'Un galón rinde aproximadamente <strong>30 a 40 m² por mano</strong>. Para dos manos (lo recomendado), un galón cubre unos <strong>15 a 20 m²</strong>.' },
      { q: '¿Cuánta pintura necesito para una casa?', a: 'Depende del área de pared. Como referencia, para dos manos calculá 1 galón cada 15 a 20 m² de pared, y sumá un 10% extra para retoques.' },
    ],
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
    h1: 'Precio del porcelanato y piso en República Dominicana',
    seoTitle: 'Precio del porcelanato y piso en RD 2026 · por m² y zona',
    seoDesc: 'Precio del porcelanato y piso cerámico en República Dominicana por metro cuadrado (m²) y por zona. Porcelanato desde RD$ 1,558 el m². Datos de Precios Obra.',
    intro: 'Precio del porcelanato y piso cerámico en RD por formato y calidad, y por zona, según los reportes de la comunidad de Precios Obra. El porcelanato y la cerámica son los acabados más cotizados para pisos y fachadas; se cotizan por metro cuadrado (m²).',
    porque: 'El precio del piso en RD depende del tipo (cerámica nacional, porcelanato importado), el formato de la pieza, el acabado (mate, pulido, rectificado) y la marca. El porcelanato de gran formato suele ser el más caro por m².',
    notaTitulo: 'Precio del porcelanato por m² para pisos y fachadas',
    nota: 'El <strong>porcelanato</strong> y la <strong>cerámica</strong> son los acabados más cotizados para <strong>pisos y fachadas</strong> en RD. Se venden por <strong>metro cuadrado (m²)</strong>. Según la comunidad, el porcelanato chino de 50x50 ronda los <strong>RD$ 1,558 el m²</strong> y el romano de 60x60 unos <strong>RD$ 1,846</strong>. Conviene comprar un <strong>10% extra</strong> por cortes y roturas.',
    faq: [
      { q: '¿A cómo está el metro cuadrado de porcelanato en RD?', a: 'El m² de <strong>porcelanato</strong> ronda los <strong>RD$ 1,558 (50x50)</strong> a <strong>RD$ 1,846 (60x60)</strong> en RD, según la comunidad. El formato grande y el importado cuestan más.' },
      { q: '¿Qué es mejor, cerámica o porcelanato?', a: 'El <strong>porcelanato</strong> es más resistente, menos poroso y dura más, ideal para pisos de alto tránsito y fachadas. La <strong>cerámica</strong> es más económica, buena para áreas de menor uso.' },
      { q: '¿Cuánto porcelanato comprar por m²?', a: 'Comprá siempre un <strong>10% extra</strong> sobre el área a cubrir, para cortes, roturas y reposición futura.' },
    ],
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

// Materiales reconocibles que la gente busca (para que lideren, no accesorios).
const MAT_RELEVANTES = ['cemento', 'varilla', 'cabilla', 'block', 'bloque', 'arena', 'grava', 'gravilla',
  'cerámica', 'ceramica', 'porcelanato', 'pintura', 'tubo', 'tubería', 'tuberia', 'cable', 'zinc', 'aluzinc',
  'madera', 'plywood', 'tablon', 'tablón', 'inodoro', 'lavamanos', 'alambre', 'clavo', 'mortero', 'acero',
  'hierro', 'pega', 'impermeabilizante', 'tinaco', 'breaker', 'lámina', 'lamina', 'perfil', 'canaleta',
  'sellador', 'aditivo', 'estribo', 'malla', 'polietileno', 'silicon']

export async function getTopPorTipo(slug, n = 30) {
  const entry = Object.entries(TIPO_RESUMEN).find(([, v]) => v.slug === slug)
  if (!entry) return null
  const [tipo, def] = entry
  const items = await fetchAll()
  const productos = agrupar(items.filter((it) => it.tipo_recurso === tipo))
  const zc = (p) => Object.keys(p.zonas).length
  // Para materiales, priorizar los reconocibles (cemento, varilla…) sobre
  // accesorios (abrazaderas, adaptadores) que inundan por cobertura.
  const rel = (p) => {
    if (tipo !== 'MATERIAL') return 0
    const nombre = (p.nombre || '').toLowerCase()
    return MAT_RELEVANTES.some((k) => nombre.includes(k)) ? 1 : 0
  }
  const ranked = [...productos].sort((a, b) =>
    rel(b) - rel(a) || zc(b) - zc(a) || (b.fecha || '').localeCompare(a.fecha || ''))
  // Dedup por familia de nombre (1ª palabra): máx 2 variantes por tipo de
  // producto, para que la tabla sea diversa y no 8 "alambre …".
  const vistos = {}
  const sel = []
  for (const p of ranked) {
    const clave = (p.nombre || '').toLowerCase().normalize('NFD').replace(/[^a-z ]/g, '').trim().split(' ')[0]
    vistos[clave] = (vistos[clave] || 0) + 1
    if (vistos[clave] <= 2) sel.push(p)
    if (sel.length >= n) break
  }
  const top = sel.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
  return {
    tipo, ...def,
    productos: top,
    total: productos.length,
    mostrados: top.length,
    actualizado: fmtHoy(),
  }
}

// ---------------------------------------------------------------------------
// PÁGINAS POR PROVINCIA — cobertura de búsquedas locales ("precio del cemento
// en Santiago"). Cada provincia se mapea a su zona (Norte/Sur/Este) y muestra
// los precios de esa zona con marco local propio.
// ---------------------------------------------------------------------------

// Ciudades/apodos conocidos por provincia, para el copy (SEO local).
const CIUDAD_PROV = {
  'Distrito Nacional': 'Santo Domingo', 'La Altagracia': 'Higüey y Punta Cana',
  'La Vega': 'La Vega y Jarabacoa', 'Espaillat': 'Moca', 'Duarte': 'San Francisco de Macorís',
  'Peravia': 'Baní', 'Monseñor Nouel': 'Bonao', 'Sánchez Ramírez': 'Cotuí',
  'Hermanas Mirabal': 'Salcedo', 'Valverde': 'Mao', 'María Trinidad Sánchez': 'Nagua',
}

let _zonasPromise = null
function fetchZonas() {
  if (!_zonasPromise) {
    _zonasPromise = (async () => {
      try {
        const res = await fetch(`${API_BASE}/zonas`)
        return res.ok ? await res.json() : []
      } catch { return [] }
    })()
  }
  return _zonasPromise
}

export async function getProvincias() {
  const zonas = await fetchZonas()
  const out = []
  for (const z of zonas) {
    const provs = (z.provincias || '').split(',').map((p) => p.trim()).filter(Boolean)
    for (const nombre of provs) {
      out.push({
        slug: slugify(nombre),
        nombre,
        ciudad: CIUDAD_PROV[nombre] || nombre,
        zonaId: z.id,
        zonaLabel: (ZONAS.find((zz) => zz.id === z.id) || {}).label || z.nombre,
        zonaColor: z.color || '#F0691E',
        provinciasZona: provs,
      })
    }
  }
  return out
}

// Resumen de los materiales curados (cemento, varilla…) con su precio típico
// por zona. Memoizado: se calcula una vez y sirve a las 32 provincias.
let _matResumenPromise = null
function getMaterialesResumen() {
  if (!_matResumenPromise) {
    _matResumenPromise = (async () => {
      const lista = await Promise.all(MATERIALES.map((m) => getMaterial(m.slug)))
      return lista.filter(Boolean).map((d) => ({
        slug: d.slug,
        nombre: d.nombre,
        unidad: d.unidad,
        // precio típico por zona (mediana ya calculada en zonaStats)
        zonas: Object.fromEntries(d.zonaStats.map((z) => [z.id, z.prom])),
      }))
    })()
  }
  return _matResumenPromise
}

export async function getProvincia(slug) {
  const provincias = await getProvincias()
  const def = provincias.find((p) => p.slug === slug)
  if (!def) return null
  // Materiales curados (recognizables) con el precio de la zona de la provincia.
  const resumen = await getMaterialesResumen()
  const productos = resumen
    .filter((m) => Number.isFinite(m.zonas[def.zonaId]))
    .map((m) => ({ slug: m.slug, nombre: m.nombre, unidad: m.unidad, precio: m.zonas[def.zonaId] }))
  const hermanas = provincias.filter((p) => p.zonaId === def.zonaId && p.slug !== slug)
  return { ...def, productos, hermanas, actualizado: fmtHoy() }
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
