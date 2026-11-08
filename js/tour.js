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
const STEPS = [
  {
    targetSelector: '#typing-area',
    titleTamil: 'எழுதும் பகுதி',
    titleEn: 'Typing Area',
    bodyTamil: 'இங்கே காட்டப்படும் தமிழ் எழுத்துகளை தட்டச்சு செய்யுங்கள். நடப்பு இலக்கு ஒரு கோடு கர்சருடன் தெளிவாகத் தெரியும்.',
    body: 'Type the Tamil syllables shown here. Your current target glows with an underline cursor. Get it right to advance.',
    placement: 'bottom',
  },
  {
    targetSelector: '#key-guide',
    titleTamil: 'விசை வழிகாட்டி',
    titleEn: 'Key Hint Bar',
    bodyTamil: 'அடுத்து எந்த விசையை அழுத்த வேண்டும் என்று காட்டுகிறது. இரண்டு விசை எழுத்துகளுக்கு — க + ா = கா — இரண்டும் காட்டப்படும்.',
    body: 'Shows exactly which key(s) to press. For two-key syllables like க + ா = கா, both keys are shown in order.',
    placement: 'top',
  },
  {
    targetSelector: '#stats-strip',
    titleTamil: 'நேரடி புள்ளிவிவரம்',
    titleEn: 'Live Stats',
    bodyTamil: 'உங்கள் வேகம் (WPM), துல்லியம், மற்றும் தினசரி இலக்கை நேரடியாக கண்காணியுங்கள். 30 நிமிட தினசரி இலக்கை நிறைவேற்றுங்கள்.',
    body: 'Watch your WPM, accuracy, and daily goal in real time. The small bar fills as you hit your 30-minute daily target.',
    placement: 'bottom',
  },
  {
    targetSelector: '#key-panel',
    titleTamil: 'விசை துல்லிய பலகை',
    titleEn: 'Key Accuracy Panel',
    bodyTamil: 'தட்டச்சு செய்த ஒவ்வொரு விசைக்கும் ஒரு வண்ண பட்டை காட்டப்படும். பச்சை = சரியானது, அம்பர் = மேலும் பயிற்சி தேவை.',
    body: "Each key you've typed shows a colour bar. Green = accurate, amber = needs work. Review this after each lesson.",
    placement: 'left',
  },
  {
    targetSelector: '#btn-lessons',
    titleTamil: 'பாடங்கள்',
    titleEn: 'Lessons',
    bodyTamil: '35 பாடங்களில் இருந்து தேர்வு செய்யுங்கள் — உயிர், மெய், உயிர்மெய், சொற்கள், மற்றும் திருக்குறள் வரிகள்.',
    body: 'Choose from 35 lessons — uyir (vowels), mei (consonants), uyirmei (combined), words, and Thirukkural verses.',
    placement: 'bottom',
  },
  {
    targetSelector: '#btn-finger',
    titleTamil: 'விரல் வழிகாட்டி',
    titleEn: 'Finger Guide',
    bodyTamil: 'எந்த விரல் எந்த விசையை அழுத்த வேண்டும் என்று வண்ண குறியீட்டு விசைப்பலகையில் காட்டுகிறது. சரியான தசை நினைவகம் வளர்க்க உதவும்.',
    body: 'Shows a colour-coded keyboard with finger assignments. Great for building correct muscle memory from the start.',
    placement: 'bottom',
  },
  {
    targetSelector: '#btn-theme-picker',
    titleTamil: 'வண்ணமை',
    titleEn: 'Themes',
    bodyTamil: '16 தீம்களில் இருந்து தேர்வு செய்யுங்கள் — குறிஞ்சி, நெய்தல், முல்லை, பாலை, விடியல் உள்ளிட்ட 5 தமிழ் சங்க கால வண்ணத்தொகுப்புகள்.',
    body: 'Pick from 16 themes — including 5 Tamil Sangam-inspired palettes: குறிஞ்சி, நெய்தல், முல்லை, பாலை, விடியல்.',
    placement: 'bottom',
  },
  {
    targetSelector: '#btn-info',
    titleTamil: 'அமைவுகள்',
    titleEn: 'Settings',
    bodyTamil: 'தட்டச்சு விருப்பங்கள், விசை அமைப்பு மற்றும் பிற முன்னுரிமைகளை இங்கே அமைக்கலாம்.',
    body: 'Configure typing options, key layout, and other preferences here.',
    placement: 'bottom',
  },
  {
    targetSelector: '.hints-label',
    titleTamil: 'குறிப்பு மாற்றி',
    titleEn: 'Hints Toggle',
    bodyTamil: 'விசை வழிகாட்டியை இயக்கவும் அல்லது நிறுத்தவும். நன்கு பயிற்சி பெற்ற பிறகு குறிப்பை அணைத்து நினைவிலிருந்து தட்டச்சு செய்யுங்கள்.',
    body: "Toggle the hint bar on or off. Turn hints off once you're comfortable to practice from memory.",
    placement: 'bottom',
  },
  {
    targetSelector: '#btn-view',
    titleTamil: 'காட்சி பயன்முறை',
    titleEn: 'View Mode',
    bodyTamil: 'Compact, Large, Zen — மூன்று காட்சி பயன்முறைகள். Compact ஆனது விசைப்பலகையுடன் சிறிய எழுத்தளவு காட்டும். Zen ஆனது திசைதிருப்பல்களை மறைத்து தட்டச்சுக்கு மட்டும் கவனம் செலுத்த உதவும்.',
    body: 'Switch between Compact (keyboard visible), Large (bigger text), and Zen (distraction-free) layouts. Click the button to cycle through.',
    placement: 'bottom',
  },
  {
    targetSelector: '.tab-btn[data-tab="kural"]',
    titleTamil: 'திருக்குறள்',
    titleEn: 'Thirukkural Mode',
    bodyTamil: 'திருக்குறளை தட்டச்சு செய்து வேகத்தையும் துல்லியத்தையும் மேம்படுத்துங்கள். 1330 குறள்களில் யாதாவதொன்றை தேர்ந்தெடுக்கலாம்.',
    body: 'Type Thirukkural verses to improve speed and accuracy. Choose any of the 1330 verses or go random.',
    placement: 'bottom',
  },
  {
    targetSelector: '.tab-btn[data-tab="report"]',
    titleTamil: 'அறிக்கை',
    titleEn: 'Progress Report',
    bodyTamil: 'உங்கள் முன்னேற்றத்தை ஒரே பக்கத்தில் பாருங்கள். WPM, துல்லியம், முடிந்த பாடங்கள், விசை துல்லியம் — அனைத்தும் PDF ஆக பதிவிறக்கலாம்.',
    body: 'See your full progress in one place — WPM, accuracy, completed lessons, key accuracy. Download as PDF.',
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
