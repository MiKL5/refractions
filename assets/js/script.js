/* ════════════════════════════════════════════════════════════════════════════
   Mickael Gaillard — Digital Arts Portfolio
   script.js

   ┌─ AJOUTER UNE ŒUVRE ────────────────────────────────────────────────────┐
   │  Dans index.html, trouver le bon <div class="cat-row" data-id="…">     │
   │  et insérer dans son .art-rail :                                        │
   │                                                                         │
   │    <div class="art-frame">                                              │
   │      <img src="data:image/jpeg;base64,BASE64" alt="Titre">             │
   │      <div class="art-overlay"></div>                                    │
   │      <div class="art-info">                                             │
   │        <h2 class="art-title">Titre</h2>                                │
   │      </div>                                                             │
   │    </div>                                                               │
   │                                                                         │
   │  Aucune modification JS ni CSS requise.                                 │
   └─────────────────────────────────────────────────────────────────────────┘
   ════════════════════════════════════════════════════════════════════════════ */

'use strict';

// ── Références DOM ────────────────────────────────────────────────────────────
const stage    = document.getElementById('stage');
const rails    = Array.from(document.querySelectorAll('.art-rail'));
const catBtns  = Array.from(document.querySelectorAll('.cat-btn'));
const dotsCont = document.getElementById('art-dots');
const artCtr   = document.getElementById('art-counter');
const flash    = document.getElementById('cat-flash');
const reveal   = document.getElementById('cat-reveal');
const cursor   = document.getElementById('cursor');
const slideArc = document.getElementById('slide-progress');
const CIRC     = 56.5; // 2π × r=9

// ── Données lues depuis le DOM (ajout d'une image = zéro JS à modifier) ───────
const CATS = Array.from(document.querySelectorAll('.cat-row')).map(row => ({
  id:     row.dataset.id,
  label:  row.dataset.label,
  accent: row.dataset.accent,
  count:  row.querySelectorAll('.art-frame').length,
  real:   row.querySelectorAll('.art-frame:not([data-ph])').length,
}));

// ── État ──────────────────────────────────────────────────────────────────────
const S = { cat: 0, art: 0, busy: false };

// ── Séquence diaporama (toutes vraies images dans l'ordre) ────────────────────
const SEQ = [];
CATS.forEach((cat, ci) => {
  for (let ai = 0; ai < cat.real; ai++) SEQ.push([ci, ai]);
});
let seqIdx = 0;

function syncSeq() {
  const i = SEQ.findIndex(([ci, ai]) => ci === S.cat && ai === S.art);
  if (i >= 0) seqIdx = i;
}

// ── Accent dynamique ──────────────────────────────────────────────────────────
function applyAccent(ci) {
  const acc = CATS[ci].accent;
  document.documentElement.style.setProperty('--accent', acc);
  document.querySelectorAll('.cat-row').forEach((row, i) =>
    row.style.setProperty('--accent', CATS[i].accent)
  );
}

// ── Rendu ─────────────────────────────────────────────────────────────────────
function render(moveCat, moveArt) {
  if (moveCat) {
    stage.style.transition = 'transform var(--tcat)';
    stage.style.transform  = `translateY(${-S.cat * 100}vh)`;
    applyAccent(S.cat);
  }
  if (moveArt) {
    const rail = rails[S.cat];
    rail.style.transition = 'transform var(--tart)';
    rail.style.transform  = `translateX(${-S.art * 100}vw)`;
  }
  updateUI();
}

function updateUI() {
  catBtns.forEach((b, i) => b.classList.toggle('active', i === S.cat));

  const n = CATS[S.cat].count;
  dotsCont.innerHTML = Array.from({ length: n }, (_, i) =>
    `<div class="dot${i === S.art ? ' on' : ''}" onclick="jumpArt(${i})"></div>`
  ).join('');

  artCtr.textContent = n > 1
    ? `${String(S.art + 1).padStart(2, '0')} — ${String(n).padStart(2, '0')}`
    : '';
}

// ── Transitions de catégorie ──────────────────────────────────────────────────
function flashReveal() {
  flash.classList.add('flash');
  reveal.textContent = CATS[S.cat].label.toUpperCase();
  reveal.classList.add('show');
  setTimeout(() => flash.classList.remove('flash'), 180);
  setTimeout(() => reveal.classList.remove('show'),  500);
}

function resetRails() {
  rails.forEach((r, i) => {
    if (i !== S.cat) { r.style.transition = 'none'; r.style.transform = 'translateX(0)'; }
  });
}

// ── Navigation — catégorie ────────────────────────────────────────────────────
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

// ── Navigation — œuvre ────────────────────────────────────────────────────────
function navArt(dir) {
  if (S.busy) return;
  const next = S.art + dir;
  if (next < 0 || next >= CATS[S.cat].count) return;
  S.busy = true; S.art = next;
  render(false, true);
  setTimeout(() => { S.busy = false; }, 580);
  syncSeq(); resetSlide();
}

// ── Sauts directs ─────────────────────────────────────────────────────────────
function jumpCat(i) {
  if (S.busy || i === S.cat) return;
  S.busy = true; S.cat = i; S.art = 0;
  resetRails(); flashReveal();
  render(true, true);
  setTimeout(() => { S.busy = false; }, 720);
  syncSeq(); resetSlide();
}

function jumpArt(i) {
  if (S.busy || i === S.art) return;
  S.busy = true; S.art = i;
  render(false, true);
  setTimeout(() => { S.busy = false; }, 580);
  syncSeq(); resetSlide();
}

// ── Saut interne (diaporama, sans reset du timer) ─────────────────────────────
function gotoFrame(ci, ai) {
  if (S.busy) return;
  S.busy = true;
  const catChanged = ci !== S.cat;
  S.cat = ci; S.art = ai;
  if (catChanged) { resetRails(); flashReveal(); }
  render(catChanged, true);
  setTimeout(() => { S.busy = false; }, catChanged ? 720 : 580);
}

// ── Diaporama automatique — 5 s / image, reboucle au début ───────────────────
let slideRAF = null, slideElapsed = 0, slideLast = null;

function tickSlide(ts) {
  if (slideLast === null) slideLast = ts;
  const dt = Math.min(ts - slideLast, 200); // cap si onglet en arrière-plan
  slideLast = ts;
  slideElapsed += dt;

  const ratio  = Math.min(slideElapsed / 5000, 1);
  const offset = CIRC - ratio * CIRC;
  if (slideArc) slideArc.style.strokeDashoffset = offset;

  if (slideElapsed >= 5000) {
    slideElapsed = 0; slideLast = null;
    seqIdx = (seqIdx + 1) % SEQ.length;   // reboucle au début
    gotoFrame(...SEQ[seqIdx]);
    setTimeout(updateUI, 60);
  }
  slideRAF = requestAnimationFrame(tickSlide);
}

function resetSlide() {
  slideElapsed = 0; slideLast = null;
}

function startSlide() {
  if (slideRAF) cancelAnimationFrame(slideRAF);
  slideLast = null; slideElapsed = 0;
  slideRAF = requestAnimationFrame(tickSlide);
}

// ── Roue — priorité œuvres, débordement → catégorie ──────────────────────────
let wY = 0, wT = null;
document.addEventListener('wheel', e => {
  e.preventDefault();
  wY += e.deltaY;
  clearTimeout(wT);
  wT = setTimeout(() => {
    if (Math.abs(wY) < 20) { wY = 0; return; }
    const dir  = wY > 0 ? 1 : -1;
    const next = S.art + dir;
    if (next >= 0 && next < CATS[S.cat].count) navArt(dir);
    else navCat(dir);
    wY = 0;
  }, 35);
}, { passive: false });

// ── Glisser-déposer horizontal ────────────────────────────────────────────────
const drag = { on: false, x0: 0, moved: false };

document.addEventListener('mousedown', e => {
  if (e.target.closest('button, .dot, .cat-btn')) return;
  drag.on = true; drag.x0 = e.clientX; drag.moved = false;
  rails[S.cat].style.transition = 'none';
  document.body.style.userSelect = 'none';
});

document.addEventListener('mousemove', e => {
  if (!drag.on) return;
  const dx = e.clientX - drag.x0;
  if (Math.abs(dx) > 4) drag.moved = true;

  const n      = CATS[S.cat].count;
  const atEdge = (S.art === 0 && dx > 0) || (S.art === n - 1 && dx < 0);
  const px     = atEdge ? dx * 0.15 : dx; // résistance élastique aux bords

  rails[S.cat].style.transform =
    `translateX(calc(${-S.art * 100}vw + ${px}px))`;

  if (drag.moved) cursor.classList.add('dragging');
});

document.addEventListener('mouseup', e => {
  if (!drag.on) return;
  drag.on = false;
  cursor.classList.remove('dragging');
  document.body.style.userSelect = '';

  const dx        = e.clientX - drag.x0;
  const threshold = window.innerWidth * 0.10; // 10 % du viewport

  if (drag.moved && Math.abs(dx) > threshold) {
    navArt(dx < 0 ? 1 : -1);
  } else {
    rails[S.cat].style.transition = 'transform var(--tart)';
    rails[S.cat].style.transform  = `translateX(${-S.art * 100}vw)`;
  }
});

// Désactiver le drag natif du navigateur sur les images
document.querySelectorAll('.art-frame img').forEach(img =>
  img.addEventListener('dragstart', e => e.preventDefault())
);

// ── Feedback curseur sur les frames ──────────────────────────────────────────
document.querySelectorAll('.art-frame').forEach(el => {
  el.addEventListener('mouseenter', () => { if (!drag.on) cursor.classList.add('grab'); });
  el.addEventListener('mouseleave', () => cursor.classList.remove('grab', 'dragging'));
});

// ── Clavier ──────────────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  switch (e.key) {
    case 'ArrowDown':  navCat(1);  break;
    case 'ArrowUp':    navCat(-1); break;
    case 'ArrowRight': navArt(1);  break;
    case 'ArrowLeft':  navArt(-1); break;
    case ' ':
      e.preventDefault();
      seqIdx = (seqIdx + 1) % SEQ.length;
      gotoFrame(...SEQ[seqIdx]);
      resetSlide();
      break;
  }
});

// ── Tactile ──────────────────────────────────────────────────────────────────
let tStart = null;
document.addEventListener('touchstart', e => {
  tStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
}, { passive: true });

document.addEventListener('touchend', e => {
  if (!tStart) return;
  const dx = e.changedTouches[0].clientX - tStart.x;
  const dy = e.changedTouches[0].clientY - tStart.y;
  const adx = Math.abs(dx), ady = Math.abs(dy);

  if (adx > ady && adx > 45) {
    navArt(dx < 0 ? 1 : -1);
  } else if (ady > adx && ady > 45) {
    const dir  = dy < 0 ? 1 : -1;
    const next = S.art + dir;
    if (next >= 0 && next < CATS[S.cat].count) navArt(dir);
    else navCat(dir);
  }
  tStart = null;
}, { passive: true });

// ── Position curseur ──────────────────────────────────────────────────────────
document.addEventListener('mousemove', e => {
  cursor.style.left = `${e.clientX}px`;
  cursor.style.top  = `${e.clientY}px`;
});

document.querySelectorAll('button, .dot, .cat-btn').forEach(el => {
  el.addEventListener('mouseenter', () => cursor.classList.add('big'));
  el.addEventListener('mouseleave', () => cursor.classList.remove('big'));
});

// ── Protection — clic droit & sélection ──────────────────────────────────────
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('selectstart',  e => e.preventDefault());

// ── Visibilité — pause si onglet masqué ──────────────────────────────────────
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (slideRAF) { cancelAnimationFrame(slideRAF); slideRAF = null; }
  } else {
    startSlide();
  }
});

// ── Initialisation ────────────────────────────────────────────────────────────
applyAccent(0);
render(true, true);
startSlide();
