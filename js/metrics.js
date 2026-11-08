/**
 * metrics.js — compact keybr-style stats
 *
 * Two render targets:
 *   renderTopBar(wpm)  — compact horizontal strip above typing area; `wpm` is the
 *                        EMA-smoothed live WPM computed by practice.js (single source
 *                        of the displayed value; falls back to sessionWpm() if omitted)
 *   renderKeyPanel(el) — per-key heatmap + streaks + goal below keyboard
 */

import { storage } from './storage.js';
import { tamilOf, MAPPING } from './mapping.js';

let session = {
  wpmHistory: [], correctKeys: 0, totalKeys: 0,
  currentStreak: 0, bestStreak: 0,
};

export function resetSession() {
  session = { wpmHistory: [], correctKeys: 0, totalKeys: 0, currentStreak: 0, bestStreak: 0 };
}

export function recordKeypress(key, correct, wpm) {
  session.totalKeys++;
  if (correct) {
    session.correctKeys++;
    session.currentStreak++;
    if (session.currentStreak > session.bestStreak) session.bestStreak = session.currentStreak;
  } else {
    session.currentStreak = 0;
  }
  if (wpm) { session.wpmHistory.push(wpm); if (session.wpmHistory.length > 12) session.wpmHistory.shift(); }
  storage.recordKeypress(key, correct, wpm);
}

export const sessionWpm = () => session.wpmHistory.length ? Math.round(session.wpmHistory.slice(-8).reduce((a, b) => a + b, 0) / Math.min(8, session.wpmHistory.length)) : 0;
export const sessionAccuracy = () => session.totalKeys ? Math.round((session.correctKeys / session.totalKeys) * 100) : 100;
export const sessionScore = () => Math.round(sessionWpm() * (sessionAccuracy() / 100) * 10);

/* ── TOP BAR ─────────────────────────────────────────
   Build once, then update only text nodes — no reflow.  */
let _tbEl = null;

export function initTopBar(el) {
  if (!el) return;
  _tbEl = el;
  el.innerHTML = `
    <div class="tb-stat">
      <span class="tb-val" id="_tb_wpm">0</span>
      <span class="tb-lbl">wpm</span>
    </div>
    <span class="tb-div"></span>
    <div class="tb-stat">
      <span class="tb-val" id="_tb_acc">100%</span>
      <span class="tb-lbl">acc</span>
    </div>
    <span class="tb-div"></span>
    <div class="tb-stat tb-secondary">
      <span class="tb-val-sm" id="_tb_wpmavg">—</span>
      <span class="tb-lbl">avg</span>
    </div>
    <span class="tb-div"></span>
    <div class="tb-stat tb-goal">
      <div class="tb-goal-track"><div class="tb-goal-fill" id="_tb_goalfill" style="width:0%"></div></div>
      <span class="tb-goallbl" id="_tb_goallbl">0 min today</span>
    </div>
  `;
}

export function renderTopBar(liveWpm) {
  if (!document.getElementById('_tb_wpm')) return;
  const p = storage.getProgress();
  const dailyPct = storage.getDailyPct();
  const daily = storage.getDailyGoal();
  const dailyMin = Math.floor((daily.seconds || 0) / 60);
  const wpm = Number.isFinite(liveWpm) ? liveWpm : sessionWpm();
  const acc = sessionAccuracy();
  // Lifetime avg: use stored per-lesson best WPMs if available
  const lessonBests = p.lessonBests ? Object.values(p.lessonBests) : [];
  const validBests = lessonBests.filter(b => b && b.wpm > 0);
  const lifeWpm = validBests.length
    ? Math.round(validBests.reduce((a, b) => a + b.wpm, 0) / validBests.length)
    : 0;

  document.getElementById('_tb_wpm').textContent = wpm;
  document.getElementById('_tb_acc').textContent = acc + '%';
  document.getElementById('_tb_wpmavg').textContent = lifeWpm || '—';
  document.getElementById('_tb_goalfill').style.width = dailyPct + '%';
  document.getElementById('_tb_goallbl').textContent =
    dailyMin > 0 ? `${dailyMin}m today` : '0 min today';
}

/* ── KEY PANEL ───────────────────────────────────── */
export function renderKeyPanel(el, currentKey, focusKeys = [], targetWpm = 30) {
  if (!el) return;
  const kd = storage.getKeyData();

  // Keys to display — focus keys first, then any tracked keys
  const seen = new Set();
  const displayKeys = [
    ...focusKeys.filter(k => k !== 'f' && k !== ' '),
    ...Object.keys(kd.keys),
  ].filter(k => { if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 32);

  const keyItems = displayKeys.map(key => {
    const info = kd.keys[key];
    const acc = info && info.total >= 3 ? Math.round((info.correct / info.total) * 100) : null;
    // Get EMA proficiency for color weighting (if available)
    // Score speed against the current lesson's target WPM (10-40), not a fixed 30.
    // With no speed samples (emaMs === 0) score accuracy only; otherwise a
    // 100%-accurate key would be rendered red because speedScore collapses to 0.
    // (Done here: storage.js getKeyProficiency is out of this lane.)
    const prof = info && info.total >= 5 && !(info.emaMs > 0)
      ? Math.max(0, 1 - (1 - info.correct / info.total) * 2)
      : storage.getKeyProficiency(key, targetWpm); // null if < 5 samples
    // Use proficiency for color if available, else fall back to accuracy ratio
    const score = prof !== null ? prof : (info && info.total >= 3 ? info.correct / info.total : null);
    const level = score === null ? 'uk' : score >= 0.95 ? 'ok' : score >= 0.80 ? 'so' : 'no';
    const isCur = key === currentKey;
    return `<span class="kp-key kp-${level}${isCur ? ' kp-cur' : ''}" title="${acc !== null ? acc + '%' : '—'}">${tamilOf(key)}</span>`;
  }).join('');

  // Current key detail
  const curInfo = kd.keys[currentKey];
  const curAcc = curInfo && curInfo.total >= 3 ? Math.round((curInfo.correct / curInfo.total) * 100) : null;
  const curTotal = curInfo ? curInfo.total : 0;
  const needMore = Math.max(0, 10 - curTotal);

  el.innerHTML = `
    <div class="kp-row">
      <div class="kp-section">
        <span class="kp-label">Keys</span>
        <div class="kp-map">${keyItems || '<span class="kp-dim">—</span>'}</div>
        <div class="kp-legend">
          <span class="leg-item kp-ok">≥95</span>
          <span class="leg-sep">·</span>
          <span class="leg-item kp-so">80–94</span>
          <span class="leg-sep">·</span>
          <span class="leg-item kp-no">&lt;80</span>
          <span class="leg-sep">·</span>
          <span class="leg-item kp-uk">new</span>
        </div>
      </div>

      <div class="kp-section kp-cur-section">
        <span class="kp-label">Current</span>
        <div class="kp-bigchar">${currentKey ? tamilOf(currentKey) : '—'}</div>
        ${needMore > 0
      ? `<div class="kp-calib">Need ${needMore} more</div>`
      : `<div class="kp-accbar"><div class="kp-accfill" style="width:${curAcc ?? 0}%;background:${curAcc >= 95 ? 'var(--correct)' : curAcc >= 80 ? 'var(--warn)' : 'var(--wrong)'}"></div></div>
             <div class="kp-calib">${curAcc}% accuracy</div>`}
      </div>

      <div class="kp-section">
        <span class="kp-label">Streaks</span>
        ${session.bestStreak > 2
      ? `<div class="kp-streak">Best: ${session.bestStreak} ✓</div>`
      : `<div class="kp-dim">No streaks yet</div>`}
      </div>
    </div>
  `;
}

/* ── PROBLEM KEYS SPOTLIGHT ──────────────────────────
   Shows keys from the just-completed lesson that have
   >= 5 attempts and accuracy below 80%. Sorted worst first. */
export function renderProblemKeys(containerEl, focusKeys = []) {
  if (!containerEl) return;
  const kd = storage.getKeyData();
  const problems = focusKeys
    .filter(k => k !== 'f' && k !== ' ')
    .map(k => {
      const info = kd.keys[k];
      if (!info || info.total < 5) return null;
      const acc = Math.round((info.correct / info.total) * 100);
      return acc < 80 ? { key: k, acc } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.acc - b.acc);

  if (problems.length === 0) {
    containerEl.classList.add('hidden');
    return;
  }

  const tiles = problems.map(({ key, acc }) =>
    `<span class="results-pk-key">
      <span class="results-pk-char">${tamilOf(key)}</span>
      <span class="results-pk-pct">${acc}%</span>
    </span>`
  ).join('');

  containerEl.innerHTML = `
    <span class="results-pk-label">needs work</span>
    <div class="results-pk-list">${tiles}</div>
  `;
  containerEl.classList.remove('hidden');
}