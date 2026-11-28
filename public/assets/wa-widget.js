/* ═══ Botón de WhatsApp «pro» (28-nov-2026) ════════════════════════════════
   Un solo archivo para toda la web (portada, precios, análisis, guías): se
   carga con <script src="/assets/wa-widget.js" defer></script> y se arma solo.

   Qué hace:
   · Botón flotante de vidrio oscuro con el ícono verde de WhatsApp, un aro que
     gira lento y un globito naranja «1» hasta que lo abren.
   · Al tocarlo abre una mini-ventana de chat: foto del equipo, «En línea» o
     «Fuera de horario» según la hora de RD, un mensaje de bienvenida que se
     «escribe», y respuestas rápidas que cambian según la página donde está la
     persona (en una guía o un precio, el mensaje ya dice cuál está viendo).
   · Después de un rato en la página (o al bajar un poco) asoma una burbuja
     corta de invitación, UNA vez por visita; si la cierran no vuelve.
   · Se esconde mientras está abierto el formulario de demo.
   · Accesible: teclado (Esc cierra, el foco vuelve al botón), lector de
     pantalla y movimiento reducido. En el celular, la ventana sale abajo a
     todo el ancho.
   · Cada clic a WhatsApp se cuenta en Google Analytics (evento
     `whatsapp_click`, con la opción y la página).

   Textos en español y en inglés: toma el idioma de <html lang>. */
(function () {
  'use strict';
  if (window.__mwWa) return;
  window.__mwWa = true;

  var TEL = '18096376377';
  var EN = /^en/i.test(document.documentElement.lang || '');
  var path = location.pathname;
  var enPrecios = /^\/(en\/)?(precios|analisis|guias|metodologia|prices|guides)/.test(path);

  // Título limpio de la página para el mensaje («estoy viendo …»).
  var titulo = (document.title || '').split(/\s[|·–—]\s/)[0].trim();
  var url = location.origin + path;

  var T = EN ? {
    team: 'Manestro team',
    online: 'Online · replies in minutes',
    offline: 'We reply first thing in the morning',
    hi: enPrecios
      ? 'Hi! 👋 Planning a build? We can help you with prices, cost breakdowns or a full budget.'
      : 'Hi! 👋 I’m from the Manestro team. How can we help with your construction company?',
    pick: 'Choose an option or write to us:',
    cta: 'Open WhatsApp chat',
    teaser: 'Questions? We reply on WhatsApp in minutes.',
    fab: 'Chat with us on WhatsApp',
    close: 'Close',
    hours: 'Mon–Fri 8 am–6 pm · Sat 9 am–1 pm (DR time)',
    generic: 'Hi, I visited controlobra.ai and I have a question.',
    opts: enPrecios ? [
      ['I want to budget my build', 'Hi, I’m looking at “' + titulo + '” on controlobra.ai and I’d like help budgeting my build.'],
      ['Question about this price', 'Hi, I have a question about “' + titulo + '”: ' + url],
      ['I want to see Manestro', 'Hi, I came from controlobra.ai and I’d like to learn about Manestro for my company.'],
    ] : [
      ['Book a demo', 'Hi, I visited controlobra.ai and I’d like a demo of Manestro for my construction company.'],
      ['Plans and pricing', 'Hi, I’d like to know Manestro’s plans and pricing.'],
      ['I use Excel today', 'Hi, today I manage my projects in Excel. What would moving to Manestro look like?'],
    ],
  } : {
    team: 'Equipo Manestro',
    online: 'En línea · responde en minutos',
    offline: 'Te respondemos a primera hora',
    hi: enPrecios
      ? '¡Hola! 👋 ¿Estás presupuestando una obra? Te ayudamos con precios, análisis o con el presupuesto completo.'
      : '¡Hola! 👋 Soy del equipo de Manestro. ¿En qué te ayudamos con tu constructora?',
    pick: 'Elige una opción o escríbenos:',
    cta: 'Abrir chat en WhatsApp',
    teaser: '¿Dudas? Te respondemos por WhatsApp en minutos.',
    fab: 'Escríbenos por WhatsApp',
    close: 'Cerrar',
    hours: 'Lun–Vie 8 a.m.–6 p.m. · Sáb 9 a.m.–1 p.m.',
    generic: 'Hola, vi controlobra.ai y tengo una consulta.',
    opts: enPrecios ? [
      ['Quiero presupuestar mi obra', 'Hola, estoy viendo «' + titulo + '» en controlobra.ai y quiero ayuda para presupuestar mi obra.'],
      ['Tengo una duda sobre este precio', 'Hola, tengo una duda sobre «' + titulo + '»: ' + url],
      ['Quiero conocer Manestro', 'Hola, vengo de controlobra.ai y quiero conocer Manestro para mi empresa.'],
    ] : [
      ['Quiero ver una demo', 'Hola, vi controlobra.ai y quiero ver una demo de Manestro para mi constructora.'],
      ['Planes y precios', 'Hola, quisiera saber los planes y precios de Manestro.'],
      ['Hoy uso Excel, ¿cómo paso?', 'Hola, hoy llevo mis obras en Excel. ¿Cómo sería pasar a Manestro?'],
    ],
  };

  // «En línea» según la hora de República Dominicana (UTC−4, sin horario de verano).
  function enLinea() {
    var d = new Date(Date.now() - 4 * 3600 * 1000);
    var dia = d.getUTCDay(), h = d.getUTCHours();
    if (dia >= 1 && dia <= 5) return h >= 8 && h < 18;
    if (dia === 6) return h >= 9 && h < 13;
    return false;
  }

  function waLink(texto) {
    return 'https://wa.me/' + TEL + '?text=' + encodeURIComponent(texto);
  }

  function track(nombre, extra) {
    try {
      if (typeof window.gtag === 'function') {
        var p = { pagina: path };
        for (var k in extra) p[k] = extra[k];
        window.gtag('event', nombre, p);
      }
    } catch (e) {}
  }

  function store(tipo, clave, valor) {
    try {
      var s = window[tipo];
      if (valor === undefined) return s.getItem(clave);
      s.setItem(clave, valor);
    } catch (e) { return null; }
  }

  var ICON = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12.05 21.785h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.464 3.488"/></svg>';
  var X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  var ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  var CSS = '' +
  '.mwa{--g:#25D366;--g2:#1EBE5D;--o:#F26B1F;position:fixed;z-index:820;right:max(18px,env(safe-area-inset-right));bottom:calc(18px + env(safe-area-inset-bottom));font-family:Manrope,Inter,system-ui,sans-serif;color:#E8EAEE;-webkit-font-smoothing:antialiased;letter-spacing:-.005em}' +
  '.mwa *{box-sizing:border-box}' +
  '.mwa button{font:inherit;color:inherit;border:0;background:none;cursor:pointer;-webkit-tap-highlight-color:transparent}' +
  /* botón */
  '.mwa-fab{position:relative;width:60px;height:60px;border-radius:50%;display:grid;place-items:center;color:var(--g);background:radial-gradient(120% 120% at 30% 20%,rgba(37,211,102,.22),rgba(12,16,22,.92) 60%);-webkit-backdrop-filter:blur(14px) saturate(150%);backdrop-filter:blur(14px) saturate(150%);box-shadow:inset 0 1px 0 rgba(255,255,255,.12),inset 0 0 0 1px rgba(255,255,255,.08),0 14px 34px -10px rgba(37,211,102,.55),0 10px 30px -12px rgba(0,0,0,.8);transform:scale(.4) translateY(20px);opacity:0;transition:transform .55s cubic-bezier(.34,1.56,.64,1),opacity .35s ease,box-shadow .25s ease,color .25s ease}' +
  '.mwa.in .mwa-fab{transform:none;opacity:1}' +
  '.mwa-fab::before{content:"";position:absolute;inset:-2px;border-radius:50%;padding:2px;background:conic-gradient(from var(--a,0deg),transparent 0 55%,rgba(37,211,102,.95) 75%,rgba(255,255,255,.9) 80%,transparent 86%);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;animation:mwaSpin 4.5s linear infinite;pointer-events:none}' +
  '.mwa-fab::after{content:"";position:absolute;inset:0;border-radius:50%;box-shadow:0 0 0 0 rgba(37,211,102,.5);animation:mwaPing 3.2s cubic-bezier(.2,.6,.3,1) 1.5s infinite;pointer-events:none}' +
  '.mwa-fab:hover{color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,.16),inset 0 0 0 1px rgba(37,211,102,.45),0 18px 40px -10px rgba(37,211,102,.75),0 10px 30px -12px rgba(0,0,0,.8)}' +
  '.mwa-fab:focus-visible{outline:2px solid var(--g);outline-offset:4px}' +
  '.mwa-fab .ic,.mwa-fab .ix{position:absolute;inset:0;display:grid;place-items:center;transition:transform .4s cubic-bezier(.34,1.56,.64,1),opacity .25s ease}' +
  '.mwa-fab .ic svg{width:29px;height:29px;filter:drop-shadow(0 0 10px rgba(37,211,102,.55))}' +
  '.mwa-fab .ix{opacity:0;transform:rotate(-90deg) scale(.5);color:#E8EAEE}' +
  '.mwa-fab .ix svg{width:22px;height:22px}' +
  '.mwa.open .mwa-fab .ic{opacity:0;transform:rotate(90deg) scale(.5)}' +
  '.mwa.open .mwa-fab .ix{opacity:1;transform:none}' +
  '.mwa.open .mwa-fab::after,.mwa.open .mwa-fab::before{animation-play-state:paused;opacity:0}' +
  '.mwa-badge{position:absolute;top:-3px;right:-3px;min-width:20px;height:20px;padding:0 5px;border-radius:99px;background:var(--o);color:#fff;font:800 11px/20px Manrope,system-ui,sans-serif;text-align:center;box-shadow:0 0 0 2px #06080C,0 4px 12px rgba(242,107,31,.6);transform:scale(0);transition:transform .4s cubic-bezier(.34,1.56,.64,1) .9s}' +
  '.mwa.in .mwa-badge{transform:scale(1)}' +
  '.mwa.seen .mwa-badge{transform:scale(0);transition-delay:0s}' +
  /* burbuja de invitación */
  '.mwa-teaser{position:absolute;right:74px;bottom:8px;width:max-content;max-width:min(280px,calc(100vw - 110px));display:flex;align-items:center;gap:10px;padding:11px 12px 11px 14px;border-radius:16px 16px 4px 16px;background:rgba(14,18,24,.88);-webkit-backdrop-filter:blur(16px) saturate(150%);backdrop-filter:blur(16px) saturate(150%);box-shadow:inset 0 0 0 1px rgba(255,255,255,.09),inset 0 1px 0 rgba(255,255,255,.08),0 18px 40px -16px rgba(0,0,0,.85);font-size:13.5px;font-weight:600;line-height:1.35;color:#E8EAEE;opacity:0;transform:translateX(10px) scale(.96);transform-origin:right bottom;pointer-events:none;transition:opacity .3s ease,transform .45s cubic-bezier(.34,1.56,.64,1)}' +
  '.mwa.tease .mwa-teaser{opacity:1;transform:none;pointer-events:auto}' +
  '.mwa.open .mwa-teaser{opacity:0;transform:translateX(10px) scale(.96);pointer-events:none}' +
  '.mwa-teaser .t{cursor:pointer;text-align:left}' +
  '.mwa-teaser .t b{color:#fff}' +
  '.mwa-teaser .x{flex:none;width:24px;height:24px;border-radius:50%;display:grid;place-items:center;color:#8E96A2;background:rgba(255,255,255,.05);transition:background .2s,color .2s}' +
  '.mwa-teaser .x:hover{color:#fff;background:rgba(255,255,255,.12)}' +
  '.mwa-teaser .x svg{width:13px;height:13px}' +
  /* ventana */
  '.mwa-panel{position:absolute;right:0;bottom:76px;width:360px;max-width:calc(100vw - 32px);border-radius:22px;overflow:hidden;background:linear-gradient(180deg,rgba(18,23,31,.94),rgba(10,13,18,.96));-webkit-backdrop-filter:blur(20px) saturate(150%);backdrop-filter:blur(20px) saturate(150%);box-shadow:inset 0 0 0 1px rgba(255,255,255,.09),inset 0 1px 0 rgba(255,255,255,.1),0 40px 80px -30px rgba(0,0,0,.95),0 0 60px -20px rgba(37,211,102,.25);opacity:0;visibility:hidden;transform:translateY(14px) scale(.96);transform-origin:right bottom;transition:opacity .25s ease,transform .4s cubic-bezier(.34,1.4,.64,1),visibility 0s linear .4s}' +
  '.mwa.open .mwa-panel{opacity:1;visibility:visible;transform:none;transition:opacity .25s ease,transform .45s cubic-bezier(.34,1.4,.64,1),visibility 0s}' +
  '.mwa-hd{position:relative;display:flex;align-items:center;gap:12px;padding:16px 16px 14px;background:radial-gradient(120% 140% at 0% 0%,rgba(37,211,102,.18),transparent 55%);border-bottom:1px solid rgba(255,255,255,.07)}' +
  '.mwa-av{position:relative;flex:none;width:44px;height:44px;border-radius:50%;background:#0B0F14 center/cover no-repeat;box-shadow:inset 0 0 0 1px rgba(255,255,255,.12)}' +
  '.mwa-av i{position:absolute;right:0;bottom:0;width:12px;height:12px;border-radius:50%;background:#8E96A2;box-shadow:0 0 0 2.5px #10151C}' +
  '.mwa-on .mwa-av i{background:var(--g);animation:mwaLive 2.2s ease-in-out infinite}' +
  '.mwa-hd .n{font-weight:800;font-size:15px;color:#fff;line-height:1.2}' +
  '.mwa-hd .s{display:flex;align-items:center;gap:6px;margin-top:3px;font-size:12px;color:#9AA3B2}' +
  '.mwa-on .mwa-hd .s{color:#7FE0A6}' +
  '.mwa-hd .cl{margin-left:auto;align-self:flex-start;width:30px;height:30px;border-radius:50%;display:grid;place-items:center;color:#9AA3B2;transition:background .2s,color .2s}' +
  '.mwa-hd .cl:hover{background:rgba(255,255,255,.08);color:#fff}' +
  '.mwa-hd .cl:focus-visible{outline:2px solid var(--g);outline-offset:1px}' +
  '.mwa-hd .cl svg{width:16px;height:16px}' +
  '.mwa-bd{padding:16px;background:linear-gradient(rgba(255,255,255,.022) 1px,transparent 1px) 0 0/22px 22px,linear-gradient(90deg,rgba(255,255,255,.022) 1px,transparent 1px) 0 0/22px 22px}' +
  '.mwa-msg{position:relative;max-width:88%;padding:11px 13px 18px;border-radius:4px 16px 16px 16px;background:rgba(255,255,255,.06);box-shadow:inset 0 0 0 1px rgba(255,255,255,.07);font-size:14px;line-height:1.45;color:#E8EAEE}' +
  '.mwa-msg time{position:absolute;right:10px;bottom:5px;font:500 10px/1 "JetBrains Mono",ui-monospace,monospace;color:#7C8290}' +
  '.mwa-typing{display:inline-flex;gap:4px;padding:13px 14px;border-radius:4px 16px 16px 16px;background:rgba(255,255,255,.06);box-shadow:inset 0 0 0 1px rgba(255,255,255,.07)}' +
  '.mwa-typing b{width:6px;height:6px;border-radius:50%;background:#9AA3B2;animation:mwaDot 1.1s ease-in-out infinite}' +
  '.mwa-typing b:nth-child(2){animation-delay:.15s}.mwa-typing b:nth-child(3){animation-delay:.3s}' +
  '.mwa-pick{margin:14px 0 8px;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#7C8290}' +
  '.mwa-opts{display:grid;gap:7px}' +
  '.mwa-opt{display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;padding:11px 13px;border-radius:12px;text-align:left;text-decoration:none;font-size:13.5px;font-weight:600;color:#E8EAEE;background:rgba(255,255,255,.035);box-shadow:inset 0 0 0 1px rgba(255,255,255,.08);transition:background .2s,box-shadow .2s,transform .2s,color .2s}' +
  '.mwa-opt svg{flex:none;width:15px;height:15px;color:#7C8290;transition:transform .2s,color .2s}' +
  '.mwa-opt:hover,.mwa-opt:focus-visible{outline:none;color:#fff;background:rgba(37,211,102,.08);box-shadow:inset 0 0 0 1px rgba(37,211,102,.45)}' +
  '.mwa-opt:hover svg,.mwa-opt:focus-visible svg{color:var(--g);transform:translateX(3px)}' +
  '.mwa-ft{padding:12px 16px 14px;border-top:1px solid rgba(255,255,255,.07)}' +
  '.mwa-go{display:flex;align-items:center;justify-content:center;gap:9px;width:100%;height:46px;border-radius:999px;text-decoration:none;font-weight:800;font-size:14.5px;color:#06180D;background:linear-gradient(180deg,#3BE07A,var(--g) 55%,var(--g2));box-shadow:inset 0 1px 0 rgba(255,255,255,.45),0 10px 26px -10px rgba(37,211,102,.8);transition:filter .2s,transform .2s,box-shadow .2s}' +
  '.mwa-go svg{width:19px;height:19px}' +
  '.mwa-go:hover{filter:brightness(1.06);transform:translateY(-1px);box-shadow:inset 0 1px 0 rgba(255,255,255,.5),0 14px 30px -10px rgba(37,211,102,.95)}' +
  '.mwa-go:focus-visible{outline:2px solid #fff;outline-offset:3px}' +
  '.mwa-hr{margin-top:9px;text-align:center;font-size:11px;color:#7C8290}' +
  '.mwa.hide{opacity:0;pointer-events:none;transform:translateY(10px);transition:opacity .2s,transform .2s}' +
  '.mwa{transition:opacity .2s,transform .2s}' +
  '@keyframes mwaSpin{to{transform:rotate(360deg)}}' +
  '@keyframes mwaPing{0%{box-shadow:0 0 0 0 rgba(37,211,102,.45)}60%,100%{box-shadow:0 0 0 18px rgba(37,211,102,0)}}' +
  '@keyframes mwaLive{0%,100%{box-shadow:0 0 0 2.5px #10151C,0 0 0 0 rgba(37,211,102,.6)}50%{box-shadow:0 0 0 2.5px #10151C,0 0 0 5px rgba(37,211,102,0)}}' +
  '@keyframes mwaDot{0%,60%,100%{transform:translateY(0);opacity:.5}30%{transform:translateY(-4px);opacity:1}}' +
  '@keyframes mwaIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}' +
  '.mwa-msg,.mwa-pick,.mwa-opt{animation:mwaIn .35s ease both}' +
  '@media (max-width:640px){' +
    '.mwa{right:max(14px,env(safe-area-inset-right));bottom:calc(14px + env(safe-area-inset-bottom))}' +
    '.mwa-fab{width:56px;height:56px}' +
    '.mwa-fab .ic svg{width:27px;height:27px}' +
    '.mwa-teaser{right:68px;bottom:6px;font-size:13px}' +
    '.mwa-panel{position:fixed;left:10px;right:10px;bottom:calc(84px + env(safe-area-inset-bottom));width:auto;max-width:none;transform-origin:center bottom}' +
  '}' +
  '@media (prefers-reduced-motion:reduce){' +
    '.mwa *,.mwa{animation:none!important;transition-duration:.01ms!important}' +
  '}';

  function build() {
    var st = document.createElement('style');
    st.id = 'mwa-css';
    st.textContent = CSS;
    document.head.appendChild(st);

    var on = enLinea();
    var root = document.createElement('div');
    root.className = 'mwa' + (on ? ' mwa-on' : '');
    if (store('localStorage', 'mwa_seen')) root.classList.add('seen');

    root.innerHTML =
      '<div class="mwa-panel" id="mwa-panel" role="dialog" aria-modal="false" aria-labelledby="mwa-n">' +
        '<div class="mwa-hd">' +
          '<div class="mwa-av"><i></i></div>' +
          '<div><div class="n" id="mwa-n">' + T.team + '</div><div class="s">' + (on ? T.online : T.offline) + '</div></div>' +
          '<button class="cl" type="button" aria-label="' + T.close + '">' + X + '</button>' +
        '</div>' +
        '<div class="mwa-bd" aria-live="polite"></div>' +
        '<div class="mwa-ft">' +
          '<a class="mwa-go" href="' + waLink(T.generic) + '" target="_blank" rel="noopener noreferrer" data-op="abrir_chat">' + ICON + T.cta + '</a>' +
          '<div class="mwa-hr">' + T.hours + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="mwa-teaser" role="status">' +
        '<button class="t" type="button">' + T.teaser + '</button>' +
        '<button class="x" type="button" aria-label="' + T.close + '">' + X + '</button>' +
      '</div>' +
      '<button class="mwa-fab" type="button" aria-label="' + T.fab + '" aria-expanded="false" aria-controls="mwa-panel">' +
        '<span class="ic">' + ICON + '</span><span class="ix">' + X + '</span>' +
        '<span class="mwa-badge" aria-hidden="true">1</span>' +
      '</button>';
    document.body.appendChild(root);

    var fab = root.querySelector('.mwa-fab');
    var panel = root.querySelector('.mwa-panel');
    var body = root.querySelector('.mwa-bd');
    var av = root.querySelector('.mwa-av');
    var filled = false, timer = null;

    function hora() {
      var d = new Date();
      return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
    }

    function fill() {
      if (filled) return;
      filled = true;
      av.style.backgroundImage = 'url(/assets/favicon-180.png)';
      var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      body.innerHTML = '<div class="mwa-typing" aria-hidden="true"><b></b><b></b><b></b></div>';
      timer = setTimeout(function () {
        var html = '<div class="mwa-msg">' + T.hi + '<time>' + hora() + '</time></div>' +
          '<div class="mwa-pick">' + T.pick + '</div><div class="mwa-opts">';
        T.opts.forEach(function (o, i) {
          html += '<a class="mwa-opt" style="animation-delay:' + (0.08 * (i + 1)) + 's" href="' + waLink(o[1]) +
            '" target="_blank" rel="noopener noreferrer" data-op="' + o[0] + '">' + o[0] + ARROW + '</a>';
        });
        body.innerHTML = html + '</div>';
      }, reduce ? 0 : 900);
    }

    function hideTeaser(forever) {
      root.classList.remove('tease');
      if (forever) store('sessionStorage', 'mwa_teaser', '1');
    }

    function open(origen) {
      hideTeaser(true);
      fill();
      root.classList.add('open', 'seen');
      fab.setAttribute('aria-expanded', 'true');
      fab.setAttribute('aria-label', T.close);
      store('localStorage', 'mwa_seen', '1');
      track('whatsapp_abrir', { origen: origen });
      setTimeout(function () {
        var first = panel.querySelector('.mwa-opt') || panel.querySelector('.mwa-go');
        if (first && root.classList.contains('open')) first.focus({ preventScroll: true });
      }, 950);
    }

    function close(volverFoco) {
      if (!root.classList.contains('open')) return;
      root.classList.remove('open');
      fab.setAttribute('aria-expanded', 'false');
      fab.setAttribute('aria-label', T.fab);
      if (volverFoco) fab.focus({ preventScroll: true });
    }

    fab.addEventListener('click', function () {
      root.classList.contains('open') ? close(false) : open('boton');
    });
    root.querySelector('.cl').addEventListener('click', function () { close(true); });
    root.querySelector('.mwa-teaser .t').addEventListener('click', function () { open('invitacion'); });
    root.querySelector('.mwa-teaser .x').addEventListener('click', function () {
      hideTeaser(true);
      track('whatsapp_invitacion_cerrada', {});
    });

    // Cualquier clic que sale a WhatsApp se cuenta (opción elegida + página).
    root.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[data-op]');
      if (!a) return;
      track('whatsapp_click', { opcion: a.getAttribute('data-op') });
      setTimeout(function () { close(false); }, 300);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && root.classList.contains('open')) close(true);
    });
    document.addEventListener('pointerdown', function (e) {
      if (root.classList.contains('open') && !root.contains(e.target)) close(false);
    });

    // Aparece con una entrada suave (después de la pantalla de carga de la portada).
    setTimeout(function () { root.classList.add('in'); }, document.getElementById('fx-pre') ? 2200 : 900);

    // Invitación: una vez por visita, a los 14 s o al bajar un 35 % de la página.
    if (!store('sessionStorage', 'mwa_teaser')) {
      var shown = false;
      var tease = function () {
        if (shown || root.classList.contains('open') || root.classList.contains('hide')) return;
        shown = true;
        root.classList.add('tease');
        track('whatsapp_invitacion', {});
        setTimeout(function () { hideTeaser(false); }, 12000);
        window.removeEventListener('scroll', onScroll);
      };
      var onScroll = function () {
        var h = document.documentElement.scrollHeight - innerHeight;
        if (h > 0 && scrollY / h > 0.35) tease();
      };
      setTimeout(tease, 14000);
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    // Se esconde mientras el formulario de demo de la portada está abierto.
    var demo = document.getElementById('demoOverlay');
    if (demo && 'MutationObserver' in window) {
      new MutationObserver(function () {
        var o = demo.classList.contains('open');
        root.classList.toggle('hide', o);
        if (o) { close(false); hideTeaser(false); }
      }).observe(demo, { attributes: true, attributeFilter: ['class'] });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
