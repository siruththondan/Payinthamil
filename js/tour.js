/**
 * tour.js — Polished bilingual guided tour for Payinthamil.
 * Pure vanilla JS, no external dependencies.
 * Exports: initTour(storageRef)
 * Exposes: window.startTour()
 */

/* ── Step demo panels (mini animated previews) ────────── */
const DEMOS = [
  // 0: Typing area — composed Tamil syllables + cursor
  `<div class="td-typing">
    <span class="td-char td-done">க</span>
    <span class="td-char td-done">ட</span>
    <span class="td-char td-done">ல்</span>
    <span class="td-char td-current">கா</span>
    <span class="td-char">க</span>
    <span class="td-cursor"></span>
  </div>`,

  // 1: Hint bar — two keys showing
  `<div class="td-hint">
    <kbd class="td-key td-key-done">l</kbd>
    <span class="td-plus">+</span>
    <kbd class="td-key td-key-active">q</kbd>
    <span class="td-arrow">→</span>
    <span class="td-result">லா</span>
  </div>`,

  // 2: Stats strip — WPM + animated goal bar
  `<div class="td-stats">
    <div class="td-stat"><span class="td-stat-val td-count">42</span><span class="td-stat-lbl">WPM</span></div>
    <div class="td-stat"><span class="td-stat-val">97%</span><span class="td-stat-lbl">ACC</span></div>
    <div class="td-goal"><div class="td-goal-fill"></div></div>
  </div>`,

  // 3: Key accuracy — colour bars filling
  `<div class="td-keys">
    <div class="td-krow"><span class="td-klbl">க</span><div class="td-kbar"><div class="td-kfill td-kfill-ok" style="--w:88%"></div></div></div>
    <div class="td-krow"><span class="td-klbl">ட</span><div class="td-kbar"><div class="td-kfill td-kfill-warn" style="--w:55%"></div></div></div>
    <div class="td-krow"><span class="td-klbl">த</span><div class="td-kbar"><div class="td-kfill td-kfill-ok" style="--w:92%"></div></div></div>
  </div>`,

  // 4: Lessons — list with active row
  `<div class="td-lessons">
    <div class="td-lesson td-lesson-done">1. உயிர் எழுத்துகள்</div>
    <div class="td-lesson td-lesson-active">2. மெய் எழுத்துகள்</div>
    <div class="td-lesson">3. உயிர்மெய்</div>
    <div class="td-lesson">4. சொற்கள்</div>
  </div>`,

  // 5: Finger guide — mini colour-coded keyboard SVG
  `<svg class="td-kb-svg" viewBox="0 0 300 70" xmlns="http://www.w3.org/2000/svg">
  <!-- Top row: q w e r t y u i o p -->
  <rect x="2"   y="2"  width="26" height="28" rx="3" fill="#c47d56"/>
  <rect x="31"  y="2"  width="26" height="28" rx="3" fill="#6fcb81"/>
  <rect x="60"  y="2"  width="26" height="28" rx="3" fill="#6ba8e0"/>
  <rect x="89"  y="2"  width="26" height="28" rx="3" fill="#9d99d8"/>
  <rect x="118" y="2"  width="26" height="28" rx="3" fill="#9d99d8"/>
  <rect x="147" y="2"  width="26" height="28" rx="3" fill="#9d99d8"/>
  <rect x="176" y="2"  width="26" height="28" rx="3" fill="#9d99d8"/>
  <rect x="205" y="2"  width="26" height="28" rx="3" fill="#6ba8e0"/>
  <rect x="234" y="2"  width="26" height="28" rx="3" fill="#6fcb81"/>
  <rect x="263" y="2"  width="35" height="28" rx="3" fill="#c47d56"/>
  <!-- Home row: a s d f g h j k l ; -->
  <rect x="7"   y="36" width="26" height="28" rx="3" fill="#c47d56"/>
  <rect x="36"  y="36" width="26" height="28" rx="3" fill="#6fcb81"/>
  <rect x="65"  y="36" width="26" height="28" rx="3" fill="#6ba8e0"/>
  <rect x="94"  y="36" width="26" height="28" rx="3" fill="#9d99d8"/>
  <rect x="123" y="36" width="26" height="28" rx="3" fill="#9d99d8"/>
  <rect x="152" y="36" width="26" height="28" rx="3" fill="#9d99d8"/>
  <rect x="181" y="36" width="26" height="28" rx="3" fill="#9d99d8"/>
  <rect x="210" y="36" width="26" height="28" rx="3" fill="#6ba8e0"/>
  <rect x="239" y="36" width="26" height="28" rx="3" fill="#6fcb81"/>
  <rect x="268" y="36" width="26" height="28" rx="3" fill="#c47d56"/>
  <!-- Key labels row 1 -->
  <text x="15"  y="21" font-size="9" fill="rgba(255,255,255,.85)" text-anchor="middle" font-family="monospace">q</text>
  <text x="44"  y="21" font-size="9" fill="rgba(255,255,255,.85)" text-anchor="middle" font-family="monospace">w</text>
  <text x="73"  y="21" font-size="9" fill="rgba(255,255,255,.85)" text-anchor="middle" font-family="monospace">e</text>
  <text x="102" y="21" font-size="9" fill="rgba(255,255,255,.85)" text-anchor="middle" font-family="monospace">r</text>
  <text x="131" y="21" font-size="9" fill="rgba(255,255,255,.85)" text-anchor="middle" font-family="monospace">t</text>
  <text x="160" y="21" font-size="9" fill="rgba(255,255,255,.85)" text-anchor="middle" font-family="monospace">y</text>
  <text x="189" y="21" font-size="9" fill="rgba(255,255,255,.85)" text-anchor="middle" font-family="monospace">u</text>
  <text x="218" y="21" font-size="9" fill="rgba(255,255,255,.85)" text-anchor="middle" font-family="monospace">i</text>
  <text x="247" y="21" font-size="9" fill="rgba(255,255,255,.85)" text-anchor="middle" font-family="monospace">o</text>
  <text x="280" y="21" font-size="9" fill="rgba(255,255,255,.85)" text-anchor="middle" font-family="monospace">p</text>
  <!-- Key labels row 2 -->
  <text x="20"  y="55" font-size="9" fill="rgba(255,255,255,.85)" text-anchor="middle" font-family="monospace">a</text>
  <text x="49"  y="55" font-size="9" fill="rgba(255,255,255,.85)" text-anchor="middle" font-family="monospace">s</text>
  <text x="78"  y="55" font-size="9" fill="rgba(255,255,255,.85)" text-anchor="middle" font-family="monospace">d</text>
  <text x="107" y="55" font-size="9" fill="rgba(255,255,255,.85)" text-anchor="middle" font-family="monospace">f</text>
  <text x="136" y="55" font-size="9" fill="rgba(255,255,255,.85)" text-anchor="middle" font-family="monospace">g</text>
  <text x="165" y="55" font-size="9" fill="rgba(255,255,255,.85)" text-anchor="middle" font-family="monospace">h</text>
  <text x="194" y="55" font-size="9" fill="rgba(255,255,255,.85)" text-anchor="middle" font-family="monospace">j</text>
  <text x="223" y="55" font-size="9" fill="rgba(255,255,255,.85)" text-anchor="middle" font-family="monospace">k</text>
  <text x="252" y="55" font-size="9" fill="rgba(255,255,255,.85)" text-anchor="middle" font-family="monospace">l</text>
  <text x="281" y="55" font-size="9" fill="rgba(255,255,255,.85)" text-anchor="middle" font-family="monospace">;</text>
</svg>`,

  // 6: Themes — colour swatches
  `<div class="td-themes">
    <span class="td-swatch" style="background:#141414;border:2px solid #c47d56"></span>
    <span class="td-swatch" style="background:#1a1625;border:2px solid #7c5cbf"></span>
    <span class="td-swatch" style="background:#0d1b2a;border:2px solid #4a9ebf"></span>
    <span class="td-swatch" style="background:#1c2318;border:2px solid #5a8a4a"></span>
    <span class="td-swatch" style="background:#1a1208;border:2px solid #d4840a"></span>
    <span class="td-swatch" style="background:#f4f0e8;border:2px solid #c45a28"></span>
  </div>`,

  // 7: Settings — two rows of options
  `<div class="td-settings">
    <div class="td-setting-row"><span class="td-stlbl">Layout</span><span class="td-stval">Tamil 99</span></div>
    <div class="td-setting-row"><span class="td-stlbl">Speed goal</span><span class="td-stval">30 WPM</span></div>
  </div>`,

  // 8: Hints toggle — animated toggle knob
  `<div class="td-toggle-demo">
    <span class="td-toglbl">Hints</span>
    <div class="td-tog td-tog-on"><div class="td-tog-knob"></div></div>
  </div>`,

  // 9: Compact / view cycle — three size modes
  `<div class="td-view-modes">
    <div class="td-vm td-vm-active"><span class="td-vm-icon">▤</span><span class="td-vm-lbl">Compact</span></div>
    <div class="td-vm"><span class="td-vm-icon">▣</span><span class="td-vm-lbl">Large</span></div>
    <div class="td-vm"><span class="td-vm-icon">◻</span><span class="td-vm-lbl">Zen</span></div>
  </div>`,

  // 10: Thirukkural — verse lines
  `<div class="td-kural">
    <div class="td-kural-line">கற்க கசடற கற்பவை</div>
    <div class="td-kural-line td-kural-dim">கற்றபின் நிற்க அதற்குத் தக</div>
  </div>`,

  // 11: Report — stat cards
  `<div class="td-report">
    <div class="td-rcard"><span class="td-rval">42</span><span class="td-rlbl">WPM</span></div>
    <div class="td-rcard"><span class="td-rval">96%</span><span class="td-rlbl">ACC</span></div>
    <div class="td-rcard"><span class="td-rval">12</span><span class="td-rlbl">பாடம்</span></div>
  </div>`,
];

/* ── Tour steps (bilingual) ───────────────────────────── */
export const STEPS = [
  {
    targetSelector: '#typing-area',
    titleTamil: 'இங்கே தட்டச்சு செய்யுங்கள்',
    titleEn: 'Typing Area',
    bodyTamil: 'திரையில் தெரியும் எழுத்துகளைத் தட்டச்சு செய்யுங்கள். அடுத்து தட்டச்சு செய்ய வேண்டிய எழுத்து ஒளிரும்.',
    body: 'Type the characters shown here. The next character to type will be highlighted.',
    placement: 'bottom',
  },
  {
    targetSelector: '#key-guide',
    titleTamil: 'அடுத்து எந்த விசை?',
    titleEn: 'Key Guide',
    bodyTamil: 'அடுத்து எந்த விசையை அழுத்த வேண்டும் என்று இங்கே காட்டப்படும். எடுத்துக்காட்டாக, க + ா சேர்த்தால் கா.',
    body: 'See which key to press next. For example, க + ா = கா.',
    placement: 'top',
  },
  {
    targetSelector: '#stats-strip',
    titleTamil: 'உங்கள் பயிற்சி நிலை',
    titleEn: 'Your Progress',
    bodyTamil: 'எவ்வளவு வேகமாகத் தட்டச்சு செய்கிறீர்கள், எத்தனை எழுத்துகளைச் சரியாகத் தட்டச்சு செய்கிறீர்கள், இன்றைய பயிற்சியில் எவ்வளவு முடித்திருக்கிறீர்கள் என எல்லாவற்றையும் இங்கே பார்க்கலாம்.',
    body: 'Keep track of your typing speed, accuracy, and daily practice goal.',
    placement: 'bottom',
  },
  {
    targetSelector: '#key-panel',
    titleTamil: 'எந்த விசையில் பயிற்சி தேவை?',
    titleEn: 'Key Practice',
    bodyTamil: 'எந்த விசைகளைச் சரியாக அழுத்துகிறீர்கள், எந்த விசைகளில் தவறு செய்கிறீர்கள் என்பதை வண்ணங்களைப் பார்த்தே தெரிந்துகொள்ளலாம்.',
    body: 'See which keys you type accurately and which ones need more practice.',
    placement: 'left',
  },
  {
    targetSelector: '#btn-lessons',
    titleTamil: 'பாடங்கள்',
    titleEn: 'Lessons',
    bodyTamil: 'உயிரெழுத்துகள், மெய்யெழுத்துகள் என அடிப்படையிலிருந்து தொடங்கி, உயிர்மெய் எழுத்துகள், சொற்கள் என ஒவ்வொன்றாகப் பழகலாம். மொத்தம் 35 பாடங்கள் இருக்கின்றன.',
    body: 'Start with vowels and consonants, then move on to compound letters and words. There are 35 lessons to work through.',
    placement: 'bottom',
  },
  {
    targetSelector: '#btn-finger',
    titleTamil: 'எந்த விரலால் தட்டச்சு செய்வது?',
    titleEn: 'Finger Guide',
    bodyTamil: 'விசைப்பலகையில் எந்த விசையை எந்த விரலால் அழுத்த வேண்டும் என்பதை வண்ணங்களுடன் காட்டும்.',
    body: 'Learn which finger to use for each key with the colour-coded keyboard.',
    placement: 'bottom',
  },
  {
    targetSelector: '#btn-theme-picker',
    titleTamil: 'உங்களுக்குப் பிடித்த வண்ணம்',
    titleEn: 'Themes',
    bodyTamil: 'உங்களுக்குப் பிடித்த வண்ணத்தில் செயலியை மாற்றிக்கொள்ளுங்கள். குறிஞ்சி, முல்லை, நெய்தல் உள்ளிட்ட சங்கத் திணைகளின் பெயர்களிலும் வண்ணத் தோற்றங்கள் இருக்கின்றன.',
    body: 'Pick a look you like. Choose from 16 themes, including five inspired by the Sangam landscapes.',
    placement: 'bottom',
  },
  {
    targetSelector: '#btn-info',
    titleTamil: 'அமைப்புகள்',
    titleEn: 'Settings',
    bodyTamil: 'விசைப்பலகை அமைப்பு, ஒலி மற்றும் மற்ற விருப்பங்களை உங்கள் வசதிக்கேற்ப மாற்றிக்கொள்ளலாம்.',
    body: 'Change your keyboard layout, sound, and other typing preferences.',
    placement: 'bottom',
  },
  {
    targetSelector: '.hints-label',
    titleTamil: 'உதவிக் குறிப்புகள்',
    titleEn: 'Hints',
    bodyTamil: 'தட்டச்சு செய்யும்போது காட்டப்படும் உதவிக் குறிப்புகளை இங்கே அணைக்கலாம். பழகிய பிறகு குறிப்புகள் இல்லாமலேயே தட்டச்சு செய்து பாருங்கள்.',
    body: 'Turn typing hints on or off. Try switching them off when you want to practise from memory.',
    placement: 'bottom',
  },
  {
    targetSelector: '#btn-view',
    titleTamil: 'திரைத் தோற்றம்',
    titleEn: 'View Mode',
    bodyTamil: 'Compact, Large, Zen என மூன்று விதமான திரைத் தோற்றங்களில் உங்களுக்குப் பிடித்ததைத் தேர்ந்தெடுத்துக்கொள்ளலாம்.',
    body: 'Choose the view that suits you: Compact, Large, or Zen.',
    placement: 'bottom',
  },
  {
    targetSelector: '.tab-btn[data-tab="kural"]',
    titleTamil: 'திருக்குறள் தட்டச்சுப் பயிற்சி',
    titleEn: 'Thirukkural Practice',
    bodyTamil: 'திருக்குறள்களைத் தட்டச்சு செய்து பழகுங்கள். 1330 குறள்களும் இங்கே உள்ளன.',
    body: 'Practise typing with all 1,330 Thirukkural couplets.',
    placement: 'bottom',
  },
  {
    targetSelector: '.tab-btn[data-tab="report"]',
    titleTamil: 'உங்கள் பயிற்சி அறிக்கை',
    titleEn: 'Your Report',
    bodyTamil: 'உங்கள் தட்டச்சு வேகம், துல்லியம், முடித்த பாடங்கள் ஆகியவற்றின் விவரங்களை இங்கே பார்க்கலாம். வேண்டுமென்றால் PDF ஆகவும் பதிவிறக்கம் செய்யலாம்.',
    body: 'Check your typing speed, accuracy, and completed lessons. You can also download your report as a PDF.',
    placement: 'bottom',
  },
];

const N = STEPS.length;
const GAP = 14; // px gap between target and tooltip edge

/* ── Internal state ───────────────────────────────────── */
let step = 0;
let running = false;
let storageRef = null;
let prevHighlighted = null;
let transitionTimer = null;

/* ── Reposition on resize / scroll (rAF-throttled) ────── */
let relayoutQueued = false;
function onRelayout() {
  if (relayoutQueued || !running) return;
  relayoutQueued = true;
  requestAnimationFrame(() => {
    relayoutQueued = false;
    if (running && document.getElementById('tour-tooltip')) renderStep(step);
  });
}

/* ── DOM builders ─────────────────────────────────────── */
function buildTourDOM() {
  // Overlay with SVG clipPath for spotlight hole
  const overlay = document.createElement('div');
  overlay.id = 'tour-overlay';
  overlay.setAttribute('aria-hidden', 'true');

  // Spotlight div — transparent window with huge box-shadow creating dim fog outside
  const spotlight = document.createElement('div');
  spotlight.id = 'tour-spotlight';
  spotlight.setAttribute('aria-hidden', 'true');

  // Tooltip
  const tooltip = document.createElement('div');
  tooltip.id = 'tour-tooltip';
  tooltip.setAttribute('role', 'dialog');
  tooltip.setAttribute('aria-modal', 'true');
  tooltip.setAttribute('aria-label', 'Feature tour');
  tooltip.setAttribute('tabindex', '-1');

  tooltip.innerHTML = `
    <div class="tour-progress-bar">
      <div class="tour-progress-fill" id="tour-progress-fill"></div>
    </div>
    <div class="tour-header">
      <span class="tour-step-label" id="tour-step-label">Step 1 / ${N}</span>
      <button class="tour-close-btn" id="tour-close" aria-label="Close tour">&#x2715;</button>
    </div>
    <div class="tour-inner">
      <div class="tour-title" id="tour-title-tamil"></div>
      <div class="tour-body" id="tour-body"></div>
      <div class="tour-demo" id="tour-demo" aria-hidden="true"></div>
    </div>
    <div class="tour-footer">
      <div class="tour-footer-left">
        <button class="tour-prev" id="tour-prev" aria-label="Previous step">← Prev</button>
        <button class="tour-skip" id="tour-skip" aria-label="Skip tour">Skip tour</button>
      </div>
      <div class="tour-dots" id="tour-dots" aria-hidden="true"></div>
      <button class="tour-next" id="tour-next">Next →</button>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(spotlight);
  document.body.appendChild(tooltip);

  // Build dots
  const dotsContainer = document.getElementById('tour-dots');
  for (let i = 0; i < N; i++) {
    const dot = document.createElement('span');
    dot.className = 'tour-dot';
    dot.dataset.index = i;
    dotsContainer.appendChild(dot);
  }

  // Wire events — clicks outside do NOT close tour (intentional)
  overlay.addEventListener('click', (e) => e.stopPropagation());
  spotlight.addEventListener('click', (e) => e.stopPropagation());
  const closeBtn = document.getElementById('tour-close');
  if (closeBtn) closeBtn.addEventListener('click', endTour);
  document.getElementById('tour-skip').addEventListener('click', endTour);
  document.getElementById('tour-prev').addEventListener('click', goPrev);
  document.getElementById('tour-next').addEventListener('click', goNext);
  document.addEventListener('keydown', onKeyDown);
  window.addEventListener('resize', onRelayout);
  window.addEventListener('scroll', onRelayout, true);

  // Fade in overlay (no-op visually now, kept for aria state)
  requestAnimationFrame(() => {
    overlay.classList.add('tour-overlay-visible');
  });
}

function destroyTourDOM() {
  clearHighlight();
  document.removeEventListener('keydown', onKeyDown);
  window.removeEventListener('resize', onRelayout);
  window.removeEventListener('scroll', onRelayout, true);

  const overlay = document.getElementById('tour-overlay');
  const spotlight = document.getElementById('tour-spotlight');
  const tooltip = document.getElementById('tour-tooltip');
  const svg = document.getElementById('tour-clip-svg');

  if (overlay) {
    overlay.classList.remove('tour-overlay-visible');
    setTimeout(() => overlay.remove(), 320);
  }
  if (spotlight) {
    spotlight.classList.remove('tour-spotlight-visible');
    setTimeout(() => spotlight.remove(), 320);
  }
  if (tooltip) {
    tooltip.classList.remove('tour-visible');
    setTimeout(() => tooltip.remove(), 260);
  }
  if (svg) svg.remove();
}

/* ── Highlight ────────────────────────────────────────── */
const HOLE_PAD = 8; // px padding around target in the spotlight window

function positionSpotlight(el, skip) {
  const spotlight = document.getElementById('tour-spotlight');
  if (!spotlight) return;
  if (!el || skip) {
    // Hide spotlight — full dim, no hole
    spotlight.classList.remove('tour-spotlight-visible');
    return;
  }
  const r = el.getBoundingClientRect();
  // Zero-size (display:none / collapsed) target: no hole to cut.
  if (r.width === 0 || r.height === 0) {
    spotlight.classList.remove('tour-spotlight-visible');
    return;
  }
  const p = HOLE_PAD;
  spotlight.style.top    = (r.top    - p) + 'px';
  spotlight.style.left   = (r.left   - p) + 'px';
  spotlight.style.width  = (r.width  + p * 2) + 'px';
  spotlight.style.height = (r.height + p * 2) + 'px';
  spotlight.classList.add('tour-spotlight-visible');
}

function highlightTarget(el, skipSpotlight) {
  if (prevHighlighted) prevHighlighted.classList.remove('tour-highlight');
  prevHighlighted = el;
  if (el) {
    el.classList.add('tour-highlight');
    el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  positionSpotlight(el, skipSpotlight);
}

function clearHighlight() {
  if (prevHighlighted) {
    prevHighlighted.classList.remove('tour-highlight');
    prevHighlighted = null;
  }
}

/* ── Arrow direction management ───────────────────────── */
const ARROW_CLASSES = [
  'tour-arrow-up', 'tour-arrow-down', 'tour-arrow-left', 'tour-arrow-right',
];

function setArrow(tooltip, placement) {
  ARROW_CLASSES.forEach(c => tooltip.classList.remove(c));
  // placement = where tooltip sits relative to target
  // arrow points toward the target, i.e. opposite of placement
  const map = { top: 'tour-arrow-down', bottom: 'tour-arrow-up', left: 'tour-arrow-right', right: 'tour-arrow-left' };
  if (map[placement]) tooltip.classList.add(map[placement]);
}

/* ── Positioning — never overlap the target ───────────── */
function positionTooltip(tooltip, target, placement) {
  const TOOLTIP_W = 280;
  const MARGIN = 14;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  tooltip.style.width = TOOLTIP_W + 'px';
  // Reset so offsetHeight measurement is valid
  tooltip.style.left = '0px';
  tooltip.style.top = '0px';

  const tr = target.getBoundingClientRect();
  const th = tooltip.offsetHeight;
  const tw = TOOLTIP_W;

  // Total offset from target edge = spotlight padding + visual gap
  const OFFSET = HOLE_PAD + GAP;

  // Space available on each side (from spotlight edge to viewport edge, minus gap)
  const spaceBelow = vh - tr.bottom - OFFSET;
  const spaceAbove = tr.top - OFFSET;
  const spaceRight = vw - tr.right - OFFSET;
  const spaceLeft  = tr.left - OFFSET;

  // Build candidate order: preferred first, then remaining sides by available space
  const candidates = [
    { side: 'bottom', space: spaceBelow, needed: th },
    { side: 'top',    space: spaceAbove, needed: th },
    { side: 'right',  space: spaceRight, needed: tw },
    { side: 'left',   space: spaceLeft,  needed: tw },
  ];
  // Sort: preferred side first, then by descending available space
  candidates.sort((a, b) => {
    if (a.side === placement) return -1;
    if (b.side === placement) return 1;
    return b.space - a.space;
  });

  // Pick first side that fits; fall back to the side with most room
  let resolved = candidates[0].side;
  for (const c of candidates) {
    if (c.space >= c.needed + MARGIN) { resolved = c.side; break; }
  }

  let left, top;

  if (resolved === 'bottom') {
    top  = tr.bottom + OFFSET;
    left = tr.left + tr.width / 2 - tw / 2;
  } else if (resolved === 'top') {
    top  = tr.top - th - OFFSET;
    left = tr.left + tr.width / 2 - tw / 2;
  } else if (resolved === 'right') {
    left = tr.right + OFFSET;
    top  = tr.top + tr.height / 2 - th / 2;
  } else {
    left = tr.left - tw - OFFSET;
    top  = tr.top + tr.height / 2 - th / 2;
  }

  // Clamp within viewport
  left = Math.max(MARGIN, Math.min(left, vw - tw - MARGIN));
  top  = Math.max(MARGIN, Math.min(top,  vh - th - MARGIN));

  // Safety check: if tooltip rect still overlaps the spotlight, nudge it clear.
  // Compute spotlight rect for collision detection
  const spLeft   = tr.left   - HOLE_PAD;
  const spTop    = tr.top    - HOLE_PAD;
  const spRight  = tr.right  + HOLE_PAD;
  const spBottom = tr.bottom + HOLE_PAD;
  const tooltipOverlaps = !(left + tw <= spLeft || left >= spRight || top + th <= spTop || top >= spBottom);

  // When the target is large (>50% viewport) or tooltip still overlaps, push clear.
  const targetIsWide  = tr.width  > vw * 0.5;
  const targetIsTall  = tr.height > vh * 0.5;
  if (targetIsWide || targetIsTall || tooltipOverlaps) {
    // Pin card outside the spotlight with the most free space
    const useRight  = (vw - spRight) > spLeft;
    const useBottom = (vh - spBottom) > spTop;
    if (useRight)  left = Math.min(vw - tw - MARGIN, spRight + GAP);
    else           left = Math.max(MARGIN, spLeft - tw - GAP);
    if (useBottom) top  = Math.min(vh - th - MARGIN, spBottom + GAP);
    else           top  = Math.max(MARGIN, spTop - th - GAP);
    // Re-clamp
    left = Math.max(MARGIN, Math.min(left, vw - tw - MARGIN));
    top  = Math.max(MARGIN, Math.min(top,  vh - th - MARGIN));
  }

  tooltip.style.left = left + 'px';
  tooltip.style.top  = top  + 'px';

  setArrow(tooltip, resolved);
}

/* ── Step rendering ───────────────────────────────────── */
function renderStep(i) {
  const s = STEPS[i];
  const isFirst = i === 0;
  const isLast = i === N - 1;

  // Step label "3 / 11"
  const stepLabel = document.getElementById('tour-step-label');
  if (stepLabel) stepLabel.textContent = `Step ${i + 1} / ${N}`;

  // Title — use English title, fall back to Tamil
  const titleEl = document.getElementById('tour-title-tamil');
  titleEl.textContent = s.titleEn || s.titleTamil || '';

  // Body — bilingual: Tamil first, then English
  const bodyEl = document.getElementById('tour-body');
  if (s.bodyTamil) {
    bodyEl.innerHTML =
      `<span class="tour-body-tamil">${s.bodyTamil}</span>` +
      `<span class="tour-body-en">${s.body}</span>`;
  } else {
    bodyEl.textContent = s.body;
  }

  // Demo panel
  const demoEl = document.getElementById('tour-demo');
  demoEl.className = 'tour-demo';
  demoEl.innerHTML = DEMOS[i] ?? '';
  if (DEMOS[i]) demoEl.classList.add('tour-demo-active');

  // Step data attribute for potential CSS targeting
  document.getElementById('tour-tooltip').dataset.step = i;

  // Progress bar
  const pct = ((i + 1) / N) * 100;
  document.getElementById('tour-progress-fill').style.width = pct + '%';

  // Dots
  document.querySelectorAll('.tour-dot').forEach((dot, idx) => {
    dot.classList.toggle('tour-dot-active', idx === i);
  });

  // Prev button
  const prevBtn = document.getElementById('tour-prev');
  prevBtn.style.visibility = isFirst ? 'hidden' : 'visible';

  // Next button
  const nextBtn = document.getElementById('tour-next');
  if (isLast) {
    nextBtn.textContent = 'தொடங்கு · Start';
    nextBtn.classList.add('tour-next-done');
  } else {
    nextBtn.textContent = 'Next \u2192';
    nextBtn.classList.remove('tour-next-done');
  }

  // Highlight + position
  // A hidden / zero-size target is treated as absent so the centred layout is
  // used and no highlight class lands on an invisible element.
  const found = document.querySelector(s.targetSelector);
  const tr = found?.getBoundingClientRect();
  const target = (tr && tr.width > 0 && tr.height > 0) ? found : null;
  highlightTarget(target, s.noSpotlight);

  const tooltip = document.getElementById('tour-tooltip');
  if (!target) {
    // Fallback: center
    tooltip.style.left = '50%';
    tooltip.style.top = '50%';
    tooltip.style.transform = 'translate(-50%, -50%)';
    ARROW_CLASSES.forEach(c => tooltip.classList.remove(c));
  } else {
    tooltip.style.transform = '';
    positionTooltip(tooltip, target, s.placement);
  }
}

/* ── Step transitions ─────────────────────────────────── */
function setStep(i, dir = 'next') {
  const tooltip = document.getElementById('tour-tooltip');
  if (!tooltip) return;

  // 1. Slide + fade out in direction of travel
  tooltip.dataset.dir = dir === 'next' ? 'out-left' : 'out-right';
  tooltip.classList.remove('tour-visible');

  if (transitionTimer) clearTimeout(transitionTimer);
  transitionTimer = setTimeout(() => {
    step = i;

    // 2. Update content + reposition while invisible
    // Set enter direction (opposite of exit)
    tooltip.dataset.dir = dir === 'next' ? 'in-right' : 'in-left';
    renderStep(i);

    // 3. One frame for reflow, then slide in + fade in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        tooltip.dataset.dir = '';
        tooltip.classList.add('tour-visible');
        tooltip.focus();
      });
    });
  }, 200);
}

/* ── Navigation ───────────────────────────────────────── */
function goNext() {
  if (step >= N - 1) {
    endTour();
  } else {
    setStep(step + 1, 'next');
  }
}

function goPrev() {
  if (step > 0) setStep(step - 1, 'prev');
}

function onKeyDown(e) {
  // Trap Tab / Shift+Tab inside the tooltip while the tour is open.
  if (e.key === 'Tab') {
    const tip = document.getElementById('tour-tooltip');
    if (!tip) return;
    const focusables = [...tip.querySelectorAll('button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')]
      .filter(el => el.offsetParent !== null || el === document.activeElement);
    if (!focusables.length) { e.preventDefault(); tip.focus(); return; }
    const first = focusables[0], last = focusables[focusables.length - 1];
    const active = document.activeElement;
    if (!tip.contains(active)) { e.preventDefault(); (e.shiftKey ? last : first).focus(); }
    else if (e.shiftKey && (active === first || active === tip)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
    return;
  }
  if (e.key === 'Escape') endTour();
  if (e.key === 'ArrowRight') goNext();
  if (e.key === 'ArrowLeft') goPrev();
}

/* ── Tour lifecycle ───────────────────────────────────── */
function endTour() {
  if (!running) return;
  running = false;
  if (transitionTimer) clearTimeout(transitionTimer);
  destroyTourDOM();
  const fo = document.getElementById('focus-overlay');
  if (fo && fo.dataset.tourHide === '1') {
    delete fo.dataset.tourHide;
    fo.classList.remove('hidden');
  }
  if (storageRef) storageRef.setTourSeen();
  // Return focus to the typing area (keyboard users otherwise land on <body>
  // after the tooltip is removed).
  const ta = document.getElementById('typing-area');
  if (ta) ta.focus();
}

function isMobileGateShown() {
  const g = document.getElementById('mobile-gate');
  return !!g && getComputedStyle(g).display !== 'none';
}

function startTour() {
  if (running) return;

  // Close any open modals before starting the tour
  document.querySelectorAll('.modal-overlay.visible').forEach(m => m.classList.remove('visible'));

  // Ensure practice tab is active before starting tour so all tour targets are visible
  const activeTabBtn = document.querySelector('.tab-btn.active');
  if (!activeTabBtn || activeTabBtn.dataset.tab !== 'practice') {
    const practiceBtn = document.querySelector('[data-tab="practice"]');
    if (practiceBtn) practiceBtn.click();
  }

  // Suppress focus-overlay during tour — override handleBlur by patching the element
  const focusOverlay = document.getElementById('focus-overlay');
  if (focusOverlay) {
    focusOverlay.classList.add('hidden');
    focusOverlay.dataset.tourHide = '1'; // marker so handleBlur skips it
  }

  running = true;
  step = 0;

  buildTourDOM();

  const tooltip = document.getElementById('tour-tooltip');

  // First step: render immediately, then fade in on next frame
  renderStep(0);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      tooltip.classList.add('tour-visible');
      tooltip.focus();
    });
  });
}

/* ── Public API ───────────────────────────────────────── */
export function initTour(storage) {
  storageRef = storage;

  const btn = document.getElementById('btn-tour');
  if (btn) btn.addEventListener('click', startTour);

  window.startTour = startTour;

  if (!storage.getTourSeen()) {
    // Don't auto-start behind the mobile gate (it covers the whole viewport).
    setTimeout(() => { if (!isMobileGateShown()) startTour(); }, 900);
  }
}
