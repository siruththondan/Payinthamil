/**
 * keyboard.js — Load Tamil99 SVG & handle key animations
 *
 * Key animations:
 *   key-hint    — delayed gentle glow on expected key (+ key-shift on Shift keys)
 *   key-correct — green flash on correct press
 *   key-wrong   — red flash on wrong press
 */

import { svgIdOf, needsShift } from './mapping.js';
import { applyFingerData }      from './fingerGuide.js';

let loaded    = false;
let container = null;

/* ── Load SVG ─────────────────────────────────────── */
export async function loadKeyboard(containerId, svgPath = './assets/images/Tamil99.svg') {
  container = document.getElementById(containerId);
  if (!container) return;

  try {
    const text = await (await fetch(svgPath)).text();
    container.innerHTML = text;

    const svg = container.querySelector('svg');
    if (svg) {
      svg.removeAttribute('width');
      svg.removeAttribute('height');
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      if (!svg.getAttribute('viewBox')) svg.setAttribute('viewBox', '0 0 849 288');
    }

    applyFingerData(container);   // add data-finger attrs for guide mode
    loaded = true;
  } catch (err) {
    console.warn('[keyboard] SVG load failed:', err);
    container.innerHTML = '<div class="kb-error">Place Tamil99.svg in assets/images/</div>';
  }
}

/* ── Internal helpers ─────────────────────────────── */
function findKey(key) {
  if (!loaded || !container) return null;
  return container.querySelector(`[id="${CSS.escape(svgIdOf(key))}"]`);
}

function findShiftKeys() {
  if (!loaded || !container) return [];
  return [...container.querySelectorAll('[id="Shift"], [id="Shift_2"]')];
}

/* ── Public API ───────────────────────────────────── */
export function clearHints() {
  if (!loaded || !container) return;
  container.querySelectorAll('.key-hint, .key-correct, .key-wrong, .key-shift')
           .forEach(el => el.classList.remove('key-hint', 'key-correct', 'key-wrong', 'key-shift'));
}

export function showHint(key) {
  if (!loaded || !container) return;
  clearHints();
  const el = findKey(key);
  if (!el) return;
  el.classList.add('key-hint');

  if (needsShift(key)) {
    findShiftKeys().forEach(s => s.classList.add('key-shift'));
  }
}

export function flashCorrect(key) {
  if (!loaded || !container) return;
  const el = findKey(key);
  if (!el) return;
  el.classList.remove('key-hint');
  el.classList.add('key-correct');
  setTimeout(() => el.classList.remove('key-correct'), 380);
}

export function flashWrong(pressedKey, expectedKey) {
  if (!loaded || !container) return;
  const pressedEl  = findKey(pressedKey);
  const expectedEl = findKey(expectedKey);

  if (pressedEl) {
    pressedEl.classList.add('key-wrong');
    setTimeout(() => pressedEl.classList.remove('key-wrong'), 380);
  }
  // Re-hint the correct key immediately
  if (expectedEl) {
    expectedEl.classList.remove('key-hint');
    void expectedEl.offsetWidth; // force reflow to restart animation
    expectedEl.classList.add('key-hint');
  }
  if (needsShift(expectedKey)) {
    findShiftKeys().forEach(s => s.classList.add('key-shift'));
  }
}

export function setVisible(visible) {
  if (!container) return;
  container.style.display = visible ? '' : 'none';
}

export function getContainer() { return container; }