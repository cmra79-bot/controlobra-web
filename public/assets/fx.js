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

  /* ════════════════════ 1. ESFERAS 3D (WebGL) ════════════════════ */
  var FRAG = [
    'precision highp float;',
    'uniform vec2 R; uniform float T; uniform vec2 M; uniform float S;',
    'const vec3 OR = vec3(0.949, 0.420, 0.122);', // #F26B1F
    'const vec3 OR2 = vec3(1.0, 0.635, 0.396);', // #FFA265
    'const vec3 BLU = vec3(0.165, 0.310, 0.627);', // #2A4FA0
    'vec3 c1, c2, c3, c4;',
    'float smin(float a, float b, float k){ float h = clamp(.5+.5*(b-a)/k, 0., 1.); return mix(b, a, h) - k*h*(1.-h); }',
    'float map(vec3 p, out float id){',
    '  float d1 = length(p-c1) - .66;',
    '  float d2 = length(p-c2) - .22;',
    '  float d3 = length(p-c3) - .44;',
    '  float d4 = length(p-c4) - .12;',
    '  float d = smin(d1, d2, .45); id = d1 < d2 ? 1. : 2.;',
    '  if (d3 < d){ d = d3; id = 3.; }',
    '  if (d4 < d){ d = d4; id = 4.; }',
    '  return d;',
    '}',
    'float mapd(vec3 p){ float i; return map(p, i); }',
    'vec3 nrm(vec3 p){ vec2 e = vec2(.0015, 0.);',
    '  return normalize(vec3(mapd(p+e.xyy)-mapd(p-e.xyy), mapd(p+e.yxy)-mapd(p-e.yxy), mapd(p+e.yyx)-mapd(p-e.yyx))); }',
    'void main(){',
    '  vec2 uv = (gl_FragCoord.xy - .5*R) / R.y;',
    '  float A = R.x / R.y;',
    '  float port = step(A, 1.);', // 1 en vertical (móvil)
    '  vec3 up = vec3(0., S*1.6, 0.);',
    '  c1 = vec3(mix(A*1.12, A*1.0, port) + .06*sin(T*.31), mix(.12, 1.3, port) + .09*sin(T*.43), 0.) + up;',
    '  c2 = c1 + vec3(cos(T*.47)*1.05, sin(T*.47)*.32, sin(T*.47)*.9 - .2);',
    '  c3 = vec3(mix(-A*1.05, -A*1.1, port) + .08*sin(T*.27), mix(-1.0, -1.6, port) + .12*sin(T*.36), -1.) + up*.6;',
    '  c4 = vec3(A*.5 + .25*sin(T*.21), 1.05 + .1*cos(T*.33), -.6) + up*1.3;',
    '  vec3 ro = vec3(M.x*.35, -M.y*.22, 4.2);',
    '  vec3 ta = vec3(0.);',
    '  vec3 ww = normalize(ta-ro), uu = normalize(cross(ww, vec3(0.,1.,0.))), vv = cross(uu, ww);',
    '  vec3 rd = normalize(uv.x*uu + uv.y*vv + 1.6*ww);',
    '  float t = 0., m = 1e3, id = 0., d;',
    '  bool hit = false;',
    '  for (int i = 0; i < STEPS; i++){',
    '    vec3 p = ro + rd*t;',
    '    d = map(p, id);',
    '    m = min(m, d);',
    '    if (d < .0015){ hit = true; break; }',
    '    t += d;',
    '    if (t > 12.) break;',
    '  }',
    '  float glow = exp(-m*5.5);',
    '  if (!hit){',
    '    float a = glow*.42;',
    '    gl_FragColor = vec4(mix(OR, OR2, .3)*a, a);',
    '    return;',
    '  }',
    '  vec3 p = ro + rd*t, n = nrm(p);',
    '  vec3 L = normalize(vec3(.8, .9, .6));',
    '  vec3 r = reflect(rd, n);',
    '  float dif = max(dot(n, L), 0.);',
    '  float fre = pow(1. - max(dot(n, -rd), 0.), 3.);',
    '  vec3 col = vec3(.035, .045, .06);',
    '  col += OR*dif*.3;',
    '  col += OR*smoothstep(.0, 1., r.y)*.28;',
    '  col += BLU*smoothstep(.1, 1., -r.x)*.22;',
    '  col += mix(OR, OR2, .45)*fre*1.15;',
    '  col += vec3(1., .93, .85)*pow(max(dot(r, L), 0.), 48.)*1.1;',
    // anillos de "escaneo" en la esfera grande: le dan el toque tech
    '  if (id < 1.5){',
    '    vec3 q = p - c1;',
    '    float ring = smoothstep(.93, 1., abs(sin(q.y*11. - T*.8)));',
    '    col += OR2*ring*.22*(1. - fre);',
    '  }',
    '  if (id > 3.5) col += OR*.35;', // la chiquita brilla más
    '  gl_FragColor = vec4(col, 1.);',
    '}'
  ].join('\n');

  function Orbs(canvas) {
    var gl = canvas.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: true, powerPreference: 'low-power' });
    if (!gl) return null;
    var steps = MOBILE ? 44 : 72;
    var hp = gl.getShaderPrecisionFormat && gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
    var src = '#define STEPS ' + steps + '\n' + FRAG;
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
    var scale = MOBILE ? 0.45 : (DPR > 1.5 ? 0.6 : 0.85);
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
    document.querySelectorAll('.btn, .wa-fab').forEach(function (b) {
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
    var words = ['Presupuesto', 'Control de costos', 'Cubicaciones', 'Obra', 'Flujo de caja', 'Inteligencia artificial'];
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
        if (degraded === 1) { orbs.setScale(MOBILE ? .3 : .4); frames = 0; slowAcc = 0; }
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
