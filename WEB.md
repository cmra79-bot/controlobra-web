# WEB — documento consolidado de controlobra.ai

Todo lo que hay que saber del **sitio de marketing y SEO** `controlobra.ai`:
qué es, cómo se despliega, qué páginas tiene, qué se decidió y por qué, y qué
queda pendiente.

Equivale al `CLAUDE.md` del ERP y al `PRECIOS_OBRA.md` del visor público. Si
retomás este proyecto después de un tiempo, **leé este archivo primero**.

> Sustituye a la bitácora `web.md` del 17-may-2026, que quedó obsoleta (hablaba
> de un repo sin crear, 1929 líneas de landing y del nombre "CMP"; hoy el repo
> lleva 50 commits, la landing tiene 2907 líneas y el producto se llama
> **Manestro Pro**).

**Última actualización:** 9-nov-2026 · 50 commits · 17-may-2026 → 18-oct-2026

---

## Índice

1. [Qué es esto y qué NO es](#1-qué-es-esto-y-qué-no-es)
2. [Dominios, hosting y despliegue](#2-dominios-hosting-y-despliegue)
3. [Stack y estructura de archivos](#3-stack-y-estructura-de-archivos)
4. [Mapa de páginas](#4-mapa-de-páginas)
5. [La landing](#5-la-landing)
6. [Frontera con Precios Obra y con el ERP](#6-frontera-con-precios-obra-y-con-el-erp)
7. [SEO: lo aprendido](#7-seo-lo-aprendido)
8. [Diseño y marca](#8-diseño-y-marca)
9. [Analítica y contactos](#9-analítica-y-contactos)
10. [Decisiones registradas](#10-decisiones-registradas)
11. [Pendientes](#11-pendientes)
12. [Operación: comandos](#12-operación-comandos)
13. [Historial de hitos](#13-historial-de-hitos)

---

## 1. Qué es esto y qué NO es

**`controlobra.ai` = sitio de marketing + motor de SEO.** Proyecto Astro estático,
independiente, en `/Users/carlosramirez/Developer/controlobra-web`.
Repo: `github.com/cmra79-bot/controlobra-web`.

⚠️ **No confundirlo con el ERP.** Es el error que más tiempo ha costado en
sesiones pasadas:

| | Sitio web | ERP |
|---|---|---|
| Dominio | `controlobra.ai` (apex) | `app.controlobra.ai` |
| Repo | `cmra79-bot/controlobra-web` | `cmra79-bot/APP-CMP` |
| Carpeta local | `Developer/controlobra-web` | `Developer/APP-CMP` |
| Stack | Astro 4 estático | React 19 + Vite / FastAPI + Postgres |
| Puerto local | **4321** | 5173 (front) · 8000 (back) |
| Hosting | Cloudflare Pages (gratis) | DigitalOcean App Platform (~$12/mes) |
| Quién entra | Cualquiera desde Google | Clientes con login |
| Riesgo si se cae | Bajo (informativo) | Alto (clientes activos) |

**Regla de desambiguación:** "mi página web" / "www.controlobra.ai" / "la landing"
→ **este repo**. "El ERP" / "app.controlobra.ai" / "el login" → **APP-CMP**.

**Por qué están separados** (decisión 17-may-2026): si estuvieran juntos, cada
push a la web reconstruiría el ERP entero, los costos subirían y un bug de SEO
podría romper el login. Además el ciclo de cambio es distinto: la web se toca
por posicionamiento, el ERP por producto.

**Audiencia:** ~80% República Dominicana, ~20% resto de LATAM. Constructoras de
vivienda. El 83% de las impresiones en Google son **móviles** (dato ago-2026).

---

## 2. Dominios, hosting y despliegue

### Mapa de dominios

| Dominio | Apunta a | Estado |
|---|---|---|
| `controlobra.ai` (apex) | Cloudflare Pages → este sitio | ✅ Correcto |
| `app.controlobra.ai` | DigitalOcean → ERP | ✅ Correcto |
| `www.controlobra.ai` | **DigitalOcean → ERP** | ❌ **Mal** — ver pendientes |

### Despliegue

- **Host:** Cloudflare Pages. Build `npm run build`, output `dist/`, rama `main`.
- **Autodeploy:** cada push a `main`.
- **Rebuild diario:** `.github/workflows/rebuild-diario.yml` — cron `0 10 * * *`
  (10:00 UTC = **06:00 en RD**, antes de que arranque la jornada de obra).
  Dispara el deploy hook de Cloudflare usando el secret **`CF_DEPLOY_HOOK`**.

  *Por qué existe:* las páginas son estáticas y los precios se **hornean en el
  HTML durante el build** leyendo la API del ERP. Sin el rebuild diario el sitio
  queda congelado — llegó a tener **10 días de atraso**, y para búsquedas como
  "precio del block en RD 2026" la frescura del dato es señal de posicionamiento.

  Si el secret falta, el workflow falla con instrucciones en el log: Cloudflare
  Pages → proyecto → Settings → Builds & deployments → Deploy hooks → Add deploy
  hook (rama `main`) → guardar la URL en GitHub → Settings → Secrets and
  variables → Actions → `CF_DEPLOY_HOOK`.

### Costos

| Servicio | Costo/mes |
|---|---|
| Dominio `controlobra.ai` | ~$1 (anual ~$14) |
| Cloudflare DNS + Pages | $0 (bandwidth ilimitado) |
| *(el ERP aparte: DO backend $5 + Postgres $7)* | *$12* |

El sitio escala sin costo extra. **Esto importa**: el motor de SEO puede crecer a
cientos de páginas sin que suba la factura.

---

## 3. Stack y estructura de archivos

- **Astro 4.16** (`output: 'static'`) — única dependencia de runtime, más
  `@astrojs/sitemap`.
- **Sin Tailwind, sin framework de UI.** CSS custom properties a mano.
- **Node 18+ / npm 9+.**

```
controlobra-web/
├── .github/workflows/
│   └── rebuild-diario.yml          ← cron 06:00 RD → deploy hook de Cloudflare
├── public/
│   ├── favicon.ico                 ← ICO multi-tamaño (16-256) en la RAÍZ
│   ├── robots.txt                  ← Allow / + sitemap-index.xml
│   └── assets/                     ← logos, favicons PNG, dashboard-hero.png
├── src/
│   ├── components/
│   │   ├── GoogleAnalytics.astro   ← GA4 G-ZH0W9FS496
│   │   ├── NotaMoneda.astro        ← ⚠️ obligatorio en toda página con precios
│   │   ├── TablaPrecios.astro      ← tabla de precios por zona
│   │   ├── CalculadoraInline.astro ← mini-calculadora embebida
│   │   └── CtaCalculadora.astro    ← puente a la app
│   ├── layouts/
│   │   └── PrecioLayout.astro      ← layout común de /precios/*
│   ├── lib/
│   │   └── precios.js              ← ⭐ fuente de datos (ver abajo)
│   └── pages/
│       ├── index.html              ← landing completa, 2907 líneas, UN archivo
│       ├── metodologia.astro       ← E-E-A-T
│       ├── guias/                  ← 5 guías + índice
│       └── precios/                ← material, categoría, provincia, resumen
├── astro.config.mjs                ← sitio + sitemap con lastmod inteligente
├── WEB.md                          ← este archivo
├── README.md                       ← doc pública del repo
├── DEPLOY.md                       ← guía paso a paso de DNS/hosting
└── guion-video-block.md            ← guion de video corto (sin versionar aún)
```

### `src/lib/precios.js` — el corazón del sitio

Lee la **API pública del ERP en tiempo de build**:

```js
const API_BASE = 'https://app.controlobra.ai/api/precios-obra'
```

No escribe nada; el ERP no se modifica. **Una sola fuente de verdad: la BD de
Precios Obra.** Define:

- `ZONAS` — 3 zonas con ids fijos: Cibao Norte (1), Sur (2), Este (3).
- `MATERIALES` — 15 entradas, cada una con `slug`, `queries` al catálogo,
  `variantes`, y todo el copy SEO (`h1`, `seoTitle`, `seoDesc`, `intro`,
  `porque`, `preguntaClave`). Los comentarios del archivo guardan los datos de
  Search Console que justificaron cada copy (impresiones, posición).
- `TIPOS` / `ORDEN_TIPOS` / `TIPO_RESUMEN` — agrupación por tipo.
- `provinciasIndexables()` — las provincias con directorio propio de ferreterías.

### Sitemap con `lastmod` honesto

En `astro.config.mjs`: las páginas que leen del catálogo usan la fecha del build
(cambian de verdad a diario). Las que no, como la portada, llevan su fecha real
de edición.

> *"Mentirle a Google diciendo que la portada cambia todos los días le enseña a
> ignorar el `lastmod` de todo el sitio."*

Las provincias sin directorio propio se generan (se navegan desde `/precios/`)
pero van **`noindex` y fuera del sitemap**: sus precios son los de su zona, así
que anunciarlas solo gasta presupuesto de rastreo.

---

## 4. Mapa de páginas

**73 URLs en el sitemap · 91 HTML generados** (la diferencia son las provincias
`noindex`).

| Sección | Ruta | Cantidad | Qué es |
|---|---|---|---|
| Landing | `/` | 1 | La portada comercial |
| Metodología | `/metodologia/` | 1 | E-E-A-T: de dónde salen los datos |
| Índice de precios | `/precios/` | 1 | Hub del catálogo |
| Por material | `/precios/<material>/` | 18 | cemento, varilla, block, arena, gravilla, pintura, piso, zinc, madera, cable, tubería, sanitarios, puertas, tinaco, malla electrosoldada |
| Block por espesor | `/precios/block-de-4|6|8/` | 3 | *(incluidas arriba)* — páginas propias por espesor |
| Por categoría | `/precios/categoria/<cat>/` | 28 | Toda la BD mapeada por categoría |
| Por provincia | `/precios/provincia/<prov>/` | 32 | Búsqueda local; solo las que tienen suplidores van al sitemap |
| Resúmenes por tipo | `/precios/resumen/<tipo>/` | 4 | materiales, equipos, mano de obra, subcontratos |
| Guías | `/guias/<slug>/` | 5 + índice | Long-tail de intención real |

### Las 5 guías

1. `cuanto-cuesta-construir-casa-republica-dominicana`
2. `cuanto-cuesta-una-pared-de-block`
3. `cuanto-cuesta-pintar-una-casa`
4. `cuanto-cuesta-un-quintal-de-varilla`
5. `cuanto-cuesta-echar-el-plato` *(losa de techo)*

Cada guía usa **los precios reales del catálogo**, no números inventados, y
enlaza a las páginas de material correspondientes (interlinking completado el
19-ago-2026).

---

## 5. La landing

**Un solo archivo**: `src/pages/index.html`, 2907 líneas, con todo el CSS y JS
embebido. Decisión deliberada (ver §10).

### Secciones, en orden

| # | Clase | `id` (ancla del nav) | Contenido |
|---|---|---|---|
| 1 | `.hero` | — | Titular + rotador de tipos de obra + preview del dashboard con tarjetas de datos |
| 2 | `.metrics` | — | Franja oscura con contadores animados |
| 3 | `.problem` | `#problem` | Split "ANTES / CON MANESTRO" |
| 4 | `.modules` | `#modulos` | Bento grid de 8 módulos |
| 5 | `.how` | `#flujo` | **Flujo de 5 pasos**: Ventas → Cronograma → Presupuesto → Obra → Entrega |
| 6 | `.po-sec` | `#precios-obra` | Apartado de Precios Obra |
| 7 | `.day` | — | "El día del residente", timeline |
| 8 | `.roi` | `#roi` | Calculadora de ROI con 3 sliders |
| 9 | `.compare` | — | Tabla comparativa |
| 10 | `.reports` | `#informes` | Grid de informes |
| 11 | `.ai` | `#ia` | Sección de IA |
| 12 | `.faq` | `#faq` | Acordeón |
| 13 | `.cta-final` | — | Cierre + footer |

El nav lista exactamente las anclas en el orden del documento (reordenado el
22-ago-2026, mismo commit que quitó el toggle de tema).

### Conversión

- **"Iniciar sesión"** y **"Demo gratis"** → `https://app.controlobra.ai/login`
- **Modal de captura de leads** para solicitar demo (10-jun-2026)
- **Botón flotante de WhatsApp** con mensaje pre-cargado → `wa.me/18096376377`
- **"Compartir por WhatsApp"** en todas las páginas de precios (20-jul-2026)
- **Mini-calculadora** en las páginas de precios como puente real a la app
  (7-ago-2026)

---

## 6. Frontera con Precios Obra y con el ERP

Esto es lo que más se confunde, porque **"Precios Obra" existe en los dos lados**.

```
                 BD de Precios Obra (en el ERP, Postgres)
                              │
                              │  API pública /api/precios-obra
                              │
              ┌───────────────┴────────────────┐
              ▼                                ▼
   app.controlobra.ai/precios-obra     controlobra.ai/precios/*
   (SPA React, dentro del ERP)         (Astro estático, ESTE repo)
   · consulta, ranking, puntos         · 73 URLs indexables
   · sugerir precio, colaboraciones    · precios horneados en el build
   · presupuestador público            · rebuild diario 06:00 RD
   · app móvil / PWA                   · el vehículo de SEO
```

**Quién es dueño de qué:**

| Cosa | Dónde vive | Documentado en |
|---|---|---|
| Los datos de precios | BD del ERP | `PRECIOS_OBRA.md` §4-5 |
| El producto interactivo | ERP, `/precios-obra/*` | `PRECIOS_OBRA.md` §2-3 |
| Las páginas que Google lee | **Este repo** | Este archivo |
| Las páginas SEO *dentro* de la app | ERP, `scripts/generar-seo-precios.mjs` | `PRECIOS_OBRA.md` §10 |

**Regla de oro:** este repo **solo lee**. Nunca escribe en la BD. Si un precio
está mal, se corrige en el ERP y el rebuild diario lo propaga.

**Dos vehículos de SEO, no uno** (§10 de `PRECIOS_OBRA.md`):
1. Este sitio — el principal.
2. Páginas estáticas pre-generadas dentro de la app
   (`/precios-obra/precios/<familia>[/<zona>].html` + `sitemap-precios.xml`).

**La SPA del ERP no es vehículo de SEO**: Google ve HTML vacío. Ese fue el
descubrimiento que justificó construir este sitio.

**Competencia:** **ConstruCosto.do** (desde 2014, todo tras pago, APUs por
ciudad, precios invisibles para Google). La estrategia es atacarlos con
contenido gratis y visible. Referente de APU público: el Generador de precios de
CYPE.

---

## 7. SEO: lo aprendido

### ⚠️ La moneda — el error más caro

Google mostraba **"USD 51.00"** debajo del resultado de `/precios/block/`. El
block cuesta RD$ 51 (unos US$ 0.85), así que el buscador estaba anunciando el
material **60 veces más caro**.

No venía de los datos estructurados. Google lo sacaba del **texto**: leía
"RD$ 51", se quedaba con el `$` y asumía dólares. La causa de fondo: la palabra
"peso" y el código "DOP" **no aparecían ni una vez en ninguna de las 86 páginas**
— solo "RD$", que para un parser es un dólar con dos letras delante.

**Regla permanente:** toda página con precios lleva **`<NotaMoneda />`**, que
nombra la moneda en palabras ("pesos dominicanos") y en código ISO, justo debajo
del primer párrafo. Se arregló en tres tandas: block (10-sep), 12 materiales
restantes (13-sep), y las 11 plantillas del ERP (31-ago).

Complemento: la insignia de precio del resultado necesita
`Offer.priceCurrency: "DOP"` — pero eso solo se probó en `/precios/block/`,
porque `Product`/`Offer` **bajó el CTR** en ago-2026 y se retiró del resto
(13-oct).

### Otras lecciones

- **No generar miles de páginas casi iguales** (thin content). Mapear a demanda
  real: por eso las provincias sin suplidores van `noindex`.
- **Vender la herramienta, no el dato** (18-oct): los `h1` y las meta pasaron de
  "¿Cuánto cuesta X?" a "Calculadora de X: cuántas unidades necesitas y precio
  por zona". El dato solo lo copian; la calculadora da motivo para entrar.
- **Trailing slash normalizado** en canonical y enlaces internos (27-jul).
- `lastmod` en el sitemap para forzar recrawl (19-ago).
- Schema `Organization` con país + `hreflang` autorreferenciado (28-jul).
- Migas de pan marcadas (`BreadcrumbList`) + FAQ (7-ago en adelante).

### Datos de Search Console (ago-2026)

- **83% de las impresiones son móviles.**
- `/precios/block/` concentra el **45% de las impresiones**, en posición ~9-10.
- Las páginas de **categoría convierten 9-10%**.
- "cuanto cuesta una funda de cemento en rd": 26 impresiones, posición 10.9 — a
  un puesto de la página 1.

---

## 8. Diseño y marca

### Nombre

El producto se llamaba **Control Management Pro / CMP**. Se renombró a
**Manestro Pro** el **22-ago-2026** (commit `55eca7a`): título, meta, JSON-LD,
wordmark del nav y las 38 apariciones de "CMP" en el cuerpo. Ojo: la clase CSS
`.col.cmp` se dejó intacta a propósito.

Si encontrás "CMP" o "Control Management Pro" en texto visible, es un resto.

### Tokens

- **Naranja de marca:** `#F26B1F` (`--orange`). Variantes `--orange-2` `#FFA265`,
  `--orange-soft` `#FFE3CC`, `--orange-deep` `#C5501A`.
- **Neutros:** `--ink` `#0A0D12` · `--muted` `#6B7280` · `--line` `#E8EAEE` ·
  `--cream` `#F7F8FA` · `--paper` `#FFFFFF`.
- **Semánticos:** success `#1F8A5B` · warn `#C58A1A` · danger `#C24545` ·
  info `#2A4FA0`.
- **Tipografías:** **Manrope** (cuerpo) · **Fraunces** italic (clase `.serif`,
  el acento naranja) · **JetBrains Mono** (números y etiquetas).
- **Layout:** `.container` max-width 1280px. Las secciones **alternan fondo gris
  (`--cream`) y blanco (`--paper`)**.

⚠️ El ERP usa **Inter**, no Manrope. No cruzar tipografías entre proyectos.

### Favicon

`public/favicon.ico` es un **ICO multi-tamaño real** (16/32/48/64/128/256) en la
**raíz** del sitio — los navegadores piden `/favicon.ico` por su cuenta, y que
faltara era la causa de que saliera un icono genérico. Lo acompañan PNG con
`sizes` explícito (16, 32, 48, 192) y un apple-touch de 180.
Commit `dd1586c` (26-ago-2026).

---

## 9. Analítica y contactos

- **Google Analytics 4:** `G-ZH0W9FS496` — `src/components/GoogleAnalytics.astro`
  (instalado 10-sep-2026).
- **Search Console:** verificado como **propiedad de dominio**.
- **WhatsApp del negocio:** `+1 809 637 6377`.
- **Correos:** `soporte@controlobra.ai` · `admin@controlobra.ai`.
- **GitHub:** `cmra79-bot`.

---

## 10. Decisiones registradas

| Fecha | Decisión | Por qué |
|---|---|---|
| 17-may-2026 | **Repo separado del ERP** | Cada push a la web no debe reconstruir el ERP ni poner en riesgo el login |
| 17-may-2026 | **Un solo archivo HTML para la landing** | El diseño ya venía autocontenido; componentizarlo no agregaba valor. *Se refactoriza cuando haya repetición real* |
| 17-may-2026 | **Sin Tailwind** | CSS custom properties alcanzan para un sitio estático; Tailwind sería peso redundante |
| 17-may-2026 | **Cloudflare Pages sobre Vercel** | Mejor CDN en República Dominicana, bandwidth ilimitado gratis |
| 17-may-2026 | **ERP al subdominio, web al apex** | El apex es el que posiciona; el ERP no necesita SEO |
| 15-jul-2026 | **Construir el motor de SEO en este repo, no en la SPA** | Google ve HTML vacío en la SPA del ERP |
| 16-jul-2026 | **Precios horneados en el build + rebuild diario** | Estático = rápido y gratis; el cron resuelve la frescura |
| 20-jul-2026 | **Página de metodología** | E-E-A-T: hay que decir de dónde salen los datos |
| ago-2026 | **Retirar `Product`/`Offer` salvo en block** | Bajó el CTR; se deja como experimento medible en una sola página |
| ago-2026 | **Provincias sin suplidores → `noindex`** | Thin content: gastan rastreo sin aportar contenido propio |
| 22-ago-2026 | **Rename a Manestro Pro** | Decisión de marca |
| 22-ago-2026 | **Quitar el toggle de tema oscuro** | Nadie lo usaba y duplicaba el mantenimiento del CSS |
| 18-oct-2026 | **`h1`/meta venden la herramienta, no el dato** | El dato lo copian sin entrar; la calculadora da motivo para hacer clic |
| **9-nov-2026** | **❌ Rechazado: rediseño "anti-IA"** | Ver abajo |

### Sobre el rediseño rechazado (9-nov-2026)

Se exploró una limpieza visual completa para que el sitio no se viera "hecho por
IA": quitar los 3 blobs de gradiente difuminado del hero (uno morado `#7A4DBF`,
color que no es de la marca), bajar de 54 a 17 gradientes, de 13 a 3 animaciones,
eliminar el glassmorphism y el texto con degradado, y aplanar las sombras.
Se usó como criterio el `DESIGN.md` de Linear.

**El usuario lo revisó en local y prefirió la versión que ya está en producción.**
La rama `rediseno-anti-ia` se borró y nada se subió.

**No volver a proponerlo sin que el usuario lo pida.** Si alguna vez se retoma,
el único punto que quedó sin discutir es el morado `#7A4DBF`, que efectivamente
no pertenece a la paleta.

---

## 11. Pendientes

### 🔴 Alta — rompe algo hoy

1. **`www.controlobra.ai` sirve el ERP en vez de redirigir al apex.**
   Está listado como dominio de la app del ERP en DigitalOcean, no como redirect.
   Como el ERP es una SPA con catch-all a `index.html`, **cualquier** ruta bajo
   `www` devuelve 200 con la app vacía y sin `<link rel=canonical>`:

   ```
   curl -sI https://www.controlobra.ai/precios/varilla/
   HTTP/2 200
   x-do-app-origin: 0e2218fd-f09f-448f-9b79-cf67de43bb4c
   x-do-static-catchall-document: index.html
   ```

   Resultado: las ~73 URLs del sitio existen **duplicadas en `www` como
   soft-404**. Es el sospechoso principal de las 62 URLs en "Página con
   redirección" de Search Console.

   **No se detecta leyendo este repo** — no hay nada aquí que lo cause.
   **Arreglo:** sacar `www.controlobra.ai` de los dominios de la app del ERP en
   DigitalOcean + crear en Cloudflare un Redirect Rule 301 de `www` al apex.
   Requiere acceso a los paneles → **lo hace el usuario**.

2. **`og:image` apunta a un archivo que no existe.**
   `index.html` declara `https://controlobra.ai/assets/og-image.png` en `og:image`
   y `twitter:image`, pero `public/assets/og-image.png` **no está**. Compartir el
   link en WhatsApp o LinkedIn sale sin imagen de preview. Hace falta un PNG de
   1200×630.

### 🟡 Media — crecimiento

3. **Páginas por APU** (~200 más usados): "Precio en RD de … por m²", desglose
   materiales / mano de obra / equipo, cada insumo enlazado a su página de
   precio, botón "Usa este APU en tu presupuesto gratis", más una página por
   capítulo. *(Propuesta del 9-nov-2026, sin implementar.)*
4. **Presupuestos de ejemplo por tipo de obra**: casa de 2 niveles de 150 m²,
   1 nivel, apartamento, verja, cisterna, piscina, techo, baño — con costo por m²
   y botón "Copia este presupuesto". Requiere una plantilla por tipo en el ERP.
5. **Guía "cómo hacer un presupuesto de obra"** + plantilla descargable a cambio
   de registro.
6. **Video corto "¿A cómo está el block hoy en RD?"** — el guion ya está escrito
   en `guion-video-block.md`. Objetivo: entrar al carrusel de Videos que hoy
   ocupa media pantalla en Google para "cuánto vale el block".

### 🟢 Baja — mantenimiento

7. Refactorizar `index.html` a componentes Astro **solo cuando haya repetición
   real**. Hoy no la hay.
8. Revisar si los nombres del logo bar y de las tarjetas del hero (MG73,
   R. Mesón) deben pasar a clientes reales o anonimizarse.
9. Formulario de contacto: hoy la conversión es por WhatsApp y por el modal de
   demo. Si hace falta email, Formspree (50/mes gratis) o webhook al backend.

---

## 12. Operación: comandos

Desde `/Users/carlosramirez/Developer/controlobra-web/`:

```bash
npm install      # solo la primera vez
npm run dev      # → http://localhost:4321 (hot reload)
npm run build    # → dist/
npm run preview  # sirve el build local
```

El puerto **4321** no choca con el ERP (5173 front, 8000 back): se pueden correr
los tres a la vez.

Parar el dev server:

```bash
lsof -ti:4321 | xargs kill -9
```

### Reglas de trabajo

- **No commitear ni pushear sin que el usuario lo pida explícitamente.** Cada
  push necesita su propio "sí"; una aprobación anterior no se traslada al
  siguiente cambio.
- `git add` con archivos específicos, **nunca `-A`**. Correr `git status` antes
  de cada commit y confirmar qué está staged.
- Un push a `main` **despliega a producción** en minutos. Avisar antes si el
  cambio es de riesgo.

---

## 13. Historial de hitos

50 commits entre el 17-may-2026 y el 18-oct-2026. Los que marcan una etapa:

**Fundación (may-jun 2026)**
- `62ac404` 17-may — landing inicial de controlobra.ai
- `fe68f71` 21-may — prep para deploy
- `cdbc3b4` 10-jun — botón flotante de WhatsApp con mensaje pre-cargado
- `35f4baa` 10-jun — modal de captura de leads

**Nace el motor de SEO (jul 2026)**
- `949b550` 12-jul — apartado Precios Obra en la landing
- `e997588` 15-jul — sección SEO de precios de construcción RD
- `ff10f44` 16-jul — sistema de categorías (toda la BD) + rediseño estilo app
- `c241639` 16-jul — resúmenes "los principales por tipo"
- `b34e7df` 16-jul — **32 páginas por provincia**
- `fb6262a` 20-jul — potenciar los 5 materiales líderes
- `9bad0ac` 20-jul — página de metodología (E-E-A-T)
- `1010234` 20-jul — "Compartir por WhatsApp" en todas las páginas
- `fe1534c` 27-jul — normalizar trailing slash
- `070389a` 28-jul — schema Organization + hreflang

**Guías y frescura (ago 2026)**
- `9815a8f` 7-ago — frescura diaria + provincias con suplidores
- `46cffb1` 7-ago — mini-calculadora como puente a la app
- `d7eb8f0` 7-ago — migas de pan + guía de pared de block
- `dbeddc9` 7-ago — guía de pintar una casa
- `b9ebae6` / `2721d45` 19-ago — guías de varilla y de losa de techo
- `8a464ca` 19-ago — lastmod en el sitemap
- `dc9d8f6` 19-ago — interlinking material → guía completo

**Marca Manestro (ago 2026)**
- `55eca7a` 22-ago — **rename Control Management Pro / CMP → Manestro Pro**
- `b144bb5` 22-ago — módulos Cronograma/Ventas, **flujo de 5 pasos**, split antes/después
- `edf17e6` 22-ago — nav ordenado por secciones + quitar toggle de tema
- `dd1586c` 26-ago — favicon Manestro en todos los tamaños

**La batalla de la moneda (ago-sep 2026)**
- `57681a1` 31-ago — decir que los precios son en pesos, no dólares *(11 plantillas)*
- `9db52b3` 10-sep — DOP explícito en block
- `d354d2e` 13-sep — DOP explícito en los 12 materiales restantes
- `3b939d4` 30-ago — noindex a las provincias sin directorio propio
- `9a2ffd9` 30-ago — ubicar suplidores por código de provincia

**Afinado (sep-oct 2026)**
- `e50c18f` 10-sep — Google Analytics 4
- `cc37b01` 13-sep — páginas propias por espesor de block (4", 6", 8")
- `f8a532d` 14-sep — tinaco y malla electrosoldada + FAQ
- `d82d1de` / `21a5c65` 13-oct — retirar `Offer` y medir el CTR
- `059d713` 18-oct — **h1 y meta venden la herramienta, no el dato**

---

## Documentos hermanos

| Archivo | Dónde | Qué cubre |
|---|---|---|
| `WEB.md` | este repo | **Este archivo** — el sitio de marketing y SEO |
| `README.md` | este repo | Doc pública: stack, cómo correr, cómo editar |
| `DEPLOY.md` | este repo | Guía paso a paso de DNS, Cloudflare y DigitalOcean |
| `CLAUDE.md` | `APP-CMP` | El ERP: stack, módulos, convenciones |
| `PRECIOS_OBRA.md` | `APP-CMP` | El visor público: producto, datos, APUs, app móvil |
