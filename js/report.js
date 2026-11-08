/**
 * report.js — Progress report for Payinthamil
 * Renders into #report-main. PDF via window.print().
 */
import { storage } from './storage.js';
import { ALL_LESSONS, getLessonById } from './lessons.js';
import { MAPPING } from './mapping.js';

/**
 * Convert an internal key string to its Tamil character.
 * Falls back to the raw key if no mapping exists.
 */
function tamilOf(key) {
  return MAPPING[key] ?? key;
}

export function initReport() {
  // Called once on page load — nothing to wire up here;
  // rendering is triggered by tab-switch in practice.js.
}

export function renderReport() {
  const el = document.getElementById('report-main');
  if (!el) return;

  const p      = storage.getProgress();
  const kd     = storage.getKeyData();
  const daily  = storage.getDailyGoal();
  const streak = storage.getStreak();

  // ── Summary stats ────────────────────────────────────────────
  const completedLessons = (p.completedLessons || []).filter(id => getLessonById(id));
  const lessonBests = Object.fromEntries(
    Object.entries(p.lessonBests || {}).filter(([, b]) => b && typeof b === 'object')
  );
  const validBests  = Object.values(lessonBests).filter(b => b && b.wpm > 0);

  const bestWpm = validBests.length ? Math.max(...validBests.map(b => b.wpm)) : 0;
  const avgWpm  = validBests.length
    ? Math.round(validBests.reduce((a, b) => a + b.wpm, 0) / validBests.length)
    : 0;
  // NOTE: this is the mean accuracy of each lesson's best-WPM run (that is what
  // storage keeps per lesson), not overall accuracy over every keystroke.
  const avgAcc  = validBests.length
    ? Math.round(validBests.reduce((a, b) => a + b.accuracy, 0) / validBests.length)
    : 100;

  // NOTE: excludes space presses (storage.recordKeypress returns early for ' ').
  const totalKeys = Object.values(kd.keys || {}).reduce((s, v) => s + (Number(v?.total) || 0), 0);
  const totalTime = Math.round((daily.seconds || 0) / 60);
  const daysSince = p.firstUsed
    ? Math.max(1, Math.ceil((Date.now() - p.firstUsed) / (1000 * 60 * 60 * 24)))
    : 1;

  // ── Key accuracy data ────────────────────────────────────────
  const keyRows = Object.entries(kd.keys || {})
    .filter(([, v]) => v.total >= 3)
    .map(([k, v]) => ({ key: k, acc: Math.round((v.correct / v.total) * 100), total: v.total }))
    .sort((a, b) => a.acc - b.acc);

  const problemKeys = keyRows.filter(k => k.acc < 80).slice(0, 12);
  const goodKeys    = keyRows.filter(k => k.acc >= 95).slice(0, 12);

  // ── Lesson table rows ────────────────────────────────────────
  const lessonRows = ALL_LESSONS
    .filter(l => completedLessons.includes(l.id))
    .map(l => {
      const best = lessonBests[l.id];
      return { title: l.title, id: l.id, wpm: best?.wpm || 0, acc: best?.accuracy || 0 };
    });

  // ── Date ────────────────────────────────────────────────────
  const dateStr = new Date().toLocaleDateString('en-IN', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  // ── Progress percentage ──────────────────────────────────────
  const progressPct = Math.round(completedLessons.length / ALL_LESSONS.length * 100);

  // ── Build HTML ───────────────────────────────────────────────
  el.innerHTML = `
  <div class="rpt-wrap">

    <!-- Header -->
    <div class="rpt-head">
      <div class="rpt-logo">பைந்தமிழ்</div>
      <div class="rpt-meta">
        <span class="rpt-date">${dateStr}</span>
        <span class="rpt-tagline">Tamil99 · ${daysSince} ${daysSince === 1 ? 'day' : 'days'} practicing</span>
      </div>
    </div>

    <hr class="rpt-rule">

    <!-- Headline number -->
    <div class="rpt-headline">
      <div class="rpt-big-num">${bestWpm || avgWpm || 0}</div>
      <div class="rpt-big-lbl">WPM personal best</div>
      <div class="rpt-sub-stats">
        <span>${avgWpm} avg</span>
        <span class="rpt-dot">·</span>
        <span title="Mean accuracy of each lesson's best run">${avgAcc}% best-run accuracy (சிறந்த முயற்சி துல்லியம்)</span>
        <span class="rpt-dot">·</span>
        <span>${completedLessons.length} of ${ALL_LESSONS.length} lessons</span>
        <span class="rpt-dot">·</span>
        <span>${totalKeys.toLocaleString()} keys typed</span>
        ${streak.current > 1 ? `<span class="rpt-dot">·</span><span>${streak.current}-day streak</span>` : ''}
        ${streak.longest > 1 ? `<span class="rpt-dot">·</span><span>best ${streak.longest} days</span>` : ''}
      </div>
    </div>

    <!-- Progress bar -->
    <div class="rpt-prog">
      <div class="rpt-prog-bar">
        <div class="rpt-prog-fill" style="width:${progressPct}%"></div>
      </div>
      <div class="rpt-prog-txt">${completedLessons.length} of ${ALL_LESSONS.length} lessons done · ${progressPct}% complete</div>
    </div>

    <hr class="rpt-rule">

    ${problemKeys.length ? `
    <!-- Keys to practice -->
    <div class="rpt-section">
      <span class="rpt-sect-hd">Keys to practice</span>
      <div class="rpt-keys-inline">
        ${problemKeys.map(k => `<span class="rpt-k bad">${tamilOf(k.key)} <small>${k.acc}%</small></span>`).join('')}
      </div>
    </div>` : ''}

    ${goodKeys.length ? `
    <!-- Mastered keys -->
    <div class="rpt-section">
      <span class="rpt-sect-hd">Mastered keys</span>
      <div class="rpt-keys-inline">
        ${goodKeys.map(k => `<span class="rpt-k good">${tamilOf(k.key)} <small>${k.acc}%</small></span>`).join('')}
      </div>
    </div>` : ''}

    ${lessonRows.length ? `
    <!-- Lessons table — stripped down, no WPM bar -->
    <div class="rpt-section">
      <span class="rpt-sect-hd">Completed lessons</span>
      <table class="rpt-table">
        <thead>
          <tr><th>Lesson</th><th>WPM</th><th>Accuracy</th></tr>
        </thead>
        <tbody>
          ${lessonRows.map(r => `
            <tr>
              <td class="rpt-lesson-name">${r.title}</td>
              <td class="rpt-num">${r.wpm}</td>
              <td class="rpt-num">${r.acc}%</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>` : `
    <div class="rpt-empty">
      <div class="rpt-empty-text">No lessons completed yet</div>
      <div class="rpt-empty-sub">Finish your first lesson to see progress here</div>
    </div>`}

    <div class="rpt-footer">
      <span class="rpt-footer-txt">பைந்தமிழ் · All data stored locally in your browser</span>
      <button class="rpt-pdf-btn">Save PDF</button>
    </div>
  </div>
  `;
  el.querySelector('.rpt-pdf-btn').addEventListener('click', () => window.print());
}
