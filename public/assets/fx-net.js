/* fx-net.js · red de partículas que se une al cursor, en TODA la página.
   Un solo canvas fijo detrás del contenido (no uno por sección): el costo es
   el mismo con una página corta o larga. Pensado para cualquier página del
   sitio: basta con <script src="/assets/fx-net.js" defer></script>.
   - Reducir movimiento: un cuadro quieto, sin animación.
   - Móvil: menos puntos y ~30 fps. Pestaña oculta: se detiene. */
(function () {
  'use strict';
  if (window.__fxNet) return; window.__fxNet = 1;
  var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var MOBILE = window.matchMedia && matchMedia('(max-width: 767px), (pointer: coarse)').matches;
  var DPR = Math.min(window.devicePixelRatio || 1, MOBILE ? 1.5 : 2);

  var c = document.createElement('canvas');
  c.id = 'fx-bgnet'; c.setAttribute('aria-hidden', 'true');
  c.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:-1;pointer-events:none;display:block';
  document.body.insertBefore(c, document.body.firstChild);
  var ctx = c.getContext('2d');
  if (!ctx) { c.remove(); return; }

  var mx = -9999, my = -9999;
  window.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') return;
    mx = e.clientX; my = e.clientY;
  }, { passive: true });
  document.addEventListener('pointerleave', function () { mx = my = -9999; });

  var pts = [], w = 0, h = 0, LINK = MOBILE ? 105 : 140, L2 = LINK * LINK;
  function resize() {
    w = window.innerWidth; h = window.innerHeight;
    c.width = Math.round(w * DPR); c.height = Math.round(h * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    var n = Math.round(Math.max(18, Math.min((w * h) / 15000, MOBILE ? 32 : 90)));
    while (pts.length < n) pts.push({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25,
      r: Math.random() * 1.4 + .5, o: Math.random() < .28
    });
    pts.length = n;
  }
  resize();

  // Al hacer scroll la red se desliza un poco (profundidad), sin romper la trama.
  var lastY = window.scrollY, scrollDy = 0;
  window.addEventListener('scroll', function () {
    scrollDy += window.scrollY - lastY; lastY = window.scrollY;
    if (RM) draw(false);
  }, { passive: true });

  // Envuelve con módulo: un salto grande de scroll (ancla, tecla Fin) no deja puntos fuera.
  function wrap(a) {
    var W = w + 20, H = h + 20;
    a.x = ((a.x + 10) % W + W) % W - 10;
    a.y = ((a.y + 10) % H + H) % H - 10;
  }

  function draw(moving) {
    ctx.clearRect(0, 0, w, h);
    var i, j, a, b, dx, dy, d2, f, sh = RM ? 0 : Math.max(-40, Math.min(40, scrollDy * -.25));
    scrollDy = 0;
    for (i = 0; i < pts.length; i++) {
      a = pts[i];
      if (moving) { a.x += a.vx; a.y += a.vy + sh; }
      // el cursor empuja suavemente
      dx = a.x - mx; dy = a.y - my; d2 = dx * dx + dy * dy;
      if (moving && d2 < 14400 && d2 > 1) { f = (1 - d2 / 14400) * .6; a.x += dx / Math.sqrt(d2) * f; a.y += dy / Math.sqrt(d2) * f; }
      wrap(a);
    }
    ctx.lineWidth = 1;
    for (i = 0; i < pts.length; i++) {
      a = pts[i];
      for (j = i + 1; j < pts.length; j++) {
        b = pts[j]; dx = a.x - b.x; dy = a.y - b.y; d2 = dx * dx + dy * dy;
        if (d2 < L2) {
          var al = (1 - d2 / L2) * .16;
          ctx.strokeStyle = (a.o || b.o) ? 'rgba(242,107,31,' + al * 1.4 + ')' : 'rgba(200,207,215,' + al + ')';
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      // líneas hacia el cursor: la red "te reconoce"
      dx = a.x - mx; dy = a.y - my; d2 = dx * dx + dy * dy;
      if (d2 < 32400) {
        ctx.strokeStyle = 'rgba(255,162,101,' + (1 - d2 / 32400) * .38 + ')';
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mx, my); ctx.stroke();
      }
    }
    for (i = 0; i < pts.length; i++) {
      a = pts[i];
      ctx.fillStyle = a.o ? 'rgba(242,107,31,.9)' : 'rgba(255,255,255,.55)';
      ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, 6.2832); ctx.fill();
    }
  }

  var rz;
  window.addEventListener('resize', function () {
    clearTimeout(rz); rz = setTimeout(function () { resize(); if (RM) draw(false); }, 150);
  });

  if (RM) { draw(false); return; }
  var visible = !document.hidden, skip = false, slow = 0, frames = 0, last = performance.now();
  function loop(now) {
    if (!visible) return;
    skip = MOBILE ? !skip : false;
    if (!skip) draw(true);
    // Si el equipo va muy lento, la red se queda quieta (sigue viéndose).
    var dt = now - last; last = now;
    if (frames < 200) { frames++; if (frames > 20 && dt > 45) slow++; if (frames === 200 && slow > 120) return; }
    requestAnimationFrame(loop);
  }
  document.addEventListener('visibilitychange', function () {
    visible = !document.hidden;
    if (visible) { last = performance.now(); requestAnimationFrame(loop); }
  });
  requestAnimationFrame(loop);
})();
