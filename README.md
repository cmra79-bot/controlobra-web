# controlobra-web

Landing pública de **Control Management Pro** (CMP) — ERP profesional para constructoras de vivienda, enfocado en República Dominicana y LATAM.

Sitio servido desde **controlobra.ai**. El ERP (login, dashboards, módulos) vive en `app.controlobra.ai` y es un proyecto independiente (`APP-CMP`).

---

## Stack

- **Astro 4** (static site generation)
- **HTML/CSS/JS vanilla** (la landing es una única página autocontenida con tipografía Manrope + Fraunces + JetBrains Mono)
- **Cloudflare Pages** o **Vercel** para hosting (gratis, deploy automático desde `main`)

## Estructura

```
controlobra-web/
├── public/
│   └── assets/             ← logos e imágenes (servidos en /assets/...)
├── src/
│   └── pages/
│       └── index.html      ← landing completa (1929 líneas)
├── astro.config.mjs
├── package.json
└── README.md
```

---

## Desarrollo local

Requisitos: Node 18+ y npm 9+.

```bash
# Instalar dependencias (solo la primera vez)
npm install

# Levantar dev server con hot reload
npm run dev
# → http://localhost:4321

# Build de producción
npm run build
# → genera ./dist/ listo para subir a cualquier hosting estático

# Preview del build local
npm run preview
```

---

## Deploy

### Cloudflare Pages (recomendado)

1. Conecta este repo en Cloudflare → Pages → Create application → Connect to Git.
2. Configuración del build:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/`
3. Conecta el dominio personalizado `controlobra.ai` desde **Custom domains**.

### Vercel

1. Importar el repo en vercel.com.
2. Framework preset: **Astro**.
3. Build command y output detectados automáticamente.

---

## Editar contenido

La landing es **una sola página HTML autocontenida** en `src/pages/index.html`. Todo el CSS y JS está embebido. Para cambios:

- **Textos / copys**: buscar el texto en `src/pages/index.html`.
- **Colores / variables**: están al inicio del `<style>` como CSS custom properties (`--orange`, `--ink`, etc.).
- **Imágenes / logos**: agregar a `public/assets/` y referenciar como `/assets/nombre.png`.
- **Nuevas páginas** (precios, módulos, blog): crear `.astro` o `.html` en `src/pages/`. Astro las enruta automáticamente por nombre de archivo.

---

## Próximos pasos sugeridos

- [ ] Conectar formulario de contacto a Formspree (gratis 50/mes) o webhook propio.
- [ ] Crear páginas individuales por módulo: `/modulos/presupuestos`, `/modulos/control`, etc.
- [ ] Refactorizar la landing a componentes Astro reutilizables (`<Hero>`, `<Modulos>`, `<Pricing>`, etc.).
- [ ] Agregar blog con `src/content/blog/*.md` (Markdown).
- [ ] Meta tags Open Graph para compartir en WhatsApp / LinkedIn.
- [ ] Sitemap automático con `@astrojs/sitemap`.
- [ ] Analytics (Plausible, Umami o GA4).

---

## Contactos

- **Soporte**: soporte@controlobra.ai
- **Admin**: admin@controlobra.ai
