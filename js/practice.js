/**
 * practice.js — Main controller for பைந்தமிழ்
 */

import { storage }                                   from './storage.js';
import { MAPPING, tamilOf, hintLabel, needsShift }   from './mapping.js';
import { LESSONS_DB, ALL_LESSONS, getLessonById,
         getNextLesson, getPrevLesson, getLessonIndex,
         getFirstIncomplete }                         from './lessons.js';
import { loadKeyboard, showHint, flashCorrect,
         flashWrong, clearHints, setVisible,
         getContainer }                               from './keyboard.js';
import { setGuideMode, shouldAutoShow, markShown,
         FINGER_INFO, FINGER_MAP }                    from './fingerGuide.js';

/* ══════════════════════════════════════════════════
   STATE
══════════════════════════════════════════════════ */
const S = {
  lesson: null, content: [], pointer: 0,
  totalKeys: 0, correctKeys: 0,
  hadErrorHere: false, startTime: null, elapsed: 0,
  timerInt: null, hintTimeout: null,
  finished: false, focused: false,
};

const HINT_DELAY_MS = 2000; // time before keyboard lights up

/* ══════════════════════════════════════════════════
   DOM HELPERS
══════════════════════════════════════════════════ */
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

function showModal(id)  { $(id).classList.add('visible'); }
function hideModal(id)  { $(id).classList.remove('visible'); }

/* ══════════════════════════════════════════════════
   HINT SYSTEM  (bar always visible, keyboard delayed)
══════════════════════════════════════════════════ */
function scheduleHint() {
  clearTimeout(S.hintTimeout);
  clearHints();
  if (S.pointer >= S.content.length) return;
  S.hintTimeout = setTimeout(() => {
    showHint(S.content[S.pointer]);
  }, HINT_DELAY_MS);
}

function cancelHint() {
  clearTimeout(S.hintTimeout);
  clearHints();
}

function showImmediateHint(key) {
  clearTimeout(S.hintTimeout);
  showHint(key);
}

/* ══════════════════════════════════════════════════
   LESSON START
══════════════════════════════════════════════════ */
function startLesson(lesson) {
  clearInterval(S.timerInt);
  cancelHint();

  Object.assign(S, {
    lesson, content: lesson.content,
    pointer: 0, totalKeys: 0, correctKeys: 0,
    hadErrorHere: false, startTime: null, elapsed: 0,
    finished: false, focused: false,
  });

  const idx = getLessonIndex(lesson.id);
  $('lesson-title-bar').textContent = lesson.title;
  $('lesson-label').textContent     = lesson.title;
  $('lesson-counter').textContent   = `${idx + 1} / ${ALL_LESSONS.length}`;

  // prev/next buttons
  $('btn-prev-lesson').disabled = !getPrevLesson(lesson.id);
  $('btn-next-lesson-nav').disabled = !getNextLesson(lesson.id);

  renderChars();
  resetStats();

  const s = storage.getSettings();
  setVisible(s.showKeyboard);
  $('key-guide').classList.toggle('hint-hidden', !s.showHints);

  storage.saveProgress({ lastLessonId: lesson.id });

  setTimeout(() => { $('typing-area').focus(); handleFocus(); }, 60);
}

function restartLesson() { if (S.lesson) startLesson(S.lesson); }

/* ══════════════════════════════════════════════════
   RENDER CHARS
══════════════════════════════════════════════════ */
function renderChars() {
  const box = $('lesson-container');
  box.innerHTML = '';
  S.content.forEach((key, i) => {
    const span = document.createElement('span');
    span.className   = 'char';
    span.dataset.idx = i;
    span.dataset.key = key;
    if (key === ' ') {
      span.classList.add('space-char');
      span.textContent = '·';       // ← middle dot for spaces
    } else {
      span.textContent = tamilOf(key);
    }
    if (i === 0) span.classList.add('current');
    box.appendChild(span);
  });
  updateHintBar();
}

/* ══════════════════════════════════════════════════
   KEYDOWN
══════════════════════════════════════════════════ */
function onKeyDown(e) {
  if (S.finished) return;
  if (e.key.length > 1 && e.key !== ' ') { e.preventDefault(); return; }
  e.preventDefault();

  const expected = S.content[S.pointer];
  const pressed  = e.key;

  if (!S.startTime) startTimer();
  S.totalKeys++;
  cancelHint();

  if (pressed === expected) handleCorrect();
  else                       handleWrong(pressed, expected);
  updateStats();
}

function handleCorrect() {
  const chars = $$('.char');
  const cur   = chars[S.pointer];
  if (cur) {
    cur.classList.remove('current','incorrect');
    cur.classList.add(S.hadErrorHere ? 'corrected' : 'correct', 'pop');
    setTimeout(() => cur.classList.remove('pop'), 220);
  }
  flashCorrect(S.content[S.pointer]);
  S.correctKeys++;
  S.hadErrorHere = false;
  S.pointer++;

  if (S.pointer >= S.content.length) { finishLesson(); return; }

  const next = chars[S.pointer];
  if (next) {
    next.classList.add('current');
    next.scrollIntoView({ behavior:'smooth', block:'nearest', inline:'center' });
  }
  updateHintBar();
  updateProgress();
  scheduleHint();
}

function handleWrong(pressed, expected) {
  S.hadErrorHere = true;
  const cur = $$('.char')[S.pointer];
  if (cur) {
    cur.classList.add('incorrect','shake');
    setTimeout(() => cur.classList.remove('shake'), 320);
  }
  flashWrong(pressed, expected);
  // Immediately show hint on wrong press
  showImmediateHint(expected);
}

/* ══════════════════════════════════════════════════
   STATS
══════════════════════════════════════════════════ */
function startTimer() {
  S.startTime = Date.now();
  S.timerInt  = setInterval(() => {
    S.elapsed = (Date.now() - S.startTime) / 1000;
    $('stat-time').textContent = fmtTime(S.elapsed);
    $('stat-wpm').textContent  = calcWPM();
  }, 500);
}

function calcWPM() {
  if (!S.startTime) return '—';
  const mins = (Date.now() - S.startTime) / 60000;
  if (mins < 0.01) return '—';
  return Math.round((S.correctKeys / 5) / mins);
}

function calcAccuracy() {
  return S.totalKeys ? Math.round((S.correctKeys / S.totalKeys) * 100) : 100;
}

function fmtTime(s) {
  return `${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,'0')}`;
}

function updateStats() {
  $('stat-wpm').textContent      = calcWPM();
  $('stat-accuracy').textContent = calcAccuracy() + '%';
  updateProgress();
}

function resetStats() {
  $('stat-wpm').textContent      = '—';
  $('stat-accuracy').textContent = '100%';
  $('stat-time').textContent     = '0:00';
  $('progress-fill').style.width = '0%';
  $('progress-text').textContent = `0 / ${S.content.length}`;
}

function updateProgress() {
  const pct = Math.round((S.pointer / S.content.length) * 100);
  $('progress-fill').style.width   = pct + '%';
  $('progress-text').textContent   = `${S.pointer} / ${S.content.length}`;
}

/* ══════════════════════════════════════════════════
   HINT BAR
══════════════════════════════════════════════════ */
function updateHintBar() {
  if (!storage.getSettings().showHints) return;
  if (S.pointer >= S.content.length) return;
  const key = S.content[S.pointer];
  $('hint-key').textContent  = hintLabel(key);
  $('hint-char').textContent = key === ' ' ? '·' : tamilOf(key);
}

/* ══════════════════════════════════════════════════
   FOCUS/BLUR
══════════════════════════════════════════════════ */
function handleFocus() {
  S.focused = true;
  $('focus-overlay').classList.add('hidden');
  updateHintBar();
  scheduleHint();
}
function handleBlur() {
  S.focused = false;
  $('focus-overlay').classList.remove('hidden');
  cancelHint();
}

/* ══════════════════════════════════════════════════
   FINISH
══════════════════════════════════════════════════ */
function finishLesson() {
  S.finished = true;
  clearInterval(S.timerInt);
  cancelHint();

  const wpm      = +calcWPM() || 0;
  const accuracy = calcAccuracy();
  const timeSec  = S.startTime ? Math.round((Date.now()-S.startTime)/1000) : 0;
  const stars    = wpm >= S.lesson.targetWPM*1.2 ? 3 : wpm >= S.lesson.targetWPM ? 2 : wpm >= S.lesson.targetWPM*0.6 ? 1 : 0;

  storage.recordResult(S.lesson.id, wpm, accuracy, S.totalKeys, S.correctKeys);

  $('results-wpm').textContent      = wpm;
  $('results-accuracy').textContent = accuracy + '%';
  $('results-time').textContent     = fmtTime(timeSec);
  $('results-stars').textContent    = '★'.repeat(stars)+'☆'.repeat(3-stars);
  $('result-msg').textContent       =
    stars>=3?'நன்று! Excellent!':stars>=2?'நல்லது! Well done!':stars>=1?'தொடர்க! Keep going!':'மீண்டும் முயற்சி!';

  const next = getNextLesson(S.lesson.id);
  const $nxt = $('btn-next-lesson');
  if (next) {
    $nxt.textContent   = `${next.title} →`;
    $nxt.style.display = '';
    $nxt.onclick = ()=>{ hideModal('modal-results'); startLesson(next); };
  } else {
    $nxt.style.display = 'none';
  }

  setTimeout(()=>showModal('modal-results'), 350);
}

/* ══════════════════════════════════════════════════
   LESSONS MODAL
══════════════════════════════════════════════════ */
let activeLevelTab = 'beginner';

function openLessonsModal() {
  renderLessonList(activeLevelTab);
  showModal('modal-lessons');
}

function renderLessonList(level) {
  const listEl   = $('lesson-list');
  const progress = storage.getProgress();
  const lessons  = LESSONS_DB[level];

  listEl.innerHTML = '';
  lessons.forEach((lesson, idx) => {
    const done   = progress.completedLessons.includes(lesson.id);
    const best   = progress.lessonBests[lesson.id];
    const locked = idx > 0 && !progress.completedLessons.includes(lessons[idx-1].id);
    const isCur  = S.lesson?.id === lesson.id;

    const focusChars = lesson.focusKeys
      .filter(k => k !== 'f' && k !== ' ')
      .slice(0, 7)
      .map(k => MAPPING[k] ?? (k.length===1?k:''))
      .filter(Boolean)
      .join(' ');

    const row = document.createElement('button');
    row.className = `lesson-row${isCur?' is-current':''}${locked?' locked':''}`;
    row.dataset.id = lesson.id;

    row.innerHTML = `
      <span class="row-num">${String(lesson.order).padStart(2,'0')}</span>
      <span class="row-chars">${focusChars || lesson.title}</span>
      <span class="row-right">
        ${isCur ? '<span class="row-dot"></span>' : ''}
        ${done && best ? `<span class="row-wpm">${best.wpm} wpm</span><span class="row-done">✓</span>` : ''}
        ${!done && !locked ? '' : ''}
        ${locked ? '<span style="opacity:.4">🔒</span>' : ''}
      </span>
    `;

    if (!locked) {
      row.addEventListener('click', () => {
        hideModal('modal-lessons');
        startLesson(lesson);
      });
    }
    listEl.appendChild(row);
  });
}

/* ══════════════════════════════════════════════════
   FINGER GUIDE MODAL
══════════════════════════════════════════════════ */
function openFingerGuide() {
  // populate legend if not yet done
  buildFingerLegend();
  const kb = getContainer();
  setGuideMode(kb, true);
  showModal('modal-finger');
  markShown();
}

function closeFingerGuide() {
  const kb = getContainer();
  setGuideMode(kb, false);
  hideModal('modal-finger');
}

function buildFingerLegend() {
  // Mirror the keyboard SVG into the finger guide modal with guide-mode
  const kbWrap = $('finger-kb-wrap');
  if (!kbWrap.children.length) {
    const kbSrc = getContainer();
    if (kbSrc) {
      const clone = kbSrc.cloneNode(true);
      clone.removeAttribute('id');
      clone.classList.add('guide-mode');
      clone.style.display = '';
      kbWrap.appendChild(clone);
    }
  }

  const legend = $('finger-legend');
  if (legend.children.length) return; // already built

  const left  = ['lp','lr','lm','li'];
  const right = ['ri','rm','rr','rp'];

  const mkSide = (fingers, title) => {
    const wrap = document.createElement('div');
    wrap.className = 'fg-side';
    const hdr = document.createElement('div');
    hdr.className = 'fg-side-title';
    hdr.textContent = title;
    wrap.appendChild(hdr);
    fingers.forEach(f => {
      const info = FINGER_INFO[f];
      const row  = document.createElement('div');
      row.className = 'fg-row';
      row.innerHTML = `
        <span class="fg-swatch" style="background:${info.css}"></span>
        <span class="fg-label">${info.label}</span>
        <span class="fg-chars">${info.tamil}</span>
      `;
      wrap.appendChild(row);
    });
    return wrap;
  };

  const thumbRow = document.createElement('div');
  thumbRow.className = 'fg-thumb';
  thumbRow.innerHTML = `<span class="fg-swatch" style="background:${FINGER_INFO.th.css}"></span><span>Thumbs — Space</span>`;

  legend.appendChild(mkSide(left,  'Left Hand'));
  legend.appendChild(mkSide(right, 'Right Hand'));

  const thumbWrap = document.createElement('div');
  thumbWrap.className = 'fg-thumb-row';
  thumbWrap.appendChild(thumbRow);
  legend.appendChild(thumbWrap);
}

/* ══════════════════════════════════════════════════
   SETTINGS
══════════════════════════════════════════════════ */
function openSettings() {
  syncSettingsUI();
  renderStorageInfo();
  showModal('modal-settings');
}

function syncSettingsUI() {
  const s = storage.getSettings();
  $$('[data-theme-pill]').forEach(b => b.classList.toggle('active', b.dataset.themePill===s.theme));
  $$('[data-font-pill]').forEach(b =>  b.classList.toggle('active', b.dataset.fontPill===s.fontSize));
  $('setting-keyboard').checked = s.showKeyboard;
  $('setting-hints').checked    = s.showHints;
  $('setting-sound').checked    = s.soundEnabled;
}

function renderStorageInfo() {
  const info = storage.getStorageInfo();
  const list = $('storage-list');
  list.innerHTML = info.entries.map(e =>
    `<li><span>${e.label}</span><strong>${e.value}</strong></li>`
  ).join('');
  $('storage-bytes').textContent = info.bytes;
  $('storage-note').textContent  = info.shared;
}

function applySettings() {
  const s = storage.getSettings();
  document.documentElement.setAttribute('data-theme', s.theme);
  const sizes = { sm:'1.3rem', md:'1.6rem', lg:'1.85rem', xl:'2.3rem' };
  document.documentElement.style.setProperty('--char-size', sizes[s.fontSize]||'1.85rem');
  setVisible(s.showKeyboard);
  $('key-guide').classList.toggle('hint-hidden', !s.showHints);
}

function updateThemeIcon() {
  const dark = storage.getSettings().theme === 'dark';
  $('icon-sun').style.display  = dark  ? 'block' : 'none';
  $('icon-moon').style.display = !dark ? 'block' : 'none';
}

/* ══════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════ */
async function init() {
  await loadKeyboard('keyboard');
  applySettings();
  updateThemeIcon();

  // Start the right lesson
  const p    = storage.getProgress();
  const startL = p.lastLessonId
    ? (getLessonById(p.lastLessonId) ?? getFirstIncomplete(p.completedLessons))
    : getFirstIncomplete(p.completedLessons);
  startLesson(startL);

  // Auto-show finger guide on first visit
  if (shouldAutoShow()) {
    setTimeout(() => openFingerGuide(), 800);
  }

  /* ── Navbar ──────────────────────────── */
  $('btn-lessons').addEventListener('click', openLessonsModal);
  $('btn-finger').addEventListener('click', openFingerGuide);
  $('btn-settings-open').addEventListener('click', openSettings);
  $('btn-theme').addEventListener('click', () => {
    const cur = storage.getSettings().theme;
    storage.saveSettings({ theme: cur==='dark'?'light':'dark' });
    applySettings(); updateThemeIcon(); syncSettingsUI();
  });
  $('logo').addEventListener('click', openLessonsModal);

  /* ── Practice nav ────────────────────── */
  $('btn-restart').addEventListener('click', restartLesson);
  $('btn-prev-lesson').addEventListener('click', () => {
    const prev = getPrevLesson(S.lesson?.id);
    if (prev) startLesson(prev);
  });
  $('btn-next-lesson-nav').addEventListener('click', () => {
    const next = getNextLesson(S.lesson?.id);
    if (next) startLesson(next);
  });

  /* ── Typing area ─────────────────────── */
  $('typing-area').addEventListener('keydown', onKeyDown);
  $('typing-area').addEventListener('focus',   handleFocus);
  $('typing-area').addEventListener('blur',    handleBlur);
  $('focus-overlay').addEventListener('click', () => $('typing-area').focus());

  /* ── Lessons modal ───────────────────── */
  $('btn-close-lessons').addEventListener('click', ()=>hideModal('modal-lessons'));
  $('modal-lessons').addEventListener('click', e=>{
    if(e.target===$('modal-lessons')) hideModal('modal-lessons');
  });
  $$('.lvl-tab').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      activeLevelTab = btn.dataset.level;
      $$('.lvl-tab').forEach(b=>b.classList.toggle('active',b===btn));
      renderLessonList(activeLevelTab);
    });
  });

  /* ── Finger guide modal ──────────────── */
  $('btn-close-finger').addEventListener('click', closeFingerGuide);
  $('modal-finger').addEventListener('click', e=>{
    if(e.target===$('modal-finger')) closeFingerGuide();
  });

  /* ── Results modal ───────────────────── */
  $('btn-retry').addEventListener('click',()=>{hideModal('modal-results');restartLesson();});
  $('btn-back-lessons').addEventListener('click',()=>{hideModal('modal-results');openLessonsModal();});
  $('modal-results').addEventListener('click',e=>{
    if(e.target===$('modal-results')) hideModal('modal-results');
  });

  /* ── Settings modal ──────────────────── */
  $('btn-close-settings').addEventListener('click',()=>hideModal('modal-settings'));
  $('modal-settings').addEventListener('click',e=>{
    if(e.target===$('modal-settings')) hideModal('modal-settings');
  });
  $$('[data-theme-pill]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      storage.saveSettings({theme:btn.dataset.themePill});
      applySettings(); updateThemeIcon(); syncSettingsUI();
    });
  });
  $$('[data-font-pill]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      storage.saveSettings({fontSize:btn.dataset.fontPill});
      applySettings(); syncSettingsUI();
    });
  });
  $('setting-keyboard').addEventListener('change',e=>{
    storage.saveSettings({showKeyboard:e.target.checked}); applySettings();
  });
  $('setting-hints').addEventListener('change',e=>{
    storage.saveSettings({showHints:e.target.checked}); applySettings();
    if(e.target.checked) updateHintBar();
  });
  $('setting-sound').addEventListener('change',e=>{
    storage.saveSettings({soundEnabled:e.target.checked});
  });
  $('btn-clear-data').addEventListener('click',()=>{
    if(confirm('Delete all practice data? This cannot be undone.')) {
      storage.clearAll(); location.reload();
    }
  });
}

document.addEventListener('DOMContentLoaded', init);