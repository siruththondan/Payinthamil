/**
 * storage.js — All data in YOUR browser. Zero server uploads.
 */
const K = {
  SETTINGS: 'payinthamil_settings',
  PROGRESS: 'payinthamil_progress',
  KEYDATA: 'payinthamil_keydata',
  DAILY: 'payinthamil_daily',
  CUSTOM_THEME: 'payinthamil_custom_theme',
  TOUR_SEEN: 'payinthamil_tour_seen',
  STREAK: 'payinthamil_streak',
};
// One-time rename of pre-launch keys (paintamil_* / pt_tour_seen).
// Copies each old value to its new key when the new key is absent, then
// removes the old key. Safe to delete once all early users have loaded the app.
const LEGACY_KEYS = {
  paintamil_settings: K.SETTINGS,
  paintamil_progress: K.PROGRESS,
  paintamil_keydata: K.KEYDATA,
  paintamil_daily: K.DAILY,
  paintamil_custom_theme: K.CUSTOM_THEME,
  pt_tour_seen: K.TOUR_SEEN,
  paintamil_streak: K.STREAK,
  paintamil_finger_guide_shown: 'payinthamil_finger_guide_shown',
};
try {
  for (const [oldKey, newKey] of Object.entries(LEGACY_KEYS)) {
    const v = localStorage.getItem(oldKey);
    if (v !== null) {
      if (localStorage.getItem(newKey) === null) localStorage.setItem(newKey, v);
      localStorage.removeItem(oldKey);
    }
  }
} catch { }
function parse(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { ...fallback };
    const stored = JSON.parse(raw);
    if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return { ...fallback };
    const out = { ...fallback };
    // Per-field type validation: a stored value whose type differs from the
    // default (e.g. {"lessonBests":null}) is ignored rather than merged in.
    for (const k of Object.keys(stored)) {
      if (!(k in fallback)) { out[k] = stored[k]; continue; }
      const d = fallback[k], v = stored[k];
      if (d === null || d === undefined) { out[k] = v; continue; } // untyped default: accept
      const ok = Array.isArray(d) ? Array.isArray(v)
        : typeof v === typeof d && v !== null && !Array.isArray(v);
      if (ok) out[k] = v;
    }
    return out;
  } catch { return { ...fallback }; }
}
function save(key, obj) {
  try { localStorage.setItem(key, JSON.stringify(obj)); } catch { }
  return obj;
}
// Local-calendar date (YYYY-MM-DD). toISOString() is UTC and flips the day at the wrong hour.
const dateStr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const today = () => dateStr(new Date());

/* ── Keydata write buffer ──────────────────────────────────────
 * recordKeypress() runs on every keystroke. Writing to localStorage
 * there means a synchronous JSON.stringify + setItem on the hot path,
 * and the keydata object only grows. Instead we keep it in memory and
 * flush on idle / tab-hide / unload. Keydata is only consumed at
 * lesson end and on the report tab, so a short write delay is safe.
 */
let keyDataCache = null;
let keyDataDirty = false;
let flushTimer = null;
const FLUSH_DELAY = 2000;

function flushKeyData() {
  if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
  if (!keyDataDirty || !keyDataCache) return;
  save(K.KEYDATA, keyDataCache);
  keyDataDirty = false;
}

function scheduleKeyDataFlush() {
  keyDataDirty = true;
  if (flushTimer) return;
  flushTimer = setTimeout(() => { flushTimer = null; flushKeyData(); }, FLUSH_DELAY);
}

if (typeof document !== 'undefined') {
  // pagehide covers tab close, navigation and bfcache on all modern browsers.
  // visibilitychange covers tab switch / minimise, where pagehide may not fire.
  addEventListener('pagehide', flushKeyData);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushKeyData();
  });
}
export const storage = {
  getSettings() {
    // Default theme is dark
    const s = parse(K.SETTINGS, { theme: 'dark', themeId: 'dark', showHints: true, viewMode: 0 });
    if (!Number.isInteger(s.viewMode) || s.viewMode < 0 || s.viewMode > 2) s.viewMode = 0;
    return s;
  },
  saveSettings(patch) {
    return save(K.SETTINGS, { ...this.getSettings(), ...patch });
  },
  getProgress() {
    return parse(K.PROGRESS, {
      completedLessons: [], lessonBests: {},
      totalKeystrokes: 0, totalCorrect: 0,
      lastLessonId: null, firstUsed: null,
    });
  },
  saveProgress(patch) {
    const p = { ...this.getProgress(), ...patch };
    if (!p.firstUsed) p.firstUsed = Date.now();
    return save(K.PROGRESS, p);
  },
  // opts.curriculum === false: count keystrokes only; do not add to
  // completedLessons / lessonBests (used by Thirukkural verses).
  recordResult(lessonId, wpm, accuracy, totalKeys, correctKeys, opts = {}) {
    const p = this.getProgress();
    if (opts.curriculum !== false) {
      if (!p.completedLessons.includes(lessonId)) p.completedLessons = [...p.completedLessons, lessonId];
      const prev = p.lessonBests[lessonId];
      if (!prev || wpm > prev.wpm) p.lessonBests[lessonId] = { wpm, accuracy };
      p.lastLessonId = lessonId;
    }
    p.totalKeystrokes = (p.totalKeystrokes || 0) + totalKeys;
    p.totalCorrect = (p.totalCorrect || 0) + correctKeys;
    if (!p.firstUsed) p.firstUsed = Date.now();
    return save(K.PROGRESS, p);
  },
  getKeyData() {
    if (!keyDataCache) keyDataCache = parse(K.KEYDATA, { keys: {} });
    return keyDataCache;
  },
  // Force any buffered keydata to disk. Call before reading keydata
  // from another context, or when ending a session.
  flushKeyData,
  recordKeypress(key, correct, wpm) {
    // Spaces are intentionally not tracked per-key (the report accepts this undercount).
    if (!key || key === ' ') return;
    const d = this.getKeyData();
    if (!d.keys[key]) d.keys[key] = { total: 0, correct: 0, wpmSamples: [], emaMs: 0 };
    d.keys[key].total++;
    if (correct) d.keys[key].correct++;
    if (wpm > 0 && Number.isFinite(wpm)) {
      const msPerKey = 60000 / (wpm * 3); // approximate ms per Tamil99 key at this WPM
      if (!Number.isFinite(msPerKey)) return;
      const entry = d.keys[key];
      // EMA update with α=0.1 — heavy smoothing (per keybr.com design)
      entry.emaMs = entry.emaMs > 0
        ? 0.1 * msPerKey + 0.9 * entry.emaMs
        : msPerKey; // first sample: no smoothing
      // Keep wpmSamples for backward compat
      const s = entry.wpmSamples;
      s.push(wpm);
      if (s.length > 20) s.shift();
    }
    scheduleKeyDataFlush();
  },
  // Returns key proficiency 0.0–1.0: 1.0 = at or above target speed + good accuracy
  // targetWpm: the WPM target (defaults to 30 WPM for Tamil99)
  getKeyProficiency(key, targetWpm = 30) {
    const d = this.getKeyData();
    const stats = d.keys[key];
    if (!stats || stats.total < 5) return null; // not enough data

    const targetMs = 60000 / (targetWpm * 3); // ms/key at target speed
    const speedScore = stats.emaMs > 0 ? Math.min(targetMs / stats.emaMs, 1.0) : 0;
    const accuracyScore = Math.max(0, 1 - (1 - stats.correct / stats.total) * 2);
    return 0.6 * speedScore + 0.4 * accuracyScore; // weighted: 60% speed, 40% accuracy
  },
  getDailyGoal() {
    const raw = parse(K.DAILY, { date: '', seconds: 0 });
    return raw.date === today() ? raw : { date: today(), seconds: 0 };
  },
  addDailySeconds(secs) {
    const d = this.getDailyGoal();
    d.seconds = Math.round((d.seconds || 0) + secs);
    d.date = today();
    save(K.DAILY, d);
    return d;
  },
  getDailyPct() {
    return Math.min(100, Math.round((this.getDailyGoal().seconds / (30 * 60)) * 100));
  },
  clearAll() {
    // Drop the in-memory keydata buffer first, otherwise a pending flush
    // would write the old data straight back after the clear.
    if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
    keyDataCache = null;
    keyDataDirty = false;
    Object.values(K).forEach(k => { try { localStorage.removeItem(k); } catch { } });
    try { localStorage.removeItem('payinthamil_finger_guide_shown'); } catch { }
  },
  getCustomTheme() {
    try {
      const raw = localStorage.getItem(K.CUSTOM_THEME);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },
  saveCustomTheme(vars) {
    try { localStorage.setItem(K.CUSTOM_THEME, JSON.stringify(vars)); } catch {}
  },
  getTourSeen() {
    try { return !!localStorage.getItem(K.TOUR_SEEN); } catch { return false; }
  },
  setTourSeen() {
    try { localStorage.setItem(K.TOUR_SEEN, '1'); } catch {}
  },
  getStreak() {
    return parse(K.STREAK, { current: 0, longest: 0, lastDate: null });
  },
  touchStreak() {
    const s = this.getStreak();
    const todayStr = today();
    if (s.lastDate === todayStr) return s;
    const yd = new Date(); yd.setDate(yd.getDate() - 1); // calendar day, DST-safe
    const yesterday = dateStr(yd);
    if (s.lastDate === yesterday) {
      s.current += 1;
    } else {
      s.current = 1;
    }
    s.longest = Math.max(s.longest, s.current);
    s.lastDate = todayStr;
    return save(K.STREAK, s);
  },
};