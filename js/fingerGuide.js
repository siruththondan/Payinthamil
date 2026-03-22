/**
 * fingerGuide.js — Finger-to-key mapping for Tamil99 layout
 *
 * Shows which finger presses each key. Colour-coded overlay on the
 * SVG keyboard. Auto-shown on first visit, accessible via the guide button.
 *
 * BUG FIX: removed module-level `fingerDataApplied` singleton flag.
 * The old flag prevented re-application if the keyboard SVG is reloaded,
 * or when applying to a fresh clone for the finger-guide modal. Now
 * `applyFingerData` always applies to whatever container is passed.
 */

/* ── SVG group IDs → finger code ──────────────────────────────── */
export const FINGER_MAP = {
  lp: ['`', '1', 'Tab', 'Q', 'A', 'Caps Lock', 'Z', 'Shift'],
  lr: ['2', 'W', 'S', 'X'],
  lm: ['3', 'E', 'D', 'C'],
  li: ['4', '5', 'R', 'T', 'F', 'G', 'V', 'B'],
  th: ['Space'],
  ri: ['6', '7', 'Y', 'U', 'H', 'J', 'N', 'M'],
  rm: ['8', 'I', 'K', ','],
  rr: ['9', 'O', 'L', '.'],
  rp: ['0', '-', '=', 'P', ';', "'", '[', ']', '\\', '/', 'Enter',
       'Backspace', 'Shift_2', 'Control', 'Control_2', 'Alt', 'Alt_2'],
};

/* ── Finger metadata: label, Tamil chars shown, zone colour ──── */
export const FINGER_INFO = {
  lp: { label: 'Left Pinky',   tamil: 'அ ஆ ஔ',           css: '#BAF2BB' },
  lr: { label: 'Left Ring',    tamil: 'இ ஈ ஓ',           css: '#C1FBA4' },
  lm: { label: 'Left Middle',  tamil: 'உ ஊ ஒ',           css: '#F2E2BA' },
  li: { label: 'Left Index',   tamil: 'ஐ ஏ எ வ ்',       css: '#BAD7F2' },
  th: { label: 'Thumbs',       tamil: '(space)',           css: '#cccccc' },
  ri: { label: 'Right Index',  tamil: 'க ப ல ற ள ர',     css: '#F2BAC9' },
  rm: { label: 'Right Middle', tamil: 'ம ன',              css: '#F2E2BA' },
  rr: { label: 'Right Ring',   tamil: 'த ட',              css: '#C1FBA4' },
  rp: { label: 'Right Pinky',  tamil: 'ந ய ண ச ஞ ழ',   css: '#BAF2BB' },
};

/**
 * applyFingerData(container)
 * ──────────────────────────
 * Walks every SVG key group in the container and attaches `data-finger`
 * attributes matching the FINGER_MAP entries. Called after SVG injection
 * and again when a fresh clone is built for the guide modal.
 *
 * Safe to call multiple times — idempotent (overwrites same values).
 *
 * @param {Element} container — the #keyboard wrapper or guide clone
 */
export function applyFingerData(container) {
  if (!container) return;
  Object.entries(FINGER_MAP).forEach(([finger, ids]) => {
    ids.forEach(id => {
      const el = container.querySelector(`[id="${CSS.escape(id)}"]`);
      if (el) el.dataset.finger = finger;
    });
  });
}

/**
 * setGuideMode(container, enabled)
 * ──────────────────────────────────
 * Toggles the `guide-mode` class that triggers finger-zone colour overlay.
 */
export function setGuideMode(container, enabled) {
  if (!container) return;
  container.classList.toggle('guide-mode', enabled);
}

/**
 * shouldAutoShow()
 * ─────────────────
 * Returns true on the very first visit (before the guide has been shown).
 * Uses localStorage as a persistence flag.
 */
export function shouldAutoShow() {
  try {
    return !localStorage.getItem('paintamil_finger_guide_shown');
  } catch {
    return false;
  }
}

/**
 * markShown()
 * ────────────
 * Records that the guide has been shown so it won't auto-open again.
 */
export function markShown() {
  try {
    localStorage.setItem('paintamil_finger_guide_shown', '1');
  } catch { /* localStorage not available in some environments */ }
}