/**
 * பைந்தமிழ் — keyboard.js
 * ========================
 * Loads the Tamil99 SVG keyboard and manages all visual feedback.
 *
 * SHIFT SWAP — overview
 * ──────────────────────
 * Every key group <g id="X"> in Tamil99.svg contains:
 *   <path id="Center_N">   — main char, large, center of key
 *   <path id="Top-left_N"> — shift char, small, top-left corner
 *
 * When Shift is held:
 *   Center   → shrinks + moves to top-left position
 *   Top-left → grows  + moves to center position
 *
 * Scale is computed per-key from live getBBox() measurements (not fixed),
 * so number-row keys (digit ≈ same size as symbol) and letter keys
 * (top-left ≈ 50% of center) both look correct.
 *
 * ROBUSTNESS FIX for number row:
 * _findDirectDescendant() avoids accidentally grabbing a Center_ path
 * from a *nested* key group instead of the direct child. Previously
 * group.querySelector('[id^="Center_"]') would sometimes match a path
 * inside a child key group (e.g. key "1" group containing key "!" group),
 * producing the wrong transform target. The new helper skips nested
 * <g id="…"> children entirely.
 *
 * LAZY REBUILD:
 * If the keyboard container was hidden (display:none) when loadKeyboard()
 * ran, getBBox() returns {width:0} and the map is empty. setShiftActive()
 * detects this and calls _buildShiftMap() lazily before the first swap.
 */

import { svgIdOf, needsShift } from './mapping.js';
import { applyFingerData }     from './fingerGuide.js';

// ─── State ────────────────────────────────────────────────────────────────────
let loaded    = false;
let container = null;
let shiftHeld = false;
let _mapBuilt = false; // true once _buildShiftMap found at least one key pair

const shiftMap = new Map(); // groupId → {centerEl, topLeftEl, transforms…}

// ─── Load ─────────────────────────────────────────────────────────────────────
export async function loadKeyboard(containerId, svgPath = './assets/images/Tamil99.svg') {
  container = document.getElementById(containerId);
  if (!container) return;
  try {
    const resp = await fetch(svgPath);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    container.innerHTML = await resp.text();
    const svg = container.querySelector('svg');
    if (svg) {
      svg.removeAttribute('width');
      svg.removeAttribute('height');
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      if (!svg.getAttribute('viewBox')) svg.setAttribute('viewBox', '0 0 849 288');
    }
    applyFingerData(container);
    // Double rAF: first lets styles flush, second ensures full paint so getBBox() works.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      _buildShiftMap();
      loaded = true;
    }));
  } catch (err) {
    console.warn('[keyboard] SVG load failed:', err.message);
    container.innerHTML = '<div style="padding:.5rem;font-size:.75rem;color:var(--fg-3)">Place Tamil99.svg in assets/images/</div>';
  }
}

// ─── Shift map ────────────────────────────────────────────────────────────────
function _buildShiftMap() {
  shiftMap.clear();
  _mapBuilt = false;
  if (!container) return;
  let found = 0;

  container.querySelectorAll('g[id]').forEach(group => {
    // Match "Center" (exact, e.g. key "1") AND "Center_N" (e.g. "Center_19")
    // [id^="Center"] catches both since it only requires the string to START with "Center"
    const centerEl  = _findInGroup(group, '[id^="Center"]');
    const topLeftEl = _findInGroup(group, '[id^="Top-left"]');
    if (!centerEl || !topLeftEl || centerEl === topLeftEl) return;

    const centerOrig  = centerEl.getAttribute('transform')  ?? '';
    const topLeftOrig = topLeftEl.getAttribute('transform') ?? '';

    let cBox, tBox;
    try { cBox = centerEl.getBBox(); tBox = topLeftEl.getBBox(); }
    catch (_) { return; }

    // Skip if geometry not yet available (hidden container)
    if (cBox.width < 0.5 || tBox.width < 0.5) return;

    // Per-key scale: ratio of top-left size to center size, clamped to safe range
    const rawRatio  = Math.min(tBox.width / Math.max(cBox.width, 1),
                               tBox.height / Math.max(cBox.height, 1));
    const scaleDown = Math.max(0.28, Math.min(rawRatio, 0.75));
    const scaleUp   = Math.max(1.00, Math.min(1 / scaleDown, 2.60));

    const cCx = cBox.x + cBox.width  / 2;  const cCy = cBox.y + cBox.height / 2;
    const tCx = tBox.x + tBox.width  / 2;  const tCy = tBox.y + tBox.height / 2;
    const f = n => n.toFixed(3);

    shiftMap.set(group.id, {
      centerEl, topLeftEl, centerOrig, topLeftOrig,
      // Center → moves to top-left position at scaleDown size
      centerToTopLeft: `translate(${f(tCx - cCx*scaleDown)} ${f(tCy - cCy*scaleDown)}) scale(${f(scaleDown)})`,
      // Top-left → moves to center position at scaleUp size
      topLeftToCenter: `translate(${f(cCx - tCx*scaleUp  )} ${f(cCy - tCy*scaleUp  )}) scale(${f(scaleUp)})`,
    });
    found++;
  });

  _mapBuilt = found > 0;
  console.log(`[keyboard] shift map: ${found} keys`);
}

/**
 * _findInGroup(group, selector)
 * ──────────────────────────────
 * Finds the first element matching selector that is a direct path-level child
 * of group, skipping any nested <g id="…"> sibling key groups.
 * This prevents "key 1 group" from matching a Center_ path inside "key ! group"
 * when both happen to nest in the DOM.
 */
function _findInGroup(group, selector) {
  for (const child of group.children) {
    const tag = child.tagName.toLowerCase();
    // Hard skip: nested key group (has its own id)
    if (tag === 'g' && child.hasAttribute('id')) continue;
    if (child.matches(selector)) return child;
    // Recurse into anonymous wrapper <g> (no id — just structural grouping)
    if (tag === 'g') {
      const hit = child.querySelector(selector);
      if (hit) return hit;
    }
  }
  return null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function _findKey(key) {
  if (!loaded || !container) return null;
  const id = svgIdOf(key);
  if (!id) return null;
  return container.querySelector(`[id="${CSS.escape(id)}"]`);
}
function _findShiftKeys() {
  if (!loaded || !container) return [];
  return [...container.querySelectorAll('[id="Shift"], [id="Shift_2"]')];
}

// ─── Public API ───────────────────────────────────────────────────────────────
export function clearHints() {
  if (!loaded || !container) return;
  container.querySelectorAll('.key-hint,.key-correct,.key-wrong,.key-shift,.key-pressed,.key-shift-held')
    .forEach(el => el.classList.remove('key-hint','key-correct','key-wrong','key-shift','key-pressed','key-shift-held'));
}

export function showHint(key) {
  if (!loaded || !container) return;
  clearHints();
  const el = _findKey(key);
  if (!el) return;
  el.classList.add('key-hint');
  if (needsShift(key)) _findShiftKeys().forEach(s => s.classList.add('key-shift'));
}

export function flashCorrect(key) {
  if (!loaded || !container) return;
  const el = _findKey(key);
  if (!el) return;
  el.classList.remove('key-hint','key-pressed');
  el.classList.add('key-correct');
  setTimeout(() => el.classList.remove('key-correct'), 350);
}

export function flashWrong(pressedKey, expectedKey) {
  if (!loaded || !container) return;
  const pe = _findKey(pressedKey), ee = _findKey(expectedKey);
  if (pe) { pe.classList.remove('key-pressed'); pe.classList.add('key-wrong'); setTimeout(()=>pe.classList.remove('key-wrong'),350); }
  if (ee) { ee.classList.remove('key-hint'); void ee.offsetWidth; ee.classList.add('key-hint'); }
  if (needsShift(expectedKey)) _findShiftKeys().forEach(s => s.classList.add('key-shift'));
}

export function flashKeyPress(key) {
  if (!loaded || !container) return;
  const el = _findKey(key);
  if (!el) return;
  if (el.classList.contains('key-correct') || el.classList.contains('key-wrong')) return;
  el.classList.remove('key-pressed'); void el.offsetWidth;
  el.classList.add('key-pressed');
  setTimeout(() => el.classList.remove('key-pressed'), 140);
}

/**
 * setShiftActive(held)
 * ─────────────────────
 * Swaps path positions. Includes a lazy rebuild for the case where the
 * keyboard was hidden during loadKeyboard() and getBBox() returned zeros.
 */
export function setShiftActive(held) {
  if (!loaded || !container) return;
  // Lazy rebuild: if map is empty (was hidden during load), measure now
  if (!_mapBuilt && held) {
    _buildShiftMap();
  }
  if (shiftHeld === held) return;
  shiftHeld = held;

  container.classList.toggle('shift-active', held);
  _findShiftKeys().forEach(s => s.classList.toggle('key-shift-held', held));

  shiftMap.forEach(({ centerEl, topLeftEl, centerOrig, topLeftOrig, centerToTopLeft, topLeftToCenter }) => {
    if (held) {
      centerEl.setAttribute('transform',  centerToTopLeft);
      topLeftEl.setAttribute('transform', topLeftToCenter);
    } else {
      if (centerOrig)  centerEl.setAttribute('transform',  centerOrig);
      else             centerEl.removeAttribute('transform');
      if (topLeftOrig) topLeftEl.setAttribute('transform', topLeftOrig);
      else             topLeftEl.removeAttribute('transform');
    }
  });
}

export function setVisible(visible) { if (container) container.style.display = visible ? '' : 'none'; }
export function getContainer() { return container; }