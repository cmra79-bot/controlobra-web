# Deploy a producción — controlobra.ai

Guía paso a paso para poner en línea:
- **`controlobra.ai`** → landing pública (este repo)
- **`app.controlobra.ai`** → ERP (repo `cmra79-bot/APP-CMP`)

---

## Fase 1 — DNS en Cloudflare (15 min)

### 1.1 Crear cuenta y agregar el dominio

1. Crear cuenta gratis en <https://cloudflare.com>
2. Click en **"Add a Site"** → escribir `controlobra.ai`
3. Elegir plan **Free** ($0/mes)
4. Cloudflare escaneará tus DNS actuales; click **Continue**
5. Cloudflare te dará 2 nameservers tipo:
   ```
   abc.ns.cloudflare.com
   xyz.ns.cloudflare.com
   ```

### 1.2 Cambiar nameservers en Namecheap/Porkbun/GoDaddy

1. Entrar al panel de tu registrar
2. Buscar `controlobra.ai` → **Manage** / **DNS settings**
3. Cambiar de "Default nameservers" a "Custom nameservers"
4. Pegar los 2 que te dio Cloudflare
5. Guardar
6. Esperar propagación (5-30 min normalmente, hasta 24h)
7. Verificar con: `dig +short NS controlobra.ai` (deberías ver los de Cloudflare)

### 1.3 Configurar registros DNS en Cloudflare

Una vez activado, ir a Cloudflare → tu dominio → **DNS** → Records → **Add record**:

| Tipo  | Nombre  | Contenido                                  | Proxy   | Notas |
|-------|---------|--------------------------------------------|---------|-------|
| CNAME | `@`     | `<tu-pages-url>.pages.dev`                 | 🟠 ON  | Landing (lo configuramos en Fase 3) |
| CNAME | `www`   | `controlobra.ai`                           | 🟠 ON  | Redirige www al root |
| CNAME | `app`   | `controlobra-g6u39.ondigitalocean.app`     | ⚪ OFF | ERP (proxy OFF porque DO maneja su SSL) |

> **Importante**: el record `app` debe tener proxy OFF (nube gris), si no DigitalOcean no podrá emitir el SSL.

---

## Fase 2 — ERP en DigitalOcean (15 min)

### 2.1 Agregar dominio al App Platform

1. Entrar a <https://cloud.digitalocean.com/apps>
2. Abrir tu app `controlobra` (la del ERP)
3. **Settings** → **Domains** → **Add Domain**
4. Escribir: `app.controlobra.ai`
5. DO te pedirá agregar un TXT record para verificación → cópialo
6. Volver a Cloudflare DNS → agregar el TXT (proxy OFF)
7. Click **Verify** en DO → esperar ~5 min
8. DO emite SSL automático (Let's Encrypt)

### 2.2 Push de los cambios del backend

Los cambios de código ya están listos:
- `.do/app.yaml`: `CORS_ORIGINS` apunta a controlobra.ai ✓
- `backend/app/core/config.py`: `frontend_url` y `vapid_subject` apuntan a app.controlobra.ai ✓
- `backend/app/main.py`: admin email .ai ✓

```bash
cd /Users/carlosramirez/Developer/APP-CMP
git add .do/app.yaml backend/app/core/config.py backend/app/main.py backend/app/routers/push.py
git commit -m "feat(deploy): migrate to controlobra.ai + app.controlobra.ai subdomain"
git push origin main
```

DigitalOcean autodeploya en 3-5 min. Cuando termine:
- Probar `https://app.controlobra.ai/healthz` → debe devolver `{"status":"ok"}`
- Probar `https://app.controlobra.ai/login` → debe abrir el login del ERP

### 2.3 Actualizar Google OAuth Console

> Solo si usas login con Google.

1. Entrar a <https://console.cloud.google.com/apis/credentials>
2. Buscar el OAuth Client (el del `client_id` que está en MEMORY.md)
3. **Authorized JavaScript origins** → agregar:
   - `https://app.controlobra.ai`
4. **Authorized redirect URIs** (si aplica) → agregar:
   - `https://app.controlobra.ai`
5. Guardar

---

## Fase 3 — Landing en Cloudflare Pages (10 min)

### 3.1 Crear repo en GitHub

```bash
cd /Users/carlosramirez/Developer/controlobra-web

# Si no tienes remote configurado:
gh repo create cmra79-bot/controlobra-web --public --source=. --remote=origin --push

# O manual:
git remote add origin https://github.com/cmra79-bot/controlobra-web.git
git push -u origin main
```

### 3.2 Conectar Cloudflare Pages

1. En Cloudflare → **Pages** → **Create a project** → **Connect to Git**
2. Autorizar GitHub y seleccionar `cmra79-bot/controlobra-web`
3. Configuración del build:
   - **Framework preset**: Astro
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/`
4. **Save and Deploy**
5. Cloudflare construye y te da una URL tipo `controlobra-web-abc.pages.dev`

### 3.3 Conectar dominio raíz

1. En el proyecto de Cloudflare Pages → **Custom domains** → **Set up a custom domain**
2. Escribir: `controlobra.ai`
3. Click **Continue** → Cloudflare detectará automáticamente que el DNS está en su panel
4. Repetir para `www.controlobra.ai`
5. SSL automático en 1-2 min

---

## Fase 4 — Verificación final (5 min)

Checklist post-deploy:

- [ ] `https://controlobra.ai` carga la landing (hero, módulos, ROI, FAQ)
- [ ] `https://www.controlobra.ai` redirige a la raíz
- [ ] Botón "Iniciar sesión" del nav lleva a `https://app.controlobra.ai/login`
- [ ] Botón "Demo gratis" lleva a `https://app.controlobra.ai/login`
- [ ] `https://app.controlobra.ai` carga el ERP
- [ ] `https://app.controlobra.ai/healthz` → `{"status":"ok"}`
- [ ] Login con `admin / admin123` funciona
- [ ] Login con Google funciona (si OAuth lo configuraste)
- [ ] La consola del browser no muestra errores de CORS
- [ ] `https://controlobra.ai/sitemap.xml` y `/robots.txt` accesibles
- [ ] Compartir el link en WhatsApp muestra el OG image correcto

---

## Troubleshooting

**CORS error en login**
→ Verificar que `CORS_ORIGINS` en DO incluya `https://app.controlobra.ai` (Settings → Components → api → Environment Variables)

**SSL error en app.controlobra.ai**
→ Esperar 10 min más. Si persiste, verificar que el CNAME en Cloudflare tenga proxy **OFF** (nube gris).

**El dominio raíz no carga**
→ Verificar que Cloudflare Pages tenga la URL pages.dev como CNAME del root, con proxy **ON** (nube naranja).

**Google OAuth "redirect_uri_mismatch"**
→ Falta agregar `https://app.controlobra.ai` en la Google Cloud Console.

---

## Costos finales

| Servicio | Plan | Costo/mes |
|---|---|---|
| Dominio `controlobra.ai` | Anual | ~$1/mes ($14/año) |
| Cloudflare DNS + Pages | Free | $0 |
| DigitalOcean Backend `basic-xxs` | Plan actual | $5 |
| DigitalOcean Postgres `db-s-dev-database` | Plan actual | $7 |
| **Total mensual** | | **~$13** |

(Cloudflare Pages tiene unlimited bandwidth gratis — el landing escala sin costo extra.)
