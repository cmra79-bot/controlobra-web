# Seguridad de controlobra.ai — copias y robots de IA

Última revisión: 28-nov-2026.

## La verdad primero

Una web pública **nunca** se puede proteger al 100 % contra copias: todo lo que
el navegador de un visitante puede mostrar, alguien con paciencia lo puede
guardar. Lo que sí se puede es **subirle mucho el costo** a quien quiera
copiarla en masa, **cerrar la puerta a los robots que entrenan IA**, dejar
**constancia legal** de que no está autorizado y **proteger a los visitantes**.
El valor real (el ERP, los precios, los APU) vive detrás del login en
`app.controlobra.ai`, y eso no se copia desde la web pública.

Regla que no se rompe: **Google, Bing y las vistas previas de WhatsApp /
Facebook / X / LinkedIn / Telegram siempre entran.** Son los que traen clientes.

## Lo que está en el código (este repo)

| Archivo | Qué hace |
|---|---|
| `public/robots.txt` | Les dice «no» a ~27 robots que copian para entrenar IA (GPTBot, ClaudeBot, CCBot, Google-Extended, Applebot-Extended, Bytespider, meta-externalagent, Amazonbot, Diffbot…). Deja pasar a todos los demás. Agrega la señal `Content-Signal: search=yes, ai-input=yes, ai-train=no`. |
| `public/_headers` | Cabeceras de seguridad que Cloudflare Pages manda con cada página: HSTS, anti-marco (nadie mete la web dentro de la suya), CSP (solo se carga código de acá, Google Fonts/Analytics, formsubmit y el ERP), `nosniff`, `Referrer-Policy`, `Permissions-Policy` y el aviso legal `tdm-reservation: 1`. |
| `public/.well-known/tdmrep.json` | Reserva legal de minería de datos (protocolo TDMRep): «no autorizo usar este contenido para entrenar IA». |

**Bloquear Google-Extended no afecta el posicionamiento en Google**: solo le dice
a Google que no use la web para entrenar Gemini. Google Search sigue igual.

**Los buscadores con IA que citan con enlace** (ChatGPT Search, Perplexity,
Claude Search) se dejan entrar a propósito: mandan visitas, igual que Google.
Si se decide cerrarlos también, agregar al bloque de `Disallow` de robots.txt:
`OAI-SearchBot`, `ChatGPT-User`, `PerplexityBot`, `Perplexity-User`,
`Claude-SearchBot`, `Claude-User`.

### Si se agrega algo nuevo a la web

La CSP bloquea cualquier script, fuente, iframe o conexión a un dominio que no
esté en la lista. Si se agrega un servicio nuevo (otro analytics, un chat, un
video de YouTube…), hay que sumar su dominio en `public/_headers`, o se verá
roto. Para probar: abrir la página, F12 → Consola, y buscar
«Content Security Policy».

## Lo que se hace en el panel de Cloudflare (dash.cloudflare.com → controlobra.ai)

Robots.txt es un aviso; los robots tramposos lo ignoran. Estos interruptores son
el candado de verdad. Todos están en el plan gratis.

1. **Bloquear robots de IA** — *Security → Settings* (o *Security → Bots* en el
   panel viejo) → **Block AI bots** → elegir **«Block on all pages»**.
   Cloudflare reconoce a los robots de IA por su huella, aunque mientan en el
   nombre. No toca a Google, Bing ni a WhatsApp/Facebook.
2. **Laberinto para IA** — en la misma página, **AI Labyrinth → On**. A los
   robots que se cuelan sin permiso les sirve páginas falsas generadas, y los
   hace perder tiempo en vez de copiar.
3. **Ver quién está entrando** — *AI Crawl Control* (antes «AI Audit»): lista
   qué robots de IA visitan la web y cuántas veces. Desde ahí se puede bloquear
   uno por uno.
4. **Robots.txt administrado: dejarlo apagado** — *AI Crawl Control → Robots.txt*.
   Ya tenemos el nuestro; con los dos prendidos se mezclan.
5. **Regla anti-copiadoras** — *Security → WAF → Custom rules → Create rule*:
   - Nombre: `Copiadoras de sitios`
   - Clic en **Edit expression** y pegar:
     ```
     (http.user_agent contains "HTTrack" or http.user_agent contains "WebCopier" or http.user_agent contains "WebZIP" or http.user_agent contains "Teleport" or http.user_agent contains "SiteSucker" or http.user_agent contains "Offline Explorer" or http.user_agent contains "wget" or http.user_agent contains "python-requests" or http.user_agent contains "Scrapy" or http.user_agent contains "Go-http-client" or http.user_agent contains "HeadlessChrome" or http.user_agent eq "") and not cf.client.bot
     ```
   - Acción: **Managed Challenge** → Deploy.
   - `not cf.client.bot` = nunca le toca a los robots verificados (Google,
     Bing, Facebook…).
6. **Límite de velocidad** — *Security → WAF → Rate limiting rules → Create rule*:
   - Nombre: `Demasiadas páginas`
   - Si: *Custom expression* → `(not cf.client.bot)`
   - Misma IP, **más de 120 solicitudes en 10 segundos** → **Block** por 10
     segundos. Una persona normal no llega ni a 30; un robot que se baja la web
     entera, sí.
7. **Protección de imágenes** — *Scrape Shield* → **Hotlink Protection → On**
   (otras webs no pueden mostrar nuestras imágenes como si fueran suyas) y
   **Email Address Obfuscation → On** (esconde correos de los robots de spam).
8. **Bot Fight Mode: dejarlo APAGADO por ahora.** En el plan gratis no se le
   pueden hacer excepciones y puede frenar la vista previa de WhatsApp (que se
   acaba de arreglar). Los puntos 1, 2, 5 y 6 cubren casi lo mismo sin ese
   riesgo.

### Después de tocar Cloudflare, probar siempre

- Pegar `https://controlobra.ai` en un chat de WhatsApp: tiene que salir la
  imagen y el título.
- <https://developers.facebook.com/tools/debug/> → pegar la URL → «Scrape
  Again»: sin errores.
- Google Search Console → *Inspección de URLs* → «Probar URL publicada»: tiene
  que decir que Google puede acceder.
- Si algo falla, desactivar la última regla que se prendió.

## Lo que NO conviene hacer

- **Bloquear clic derecho o seleccionar texto**: se salta en 2 segundos
  (F12, o ver el código), molesta a los clientes reales y empeora la
  accesibilidad.
- **Ofuscar el JavaScript de las demos**: las vuelve más lentas y pesadas, y
  quien quiera copiar una animación la copia igual. No protege nada de valor.
- **Pedir login para ver la web**: Google y WhatsApp dejarían de verla.

## Sobre la propiedad

El pie de página dice «© 2026 Manestro». Lo que más protege de verdad es el
registro: inscribir la marca MANESTRO en ONAPI y, si hace falta, el software
en la ONDA (Oficina Nacional de Derecho de Autor). Con eso, ante una copia, se
puede pedir que la bajen (aviso DMCA a su hosting o a Google).
