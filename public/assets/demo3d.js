/* ─────────────────────────────────────────────────────────────────────────────
   demo3d.js — demo 3D interactivo de la landing (sección #demo-3d)

   Una casa de ejemplo que el visitante gira con el dedo o el mouse. Pasa por
   cuatro pasos, igual que en Manestro:
     01 Plano       → la planta vista desde arriba, con sus cotas.
     02 Modelo 3D   → los muros suben y la casa se puede girar.
     03 Medición    → un escáner recorre la obra y cada elemento se convierte
                      en cantidad (m³, m², ud).
     04 Presupuesto → cada cantidad por su precio, con el total.

   Las cantidades NO son inventadas: salen de la geometría que se dibuja
   (cada muro descuenta sus huecos, cada columna su volumen, etc.). Si el
   visitante cambia el área o pasa a 2 niveles, todo se vuelve a medir.

   Sin dependencias: un motor 3D mínimo en canvas 2D (proyección en
   perspectiva + algoritmo del pintor). Pesa unos KB en vez de Three.js.

   Cuidados:
   - prefers-reduced-motion → sin pasos automáticos, sin giro solo, sin
     escáner: aparece directo el presupuesto. Girar a mano sí funciona.
   - Móvil → menos resolución y ~30 fps. El arrastre vertical sigue
     desplazando la página (touch-action: pan-y); el horizontal gira.
   - Se pausa fuera de pantalla y con la pestaña oculta, y se inicia solo
     cuando la sección se acerca a la pantalla.
   ───────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  var root = document.getElementById('demo-3d');
  if (!root) return;
  var canvas = root.querySelector('.d3-canvas');
  var ctx = canvas && canvas.getContext && canvas.getContext('2d');
  if (!ctx) return;

  var mm = function (q) { return window.matchMedia && window.matchMedia(q).matches; };
  var RM = mm('(prefers-reduced-motion: reduce)');
  var FINE = mm('(pointer: fine)');
  var MOBILE = !FINE || window.innerWidth < 768;
  var DPR = Math.min(window.devicePixelRatio || 1, MOBILE ? 1.5 : 2);

  var stage = root.querySelector('.d3-stage');
  var tip = root.querySelector('.d3-tip');
  var hint = root.querySelector('.d3-hint');
  var cap = root.querySelector('.d3-cap');
  var rowsEl = root.querySelector('.d3-rows');
  var totalEl = root.querySelector('.d3-total b');
  var dimsEl = root.querySelector('.d3-dims');
  var areaIn = root.querySelector('.d3-area input');
  var areaOut = root.querySelector('.d3-area b');
  var stepBtns = [].slice.call(root.querySelectorAll('[data-step]'));
  var lvBtns = [].slice.call(root.querySelectorAll('[data-lv]'));

  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var ease = function (t) { t = clamp(t, 0, 1); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  /* Idioma: la portada en inglés (/en/) usa el mismo demo con textos y números en inglés. */
  var EN = (document.documentElement.lang || '').slice(0, 2) === 'en';
  var tx = function (es, en) { return EN ? en : es; };
  var fmt = function (v, d) { return v.toLocaleString(EN ? 'en-US' : 'es-DO', { minimumFractionDigits: d, maximumFractionDigits: d }); };
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };

  /* ════════════════════ Partidas (precios de ejemplo, RD$) ════════════════════ */
  var CATS = {
    losa:    { n: tx('Losa de piso de 10 cm', 'Slab on grade, 10 cm'),       u: 'm³', p: 11900, d: 2, c: [143, 163, 191] },
    col:     { n: tx('Columnas 25 × 25 cm', 'Columns 25 × 25 cm'),         u: 'm³', p: 28500, d: 2, c: [242, 107, 31] },
    muro:    { n: tx('Muros de bloque de 6"', '6" block walls'),       u: 'm²', p: 1580,  d: 2, c: [222, 200, 166] },
    techo:   { n: tx('Losas de techo de 12 cm', 'Roof slabs, 12 cm'),     u: 'm³', p: 24800, d: 2, c: [125, 160, 216] },
    panete:  { n: tx('Pañete (2 caras)', 'Plaster (both faces)'),            u: 'm²', p: 390,   d: 2, c: [183, 148, 244] },
    piso:    { n: tx('Piso de cerámica', 'Ceramic tile floor'),            u: 'm²', p: 1450,  d: 2, c: [46, 196, 182] },
    puerta:  { n: tx('Puertas de madera', 'Wood doors'),           u: tx('ud', 'ea'), p: 13500, d: 0, c: [255, 200, 87] },
    ventana: { n: tx('Ventanas de aluminio', 'Aluminum windows'), u: tx('ud', 'ea'), p: 8900, d: 0, c: [91, 192, 235] }
  };
  var ORDER = ['losa', 'col', 'muro', 'techo', 'panete', 'piso', 'puerta', 'ventana'];

  /* ════════════════════ Modelo: la casa ════════════════════ */
  var T = .15, C = .25, H = 2.6, TS = .10, TR = .12, OV = .3;
  var DOOR = [0, 2.1], WIN = [.9, 2.1];

  // Cara de una caja. sup = planos que no se dibujan (cortes internos de un muro).
  function boxFaces(out, b, el, layer, sup) {
    var x0 = b[0], x1 = b[1], y0 = b[2], y1 = b[3], z0 = b[4], z1 = b[5];
    if (y1 - y0 < 1e-4) return;
    var P = function (x, y, z) { return [x, y, z]; };
    var quads = [
      [[0, 1, 0], [P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)]],
      [[1, 0, 0], [P(x1, y0, z0), P(x1, y1, z0), P(x1, y1, z1), P(x1, y0, z1)], 'x1'],
      [[-1, 0, 0], [P(x0, y0, z1), P(x0, y1, z1), P(x0, y1, z0), P(x0, y0, z0)], 'x0'],
      [[0, 0, 1], [P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1), P(x0, y0, z1)], 'z1'],
      [[0, 0, -1], [P(x0, y0, z0), P(x0, y1, z0), P(x1, y1, z0), P(x1, y0, z0)], 'z0']
    ];
    for (var i = 0; i < quads.length; i++) {
      var q = quads[i];
      if (q[2] && sup && sup[q[2]]) continue;
      var pts = q[1], ed = [];
      for (var k = 0; k < 4; k++) {
        var a = pts[k], c = pts[(k + 1) % 4], hide = false;
        if (sup) {
          if (sup.x0 && a[0] === x0 && c[0] === x0) hide = true;
          if (sup.x1 && a[0] === x1 && c[0] === x1) hide = true;
          if (sup.z0 && a[2] === z0 && c[2] === z0) hide = true;
          if (sup.z1 && a[2] === z1 && c[2] === z1) hide = true;
        }
        ed.push(!hide);
      }
      out.push({ n: q[0], p: pts, el: el, layer: layer, ed: ed });
    }
  }

  // Muro sobre un eje, cortado en tramos de ≤1 m para que el orden de pintado no falle.
  function wallBox(out, axis, fixed, s0, s1, y0, y1, el, layer) {
    var len = s1 - s0, n = Math.max(1, Math.ceil(len / 1.0)), step = len / n;
    for (var i = 0; i < n; i++) {
      var a = s0 + i * step, b = (i === n - 1) ? s1 : a + step;
      var sup = axis === 'x'
        ? { x0: i > 0, x1: i < n - 1 }
        : { z0: i > 0, z1: i < n - 1 };
      var bx = axis === 'x'
        ? [a, b, y0, y1, fixed - T / 2, fixed + T / 2]
        : [fixed - T / 2, fixed + T / 2, y0, y1, a, b];
      boxFaces(out, bx, el, layer, sup);
    }
  }

  /* Construye la casa. grow[i] = cuánto subió el nivel i (0 = solo planta).
     Devuelve { faces, els, rooms }. Las cantidades (el.q) son siempre las de
     la casa terminada, aunque la geometría esté a medio subir. */
  function build(W, L, levels, grow) {
    var faces = [], els = [], rooms = [];
    var X0 = -W / 2 + T / 2, X1 = W / 2 - T / 2, Z0 = -L / 2 + T / 2, Z1 = L / 2 - T / 2;
    var XA = X0 + .58 * (X1 - X0), ZB = (Z0 + Z1) / 2;
    var nM = 0, nC = 0, nV = 0, nP = 0;

    var slab = { cat: 'losa', name: tx('Losa de piso', 'Slab on grade'), q: W * L * TS, lvl: 0,
      tip: tx('Losa de piso', 'Slab on grade') + ' · ' + fmt(W, 2) + ' × ' + fmt(L, 2) + ' × ' + fmt(.1, 2) + ' m = ' + fmt(W * L * TS, 2) + ' m³' };
    els.push(slab);
    boxFaces(faces, [-W / 2, W / 2, -TS, 0, -L / 2, L / 2], slab, 'base0');

    var cols = [[X0, Z0], [X1, Z0], [X0, Z1], [X1, Z1], [XA, Z0], [XA, Z1], [X0, ZB], [XA, ZB]];

    for (var lv = 0; lv < levels; lv++) {
      var g = grow[lv]; if (g == null) g = 1;
      if (lv > 0 && g <= 0) continue;
      var base = lv * (H + TR);
      var h = Math.max(.025, H * ease(g)); // altura visible de muros y columnas
      var solid = 'solid' + lv;
      var clipY = function (ya, yb) { return [base + Math.min(ya, h), base + Math.min(yb, h)]; };

      // Columnas
      cols.forEach(function (p) {
        var el = { cat: 'col', name: tx('Columna C-', 'Column C-') + pad(++nC), q: C * C * H, lvl: lv };
        el.tip = el.name + ' · 0,25 × 0,25 × ' + fmt(H, 2) + ' m = ' + fmt(el.q, 3) + ' m³';
        els.push(el);
        boxFaces(faces, [p[0] - C / 2, p[0] + C / 2, base, base + h, p[1] - C / 2, p[1] + C / 2], el, solid);
      });

      // Muros: eje, coordenada fija, tramo entre columnas y huecos (f = posición 0..1 en el tramo libre)
      var front2 = lv > 0 ? { f: .3, w: 1.0, k: 'v' } : { f: .3, w: .9, k: 'p' };
      var defs = [
        ['x', Z0, X0, XA, [{ f: .5, w: 1.2, k: 'v' }]],
        ['x', Z0, XA, X1, [{ f: .5, w: 1.5, k: 'v' }]],
        ['x', Z1, X0, XA, [{ f: .5, w: 1.2, k: 'v' }]],
        ['x', Z1, XA, X1, [front2, { f: .74, w: 1.0, k: 'v' }]],
        ['z', X0, Z0, ZB, [{ f: .5, w: 1.0, k: 'v' }]],
        ['z', X0, ZB, Z1, []],
        ['z', X1, Z0, Z1, [{ f: .5, w: 1.5, k: 'v' }]],
        ['z', XA, Z0, ZB, [{ f: .72, w: .8, k: 'p' }]],
        ['z', XA, ZB, Z1, [{ f: .28, w: .8, k: 'p' }]],
        ['x', ZB, X0, XA, []]
      ];
      defs.forEach(function (d) {
        var axis = d[0], fx = d[1], s0 = d[2] + C / 2, s1 = d[3] - C / 2, len = s1 - s0;
        var el = { cat: 'muro', cats: ['muro', 'panete'], name: tx('Muro M-', 'Wall W-') + pad(++nM), lvl: lv };
        var gross = len * H, holes = 0, cur = s0;
        els.push(el);
        var piece = function (a, b, ya, yb) {
          if (b - a < .01) return;
          var y = clipY(ya, yb);
          wallBox(faces, axis, fx, a, b, y[0], y[1], el, solid);
        };
        d[4].forEach(function (o) {
          var ctr = s0 + o.f * len, a = ctr - o.w / 2, b = ctr + o.w / 2;
          var yy = o.k === 'p' ? DOOR : WIN;
          holes += o.w * (yy[1] - yy[0]);
          piece(cur, a, 0, H);
          if (yy[0] > 0) piece(a, b, 0, yy[0]);
          piece(a, b, yy[1], H);
          cur = b;
          // Hueco: ventana (vidrio) o puerta (hoja)
          var isP = o.k === 'p';
          var oel = { cat: isP ? 'puerta' : 'ventana', q: 1, lvl: lv,
            name: isP ? tx('Puerta P-', 'Door D-') + pad(++nP) : tx('Ventana V-', 'Window W-') + pad(++nV) };
          oel.tip = oel.name + ' · ' + fmt(o.w, 2) + ' × ' + fmt(yy[1] - yy[0], 2) + ' m';
          els.push(oel);
          if (h > yy[0] + .02) {
            var y2 = clipY(yy[0], yy[1]), th = isP ? .04 : .02;
            var bx = axis === 'x'
              ? [a, b, y2[0], y2[1], fx - th, fx + th]
              : [fx - th, fx + th, y2[0], y2[1], a, b];
            boxFaces(faces, bx, oel, solid);
          }
        });
        piece(cur, s1, 0, H);
        el.q = gross - holes;
        el.tip = el.name + ' · ' + fmt(len, 2) + ' × ' + fmt(H, 2) + ' m' +
          (holes > 0 ? tx(' − huecos', ' − openings') : '') + ' = ' + fmt(el.q, 2) + ' m²';
      });

      // Pisos de cerámica por ambiente (caras interiores de los muros)
      var R = [
        [tx('Habitación 1', 'Bedroom 1'), X0 + T / 2, XA - T / 2, Z0 + T / 2, ZB - T / 2],
        [tx('Habitación 2', 'Bedroom 2'), X0 + T / 2, XA - T / 2, ZB + T / 2, Z1 - T / 2],
        [lv > 0 ? tx('Estar', 'Family room') : tx('Sala-comedor', 'Living-dining'), XA + T / 2, X1 - T / 2, Z0 + T / 2, Z1 - T / 2]
      ];
      R.forEach(function (r) {
        var a = (r[2] - r[1]) * (r[4] - r[3]);
        var el = { cat: 'piso', name: r[0], q: a, lvl: lv,
          tip: tx('Piso ' + r[0].toLowerCase(), r[0] + ' floor') + ' · ' + fmt(r[2] - r[1], 2) + ' × ' + fmt(r[4] - r[3], 2) + ' m = ' + fmt(a, 2) + ' m²' };
        els.push(el);
        rooms.push({ el: el, x: (r[1] + r[2]) / 2, y: base + .01, z: (r[3] + r[4]) / 2, lvl: lv });
        faces.push({ n: [0, 1, 0], el: el, layer: 'base' + lv, ed: [true, true, true, true],
          p: [[r[1], base + .006, r[3]], [r[2], base + .006, r[3]], [r[2], base + .006, r[4]], [r[1], base + .006, r[4]]] });
      });

      // Losa de techo (o entrepiso): fantasma para ver adentro
      var top = lv === levels - 1;
      var tq = (W + 2 * OV) * (L + 2 * OV) * TR;
      var tel = { cat: 'techo', name: top ? tx('Losa de techo', 'Roof slab') : tx('Losa de entrepiso', 'Floor slab'), q: tq, lvl: lv, ghost: true };
      tel.tip = tel.name + ' · ' + fmt(W + 2 * OV, 2) + ' × ' + fmt(L + 2 * OV, 2) + ' × ' + fmt(.12, 2) + ' m = ' + fmt(tq, 2) + ' m³';
      els.push(tel);
      if (g >= .999) boxFaces(faces, [-W / 2 - OV, W / 2 + OV, base + H, base + H + TR, -L / 2 - OV, L / 2 + OV], tel, 'roof' + lv);
    }
    return { faces: faces, els: els, rooms: rooms };
  }

  function quantities(els) {
    var Q = {};
    ORDER.forEach(function (k) { Q[k] = 0; });
    els.forEach(function (e) {
      Q[e.cat] += e.q;
      if (e.cat === 'muro') Q.panete += 2 * e.q;
    });
    return Q;
  }

  /* ════════════════════ Estado ════════════════════ */
  var S = {
    area: 80, levels: 1, W: 10, L: 8,
    step: -1, grow: 0, growT: 0, mix: 0, mixT: 0, money: 0, moneyT: 0,
    scan: -1, // 0..1 mientras pasa el escáner
    yaw: 0, pitch: 1.53, dist: 30, yawT: 0, pitchT: 1.53, distT: 30,
    auto: !RM, hoverEl: null, hoverCat: null, dragging: false
  };
  var model = null, full = null, Qfull = null, shown = {};

  function dims() {
    S.W = Math.round(Math.sqrt(S.area * 1.25) * 20) / 20;
    S.L = Math.round(S.area / S.W * 20) / 20;
  }
  function rebuildFull() {
    dims();
    full = build(S.W, S.L, S.levels, [1, 1]);
    Qfull = quantities(full.els);
    if (dimsEl) dimsEl.innerHTML = tx('Casa de', 'House') + ' <b>' + fmt(S.W, 2) + ' × ' + fmt(S.L, 2) + ' m</b> · ' +
      S.levels + (S.levels > 1 ? tx(' niveles', ' stories') : tx(' nivel', ' story'));
    if (areaOut) areaOut.textContent = S.area + ' m²';
    fitCamera();
  }
  function rebuildModel() {
    var g = [];
    for (var i = 0; i < S.levels; i++) g.push(clamp(S.grow * S.levels - i, 0, 1));
    model = build(S.W, S.L, S.levels, g);
  }

  /* ════════════════════ Panel de presupuesto ════════════════════ */
  var rowEls = {};
  ORDER.forEach(function (k) {
    var c = CATS[k], b = document.createElement('button');
    b.type = 'button'; b.className = 'd3-row'; b.setAttribute('data-cat', k);
    b.style.setProperty('--c', 'rgb(' + c.c.join(',') + ')');
    b.innerHTML = '<i></i><span class="nm">' + c.n + '</span><span class="q">—</span><span class="m">—</span>';
    rowsEl.appendChild(b);
    rowEls[k] = { row: b, q: b.querySelector('.q'), m: b.querySelector('.m') };
    shown[k] = 0;
    b.addEventListener('mouseenter', function () { S.hoverCat = k; kick(); });
    b.addEventListener('mouseleave', function () { S.hoverCat = null; kick(); });
    b.addEventListener('focus', function () { S.hoverCat = k; kick(); });
    b.addEventListener('blur', function () { S.hoverCat = null; kick(); });
    b.addEventListener('click', function () {
      S.hoverCat = S.hoverCat === k && !FINE ? null : k; stopAuto(); kick();
    });
  });

  function paintPanel() {
    var qk = clamp(S.scan >= 0 ? S.scan : (S.mix > .5 ? 1 : 0), 0, 1);
    var mk = ease(S.money), total = 0;
    ORDER.forEach(function (k) {
      var c = CATS[k], q = Qfull[k] * qk, r = rowEls[k];
      var on = S.step >= 2;
      r.q.textContent = on ? fmt(c.d ? q : Math.round(q), c.d) + ' ' + c.u : '—';
      var amt = Qfull[k] * c.p;
      total += amt;
      r.m.textContent = S.step >= 3 ? 'RD$ ' + fmt(Math.round(amt * mk), 0) : '—';
      r.row.classList.toggle('on', !!(S.hoverCat === k || (S.hoverEl && (S.hoverEl.cat === k || (k === 'panete' && S.hoverEl.cat === 'muro')))));
    });
    totalEl.textContent = S.step >= 3 ? 'RD$ ' + fmt(Math.round(total * mk), 0) : 'RD$ —';
    root.classList.toggle('d3-priced', S.step >= 3);
  }

  /* ════════════════════ Pasos ════════════════════ */
  var CAPS = [
    tx('Kubicar lee la planta y sus cotas.', 'Kubicar reads the floor plan and its dimensions.'),
    tx('La planta se convierte en un modelo 3D.', 'The floor plan becomes a 3D model.'),
    tx('Cada elemento se mide solo: m³, m² y unidades.', 'Every element measures itself: m³, m² and units.'),
    tx('Cada cantidad por su precio. Presupuesto listo.', 'Every quantity times its price. Estimate ready.')
  ];
  var timer = null;
  function setStep(n, user) {
    if (user) stopAuto();
    var prev = S.step;
    S.step = n;
    S.growT = n >= 1 ? 1 : 0;
    S.mixT = n >= 2 ? 1 : 0;
    S.moneyT = n >= 3 ? 1 : 0;
    if (n < 3) S.money = 0;
    if (n >= 2 && prev < 2) S.scan = RM ? -1 : 0;
    if (n < 2) S.scan = -1;
    if (n === 0) { S.pitchT = 1.53; S.yawT = nearestYaw(0); }
    else if (prev <= 0) { S.pitchT = .62; S.yawT = S.yaw + .65; }
    if (RM) { S.grow = S.growT; S.mix = S.mixT; S.money = S.moneyT; S.pitch = S.pitchT; S.yaw = S.yawT; rebuildModel(); }
    stepBtns.forEach(function (b, i) {
      b.setAttribute('aria-selected', i === n ? 'true' : 'false');
      b.classList.toggle('done', i < n);
    });
    if (cap) cap.textContent = CAPS[n];
    kick();
  }
  function nearestYaw(a) { var k = Math.round((S.yaw - a) / (Math.PI * 2)); return a + k * Math.PI * 2; }
  function stopAuto() { if (timer) { clearTimeout(timer); timer = null; } }
  function autoplay() {
    if (RM) { setStep(3); return; }
    setStep(0);
    var seq = [[1, 1300], [2, 2300], [3, 2600]], i = 0;
    var next = function () {
      if (i >= seq.length) { timer = null; return; }
      var s = seq[i++];
      timer = setTimeout(function () { setStep(s[0]); next(); }, s[1]);
    };
    next();
  }
  stepBtns.forEach(function (b) {
    b.addEventListener('click', function () { setStep(+b.getAttribute('data-step'), true); });
  });

  /* Controles: área y niveles */
  if (areaIn) areaIn.addEventListener('input', function () {
    S.area = +areaIn.value;
    areaIn.style.setProperty('--p', ((S.area - 60) / 140 * 100) + '%');
    stopAuto(); rebuildFull(); rebuildModel(); if (S.step < 2) setStep(3); kick();
  });
  lvBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      var n = +b.getAttribute('data-lv');
      lvBtns.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      if (n === S.levels) return;
      S.levels = n; stopAuto();
      rebuildFull();
      if (S.step < 1) setStep(3);
      if (!RM) { S.grow = n > 1 ? .5 : S.grow; S.growT = 1; S.scan = S.step >= 2 ? 0 : -1; }
      rebuildModel(); kick();
    });
  });

  /* ════════════════════ Cámara y proyección ════════════════════ */
  var cw = 0, ch = 0, fpx = 1, cam = null;
  function fitCamera() {
    var r = Math.hypot(S.W + 2, S.L + 2) / 2, hh = S.levels * (H + TR);
    var asp = cw && ch ? cw / ch : 1.4;
    S.distT = (Math.max(r, hh * .9) * 2.55 + 4) * (asp < 1 && cw >= 600 ? 1.25 : 1);
    if (!S.dist) S.dist = S.distT;
  }
  function setupCam() {
    var ty = S.levels * (H + TR) * .38 * (1 - (S.pitch - .5) / 1.1);
    var cp = Math.cos(S.pitch), sp = Math.sin(S.pitch);
    var eye = [S.dist * cp * Math.sin(S.yaw), ty + S.dist * sp, S.dist * cp * Math.cos(S.yaw)];
    var f = [-eye[0], ty - eye[1], -eye[2]], fl = Math.hypot(f[0], f[1], f[2]);
    f = [f[0] / fl, f[1] / fl, f[2] / fl];
    var r = [f[2], 0, -f[0]], rl = Math.hypot(r[0], r[2]) || 1; // cross(f, up) con up = y
    r = [-r[0] / rl, 0, -r[2] / rl];
    var u = [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0]];
    cam = { e: eye, f: f, r: r, u: u };
    fpx = cw < 600 ? Math.min(cw * 1.75, ch * 1.6) : Math.min(cw, ch * 1.3) * 1.3;
  }
  function proj(p) {
    var dx = p[0] - cam.e[0], dy = p[1] - cam.e[1], dz = p[2] - cam.e[2];
    var z = dx * cam.f[0] + dy * cam.f[1] + dz * cam.f[2];
    var x = dx * cam.r[0] + dy * cam.r[1] + dz * cam.r[2];
    var y = dx * cam.u[0] + dy * cam.u[1] + dz * cam.u[2];
    if (z < .1) z = .1;
    return [cw / 2 + x * fpx / z, ch * (MOBILE && cw < 600 ? .5 : .47) - y * fpx / z, z];
  }

  /* ════════════════════ Dibujo ════════════════════ */
  var LIGHT = (function () { var l = [-.45, .85, .55], n = Math.hypot(l[0], l[1], l[2]); return [l[0] / n, l[1] / n, l[2] / n]; })();
  var NEUTRAL = [40, 47, 60], BG = [10, 13, 19];
  var drawn = [];

  function catOf(el) {
    if (el.cat === 'muro' && S.hoverCat === 'panete') return 'panete';
    return el.cat;
  }
  function isHot(el) {
    if (S.hoverEl) return S.hoverEl === el;
    if (S.hoverCat) return el.cat === S.hoverCat || (S.hoverCat === 'panete' && el.cat === 'muro');
    return false;
  }

  function grid() {
    var R = Math.ceil(Math.max(S.W, S.L) / 2) + 7, y = -TS - .01;
    ctx.lineWidth = 1;
    for (var i = -R; i <= R; i++) {
      for (var axis = 0; axis < 2; axis++) {
        var a = axis ? [i, y, -R] : [-R, y, i], b = axis ? [i, y, R] : [R, y, i];
        var A = proj(a), B = proj(b);
        var al = .07 * (1 - Math.abs(i) / (R + 1));
        ctx.strokeStyle = i === 0 ? 'rgba(242,107,31,' + (al * 2.2) + ')' : 'rgba(255,255,255,' + al + ')';
        ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();
      }
    }
  }

  function cotas(alpha) {
    if (alpha <= .01) return;
    var W = S.W, L = S.L, o = 1.0, y = 0;
    var lines = [
      [[-W / 2, y, L / 2 + o], [W / 2, y, L / 2 + o], fmt(W, 2) + ' m'],
      [[W / 2 + o, y, -L / 2], [W / 2 + o, y, L / 2], fmt(L, 2) + ' m']
    ];
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = 'rgba(255,162,101,.85)'; ctx.fillStyle = '#FFA265'; ctx.lineWidth = 1;
    ctx.font = '600 ' + Math.round(clamp(cw / 62, 10, 13)) + 'px "JetBrains Mono", ui-monospace, monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    lines.forEach(function (ln) {
      var A = proj(ln[0]), B = proj(ln[1]);
      ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();
      // marcas en los extremos (hacia la casa)
      [ln[0], ln[1]].forEach(function (p) {
        var q = ln === lines[0] ? [p[0], y, L / 2] : [W / 2, y, p[2]];
        var P = proj(p), Q = proj(q);
        ctx.beginPath(); ctx.moveTo(P[0], P[1]); ctx.lineTo(Q[0], Q[1]); ctx.setLineDash([2, 3]); ctx.stroke(); ctx.setLineDash([]);
        ctx.beginPath(); ctx.arc(P[0], P[1], 2.2, 0, 6.3); ctx.fill();
      });
      var mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2, tw = ctx.measureText(ln[2]).width + 12;
      ctx.fillStyle = 'rgba(10,13,19,.88)'; ctx.fillRect(mx - tw / 2, my - 9, tw, 18);
      ctx.strokeRect(mx - tw / 2 + .5, my - 8.5, tw - 1, 17);
      ctx.fillStyle = '#FFA265'; ctx.fillText(ln[2], mx, my + .5);
    });
    ctx.restore();
  }

  function face(f) {
    var el = f.el, pts = [], c = 0;
    for (var i = 0; i < 4; i++) pts.push(proj(f.p[i]));
    var hot = isHot(el), any = S.hoverEl || S.hoverCat;
    var shade = .38 + .62 * Math.max(0, f.n[0] * LIGHT[0] + f.n[1] * LIGHT[1] + f.n[2] * LIGHT[2]);
    var cc = CATS[catOf(el)].c, m = S.mix;
    var base = [NEUTRAL[0] + (cc[0] * .62 - NEUTRAL[0]) * m, NEUTRAL[1] + (cc[1] * .62 - NEUTRAL[1]) * m, NEUTRAL[2] + (cc[2] * .62 - NEUTRAL[2]) * m];
    if (hot) base = [cc[0] * .9, cc[1] * .9, cc[2] * .9];
    var col = [base[0] * shade, base[1] * shade, base[2] * shade];
    var a = 1, ea = .34 + .25 * m;
    if (el.cat === 'ventana') { a = hot ? .75 : .32 + .18 * m; col = [cc[0] * shade, cc[1] * shade, cc[2] * shade]; }
    if (el.ghost) { a = hot ? .55 : .1; ea = hot ? .9 : .22; }
    if (any && !hot) { a *= el.ghost ? .6 : .55; ea *= .5; }
    if (S.grow < .02 && !el.ghost && el.cat !== 'losa' && el.cat !== 'piso') { col = [242 * .35, 107 * .35, 31 * .35]; ea = .9; }

    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (c = 1; c < 4; c++) ctx.lineTo(pts[c][0], pts[c][1]);
    ctx.closePath();
    ctx.fillStyle = 'rgba(' + (col[0] | 0) + ',' + (col[1] | 0) + ',' + (col[2] | 0) + ',' + a + ')';
    ctx.fill();

    var ec = hot ? '255,255,255' : (S.grow < .02 && el.cat !== 'losa' && el.cat !== 'piso') ? '255,162,101'
      : m > .5 ? Math.min(255, cc[0] + 50) + ',' + Math.min(255, cc[1] + 50) + ',' + Math.min(255, cc[2] + 50) : '220,226,236';
    ctx.strokeStyle = 'rgba(' + ec + ',' + (hot ? .95 : ea) + ')';
    ctx.lineWidth = hot ? 1.4 : 1;
    ctx.beginPath();
    for (c = 0; c < 4; c++) {
      if (!f.ed[c]) continue;
      var A = pts[c], B = pts[(c + 1) % 4];
      ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]);
    }
    ctx.stroke();
    drawn.push({ el: el, pts: pts, ghost: !!el.ghost });
  }

  function layer(list) {
    var e = cam.e;
    var vis = [];
    for (var i = 0; i < list.length; i++) {
      var f = list[i], p = f.p;
      var cx = (p[0][0] + p[1][0] + p[2][0] + p[3][0]) / 4,
          cy = (p[0][1] + p[1][1] + p[2][1] + p[3][1]) / 4,
          cz = (p[0][2] + p[1][2] + p[2][2] + p[3][2]) / 4;
      var vx = e[0] - cx, vy = e[1] - cy, vz = e[2] - cz;
      if (f.n[0] * vx + f.n[1] * vy + f.n[2] * vz <= 0) continue;
      f.d = vx * vx + vy * vy + vz * vz;
      vis.push(f);
    }
    vis.sort(function (a, b) { return b.d - a.d; });
    for (var j = 0; j < vis.length; j++) face(vis[j]);
  }

  function scanPlane() {
    if (S.scan < 0 || S.scan >= 1) return;
    var top = S.levels * (H + TR) + .3, y = -TS + (top + TS) * S.scan;
    var W = S.W / 2 + .5, L = S.L / 2 + .5;
    var P = [[-W, y, -L], [W, y, -L], [W, y, L], [-W, y, L]].map(proj);
    ctx.save();
    ctx.beginPath(); ctx.moveTo(P[0][0], P[0][1]);
    for (var i = 1; i < 4; i++) ctx.lineTo(P[i][0], P[i][1]);
    ctx.closePath();
    ctx.fillStyle = 'rgba(242,107,31,.10)'; ctx.fill();
    if (!MOBILE) { ctx.shadowColor = 'rgba(242,107,31,.9)'; ctx.shadowBlur = 14; }
    ctx.strokeStyle = 'rgba(255,162,101,.95)'; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.restore();
  }

  function roomLabels() {
    if (S.mix < .5 || S.grow < .99) return;
    var lv = S.levels - 1, a = clamp((S.mix - .5) * 2, 0, 1) * (S.hoverCat || S.hoverEl ? .5 : 1);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    var fs = Math.round(clamp(cw / 70, 9.5, 12));
    model.rooms.forEach(function (r) {
      if (r.lvl !== lv) return;
      var P = proj([r.x, r.y, r.z]);
      ctx.font = '700 ' + fs + 'px Manrope, Inter, system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,.92)';
      ctx.fillText(r.el.name, P[0], P[1] - fs * .65);
      ctx.font = '600 ' + fs + 'px "JetBrains Mono", ui-monospace, monospace';
      ctx.fillStyle = '#7FE3D7';
      ctx.fillText(fmt(r.el.q, 2) + ' m²', P[0], P[1] + fs * .7);
    });
    ctx.restore();
  }

  function draw() {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, cw, ch);
    setupCam();
    drawn = [];
    grid();
    var by = {};
    model.faces.forEach(function (f) { (by[f.layer] = by[f.layer] || []).push(f); });
    for (var lv = 0; lv < S.levels; lv++) {
      if (by['base' + lv]) layer(by['base' + lv]);
      if (lv === 0) cotas(1 - S.money * .55);
      if (by['solid' + lv]) layer(by['solid' + lv]);
      if (by['roof' + lv]) layer(by['roof' + lv]);
    }
    roomLabels();
    scanPlane();
  }

  /* ════════════════════ Animación ════════════════════ */
  var running = false, visible = false, last = 0, started = false;
  function approach(cur, tgt, k) { return Math.abs(tgt - cur) < 1e-3 ? tgt : cur + (tgt - cur) * k; }
  function update(dt) {
    var moving = false;
    var k = 1 - Math.exp(-dt * 4.2);
    // Subir muros (lineal, la curva la pone ease() en build)
    if (S.grow !== S.growT) {
      var sp = dt / (1.1 * S.levels);
      S.grow = S.grow < S.growT ? Math.min(S.growT, S.grow + sp) : Math.max(S.growT, S.grow - sp * 1.6);
      rebuildModel(); moving = true;
    }
    if (S.mix !== S.mixT) { S.mix = approach(S.mix, S.mixT, k); moving = true; }
    if (S.scan >= 0 && S.scan < 1 && S.grow >= .999) { S.scan = Math.min(1, S.scan + dt / 1.5); moving = true; }
    if (S.money !== S.moneyT) {
      S.money = S.moneyT < S.money ? 0 : Math.min(1, S.money + dt / 1.2);
      moving = true;
    }
    if (S.auto && S.step >= 1 && !S.dragging && !S.hoverEl && S.grow > .5) { S.yawT += dt * .16; }
    var oy = S.yaw, op = S.pitch, od = S.dist;
    S.yaw = approach(S.yaw, S.yawT, k); S.pitch = approach(S.pitch, S.pitchT, k); S.dist = approach(S.dist, S.distT, k);
    if (S.yaw !== oy || S.pitch !== op || S.dist !== od) moving = true;
    return moving || (S.auto && S.step >= 1);
  }
  function frame(now) {
    if (!visible || document.hidden) { running = false; return; }
    if (MOBILE && last && now - last < 31) { requestAnimationFrame(frame); return; }
    var dt = last ? Math.min(.05, (now - last) / 1000) : .016;
    last = now;
    var more = update(dt);
    draw();
    paintPanel();
    if (more) requestAnimationFrame(frame);
    else { running = false; last = 0; }
  }
  function kick() {
    if (!running && visible && model) { running = true; last = 0; requestAnimationFrame(frame); }
  }

  /* ════════════════════ Tamaño ════════════════════ */
  function resize() {
    var r = canvas.getBoundingClientRect();
    cw = Math.max(1, r.width); ch = Math.max(1, r.height);
    canvas.width = Math.round(cw * DPR); canvas.height = Math.round(ch * DPR);
    fitCamera();
    S.dist = S.distT;
    if (model) { draw(); paintPanel(); }
  }
  if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas);
  else window.addEventListener('resize', resize);

  /* ════════════════════ Interacción: girar, señalar ════════════════════ */
  var drag = null;
  function local(e) { var r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
  function inPoly(x, y, pts) {
    var ins = false;
    for (var i = 0, j = 3; i < 4; j = i++) {
      var a = pts[i], b = pts[j];
      if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) ins = !ins;
    }
    return ins;
  }
  function pick(x, y) {
    var ghostHit = null;
    for (var i = drawn.length - 1; i >= 0; i--) {
      var d = drawn[i];
      if (!inPoly(x, y, d.pts)) continue;
      if (d.ghost) { if (!ghostHit) ghostHit = d.el; continue; }
      return d.el;
    }
    return ghostHit;
  }
  function showTip(el, x, y) {
    if (!el || S.step < 1) { tip.hidden = true; return; }
    var c = CATS[el.cat];
    tip.innerHTML = '<i style="background:rgb(' + c.c.join(',') + ')"></i>' + el.tip.replace(' · ', '<br><span>') + '</span>';
    tip.hidden = false;
    var w = tip.offsetWidth, h = tip.offsetHeight;
    tip.style.transform = 'translate(' + Math.round(clamp(x + 14, 8, cw - w - 8)) + 'px,' + Math.round(clamp(y - h - 12, 8, ch - h - 8)) + 'px)';
  }
  function setHover(el, x, y) {
    if (S.hoverEl !== el) { S.hoverEl = el; kick(); }
    showTip(el, x, y);
  }

  canvas.addEventListener('pointerdown', function (e) {
    var p = local(e);
    drag = { x: p[0], y: p[1], x0: p[0], y0: p[1], id: e.pointerId, moved: false, touch: e.pointerType !== 'mouse' };
    if (!drag.touch) { try { canvas.setPointerCapture(e.pointerId); } catch (_) {} }
  });
  canvas.addEventListener('pointermove', function (e) {
    var p = local(e);
    if (drag && drag.id === e.pointerId) {
      var dx = p[0] - drag.x, dy = p[1] - drag.y;
      if (!drag.moved && Math.hypot(p[0] - drag.x0, p[1] - drag.y0) > 4) {
        drag.moved = true; S.dragging = true; stopAuto(); S.auto = false;
        if (S.step < 1) setStep(1, true);
        if (hint) hint.classList.add('gone');
        setHover(null);
        if (drag.touch) { try { canvas.setPointerCapture(e.pointerId); } catch (_) {} }
      }
      if (drag.moved) {
        S.yawT -= dx * .0085; S.yaw = S.yawT;
        if (!drag.touch) { S.pitchT = clamp(S.pitchT + dy * .006, .3, 1.53); S.pitch = S.pitchT; }
        kick();
      }
      drag.x = p[0]; drag.y = p[1];
      return;
    }
    if (e.pointerType === 'mouse') setHover(pick(p[0], p[1]), p[0], p[1]);
  });
  var endDrag = function (e) {
    if (!drag || drag.id !== e.pointerId) return;
    var p = local(e);
    if (!drag.moved && e.type === 'pointerup') {
      var el = pick(p[0], p[1]);
      S.hoverCat = null;
      setHover(el === S.hoverEl && drag.touch ? null : el, p[0], p[1]);
    }
    drag = null; S.dragging = false; kick();
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse' && !drag) setHover(null); });
  canvas.addEventListener('keydown', function (e) {
    var k = e.key, used = true;
    if (k === 'ArrowLeft') S.yawT += .25;
    else if (k === 'ArrowRight') S.yawT -= .25;
    else if (k === 'ArrowUp') S.pitchT = clamp(S.pitchT + .12, .3, 1.53);
    else if (k === 'ArrowDown') S.pitchT = clamp(S.pitchT - .12, .3, 1.53);
    else used = false;
    if (used) { e.preventDefault(); S.auto = false; stopAuto(); if (S.step < 1) setStep(1, true); kick(); }
  });

  /* ════════════════════ Arranque perezoso ════════════════════ */
  function start() {
    if (started) return;
    started = true;
    rebuildFull();
    resize();
    S.grow = 0; rebuildModel();
    S.yaw = S.yawT = 0; S.pitch = S.pitchT = 1.53;
    draw(); paintPanel();
    autoplay();
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      en.forEach(function (x) {
        visible = x.isIntersecting;
        if (visible && x.intersectionRatio > .2) start();
        if (visible) kick();
      });
    }, { threshold: [0, .2, .4] }).observe(root.querySelector('.d3-grid') || stage);
  } else { visible = true; start(); }
  document.addEventListener('visibilitychange', function () { if (!document.hidden) kick(); });
})();
