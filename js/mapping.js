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
  return /^[A-Z?!:]$/.test(key); // uppercase letters and ? ! : need Shift
}

/* ── Display text for the hint bar ──────────────────────────────── */
export function hintLabel(key) {
  if (key === ' ')        return 'Space';
  if (needsShift(key))    return `Shift + ${key.toLowerCase()}`;
  // Special labels for ambiguous keys
  const labels = {
    f:   'f  (க்)',
    "'": "' (ய)",
    '[': '[ (ச)',
    ']': '] (ஞ)',
    ';': '; (ந)',
    '/': '/ (ழ)',
    m:   'm (ர)',
  };
  return labels[key] ?? key;
}

// ── Tamil99 composition maps (used by practice and kural tabs) ──────────────

export const STANDALONE = {
  a:'அ',q:'ஆ',s:'இ',w:'ஈ',d:'உ',e:'ஊ',g:'எ',t:'ஏ',r:'ஐ',c:'ஒ',x:'ஓ',z:'ஔ',
  f:'்',
  h:'க',b:'ங','[':'ச',']':'ஞ',o:'ட',p:'ண',l:'த',';':'ந',
  i:'ன',j:'ப',k:'ம',"'":'ய',m:'ர',n:'ல',v:'வ','/':'ழ',y:'ள',u:'ற',
  Q:'ஸ',W:'ஷ',E:'ஜ',R:'ஹ',F:'ஃ',
  // Tamil accounting symbols
  A:'௹',Z:'௳',X:'௴',C:'௵',V:'௶',B:'௷',D:'௸',S:'௺',
};

export const MATRA = {q:'ா',s:'ி',w:'ீ',d:'ு',e:'ூ',g:'ெ',t:'ே',r:'ை',c:'ொ',x:'ோ',z:'ௌ'};

export const SYL_CONS = new Set(['h','j','k','l',';',"'",'n','v','u','i','o','p','[',']','b','y','/','m','Q','W','E','R','F']);
export const SYL_VOW  = new Set(['q','s','w','d','e','g','t','r','c','x','z','f']);

export function composedForm(c, v) {
  return (STANDALONE[c] ?? c) + (v === 'f' ? '்' : (MATRA[v] ?? ''));
}

export function buildSyls(keys) {
  const syls = [], map = new Array(keys.length);
  let i = 0;
  while (i < keys.length) {
    const k = keys[i], si = syls.length;
    if (k === ' ') {
      syls.push({ keys: [' '], isSpace: true, start: i, display: ' ' });
      map[i] = si; i++;
    } else if (SYL_CONS.has(k) && i + 1 < keys.length && SYL_VOW.has(keys[i + 1])) {
      const v = keys[i + 1];
      syls.push({ keys: [k, v], start: i, display: composedForm(k, v) });
      map[i] = si; map[i + 1] = si; i += 2;
    } else {
      syls.push({ keys: [k], start: i, display: STANDALONE[k] ?? k });
      map[i] = si; i++;
    }
  }
  return { syls, map };
}

// ── Reverse maps: Tamil char → key (used by lessons and kural tabs) ────────

const MATRA_R = {'ா':'q','ி':'s','ீ':'w','ு':'d','ூ':'e','ெ':'g','ே':'t','ை':'r','ொ':'c','ோ':'x','ௌ':'z'};
const STANDALONE_R = (() => {
  const m = {};
  for (const [k, v] of Object.entries(STANDALONE)) {
    if (typeof v === 'string' && v.length === 1) m[v] = k;
  }
  return m;
})();

export function tamilToKeys(text) {
  text = text.normalize('NFC');
  const keys = [];
  for (const ch of text) {
    if (MATRA_R[ch] !== undefined) { keys.push(MATRA_R[ch]); continue; }
    if (STANDALONE_R[ch] !== undefined) { keys.push(STANDALONE_R[ch]); continue; }
    keys.push(ch); // punctuation, spaces, numerals kept as-is
  }
  return keys;
}
/**
 * tamilToTypeableKeys — like tamilToKeys, but for free-form typing content
 * (e.g. Thirukkural). Strips zero-width characters, collapses whitespace to a
 * single space, and drops any key the Tamil99 layout cannot produce, so an
 * un-typeable key (punctuation, digits, ZWJ...) never enters the stream.
 * Leading/trailing/duplicate spaces are removed.
 */
export function tamilToTypeableKeys(text) {
  const cleaned = String(text ?? '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    // ASCII punctuation/letters in source text (e.g. ';' ',' '\'') would be mistaken for
    // Tamil99 keys (';' = ந), so they are dropped before key conversion.
    .replace(/[\x21-\x7E]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const out = [];
  for (const k of tamilToKeys(cleaned)) {
    if (k === ' ') { if (out.length && out[out.length - 1] !== ' ') out.push(k); continue; }
    if (STANDALONE[k] !== undefined || MATRA[k] !== undefined) out.push(k);
  }
  while (out.length && out[out.length - 1] === ' ') out.pop();
  return out;
}
