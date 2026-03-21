/**
 * metrics.js — compact keybr-style stats
 *
 * Two render targets:
 *   renderTopBar(el)   — compact horizontal strip above typing area
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
  storage.recordKey(key, correct);
  if (wpm) storage.recordKeyWpm(key, wpm);
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
      <span class="tb-avg" id="_tb_wpmavg">(0 avg)</span>
    </div>
    <div class="tb-sep"></div>
    <div class="tb-stat">
      <span class="tb-val" id="_tb_acc">100%</span>
      <span class="tb-lbl">accuracy</span>
      <span class="tb-avg" id="_tb_accavg">(0% avg)</span>
    </div>
    <div class="tb-sep"></div>
    <div class="tb-stat">
      <span class="tb-val" id="_tb_score">0</span>
      <span class="tb-lbl">score</span>
    </div>
    <div class="tb-sep"></div>
    <div class="tb-stat tb-goal">
      <div class="tb-goal-track"><div class="tb-goal-fill" id="_tb_goalfill" style="width:0%"></div></div>
      <span class="tb-avg" id="_tb_goallbl">0% of 30 min</span>
    </div>
  `;
}

export function renderTopBar(_unused) {
  if (!document.getElementById('_tb_wpm')) return;
  const p = storage.getProgress();
  const dailyPct = storage.getDailyPct();
  const daily = storage.getDailyGoal();
  const dailyMin = Math.floor((daily.seconds || 0) / 60);
  const wpm = sessionWpm();
  const acc = sessionAccuracy();
  const score = sessionScore();
  const lifeAcc = p.totalKeystrokes ? Math.round((p.totalCorrect / p.totalKeystrokes) * 100) : 0;
  const lifeWpm = p.totalKeystrokes
    ? Math.round(((p.totalCorrect / 5) / Math.max(1, p.totalKeystrokes / 280))) : 0;

  document.getElementById('_tb_wpm').textContent = wpm;
  document.getElementById('_tb_wpmavg').textContent = `(${lifeWpm} avg)`;
  document.getElementById('_tb_acc').textContent = acc + '%';
  document.getElementById('_tb_accavg').textContent = `(${lifeAcc}% avg)`;
  document.getElementById('_tb_score').textContent = score;
  document.getElementById('_tb_goalfill').style.width = dailyPct + '%';
  document.getElementById('_tb_goallbl').textContent =
    `${dailyPct}%  of 30 min${dailyMin > 0 ? ' (' + dailyMin + 'm)' : ''}`;
}

/* ── KEY PANEL ───────────────────────────────────── */
export function renderKeyPanel(el, currentKey, focusKeys = []) {
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
    const level = acc === null ? 'uk' : acc >= 95 ? 'ok' : acc >= 80 ? 'so' : 'no';
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
          <span class="kp-pill kp-ok">Fast ≥95%</span>
          <span class="kp-pill kp-so">Good 80–94%</span>
          <span class="kp-pill kp-no">Slow &lt;80%</span>
          <span class="kp-pill kp-uk">New</span>
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