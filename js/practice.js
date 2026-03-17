/**
 * practice.js — keybr-style Tamil typing practice
 */

import { storage }                                   from './storage.js';
import { MAPPING, tamilOf, hintLabel, needsShift }   from './mapping.js';
import { LESSONS_DB, ALL_LESSONS, getLessonById,
         getNextLesson, getPrevLesson, getLessonIndex,
         getFirstIncomplete }                         from './lessons.js';
import { loadKeyboard, showHint, flashCorrect,
         flashWrong, clearHints, setVisible, getContainer } from './keyboard.js';
import { setGuideMode, shouldAutoShow, markShown,
         FINGER_INFO }                                from './fingerGuide.js';
import { resetSession, recordKeypress, sessionWpm,
         sessionAccuracy, sessionScore,
         initTopBar, renderTopBar, renderKeyPanel }   from './metrics.js';

/* ═══════════════ STATE ═══════════════════════════ */
const S = {
  lesson: null, content: [], pointer: 0,
  totalKeys: 0, correctKeys: 0, hadErrorHere: false,
  startTime: null, timerInt: null, hintTimeout: null,
  metricsInt: null, finished: false,
};
const HINT_DELAY = 2000;

/* ═══════════════ WPM (real calculation) ══════════
   WPM = (correct chars / 5) / elapsed minutes.
   Called AFTER handleCorrect updates S.correctKeys.  */
function calcCurrentWpm() {
  if (!S.startTime || S.correctKeys < 3) return 0;
  const mins = (Date.now() - S.startTime) / 60000;
  if (mins < 0.08) return 0;
  return Math.round((S.correctKeys / 5) / mins);
}

/* ═══════════════ DOM ═════════════════════════════ */
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);
const showModal = id => $(id).classList.add('visible');
const hideModal = id => $(id).classList.remove('visible');

/* ═══════════════ VIEW CYCLE ══════════════════════
   0 = keyboard + hints + normal size
   1 = no keyboard, larger text
   2 = zen: no keyboard, no hints, max text
*/
const CHAR_SIZES = ['1.85rem', '2.4rem', '3.2rem'];
const VIEW_ICONS = [
  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="13" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="12.01"/><line x1="8" y1="12" x2="8" y2="12.01"/><line x1="16" y1="12" x2="16" y2="12.01"/><line x1="10" y1="16" x2="14" y2="16"/></svg>`,
  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>`,
  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`,
];

function applyViewMode(mode) {
  document.documentElement.style.setProperty('--char-size', CHAR_SIZES[mode]);
  const s = storage.getSettings();
  const showKb     = mode === 0;
  const showHints2 = mode < 2 && s.showHints;
  const showKpanel = mode < 2;

  setVisible(showKb);
  $('key-guide').classList.toggle('hint-hidden', !showHints2);
  $('key-panel').classList.toggle('hidden', !showKpanel);

  $('btn-view').innerHTML = VIEW_ICONS[mode];
  $('btn-view').title = ['Hide keyboard (click)', 'Larger text (click)', 'Zen mode (click to reset)'][mode];

  // data-view on practice-main drives CSS height/centering rules
  $('practice-main').dataset.view = mode;
}

function cycleView() {
  const s    = storage.getSettings();
  const next = (s.viewMode + 1) % 3;
  storage.saveSettings({ viewMode: next });
  applyViewMode(next);
}

/* ═══════════════ HINT ════════════════════════════ */
function scheduleHint() {
  clearTimeout(S.hintTimeout);
  clearHints();
  if (S.pointer >= S.content.length) return;
  S.hintTimeout = setTimeout(() => showHint(S.content[S.pointer]), HINT_DELAY);
}
function cancelHint()      { clearTimeout(S.hintTimeout); clearHints(); }
function immediateHint(k)  { clearTimeout(S.hintTimeout); showHint(k); }

/* ═══════════════ LESSON START ════════════════════ */
function startLesson(lesson) {
  clearInterval(S.timerInt);
  clearInterval(S.metricsInt);
  cancelHint();
  resetSession();

  Object.assign(S, {
    lesson, content: lesson.content,
    pointer: 0, totalKeys: 0, correctKeys: 0,
    hadErrorHere: false, startTime: null, finished: false,
  });

  const idx = getLessonIndex(lesson.id);
  $('lesson-title-bar').textContent    = lesson.title;
  $('lesson-label').textContent        = lesson.title;
  $('lesson-counter').textContent      = `${idx + 1} / ${ALL_LESSONS.length}`;
  $('btn-prev-lesson').disabled        = !getPrevLesson(lesson.id);
  $('btn-next-lesson-nav').disabled    = !getNextLesson(lesson.id);

  renderChars();
  resetStats();
  applyViewMode(storage.getSettings().viewMode);
  storage.saveProgress({ lastLessonId: lesson.id });
  renderTopBar();
  renderKeyPanel($('key-panel'), S.content[0] ?? '', lesson.focusKeys ?? []);

  setTimeout(() => { $('typing-area').focus(); handleFocus(); }, 60);
}

function restartLesson() { if (S.lesson) startLesson(S.lesson); }

function refreshMetrics() {
  renderTopBar();
  renderKeyPanel($('key-panel'), S.content[S.pointer] ?? '', S.lesson?.focusKeys ?? []);
}

/* ═══════════════ RENDER CHARS ════════════════════ */
function renderChars() {
  const box = $('lesson-container');
  box.innerHTML = '';
  S.content.forEach((key, i) => {
    const span = document.createElement('span');
    span.className   = 'char';
    span.dataset.idx = i;
    span.dataset.key = key;
    span.textContent = key === ' ' ? '·' : tamilOf(key);
    if (key === ' ') span.classList.add('space-char');
    if (i === 0) span.classList.add('current');
    box.appendChild(span);
  });
  resetScroll();
  updateHintBar();
}

/* ── Windowed scroll ──────────────────────────── */
let currentLineY = -1;

function scrollToChar(idx) {
  const area  = $('typing-area');
  const chars = $('lesson-container').children;
  if (!chars[idx]) return;

  const charY = chars[idx].offsetTop;

  if (currentLineY < 0) {
    currentLineY = charY;
    area.scrollTop = 0;
    return;
  }

  if (charY > currentLineY) {
    const rowH = charY - currentLineY;
    currentLineY = charY;
    area.scrollTop = Math.max(0, area.scrollTop + rowH);
  }
}

function resetScroll() {
  currentLineY = -1;
  $('typing-area').scrollTop = 0;
}

/* ═══════════════ KEYDOWN ═════════════════════════ */
function onKeyDown(e) {
  if (S.finished) return;
  if (e.key.length > 1 && e.key !== ' ') { e.preventDefault(); return; }
  e.preventDefault();

  const expected = S.content[S.pointer];
  const pressed  = e.key;
  if (!S.startTime) startTimer();
  S.totalKeys++;
  cancelHint();

  const correct = pressed === expected;

  // Handle correct/wrong FIRST so S.correctKeys is up to date
  if (correct) handleCorrect();
  else         handleWrong(pressed, expected);

  // WPM calculated from actual elapsed time — no circular dependency
  const wpm = calcCurrentWpm();
  recordKeypress(expected, correct, wpm);
  updateStats();
}

function handleCorrect() {
  const chars = Array.from($('lesson-container').children);
  const cur   = chars[S.pointer];
  if (cur) {
    cur.classList.remove('current', 'incorrect');
    cur.classList.add(S.hadErrorHere ? 'corrected' : 'correct', 'pop');
    setTimeout(() => cur.classList.remove('pop'), 220);
  }
  flashCorrect(S.content[S.pointer]);
  S.correctKeys++;
  S.hadErrorHere = false;
  S.pointer++;

  if (S.pointer >= S.content.length) { finishLesson(); return; }

  const next = chars[S.pointer];
  if (next) next.classList.add('current');

  scrollToChar(S.pointer);
  updateHintBar();
  updateProgress();
  scheduleHint();
}

function handleWrong(pressed, expected) {
  S.hadErrorHere = true;
  const cur = Array.from($('lesson-container').children)[S.pointer];
  if (cur) {
    cur.classList.add('incorrect', 'shake');
    setTimeout(() => cur.classList.remove('shake'), 300);
  }
  flashWrong(pressed, expected);
  immediateHint(expected);
}

/* ═══════════════ STATS ═══════════════════════════ */
function startTimer() {
  S.startTime = Date.now();
  S.timerInt  = setInterval(() => {
    $('stat-time').textContent = fmtTime((Date.now() - S.startTime) / 1000);
    renderTopBar();
  }, 1000);
  S.metricsInt = setInterval(() => {
    renderKeyPanel($('key-panel'), S.content[S.pointer] ?? '', S.lesson?.focusKeys ?? []);
    storage.addDailySeconds(3);
  }, 3000);
}

const fmtTime = s => `${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,'0')}`;

function updateStats() {
  updateProgress();
  renderTopBar();
}

function resetStats() {
  $('stat-time').textContent     = '0:00';
  $('progress-fill').style.width = '0%';
  $('progress-text').textContent = `0 / ${S.content.length}`;
  renderTopBar();
}

function updateProgress() {
  const pct = Math.round((S.pointer / S.content.length) * 100);
  $('progress-fill').style.width   = pct + '%';
  $('progress-text').textContent   = `${S.pointer} / ${S.content.length}`;
}

/* ═══════════════ HINT BAR ════════════════════════ */
function updateHintBar() {
  if (S.pointer >= S.content.length) return;
  const key = S.content[S.pointer];
  $('hint-key').textContent  = hintLabel(key);
  $('hint-char').textContent = key === ' ' ? '·' : tamilOf(key);
  $('hint-shift-wrap').style.display = needsShift(key) ? 'inline-flex' : 'none';
}

/* ═══════════════ FOCUS/BLUR ══════════════════════ */
function handleFocus() {
  $('focus-overlay').classList.add('hidden');
  updateHintBar();
  scheduleHint();
}
function handleBlur() {
  $('focus-overlay').classList.remove('hidden');
  cancelHint();
}

/* ═══════════════ FINISH ══════════════════════════ */
function finishLesson() {
  S.finished = true;
  clearInterval(S.timerInt);
  clearInterval(S.metricsInt);
  cancelHint();

  const wpm      = calcCurrentWpm();
  const accuracy = sessionAccuracy();
  const timeSec  = S.startTime ? Math.round((Date.now() - S.startTime) / 1000) : 0;
  const stars    = wpm >= S.lesson.targetWPM * 1.2 ? 3
                 : wpm >= S.lesson.targetWPM        ? 2
                 : wpm >= S.lesson.targetWPM * 0.6  ? 1 : 0;

  storage.recordResult(S.lesson.id, wpm, accuracy, S.totalKeys, S.correctKeys);
  refreshMetrics();

  $('results-wpm').textContent      = wpm;
  $('results-accuracy').textContent = accuracy + '%';
  $('results-time').textContent     = fmtTime(timeSec);
  $('results-stars').textContent    = '★'.repeat(stars) + '☆'.repeat(3 - stars);
  $('result-msg').textContent       =
    stars >= 3 ? 'நன்று! Excellent!'  :
    stars >= 2 ? 'நல்லது! Well done!' :
    stars >= 1 ? 'தொடர்க! Keep going!' : 'மீண்டும் முயற்சி! Try again!';

  const next = getNextLesson(S.lesson.id);
  const $nxt = $('btn-next-lesson');
  if (next) {
    $nxt.textContent   = `${next.title} →`;
    $nxt.style.display = '';
    $nxt.onclick = () => { hideModal('modal-results'); startLesson(next); };
  } else {
    $nxt.style.display = 'none';
  }

  setTimeout(() => showModal('modal-results'), 380);
}

/* ═══════════════ LESSONS MODAL ═══════════════════ */
let activeLevelTab = 'beginner';

function openLessonsModal() { renderLessonList(activeLevelTab); showModal('modal-lessons'); }

function renderLessonList(level) {
  const listEl   = $('lesson-list');
  const progress = storage.getProgress();
  const lessons  = LESSONS_DB[level];
  listEl.innerHTML = '';

  lessons.forEach((lesson, idx) => {
    const done   = progress.completedLessons.includes(lesson.id);
    const best   = progress.lessonBests[lesson.id];
    const locked = idx > 0 && !progress.completedLessons.includes(lessons[idx - 1].id);
    const isCur  = S.lesson?.id === lesson.id;

    const focusChars = lesson.focusKeys
      .filter(k => k !== 'f' && k !== ' ')
      .slice(0, 7)
      .map(k => MAPPING[k] ?? (k.length === 1 ? k : ''))
      .filter(Boolean).join(' ');

    const row = document.createElement('button');
    row.className = `lesson-row${isCur ? ' is-current' : ''}${locked ? ' locked' : ''}`;
    row.innerHTML = `
      <span class="row-num">${String(lesson.order).padStart(2, '0')}</span>
      <span class="row-chars">${focusChars || lesson.title}</span>
      <span class="row-right">
        ${isCur ? '<span class="row-dot"></span>' : ''}
        ${done && best ? `<span class="row-wpm">${best.wpm}</span><span class="row-done">✓</span>` : ''}
        ${locked ? '<span style="opacity:.3">🔒</span>' : ''}
      </span>`;
    if (!locked) row.addEventListener('click', () => { hideModal('modal-lessons'); startLesson(lesson); });
    listEl.appendChild(row);
  });
}

/* ═══════════════ FINGER GUIDE ════════════════════ */
function openFingerGuide() {
  buildFingerLegend();
  setGuideMode(getContainer(), true);
  showModal('modal-finger');
  markShown();
}
function closeFingerGuide() { setGuideMode(getContainer(), false); hideModal('modal-finger'); }

function buildFingerLegend() {
  const kbWrap = $('finger-kb-wrap');
  if (!kbWrap.children.length) {
    const src = getContainer();
    if (src) {
      const clone = src.cloneNode(true);
      clone.removeAttribute('id');
      clone.classList.add('guide-mode');
      kbWrap.appendChild(clone);
    }
  }
  const legend = $('finger-legend');
  if (legend.children.length) return;
  ['lp','lr','lm','li'].forEach(f => legend.appendChild(mkFgRow(f)));
  ['ri','rm','rr','rp'].forEach(f => legend.appendChild(mkFgRow(f)));
  const thumb = document.createElement('div');
  thumb.className = 'fg-thumb-row';
  thumb.innerHTML = `<span class="fg-swatch" style="background:${FINGER_INFO.th.css}"></span><span>Thumbs — Space bar</span>`;
  legend.appendChild(thumb);
}

function mkFgRow(f) {
  const info = FINGER_INFO[f];
  const div  = document.createElement('div');
  div.className = 'fg-row';
  div.innerHTML = `<span class="fg-swatch" style="background:${info.css}"></span><span class="fg-label">${info.label}</span><span class="fg-chars">${info.tamil}</span>`;
  return div;
}

/* ═══════════════ INIT ════════════════════════════ */
async function init() {
  await loadKeyboard('keyboard');

  const s = storage.getSettings();
  initTopBar($('stats-strip'));
  document.documentElement.setAttribute('data-theme', s.theme);
  applyViewMode(s.viewMode);
  syncThemeIcon(s.theme);

  $('toggle-hints').checked = s.showHints;

  const p    = storage.getProgress();
  const startL = p.lastLessonId
    ? (getLessonById(p.lastLessonId) ?? getFirstIncomplete(p.completedLessons))
    : getFirstIncomplete(p.completedLessons);
  startLesson(startL);

  if (shouldAutoShow()) setTimeout(() => openFingerGuide(), 800);

  /* Navbar */
  $('btn-view').addEventListener('click', cycleView);
  $('btn-lessons').addEventListener('click', openLessonsModal);
  $('btn-finger').addEventListener('click', openFingerGuide);
  $('btn-theme').addEventListener('click', () => {
    const cur = storage.getSettings().theme;
    const nxt = cur === 'dark' ? 'light' : 'dark';
    storage.saveSettings({ theme: nxt });
    document.documentElement.setAttribute('data-theme', nxt);
    syncThemeIcon(nxt);
  });
  $('logo').addEventListener('click', openLessonsModal);

  /* Practice nav */
  $('btn-restart').addEventListener('click', restartLesson);
  $('btn-prev-lesson').addEventListener('click', () => { const p = getPrevLesson(S.lesson?.id); if (p) startLesson(p); });
  $('btn-next-lesson-nav').addEventListener('click', () => { const n = getNextLesson(S.lesson?.id); if (n) startLesson(n); });

  /* Typing area */
  $('typing-area').addEventListener('keydown', onKeyDown);
  $('typing-area').addEventListener('focus',   handleFocus);
  $('typing-area').addEventListener('blur',    handleBlur);
  $('focus-overlay').addEventListener('click', () => $('typing-area').focus());

  /* Hints toggle */
  $('toggle-hints').addEventListener('change', e => {
    storage.saveSettings({ showHints: e.target.checked });
    const vm = storage.getSettings().viewMode;
    $('key-guide').classList.toggle('hint-hidden', !e.target.checked || vm >= 2);
  });

  /* Lessons modal */
  $('btn-close-lessons').addEventListener('click', () => hideModal('modal-lessons'));
  $('modal-lessons').addEventListener('click', e => { if (e.target === $('modal-lessons')) hideModal('modal-lessons'); });
  $$('.lvl-tab').forEach(btn => btn.addEventListener('click', () => {
    activeLevelTab = btn.dataset.level;
    $$('.lvl-tab').forEach(b => b.classList.toggle('active', b === btn));
    renderLessonList(activeLevelTab);
  }));

  /* Finger guide */
  $('btn-close-finger').addEventListener('click', closeFingerGuide);
  $('modal-finger').addEventListener('click', e => { if (e.target === $('modal-finger')) closeFingerGuide(); });

  /* Results */
  $('btn-retry').addEventListener('click', () => { hideModal('modal-results'); restartLesson(); });
  $('btn-back-lessons').addEventListener('click', () => { hideModal('modal-results'); openLessonsModal(); });
  $('modal-results').addEventListener('click', e => { if (e.target === $('modal-results')) hideModal('modal-results'); });
}

function syncThemeIcon(theme) {
  $('icon-sun').style.display  = theme === 'dark'  ? 'block' : 'none';
  $('icon-moon').style.display = theme === 'light' ? 'block' : 'none';
}

document.addEventListener('DOMContentLoaded', init);