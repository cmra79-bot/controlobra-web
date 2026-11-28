/* ─────────────────────────────────────────────────────────────────────────────
   fx.js — capa visual "futurista" de la landing (controlobra.ai)

   Sin dependencias: WebGL a mano para las esferas y canvas 2D para las
   partículas. Pesa unos KB en vez de los ~600 KB de Three.js.

   Qué hace:
   1. Hero: esferas 3D (raymarching en un shader) que reaccionan al mouse y al
      scroll, más una red de partículas conectadas.
   2. Franjas oscuras (métricas y cierre): red de partículas suave.
   3. Scroll: barra de progreso, el dashboard del hero se "asienta" en 3D,
      los títulos entran palabra por palabra.
   4. Tarjetas: brillo que sigue al mouse + inclinación leve.

   Cuidados:
   - prefers-reduced-motion → todo quieto (un solo cuadro de las esferas).
   - Móvil → menos resolución, menos pasos de raymarching, menos partículas.
   - Si el equipo no da la talla (cuadros lentos) baja la resolución y, si
     sigue lento, deja las esferas quietas.
   - Cada efecto se pausa cuando sale de pantalla o la pestaña se oculta.
   - Sin WebGL quedan los blobs CSS de siempre.
   Se carga después del script principal (que pinta #root).
   ───────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  var RM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINE = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
  var MOBILE = !FINE || window.innerWidth < 768;
  var DPR = Math.min(window.devicePixelRatio || 1, 2);

  var mouse = { x: 0, y: 0, sx: 0, sy: 0, px: -9999, py: -9999 }; // -1..1 suavizado + px de pantalla
  window.addEventListener('pointermove', function (e) {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
    mouse.px = e.clientX; mouse.py = e.clientY;
  }, { passive: true });
  document.addEventListener('pointerleave', function () { mouse.px = mouse.py = -9999; });

  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };


  /* ════════════════════ 0. TITULAR DEL HERO EN 2 LÍNEAS ════════════════════
     Ajusta el tamaño para que la línea 1 llene el ancho sin pasarse, con la
     fuente que el navegador haya cargado de verdad. Así el titular queda
     siempre en 2 líneas y no brinca cuando cambia la palabra rotativa. */
  (function fitH1() {
    var h = document.querySelector('.hero h1.h1-2l');
    if (!h) return;
    var l1 = h.querySelector('.l1');
    function fit() {
      if (window.innerWidth < 768) { h.style.fontSize = ''; return; }
      h.style.fontSize = '';
      var fs = parseFloat(getComputedStyle(h).fontSize);
      var r = document.createRange(); r.selectNodeContents(l1);
      var w = r.getBoundingClientRect().width, avail = h.clientWidth;
      if (w > 0 && avail > 0) h.style.fontSize = Math.min(76, fs * (avail * .985) / w).toFixed(2) + 'px';
    }
    fit();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
    var t; window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(fit, 100); });
  })();


  /* Títulos de sección: máximo 2 líneas (mismo criterio que el hero).
     Usan todo el ancho disponible y, si aun así pasan de 2 líneas, se achica
     la letra de a 1 px hasta que entren (mínimo 26 px). En móvil no se toca. */
  (function fitTitles() {
    var hs = Array.prototype.slice.call(document.querySelectorAll(
      '.sec-h h2, .po-sec h2, .roi h2, .ai h3, .cta-final h2'));
    if (!hs.length) return;
    hs.forEach(function (h) { h.classList.add('fx-2l'); h._fs0 = h.style.fontSize; });
    function lines(h, fs) {
      var lh = parseFloat(getComputedStyle(h).lineHeight) || fs * 1.08;
      return Math.round(h.getBoundingClientRect().height / lh);
    }
    function fit() {
      hs.forEach(function (h) {
        h.style.fontSize = h._fs0 || '';
        if (window.innerWidth < 768) return;
        var fs = parseFloat(getComputedStyle(h).fontSize), n = 0;
        while (lines(h, fs) > 2 && fs > 26 && n++ < 40) { fs -= 1; h.style.fontSize = fs + 'px'; }
      });
    }
    fit();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
    var t; window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(fit, 120); });
  })();

  /* ════════════════════ 1. ESFERAS 3D (WebGL) ════════════════════
     Esferas analíticas (intersección exacta rayo-esfera, sin raymarching):
     bordes limpios con antialias por cobertura, sin rayas ni escalones.
     Material físico: base naranja metálica + capa de laca (clearcoat) con
     Fresnel de Schlick, reflejos de un estudio fotográfico (softboxes)
     y de las otras esferas, oclusión entre ellas, tonemap ACES y dither. */
  var FRAG = [
    'precision highp float;',
    'uniform vec2 R; uniform float T; uniform vec2 M; uniform float S;',
    'const vec3 ORL = vec3(0.887, 0.147, 0.0134);', // #F26B1F en lineal
    'vec3 C0, C1, C2, C3;',
    'const float R0 = .66, R1 = .22, R2 = .44, R3 = .12;',
    'vec3 cen(int i){ if (i == 0) return C0; if (i == 1) return C1; if (i == 2) return C2; return C3; }',
    'float rad(int i){ if (i == 0) return R0; if (i == 1) return R1; if (i == 2) return R2; return R3; }',
    'float box(vec2 p, vec2 b, float s){ vec2 q = abs(p) - b; float d = length(max(q, 0.)) + min(max(q.x, q.y), 0.); return 1. - smoothstep(-s, s, d); }',
    // Estudio: fondo casi negro, softbox cálido principal, tira cenital, paneles naranjas atrás.
    'float rbox(vec2 p, vec2 b, float rr, float s){ vec2 q = abs(p) - b + rr; float d = length(max(q, 0.)) + min(max(q.x, q.y), 0.) - rr; return 1. - smoothstep(-s, s, d); }',
    'vec3 env(vec3 d, float ro){',
    '  float s = .05 + ro*.45;',
    '  float az = atan(d.x, d.z), el = d.y;',
    '  vec3 c = mix(vec3(.003, .0035, .005), vec3(.02, .022, .028), smoothstep(-.6, 1., el));',
    '  c += ORL*.05*exp(-abs(el + .1)*6.);',
    // softbox principal (arriba, un poco a la izquierda): el reflejo blanco grande
    '  c += vec3(1., .95, .88)*14.*rbox(vec2(az + .15, el - .48), vec2(.34, .2), .1, s);',
    // tira cenital fina
    '  c += vec3(.9, .93, 1.)*.8*rbox(vec2(az - .3, el - .9), vec2(1.2, .03), .03, s);',
    // paneles naranjas detrás: dan el borde de luz de marca
    '  c += ORL*3.2*rbox(vec2(az + 2.2, el - .05), vec2(.12, .6), .1, s*1.4);',
    '  c += ORL*2.*rbox(vec2(az - 2.3, el + .05), vec2(.2, .45), .12, s*1.4);',
    // rebote cálido desde abajo
    '  c += vec3(1., .55, .25)*.22*smoothstep(-.2, -.9, el);',
    '  return c;',
    '}',
    'vec3 aces(vec3 x){ return clamp((x*(2.51*x + .03))/(x*(2.43*x + .59) + .14), 0., 1.); }',
    // Material por esfera: x = es cromo, y = rugosidad de la base, z = laca
    'vec3 mat(int i){ if (i == 1) return vec3(1., .04, 0.); if (i == 2) return vec3(0., .42, .55); return vec3(0., .2, 1.); }',
    'vec3 shade(int id, vec3 p, vec3 n, vec3 rd){',
    '  vec3 m = mat(id);',
    '  vec3 r = reflect(rd, n);',
    '  float nv = clamp(dot(n, -rd), 0., 1.);',
    '  float ao = 1.; float bt = 1e9; vec3 rc = vec3(0.); float rh = 0.;',
    '  for (int j = 0; j < 4; j++){',
    '    if (j == id) continue;',
    '    vec3 dc = cen(j) - p; float l = length(dc), rj = rad(j);',
    '    ao *= 1. - clamp(dot(n, dc/l), 0., 1.)*rj*rj/(l*l);',
    '    float b = dot(dc, r), h = b*b - (l*l - rj*rj);',
    '    if (h > 0. && b > 0.){',
    '      float tt = b - sqrt(h);',
    '      if (tt < bt){ bt = tt; vec3 q = p + r*tt; vec3 nq = normalize(q - cen(j)); vec3 r2 = reflect(r, nq);',
    '        rc = ORL*env(r2, .35)*.9 + env(r2, .02)*(.04 + .96*pow(1. - clamp(dot(nq, -r), 0., 1.), 5.)); rh = 1.; }',
    '    }',
    '  }',
    '  vec3 eRough = mix(env(r, m.y), rc, rh);',
    '  vec3 eSharp = mix(env(r, .0), rc, rh);',
    // laca naranja: difuso con luces de estudio + reflejo metálico suave, y encima la laca brillante
    '  vec3 L1 = normalize(vec3(-.15, .5, .85)), L2 = normalize(vec3(-.85, .05, -.5)), L3 = normalize(vec3(.9, -.05, -.45));',
    '  float wrap1 = pow(max(dot(n, L1)*.75 + .25, 0.), 1.6);',
    '  vec3 dif = vec3(1., .95, .9)*1.25*wrap1 + ORL*1.2*pow(max(dot(n, L2), 0.), 2.) + ORL*.8*pow(max(dot(n, L3), 0.), 2.) + vec3(.03, .03, .035) + vec3(.35, .2, .1)*max(-n.y, 0.)*.4;',
    '  vec3 base = m.x > .5 ? vec3(.92, .9, .88)*eSharp : ORL*dif*.32 + ORL*eRough*.35;',
    '  float F = .04 + .96*pow(1. - nv, 5.);',
    '  vec3 col = base*(1. - F*m.z) + eSharp*F*m.z;',
    '  col += ORL*.18*pow(1. - nv, 3.);', // brillo de borde, sutil
    '  return col*mix(.35, 1., ao);',
    '}',
    'void layer(int i, vec3 ro, vec3 rd, float pxa, inout vec3 col, inout float a){',
    '  vec3 c = cen(i); float r = rad(i);',
    '  vec3 oc = c - ro; float b = dot(oc, rd); if (b <= 0.) return;',
    '  vec3 perp = oc - rd*b; float dp = length(perp);',
    '  float cov = clamp((r - dp)/(b*pxa) + .5, 0., 1.);',
    '  if (cov <= 0.) return;',
    '  vec3 n;',
    '  if (dp < r){ float tt = b - sqrt(r*r - dp*dp); n = (ro + rd*tt - c)/r; }',
    '  else n = -perp/dp;',
    '  vec3 s = aces(shade(i, c + n*r, n, rd));',
    '  col = col*(1. - cov) + s*cov; a = a*(1. - cov) + cov;',
    '}',
    'float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233)))*43758.5453); }',
    'void main(){',
    '  vec2 uv = (gl_FragCoord.xy - .5*R) / R.y;',
    '  float A = R.x / R.y;',
    '  float port = step(A, 1.);',
    '  vec3 up = vec3(0., S*1.6, 0.);',
    '  C0 = vec3(mix(A*1.12, A*1.0, port) + .06*sin(T*.31), mix(.12, 1.3, port) + .09*sin(T*.43), 0.) + up;',
    '  C1 = C0 + vec3(cos(T*.47)*1.05, sin(T*.47)*.32, sin(T*.47)*.9 - .2);',
    '  C2 = vec3(mix(-A*1.05, -A*1.1, port) + .08*sin(T*.27), mix(-1.0, -1.6, port) + .12*sin(T*.36), -1.) + up*.6;',
    '  C3 = vec3(A*.5 + .25*sin(T*.21), 1.05 + .1*cos(T*.33), -.6) + up*1.3;',
    '  vec3 ro = vec3(M.x*.35, -M.y*.22, 4.2);',
    '  vec3 ww = normalize(-ro), uu = normalize(cross(ww, vec3(0., 1., 0.))), vv = cross(uu, ww);',
    '  vec3 rd = normalize(uv.x*uu + uv.y*vv + 1.6*ww);',
    '  float pxa = 1.15/(R.y*1.6);',
    // halo suave alrededor (premultiplicado), detrás de todo
    '  vec3 col = vec3(0.); float a = 0.;',
    '  for (int i = 0; i < 4; i++){',
    // aura viva: un resplandor que respira y unas lenguas de luz que giran alrededor
    '    vec3 oc = cen(i) - ro; float b = max(dot(oc, rd), 0.);',
    '    vec3 pp = rd*b - oc; float dp = length(pp);',
    '    float e = max(dp - rad(i), 0.)/rad(i), fi = float(i);',
    '    float ang = atan(dot(pp, vv), dot(pp, uu));',
    '    float br = 1. + .18*sin(T*1.1 + fi*2.1);',
    '    float w = .5 + .28*sin(ang*3. + T*.9 + fi*1.7) + .22*sin(ang*5. - T*1.35 + fi*.8);',
    '    w = max(w, 0.); w *= w*1.6;',
    '    float g = exp(-e*4.6/br)*(.25 + w*.75)*(i == 0 ? .42 : .3) + exp(-e*1.5/br)*.06;',
    '    vec3 ac = mix(vec3(.9, .2, .03), vec3(1., .5, .12), .5 + .5*sin(ang*2. + T*.6 + fi));',
    '    col += ac*g; a += g;',
    '  }',
    '  a = min(a, .8); col = min(col, vec3(.8));',
    // pintar de atrás hacia adelante (orden por profundidad)
    '  float last = 1e9;',
    '  for (int k = 0; k < 4; k++){',
    '    float best = -1e9; int sel = -1;',
    '    for (int j = 0; j < 4; j++){ float dj = dot(cen(j) - ro, ww) + float(j)*1e-4; if (dj < last && dj > best){ best = dj; sel = j; } }',
    '    if (sel < 0) break;',
    '    last = best;',
    '    for (int j = 0; j < 4; j++){ if (j == sel) layer(j, ro, rd, pxa, col, a); }',
    '  }',
    '  a = clamp(a, 0., 1.);',
    '  vec3 g = pow(max(col/max(a, 1e-4), 0.), vec3(1./2.2));',
    '  g += (hash(gl_FragCoord.xy + fract(T)) - .5)/255.;',
    '  gl_FragColor = vec4(clamp(g, 0., 1.)*a, a);',
    '}'
  ].join('\n');

  function Orbs(canvas) {
    var gl = canvas.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: true, powerPreference: 'low-power' });
    if (!gl) return null;
    var hp = gl.getShaderPrecisionFormat && gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
    var src = FRAG;
    if (!hp || hp.precision === 0) src = src.replace('precision highp float;', 'precision mediump float;');

    function sh(type, s) {
      var o = gl.createShader(type); gl.shaderSource(o, s); gl.compileShader(o);
      if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) { console.warn('[fx]', gl.getShaderInfoLog(o)); return null; }
      return o;
    }
    var vs = sh(gl.VERTEX_SHADER, 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }');
    var fs = sh(gl.FRAGMENT_SHADER, src);
    if (!vs || !fs) return null;
    var pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null;
    gl.useProgram(pr);
    var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var U = { R: gl.getUniformLocation(pr, 'R'), T: gl.getUniformLocation(pr, 'T'), M: gl.getUniformLocation(pr, 'M'), S: gl.getUniformLocation(pr, 'S') };

    // Resolución interna: el shader es caro, se dibuja a menos píxeles y el CSS lo estira (queda suave).
    var scale = MOBILE ? 0.7 : (DPR > 1.5 ? 0.8 : 1);
    var w = 0, h = 0;
    function resize() {
      var r = canvas.getBoundingClientRect();
      w = Math.max(1, Math.round(r.width * DPR * scale));
      h = Math.max(1, Math.round(r.height * DPR * scale));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      gl.viewport(0, 0, w, h);
    }
    resize();
    return {
      resize: resize,
      setScale: function (s) { scale = s; resize(); },
      draw: function (t, mx, my, s) {
        gl.uniform2f(U.R, w, h); gl.uniform1f(U.T, t); gl.uniform2f(U.M, mx, my); gl.uniform1f(U.S, s);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
    };
  }

  /* 2. La red de partículas vive en /assets/fx-net.js (toda la página). */

  /* ════════════════════ 3. MONTAJE ════════════════════ */
  var hero = document.querySelector('.hero');
  var layers = []; // {el, visible, tick(t)}
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { layers.forEach(function (l) { if (l.el === e.target) l.visible = e.isIntersecting; }); });
  }, { rootMargin: '80px' }) : null;
  function addLayer(l) { l.visible = true; layers.push(l); if (io) io.observe(l.el); }

  var orbs = null, heroH = 1;
  if (hero) {
    var host = hero.querySelector('.hero-blobs') || hero;
    var cOrbs = document.createElement('canvas'); cOrbs.className = 'fx-orbs'; cOrbs.setAttribute('aria-hidden', 'true');
    // La red de partículas ya no va por sección: fx-net.js la pone fija detrás de toda la página.
    host.appendChild(cOrbs);
    try { orbs = Orbs(cOrbs); } catch (e) { orbs = null; }
    if (orbs) hero.classList.add('fx-on'); else cOrbs.remove();
    heroH = hero.offsetHeight || 1;
    addLayer({
      el: hero,
      tick: function (t, moving) {
        var s = clamp(window.scrollY / Math.max(1, window.innerHeight), 0, 1.2);
        if (orbs) orbs.draw(moving ? t : 8.0, mouse.sx, mouse.sy, s);
      },
      resize: function () { if (orbs) orbs.resize(); heroH = hero.offsetHeight || 1; }
    });
  }

  /* ════════════════════ 4. SCROLL ════════════════════ */
  var bar = document.createElement('div'); bar.id = 'fx-progress'; bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);
  var pwrap = document.getElementById('previewWrap') || document.querySelector('.preview-wrap');
  if (pwrap && !RM) pwrap.classList.add('fx-3d');

  function onScroll() {
    var de = document.documentElement;
    var max = Math.max(1, de.scrollHeight - window.innerHeight);
    bar.style.transform = 'scaleX(' + clamp(window.scrollY / max, 0, 1) + ')';
    if (pwrap && !RM) {
      var r = pwrap.getBoundingClientRect(), vh = window.innerHeight;
      var p = clamp((vh - r.top) / (vh * .85), 0, 1);
      var e = 1 - Math.pow(1 - p, 2);
      pwrap.style.setProperty('--fx-rx', (22 * (1 - e)).toFixed(2) + 'deg');
      pwrap.style.setProperty('--fx-sc', (.9 + .1 * e).toFixed(3));
      pwrap.style.setProperty('--fx-ty', (40 * (1 - e)).toFixed(1) + 'px');
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Títulos palabra por palabra (respeta <b>, <span class="serif">, etc.) */
  if (!RM) {
    document.querySelectorAll('.sec-h h2, .cta-final h2').forEach(function (h) {
      var k = 0;
      var walk = function (node) {
        Array.prototype.slice.call(node.childNodes).forEach(function (ch) {
          if (ch.nodeType === 3) {
            var parts = ch.textContent.split(/(\s+)/);
            var frag = document.createDocumentFragment();
            parts.forEach(function (pt) {
              if (!pt) return;
              if (/^\s+$/.test(pt)) { frag.appendChild(document.createTextNode(pt)); return; }
              var s = document.createElement('span'); s.className = 'fx-w'; s.textContent = pt;
              s.style.transitionDelay = (k++ * 45) + 'ms';
              frag.appendChild(s);
            });
            ch.parentNode.replaceChild(frag, ch);
          } else if (ch.nodeType === 1) walk(ch);
        });
      };
      walk(h);
      h.classList.add('fx-words');
      var trg = h.closest('.reveal') || h;
      if (io) {
        var o = new IntersectionObserver(function (es) {
          es.forEach(function (e) { if (e.isIntersecting) { h.classList.add('fx-in'); o.disconnect(); } });
        }, { threshold: .2 });
        o.observe(trg);
      } else h.classList.add('fx-in');
    });
  }

  /* ════════════════════ 5. TARJETAS: brillo + inclinación ════════════════════ */
  if (FINE) {
    document.querySelectorAll('.bento .card, .rep-card, .step, .po-cat-card, .ct-tbl, .ai-vis').forEach(function (c) {
      if (getComputedStyle(c).position === 'static') c.style.position = 'relative';
      var sp = document.createElement('span'); sp.className = 'fx-spot'; sp.setAttribute('aria-hidden', 'true');
      c.appendChild(sp);
      var tilt = !RM && !c.classList.contains('tilt') && !c.matches('.ct-tbl, .ai-vis');
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect();
        var x = e.clientX - r.left, y = e.clientY - r.top;
        c.style.setProperty('--mx', x + 'px'); c.style.setProperty('--my', y + 'px');
        if (tilt) {
          var nx = x / r.width - .5, ny = y / r.height - .5;
          c.style.transform = 'perspective(900px) rotateY(' + (nx * 6).toFixed(2) + 'deg) rotateX(' + (-ny * 6).toFixed(2) + 'deg) translateY(-6px)';
        }
      });
      c.addEventListener('pointerleave', function () { if (tilt) c.style.transform = ''; });
    });
  }


  /* ════════════════════ 7. FIRMA: intro, cursor, botones magnéticos, marquesina ════════════════════ */

  /* 7a. Intro (solo la primera visita de la sesión, ~1.1 s). El contenido ya está
     pintado debajo: la cortina solo se levanta. */
  var heroIn = hero && hero.querySelector('.hero-in');
  function heroEntrance() { if (hero) hero.classList.add('fx-entered'); }
  var seen = false;
  try { seen = sessionStorage.getItem('fx_intro') === '1'; sessionStorage.setItem('fx_intro', '1'); } catch (e) { seen = true; }
  if (heroIn && !RM) hero.classList.add('fx-intro');
  if (!RM && !seen) {
    var pre = document.createElement('div');
    pre.id = 'fx-pre'; pre.setAttribute('aria-hidden', 'true');
    // Logo y wordmark tal cual los de la marca (no se estilizan).
    pre.innerHTML = '<div class="fx-pre-in"><div class="fx-pre-brand">' +
      '<div class="lg"><img src="/assets/logo-icon-hd.png" alt=""/></div>' +
      '<div class="nm">MANESTRO<small>P · R · O</small></div>' +
      '</div><div class="fx-pre-row"><span class="fx-pre-n">000</span><span class="fx-pre-bar"><i></i></span><span class="fx-pre-t">ERP · IA · OBRA</span></div></div>';
    document.body.appendChild(pre);
    var n = pre.querySelector('.fx-pre-n'), i0 = performance.now(), DUR = 1050;
    (function count(now) {
      var k = clamp((now - i0) / DUR, 0, 1), e = 1 - Math.pow(1 - k, 3);
      n.textContent = String(Math.round(e * 100)).padStart(3, '0');
      pre.style.setProperty('--k', e);
      if (k < 1) requestAnimationFrame(count);
      else { pre.classList.add('out'); setTimeout(heroEntrance, 180); setTimeout(function () { pre.remove(); }, 900); }
    })(i0);
  } else {
    requestAnimationFrame(function () { requestAnimationFrame(heroEntrance); });
  }

  /* 7b. Cursor propio (solo mouse): punto + anillo que crece sobre lo clicable. */
  if (FINE && !RM) {
    var cur = document.createElement('div'); cur.id = 'fx-cursor'; cur.setAttribute('aria-hidden', 'true');
    cur.innerHTML = '<i class="d"></i><i class="r"></i>';
    document.body.appendChild(cur);
    document.documentElement.classList.add('fx-cursor-on');
    var cd = cur.firstChild, cr = cur.lastChild, rx = -100, ry = -100;
    var INTER = 'a, button, [data-demo], input, select, textarea, label, .faq-item, [role=button]';
    document.addEventListener('pointerover', function (e) {
      cur.classList.toggle('big', !!(e.target.closest && e.target.closest(INTER)));
      cur.classList.toggle('txt', !!(e.target.closest && e.target.closest('input, textarea')));
    });
    document.addEventListener('pointerdown', function () { cur.classList.add('down'); });
    document.addEventListener('pointerup', function () { cur.classList.remove('down'); });
    document.addEventListener('pointerleave', function () { cur.style.opacity = 0; });
    document.addEventListener('pointerenter', function () { cur.style.opacity = 1; });
    (function follow() {
      if (mouse.px > -9000) {
        cd.style.transform = 'translate3d(' + mouse.px + 'px,' + mouse.py + 'px,0)';
        rx += (mouse.px - rx) * .2; ry += (mouse.py - ry) * .2;
        cr.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0)';
      }
      requestAnimationFrame(follow);
    })();
  }

  /* 7c. Botones magnéticos */
  if (FINE && !RM) {
    document.querySelectorAll('.btn').forEach(function (b) {
      b.classList.add('fx-mag');
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        var x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
        b.style.transform = 'translate(' + (x * .28).toFixed(1) + 'px,' + (y * .38).toFixed(1) + 'px)';
      });
      b.addEventListener('pointerleave', function () { b.style.transform = ''; });
    });
  }

  /* 7d. Marquesina cinética gigante: corre sola y acelera con la velocidad del scroll. */
  var metrics = document.querySelector('.metrics');
  if (metrics) {
    var words = (document.documentElement.lang || '').slice(0, 2) === 'en'
      ? ['Estimating', 'Cost control', 'Progress billing', 'Job site', 'Cash flow', 'Artificial intelligence']
      : ['Presupuesto', 'Control de costos', 'Cubicaciones', 'Obra', 'Flujo de caja', 'Inteligencia artificial'];
    var row = function (rev) {
      var inner = words.map(function (w, i) { return '<span class="' + (i % 2 ? 'o' : 'f') + '">' + w + '</span><em>✦</em>'; }).join('');
      return '<div class="fx-mq-row' + (rev ? ' rev' : '') + '"><div class="fx-mq-track">' + inner + inner + '</div></div>';
    };
    var mq = document.createElement('section');
    mq.className = 'fx-mq'; mq.setAttribute('aria-hidden', 'true');
    mq.innerHTML = row(false) + row(true);
    metrics.parentNode.insertBefore(mq, metrics.nextSibling);
    var tracks = mq.querySelectorAll('.fx-mq-track'), off = 0, vel = 0, lastY = window.scrollY, mqVis = true;
    if (io) new IntersectionObserver(function (es) { mqVis = es[0].isIntersecting; }).observe(mq);
    (function spin() {
      var y = window.scrollY, dy = y - lastY; lastY = y;
      vel += (dy - vel) * .1;
      if (mqVis) {
        off += RM ? 0 : (0.6 + Math.min(Math.abs(vel), 60) * .35);
        tracks.forEach(function (t, i) {
          var w = t.scrollWidth / 2 || 1, x = off % w;
          t.style.transform = 'translate3d(' + (i ? x - w : -x) + 'px,0,0) skewX(' + clamp(-vel * .15, -12, 12).toFixed(2) + 'deg)';
        });
      }
      requestAnimationFrame(spin);
    })();
  }

  /* ════════════════════ 6. BUCLE ════════════════════ */
  var t0 = performance.now(), last = t0, frames = 0, slowAcc = 0, degraded = 0, running = true;
  var pageVisible = !document.hidden;
  document.addEventListener('visibilitychange', function () { pageVisible = !document.hidden; if (pageVisible && !RM) loop(performance.now()); });

  function frame(now, moving) {
    mouse.sx += (mouse.x - mouse.sx) * .05;
    mouse.sy += (mouse.y - mouse.sy) * .05;
    var t = (now - t0) / 1000;
    layers.forEach(function (l) { if (l.visible) l.tick(t, moving); });
  }

  var skip = false;
  function loop(now) {
    if (!pageVisible || !running) return;
    // En móvil a ~30 fps: la mitad de trabajo y la diferencia casi no se nota.
    skip = MOBILE ? !skip : false;
    if (!skip) frame(now, true);
    // Autoajuste: si los cuadros vienen lentos, bajar resolución; si siguen lentos, quieto.
    var dt = now - last; last = now;
    if (frames < 240 && layers[0] && layers[0].visible) {
      frames++;
      if (frames > 20) slowAcc += dt > (MOBILE ? 40 : 30) ? 1 : 0;
      if (frames === 120 && slowAcc > 60 && orbs) {
        degraded++;
        if (degraded === 1) { orbs.setScale(MOBILE ? .5 : .6); frames = 0; slowAcc = 0; }
        else { running = false; frame(now, false); return; }
      }
    }
    requestAnimationFrame(loop);
  }

  var rz;
  window.addEventListener('resize', function () {
    clearTimeout(rz);
    rz = setTimeout(function () {
      layers.forEach(function (l) { l.resize && l.resize(); });
      onScroll();
      if (RM || !running) frame(performance.now(), false);
    }, 150);
  });

  if (RM) {
    // Un cuadro quieto: se ve igual de bonito, sin movimiento.
    frame(performance.now(), false);
    // Las esferas reaccionan al scroll solo redibujando en el scroll (sin animación continua).
    window.addEventListener('scroll', function () { if (layers[0]) layers[0].tick(8.0, false); }, { passive: true });
  } else {
    requestAnimationFrame(loop);
  }
})();
