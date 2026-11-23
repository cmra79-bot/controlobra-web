/* Videos del producto (portada y /precios/).
   Cada <div class="dv-frame" data-dv-base="/assets/video/NOMBRE-"> se maneja solo:
   preload="none" (no baja nada hasta que la sección está cerca), archivo según
   ancho × devicePixelRatio (<1300 → 1080, <2200 → 1920, si no 2560), se pausa
   fuera de pantalla y con "reducir movimiento" no arranca solo. Los capítulos
   son los .dv-chap dentro de [data-dv-chaps="<id del frame>"]. */
(function(){
  const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function iniciar(frame){
    const v = frame.querySelector('video'), play = frame.querySelector('.dv-play');
    if(!v || !play) return;
    const base = frame.dataset.dvBase;
    const chaps = [...document.querySelectorAll('[data-dv-chaps="' + frame.id + '"] .dv-chap')];
    let cargado = false, usuarioPauso = false;
    function cargar(){ if(cargado) return; cargado = true;
      const px = Math.min(window.innerWidth, screen.width || 9999) * (window.devicePixelRatio || 1);
      v.src = base + (px < 1300 ? '1080' : px < 2200 ? '1920' : '2560') + '.mp4'; }
    function intentar(){ cargar(); const p = v.play(); if(p && p.catch) p.catch(()=>frame.classList.add('paused')); }
    v.addEventListener('play', ()=>frame.classList.remove('paused'));
    v.addEventListener('pause', ()=>frame.classList.add('paused'));
    play.addEventListener('click', ()=>{ usuarioPauso = false; intentar(); });
    v.addEventListener('click', ()=>{ if(v.paused){ usuarioPauso = false; intentar(); } else { usuarioPauso = true; v.pause(); } });
    chaps.forEach(c=>c.addEventListener('click', ()=>{ cargar(); const t = +c.dataset.t;
      const ir = ()=>{ v.currentTime = t; usuarioPauso = false; intentar(); };
      if(v.readyState >= 1) ir(); else v.addEventListener('loadedmetadata', ir, {once:true}); }));
    v.addEventListener('timeupdate', ()=>{ let k = 0; chaps.forEach((c,i)=>{ if(v.currentTime >= +c.dataset.t - .05) k = i; });
      chaps.forEach((c,i)=>c.classList.toggle('on', i===k)); });
    if(quieto){ frame.classList.add('paused'); return; }
    new IntersectionObserver(es=>es.forEach(e=>{
      if(e.isIntersecting){ if(!usuarioPauso) intentar(); } else if(!v.paused){ v.pause(); }
    }), {rootMargin:'200px 0px', threshold:.35}).observe(frame);
  }
  document.querySelectorAll('.dv-frame[data-dv-base]').forEach(iniciar);
})();
