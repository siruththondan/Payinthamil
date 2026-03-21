/**
 * பைந்தமிழ் — keyboard.js
 * ========================
 * Loads the Tamil99 SVG keyboard and manages all visual feedback.
 *
 * ARCHITECTURE
 * ─────────────
 * The Tamil99 SVG uses <path> elements (not <text>) for character labels.
 * IDs follow a predictable naming convention:
 *   "Center_N"    — main/unshifted character, large, positioned at key center
 *   "Top-left_N"  — shift/alternate character, small, positioned at top-left
 *   "Bottom-left_N" — third label on some keys (e.g. number row symbols)
 *
 * SHIFT SWAP APPROACH (content-neutral, position-based)
 * ───────────────────────────────────────────────────────
 * When the Shift key is held, we want the shift character to appear
 * prominently in the center and the main character to recede to top-left.
 *
 * We achieve this by physically moving the SVG paths using CSS transforms:
 *   Center_N  → translated + scaled DOWN to the Top-left_N position
 *   Top-left_N → translated + scaled UP   to the Center_N position
 *
 * Scale normalization: instead of computing per-key scale ratios (which
 * produce uneven visual sizes because path bounding boxes vary), we use a
 * FIXED scale factor (SHIFT_SCALE_DOWN = 0.52).  We only use getBBox() to
 * get the center-point positions for the translate, not for sizing.
 *
 * Transform formula (moves src_center → dst_center at scale s):
 *   translate(dst_cx − src_cx·s,  dst_cy − src_cy·s)  scale(s)
 *
 * MIT License — open source, contributions welcome.
 */

import { svgIdOf, needsShift } from './mapping.js';
import { applyFingerData }     from './fingerGuide.js';

// ─── Constants ────────────────────────────────────────────────────────────────

// ─── Module state ──────────────────────────────────────────────────────────────
let loaded    = false;
let container = null; // the #keyboard DOM element
let shiftHeld = false;

/**
 * shiftMap stores per-key data needed for the shift swap.
 * Map<groupId: string, {
 *   centerEl:         SVGElement,  — the Center_N path
 *   topLeftEl:        SVGElement,  — the Top-left_N path
 *   centerOrig:       string,      — original 'transform' attr of centerEl
 *   topLeftOrig:      string,      — original 'transform' attr of topLeftEl
 *   centerToTopLeft:  string,      — transform to apply to centerEl when shift held
 *   topLeftToCenter:  string,      — transform to apply to topLeftEl when shift held
 * }>
 */
const shiftMap = new Map();

// ─── SVG Loading ───────────────────────────────────────────────────────────────

/**
 * loadKeyboard(containerId, svgPath)
 * ─────────────────────────────────
 * Fetches the Tamil99 SVG, injects it into the container, and sets up all
 * per-key metadata (finger zones, shift swap).
 *
 * @param {string} containerId — id of the <div id="keyboard"> wrapper
 * @param {string} svgPath     — path to Tamil99.svg
 */
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
      // Ensure viewBox exists for proper scaling
      if (!svg.getAttribute('viewBox')) svg.setAttribute('viewBox', '0 0 849 288');
    }

    // Apply finger-zone data-finger attributes to each key group
    applyFingerData(container);

    // Build shift map after first paint so getBBox() returns real geometry
    requestAnimationFrame(() => {
      _buildShiftMap();
      loaded = true;
    });

  } catch (err) {
    console.warn('[keyboard] SVG load failed:', err.message);
    container.innerHTML = '<div style="padding:.5rem;font-size:.75rem;color:var(--fg-3)">Place Tamil99.svg in assets/images/</div>';
  }
}

// ─── Shift map construction ────────────────────────────────────────────────────

/**
 * _buildShiftMap()
 * ─────────────────
 * Iterates every <g id="..."> key group in the SVG, finds the Center_N and
 * Top-left_N child paths, computes the swap transforms, and stores them.
 *
 * Scale is computed PER KEY from the bbox ratio of the two paths, then clamped
 * to a sane range. This ensures number row keys (where the Tamil numeral path
 * is a similar size to the digit path) swap with the correct visual weight,
 * rather than overflowing or looking too small.
 *
 * Called once inside requestAnimationFrame after SVG insertion so that
 * getBBox() returns valid geometry.
 */
function _buildShiftMap() {
  shiftMap.clear();
  if (!container) return;

  container.querySelectorAll('g[id]').forEach(group => {
    const centerEl  = group.querySelector('[id^="Center_"]');
    const topLeftEl = group.querySelector('[id^="Top-left_"]');
    if (!centerEl || !topLeftEl || centerEl === topLeftEl) return;

    const centerOrig  = centerEl.getAttribute('transform')  ?? '';
    const topLeftOrig = topLeftEl.getAttribute('transform') ?? '';

    let cBox, tBox;
    try {
      cBox = centerEl.getBBox();
      tBox = topLeftEl.getBBox();
    } catch (_) { return; }

    if (cBox.width < 0.5 || tBox.width < 0.5) return;

    // ── Adaptive scale ──────────────────────────────────────────────────
    // Use the bbox-size ratio of top-left vs center path, clamped to a
    // visually sensible range. This handles:
    //   • Letter keys: top-left is ~45–55% of center (scaleDown ≈ 0.45–0.55)
    //   • Number keys: top-left Tamil numeral may be closer in size
    //     (scaleDown ≈ 0.55–0.70, so scaleUp ≈ 1.4–1.8 — fits within key)
    const rawRatio = Math.min(
      tBox.width  / Math.max(cBox.width,  1),
      tBox.height / Math.max(cBox.height, 1)
    );
    const scaleDown = Math.max(0.30, Math.min(rawRatio, 0.72));
    const scaleUp   = Math.max(1.00, Math.min(1 / scaleDown, 2.20));
    // ────────────────────────────────────────────────────────────────────

    const cCx = cBox.x + cBox.width  / 2;
    const cCy = cBox.y + cBox.height / 2;
    const tCx = tBox.x + tBox.width  / 2;
    const tCy = tBox.y + tBox.height / 2;

    // translate(dCx − sCx·s, dCy − sCy·s) scale(s)
    const downTx = tCx - cCx * scaleDown;
    const downTy = tCy - cCy * scaleDown;
    const upTx   = cCx - tCx * scaleUp;
    const upTy   = cCy - tCy * scaleUp;

    const fmt = n => n.toFixed(3);

    shiftMap.set(group.id, {
      centerEl, topLeftEl, centerOrig, topLeftOrig,
      centerToTopLeft: `translate(${fmt(downTx)} ${fmt(downTy)}) scale(${fmt(scaleDown)})`,
      topLeftToCenter: `translate(${fmt(upTx)} ${fmt(upTy)}) scale(${fmt(scaleUp)})`,
    });
  });

  console.log(`[keyboard] ${shiftMap.size} shift-swappable keys registered`);
}

// ─── Internal helpers ──────────────────────────────────────────────────────────

/** Find the key group element by Tamil99 key character */
function _findKey(key) {
  if (!loaded || !container) return null;
  const id = svgIdOf(key);
  if (!id) return null;
  return container.querySelector(`[id="${CSS.escape(id)}"]`);
}

/** Find both physical Shift key elements in the SVG */
function _findShiftKeys() {
  if (!loaded || !container) return [];
  return [...container.querySelectorAll('[id="Shift"], [id="Shift_2"]')];
}

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * clearHints()
 * ─────────────
 * Removes all visual state classes from every key.
 * Called before showing a new hint and on blur/cancel.
 */
export function clearHints() {
  if (!loaded || !container) return;
  container
    .querySelectorAll('.key-hint,.key-correct,.key-wrong,.key-shift,.key-pressed,.key-shift-held')
    .forEach(el => el.classList.remove(
      'key-hint','key-correct','key-wrong','key-shift','key-pressed','key-shift-held'
    ));
}

/**
 * showHint(key)
 * ─────────────
 * Highlights the expected key after HINT_DELAY (2s).
 * Also highlights Shift keys if the expected key requires shift.
 *
 * @param {string} key — the expected Tamil99 key character
 */
export function showHint(key) {
  if (!loaded || !container) return;
  clearHints();
  const el = _findKey(key);
  if (!el) return;
  el.classList.add('key-hint');
  if (needsShift(key)) _findShiftKeys().forEach(s => s.classList.add('key-shift'));
}

/**
 * flashCorrect(key)
 * ──────────────────
 * Green flash on the key the user just pressed correctly.
 *
 * @param {string} key — the key that was correctly pressed
 */
export function flashCorrect(key) {
  if (!loaded || !container) return;
  const el = _findKey(key);
  if (!el) return;
  el.classList.remove('key-hint', 'key-pressed');
  el.classList.add('key-correct');
  setTimeout(() => el.classList.remove('key-correct'), 350);
}

/**
 * flashWrong(pressedKey, expectedKey)
 * ─────────────────────────────────────
 * Red flash on the key that was wrongly pressed.
 * Keeps the hint glow on the expected key.
 *
 * @param {string} pressedKey  — what the user pressed
 * @param {string} expectedKey — what they should have pressed
 */
export function flashWrong(pressedKey, expectedKey) {
  if (!loaded || !container) return;
  const pe = _findKey(pressedKey);
  const ee = _findKey(expectedKey);

  if (pe) {
    pe.classList.remove('key-pressed');
    pe.classList.add('key-wrong');
    setTimeout(() => pe.classList.remove('key-wrong'), 350);
  }
  if (ee) {
    // Re-trigger the hint animation
    ee.classList.remove('key-hint');
    void ee.offsetWidth; // force reflow to restart CSS animation
    ee.classList.add('key-hint');
  }
  if (needsShift(expectedKey)) {
    _findShiftKeys().forEach(s => s.classList.add('key-shift'));
  }
}

/**
 * flashKeyPress(key)
 * ───────────────────
 * Dim amber flash for ANY key the user presses — provides immediate
 * tactile-like feedback on the SVG before the correct/wrong state is set.
 * Skipped if the key already has a correct/wrong animation running.
 *
 * @param {string} key — the key that was physically pressed
 */
export function flashKeyPress(key) {
  if (!loaded || !container) return;
  const el = _findKey(key);
  if (!el) return;
  // Don't interrupt ongoing correct/wrong flashes
  if (el.classList.contains('key-correct') || el.classList.contains('key-wrong')) return;
  el.classList.remove('key-pressed');
  void el.offsetWidth; // restart animation if already running
  el.classList.add('key-pressed');
  setTimeout(() => el.classList.remove('key-pressed'), 140);
}

/**
 * setShiftActive(held)
 * ─────────────────────
 * Swaps SVG path positions when the Shift key is held.
 *
 * held = true:
 *   Center_N  → moves to Top-left_N position at SHIFT_SCALE_DOWN size
 *   Top-left_N → moves to Center_N position at SHIFT_SCALE_UP size
 *   → Shift character appears prominently in the center
 *   → Unshifted character recedes to the top-left corner
 *
 * held = false:
 *   Both paths are restored to their original 'transform' attribute values.
 *
 * The deduplication guard (shiftHeld === held) prevents redundant DOM writes.
 *
 * @param {boolean} held — true when Shift is down, false when released
 */
export function setShiftActive(held) {
  if (!loaded || !container || shiftHeld === held) return;
  shiftHeld = held;

  // Toggle visual class on the container (can be used for extra CSS effects)
  container.classList.toggle('shift-active', held);

  // Highlight the physical Shift key(s)
  _findShiftKeys().forEach(s => s.classList.toggle('key-shift-held', held));

  // Apply/restore transforms on all registered key pairs
  shiftMap.forEach(({ centerEl, topLeftEl, centerOrig, topLeftOrig, centerToTopLeft, topLeftToCenter }) => {
    if (held) {
      centerEl.setAttribute('transform',  centerToTopLeft);
      topLeftEl.setAttribute('transform', topLeftToCenter);
    } else {
      // Restore: if original was empty string, remove the attribute entirely
      if (centerOrig)  centerEl.setAttribute('transform',  centerOrig);
      else             centerEl.removeAttribute('transform');
      if (topLeftOrig) topLeftEl.setAttribute('transform', topLeftOrig);
      else             topLeftEl.removeAttribute('transform');
    }
  });
}

/**
 * setVisible(visible)
 * ────────────────────
 * Show/hide the keyboard container element.
 * Used by view mode cycling (keyboard hidden in view modes 1 and 2).
 */
export function setVisible(visible) {
  if (container) container.style.display = visible ? '' : 'none';
}

/**
 * getContainer()
 * ───────────────
 * Returns the root keyboard container element.
 * Used by fingerGuide.js for the finger-zone overlay modal.
 */
export function getContainer() { return container; }