# controlobra-web — bitácora del proyecto

Resumen de lo construido en la sesión del **17-may-2026** para tenerlo a mano en futuras conversaciones (paralelo al `CLAUDE.md` del ERP).

---

## Qué es esto

**Landing pública de Control Management Pro** — el sitio web de marketing/promoción del ERP, completamente separado del producto en sí.

- **Dominio objetivo**: `controlobra.ai` (raíz)
- **El ERP** vive en `app.controlobra.ai` (subdominio — pendiente de mover desde la raíz actual)
- **Audiencia**: 80% República Dominicana · 20% LATAM (constructoras de vivienda)

---

## Por qué está separado del ERP

Decisión arquitectónica deliberada para que cada proyecto evolucione sin afectar al otro:

| | ERP (`APP-CMP`) | Web (`controlobra-web`) |
|---|---|---|
| Repo en GitHub | `cmra79-bot/APP-CMP` (existente) | `cmra79-bot/controlobra-web` (pendiente crear) |
| Stack | React + FastAPI + PostgreSQL | Astro static + HTML/CSS/JS vanilla |
| Hosting | DigitalOcean App Platform (~$12/mes) | Cloudflare Pages (gratis) |
| Deploy | Auto desde `main` | Auto desde `main` (cuando se conecte) |
| Quién lo usa | Clientes pagando (login) | Cualquiera buscando en Google |
| Riesgo de caída | Alto (clientes activos) | Bajo (informativo) |

Si los hubiéramos mezclado: cada push a la web reconstruiría el ERP entero, los costos se inflarían y un bug de SEO podría romper el login.

---

## Ubicación local

```
/Users/carlosramirez/Developer/
├── APP-CMP/                    ← ERP (lo que tienes desde antes)
└── controlobra-web/            ← Landing (nuevo, esta sesión)
```

Repo de git **propio**, completamente independiente. Primer commit ya hecho.

---

## Stack final

- **Astro 4.16** — generador estático, output `dist/` listo para cualquier host.
- **HTML/CSS/JS vanilla** en una sola página autocontenida (`src/pages/index.html`, 1929 líneas).
- **Tipografías**: Manrope (body), Fraunces italic (acentos), JetBrains Mono (números/mono).
- **Paleta**: misma del ERP — naranja `#F26B1F`, ink `#0E1116`, cream `#F7F8FA`.
- **Cero dependencias de runtime** salvo Astro para servir/buildear.

---

## Estructura del proyecto

```
controlobra-web/
├── public/
│   └── assets/
│       ├── logo-icon-hd.png       ← logo principal
│       ├── logo-icon.png
│       ├── logo-cmp.png
│       └── logo-cmp-square.jpg
├── src/
│   └── pages/
│       └── index.html             ← landing completa (1 página)
├── astro.config.mjs               ← config Astro
├── tsconfig.json                  ← TS strict
├── .gitignore                     ← dist/, node_modules/, etc.
├── package.json
├── README.md                      ← documentación pública del proyecto
└── web.md                         ← este archivo (bitácora interna)
```

---

## Qué tiene la landing (resumen visual)

Una página única **muy completa**, con todas estas secciones de arriba abajo:

1. **Nav sticky** con logo, links (Módulos / Cómo funciona / IA / ROI / Precios), theme toggle dark/light, CTAs (Iniciar sesión + Demo gratis con shimmer).
2. **Hero dark** con 3 blobs animados (`@keyframes blobA/B`), grain SVG, dot pattern, pill "IA · Nuevo" naranja.
3. **Headline rotador**: "constructoras de vivienda residencial / vertical / horizontal / desarrollos turísticos" (rotación cada 3s).
4. **Preview del producto** con browser chrome (dots + URL) y dashboard real adentro: presupuesto MG73, curva S, cubicaciones, bitácora.
5. **3 floating cards** flotantes en el preview con datos vivos:
   - Avance MG73 −49 pts (rojo)
   - Cubicación C-08 aprobada +$5.04M (verde)
   - Margen recuperado +5.4% (gradiente naranja)
6. **Logo bar** con scroll infinito horizontal (8 clientes duplicados).
7. **Métricas en franja oscura** con contadores animados (−72%, +5.4%, 3 días, 100%) usando `IntersectionObserver`.
8. **Bento grid de módulos** 6 cols × asimétrico con Presupuestos como feature 3×2 + 7 módulos en mosaico.
9. **Cómo funciona** 3 pasos con badges "PASO 01/02/03" y línea conectora.
10. **Calculadora de ROI interactiva** — 3 sliders (#obras, facturación anual, margen actual) → cálculo en vivo del ahorro anual + ROI%.
11. **Slider antes/después** arrastrable comparando workflow viejo (Excel + WhatsApp) vs CMP.
12. **Timeline "Un día con CMP"** — 6 momentos del residente (06:30 → 17:30) en zigzag.
13. **Sección Informes** grid 3×2 con previews (Resumen, Curva S, Acta, ABC, Fotográfico, Comparativo).
14. **Sección IA** con conversación de ejemplo + input chat.
15. **Tabla comparativa** CMP vs Excel+WhatsApp vs ERP genérico (check/x/parcial).
16. **3 case studies** con números grandes ($2.4M, 8 días, 94%) y avatares.
17. **Quote editorial** de cliente.
18. **Pricing** 3 tiers con toggle Mensual/Anual y badge "−15%" en anual. Featured: Profesional.
19. **FAQ** acordeón con 5 preguntas.
20. **CTA final** con gradiente naranja + grid.
21. **Footer dark** 4 columnas con newsletter, live ticker ("12 obras se cerraron HOY" actualiza cada 6s) y emails de contacto.

---

## Comandos

Desde `/Users/carlosramirez/Developer/controlobra-web/`:

```bash
npm install         # solo la primera vez (330 paquetes)
npm run dev         # → http://localhost:4321 (hot reload)
npm run build       # genera ./dist/ (≈115 KB de HTML)
npm run preview     # sirve el build local en :4321
```

El backend del ERP (`localhost:8000`) y el frontend del ERP (`localhost:5173`) corren en paralelo sin conflicto — la web usa el puerto **4321**.

---

## Decisiones tomadas en esta sesión

1. **Subdominio para el ERP**: Cuando lleguemos al cliente real, mover el ERP de `controlobra.ai` (raíz) a `app.controlobra.ai`. La web pública toma la raíz para SEO.
2. **Un único archivo HTML, sin componentes Astro**: El diseño del bundle ya estaba autocontenido y funcional; meterlo en componentes Astro no agrega valor inmediato. Cuando agreguemos páginas adicionales (precios, blog), recién ahí refactorizamos.
3. **Hosting**: Cloudflare Pages (gratis) sobre Vercel (también gratis pero más limitado para LATAM). Cloudflare tiene mejor CDN en RD.
4. **No Tailwind**: La landing trae todo en CSS custom properties (`--orange`, `--ink`, etc.). Tailwind sería redundante para una página estática.
5. **Cero email backend**: Cuando haya formulario de contacto, se conecta a Formspree (50 envíos/mes gratis) o a un webhook propio en el backend del ERP en `/api/contacto`.

---

## Estado actual

- ✅ Proyecto local funcional (`npm run dev` → http://localhost:4321)
- ✅ Build de producción OK (115 KB de HTML estático)
- ✅ Git inicializado con primer commit
- ✅ README.md público escrito
- ✅ Logos y assets en `public/assets/`
- ❌ Repo de GitHub aún no creado
- ❌ Cloudflare Pages no conectado
- ❌ Dominio `controlobra.ai` aún apuntando al ERP (no a esta landing)
- ❌ Subdominio `app.controlobra.ai` no creado

---

## Pendientes para llevar a producción

### Fase 1 — Repo + hosting (15 min)

1. Crear repo `cmra79-bot/controlobra-web` en GitHub.
2. `git remote add origin https://github.com/cmra79-bot/controlobra-web.git`
3. `git push -u origin main`
4. En Cloudflare → Pages → Connect to Git → seleccionar repo.
5. Build command: `npm run build` · Output: `dist`.
6. Cloudflare asignará URL temporal tipo `controlobra-web.pages.dev` para validar.

### Fase 2 — Mover ERP a `app.controlobra.ai` (30 min)

1. En DigitalOcean App Platform del ERP, cambiar el custom domain de `controlobra.ai` a `app.controlobra.ai`.
2. En Porkbun DNS:
   - Eliminar el A record actual de `controlobra.ai` que apunta a DigitalOcean.
   - Crear A record nuevo `app` → IP de DigitalOcean (con SSL automático del App Platform).
3. Actualizar `CORS_ORIGINS` en backend (`.do/app.yaml`) para incluir `https://app.controlobra.ai`.
4. Probar que `app.controlobra.ai/login` funcione.

### Fase 3 — Conectar dominio raíz a la web (15 min)

1. En Cloudflare Pages → Custom domains → agregar `controlobra.ai` y `www.controlobra.ai`.
2. En Porkbun DNS:
   - A record raíz → IP de Cloudflare Pages.
   - CNAME `www` → `controlobra.ai`.
3. Esperar propagación (5-15 min) + SSL automático.

### Fase 4 — Pulido de contenido

Antes de promocionar:

- [ ] Reemplazar nombres placeholder en el logo bar (Mesón Grande, Reforma Capital, etc.) por clientes reales o quitar la sección hasta tenerlos.
- [ ] Cambiar los nombres ficticios de los floating cards (MG73, R. Mesón) por casos reales o anónimos.
- [ ] Revisar copys de "Por qué CMP" — ajustar a casos dominicanos (DGII, NCF, ITBIS 18%).
- [ ] Decidir si los **precios** ($2,500/mes, $5,400/mes, etc.) son los definitivos o si vamos con "Habla con nosotros".
- [ ] Conectar formulario de contacto (Formspree o webhook al backend del ERP).
- [ ] Meta tags Open Graph para WhatsApp/LinkedIn (imagen 1200×630, título, descripción).
- [ ] Favicon — ya hay `logo-icon.png`, falta convertir a `.ico` y agregar `<link rel="icon">`.
- [ ] Botón "Iniciar sesión" del nav → debe llevar a `https://app.controlobra.ai/login`.
- [ ] Botón "Demo gratis" → ¿WhatsApp directo? ¿Calendly? ¿formulario inline?

### Fase 5 — Próximas iteraciones (cuando haya tiempo)

- [ ] Página `/precios` independiente con detalle.
- [ ] Página por cada módulo: `/modulos/presupuestos`, `/modulos/control`, etc. con screenshots reales del ERP.
- [ ] Blog en `src/content/blog/*.md` con SEO long-tail ("cómo hacer presupuesto BC3", "cumplimiento DGII construcción", etc.).
- [ ] Sitemap automático con `@astrojs/sitemap`.
- [ ] Analytics: Plausible (privacy-friendly, $9/mes) o Umami (self-hosted gratis).
- [ ] Refactorizar el HTML único a componentes Astro (`<Hero.astro>`, `<Modulos.astro>`, etc.) cuando se agreguen más páginas y haya código repetido.

---

## Contactos del proyecto

- **Soporte**: soporte@controlobra.ai
- **Admin**: admin@controlobra.ai
- **Repo GitHub**: pendiente (cuando se cree: `cmra79-bot/controlobra-web`)
- **Bundle de diseño origen**: design hash `Tg9G9c4uAsww2NEkpKxZow` (`Landing-CMP.html`)
