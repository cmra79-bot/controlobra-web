/* sw.js · la presentación de Manestro (/presentacion/) funciona sin internet.

   La primera vez que se abre con señal, guarda en el equipo la página, el logo,
   el demo 3D, los dos videos (versión 1920, unos 13 MB) y las fuentes
   (las del propio sitio, /assets/fonts/). Desde ese
   momento abre igual en una obra sin señal. La página muestra un punto verde
   («Lista sin internet») cuando ya está todo guardado.

   - La página se pide primero a la red (para que los cambios lleguen) y, si no
     hay señal o tarda más de 3 s, sale de lo guardado.
   - Lo demás sale de lo guardado y, si falta, se baja y se guarda.
   - Los videos se piden por pedazos (Range): se responden con 206 cortando el
     archivo guardado, si no el navegador no los reproduce desde la caché.
   - Si se cambian los archivos de la lista, subir VERSION. */
const VERSION = 'presentacion-v1';
const PAGINA = '/presentacion/';
const ARCHIVOS = [
  PAGINA,
  '/favicon.ico',
  '/assets/favicon-32.png',
  '/assets/logo-manestro-512.png',
  '/assets/fx-net.js',
  '/assets/fonts/landing.css',
  '/assets/fonts/manrope-latin.woff2',
  '/assets/fonts/manrope-latin-ext.woff2',
  '/assets/fonts/fraunces-latin.woff2',
  '/assets/fonts/fraunces-latin-ext.woff2',
  '/assets/fonts/jetbrainsmono-latin.woff2',
  '/assets/fonts/jetbrainsmono-latin-ext.woff2',
  '/assets/demo3d.js',
  '/assets/video/manestro-demo-v3-poster.webp',
  '/assets/video/precios-obra-v2-poster.webp',
  '/assets/video/manestro-demo-v3-1920.mp4',
  '/assets/video/precios-obra-v2-1920.mp4',
];

async function avisar(msg) {
  const cs = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
  cs.forEach((c) => c.postMessage(msg));
}

async function faltan(cache) {
  const r = [];
  for (const u of ARCHIVOS) if (!(await cache.match(u, { ignoreSearch: true }))) r.push(u);
  return r;
}

let guardando = null;
function guardarTodo() {
  if (guardando) return guardando;
  guardando = (async () => {
    const cache = await caches.open(VERSION);
    const lista = await faltan(cache);
    let hechos = ARCHIVOS.length - lista.length;
    const total = ARCHIVOS.length;
    for (const u of lista) {
      try {
        const res = await fetch(u, { cache: 'reload' });
        if (res.ok) await cache.put(u, res);
      } catch (_) { /* sin señal: se reintenta la próxima vez que se abra */ }
      hechos++;
      avisar({ tipo: 'progreso', pct: Math.round(hechos / total * 100) });
    }
    const quedan = await faltan(cache);
    if (!quedan.length) avisar({ tipo: 'listo' });
    guardando = null;
    return quedan.length === 0;
  })();
  return guardando;
}

self.addEventListener('install', (e) => {
  // Lo mínimo para abrir sin señal entra en la instalación; los videos siguen después.
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll([PAGINA, '/assets/logo-manestro-512.png', '/assets/demo3d.js', '/assets/fx-net.js'])).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('presentacion-') && k !== VERSION) await caches.delete(k);
    await self.clients.claim();
    guardarTodo();
  })());
});

self.addEventListener('message', (e) => {
  if (e.data && e.data.tipo === 'estado') e.waitUntil(guardarTodo());
});

// Un pedazo de un video guardado (respuesta 206), como lo pide el reproductor.
async function pedazo(req, res) {
  const rango = req.headers.get('range');
  if (!rango) return res;
  const blob = await res.blob();
  const size = blob.size;
  const m = /bytes=(\d*)-(\d*)/.exec(rango);
  if (!m) return res;
  let ini, fin;
  if (m[1] === '' && m[2] !== '') { ini = Math.max(0, size - +m[2]); fin = size - 1; }
  else { ini = +m[1] || 0; fin = m[2] !== '' ? Math.min(+m[2], size - 1) : size - 1; }
  if (ini >= size) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
  return new Response(blob.slice(ini, fin + 1), {
    status: 206,
    headers: {
      'Content-Type': res.headers.get('Content-Type') || 'video/mp4',
      'Content-Range': `bytes ${ini}-${fin}/${size}`,
      'Content-Length': String(fin - ini + 1),
      'Accept-Ranges': 'bytes',
    },
  });
}

async function paginaRedPrimero(req) {
  const cache = await caches.open(VERSION);
  try {
    const res = await Promise.race([
      fetch(req),
      new Promise((_, no) => setTimeout(() => no(new Error('lento')), 3000)),
    ]);
    if (res.ok) cache.put(PAGINA, res.clone());
    return res;
  } catch (_) {
    return (await cache.match(PAGINA)) || Response.error();
  }
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const mismo = url.origin === self.location.origin;

  if (req.mode === 'navigate' && mismo && url.pathname.startsWith('/presentacion')) {
    e.respondWith(paginaRedPrimero(req));
    return;
  }
  if (!(mismo && (url.pathname.startsWith('/assets/') || url.pathname === '/favicon.ico'))) return;

  e.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const clave = url.pathname;
    const hay = await cache.match(clave);
    if (hay) return url.pathname.endsWith('.mp4') ? pedazo(req, hay) : hay;
    // Un video que todavía no está guardado se pide normal (por pedazos) a la red;
    // guardarTodo() lo baja entero aparte.
    if (url.pathname.endsWith('.mp4')) return fetch(req);
    const res = await fetch(req);
    if (res.ok && ARCHIVOS.includes(url.pathname)) cache.put(clave, res.clone());
    return res;
  })());
});
