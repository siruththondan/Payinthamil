/**
 * lessons.js — 34 progressive lessons, redesigned for hand balance.
 *
 * DESIGN PRINCIPLE:
 *   Tamil99 layout: consonants on the RIGHT hand, vowels on the LEFT.
 *   A CV syllable (e.g. கா = h + q) naturally alternates hands.
 *   → Start RIGHT-hand consonants in lesson 1, pair with LEFT-hand vowels immediately.
 *   → Never drill one hand alone for more than 2 consecutive lessons.
 */

const sp = ' ';
const PU = 'f'; // pulli ்

/* ── Helpers ──────────────────────────────────────── */

function times(arr, n) {
  return Array.from({ length: n }, () => [...arr]).flat();
}

// Drill a key list: each key r times then space
function drill(keys, r = 4) {
  return keys.flatMap(k => [...Array(r).fill(k), sp]);
}

/**
 * walk() — improved to avoid monotonous repetition.
 * Uses variable word lengths (2–5 chars) and prevents
 * the same key appearing more than twice in a row.
 */
function walk(keys, total = 120) {
  if (!keys.length) return [];
  const out = [];
  let seed = (keys.length * 31 + total) | 0;
  const rand = () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed;
  };
  let last = -1, streak = 0;
  let wordLen = 2 + (rand() % 4);
  let pos = 0;

  for (let i = 0; i < total; i++) {
    let next = rand() % keys.length;
    if (next === last) {
      streak++;
      if (streak >= 2) next = (next + 1) % keys.length;
    } else {
      streak = 0;
    }
    last = next;
    out.push(keys[next]);
    pos++;
    if (pos >= wordLen) {
      out.push(sp);
      pos = 0;
      wordLen = 2 + (rand() % 4);
    }
  }
  if (out[out.length - 1] !== sp) out.push(sp);
  return out;
}

// CV syllables: every consonant × every vowel, spaced
function cvSyllables(cons, vowels, repeat = 2) {
  const out = [];
  for (let r = 0; r < repeat; r++) {
    for (const c of cons) {
      for (const v of vowels) {
        out.push(c, v, sp);
      }
    }
  }
  return out;
}

// Render a word bank: each word is a key array, repeated r times
function wordBank(wordList, repeat = 3) {
  const out = [];
  for (let r = 0; r < repeat; r++) {
    for (const w of wordList) {
      out.push(...w, sp);
    }
  }
  return out;
}

// Mix new keys with review keys, natural spacing throughout
function mix(newKeys, reviewKeys, newCount = 100, reviewCount = 40) {
  const out = [];
  out.push(...drill(newKeys, 3));
  out.push(...walk(newKeys, newCount));
  if (reviewKeys.length) {
    out.push(...walk(reviewKeys, reviewCount));
    for (let i = 0; i < 20; i++) {
      out.push(newKeys[i % newKeys.length]);
      out.push(reviewKeys[i % reviewKeys.length]);
      if ((i + 1) % 3 === 0) out.push(sp);
    }
    if (out[out.length - 1] !== sp) out.push(sp);
  }
  return out;
}

/* ── Key groups ───────────────────────────────────── */
const V_A   = ['a', 'q'];          // அ ஆ — left pinky
const V_I   = ['s', 'w'];          // இ ஈ — left ring
const V_U   = ['d', 'e'];          // உ ஊ — left middle
const V_E   = ['g', 't', 'r'];     // எ ஏ ஐ — left index
const V_O   = ['c', 'x', 'z'];     // ஒ ஓ ஔ — left index/pinky
const V_ALL = [...V_A, ...V_I, ...V_U, ...V_E, ...V_O];
const C_HR  = ['h', 'j', 'k', 'l', ';', "'"]; // home row right
const C_LV  = ['n', 'v'];          // ல வ
const C_RN  = ['u', 'i'];          // ற ன
const C_OPN = ['o', 'p'];          // ட ண
const C_CH  = ['[', ']'];          // ச ஞ
const C_REST = ['b', 'y', '/'];    // ங ள ழ
const C_ALL = [...C_HR, ...C_LV, ...C_RN, ...C_OPN, ...C_CH, ...C_REST];

/* ── Tamil word banks (key arrays) ───────────────── */
// Note: each array is a sequence of Tamil99 keys for one word.
// Consonant keys = right hand; vowel keys = left hand — natural alternation.

// Basic words: only home-row keys + a, q
const W_AA = [
  ['h', 'q'],             // கா
  ['j', 'q'],             // பா
  ['k', 'q'],             // மா
  ['l', 'q'],             // தா
  [';', 'q'],             // நா
  ["'", 'q'],             // யா
];
const W_AMMAPPA = [
  ['a', 'k', PU, 'k', 'q'],  // அம்மா
  ['a', 'j', PU, 'j', 'q'],  // அப்பா
  ['h', 'j', PU, 'j', 'q'],  // கப்பா
];
const W_KAL = [
  ['h', 'n', PU],             // கல்
  ['k', 'n', PU],             // மல்
  ['v', 'n', PU],             // வல்
  [';', 'n', PU],             // நல்
  ['l', 'n', PU],             // தல்
  ['j', 'n', PU],             // பல்
];
const W_VALI = [
  ['v', 'n', 's'],            // வலி
  ['k', 'l', 's'],            // மதி
  ['h', 'l', 's'],            // கதி
  ['h', 'v', 's'],            // கவி
  [';', 'l', 's'],            // நதி
  ['n', 'l', 's'],            // லதி
];
const W_NALLA = [
  [';', 'n', PU, 'n', 'a'],   // நல்ல
  ['h', 'n', PU, 'n', 'a'],   // கல்லா
  ['v', 'q'],                  // வா
  ['k', 'q'],                  // மா
];
const W_NAADU = [
  [';', 'q', 'o', 'd'],        // நாடு
  ['v', 'w', 'o', 'd'],        // வீடு
  [';', 'q', 'k', PU],         // நாம்
  ['l', 'k', PU],               // தம்
];
const W_WORDS2 = [
  ['k', 'h', 'i', PU],         // மகன்
  ['h', 'q', 'n', 'a', 'k', PU], // காலம்
  [';', 'q', 'k', PU],         // நாம்
  ['l', 'k', PU],               // தம்
  ['h', 'q', 'n', 'a'],         // கால
  ['k', 'n', 'a', 'u', PU],     // மலர்
];
const W_SPEED = [
  ['h', 'q'],  ['k', 'q'],  ['j', 'q'],  ['v', 'q'],
  [';', 'q'],  ['n', PU],   ['h', 'n', PU], ['v', 'n', 's'],
  ['k', 'l', 's'], ['h', 'v', 's'],
];

/* ════════════════════════════════════════════════════
   LESSONS DATABASE
═══════════════════════════════════════════════════ */
export const LESSONS_DB = {

  /* ══════════════ BEGINNER (20) ════════════════
     Strategy: introduce right-hand consonants from
     lesson 1, always paired with left-hand vowels.
     CV syllables (consonant+vowel) alternate hands
     naturally in Tamil99.                          */
  beginner: [

    /* ─── L01: Right home row — க, ப ─────────────
       Introduces h, j (right middle/index fingers).
       Pairs with a, q (left pinky) from the start.
       Every syllable like "கா" = right then left.  */
    {
      id: 'b01', order: 1, level: 'beginner',
      title: 'க ப',
      description: 'h j — first right-hand keys',
      focusKeys: ['h', 'j', PU, 'a', 'q'], targetWPM: 10,
      content: [
        // Right hand drill
        ...drill(['h'], 5), ...drill(['j'], 5),
        // Pulli forms — same hand, teaches the finger
        ...times(['h', PU, sp, 'j', PU, sp], 5),
        // NOW add left hand: vowels a, q
        // CV syllables = right + left alternation
        ...times(['h', 'a', sp, 'j', 'a', sp], 5),
        ...times(['h', 'q', sp, 'j', 'q', sp], 5),
        // Mixed walk — variable word lengths
        ...walk(['h', 'j'], 60),
        // Words using only these keys
        ...wordBank(W_AA.slice(0, 2), 5),   // கா பா
        ...wordBank(W_AMMAPPA.slice(2), 5), // கப்பா
        // Pulli + vowel mix
        ...times(['h', PU, sp, 'h', 'q', sp, 'j', PU, sp, 'j', 'a', sp], 6),
        ...walk(['h', 'j', 'h', PU, 'j', PU, 'h', 'a', 'j', 'q'], 60),
      ],
    },

    /* ─── L02: ம, த added ─────────────────────────
       k, l (right ring/middle). Two new right-hand
       keys + a, q vowels continue.                 */
    {
      id: 'b02', order: 2, level: 'beginner',
      title: 'ம த',
      description: 'k l — right hand extends',
      focusKeys: ['k', 'l', PU, 'a', 'q'], targetWPM: 10,
      content: [
        ...drill(['k'], 5), ...drill(['l'], 5),
        ...times(['k', PU, sp, 'l', PU, sp], 5),
        // Vowels
        ...times(['k', 'a', sp, 'l', 'a', sp, 'k', 'q', sp, 'l', 'q', sp], 4),
        // All 4 home keys
        ...walk(['h', 'j', 'k', 'l'], 70),
        // Words: மா, தா, கா, பா
        ...wordBank(W_AA.slice(0, 4), 4),
        // Pulli combos
        ...times(['h', PU, sp, 'k', PU, sp, 'j', PU, sp, 'l', PU, sp], 4),
        // CV with review
        ...cvSyllables(['k', 'l'], ['a', 'q'], 3),
        ...walk(['h', 'j', 'k', 'l', 'h', PU, 'k', PU, 'j', 'q', 'l', 'a'], 70),
      ],
    },

    /* ─── L03: ந, ய — complete home row right ─────
       ;, ' (right pinky). Now all 6 home-row
       consonants covered (right hand).             */
    {
      id: 'b03', order: 3, level: 'beginner',
      title: 'ந ய',
      description: "; ' — right pinky, home row complete",
      focusKeys: [';', "'", PU, 'a', 'q'], targetWPM: 12,
      content: [
        ...drill([';'], 5), ...drill(["'"], 5),
        ...times([';', PU, sp, "'", PU, sp], 5),
        ...times([';', 'q', sp, "'", 'q', sp, ';', 'a', sp, "'", 'a', sp], 4),
        // All home row consonants
        ...walk(['h', 'j', 'k', 'l', ';', "'"], 80),
        // Words: நா, யா + review
        ...wordBank(W_AA, 3),
        // Home row + pulli
        ...times(['h', PU, 'j', PU, sp, 'k', PU, 'l', PU, sp, ';', PU, "'", PU, sp], 4),
        ...cvSyllables([';', "'"], ['a', 'q'], 3),
        ...walk(['h', 'j', 'k', 'l', ';', "'", 'h', 'q', 'k', 'q', ';', 'q'], 80),
      ],
    },

    /* ─── L04: இ ஈ added (left ring) ─────────────
       s, w vowels. Left hand focus but combined with
       all 6 right-hand home consonants.            */
    {
      id: 'b04', order: 4, level: 'beginner',
      title: 'இ ஈ',
      description: 's w (left ring) + home consonants',
      focusKeys: ['s', 'w', 'h', 'j', 'k', 'l'], targetWPM: 12,
      content: [
        ...drill(['s'], 5), ...drill(['w'], 5),
        // s, w with all home consonants
        ...cvSyllables(['h', 'j', 'k', 'l', ';', "'"], ['s', 'w'], 2),
        // Mix with a, q
        ...walk(['h', 'j', 'k', 'l', ';', "'"], 60),
        ...cvSyllables(['h', 'j'], ['a', 'q', 's', 'w'], 2),
        // Words: வலி, மதி, கதி
        ...wordBank(W_VALI, 4),
        ...times(['h', 's', sp, 'k', 's', sp, 'j', 'w', sp, 'l', 'w', sp], 4),
        // Review: home row + a, q, s, w
        ...walk(['h', 'j', 'k', 'l', 'h', 'a', 'k', 's', 'j', 'q', 'l', 'w'], 80),
      ],
    },

    /* ─── L05: உ ஊ (left middle) ──────────────── */
    {
      id: 'b05', order: 5, level: 'beginner',
      title: 'உ ஊ',
      description: 'd e (left middle) + consonant review',
      focusKeys: ['d', 'e', 'h', 'j', 'k', PU], targetWPM: 12,
      content: [
        ...drill(['d'], 5), ...drill(['e'], 5),
        ...cvSyllables(['h', 'j', 'k', 'l', ';', "'"], ['d', 'e'], 2),
        // With all vowels so far
        ...cvSyllables(['h', 'j'], ['a', 'q', 's', 'w', 'd', 'e'], 2),
        ...wordBank(W_NAADU, 4),
        ...times(['h', 'd', sp, 'k', 'e', sp, ';', 'd', sp, 'j', 'e', sp], 4),
        ...walk(['h', 'j', 'k', 'l', 'h', 'd', 'k', 'e', ';', 'd', "'", 'e'], 80),
        ...walk([...C_HR, 'd', 'e', 'a', 'q', 's', 'w'], 60),
      ],
    },

    /* ─── L06: ல வ (right index ext) ─────────────
       n, v — right index stretches down. These are
       very common consonants in Tamil.             */
    {
      id: 'b06', order: 6, level: 'beginner',
      title: 'ல வ',
      description: 'n v — right index, very common',
      focusKeys: ['n', 'v', PU, 'a', 'q', 's'], targetWPM: 14,
      content: [
        ...drill(['n'], 5), ...drill(['v'], 5),
        ...times(['n', PU, sp, 'v', PU, sp], 5),
        // With basic vowels
        ...cvSyllables(['n', 'v'], ['a', 'q', 's', 'w'], 3),
        // கல் மல் வல் நல்
        ...wordBank(W_KAL, 4),
        // வலி, வா, நல்ல
        ...wordBank(W_VALI.slice(0, 3), 3),
        ...wordBank(W_NALLA, 4),
        // Mix with home row
        ...mix(['n', 'v'], [...C_HR, 'a', 'q', 's'], 80, 40),
        ...walk(['h', 'j', 'k', 'n', 'v', 'l', 'h', 'q', 'v', 'q', 'n', PU], 80),
      ],
    },

    /* ─── L07: ற ன (right index ext) ─────────────
       u, i — common especially in word endings.   */
    {
      id: 'b07', order: 7, level: 'beginner',
      title: 'ற ன',
      description: 'u i — right index, endings',
      focusKeys: ['u', 'i', PU, 'a', 'q', ...C_HR], targetWPM: 14,
      content: [
        ...drill(['u'], 5), ...drill(['i'], 5),
        ...times(['u', PU, sp, 'i', PU, sp], 5),
        ...cvSyllables(['u', 'i'], ['a', 'q', 's', 'w'], 3),
        // Words ending in ன்/ற்
        ...wordBank(W_WORDS2.slice(0, 2), 4),
        // Mix with n, v and home row
        ...mix(['u', 'i'], ['n', 'v', ...C_HR, 'a', 'q'], 80, 40),
        ...walk(['u', 'i', 'n', 'v', 'h', 'j', 'k', 'u', PU, 'i', PU], 80),
      ],
    },

    /* ─── L08: Home row — full review with words ── */
    {
      id: 'b08', order: 8, level: 'beginner',
      title: 'Home Row',
      description: 'க–ய + ல வ ற ன — all so far',
      focusKeys: [...C_HR, ...C_LV, ...C_RN, PU, 'a', 'q'], targetWPM: 16,
      content: [
        // Quick drill all consonants
        ...drill([...C_HR, ...C_LV, ...C_RN], 2),
        // CV syllables
        ...cvSyllables([...C_HR, ...C_LV], ['a', 'q', 's'], 1),
        // Tamil words
        ...wordBank(W_AA, 3),
        ...wordBank(W_AMMAPPA, 4),
        ...wordBank(W_KAL, 3),
        ...wordBank(W_VALI, 3),
        ...wordBank(W_NALLA, 4),
        ...wordBank(W_WORDS2, 3),
        // Walk with all keys
        ...walk([...C_HR, ...C_LV, ...C_RN, 'h', 'q', 'k', 's', 'n', PU], 100),
      ],
    },

    /* ─── L09: எ ஏ ஐ (left index) ────────────── */
    {
      id: 'b09', order: 9, level: 'beginner',
      title: 'எ ஏ ஐ',
      description: 'g t r — left index vowels',
      focusKeys: ['g', 't', 'r', ...C_HR, PU], targetWPM: 14,
      content: [
        ...drill(['g'], 4), ...drill(['t'], 4), ...drill(['r'], 4),
        ...cvSyllables([...C_HR], ['g', 't', 'r'], 2),
        ...cvSyllables(['h', 'j', 'k'], ['a', 'q', 'g', 't', 'r'], 2),
        ...times(['h', 'g', sp, 'k', 't', sp, 'j', 'r', sp, 'l', 'g', sp], 4),
        ...mix(['g', 't', 'r'], [...C_HR, 'a', 'q', 's', 'd'], 80, 50),
        ...walk([...C_HR, 'g', 't', 'r', 'n', 'v', 'h', 't', 'k', 'g'], 100),
      ],
    },

    /* ─── L10: ட ண (right middle+ring) ─────────── */
    {
      id: 'b10', order: 10, level: 'beginner',
      title: 'ட ண',
      description: 'o p — retroflex, right hand',
      focusKeys: ['o', 'p', PU, 'a', 'q', ...C_HR], targetWPM: 14,
      content: [
        ...drill(['o'], 5), ...drill(['p'], 5),
        ...times(['o', PU, sp, 'p', PU, sp], 5),
        ...cvSyllables(['o', 'p'], ['a', 'q', 's', 'w', 'd'], 3),
        // நாடு, வீடு
        ...wordBank(W_NAADU, 4),
        ...mix(['o', 'p'], [...C_HR, ...C_LV, ...C_RN, 'a', 'q'], 80, 50),
        ...walk(['o', 'p', 'u', 'i', 'n', 'v', 'h', 'j', 'o', PU, 'p', PU], 80),
      ],
    },

    /* ─── L11: ஒ ஓ ஔ (left index/pinky) ─────── */
    {
      id: 'b11', order: 11, level: 'beginner',
      title: 'ஒ ஓ ஔ',
      description: 'c x z — left hand, rare vowels',
      focusKeys: ['c', 'x', 'z', ...C_HR, PU], targetWPM: 14,
      content: [
        ...drill(['c'], 4), ...drill(['x'], 4), ...drill(['z'], 4),
        ...cvSyllables([...C_HR.slice(0, 4)], ['c', 'x', 'z'], 2),
        ...times(['h', 'c', sp, 'k', 'x', sp, 'j', 'z', sp, 'l', 'c', sp], 4),
        ...mix(['c', 'x', 'z'], [...V_A, ...V_I, ...V_U, ...V_E, ...C_HR], 80, 50),
        ...walk([...C_HR, 'c', 'x', 'z', 'a', 'q', 's', 'w'], 100),
      ],
    },

    /* ─── L12: ச ஞ ── right pinky reach ─────── */
    {
      id: 'b12', order: 12, level: 'beginner',
      title: 'ச ஞ',
      description: '[ ] — right pinky reach',
      focusKeys: ['[', ']', PU, 'a', 'q', ...C_HR], targetWPM: 16,
      content: [
        ...drill(['['], 5), ...drill([']'], 5),
        ...times(['[', PU, sp, ']', PU, sp], 5),
        ...cvSyllables(['[', ']'], ['a', 'q', 's', PU], 3),
        ...mix(['[', ']'], [...C_HR, ...C_LV, 'a', 'q'], 80, 50),
        ...walk(['[', ']', 'o', 'p', 'u', 'i', 'h', 'j', '[', PU, ']', PU], 80),
      ],
    },

    /* ─── L13: ங ள ழ — bottom row ──────────── */
    {
      id: 'b13', order: 13, level: 'beginner',
      title: 'ங ள ழ',
      description: 'b y / — bottom row right',
      focusKeys: ['b', 'y', '/', PU, 'a', 'q'], targetWPM: 16,
      content: [
        ...drill(['b'], 5), ...drill(['y'], 5), ...drill(['/'], 5),
        ...times(['b', PU, sp, 'y', PU, sp, '/', PU, sp], 4),
        ...cvSyllables(['b', 'y', '/'], ['a', 'q', 's', PU], 3),
        ...mix(['b', 'y', '/'], [...C_HR, ...C_LV, ...C_RN, 'a', 'q'], 80, 50),
        ...walk(['b', 'y', '/', '[', ']', 'o', 'p', 'a', 'q'], 100),
      ],
    },

    /* ─── L14: All 18 consonants ─────────────── */
    {
      id: 'b14', order: 14, level: 'beginner',
      title: 'All 18 Consonants',
      description: 'மெய் எழுத்து — full review',
      focusKeys: [...C_ALL, PU], targetWPM: 18,
      content: [
        ...C_ALL.flatMap(k => [...Array(3).fill(k), sp]),
        ...C_ALL.flatMap(k => [k, PU, sp]),
        ...C_ALL.flatMap(k => [k, 'a', sp]),
        ...C_ALL.flatMap(k => [k, 'q', sp]),
        ...walk([...C_ALL, 'h', PU, 'k', PU, 'n', PU, 'v', PU], 100),
        ...cvSyllables([...C_HR, ...C_LV], ['a', 'q', 's'], 1),
        ...walk(C_ALL.flatMap(k => [k, PU, k, 'a']), 120),
      ],
    },

    /* ─── L15: All 12 vowels standalone ─────── */
    {
      id: 'b15', order: 15, level: 'beginner',
      title: 'All 12 Vowels',
      description: 'உயிர் எழுத்து — left hand mastery',
      focusKeys: V_ALL, targetWPM: 18,
      content: [
        ...drill(V_ALL, 3),
        ...walk([...V_A, ...V_I, ...V_U], 80),
        ...walk([...V_E, ...V_O], 60),
        // Pair with consonants for context
        ...cvSyllables(['h', 'j', 'k'], V_ALL, 1),
        ...walk(V_ALL, 80),
        'a', 'q', sp, 's', 'w', sp, 'd', 'e', sp, 'g', 't', sp, 'r', sp, 'c', 'x', sp, 'z', sp,
        ...times([...V_A, ...V_I, ...V_U, sp, ...V_E, ...V_O, sp], 4),
        ...walk(V_ALL, 80),
      ],
    },

    /* ─── L16: Consonants × all vowels ──────── */
    {
      id: 'b16', order: 16, level: 'beginner',
      title: 'CV Combinations',
      description: 'Consonant + all vowel forms',
      focusKeys: [...C_HR, ...C_LV, PU, ...V_ALL], targetWPM: 18,
      content: [
        ...cvSyllables(['h', 'j', 'k'], V_ALL, 2),
        ...cvSyllables(['l', ';', "'"], V_ALL, 2),
        ...cvSyllables(['n', 'v', 'u', 'i'], V_ALL.slice(0, 8), 2),
        ...walk([...C_HR, ...C_LV].flatMap(k => [k, 'a', k, 'q', k, 's', k, PU]), 120),
      ],
    },

    /* ─── L17: pulli cluster patterns ───────── */
    {
      id: 'b17', order: 17, level: 'beginner',
      title: '் Pulli Patterns',
      description: 'Consonant clusters with pulli',
      focusKeys: [PU, ...C_HR, ...C_LV, 'a', 'q'], targetWPM: 18,
      content: [
        ...C_ALL.flatMap(k => [k, PU, sp, k, PU, sp]),
        'h', 'q', 'j', PU, sp, 'k', 'a', 'l', PU, sp, 'n', 'q', 'v', PU, sp,
        ';', 'a', "'", PU, sp, 'u', 'q', 'i', PU, sp,
        'h', PU, 'j', PU, sp, 'k', PU, 'l', PU, sp, 'n', PU, 'v', PU, sp,
        // All forms of h
        'h', 'a', 'h', 'q', 'h', 's', 'h', 'w', 'h', 'd', 'h', 'e', 'h', PU, sp,
        // All forms of k
        'k', 'a', 'k', 'q', 'k', 's', 'k', 'w', 'k', 'd', 'k', 'e', 'k', PU, sp,
        ...walk([...C_HR, 'a', 'q', 's', PU], 100),
        ...wordBank(W_AMMAPPA, 5),
        ...wordBank(W_NALLA, 5),
        ...wordBank(W_WORDS2, 4),
      ],
    },

    /* ─── L18: Common words I ────────────────── */
    {
      id: 'b18', order: 18, level: 'beginner',
      title: 'Common Words I',
      description: 'அம்மா · அப்பா · நல்ல · வீடு',
      focusKeys: ['a', 'k', 'j', 'l', 'n', 'v', ';', PU, 'q'], targetWPM: 20,
      content: [
        ...times(['a', 'k', PU, 'k', 'q', sp], 8),
        ...times(['a', 'j', PU, 'j', 'q', sp], 8),
        ...times([';', 'n', PU, 'n', 'a', sp], 8),
        ...times(['v', 'w', 'o', 'd', sp], 7),
        ...times([';', 'q', 'o', 'd', sp], 7),
        ...times(['k', 'h', 'i', PU, sp], 6),
        ...times([';', 'q', 'k', PU, sp], 6),
        ...times(['l', 'k', PU, sp], 7),
        ...wordBank(W_AMMAPPA, 5),
        ...wordBank(W_NALLA, 5),
        ...wordBank(W_NAADU, 4),
        ...wordBank(W_WORDS2, 4),
        ...walk(['a', 'k', 'j', 'n', 'v', 'l', ';', 'h', PU, 'a', 'q'], 100),
      ],
    },

    /* ─── L19: Common words II ───────────────── */
    {
      id: 'b19', order: 19, level: 'beginner',
      title: 'Common Words II',
      description: 'கல் · மல் · கவி · நாடு · மலர்',
      focusKeys: ['h', 'k', 'n', 'v', ';', PU, 'a', 'q', 's'], targetWPM: 22,
      content: [
        ...times(['h', 'n', PU, sp], 8),
        ...times(['k', 'n', PU, sp], 8),
        ...times(['v', 'n', PU, sp], 8),
        ...times([';', 'n', PU, sp], 8),
        ...times(['l', 'n', 'a', sp], 8),
        ...times(['h', 'k', 'n', 'a', sp], 6),
        ...times(['h', 'v', 's', sp], 8),
        ...times(['k', 'v', 's', sp], 8),
        ...wordBank(W_KAL, 5),
        ...wordBank(W_VALI, 4),
        ...times([...W_KAL[0], sp, ...W_KAL[1], sp, ...W_VALI[0], sp, ...W_VALI[1], sp], 4),
        ...walk(['h', 'k', 'l', 'n', 'v', ';', PU, 'a', 'q', 's'], 100),
      ],
    },

    /* ─── L20: Beginner final drill ─────────── */
    {
      id: 'b20', order: 20, level: 'beginner',
      title: 'Beginner — Final',
      description: 'Full keyboard at speed',
      focusKeys: [...V_ALL, ...C_ALL, PU], targetWPM: 22,
      content: [
        ...walk(V_ALL, 60),
        ...walk(C_ALL.flatMap(k => [k, 'a', k, PU]), 120),
        ...cvSyllables([...C_HR, ...C_LV], V_ALL.slice(0, 6), 1),
        ...wordBank([...W_AA, ...W_KAL, ...W_VALI, ...W_AMMAPPA], 2),
        'h', 'q', sp, 'j', 'a', sp, 'k', 's', sp, 'l', 'q', sp,
        ';', 'a', sp, "'", 'q', sp, 'n', 'q', sp, 'v', 'a', sp,
        'u', 's', sp, 'i', 'w', sp, 'o', 'a', sp, 'p', 'q', sp,
        '[', 'a', sp, ']', 'q', sp, 'y', PU, sp, '/', PU, sp,
        ...walk([...C_HR, ...C_LV, ...C_RN, ...V_A, ...V_I, 'n', PU], 120),
      ],
    },
  ],

  /* ══════════════ INTERMEDIATE (8) ══════════════ */
  intermediate: [

    {
      id: 'i01', order: 1, level: 'intermediate',
      title: 'க + All Vowels',
      description: 'க் கா கி கீ கு கூ ...',
      focusKeys: ['h', PU, ...V_ALL], targetWPM: 22,
      content: [
        ...V_ALL.flatMap(v => ['h', v, sp, 'h', v, sp, 'h', v, sp]),
        'h', PU, sp, 'h', 'a', sp, 'h', 'q', sp, 'h', 's', sp, 'h', 'w', sp,
        'h', 'd', sp, 'h', 'e', sp, 'h', 'g', sp, 'h', 't', sp, 'h', 'r', sp,
        'h', 'c', sp, 'h', 'x', sp, 'h', 'z', sp,
        ...times(['h', 'q', 'h', PU, sp, 'h', 's', 'h', 't', sp, 'h', 'd', 'h', 'e', sp], 4),
        ...walk(V_ALL.flatMap(v => ['h', v]), 180),
        'j', PU, sp, 'j', 'a', sp, 'j', 'q', sp, 'h', 'q', 'j', 'q', sp,
      ],
    },

    {
      id: 'i02', order: 2, level: 'intermediate',
      title: 'ப + All Vowels',
      description: 'ப் பா பி பீ ...',
      focusKeys: ['j', PU, ...V_ALL], targetWPM: 22,
      content: [
        ...V_ALL.flatMap(v => ['j', v, sp, 'j', v, sp, 'j', v, sp]),
        ...times(['j', 'q', 'j', PU, sp, 'j', 's', 'j', 't', sp, 'j', 'd', 'j', 'e', sp], 4),
        'j', PU, 'j', 'q', 'j', 's', 'j', 'w', sp, 'j', 'd', 'j', 'e', 'j', 'g', 'j', 't', sp,
        ...walk(V_ALL.flatMap(v => ['j', v]), 180),
        'h', PU, sp, 'h', 'a', sp, 'h', 'q', sp, 'h', 's', sp,
        'h', 'q', 'j', 'q', sp, 'h', 'a', 'j', 'a', sp, 'h', PU, 'j', PU, sp,
      ],
    },

    {
      id: 'i03', order: 3, level: 'intermediate',
      title: 'ம த + Vowels',
      description: 'ம் மா ... த் தா ...',
      focusKeys: ['k', 'l', PU, ...V_ALL], targetWPM: 24,
      content: [
        ...V_ALL.flatMap(v => ['k', v, sp, 'l', v, sp]),
        ...V_ALL.flatMap(v => [...Array(2).fill(['k', v, 'l', v]).flat(), sp]),
        'k', 'q', 'l', 'q', sp, 'k', 'a', 'l', 'a', sp, 'k', PU, 'l', PU, sp,
        ...walk(V_ALL.flatMap(v => ['k', v, 'l', v]), 200),
        'h', 'q', 'j', 'q', sp, 'k', 'q', 'l', 'q', sp,
        'h', PU, 'k', PU, sp, 'j', PU, 'l', PU, sp,
        'h', 'a', 'j', 'a', 'k', 'a', 'l', 'a', sp,
      ],
    },

    {
      id: 'i04', order: 4, level: 'intermediate',
      title: 'ந ய ல வ + Vowels',
      description: "; ' n v + all vowel forms",
      focusKeys: [';', "'", 'n', 'v', PU, ...V_ALL], targetWPM: 24,
      content: [
        ...V_ALL.flatMap(v => [';', v, sp, "'", v, sp, 'n', v, sp, 'v', v, sp]),
        ';', 'q', "'", 'q', sp, ';', 'a', "'", 'a', sp,
        'n', 'q', 'v', 'q', sp, 'n', 'a', 'v', 'a', sp,
        ...walk(V_ALL.flatMap(v => [';', v, "'", v, 'n', v, 'v', v]), 180),
        'h', PU, 'j', PU, 'k', PU, 'l', PU, ';', PU, "'", PU, sp,
        'n', 'q', 'v', 'a', 'n', PU, 'v', PU, sp,
      ],
    },

    {
      id: 'i05', order: 5, level: 'intermediate',
      title: 'ற ன ட ண + Vowels',
      description: 'u i o p with vowel forms',
      focusKeys: ['u', 'i', 'o', 'p', PU, ...V_ALL], targetWPM: 24,
      content: [
        ...V_ALL.flatMap(v => ['u', v, sp, 'i', v, sp, 'o', v, sp, 'p', v, sp]),
        'u', 'q', 'i', 'q', sp, 'o', 'a', 'p', 'a', sp,
        'u', 'a', 'i', 'q', sp, 'o', 'q', 'p', 'a', sp,
        ...walk(V_ALL.flatMap(v => ['u', v, 'i', v, 'o', v, 'p', v]), 200),
        ...[...C_HR, ...C_LV, ...C_RN, ...C_OPN].flatMap(k => [k, PU, sp]),
      ],
    },

    {
      id: 'i06', order: 6, level: 'intermediate',
      title: 'Words — Speed I',
      description: 'Common Tamil words at pace',
      focusKeys: ['a', 'k', 'j', 'l', 'n', 'v', ';', PU, 'q', 's'], targetWPM: 26,
      content: [
        ...times(['a', 'k', PU, 'k', 'q', sp], 8),
        ...times(['a', 'j', PU, 'j', 'q', sp], 8),
        ...times([';', 'n', PU, 'n', 'a', sp], 8),
        ...times(['v', 'w', 'o', 'd', sp], 6),
        ...times([';', 'q', 'o', 'd', sp], 6),
        ...times(['k', 'n', 'a', 'u', PU, sp], 6),
        ...times(['v', 'n', 's', sp], 6),
        ...times(['k', 'l', 's', sp], 6),
        ...times(['h', 'l', 's', sp], 6),
        'a', 'k', PU, 'k', 'q', sp, 'a', 'j', PU, 'j', 'q', sp,
        ';', 'n', PU, 'n', 'a', sp, 'v', 'q', sp, 'k', 'q', sp,
        ...wordBank(W_SPEED, 4),
        ...walk(['a', 'k', 'j', 'n', 'v', 'l', ';', 'h', PU, 'a', 'q'], 100),
      ],
    },

    {
      id: 'i07', order: 7, level: 'intermediate',
      title: 'Words — Speed II',
      description: 'கல் · வலி · கவி · நாடு',
      focusKeys: ['h', 'k', 'l', 'n', 'v', ';', PU, 'a', 'q', 's'], targetWPM: 28,
      content: [
        ...times(['h', 'n', PU, sp], 7),
        ...times(['k', 'n', PU, sp], 7),
        ...times(['v', 'n', PU, sp], 7),
        ...times([';', 'n', PU, sp], 7),
        ...times(['l', 'n', 'a', sp], 7),
        ...times(['h', 'k', 'n', 'a', sp], 6),
        ...times(['h', 'v', 's', sp], 7),
        ...times(['k', 'v', 's', sp], 7),
        ...times(['h', 'n', PU, sp, 'k', 'n', PU, sp, 'v', 'n', PU, sp, ';', 'n', PU, sp], 4),
        ...times(['l', 'n', 'a', sp, 'h', 'k', 'n', 'a', sp, 'h', 'v', 's', sp, 'k', 'l', 's', sp], 4),
        ...walk(['h', 'k', 'l', 'n', 'v', ';', PU, 'a', 'q', 's'], 100),
      ],
    },

    {
      id: 'i08', order: 8, level: 'intermediate',
      title: 'Intermediate — Speed',
      description: 'All intermediate patterns at target pace',
      focusKeys: [...C_HR, ...C_LV, ...C_RN, PU, ...V_ALL], targetWPM: 30,
      content: [
        ...walk([...C_HR, ...C_LV, ...C_RN, ...V_ALL], 60),
        ...cvSyllables([...C_HR, ...C_LV], V_ALL.slice(0, 8), 1),
        'h', 'q', sp, 'k', 'a', sp, 'j', 's', sp, 'n', 'q', sp, 'v', 'a', sp,
        'l', 'q', sp, ';', 'a', sp, 'h', PU, sp, 'k', PU, sp, 'j', PU, sp,
        'h', 'q', 'k', PU, sp, 'j', 'q', 'n', PU, sp, 'v', 'q', ';', PU, sp,
        'h', 'a', 'j', 'a', 'k', 'a', sp, 'l', 'a', 'n', 'a', 'v', 'a', sp,
        'u', 'a', 'i', 'a', sp, 'o', 'a', 'p', 'q', sp,
        ...walk([...C_HR, ...C_LV, ...C_RN, ...V_A, ...V_I], 180),
      ],
    },
  ],

  /* ══════════════ ADVANCED (6) ════════════════ */
  advanced: [

    {
      id: 'a01', order: 1, level: 'advanced',
      title: 'Grantha — ஸ ஷ ஜ ஹ',
      description: 'Shift+Q W E R',
      focusKeys: ['Q', 'W', 'E', 'R', PU, ...V_A], targetWPM: 26,
      content: [
        ...drill(['Q'], 5), ...drill(['W'], 5), ...drill(['E'], 5), ...drill(['R'], 5),
        'Q', PU, sp, 'W', PU, sp, 'E', PU, sp, 'R', PU, sp,
        'Q', 'a', sp, 'W', 'a', sp, 'E', 'a', sp, 'R', 'a', sp,
        'Q', 'q', sp, 'W', 'q', sp, 'E', 'q', sp, 'R', 'q', sp,
        'h', 'q', sp, 'Q', 'q', sp, 'j', 'a', sp, 'E', 'a', sp,
        ...walk(['Q', 'W', 'E', 'R'].flatMap(k => [k, PU, k, 'a', k, 'q']), 180),
        ...walk(['Q', 'W', 'E', 'R', 'h', 'j', 'k', ...V_A], 100),
      ],
    },

    {
      id: 'a02', order: 2, level: 'advanced',
      title: 'ஃ Ayutha Ezhuthu',
      description: 'Shift+F — the unique aspirate',
      focusKeys: ['F', 'h', 'j', 'k', 'l', ';', 'n', 'v'], targetWPM: 28,
      content: [
        ...drill(['F'], 6),
        'F', 'h', sp, 'F', 'j', sp, 'F', 'k', sp, 'F', 'l', sp,
        'F', ';', sp, 'F', 'n', sp, 'F', 'v', sp, 'F', 'u', sp,
        'h', 'F', 'h', sp, 'j', 'F', 'j', sp, 'k', 'F', 'k', sp,
        ';', 'F', ';', sp, 'n', 'F', 'n', sp, 'v', 'F', 'v', sp,
        ...walk(['F', 'h', 'j', 'k', 'l', ';', 'n', 'v'], 100),
        ...times(['F', 'h', sp, 'F', 'j', sp, 'F', 'k', sp, 'F', 'l', sp, 'h', PU, sp, 'j', PU, sp], 8),
        ...walk(['F', 'h', 'j', 'k', 'l', ';', 'n', 'v', 'u', 'i'], 140),
      ],
    },

    {
      id: 'a03', order: 3, level: 'advanced',
      title: 'Speed Drill I',
      description: 'Home row + vowels — 32 WPM',
      focusKeys: [...C_HR, ...C_LV, ...V_A, ...V_I, PU], targetWPM: 32,
      content: [
        ...walk([...C_HR, ...C_LV, ...V_ALL], 80),
        ...cvSyllables([...C_HR, ...C_LV], V_ALL, 1),
        ...walk([...C_HR, ...C_LV, ...V_A, ...V_I, PU], 240),
        'h', 'q', sp, 'k', 'a', sp, 'j', 's', sp, 'n', 'q', sp, 'v', 'a', sp,
        'l', 'q', sp, ';', 'a', sp, 'h', PU, sp, 'k', PU, sp, 'j', PU, sp,
        ...times(['h', 'a', 'j', 'a', 'k', 'a', sp, 'n', 'a', 'v', 'a', 'l', 'a', sp], 8),
      ],
    },

    {
      id: 'a04', order: 4, level: 'advanced',
      title: 'Speed Drill II',
      description: 'Full keyboard — all zones',
      focusKeys: [...C_ALL, PU, ...V_ALL], targetWPM: 36,
      content: [
        ...walk(C_ALL.flatMap(k => [k, PU, k, 'a']), 180),
        ...cvSyllables(C_ALL, V_ALL.slice(0, 6), 1),
        'h', PU, 'j', PU, 'k', PU, sp, 'l', PU, ';', PU, "'", PU, sp,
        'n', PU, 'v', PU, 'u', PU, 'i', PU, sp, 'o', PU, 'p', PU, '[', PU, sp,
        ']', PU, 'b', PU, 'y', PU, '/', PU, sp,
        'h', 'a', 'j', 'q', 'k', 's', sp, 'l', 'w', 'n', 'd', sp,
        'v', 'e', ';', 'g', sp, 'y', 't', 'o', 'r', sp,
        ...walk([...C_ALL, ...V_ALL, PU], 180),
      ],
    },

    {
      id: 'a05', order: 5, level: 'advanced',
      title: 'Marathon',
      description: 'Every key — ultimate endurance',
      focusKeys: [...V_ALL, ...C_ALL, PU, 'F', 'Q', 'W', 'E', 'R'], targetWPM: 38,
      content: [
        ...walk(V_ALL, 100),
        ...C_ALL.flatMap(k => [k, PU, sp]),
        'h', 'a', 'j', 'q', 'k', 's', sp, 'l', 'w', ';', 'd', "'", 'e', sp,
        'n', 'g', 'v', 't', 'u', 'r', sp, 'i', 'c', 'o', 'x', 'p', 'z', sp,
        '[', 'a', ']', 'q', 'b', 's', sp, 'y', 'w', '/', PU, sp,
        'Q', 'a', 'W', 'q', sp, 'E', 'a', 'R', 'q', sp,
        ...walk([...C_ALL, ...V_ALL, PU, 'F', 'Q', 'W', 'E', 'R'], 280),
        ...cvSyllables(C_ALL, V_ALL, 1),
      ],
    },

    {
      id: 'a06', order: 6, level: 'advanced',
      title: 'Tamil Text Speed',
      description: 'Complex sequences — peak speed',
      focusKeys: [...C_HR, ...C_LV, ...C_RN, PU, ...V_ALL], targetWPM: 40,
      content: [
        ...times([';', 'w', 'u', PU, sp], 6),
        ...times(['s', 'n', PU, 'n', 'q', sp], 6),
        ...times(['s', 'o', 'k', PU, sp], 6),
        ...times(['v', 'q', '/', PU, sp], 6),
        ...times(['h', 'u', PU, 'u', 'a', 'l', 'd', sp], 5),
        ...times(['k', 'a', 'p', PU, sp], 6),
        ...times(['a', 'y', 'v', 'd', sp], 6),
        ...times([';', 'w', 'u', PU, sp, 's', 'n', PU, 'n', 'q', sp, 's', 'o', 'k', PU, sp], 4),
        ...times(['h', 'u', PU, 'u', 'a', 'l', 'd', sp, 'k', 'a', 'p', PU, sp, 'a', 'y', 'v', 'd', sp], 4),
        ...walk([...C_HR, ...C_LV, ...C_RN, ...V_ALL, PU], 200),
      ],
    },
  ],
};

export const ALL_LESSONS = [
  ...LESSONS_DB.beginner,
  ...LESSONS_DB.intermediate,
  ...LESSONS_DB.advanced,
];

export function getLessonById(id)     { return ALL_LESSONS.find(l => l.id === id) ?? null; }
export function getNextLesson(id)     { const i = ALL_LESSONS.findIndex(l => l.id === id); return i >= 0 && i < ALL_LESSONS.length - 1 ? ALL_LESSONS[i + 1] : null; }
export function getPrevLesson(id)     { const i = ALL_LESSONS.findIndex(l => l.id === id); return i > 0 ? ALL_LESSONS[i - 1] : null; }
export function getLessonIndex(id)    { return ALL_LESSONS.findIndex(l => l.id === id); }
export function getFirstIncomplete(done = []) { return ALL_LESSONS.find(l => !done.includes(l.id)) ?? ALL_LESSONS[0]; }