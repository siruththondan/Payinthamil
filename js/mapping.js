/**
 * mapping.js — Tamil99 keyboard: English key → Tamil character
 *
 * Each exported constant / function is pure (no DOM access).
 */

/* ── Core key → Tamil character map ─────────────────────────────── */
export const MAPPING = {
  /* Uyir Ezhuthu — 12 Vowels */
  a: 'அ',   // short-a
  q: 'ஆ',   // long-aa
  s: 'இ',   // short-i
  w: 'ஈ',   // long-ii
  d: 'உ',   // short-u
  e: 'ஊ',   // long-uu
  g: 'எ',   // short-e
  t: 'ஏ',   // long-ee
  r: 'ஐ',   // ai
  c: 'ஒ',   // short-o
  x: 'ஓ',   // long-oo
  z: 'ஔ',   // au

  /* Otru / Pulli — vowel silencer */
  f: '்',

  /* Mei Ezhuthu — 18 Consonants */
  h: 'க',   // ka
  b: 'ங',   // nga
  '[': 'ச', // cha
  ']': 'ஞ', // nja
  o: 'ட',   // tta
  p: 'ண',   // nna (retroflex)
  l: 'த',   // tha
  ';': 'ந', // na
  j: 'ப',   // pa
  k: 'ம',   // ma
  "'": 'ய', // ya
  n: 'ல',   // la
  v: 'வ',   // va
  '/': 'ழ', // zha
  y: 'ள',   // lla
  u: 'ற',   // rra
  i: 'ன',   // nna (dental)

  /* Ayutha Ezhuthu */
  F: 'ஃ',

  /* Grantha letters (Shift + key) */
  Q: 'ஸ',
  W: 'ஷ',
  E: 'ஜ',
  R: 'ஹ',
  T: 'க்ஷ',
  Y: 'ஸ்ரீ',

  /* Rupee & Tamil-specific symbols */
  A: '₹',
  Z: '௳',   // Tamil day
  X: '௴',   // Tamil month
  C: '௵',   // Tamil year

  /* Space */
  ' ': '␣',
};

/* ── Helper: get Tamil char for a key ───────────────────────────── */
export function tamilOf(key) {
  return MAPPING[key] ?? key;
}

/* ── Helper: key → SVG group ID in Tamil99.svg ──────────────────── */
export function svgIdOf(key) {
  if (key === ' ') return 'Space';
  if (/^[a-z]$/.test(key)) return key.toUpperCase();
  return key; // uppercase letters, symbols — already match SVG ids
}

/* ── Helper: does this key need Shift? ──────────────────────────── */
export function needsShift(key) {
  return /^[A-Z]$/.test(key);
}

/* ── Display text for the hint bar ──────────────────────────────── */
export function hintLabel(key) {
  if (key === ' ') return 'Space';
  if (needsShift(key)) return `Shift + ${key.toLowerCase()}`;
  const labels = {
    f:   'f  (்)',
    "'": "' (ய)",
    '[': '[ (ச)',
    ']': '] (ஞ)',
    ';': '; (ந)',
    '/': '/ (ழ)',
  };
  return labels[key] ?? key;
}