/* ════════════════════════════════════════════════════════════════════════════
   Mickael Gaillard — Portfolio
   script.js  ·  script unique partagé par index.html, da.html, photo.html

   Structures et mécaniques préservées intégralement.
   Ajout : initArtAmbience pour le fond flou dynamique.
   ════════════════════════════════════════════════════════════════════════════ */

'use strict';

// ── Détection de page ─────────────────────────────────────────────────────────
const IS_GALLERY = !!document.getElementById('stage');
const IS_HOME = !!document.querySelector('.card');

// ── Curseur (partagé) ─────────────────────────────────────────────────────────
const cursor = document.getElementById('cursor');

let onGlobalMove = () => { };

document.addEventListener('mousemove', e => {
  cursor.style.left = `${e.clientX}px`;
  cursor.style.top = `${e.clientY}px`;
  onGlobalMove(e.clientX, e.clientY);
});

// ── Protection — clic droit & sélection (partagé) ────────────────────────────
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('selectstart', e => e.preventDefault());


/* ════════════════════════════════════════════════════════════════════════════
   PAGE ACCUEIL  (index.html)
   ════════════════════════════════════════════════════════════════════════════ */
if (IS_HOME) {
  document.querySelectorAll('.card').forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('big'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('big'));

    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
      el.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
    });
  });

  const LERP_K = 0.06;
  const T_PX = 14;
  const T_PY = 10;
  const R_DEG = 5;

  const magnets = Array.from(document.querySelectorAll('.card')).map(el => ({
    el,
    tx: 0, ty: 0, trx: 0, try: 0,
    cx: 0, cy: 0, crx: 0, cry: 0,
  }));

  onGlobalMove = function (mx, my) {
    magnets.forEach(m => {
      const r = m.el.getBoundingClientRect();
      const ecx = r.left + r.width / 2;
      const ecy = r.top + r.height / 2;
      const dx = (mx - ecx) / (r.width / 2);
      const dy = (my - ecy) / (r.height / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);
      const str = Math.max(0, 1 - dist / 2);

      m.tx = dx * T_PX * str;
      m.ty = dy * T_PY * str;
      m.trx = -dy * R_DEG * str;
      m.try = dx * R_DEG * str;
    });
  };

  (function tick() {
    magnets.forEach(m => {
      m.cx += (m.tx - m.cx) * LERP_K;
      m.cy += (m.ty - m.cy) * LERP_K;
      m.crx += (m.trx - m.crx) * LERP_K;
      m.cry += (m.try - m.cry) * LERP_K;

      m.el.style.transform =
        `perspective(900px)` +
        ` rotateX(${m.crx.toFixed(3)}deg)` +
        ` rotateY(${m.cry.toFixed(3)}deg)` +
        ` translate3d(${m.cx.toFixed(3)}px, ${m.cy.toFixed(3)}px, 0)`;
    });
    requestAnimationFrame(tick);
  })();
}


/* ════════════════════════════════════════════════════════════════════════════
   PAGES GALERIE  (da.html / photo.html)
   ════════════════════════════════════════════════════════════════════════════ */
if (IS_GALLERY) {

  // ── Ambiance Chromatique (Injection Doctorale) ──────────────────────────────
  // Cette fonction assure le lien entre le JS et le pseudo-élément CSS ::before
  function initArtAmbience() {
    const frames = document.querySelectorAll('.art-frame');
    frames.forEach(frame => {
      const img = frame.querySelector('img');
      if (!img) return;

      // On récupère l'URL absolue pour éviter les conflits de dossiers CSS/HTML
      const imgSrc = new URL(img.src, window.location.href).href;

      // On injecte avec les guillemets pour parer aux caractères spéciaux
      frame.style.setProperty('--img-url', `url("${imgSrc}")`);

      if (img.complete) {
        frame.classList.add('loaded');
      } else {
        img.addEventListener('load', () => frame.classList.add('loaded'), { once: true });
      }
    });
  }

  const stage = document.getElementById('stage');
  const rails = Array.from(document.querySelectorAll('.art-rail'));
  const catBtns = Array.from(document.querySelectorAll('.cat-btn'));
  const dotsCont = document.getElementById('art-dots');
  const artCtr = document.getElementById('art-counter');
  const flash = document.getElementById('cat-flash');
  const reveal = document.getElementById('cat-reveal');
  const slideArc = document.getElementById('slide-progress');
  const CIRC = 56.5;

  const CATS = Array.from(document.querySelectorAll('.cat-row')).map(row => ({
    id: row.dataset.id,
    label: row.dataset.label,
    accent: row.dataset.accent,
    count: row.querySelectorAll('.art-frame').length,
    real: row.querySelectorAll('.art-frame:not([data-ph])').length,
  }));

  const S = { cat: 0, art: 0, busy: false };

  const SEQ = [];
  CATS.forEach((cat, ci) => {
    for (let ai = 0; ai < cat.real; ai++) SEQ.push([ci, ai]);
  });
  let seqIdx = 0;

  function syncSeq() {
    const i = SEQ.findIndex(([ci, ai]) => ci === S.cat && ai === S.art);
    if (i >= 0) seqIdx = i;
  }

  function applyAccent(ci) {
    const acc = CATS[ci].accent;
    document.documentElement.style.setProperty('--accent', acc);
    document.querySelectorAll('.cat-row').forEach((row, i) =>
      row.style.setProperty('--accent', CATS[i].accent)
    );
  }

  function render(moveCat, moveArt) {
    if (moveCat) {
      stage.style.transition = 'transform var(--tcat)';
      stage.style.transform = `translateY(${-S.cat * 100}vh)`;
      applyAccent(S.cat);
    }
    if (moveArt) {
      const rail = rails[S.cat];
      rail.style.transition = 'transform var(--tart)';
      rail.style.transform = `translateX(${-S.art * 100}vw)`;
    }
    updateUI();
  }

  function updateUI() {
    catBtns.forEach((b, i) => b.classList.toggle('active', i === S.cat));
    const n = CATS[S.cat].count;
    dotsCont.innerHTML = Array.from({ length: n }, (_, i) =>
      `<div class="dot${i === S.art ? ' on' : ''}" onclick="jumpArt(${i})"></div>`
    ).join('');
    artCtr.textContent = n > 1 ? `${String(S.art + 1).padStart(2, '0')} — ${String(n).padStart(2, '0')}` : '';
  }

  function flashReveal() {
    flash.classList.add('flash');
    reveal.textContent = CATS[S.cat].label.toUpperCase();
    reveal.classList.add('show');
    setTimeout(() => flash.classList.remove('flash'), 180);
    setTimeout(() => reveal.classList.remove('show'), 500);
  }

  function resetRails() {
    rails.forEach((r, i) => {
      if (i !== S.cat) { r.style.transition = 'none'; r.style.transform = 'translateX(0)'; }
    });
  }

  function navCat(dir) {
    if (S.busy) return;
    const next = S.cat + dir;
    if (next < 0 || next >= CATS.length) return;
    S.busy = true; S.cat = next; S.art = 0;
    resetRails(); flashReveal();
    render(true, true);
    setTimeout(() => { S.busy = false; }, 720);
    syncSeq(); resetSlide();
  }

  function navArt(dir) {
    if (S.busy) return;
    const next = S.art + dir;
    if (next < 0 || next >= CATS[S.cat].count) return;
    S.busy = true; S.art = next;
    render(false, true);
    setTimeout(() => { S.busy = false; }, 580);
    syncSeq(); resetSlide();
  }

  window.jumpCat = function (i) {
    if (S.busy || i === S.cat) return;
    S.busy = true; S.cat = i; S.art = 0;
    resetRails(); flashReveal();
    render(true, true);
    setTimeout(() => { S.busy = false; }, 720);
    syncSeq(); resetSlide();
  };

  window.jumpArt = function (i) {
    if (S.busy || i === S.art) return;
    S.busy = true; S.art = i;
    render(false, true);
    setTimeout(() => { S.busy = false; }, 580);
    syncSeq(); resetSlide();
  };

  function gotoFrame(ci, ai) {
    if (S.busy) return;
    S.busy = true;
    const catChanged = ci !== S.cat;
    S.cat = ci; S.art = ai;
    if (catChanged) { resetRails(); flashReveal(); }
    render(catChanged, true);
    setTimeout(() => { S.busy = false; }, catChanged ? 720 : 580);
  }

  let slideRAF = null, slideElapsed = 0, slideLast = null;

  function tickSlide(ts) {
    if (SEQ.length === 0) { slideRAF = null; return; }
    if (slideLast === null) slideLast = ts;
    const dt = Math.min(ts - slideLast, 200);
    slideLast = ts;
    slideElapsed += dt;

    const ratio = Math.min(slideElapsed / 10000, 1);
    const offset = CIRC - ratio * CIRC;
    if (slideArc) slideArc.style.strokeDashoffset = offset;

    if (slideElapsed >= 10000) {
      slideElapsed = 0; slideLast = null;
      seqIdx = (seqIdx + 1) % SEQ.length;
      gotoFrame(...SEQ[seqIdx]);
      setTimeout(updateUI, 60);
    }
    slideRAF = requestAnimationFrame(tickSlide);
  }

  function resetSlide() { slideElapsed = 0; slideLast = null; }

  function startSlide() {
    if (SEQ.length === 0) return;
    if (slideRAF) cancelAnimationFrame(slideRAF);
    slideLast = null; slideElapsed = 0;
    slideRAF = requestAnimationFrame(tickSlide);
  }

  let wY = 0, wT = null;
  document.addEventListener('wheel', e => {
    e.preventDefault();
    wY += e.deltaY;
    clearTimeout(wT);
    wT = setTimeout(() => {
      if (Math.abs(wY) < 20) { wY = 0; return; }
      const dir = wY > 0 ? 1 : -1;
      const next = S.art + dir;
      if (next >= 0 && next < CATS[S.cat].count) navArt(dir);
      else navCat(dir);
      wY = 0;
    }, 35);
  }, { passive: false });

  const drag = { on: false, x0: 0, moved: false };

  document.addEventListener('mousedown', e => {
    if (e.target.closest('button, .dot, .cat-btn, a')) return;
    drag.on = true; drag.x0 = e.clientX; drag.moved = false;
    rails[S.cat].style.transition = 'none';
    document.body.style.userSelect = 'none';
  });

  document.addEventListener('mousemove', e => {
    if (!drag.on) return;
    const dx = e.clientX - drag.x0;
    if (Math.abs(dx) > 4) drag.moved = true;
    const n = CATS[S.cat].count;
    const atEdge = (S.art === 0 && dx > 0) || (S.art === n - 1 && dx < 0);
    const px = atEdge ? dx * 0.15 : dx;
    rails[S.cat].style.transform = `translateX(calc(${-S.art * 100}vw + ${px}px))`;
    if (drag.moved) cursor.classList.add('dragging');
  });

  document.addEventListener('mouseup', e => {
    if (!drag.on) return;
    drag.on = false;
    cursor.classList.remove('dragging');
    document.body.style.userSelect = '';
    const dx = e.clientX - drag.x0;
    const threshold = window.innerWidth * 0.10;
    if (drag.moved && Math.abs(dx) > threshold) {
      navArt(dx < 0 ? 1 : -1);
    } else {
      rails[S.cat].style.transition = 'transform var(--tart)';
      rails[S.cat].style.transform = `translateX(${-S.art * 100}vw)`;
    }
  });

  document.querySelectorAll('.art-frame img').forEach(img =>
    img.addEventListener('dragstart', e => e.preventDefault())
  );

  document.querySelectorAll('.art-frame').forEach(el => {
    el.addEventListener('mouseenter', () => { if (!drag.on) cursor.classList.add('grab'); });
    el.addEventListener('mouseleave', () => cursor.classList.remove('grab', 'dragging'));
  });

  document.querySelectorAll('button, .dot, .cat-btn').forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('big'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('big'));
  });

  document.addEventListener('keydown', e => {
    switch (e.key) {
      case 'ArrowDown': navCat(1); break;
      case 'ArrowUp': navCat(-1); break;
      case 'ArrowRight': navArt(1); break;
      case 'ArrowLeft': navArt(-1); break;
      case ' ':
        e.preventDefault();
        if (SEQ.length === 0) break;
        seqIdx = (seqIdx + 1) % SEQ.length;
        gotoFrame(...SEQ[seqIdx]);
        resetSlide();
        break;
    }
  });

  let tStart = null;
  document.addEventListener('touchstart', e => {
    tStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, { passive: true });

  document.addEventListener('touchend', e => {
    if (!tStart) return;
    const dx = e.changedTouches[0].clientX - tStart.x;
    const dy = e.changedTouches[0].clientY - tStart.y;
    const adx = Math.abs(dx), ady = Math.abs(dy);
    if (adx > ady && adx > 45) navArt(dx < 0 ? 1 : -1);
    else if (ady > adx && ady > 45) {
      const dir = dy < 0 ? 1 : -1;
      const next = S.art + dir;
      if (next >= 0 && next < CATS[S.cat].count) navArt(dir);
      else navCat(dir);
    }
    tStart = null;
  }, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { if (slideRAF) { cancelAnimationFrame(slideRAF); slideRAF = null; } }
    else startSlide();
  });

  // ── Initialisation Finale ─────────────────────────────────────────────────────
  initArtAmbience(); // Ajout doctorat
  applyAccent(0);
  render(true, true);
  startSlide();
}