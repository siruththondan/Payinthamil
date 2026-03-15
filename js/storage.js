/**
 * storage.js — All data lives in YOUR browser. Nothing is uploaded to any server.
 *
 * Keys used:
 *   paintamil_settings  — theme, font-size, keyboard visiblity, hints, sound
 *   paintamil_progress  — completed lessons, best WPM/accuracy, keystroke totals
 */

const KEYS = {
  SETTINGS: 'paintamil_settings',
  PROGRESS: 'paintamil_progress',
};

const DEFAULTS = {
  settings: {
    theme: 'dark',
    fontSize: 'lg',          // sm | md | lg | xl
    showKeyboard: true,
    showHints: true,
    soundEnabled: false,
  },
  progress: {
    currentLevel: 'beginner',
    lastLessonId: null,
    completedLessons: [],
    lessonBests: {},          // { [id]: { wpm, accuracy, completedAt } }
    totalKeystrokes: 0,
    totalCorrect: 0,
    firstUsed: null,
    lastUsed: null,
  },
};

function parse(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : { ...fallback };
  } catch {
    return { ...fallback };
  }
}

export const storage = {
  /* ── Settings ─────────────────────────────── */
  getSettings() {
    return parse(KEYS.SETTINGS, DEFAULTS.settings);
  },
  saveSettings(patch) {
    const next = { ...this.getSettings(), ...patch };
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(next));
    return next;
  },

  /* ── Progress ─────────────────────────────── */
  getProgress() {
    return parse(KEYS.PROGRESS, DEFAULTS.progress);
  },
  saveProgress(patch) {
    const next = {
      ...this.getProgress(),
      ...patch,
      lastUsed: Date.now(),
    };
    if (!next.firstUsed) next.firstUsed = Date.now();
    localStorage.setItem(KEYS.PROGRESS, JSON.stringify(next));
    return next;
  },

  /** Called when a lesson finishes. Saves best score and marks complete. */
  recordResult(lessonId, wpm, accuracy, totalKeys, correctKeys) {
    const p = this.getProgress();
    const prev = p.lessonBests[lessonId];
    if (!prev || wpm > prev.wpm) {
      p.lessonBests[lessonId] = { wpm, accuracy, completedAt: Date.now() };
    }
    if (!p.completedLessons.includes(lessonId)) {
      p.completedLessons = [...p.completedLessons, lessonId];
    }
    p.totalKeystrokes = (p.totalKeystrokes || 0) + totalKeys;
    p.totalCorrect    = (p.totalCorrect    || 0) + correctKeys;
    p.lastLessonId    = lessonId;
    return this.saveProgress(p);
  },

  /** Wipe everything — user-triggered only. */
  clearAll() {
    localStorage.removeItem(KEYS.SETTINGS);
    localStorage.removeItem(KEYS.PROGRESS);
  },

  /** Data shown in the Settings → Privacy panel. */
  getStorageInfo() {
    const s = this.getSettings();
    const p = this.getProgress();
    const totalBytes =
      (localStorage.getItem(KEYS.SETTINGS) || '').length +
      (localStorage.getItem(KEYS.PROGRESS) || '').length;

    return {
      entries: [
        { label: 'Theme',               value: s.theme },
        { label: 'Font size',            value: s.fontSize },
        { label: 'Keyboard visible',     value: s.showKeyboard ? 'Yes' : 'No' },
        { label: 'Hints visible',        value: s.showHints    ? 'Yes' : 'No' },
        { label: 'Sound effects',        value: s.soundEnabled  ? 'On'  : 'Off' },
        { label: 'Completed lessons',    value: p.completedLessons.length },
        { label: 'Best-score records',   value: Object.keys(p.lessonBests).length },
        { label: 'Total keystrokes',     value: (p.totalKeystrokes || 0).toLocaleString() },
        { label: 'Accuracy (lifetime)',  value: p.totalKeystrokes
            ? Math.round((p.totalCorrect / p.totalKeystrokes) * 100) + '%'
            : 'N/A' },
        { label: 'First used',           value: p.firstUsed
            ? new Date(p.firstUsed).toLocaleDateString()
            : 'Today' },
        { label: 'Last used',            value: p.lastUsed
            ? new Date(p.lastUsed).toLocaleDateString()
            : 'Today' },
      ],
      bytes:   `~${totalBytes} bytes`,
      location: 'Your device — localStorage (never uploaded)',
      shared:   'Zero data leaves your browser. Ever.',
    };
  },
};