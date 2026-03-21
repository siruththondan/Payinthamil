/**
 * fingerGuide.js — Finger-to-key mapping for Tamil99 layout
 * Shows which finger presses which key. Runs once on first visit.
 */

// SVG group IDs → finger code
export const FINGER_MAP = {
  lp: ['`', '1', 'Tab', 'Q', 'A', 'Caps Lock', 'Z', 'Shift'],
  lr: ['2', 'W', 'S', 'X'],
  lm: ['3', 'E', 'D', 'C'],
  li: ['4', '5', 'R', 'T', 'F', 'G', 'V', 'B'],
  th: ['Space'],
  ri: ['6', '7', 'Y', 'U', 'H', 'J', 'N', 'M'],
  rm: ['8', 'I', 'K', ','],
  rr: ['9', 'O', 'L', '.'],
  rp: ['0', '-', '=', 'P', ";", "'", '[', ']', '\\', '/', 'Enter', 'Backspace', 'Shift_2', 'Control', 'Control_2', 'Alt', 'Alt_2'],
};

export const FINGER_INFO = {
  lp: { label: 'Left Pinky', tamil: 'அ ஆ ஔ', css: '#c97c7c' },
  lr: { label: 'Left Ring', tamil: 'இ ஈ ஓ', css: '#c9a07c' },
  lm: { label: 'Left Middle', tamil: 'உ ஊ ஒ', css: '#c9c07c' },
  li: { label: 'Left Index', tamil: 'ஐ ஏ எ வ ்', css: '#7ca87c' },
  th: { label: 'Thumbs', tamil: '(space)', css: '#888' },
  ri: { label: 'Right Index', tamil: 'க ப ல ற ள', css: '#7c9cc9' },
  rm: { label: 'Right Middle', tamil: 'ம ன', css: '#7c7cc9' },
  rr: { label: 'Right Ring', tamil: 'த ட', css: '#9c7cc9' },
  rp: { label: 'Right Pinky', tamil: 'ந ய ண ச ஞ ழ', css: '#bc7cbc' },
};

let fingerDataApplied = false;

/** Apply data-finger attributes to all SVG key groups after SVG is loaded */
export function applyFingerData(container) {
  if (fingerDataApplied || !container) return;
  Object.entries(FINGER_MAP).forEach(([finger, ids]) => {
    ids.forEach(id => {
      const el = container.querySelector(`[id="${CSS.escape(id)}"]`);
      if (el) el.dataset.finger = finger;
    });
  });
  fingerDataApplied = true;
}

/** Enable/disable the finger colour overlay on the keyboard */
export function setGuideMode(container, enabled) {
  if (!container) return;
  container.classList.toggle('guide-mode', enabled);
}

/** Should we auto-show the guide? (first-ever visit) */
export function shouldAutoShow() {
  try {
    const shown = localStorage.getItem('paintamil_finger_guide_shown');
    return !shown;
  } catch { return false; }
}

export function markShown() {
  try { localStorage.setItem('paintamil_finger_guide_shown', '1'); } catch { }
}