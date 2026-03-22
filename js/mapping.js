/**
 * mapping.js — Tamil99 keyboard: English key → Tamil character
 *
 * LAYOUT OVERVIEW
 * ────────────────
 * Left hand  = vowels (a-z row, s-x row, d-c row, g-v/b row)
 * Right hand = consonants (h-j-k-l-;-' home row + extensions)
 * Shift keys = Grantha letters, Ayutham, accounting symbols, ligatures
 *
 * Each exported function is pure (no DOM access).
 */

/* ── Core key → Tamil character map ─────────────────────────────── */
export const MAPPING = {

  /* ── Uyir Ezhuthu — 12 Vowels (LEFT hand) ── */
  a: 'அ',   // left pinky home row — short-a
  q: 'ஆ',   // left pinky top row — long-aa
  s: 'இ',   // left ring home row — short-i
  w: 'ஈ',   // left ring top row — long-ii
  d: 'உ',   // left middle home row — short-u
  e: 'ஊ',   // left middle top row — long-uu
  g: 'எ',   // left index home row — short-e
  t: 'ஏ',   // left index top row — long-ee
  r: 'ஐ',   // left index top row — ai
  c: 'ஒ',   // left index bottom row — short-o
  x: 'ஓ',   // left ring bottom row — long-oo
  z: 'ஔ',   // left pinky bottom row — au

  /* ── Otru / Pulli — vowel silencer ── */
  f: '்',    // left index home row

  /* ── Mei Ezhuthu — 18 Consonants (RIGHT hand) ── */
  h: 'க',   // right middle home row — ka
  b: 'ங',   // right index bottom row — nga
  '[': 'ச', // right pinky top row — cha
  ']': 'ஞ', // right pinky top row — nja
  o: 'ட',   // right ring top row — tta (retroflex)
  p: 'ண',   // right pinky home row — nna (retroflex)
  l: 'த',   // right ring home row — tha
  ';': 'ந', // right pinky home row — na
  j: 'ப',   // right index home row — pa
  k: 'ம',   // right middle home row — ma
  "'": 'ய', // right pinky home row — ya
  m: 'ர',   // right index bottom row — ra (rra light)
  n: 'ல',   // right index bottom row — la
  v: 'வ',   // right index home row — va
  '/': 'ழ', // right pinky bottom row — zha
  y: 'ள',   // right index top row — lla
  u: 'ற',   // right index top row — rra
  i: 'ன',   // right middle top row — nna (dental)

  /* ── Ayutha Ezhuthu ── */
  F: 'ஃ',   // Shift+f — unique aspirate

  /* ── Grantha letters (Shift + top row) ── */
  Q: 'ஸ',   // Shift+q
  W: 'ஷ',   // Shift+w
  E: 'ஜ',   // Shift+e
  R: 'ஹ',   // Shift+r
  T: 'க்ஷ', // Shift+t — ksha ligature
  Y: 'ஸ்ரீ', // Shift+y — Sri ligature

  /* ── Tamil Accounting Symbols (Shift + home/bottom row) ──────────
     Traditional Tamil ledger markers used in accounting, dates,
     and financial records. Each key produces the corresponding
     Tamil Unicode character when Shift is held.
     ──────────────────────────────────────────────────────────────── */
  A: '௹',   // Shift+a — Indian Rupee ௹ (ரூபாய்)
  Z: '௳',   // Shift+z — Tamil Day marker (நாள்)
  X: '௴',   // Shift+x — Tamil Month marker (மாதம்)
  C: '௵',   // Shift+c — Tamil Year marker (ஆண்டு)
  V: '௶',   // Shift+v — Tamil Debit / Pattru (பற்று)
  B: '௷',   // Shift+b — Tamil Credit / Kadan (கடன்)
  D: '௸',   // Shift+d — Tamil Ditto / As above (மேலே)
  S: '௺',   // Shift+s — Tamil Number sign (எண்)

  /* ── Space ── */
  ' ': '␣',
};

/* ── Helper: get Tamil char for a key ───────────────────────────── */
export function tamilOf(key) {
  return MAPPING[key] ?? key;
}

/* ── Helper: key → SVG group ID in Tamil99.svg ──────────────────── */
export function svgIdOf(key) {
  if (key === ' ') return 'Space';
  if (/^[a-z]$/.test(key)) return key.toUpperCase(); // 'a' → 'A', 'h' → 'H'
  return key; // uppercase letters and symbols already match SVG group IDs
}

/* ── Helper: does this key require Shift? ───────────────────────── */
export function needsShift(key) {
  return /^[A-Z]$/.test(key); // uppercase = shift-held key
}

/* ── Display text for the hint bar ──────────────────────────────── */
export function hintLabel(key) {
  if (key === ' ')        return 'Space';
  if (needsShift(key))    return `Shift + ${key.toLowerCase()}`;
  // Special labels for ambiguous keys
  const labels = {
    f:   'f  (்)',
    "'": "' (ய)",
    '[': '[ (ச)',
    ']': '] (ஞ)',
    ';': '; (ந)',
    '/': '/ (ழ)',
    m:   'm (ர)',
  };
  return labels[key] ?? key;
}