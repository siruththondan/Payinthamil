/**
 * keyboard.js — SVG keyboard loader + all key animations.
 *
 * Exports:
 *   loadKeyboard, clearHints, showHint, flashCorrect, flashWrong,
 *   flashKeyPress, setShiftActive, setVisible, getContainer
 */

import { svgIdOf, needsShift } from './mapping.js';
import { applyFingerData }     from './fingerGuide.js';

let loaded = false;
let container = null;
// Map of groupId -> {mainEl, shiftEl, mainX, mainY, mainFs, shiftX, shiftY, shiftFs}
const keyLabelMap = new Map();

/* ── Load ───────────────────────────────────────── */
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
    applyFingerData(container);
    prepareShiftLabels();
    loaded = true;
  } catch (err) {
    console.warn('[keyboard] SVG load failed:', err);
    container.innerHTML = '<div style="padding:.5rem;font-size:.75rem;color:var(--fg-3)">Place Tamil99.svg in assets/images/</div>';
  }
}

/* ── Internal helpers ──────────────────────────── */
function findKey(key) {
  if (!loaded || !container) return null;
  const id = svgIdOf(key);
  if (!id) return null;
  return container.querySelector(`[id="${CSS.escape(id)}"]`);
}
function findShiftKeys() {
  if (!loaded || !container) return [];
  return [...container.querySelectorAll('[id="Shift"], [id="Shift_2"]')];
}

/**
 * prepareShiftLabels — scan each key group, identify the "main" center text
 * and the "shift" top-left text, store their original x/y/font-size so we can
 * swap them when Shift is held.
 */
function prepareShiftLabels() {
  if (!container) return;
  const svg = container.querySelector('svg');
  if (!svg) return;
  keyLabelMap.clear();

  svg.querySelectorAll('g[id]').forEach(group => {
    // First rect child defines the key bounding box
    const rect = group.querySelector('rect');
    if (!rect) return;
    const texts = [...group.querySelectorAll('text')];
    if (texts.length < 2) return;

    const rx = parseFloat(rect.getAttribute('x') || 0);
    const ry = parseFloat(rect.getAttribute('y') || 0);
    const rw = parseFloat(rect.getAttribute('width') || 1);
    const rh = parseFloat(rect.getAttribute('height') || 1);

    // Classify each text by normalized position within the key rect
    const info = texts.map(t => {
      const tx = parseFloat(t.getAttribute('x') || 0);
      const ty = parseFloat(t.getAttribute('y') || 0);
      // Normalised 0-1 within rect
      const nx = rw > 0 ? (tx - rx) / rw : 0.5;
      const ny = rh > 0 ? (ty - ry) / rh : 0.5;
      const fs = parseFloat(t.getAttribute('font-size') || t.style.fontSize || '12');
      return { el: t, tx, ty, nx, ny, fs };
    });

    // "shift" = small text in top-left quadrant (nx < 0.5, ny < 0.5)
    const topLeft = info.filter(c => c.nx < 0.5 && c.ny < 0.55);
    // "main" = the rest (centered or right half)
    const centerArea = info.filter(c => !(c.nx < 0.5 && c.ny < 0.55));

    if (!topLeft.length || !centerArea.length) return;

    // Pick smallest font-size from top-left as the shift label
    const shiftC = topLeft.sort((a, b) => a.fs - b.fs)[0];
    // Pick largest font-size from center as the main label
    const mainC  = centerArea.sort((a, b) => b.fs - a.fs)[0];

    if (mainC && shiftC && mainC.el !== shiftC.el) {
      keyLabelMap.set(group.id, {
        mainEl:  mainC.el,
        shiftEl: shiftC.el,
        mainX:   mainC.el.getAttribute('x'),
        mainY:   mainC.el.getAttribute('y'),
        mainFs:  mainC.el.getAttribute('font-size'),
        shiftX:  shiftC.el.getAttribute('x'),
        shiftY:  shiftC.el.getAttribute('y'),
        shiftFs: shiftC.el.getAttribute('font-size'),
      });
    }
  });
}

/* ── Public API ────────────────────────────────── */
export function clearHints() {
  if (!loaded || !container) return;
  container.querySelectorAll('.key-hint,.key-correct,.key-wrong,.key-shift,.key-pressed,.key-shift-held')
           .forEach(el => el.classList.remove('key-hint','key-correct','key-wrong','key-shift','key-pressed','key-shift-held'));
}

export function showHint(key) {
  if (!loaded || !container) return;
  clearHints();
  const el = findKey(key);
  if (!el) return;
  el.classList.add('key-hint');
  if (needsShift(key)) findShiftKeys().forEach(s => s.classList.add('key-shift'));
}

export function flashCorrect(key) {
  if (!loaded || !container) return;
  const el = findKey(key);
  if (!el) return;
  el.classList.remove('key-hint', 'key-pressed');
  el.classList.add('key-correct');
  setTimeout(() => el.classList.remove('key-correct'), 350);
}

export function flashWrong(pressedKey, expectedKey) {
  if (!loaded || !container) return;
  const pressedEl  = findKey(pressedKey);
  const expectedEl = findKey(expectedKey);
  if (pressedEl) {
    pressedEl.classList.remove('key-pressed');
    pressedEl.classList.add('key-wrong');
    setTimeout(() => pressedEl.classList.remove('key-wrong'), 350);
  }
  if (expectedEl) {
    expectedEl.classList.remove('key-hint');
    void expectedEl.offsetWidth;
    expectedEl.classList.add('key-hint');
  }
  if (needsShift(expectedKey)) findShiftKeys().forEach(s => s.classList.add('key-shift'));
}

/**
 * flashKeyPress — dim amber flash for ANY key pressed.
 * Called immediately on every keydown for tactile SVG feedback.
 * Does nothing if the key already has a correct/wrong/hint animation.
 */
export function flashKeyPress(key) {
  if (!loaded || !container) return;
  const el = findKey(key);
  if (!el) return;
  if (el.classList.contains('key-correct') || el.classList.contains('key-wrong')) return;
  el.classList.remove('key-pressed');
  void el.offsetWidth; // reflow to restart animation
  el.classList.add('key-pressed');
  setTimeout(() => el.classList.remove('key-pressed'), 140);
}

/**
 * setShiftActive — toggle shift-held visual state.
 * Physically swaps x/y/font-size of main and shift text labels
 * in the SVG so shifted characters appear in the center and
 * normal characters recede to the top-left corner.
 */
export function setShiftActive(held) {
  if (!loaded || !container) return;
  container.classList.toggle('shift-active', held);
  findShiftKeys().forEach(s => s.classList.toggle('key-shift-held', held));

  keyLabelMap.forEach(({ mainEl, shiftEl, mainX, mainY, mainFs, shiftX, shiftY, shiftFs }) => {
    if (held) {
      // Bring shift label to center position
      if (shiftX !== null) shiftEl.setAttribute('x', mainX);
      if (shiftY !== null) shiftEl.setAttribute('y', mainY);
      if (mainFs)          shiftEl.setAttribute('font-size', mainFs);
      // Push main label to top-left
      if (mainX !== null)  mainEl.setAttribute('x', shiftX);
      if (mainY !== null)  mainEl.setAttribute('y', shiftY);
      if (shiftFs)         mainEl.setAttribute('font-size', shiftFs);
    } else {
      // Restore originals
      if (mainX !== null)  mainEl.setAttribute('x', mainX);
      if (mainY !== null)  mainEl.setAttribute('y', mainY);
      if (mainFs)          mainEl.setAttribute('font-size', mainFs);
      if (shiftX !== null) shiftEl.setAttribute('x', shiftX);
      if (shiftY !== null) shiftEl.setAttribute('y', shiftY);
      if (shiftFs)         shiftEl.setAttribute('font-size', shiftFs);
    }
  });
}

export function setVisible(visible) { if (container) container.style.display = visible ? '' : 'none'; }
export function getContainer() { return container; }