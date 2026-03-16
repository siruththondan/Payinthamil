/**
 * storage.js — All data in YOUR browser. Zero server uploads.
 */

const K = {
  SETTINGS: 'paintamil_settings',
  PROGRESS: 'paintamil_progress',
  KEYDATA:  'paintamil_keydata',
  DAILY:    'paintamil_daily',
};

function parse(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : { ...fallback };
  } catch { return { ...fallback }; }
}
function save(key, obj) {
  try { localStorage.setItem(key, JSON.stringify(obj)); } catch {}
  return obj;
}
const today = () => new Date().toISOString().slice(0, 10);

export const storage = {
  getSettings() {
    return parse(K.SETTINGS, { theme: 'light', showHints: true, viewMode: 0 });
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
  recordResult(lessonId, wpm, accuracy, totalKeys, correctKeys) {
    const p = this.getProgress();
    const prev = p.lessonBests[lessonId];
    if (!prev || wpm > prev.wpm) p.lessonBests[lessonId] = { wpm, accuracy };
    if (!p.completedLessons.includes(lessonId)) p.completedLessons = [...p.completedLessons, lessonId];
    p.totalKeystrokes = (p.totalKeystrokes || 0) + totalKeys;
    p.totalCorrect    = (p.totalCorrect    || 0) + correctKeys;
    p.lastLessonId    = lessonId;
    return this.saveProgress(p);
  },

  getKeyData() { return parse(K.KEYDATA, { keys: {} }); },
  recordKey(key, correct) {
    if (!key || key === ' ') return;
    const d = this.getKeyData();
    if (!d.keys[key]) d.keys[key] = { total: 0, correct: 0, wpmSamples: [] };
    d.keys[key].total++;
    if (correct) d.keys[key].correct++;
    save(K.KEYDATA, d);
  },
  recordKeyWpm(key, wpm) {
    if (!key || key === ' ' || !wpm) return;
    const d = this.getKeyData();
    if (!d.keys[key]) d.keys[key] = { total: 0, correct: 0, wpmSamples: [] };
    const s = d.keys[key].wpmSamples;
    s.push(wpm);
    if (s.length > 20) s.shift();
    save(K.KEYDATA, d);
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
    Object.values(K).forEach(k => { try { localStorage.removeItem(k); } catch {} });
  },
};