import { tamilToKeys } from './mapping.js';

/**
 * lessons.js — பைந்தமிழ் typing tutor
 * =======================================
 * 35 lessons: 20 Beginner · 8 Intermediate · 7 Advanced
 *
 * DESIGN RULES (strictly enforced):
 *  1. ZERO future-key leakage — a lesson only uses keys unlocked so far.
 *  2. Pulli (f = ்) is introduced in Lesson 1 so short words like கல், பல்
 *     can appear from the very first lesson.
 *  3. 75 % real Tamil words · 25 % syllable drills (only in early lessons;
 *     Intermediate+ is 100 % words).
 *  4. Words are filtered at runtime against `ALLOWED` — the cumulative set
 *     of keys unlocked up to and including the current lesson.
 *  5. Every word list is annotated with which keys it needs.
 *
 * KEY UNLOCK ORDER  (cumulative — each lesson adds to the set below)
 * ─────────────────────────────────────────────────────────────────
 *  b01 : h j a q f              — க ப + அ ஆ + ்   (pulli from day 1!)
 *  b02 : + k l ; '              — ம த ந ய
 *  b03 : (drill — no new keys)
 *  b04 : + s w                  — இ ஈ
 *  b05 : + d e                  — உ ஊ
 *  b06 : + g t r                — எ ஏ ஐ
 *  b07 : + c x z                — ஒ ஓ ஔ  (all 12 vowels done)
 *  b08 : + n v                  — ல வ
 *  b09 : + u i                  — ற ன
 *  b10 : + o p                  — ட ண
 *  b11 : + [                    — ச
 *  b12 : + m                    — ர
 *  b13 : + y /                  — ள ழ
 *  b14 : + ] b                  — ஞ ங
 *  b15 : (uyirmei drill — க ப all vowels — no new keys)
 *  b16 : (uyirmei drill — ம த)
 *  b17 : (uyirmei drill — ந ய)
 *  b18 : (uyirmei drill — ல வ)
 *  b19 : (uyirmei drill — ற ன)
 *  b20 : (pure word speed — all beginner keys)
 *  i01 : (uyirmei drill — ட ண)
 *  i02 : (uyirmei drill — ச ர)
 *  i03 : (uyirmei drill — ள ழ)
 *  i04 : (uyirmei drill — ஞ ங)
 *  i05 : (speed — all consonants)
 *  i06 : (words — speed I)
 *  i07 : (words — speed II)
 *  i08 : (words — speed III)
 *  a01 : + Q W E R              — ஸ ஷ ஜ ஹ (Grantha)
 *  a02 : + F                    — ஃ
 *  a03–a06 : speed drills
 *  a07 : + Z X C V B D A S     — accounting symbols
 *
 * TAMIL99 KEY REFERENCE:
 *  Vowels  : a=அ q=ஆ s=இ w=ஈ d=உ e=ஊ g=எ t=ஏ r=ஐ c=ஒ x=ஓ z=ஔ
 *  Pulli   : f=்
 *  Home row: h=க j=ப k=ம l=த ;=ந '=ய
 *  Other   : n=ல v=வ u=ற i=ன o=ட p=ண [=ச m=ர y=ள /=ழ ]=ஞ b=ங
 *  Grantha : Q=ஸ W=ஷ E=ஜ R=ஹ F=ஃ
 *  Symbols : Z=௳ X=௴ C=௵ V=௶ B=௷ D=௸ A=௹ S=௺
 */

const sp = ' ';
const PU = 'f';   // virama / pulli  ்
const ri = n => Math.floor(Math.random() * n);

/**
 * Given a Tamil Unicode word and a Set of allowed keys,
 * return true if every key in the word is in the allowed set.
 */
function wordAllowed(word, allowed) {
  return tamilToKeys(word).every(k => allowed.has(k));
}

/** Filter a word array to only those whose keys are all in `allowed` */
function filterWords(arr, allowed) {
  return arr.filter(w => wordAllowed(w, allowed));
}

// ─── Key groups ───────────────────────────────────────────────────────────────
// V_A = the "a" vowel group of a consonant: the bare consonant (inherent a,
// e.g. க = 'h' alone) plus ஆ-matra ('q'). The standalone vowel அ ('a') is NOT a
// matra, so "consonant + a" would render a spurious கஅ; it is kept out of this
// pool but stays in V_ALL (below) so அ words remain allowed.
const V_A = ['q'];
const V_I = ['s', 'w'];
const V_U = ['d', 'e'];
const V_E = ['g', 't', 'r'];
const V_O = ['c', 'x', 'z'];
const V_ALL = ['a', ...V_A, ...V_I, ...V_U, ...V_E, ...V_O];

const C_HR = ['h', 'j', 'k', 'l', ';', "'"];   // க ப ம த ந ய
const C_LV = ['n', 'v'];                    // ல வ
const C_RN = ['u', 'i'];                    // ற ன
const C_OPN = ['o', 'p'];                    // ட ண
const C_SA = ['['];                        // ச  (introduced alone)
const C_RA = ['m'];                        // ர
const C_LZ = ['y', '/'];                    // ள ழ
const C_NG = [']', 'b'];                    // ஞ ங
const C_ALL = [...C_HR, ...C_LV, ...C_RN, ...C_OPN, ...C_SA, ...C_RA, ...C_LZ, ...C_NG];

// ─── Syllable drill helpers (25 % of early lessons) ──────────────────────────
function pool(cons, vows, withPulli) {
  const o = [];
  for (const c of cons) {
    if (vows.includes('q')) o.push([c]);   // bare consonant (inherent a)
    for (const v of vows) if (v !== 'a') o.push([c, v]);
    if (withPulli) o.push([c, PU]);
  }
  return o;
}

function keybr(syls, chars) {
  if (!syls.length) return [];
  const out = []; let n = 0, lastW = null;
  while (n < chars) {
    const wl = 2 + ri(3);
    let word, ws, t = 0;
    do {
      word = []; let prev = -1;
      for (let i = 0; i < wl; i++) {
        let ix = ri(syls.length);
        if (ix === prev && syls.length > 1) ix = (ix + 1) % syls.length;
        prev = ix; word.push(...syls[ix]);
      }
      ws = word.join(''); t++;
    } while (ws === lastW && t < 4);
    lastW = ws; out.push(...word, sp); n += word.length + 1;
  }
  while (out.length && out[out.length - 1] === sp) out.pop();
  return out;
}

function wKeybr(np, rp, chars) {
  return keybr([...np, ...np, ...np, ...np, ...np, ...rp, ...rp], chars);
}

/** Brief intro: show each syllable twice then space */
function intro(syl) {
  const sh = [...syl];
  for (let i = sh.length - 1; i > 0; i--) { const j = ri(i + 1); [sh[i], sh[j]] = [sh[j], sh[i]]; }
  const out = [];
  for (const s of sh) out.push(...s, ...s, sp);
  for (let w = 0; w < 4; w++)
    out.push(...syl[ri(syl.length)], ...syl[ri(syl.length)], sp);
  while (out.length && out[out.length - 1] === sp) out.pop();
  return out;
}

/** Full uyirmei grid for given consonants × vowels */
function uyirmeiGrid(cons, vows) {
  vows = vows || V_ALL;
  const bare = vows.includes('q');
  const activeVowels = vows.filter(v => v !== 'a');
  const sc = [...cons];
  for (let i = sc.length - 1; i > 0; i--) { const j = ri(i + 1); [sc[i], sc[j]] = [sc[j], sc[i]]; }
  const out = [];
  for (const c of sc) {
    if (bare) out.push(c, sp);
    for (const v of activeVowels) {
      out.push(c, v, sp);
    }
  }
  while (out.length && out[out.length - 1] === sp) out.pop();
  return out;
}

// ─── Word generation helpers ──────────────────────────────────────────────────

/** Emit `count` words randomly picked from `wordList` */
function wordsGen(wordList, count) {
  if (!wordList.length || count <= 0) return [];
  const out = [];
  let lastWord = null;
  for (let i = 0; i < count; i++) {
    let w = wordList[ri(wordList.length)];
    if (w === lastWord && wordList.length > 1) {
      w = wordList[(wordList.indexOf(w) + 1) % wordList.length];
    }
    out.push(...tamilToKeys(w), sp);
    lastWord = w;
  }
  while (out.length && out[out.length - 1] === sp) out.pop();
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
//  WORD DATABASE
//  All words are real Tamil Unicode strings.
//  Annotated with the Tamil99 consonant keys each requires.
//  Organised from simplest (fewest keys) to most complex.
// ─────────────────────────────────────────────────────────────────────────────

// ── b01 keys: h j a q f  (க ப + அ ஆ + ்) ──────────────────────────────────

// Only க / ப consonants + அ / ஆ vowels + ்
const W01 = [

	// Starts with: க
	'காக்க', 'காக', 'காப்ப', 'கப்பா', 'காகா',

	// Starts with: ப
	'பக்க', 'பாக', 'பாப்பா', 'பாகா', 'பாக்க', 'பக', 'பாபா',

	// Starts with: அ
	'அப்பா', 'அக்கா', 'அப்ப', 'ஆப்ப', 'அக', 'அக்க', 'அப்பப்பா',

	// Starts with: ஆ
	'ஆகா', 'ஆக', 'ஆக்க',

];


// ── b02 adds: k l ; '  (ம த ந ய) ──────────────────────────────────────────
// Now available: h j k l ; ' a q f
const W02 = [

	// Starts with: க
	'கந்த', 'காத', 'காம', 'காமம்', 'காயம்', 'காத்த', 'காய்', 'கம்மாய்', 'காகம்', 'கம்பம்','கந்தம்', 'காய்ந்த', 'கந்தா',

	// Starts with: ப
	'பக்கம்', 'பாகம்', 'பாதம்', 'பாத', 'பயம்', 'பாய', 'பயந்த', 'பாக்கம்',

	// Starts with: அ
	'அம்மா', 'அந்த', 'அந்தம்', 'அம்', 'அபாயம்', 'அகம்', 'அய்யம்',

	// Starts with: ஆ
	'ஆம்', 'ஆமாம்', 'ஆய', 'ஆய்', 'ஆமா', 'ஆத', 'ஆக்கம்', 'ஆதாயம்', 'ஆகாயம்', 'ஆப்பம்',

	// Starts with: ம
	'மகாத்மா', 'மகா', 'மாதம்', 'மாய', 'மாத', 'மாமா', 'மயக்கம்', 'மாயம்', 'மயம்', 'மதம்', 'மந்தம்', 'மகம்', 'மாய்ந்த',

	// Starts with: த
	'தம்', 'தாம்', 'தந்த', 'தாய்', 'தக்க', 'தாத்தா', 'தாயம்',  'தந்தம்', 'தாகம்',  'தம்மம்', 'தயக்கம்',

	// Starts with: ந
	'நாம்', 'நம்', 'நாத', 'நாமம்', 'நம்ப', 'நாயக', 'நாய்', 'நாகம்', 'நாயம்',  'நயம்', 'நாதம்', 'நகம்',

	// Starts with: ய
	'யாம்', 'யாக', 'யாத', 'யாய', 'யாத்த', 'யாய்', 'யாமம்', 'யாகம்',

];

// ── b04 adds: s w  (இ ஈ) ────────────────────────────────────────────────────
// Available: h j k l ; ' a q f s w
const W04 = [

	// Starts with: க
	'காந்தி', 'கத்தி', 'கதி', 'கீதம்', 'காதி', 'கீத', 'காப்பி', 'கம்பி', 'கதித்த',

	// Starts with: ப
	'பாதி', 'பத்தி', 'பதிகம்', 'பாக்கியம்', 'பதி', 'பக்தி', 'பீதி', 'பித்த', 'பதிந்த',

	// Starts with: ம
	'மிக்க', 'மிக', 'மதி', 'மாகி', 'மாகிய', 'மாதி', 'மிகி', 'மிதி', 'மதியம்', 'மீதி', 'மதாதீத',

	// Starts with: த
	'திப', 'தம்பி', 'தீய', 'தப்பி', 'தகதிமி', 'தாக்கி', 'தப்பிப்', 'தந்தி', 'தீபம்', 'தத்தி', 'தாபித்த', 'தாமதி', 'திதி', 'தீ',

	// Starts with: ந
	'நீதி', 'நம்பி', 'நீக்கி', 'நந்தி', 'நாகநந்தி', 'நதி', 'நாயகி', 'நித்தம்', 'நாதி', 'நிம்மதி',  'நிதி', 'நீ',

	// Starts with: ய
	'யாகி', 'யாகிய', 'யாதி', 'யாக்கி', 'யாயி',

	// Starts with: அ
	'அதிக', 'அதிகம்', 'அதிகமாக', 'அந்தி', 'அபிநயம்', 'அதி', 'அத்தி', 'அந்நிய', 'அம்பி', 'அப்பி',

	// Starts with: ஆ
	'ஆதி', 'ஆகிய', 'ஆகி', 'ஆதித்த', 'ஆக்கி', 'ஆக்கிய', 'ஆயி',

	// Starts with: இ
	'இந்த', 'இந்திய', 'இப்', 'இந்', 'இப்ப', 'இதி','இப்பி','இம்மி',

	// Starts with: ஈ
	'ஈய', 'ஈத்த', 'ஈத', 'ஈயா', 'ஈக', 'ஈந்த', 'ஈமம்', 'ஈதி', 'ஈ',

];

// ── b05 adds: d e  (உ ஊ) ────────────────────────────────────────────────────
// Available: h j k l ; ' a q f s w d e
const W05 = [

	// Starts with: க
	'காது', 'காக்கும்', 'காப்பு', 'காத்து', 'குதித்து', 'குத்தி', 'கும்பம்','கும்மி',

	// Starts with: ப
	'புதிய', 'புத்த', 'பத்து', 'புகுந்து', 'பகுதி', 'பாய்ந்து', 'புது', 'பயந்து', 'புதியது', 'பூமி', 'பூக்கும்',

	// Starts with: ம
	'மீது', 'முகம்', 'மிகுந்த', 'முதிய', 'முத்தி', 'முகம்மது', 'மாகும்', 'முத்து', 'மூக்கு',

	// Starts with: த
	'தமது', 'தூய', 'தூக்கி', 'தந்து', 'தமக்கு', 'தாமும்', 'தூது', 'தாகும்', 'தூக்கம்', 'துக்கம்',  'துத்தம்',

	// Starts with: ந
	'நீயும்', 'நமது', 'நமக்கு', 'நாமும்', 'நயந்து', 'நீக்கும்', 'நும்',

	// Starts with: ய
	'யூதா', 'யாது', 'யுத்தம்', 'யாகும்', 'யுத்த', 'யாதும்', 'யூத',

	// Starts with: அ
	'அது', 'அமுது', 'அமுதம்', 'அம்பு', 'அமுத', 'அதுக்கு', 'அகத்து', 'அமுதா',

	// Starts with: ஆ
	'ஆகும்', 'ஆபத்து', 'ஆய்ந்து', 'ஆகாது', 'ஆயுதம்', 'ஆயும்', 'ஆகியும்', 'ஆக்கும்',

	// Starts with: இ
	'இது', 'இந்து', 'இயம்பு', 'இயம்பும்', 'இதுக்கு', 'இகந்து', 'இத்தகு', 'இக்கு',

	// Starts with: ஈ
	'ஈது', 'ஈயும்', 'ஈந்து', 'ஈயாது', 'ஈந்தும்', 'ஈயத்து', 'ஈந்தது', 'ஈக்கு',

	// Starts with: உ
	'உம்', 'உமது', 'உமக்கு', 'உய்ய', 'உத்தம', 'உதித்தது', 'உகந்த',

	// Starts with: ஊ
	'ஊக்கம்', 'ஊதூது', 'ஊதியம்', 'ஊகித்து', 'ஊதி', 'ஊதும்', 'ஊகம்', 'ஊத',

];

// ── b06 adds: g t r  (எ ஏ ஐ) ───────────────────────────────────────────────
// Available: h j k l ; ' a q f s w d e g t r
const W06 = [

	// Starts with: க
	'கையை', 'கையும்', 'கைது', 'குப்பை', 'கை',

	// Starts with: ப
	'பேய்', 'பேது', 'புகை', 'புதுமை', 'பெய்து', 'பேதைமை', 'பேதை',

	// Starts with: ம
	'மெய்', 'மெய்யே', 'மெய்ம்மை', 'முந்தை', 'முகை', 'மும்மை',

	// Starts with: த
	'தூய்மை', 'தும்பை', 'தேய்ந்து', 'தேம்', 'தேத்தும்', 'தெந்தை', 'தேயும்', 'தந்தை',

	// Starts with: ந
	'நெய்', 'நைந்து', 'நுந்தை', 'நேக்கு', 'நெய்யும்', 'நும்மை', 'நையும்', 'நேத்து', 'நத்தை',

	// Starts with: ய
	'யெந்தை', 'யேத்தும்', 'யேது', 'யெய்து',

	// Starts with: உ
	'உம்மை', 'உமை', 'உமையே', 'உம்மையே', 'உம்மையும்',

	// Starts with: ஊ
	'ஊமை', 'ஊதை', 'ஊத்தை', 'ஊமையும்', 'ஊதையும்',

	// Starts with: எ
	'எம்', 'எந்தை', 'எது', 'எதையும்', 'எம்மை', 'எய்தும்', 'எதை',

	// Starts with: ஏ
	'ஏது', 'ஏதும்', 'ஏத்தும்', 'ஏந்து', 'ஏய்', 'ஏந்தும்', 'ஏத்து',

	// Starts with: ஐ
	'ஐந்து', 'ஐந்தும்', 'ஐம்', 'ஐது', 'ஐயும்', 'ஐம்மை', 'ஐந்தையும்', 'ஐயே',

];

// ── b07 adds: c x z  (ஒ ஓ ஔ) — all 12 vowels ───────────────────────────────
// Available: all vowels + h j k l ; ' + f
const W07 = [

	// Starts with: க
	'கோபம்', 'கோதை', 'கொம்பு', 'கோபமும்', 'கோபித்துக்', 'கொய்து', 'கொதித்து', 'கோதி',

	// Starts with: ப
	'போது', 'போய்', 'போக', 'போதும்', 'போகும்', 'பொய்', 'போந்து',

	// Starts with: ம
	'மோதி', 'மோக', 'மோகம்', 'மொய்த்த', 'மொத்தம்', 'மொய்',

	// Starts with: த
	'தொகை', 'தோகை', 'தொகுதி', 'தொகுப்பு', 'தொக்க', 'தோய்ந்த', 'தொகுத்து', 'தொகையும்',

	// Starts with: ந
	'நோக்கி', 'நோய்', 'நோக்கியே', 'நோக்கம்', 'நொந்து',

	// Starts with: ய
	'யாக்கோபு', 'யோக', 'யோகம்', 'யோகி', 'யாதோ', 'யோபு', 'யொத்த', 'யோதி',

	// Starts with: அ
	'அப்போது', 'அதோ', 'அந்தோ', 'அப்போ', 'அப்போதே', 'அய்யோ',

	// Starts with: ஆ
	'ஆகுமோ', 'ஆமோ', 'ஆகாதோ', 'ஆபேத்நெகோ', 'ஆபோகி', 'ஆதியோ', 'ஆயோ', 'ஆக்காயோ',

	// Starts with: இ
	'இப்போது', 'இதோ', 'இப்போ', 'இப்போதே', 'இப்போதும்',

	// Starts with: ஈ
	'ஈதோ', 'ஈயோ', 'ஈதுபோ', 'ஈந்தோ', 'ஈதுகொ', 'ஈதொப்ப', 'ஈயாயோ',

	// Starts with: உ
	'உந்தமோ', 'உத்தியோக', 'உபயோகம்', 'உமையோ', 'உக்கோ', 'உய்யுமோ', 'உய்ந்தோம்',

	// Starts with: ஊ
	'ஊதுகொம்பு', 'ஊதும்போது', 'ஊமையோ', 'ஊகமோ', 'ஊதாயோ', 'ஊக்கமோ',

	// Starts with: எ
	'எப்போது', 'எப்போதும்', 'எதையோ', 'எப்போ', 'எப்போதோ', 'எப்போதுமே',

	// Starts with: ஏ
	'ஏதோ', 'ஏதேதோ', 'ஏதுக்கோ',

	// Starts with: ஐ
	'ஐயோ', 'ஐயையோ', 'ஐயகோ', 'ஐந்தோ', 'ஐம்பதோ', 'ஐயொ',

	// Starts with: ஒ
	'ஒத்த', 'ஒப்பு', 'ஒத்து', 'ஒக்கும்', 'ஒப்ப', 'ஒக்க',

	// Starts with: ஓ
	'ஓதி', 'ஓகோ', 'ஓம்', 'ஓதிய', 'ஓதும்', 'ஓது', 'ஓத', 'ஓய்',

	// Starts with: ஔ
	'ஔயை',

];

// ── b08 adds: n v  (ல வ) ────────────────────────────────────────────────────
// Available: all vowels + h j k l ; ' n v + f
const W08 = [

	// Starts with: க
	'காலம்', 'கையில்', 'காதல்', 'காலத்தில்', 'காலை', 'கோயில்',

	// Starts with: ப
	'போல்', 'பல', 'போல', 'போலும்', 'பாவம்', 'பல்லவ',

	// Starts with: ம
	'மேல்', 'மேலும்', 'முதல்', 'மாலை', 'மேலே', 'மிகவும்',

	// Starts with: த
	'தலை', 'தலைவி', 'தேவி', 'தெய்வம்', 'தில்லை', 'தாவீது',

	// Starts with: ந
	'நல்ல', 'நிலை', 'நூல்', 'நல்லது', 'நல்', 'நாலு',

	// Starts with: ய
	'யாவும்', 'யெல்லாம்', 'யாவையும்',

	// Starts with: அ
	'அல்லது', 'அல்லவா', 'அவை', 'அல்ல', 'அதில்', 'அப்பால்',

	// Starts with: ஆ
	'ஆகையால்', 'ஆகவே', 'ஆவி', 'ஆதலால்', 'ஆவது', 'ஆல',

	// Starts with: இ
	'இல்லை', 'இவ்விதம்', 'இவை', 'இதுவே', 'இல்', 'இலக்கிய',

	// Starts with: ஈ
	'ஈதல்', 'ஈதலும்', 'ஈதலே', 'ஈவு', 'ஈந்தால்', 'ஈயல்',

	// Starts with: உ
	'உலகம்', 'உதவி', 'உலகில்', 'உலக', 'உலகு', 'உவகை',

	// Starts with: ஊ
	'ஊதுவத்தி', 'ஊதுலை', 'ஊதல்', 'ஊதுதல்', 'ஊலாய்', 'ஊக்கல்',

	// Starts with: எ
	'எல்லாம்', 'எல்லா', 'எதுவும்', 'எல்லை', 'எக்காலம்', 'எல்லையில்',

	// Starts with: ஏ
	'ஏதாவது', 'ஏவல்', 'ஏவ', 'ஏந்தல்', 'ஏவி', 'ஏல',

	// Starts with: ஐ
	'ஐவகை', 'ஐம்பால்', 'ஐயமில்லை', 'ஐயாவே', 'ஐந்தாவது', 'ஐம்புல',

	// Starts with: ஒ
	'ஒலி', 'ஒல்லை', 'ஒப்பியல்', 'ஒலியும்', 'ஒலிக்கும்', 'ஒலித்தது',

	// Starts with: ஓ
	'ஓலை', 'ஓய்வு', 'ஓயாமல்', 'ஓலையை', 'ஓலம்',

	// Starts with: ஔ
	'ஔவை', 'ஔவும்', 'ஔவையே', 'ஔவியம்',

	// Starts with: ல
	'லலிதா',

	// Starts with: வ
	'வந்து', 'வந்த', 'வந்தது', 'வேலை', 'வைத்து',

];

// ── b09 adds: u i  (ற ன) ────────────────────────────────────────────────────
// Available: all vowels + h j k l ; ' n v u i + f
const W09 = [

	// Starts with: க
	'கூறி', 'குற்றம்', 'கூறியது', 'கூறிய', 'குறித்து', 'கூற்று',

	// Starts with: ப
	'பிறகு', 'பற்றி', 'போற்றி', 'பின்', 'பெற்ற', 'போன்ற',

	// Starts with: ம
	'முன்', 'மகன்', 'மூன்று', 'மனம்', 'முன்னால்', 'மன்னன்',

	// Starts with: த
	'தன்', 'தான்', 'தானே', 'தன்னை',

	// Starts with: ந
	'நான்', 'நின்று', 'நின்ற', 'நானும்', 'நானே', 'நின்',

	// Starts with: ய
	'யானை', 'யான்', 'யானே', 'யானும்',

	// Starts with: வ
	'வேறு', 'வந்தான்', 'வெற்றி', 'வந்தேன்', 'வென்று', 'வேந்தன்',

	// Starts with: அ
	'அவன்', 'அதன்', 'அதற்கு', 'அன்று', 'அதனால்', 'அவனை',

	// Starts with: ஆ
	'ஆனால்', 'ஆயினும்', 'ஆறு', 'ஆனாலும்', 'ஆனந்த', 'ஆன',

	// Starts with: இ
	'இன்னும்', 'இன்று', 'இவ்வாறு', 'இனி', 'இவன்', 'இன்பம்',

	// Starts with: ஈ
	'ஈன்ற', 'ஈறு', 'ஈற்று', 'ஈன்று', 'ஈன', 'ஈனும்',

	// Starts with: உ
	'உன்', 'உனக்கு', 'உன்னை', 'உனது',

	// Starts with: ஊ
	'ஊன்றி', 'ஊறு', 'ஊன்', 'ஊனம்', 'ஊற்று', 'ஊறும்',

	// Starts with: எ
	'என்று', 'என்', 'என்ன', 'என்ற', 'என்றான்', 'என',

	// Starts with: ஏ
	'ஏன்', 'ஏனெனில்', 'ஏறி', 'ஏதேனும்', 'ஏற்ற',

	// Starts with: ஐ
	'ஐயன்', 'ஐந்தாறு', 'ஐயனை', 'ஐந்நூறு', 'ஐம்புலன்',

	// Starts with: ஒ
	'ஒன்று', 'ஒன்றும்', 'ஒன்றை', 'ஒன்பது', 'ஒன்றே', 'ஒற்றி',

	// Starts with: ஓ
	'ஓம்புமின்', 'ஓவற', 'ஓதுகின்ற', 'ஓவென்று', 'ஓதுவான்', 'ஓமெனும்',

];

// ── b10 adds: o p  (ட ண) ────────────────────────────────────────────────────
// Available: all vowels + h j k l ; ' n v u i o p + f
const W10 = [

	// Starts with: க
	'கொண்டு', 'கண்டு', 'கொண்ட', 'கண்', 'கண்ட', 'கூட',

	// Starts with: ப
	'பாடல்', 'பெண்', 'படலம்', 'பாடி', 'பிடித்து', 'பணிந்து',

	// Starts with: ம
	'மட்டும்', 'முடியாது', 'மீண்டும்', 'முடியும்', 'மணி', 'மாட்டேன்',

	// Starts with: த
	'தடவை', 'தன்னுடைய', 'திணை', 'தேடி', 'துணை', 'தகிட',

	// Starts with: ந
	'நடந்து', 'நாடு', 'நாட்டில்', 'நாட்டு', 'நடந்த', 'நீண்ட',

	// Starts with: வ
	'வேண்டும்', 'விட்டு', 'வேண்டாம்', 'விட்டது', 'வண்ணம்', 'வேண்டிய',

	// Starts with: அ
	'அவனுடைய', 'அப்படி', 'அடி', 'அடுத்த', 'அடிக்கடி', 'அப்படியே',

	// Starts with: ஆ
	'ஆண்', 'ஆண்டு', 'ஆடும்', 'ஆணை', 'ஆடு', 'ஆடிய',

	// Starts with: இ
	'இடம்', 'இப்படி', 'இடத்தில்', 'இடை', 'இடையே',

	// Starts with: ஈ
	'ஈண்டு', 'ஈடு', 'ஈண்டிய', 'ஈண்டி', 'ஈட்டி', 'ஈட்டம்',

	// Starts with: உ
	'உடனே', 'உண்டு', 'உண்மை', 'உன்னுடைய', 'உடன்', 'உடல்',

	// Starts with: ஊ
	'ஊடல்', 'ஊட்டி', 'ஊட்டும்', 'ஊண்', 'ஊட்ட', 'ஊடி',

	// Starts with: எ
	'எப்படி', 'என்னுடைய', 'எடுத்து', 'என்னிடம்', 'எண்ணி',

	// Starts with: ஏ
	'ஏற்பாடு', 'ஏற்பட்ட', 'ஏற்படும்', 'ஏற்பட்டு', 'ஏடு',

	// Starts with: ஐ
	'ஐந்திணை', 'ஐயாறுடை', 'ஐயப்பாடு', 'ஐந்துடன்', 'ஐம்படை', 'ஐந்தொடு',

	// Starts with: ஒ
	'ஒண்ணும்', 'ஒட்டி', 'ஒண்ணு', 'ஒண்', 'ஒட்டிய',

	// Starts with: ஓ
	'ஓடி', 'ஓடும்', 'ஓட', 'ஓடினான்', 'ஓடு',

];

// ── b11 adds: [  (ச) ──────────────────────────────────────────────────────
// Available: all vowels + h j k l ; ' n v u i o p [ + f
const W11 = [

	// Starts with: க
	'காட்சி', 'கடைசியில்', 'கணேசன்', 'கடைசியாக', 'கடைசி',

	// Starts with: ப
	'பேச', 'பேசி', 'பேச்சு',

	// Starts with: ம
	'மோசே', 'முயற்சி', 'மாட்சி', 'மிசை', 'மூச்சு',

	// Starts with: த
	'தேச', 'திசை', 'தேசம்', 'திசையை',

	// Starts with: ந
	'நிச்சயம்', 'நல்லிசை', 'நமச்சி', 'நிசப்தம்',

	// Starts with: ய
	'யோசனை', 'யோசித்து',

	// Starts with: ல
	'லட்சம்',

	// Starts with: வ
	'வாசலில்', 'வாசல்', 'வீசி', 'வீசும்', 'வாச',

	// Starts with: அ
	'அவசியம்', 'அச்சம்',

	// Starts with: ஆ
	'ஆசை', 'ஆட்சி', 'ஆசி', 'ஆட்சியின்', 'ஆசையும்',

	// Starts with: இ
	'இயேசு', 'இசை', 'இன்னிசை',

	// Starts with: ஈ
	'ஈசன்', 'ஈசனை', 'ஈசனே', 'ஈச', 'ஈசாக்கு', 'ஈசான',

	// Starts with: உ
	'உச்சி', 'உற்சாகம்', 'உச்சியில்',

	// Starts with: ஊ
	'ஊசல்', 'ஊசி', 'ஊசியிலை', 'ஊசியா', 'ஊசலாடி',

	// Starts with: ஏ
	'ஏசாவின்', 'ஏசா',

	// Starts with: ஐ
	'ஐப்பசி', 'ஐசெக்', 'ஐலசா',

	// Starts with: ஒ
	'ஒத்தாசை', 'ஒசை',

	// Starts with: ஓ
	'ஓசை', 'ஓசையும்', 'ஓசையை',

	// Starts with: ச
	'செய்து', 'சென்று', 'சில', 'செய்ய', 'செய்த', 'சிறிது',

];

// ── b12 adds: m  (ர) ──────────────────────────────────────────────────────
// Available: all vowels + h j k l ; ' n v u i o p [ m + f
const W12 = [

	// Starts with: க
	'கேட்டார்', 'காரணம்', 'குரல்', 'குதிரை', 'கூறினார்', 'கொண்டார்',

	// Starts with: ப
	'பெரிய', 'பார்த்து', 'பெயர்', 'பின்னர்', 'பெரும்', 'பார்க்க',

	// Starts with: ம
	'மாதிரி', 'மன்னர்', 'மலர்', 'மருந்து', 'மாமல்லர்', 'மகேந்திர',

	// Starts with: த
	'திரும்ப', 'தெரிந்து', 'திரும்பி', 'திரு', 'தெரியும்', 'தொடர்ந்து',

	// Starts with: ந
	'நீர்', 'நேரம்', 'நின்றார்', 'நேரத்தில்', 'நகர்', 'நாயனார்',

	// Starts with: ய
	'யார்', 'யாரும்', 'யாவரும்', 'யாரோ', 'யாராவது',

	// Starts with: வ
	'வரும்', 'விருத்தம்', 'வந்தார்', 'வரையில்', 'வரை', 'வீர',

	// Starts with: ட
	'டாக்டர்',

	// Starts with: ண
	'ணகர',

	// Starts with: ச
	'சேர்ந்து', 'சிலர்', 'சொன்னார்', 'செய்தார்', 'சரி', 'சூரியா',

	// Starts with: அ
	'அவர்', 'அவருடைய', 'அதிகாரம்', 'அவரை', 'அனைவரும்', 'அருகில்',

	// Starts with: ஆ
	'ஆண்டவர்', 'ஆயிரம்', 'ஆண்டவரே', 'ஆசிரிய', 'ஆர்', 'ஆயனர்',

	// Starts with: இ
	'இரண்டு', 'இருந்தது', 'இருந்த', 'இருக்கும்', 'இரு', 'இருந்து',

	// Starts with: ஈ
	'ஈர்', 'ஈரம்', 'ஈசர்', 'ஈராறு', 'ஈருரி',

	// Starts with: உ
	'உயிர்', 'உதாரணம்', 'உயர்ந்த', 'உரை', 'உருவம்', 'உரிய',

	// Starts with: ஊ
	'ஊர்', 'ஊரில்', 'ஊரும்', 'ஊரன்', 'ஊருக்கு',

	// Starts with: எ
	'என்றார்', 'எல்லாரும்', 'எதிர்', 'என்கிறார்', 'எல்லோரும்', 'எதிராக',

	// Starts with: ஏ
	'ஏர்', 'ஏரி', 'ஏரியில்', 'ஏகம்பர்', 'ஏனையோர்', 'ஏறினார்',

	// Starts with: ஐ
	'ஐயர்', 'ஐவர்', 'ஐரோப்பிய', 'ஐயனார்', 'ஐவரும்', 'ஐயாயிரம்',

	// Starts with: ஒ
	'ஒரு', 'ஒரே', 'ஒருவன்', 'ஒருவர்', 'ஒவ்வொரு', 'ஒருத்தி',

	// Starts with: ஓ
	'ஓர்', 'ஓரத்தில்', 'ஓரமாக', 'ஓதுவார்', 'ஓடினர்', 'ஓடினார்',

	// Starts with: ர
	'ராகம்', 'ராகவன்', 'ரொம்ப', 'ராணி',

];

// ── b13 adds: y /  (ள ழ) ─────────────────────────────────────────────────
// Available: all vowels + all consonants except ] b  + f
const W13 = [

	// Starts with: க
	'கடவுள்', 'கொள்ள', 'கீழே', 'கேட்டாள்', 'கண்கள்', 'கடவுளின்',

	// Starts with: ப
	'பொருள்', 'பெருமாளே', 'பழைய', 'பிள்ளை', 'பொழுது', 'பெண்கள்',

	// Starts with: ம
	'மக்கள்', 'முழுவதும்', 'மழை', 'மகள்', 'மகிழ்ந்து', 'மக்களின்',

	// Starts with: த
	'தாளம்', 'தோழி', 'தமிழ்', 'தொழுது', 'தொழில்', 'தோள்',

	// Starts with: ந
	'நாள்', 'நாளும்', 'நாளில்', 'நாளைக்கு', 'நின்றாள்', 'நாளை',

	// Starts with: ய
	'யாழ்', 'யானைகள்',

	// Starts with: வ
	'வழி', 'வாழும்', 'வெளியே', 'விழுந்து', 'வாழ்க்கை', 'வாழி',

	// Starts with: ச
	'சோழ', 'சொன்னாள்', 'சூழ்ந்து', 'சூழ்ந்த', 'செய்யுள்',

	// Starts with: அ
	'அவர்கள்', 'அவள்', 'அவளுடைய', 'அவர்களை', 'அவ்வளவு', 'அருள்',

	// Starts with: ஆ
	'ஆள்', 'ஆண்டுகள்', 'ஆழி', 'ஆளும்', 'ஆட்கள்', 'ஆழ்ந்த',

	// Starts with: இ
	'இவ்வளவு', 'இவர்கள்', 'இவள்', 'இளைய', 'இருள்', 'இளம்',

	// Starts with: ஈ
	'ஈழத்து', 'ஈழ', 'ஈழத்தில்',

	// Starts with: உ
	'உள்ள', 'உள்ளம்', 'உள்ளே', 'உள்ளுறை', 'உள்ளது', 'உள்ளன',

	// Starts with: ஊ
	'ஊழி', 'ஊழியம்', 'ஊழியன்', 'ஊழியர்', 'ஊழ்', 'ஊழ்வினை',

	// Starts with: எ
	'என்றாள்', 'எழுந்து', 'எவ்வளவு', 'எவ்வளவோ', 'எழுதிய', 'எழுந்த',

	// Starts with: ஏ
	'ஏழு', 'ஏழை', 'ஏழாம்', 'ஏழும்', 'ஏராளமான', 'ஏளனம்',

	// Starts with: ஐ
	'ஐயடிகள்', 'ஐந்தொழில்', 'ஐந்தெழு', 'ஐயர்வாள்', 'ஐவேள்வி',

	// Starts with: ஒ
	'ஒருவேளை', 'ஒளி', 'ஒருநாள்', 'ஒளிந்து', 'ஒழுக்கம்', 'ஒருநாளும்',

	// Starts with: ஓ
	'ஓரளவு', 'ஓடினாள்', 'ஓலைகள்', 'ஓய்வுநாள்', 'ஓரெழுத்து', 'ஓர்நாள்',

];

// ── b14 adds: ] b  (ஞ ங) ─────────────────────────────────────────────────
// Available: ALL consonants + ALL vowels + f
const W14 = [

	// Starts with: க
	'கொஞ்சம்', 'காஞ்சி', 'கங்கை', 'குறிஞ்சி', 'கொஞ்ச', 'கேளுங்கள்',

	// Starts with: ப
	'பூங்குழலி', 'பரஞ்சோதி', 'பாங்கி', 'பாருங்கள்', 'பொங்கி', 'பொங்கு',

	// Starts with: ம
	'மங்கை', 'மருங்கு', 'மரங்கள்', 'மருங்கின்', 'மங்கையர்', 'மயங்கி',

	// Starts with: த
	'தங்கள்', 'தாங்கள்', 'தங்களை', 'திங்கள்', 'தங்க', 'தாங்கி',

	// Starts with: ந
	'நீங்கள்', 'நாங்கள்', 'நெஞ்சம்', 'நெஞ்சே', 'நெருங்கி', 'நெஞ்சு',

	// Starts with: ய
	'யாங்கு', 'யெங்கும்', 'யாங்கள்',

	// Starts with: ல
	'லிங்கம்', 'லங்கை',

	// Starts with: வ
	'வணங்கி', 'விளங்கும்', 'வாங்கி', 'வாருங்கள்', 'விளங்கிய',

	// Starts with: ச
	'செங்கீரை', 'சங்க', 'செங்கண்', 'செங்கோல்', 'செங்கை', 'செங்கோடன்',

	// Starts with: ர
	'ரஞ்சனி',

	// Starts with: அ
	'அங்கே', 'அங்கு', 'அஞ்சி', 'அங்கண்', 'அங்கேயே', 'அஞ்ச',

	// Starts with: ஆ
	'ஆங்கு', 'ஆங்கே', 'ஆங்கில', 'ஆங்கண்', 'ஆங்காங்கு', 'ஆங்கவன்',

	// Starts with: இ
	'இங்கே', 'இங்கு', 'இறங்கி', 'இறைஞ்சி', 'இலங்கை', 'இங்கேயே',

	// Starts with: ஈ
	'ஈங்கு', 'ஈங்கோயே', 'ஈங்கிது', 'ஈங்கிவன்', 'ஈங்கிவை', 'ஈங்கோய்',

	// Starts with: உ
	'உங்கள்', 'உங்களை', 'உங்க', 'உங்களோடு',

	// Starts with: ஊ
	'ஊங்கு', 'ஊங்கே', 'ஊஞ்சல்', 'ஊரெங்கும்', 'ஊதுங்கள்',

	// Starts with: எ
	'எங்கள்', 'எங்கே', 'எங்கும்', 'எங்களை', 'எங்கேயோ', 'எங்க',

	// Starts with: ஏ
	'ஏங்கி', 'ஏங்க', 'ஏங்கு', 'ஏங்கும்',

	// Starts with: ஐ
	'ஐங்குறு', 'ஐயங்கார்', 'ஐங்கணை', 'ஐங்கரன்',

	// Starts with: ஒ
	'ஒருங்கு', 'ஒருங்கே', 'ஒதுங்கி', 'ஒடுங்கி', 'ஒழுங்கு', 'ஒடுங்கும்',

	// Starts with: ஓ
	'ஓங்கிய', 'ஓங்கு', 'ஓங்கி', 'ஓங்கும்', 'ஓங்க', 'ஓங்கார',

	// Starts with: ஞ
	'ஞான', 'ஞானம்', 'ஞாபகம்', 'ஞாலம்', 'ஞாயிறு',

];

// ── COMMON EVERYDAY WORDS (b08 scope — ல வ available) ────────────────────────
// All use only keys available by b08
export const W_EVERYDAY_BASIC = [
	'அம்மா', 'அப்பா', 'அண்ணா', 'தம்பி', 'அக்கா', 'தங்கை',
	'தாத்தா', 'பாட்டி', 'மகன்', 'மகள்', 'குழந்தை', 'மாமா',
	'நன்றி', 'வணக்கம்', 'சரி', 'இல்லை', 'ஆம்', 'வாழ்க',
	'தலை', 'கை', 'கால்', 'வாய்', 'கண்', 'காது',
	'மூக்கு', 'பல்', 'நாக்கு', 'உடல்', 'முகம்', 'முடி',
	'மழை', 'மரம்', 'இலை', 'பூ', 'பழம்', 'காய்',
	'பால்', 'தண்ணீர்', 'உணவு', 'உப்பு', 'சோறு', 'நீர்',
	'படி', 'எழுது', 'வா', 'போ', 'பார்', 'கேள்',
	'நில்', 'நட', 'உட்கார்', 'சாப்பிடு', 'குடி', 'கொடு',
	'எடு', 'வை', 'சொல்', 'பேசு', 'செய்', 'வாங்கு',
	'நல்ல', 'கெட்ட', 'பெரிய', 'சிறிய', 'புது', 'பழைய',
	'வீடு', 'நகரம்', 'ஊர்', 'வழி', 'தெரு', 'அறை',
	'கதவு', 'மேசை', 'மாலை', 'காலை', 'இரவு', 'பகல்',
	'இன்று', 'நாளை', 'நேற்று', 'இப்போது', 'அப்போது', 'எப்போது',
	'அங்கு', 'இங்கு', 'எங்கு', 'யார்', 'என்ன', 'ஏன்',
	'ஒன்று', 'இரண்டு', 'மூன்று', 'நான்கு', 'ஐந்து', 'பத்து'
];

// ── FULL EVERYDAY WORDS (b14 scope — all consonants available) ────────────────
export const W_EVERYDAY_FULL = [
	...W_EVERYDAY_BASIC,
	'கழுத்து', 'முதுகு', 'வயிறு', 'விரல்', 'நகம்', 'நெற்றி',
	'கன்னம்', 'தோள்', 'மார்பு', 'இடுப்பு', 'தொடை', 'முழங்கால்',
	'கடல்', 'மலை', 'நதி', 'ஆறு', 'ஏரி', 'குளம்',
	'காடு', 'வானம்', 'நிலா', 'சூரியன்', 'விண்மீன்', 'மேகம்',
	'மீன்', 'முட்டை', 'காரம்', 'எண்ணெய்', 'நெய்', 'அரிசி',
	'பருப்பு', 'காய்கறி', 'இனிப்பு', 'புளிப்பு', 'கசப்பு', 'துவர்ப்பு',
	'வெங்காயம்', 'தக்காளி', 'மிளகாய்', 'இஞ்சி', 'பூண்டு', 'கீரை',
	'ஓடு', 'தூங்கு', 'விழி', 'விளையாடு', 'சிரி', 'அழு',
	'பாடு', 'குதி', 'தள்ளு', 'இழு', 'திற',
	'மூடு', 'துடை', 'கழுவு', 'சமை', 'வெட்டு', 'சும',
	'அழகு', 'வலிமை', 'மென்மை', 'வேகம்', 'மெது', 'சூடு',
	'குளிர்', 'கனம்', 'லேசு', 'நீளம்', 'குட்டை', 'உயரம்',
	'பள்ளி', 'கல்லூரி', 'கோவில்', 'சந்தை', 'கடை', 'மருத்துவமனை',
	'நூலகம்', 'பூங்கா', 'பாதை', 'பாலம்', 'வண்டி', 'பேருந்து',
	'நாற்காலி', 'ஜன்னல்', 'கண்ணாடி', 'பாய்', 'போர்வை', 'தலையணை',
	'தட்டு', 'கிண்ணம்', 'கரண்டி', 'துணி', 'ஆடை', 'பை',
	'குடை', 'செருப்பு', 'கடிகாரம்', 'சாவி', 'பூட்டு', 'பெட்டி',
	'நாய்', 'பூனை', 'மாடு', 'ஆடு', 'குதிரை', 'யானை',
	'சிங்கம்', 'புலி', 'மான்', 'குரங்கு', 'குருவி', 'காகம்'
];

// ── INTERMEDIATE WORDS ────────────────────────────────────────────────────────
export const W_INTER = [
	'பயணம்', 'கடிதம்', 'வாழ்க்கை', 'இயற்கை', 'அறிவு', 'துணிவு',
	'பண்பு', 'நட்பு', 'புத்தகம்', 'அகராதி', 'கணினி', 'விவசாயம்',
	'பெருமை', 'சமுதாயம்', 'இணையம்', 'வரலாறு', 'பண்பாடு', 'கலாச்சாரம்',
	'கல்வி', 'தொழில்', 'குடும்பம்', 'திருமணம்', 'பிறந்தநாள்', 'நிகழ்ச்சி',
	'கொண்டாட்டம்', 'மகிழ்ச்சி', 'சந்தோஷம்', 'ஆனந்தம்', 'இன்பம்', 'துன்பம்',
	'நேர்மை', 'உண்மை', 'அன்பு', 'கருணை', 'தயவு', 'இரக்கம்',
	'முயற்சி', 'திறமை', 'சாதனை', 'வெற்றி', 'தோல்வி', 'சவால்',
	'சிரிப்பு', 'அழுகை', 'மகிழ்வு', 'கலக்கம்', 'நம்பிக்கை', 'பொறுமை',
	'விடுதலை', 'சுதந்திரம்', 'உரிமை', 'கடமை', 'பொறுப்பு', 'ஒற்றுமை',
	'ஞாயிறு', 'திங்கள்', 'செவ்வாய்', 'புதன்', 'வியாழன்', 'வெள்ளி',
	'சனி', 'நண்பகல்', 'நள்ளிரவு', 'விடியல்', 'அந்தி', 'மாலைப்பொழுது',
	'மாதம்', 'வருடம்', 'ஆண்டு', 'பருவம்', 'கோடை', 'குளிர்',
	'மழைக்காலம்', 'பனிக்காலம்', 'காற்று', 'வெயில்', 'நட்சத்திரம்', 'புயல்',
	'நாடகம்', 'கவிதை', 'கட்டுரை', 'சிறுகதை', 'நாவல்', 'இலக்கியம்',
	'ஓவியம்', 'இசை', 'நடனம்', 'சிற்பம்', 'அரங்கம்', 'மேடை',
	'பாதுகாப்பு', 'ஒழுக்கம்', 'விழிப்புணர்வு', 'ஆராய்ச்சி', 'கண்டுபிடிப்பு', 'வளர்ச்சி'
];

// ── ADVANCED WORDS ────────────────────────────────────────────────────────────
export const W_ADV = [
	'தொல்காப்பியம்', 'இலக்கணம்', 'சங்கத்தமிழ்', 'எழுத்ததிகாரம்', 'சொல்லதிகாரம்', 'பொருளதிகாரம்',
	'திருக்குறள்', 'கம்பராமாயணம்', 'மணிமேகலை', 'சிலப்பதிகாரம்', 'சீவகசிந்தாமணி', 'குண்டலகேசி',
	'குறுந்தொகை', 'அகநானூறு', 'புறநானூறு', 'நற்றிணை', 'ஐங்குறுநூறு', 'பதிற்றுப்பத்து',
	'பரிபாடல்', 'கலித்தொகை', 'முல்லைப்பாட்டு', 'குறிஞ்சிப்பாட்டு', 'பட்டினப்பாலை', 'மதுரைக்காஞ்சி',
	'யாப்பிலக்கணம்', 'அணியிலக்கணம்', 'நன்னூல்', 'தண்டியலங்காரம்', 'ஒலிப்பியல்', 'தொடரியல்',
	'முன்னேற்றம்', 'பல்கலைக்கழகம்', 'தொழில்நுட்பம்', 'தகவல்நுட்பம்', 'செயற்கைநுண்ணறிவு', 'ஆராய்ச்சியாளர்',
	'அரசாங்கம்', 'நிர்வாகம்', 'பொருளாதாரம்', 'பாராளுமன்றம்', 'சட்டமன்றம்', 'நீதித்துறை',
	'மக்களாட்சி', 'அரசியலமைப்பு', 'இறையாண்மை', 'குடியரசு', 'குடியுரிமை',
	'பொதுவுடைமை', 'சமத்துவம்', 'மனிதஉரிமை', 'சமூகநீதி', 'மதச்சார்பின்மை', 'அமைச்சரவை',
	'இயற்பியல்', 'வேதியியல்', 'உயிரியல்', 'கணிதவியல்', 'வானியல்', 'புவியியல்',
	'மூலக்கூறு', 'அணுக்கரு', 'ஈர்ப்புவிசை', 'ஒளிச்சேர்க்கை', 'மரபணுவியல்', 'பரிணாமவளர்ச்சி',
	'வாழ்க்கைமுறை', 'நற்பண்புகள்', 'குடும்பமுறை', 'சமூகமுறை', 'மெய்யியல்', 'தத்துவார்த்தம்',
	'மறுமலர்ச்சி', 'பகுத்தறிவு', 'சிந்தனைக்களம்', 'முற்போக்கு', 'சீர்திருத்தம்', 'பன்முகத்தன்மை'
];

// ── Grantha words (a01 scope) ────────────────────────────────────────────────
export const W_GRANTHA = [
	'ஜன்னல்', 'ஜனம்', 'ஜயம்', 'ஜனவரி', 'ஜூலை', 'ஜூன்',
	'ஜலம்', 'ஜாதி', 'ஜனாதிபதி', 'ஜப்பான்', 'ஜாமீன்', 'ஜெயம்',
	'ஜில்லா', 'ரோஜா', 'ராஜா', 'ராஜ்ஜியம்', 'நிஜம்', 'பூஜை',
	'பஞ்சாங்கம்', 'ஜாக்கிரதை', 'ஜவுளி', 'ஜுரம்', 'ஜமீன்தார்', 'கஜம்',
	'ஸபரி', 'ஸந்தோஷம்', 'ஸமாதானம்', 'ஸங்கீதம்', 'ஸரஸ்வதி', 'ஸகல',
	'ஸந்தேகம்', 'ஸபா', 'ஸமயம்', 'ஸஹோதரர்', 'பஸ்', 'போலீஸ்',
	'கிளாஸ்', 'பாஸ்', 'மிஸ்', 'கேஸ்', 'சைக்கிள்ஸ்', 'டெஸ்ட்',
	'ஷண்முகம்', 'புஷ்பம்', 'விஷயம்', 'கஷ்டம்', 'நிமிஷம்', 'ஷோரூம்',
	'நஷ்டம்', 'இஷ்டம்', 'வருஷம்', 'தனுஷ்கோடி', 'விஷம்', 'கோஷம்',
	'பாஷை', 'ஆக்ரோஷம்', 'புருஷன்', 'மனுஷன்', 'வேஷம்', 'சிஷ்யன்',
	'ஹரி', 'ஹரிதம்', 'ஹாஸ்பிடல்', 'ஹோட்டல்', 'ஹிந்தி', 'ஹிமாலயம்',
	'ஹிருதயம்', 'மோஹனம்', 'சிம்ஹம்', 'மகாத்மா', 'சாகஸம்', 'ஆஹாரம்',
	'மோக்ஷம்', 'ரக்ஷை', 'லக்ஷம்', 'அக்ஷரம்', 'தீக்ஷை', 'பரீக்ஷை',
	'நக்ஷத்திரம்', 'சாக்ஷி', 'ஸ்ரீராமர்', 'ஸ்ரீரங்கம்', 'ஸ்ரீதேவி', 'ஜெயஸ்ரீ'
];

const W_AYUTHA = ['அஃது', 'இஃது', 'எஃகு', 'அஃறிணை', 'எஃகம்'];

// ─────────────────────────────────────────────────────────────────────────────
//  CUMULATIVE KEY SETS  (built once, reused by each lesson)
// ─────────────────────────────────────────────────────────────────────────────
// Each entry = the FULL set of allowed keys at that lesson's point.
// Space is always allowed.
const _base = new Set([sp]);

function makeAllowed(...keyArrays) {
  const s = new Set([sp]);
  for (const arr of keyArrays) for (const k of arr) s.add(k);
  return s;
}

// Cumulative sets (each lesson's allowed keys)
const A = {
  b01: makeAllowed(['h', 'j', 'a', 'q', 'f']),
  b02: makeAllowed(['h', 'j', 'k', 'l', ';', "'", 'a', 'q', 'f']),
  b03: makeAllowed(['h', 'j', 'k', 'l', ';', "'", 'a', 'q', 'f']),  // same as b02
  b04: makeAllowed(['h', 'j', 'k', 'l', ';', "'", 'a', 'q', 'f', 's', 'w']),
  b05: makeAllowed(['h', 'j', 'k', 'l', ';', "'", 'a', 'q', 'f', 's', 'w', 'd', 'e']),
  b06: makeAllowed(['h', 'j', 'k', 'l', ';', "'", 'a', 'q', 'f', 's', 'w', 'd', 'e', 'g', 't', 'r']),
  b07: makeAllowed(['h', 'j', 'k', 'l', ';', "'", 'a', 'q', 'f', 's', 'w', 'd', 'e', 'g', 't', 'r', 'c', 'x', 'z']),
  b08: makeAllowed(['h', 'j', 'k', 'l', ';', "'", 'a', 'q', 'f', 's', 'w', 'd', 'e', 'g', 't', 'r', 'c', 'x', 'z', 'n', 'v']),
  b09: makeAllowed(['h', 'j', 'k', 'l', ';', "'", 'a', 'q', 'f', 's', 'w', 'd', 'e', 'g', 't', 'r', 'c', 'x', 'z', 'n', 'v', 'u', 'i']),
  b10: makeAllowed(['h', 'j', 'k', 'l', ';', "'", 'a', 'q', 'f', 's', 'w', 'd', 'e', 'g', 't', 'r', 'c', 'x', 'z', 'n', 'v', 'u', 'i', 'o', 'p']),
  b11: makeAllowed(['h', 'j', 'k', 'l', ';', "'", 'a', 'q', 'f', 's', 'w', 'd', 'e', 'g', 't', 'r', 'c', 'x', 'z', 'n', 'v', 'u', 'i', 'o', 'p', '[']),
  b12: makeAllowed(['h', 'j', 'k', 'l', ';', "'", 'a', 'q', 'f', 's', 'w', 'd', 'e', 'g', 't', 'r', 'c', 'x', 'z', 'n', 'v', 'u', 'i', 'o', 'p', '[', 'm']),
  b13: makeAllowed(['h', 'j', 'k', 'l', ';', "'", 'a', 'q', 'f', 's', 'w', 'd', 'e', 'g', 't', 'r', 'c', 'x', 'z', 'n', 'v', 'u', 'i', 'o', 'p', '[', 'm', 'y', '/']),
  b14: makeAllowed([...C_ALL, ...V_ALL, PU]),   // everything
};
// b15–b20 and beyond: same as b14
const A_FULL = makeAllowed([...C_ALL, ...V_ALL, PU]);
const A_GRANTHA = makeAllowed([...C_ALL, ...V_ALL, PU, 'Q', 'W', 'E', 'R']);
const A_AYUTHA = makeAllowed([...C_ALL, ...V_ALL, PU, 'Q', 'W', 'E', 'R', 'F']);
const A_ALL = makeAllowed([...C_ALL, ...V_ALL, PU, 'Q', 'W', 'E', 'R', 'F', 'Z', 'X', 'C', 'V', 'B', 'D', 'A', 'S']);

// ─────────────────────────────────────────────────────────────────────────────
//  LESSON FACTORY
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build content for a lesson with 25% drill + 75% real words.
 * Both are filtered to `allowed` keys so no future keys appear.
 *
 * @param {Set}    allowed     - cumulative allowed keys for this lesson
 * @param {Array}  drillSyls  - syllable pool for keybr() drill  (empty = skip drill)
 * @param {Array}  mainWords  - primary word list  (lesson-focused)
 * @param {Array}  extraWords - review/variety words from earlier lessons
 * @param {number} wordCount  - total word tokens to emit
 * @param {number} drillLen   - drill section length in keystrokes  (≈25%)
 */
function buildLesson(allowed, drillSyls, mainWords, extraWords, wordCount, drillLen) {
  const main = filterWords(mainWords, allowed);
  const extra = filterWords(extraWords, allowed);
  const safeMain = main.length ? main : (extra.length ? extra : []);
  const safeReview = extra.length ? extra : safeMain;
  if (!safeMain.length) return [];

  const safeSyls = drillSyls.filter(s => s.every(k => allowed.has(k)));
  const drillOut = safeSyls.length ? keybr(safeSyls, drillLen) : [];

  const mainN = Math.round(wordCount * 0.70);
  const tokens = [];
  let lastPick = null;

  for (let i = 0; i < wordCount; i++) {
    const p = (i < mainN) ? safeMain : safeReview;
    let word = p[ri(p.length)];
    if (word === lastPick && p.length > 1) {
      word = p[(p.indexOf(word) + 1) % p.length];
    }
    tokens.push(word);
    lastPick = word;
  }

  // Shuffle
  for (let i = tokens.length - 1; i > 0; i--) {
    const j = ri(i + 1);
    [tokens[i], tokens[j]] = [tokens[j], tokens[i]];
  }

  // Prevent adjacent identical words without dropping tokens
  for (let i = 1; i < tokens.length; i++) {
    if (tokens[i] === tokens[i - 1] && tokens.length > 2) {
      const swapIdx = (i + 1) % tokens.length;
      [tokens[i], tokens[swapIdx]] = [tokens[swapIdx], tokens[i]];
    }
  }

  const wordPart = [];
  tokens.forEach(w => wordPart.push(...tamilToKeys(w), sp));
  while (wordPart.length && wordPart[wordPart.length - 1] === sp) wordPart.pop();

  return drillOut.length ? [...drillOut, sp, ...wordPart] : wordPart;
}


// ─────────────────────────────────────────────────────────────────────────────
//  LESSONS DB
// ─────────────────────────────────────────────────────────────────────────────
export const LESSONS_DB = {
  beginner: [

    // ── b01: க ப + அ ஆ + ் ────────────────────────────────────────────────
    // Pulli introduced here so first real words (கல் பல்) appear immediately.
    {
      id: 'b01', order: 1, level: 'beginner',
      title: 'க ப + ்',
      description: 'h j — க ப with அ ஆ and pulli ்',
      focusKeys: ['h', 'j', 'a', 'q', 'f'], targetWPM: 10,
      generateContent() {
        const syls = [...pool(['h', 'j'], V_A, true), ['a']]; // CV + pulli + standalone அ
        const drill = intro(syls);
        const words = filterWords(W01, A.b01);
        const wordOut = wordsGen(words, 8);
        return [...drill, sp, ...wordOut];
      }
    },

    // ── b02: ம த ந ய ──────────────────────────────────────────────────────
    {
      id: 'b02', order: 2, level: 'beginner',
      title: 'ம த ந ய',
      description: "k l ; ' — home row complete",
      focusKeys: ['k', 'l', ';', "'", 'a', 'q', 'f', 'h', 'j'], targetWPM: 10,
      generateContent() {
	  const newSyls = pool(['k', 'l', ';', "'"], V_A, true);
	  return buildLesson(A.b02, newSyls, W02, W01, 18, 30);
	}
    },

    // ── b03: Home Row Speed ────────────────────────────────────────────────
    {
      id: 'b03', order: 3, level: 'beginner',
      title: 'Home Row Speed',
      description: 'All 6 home consonants — speed up with real words',
      focusKeys: [...C_HR, 'a', 'q', 'f'], targetWPM: 12,
      generateContent() {
        return buildLesson(A.b03, pool(C_HR, V_A, true), W02, W01, 22, 25);
      }
    },

    // ── b04: இ ஈ ──────────────────────────────────────────────────────────
    {
      id: 'b04', order: 4, level: 'beginner',
      title: 'இ ஈ',
      description: 's w — left ring finger',
      focusKeys: ['h', 'j', 'k', 'l', ';', "'", 's', 'w', 'f', 'a', 'q'], targetWPM: 12,
      generateContent() {
        const newSyls = pool(C_HR, V_I);
        return buildLesson(A.b04, newSyls, W04, W02, 20, 28);
      }
    },

    // ── b05: உ ஊ ──────────────────────────────────────────────────────────
    {
      id: 'b05', order: 5, level: 'beginner',
      title: 'உ ஊ',
      description: 'd e — left middle finger',
      focusKeys: ['h', 'j', 'k', 'l', ';', "'", 'd', 'e', 'f', 'q', 's', 'w', 'a'], targetWPM: 12,
      generateContent() {
        const newSyls = pool(C_HR, V_U);
        return buildLesson(A.b05, newSyls, W05, [...W04, ...W02], 20, 25);
      }
    },

    // ── b06: எ ஏ ஐ ────────────────────────────────────────────────────────
    {
      id: 'b06', order: 6, level: 'beginner',
      title: 'எ ஏ ஐ',
      description: 'g t r — left index finger',
      focusKeys: ['h', 'j', 'k', 'l', ';', "'", 'g', 't', 'r', 'f', 'q', 's', 'a', 'd', 'e', 'w'], targetWPM: 14,
      generateContent() {
        const newSyls = pool(C_HR, V_E);
        return buildLesson(A.b06, newSyls, W06, [...W05, ...W04, ...W02], 20, 25);
      }
    },

    // ── b07: ஒ ஓ ஔ — all 12 vowels ────────────────────────────────────────
    {
      id: 'b07', order: 7, level: 'beginner',
      title: 'ஒ ஓ ஔ',
      description: 'c x z — all 12 vowels now complete',
      focusKeys: ['h', 'j', 'k', 'l', ';', "'", 'c', 'x', 'z', 'f', 't', 's', 'r', 'd', 'e', 'w', 'q', 'g'], targetWPM: 14,
      generateContent() {
        const newSyls = pool(C_HR, V_O);
        return buildLesson(A.b07, newSyls, W07, [...W06, ...W05, ...W04], 20, 25);
      }
    },

    // ── b08: ல வ ──────────────────────────────────────────────────────────
    {
      id: 'b08', order: 8, level: 'beginner',
      title: 'ல வ',
      description: 'n v — very frequent in Tamil; words now dominate',
      focusKeys: ['n', 'v', 'a', 'q', 's', 'w', 'd', 'e', 'g', 't', 'r', 'c', 'x', 'h', 'j', 'k', 'l', ';', "'", 'f'], targetWPM: 14,
      generateContent() {
        const newSyls = pool(['n', 'v'], [...V_A, ...V_I, ...V_U]);
        return buildLesson(A.b08, newSyls, W08, [...W07, ...W_EVERYDAY_BASIC], 24, 22);
      }
    },

    // ── b09: ற ன ──────────────────────────────────────────────────────────
    {
      id: 'b09', order: 9, level: 'beginner',
      title: 'ற ன',
      description: 'u i — word-endings; mostly real words',
      focusKeys: ['u', 'i', 'a', 'q', 's', 'w', 'd', 'e', 'g', 't', 'r', 'x', 'h', 'j', 'k', 'l', ';', "'", 'n', 'v', 'f'], targetWPM: 14,
      generateContent() {
        const newSyls = pool(['u', 'i'], [...V_A, ...V_I]);
        return buildLesson(A.b09, newSyls, W09, [...W08, ...W_EVERYDAY_BASIC], 24, 20);
      }
    },

    // ── b10: ட ண ──────────────────────────────────────────────────────────
    {
      id: 'b10', order: 10, level: 'beginner',
      title: 'ட ண',
      description: 'o p — retroflex stops',
      focusKeys: ['o', 'p', 'a', 'q', 's', 'w', 'd', 'e', 'g', 't', 'r', 'c', 'x', 'h', 'j', 'k', 'l', ';', "'", 'n', 'v', 'u', 'i', 'f'], targetWPM: 14,
      generateContent() {
        const newSyls = pool(['o', 'p'], [...V_A, ...V_I, 'd']);
        return buildLesson(A.b10, newSyls, W10, [...W09, ...W08, ...W_EVERYDAY_BASIC], 24, 20);
      }
    },

    // ── b11: ச ─────────────────────────────────────────────────────────────
    {
      id: 'b11', order: 11, level: 'beginner',
      title: 'ச',
      description: '[ — most common sibilant in Tamil',
      focusKeys: ['[', 'a', 'q', 's', 'w', 'd', 'e', 'g', 't', 'r', 'c', 'x', 'h', 'j', 'k', 'l', ';', "'", 'n', 'v', 'u', 'i', 'o', 'p', 'f'], targetWPM: 14,
      generateContent() {
        const newSyls = pool(['['], [...V_A, ...V_I, ...V_U, ...V_E]);
        return buildLesson(A.b11, newSyls, W11, [...W10, ...W09, ...W_EVERYDAY_BASIC], 24, 20);
      }
    },

    // ── b12: ர ─────────────────────────────────────────────────────────────
    {
      id: 'b12', order: 12, level: 'beginner',
      title: 'ர',
      description: 'm — used in many common nouns',
      focusKeys: ['m', 'a', 'q', 's', 'w', 'd', 'e', 'g', 't', 'r', 'c', 'x', 'h', 'j', 'k', 'l', ';', "'", 'n', 'v', 'u', 'i', 'o', 'p', '[', 'f'], targetWPM: 14,
      generateContent() {
        const newSyls = pool(['m'], [...V_A, ...V_I, ...V_U]);
        return buildLesson(A.b12, newSyls, W12, [...W11, ...W10, ...W_EVERYDAY_BASIC], 24, 20);
      }
    },

    // ── b13: ள ழ ───────────────────────────────────────────────────────────
    {
      id: 'b13', order: 13, level: 'beginner',
      title: 'ள ழ',
      description: 'y / — unique Tamil letters',
      focusKeys: ['y', '/', 'a', 'q', 's', 'w', 'd', 'e', 'g', 't', 'r', 'c', 'x', 'h', 'j', 'k', 'l', ';', "'", 'n', 'v', 'u', 'i', 'o', 'p', '[', 'm', 'f'], targetWPM: 14,
      generateContent() {
        const newSyls = pool(['y', '/'], [...V_A, ...V_I, ...V_U]);
        return buildLesson(A.b13, newSyls, W13, [...W12, ...W11, ...W_EVERYDAY_BASIC], 24, 20);
      }
    },

    // ── b14: ஞ ங ───────────────────────────────────────────────────────────
    {
      id: 'b14', order: 14, level: 'beginner',
      title: 'ஞ ங',
      description: '] b — rare; all consonants now unlocked',
      focusKeys: [']', 'b', 'a', 'q', 's', 'w', 'd', 'e', 'g', 't', 'r', 'c', 'x', 'h', 'j', 'k', 'l', ';', "'", 'n', 'v', 'u', 'i', 'o', 'p', '[', 'm', 'y', '/', 'f'], targetWPM: 14,
      generateContent() {
        const newSyls = pool([']', 'b'], V_A);
        return buildLesson(A_FULL, newSyls, W14, [...W13, ...W_EVERYDAY_BASIC], 24, 18);
      }
    },

    // ── b15–b19: Uyirmei grids + words (no new keys) ─────────────────────
    {
      id: 'b15', order: 15, level: 'beginner',
      title: 'உயிர்மெய் — க ப',
      description: 'க கா கி கீ கு கூ கெ கே கை கொ கோ கௌ … ப …',
      focusKeys: ['h', 'j', 'f', 'a', 'q', 's', 'w', 'd', 'e', 'g', 't', 'r', 'c', 'x', 'z', 'v', 'k', 'o', '/', 'l', ';', '[', 'y', "'", 'i', 'n', 'u', 'm', 'p', 'b'], targetWPM: 16,
      generateContent() {
        const grid = uyirmeiGrid(['h', 'j'], V_ALL);
        const words = filterWords([...W01, ...W02, ...W04, ...W_EVERYDAY_FULL], A_FULL);
        return [...grid, sp, ...wordsGen(words, 18)];
      }
    },

    {
      id: 'b16', order: 16, level: 'beginner',
      title: 'உயிர்மெய் — ம த',
      description: 'ம மா மி மீ மு மூ மெ மே மை மொ மோ மௌ … த …',
      focusKeys: ['k', 'l', 'f', 'a', 'q', 's', 'w', 'd', 'e', 'g', 't', 'r', 'c', 'x', 'z', 'h', 'v', 'u', 'i', 'o', 'j', 'n', 'b', "'", 'p', 'm', '[', ';', '/', 'y'], targetWPM: 16,
      generateContent() {
        const grid = uyirmeiGrid(['k', 'l'], V_ALL);
        const words = filterWords([...W02, ...W04, ...W05, ...W_EVERYDAY_FULL], A_FULL);
        return [...grid, sp, ...wordsGen(words, 18)];
      }
    },

    {
      id: 'b17', order: 17, level: 'beginner',
      title: 'உயிர்மெய் — ந ய',
      description: 'ந நா நி நீ … ய யா யி யீ …',
      focusKeys: [';', "'", 'f', 'a', 'q', 's', 'w', 'd', 'e', 'g', 't', 'r', 'c', 'x', 'z', 'h', 'k', 'y', 'v', 'l', 'b', 'o', 'n', '/', 'j', 'i', 'u', 'p', 'm', '['], targetWPM: 16,
      generateContent() {
        const grid = uyirmeiGrid([';', "'"], V_ALL);
        const words = filterWords([...W02, ...W06, ...W07, ...W_EVERYDAY_FULL], A_FULL);
        return [...grid, sp, ...wordsGen(words, 18)];
      }
    },

    {
      id: 'b18', order: 18, level: 'beginner',
      title: 'உயிர்மெய் — ல வ',
      description: 'ல லா லி லீ … வ வா வி வீ …',
      focusKeys: ['n', 'v', 'f', 'a', 'q', 's', 'w', 'd', 'e', 'g', 't', 'r', 'c', 'x', 'z', 'l', 'o', 'h', 'k', ';', 'm', 'j', '[', 'u', "'", '/', 'i', 'p', 'b', 'y', ']'], targetWPM: 18,
      generateContent() {
        const grid = uyirmeiGrid(['n', 'v'], V_ALL);
        const words = filterWords([...W08, ...W_EVERYDAY_FULL], A_FULL);
        return [...grid, sp, ...wordsGen(words, 18)];
      }
    },

    {
      id: 'b19', order: 19, level: 'beginner',
      title: 'உயிர்மெய் — ற ன',
      description: 'ற றா றி றீ … ன னா னி னீ …',
      focusKeys: ['u', 'i', 'f', 'a', 'q', 's', 'w', 'd', 'e', 'g', 't', 'r', 'c', 'x', 'z', ';', 'j', 'y', 'k', 'h', 'p', 'o', 'v', '/', 'l', 'b', 'n', "'", '[', 'm'], targetWPM: 18,
      generateContent() {
        const grid = uyirmeiGrid(['u', 'i'], V_ALL);
        const words = filterWords([...W09, ...W_EVERYDAY_FULL], A_FULL);
        return [...grid, sp, ...wordsGen(words, 18)];
      }
    },

    // ── b20: Beginner Final — 100 % words ─────────────────────────────────
    {
      id: 'b20', order: 20, level: 'beginner',
      title: 'பொதுவான சொற்கள்',
      description: 'All beginner keys — real words only',
      focusKeys: ['a', 'q', 's', 'w', 'd', 'e', 'g', 't', 'r', 'c', 'x', 'h', 'j', 'k', 'l', ';', "'", 'n', 'v', 'u', 'i', 'o', 'p', '[', 'm', 'y', '/', 'b', 'f'], targetWPM: 22,
      generateContent() {
        const all = filterWords([...W_EVERYDAY_FULL, ...W_INTER.slice(0, 20)], A_FULL);
        return wordsGen(all, 32);
      }
    },
  ],

  // ── INTERMEDIATE ───────────────────────────────────────────────────────────
  intermediate: [

    {
      id: 'i01', order: 1, level: 'intermediate',
      title: 'உயிர்மெய் — ட ண',
      description: 'ட டா டி … ண ணா ணி … + words',
      focusKeys: ['o', 'p', 'f', 'a', 'q', 's', 'w', 'd', 'e', 'g', 't', 'r', 'c', 'x', 'z', 'l', 'm', ';', 'u', 'h', 'n', 'k', 'y', '/', 'v', "'", 'j', '[', 'b', 'i'], targetWPM: 20,
      generateContent() {
        const grid = uyirmeiGrid(['o', 'p'], V_ALL);
        const words = filterWords([...W10, ...W_EVERYDAY_FULL], A_FULL);
        return [...grid, sp, ...wordsGen(words, 20)];
      }
    },

    {
      id: 'i02', order: 2, level: 'intermediate',
      title: 'உயிர்மெய் — ச ர',
      description: 'ச சா சி … ர ரா ரி … + words',
      focusKeys: ['[', 'm', 'f', 'a', 'q', 's', 'w', 'd', 'e', 'g', 't', 'r', 'c', 'x', 'z', 'k', 'n', 'l', 'h', 'o', 'b', 'j', 'v', 'i', ';', 'y', 'u', "'", '/', 'p'], targetWPM: 20,
      generateContent() {
        const grid = uyirmeiGrid(['[', 'm'], V_ALL);
        const words = filterWords([...W11, ...W12, ...W_EVERYDAY_FULL], A_FULL);
        return [...grid, sp, ...wordsGen(words, 20)];
      }
    },

    {
      id: 'i03', order: 3, level: 'intermediate',
      title: 'உயிர்மெய் — ள ழ',
      description: 'ள ளா ளி … ழ ழா ழி … + words',
      focusKeys: ['y', '/', 'f', 'a', 'q', 's', 'w', 'd', 'e', 'g', 't', 'r', 'c', 'x', 'z', 'k', 'v', 'n', 'h', "'", 'p', 'j', 'o', 'l', ';', 'b', 'm', 'i', '[', 'u'], targetWPM: 20,
      generateContent() {
        const grid = uyirmeiGrid(['y', '/'], V_ALL);
        const words = filterWords([...W13, ...W_EVERYDAY_FULL, ...W_INTER.slice(0, 15)], A_FULL);
        return [...grid, sp, ...wordsGen(words, 20)];
      }
    },

    {
      id: 'i04', order: 4, level: 'intermediate',
      title: 'உயிர்மெய் — ஞ ங',
      description: 'ஞ ஞா ஞி … ங ங்  + full word review',
      focusKeys: [']', 'b', 'f', 'a', 'q', 's', 'w', 'd', 'e', 'g', 't', 'r', 'c', 'x', 'z', 'n', 'k', 'j', 'l', ';', 'h', 'm', '[', 'v', 'y', 'u', 'o', "'", 'i', 'p', '/'], targetWPM: 20,
      generateContent() {
        const grid = uyirmeiGrid([']', 'b'], V_ALL);
        const words = filterWords([...W14, ...W_EVERYDAY_FULL, ...W_INTER.slice(0, 20)], A_FULL);
        return [...grid, sp, ...wordsGen(words, 22)];
      }
    },

    {
      id: 'i05', order: 5, level: 'intermediate',
      title: 'All Uyirmei Speed',
      description: 'All consonants × all vowels — words only',
      focusKeys: ['h', 'j', 'k', 'l', ';', "'", 'n', 'v', 'u', 'i', 'o', 'p', '[', 'm', 'y', '/', ']', 'b', 'f', 'a', 'q', 's', 'w', 'd', 'e', 'g', 't', 'r', 'c', 'x'], targetWPM: 24,
      generateContent() {
        const words = filterWords([...W_EVERYDAY_FULL, ...W_INTER], A_FULL);
        return wordsGen(words, 30);
      }
    },

    {
      id: 'i06', order: 6, level: 'intermediate',
      title: 'Words — Speed I',
      description: 'Common Tamil words at 26 WPM',
      focusKeys: ['h', 'j', 'k', 'l', ';', "'", 'n', 'v', 'u', 'i', 'o', 'p', '[', 'm', 'y', '/', ']', 'b', 'f', 'a', 'q', 's', 'w', 'd', 'e', 'g', 't', 'r', 'c', 'x'], targetWPM: 26,
      generateContent() {
        const words = filterWords([...W_INTER, ...W_EVERYDAY_FULL], A_FULL);
        return wordsGen(words, 30);
      }
    },

    {
      id: 'i07', order: 7, level: 'intermediate',
      title: 'Words — Speed II',
      description: 'Richer vocabulary at 28 WPM',
      focusKeys: ['h', 'j', 'k', 'l', ';', "'", 'n', 'v', 'u', 'i', 'o', 'p', '[', 'm', 'y', '/', ']', 'b', 'f', 'a', 'q', 's', 'd', 'g', 't', 'r', 'c', 'x'], targetWPM: 28,
      generateContent() {
        const words = filterWords([...W_INTER, ...W_ADV.slice(0, 20)], A_FULL);
        return wordsGen(words, 30);
      }
    },

    {
      id: 'i08', order: 8, level: 'intermediate',
      title: 'Intermediate Speed',
      description: 'Full vocabulary — 30 WPM',
      focusKeys: ['h', 'j', 'k', 'l', ';', "'", 'n', 'v', 'u', 'i', 'o', 'p', '[', 'm', 'y', '/', ']', 'b', 'f', 'a', 'q', 's', 'w', 'd', 'e', 'g', 't', 'r', 'c', 'x'], targetWPM: 30,
      generateContent() {
        const words = filterWords([...W_INTER, ...W_ADV], A_FULL);
        return wordsGen(words, 30);
      }
    },
  ],

  // ── ADVANCED ───────────────────────────────────────────────────────────────
  advanced: [

    {
      id: 'a01', order: 1, level: 'advanced',
      title: 'Grantha — ஸ ஷ ஜ ஹ',
      description: 'Shift+Q W E R — borrowed consonants',
      focusKeys: ['Q', 'W', 'E', 'R', 'f', 'q', 's', 'w', 'l', 'd', 'p', 'v', 'h', 'o', 'k', 'j', ';', 'x', 'm', 'n', "'", 'r', 'i', 'e', 'a', '[', 'u', 't', '/', 'g'], targetWPM: 26,
      generateContent() {
        const gGrid = uyirmeiGrid(['Q', 'W', 'E', 'R'], [...V_A, ...V_I]);
        const words = filterWords([...W_GRANTHA, ...W_INTER.slice(0, 15)], A_GRANTHA);
        return [...gGrid, sp, ...wordsGen(words, 16)];
      }
    },

    {
      id: 'a02', order: 2, level: 'advanced',
      title: 'ஃ Ayutha Ezhuthu',
      description: 'Shift+F — unique aspirate letter',
      focusKeys: ['F', 'f', 'h', 'j', 'k', 'l', ';', "'", 'a', 'q', 's', 'w', 'd', 'e', 'g', 't', 'r', 'c', 'x', 'p', 'o', 'i', 'm', 'v', '[', 'u', 'n', 'b', '/', 'W', ']', 'y', 'E'], targetWPM: 28,
      generateContent() {
        const np = C_HR.map(c => ['F', c]);
        const drill = intro(np);
        const words = filterWords([...W_AYUTHA, ...W_ADV, ...W_INTER], A_AYUTHA);
        return [...drill, sp, ...wordsGen(words, 20)];
      }
    },

    {
      id: 'a03', order: 3, level: 'advanced',
      title: 'Speed Drill I',
      description: 'Home row + all vowels — 32 WPM',
      focusKeys: ['h', 'j', 'k', 'l', ';', "'", 'n', 'v', 'a', 'q', 's', 'w', 'd', 'e', 'g', 't', 'r', 'c', 'x', 'f', ']', 'u', 'i', 'p', 'o', 'm', '[', '/', 'b', 'y'], targetWPM: 32,
      generateContent() {
        const words = filterWords([...W_ADV, ...W_INTER], A_FULL);
        return wordsGen(words, 32);
      }
    },

    {
      id: 'a04', order: 4, level: 'advanced',
      title: 'Speed Drill II',
      description: 'Full keyboard — 36 WPM — words only',
      focusKeys: ['h', 'j', 'k', 'l', ';', "'", 'n', 'v', 'u', 'i', 'o', 'p', '[', 'm', 'y', '/', ']', 'b', 'f', 'a', 'q', 's', 'w', 'd', 'e', 'g', 't', 'r', 'c', 'x'], targetWPM: 36,
      generateContent() {
        const words = filterWords([...W_ADV, ...W_INTER, ...W_EVERYDAY_FULL], A_FULL);
        return wordsGen(words, 32);
      }
    },

    {
      id: 'a05', order: 5, level: 'advanced',
      title: 'Marathon',
      description: 'All keys — 38 WPM',
      focusKeys: ['a', 'q', 's', 'w', 'd', 'e', 'g', 't', 'r', 'c', 'x', 'h', 'j', 'k', 'l', ';', "'", 'n', 'v', 'u', 'i', 'o', 'p', '[', 'm', 'y', '/', ']', 'b', 'f', 'Q', 'W', 'E', 'R'], targetWPM: 38,
      generateContent() {
        const words = filterWords([...W_ADV, ...W_GRANTHA, ...W_INTER], A_GRANTHA);
        return wordsGen(words, 32);
      }
    },

    {
      id: 'a06', order: 6, level: 'advanced',
      title: 'Tamil Text Speed',
      description: 'Literary and complex words — 40 WPM',
      focusKeys: ['h', 'j', 'k', 'l', ';', "'", 'n', 'v', 'u', 'i', 'o', 'p', '[', 'm', 'y', '/', ']', 'b', 'f', 'a', 'q', 's', 'w', 'd', 'e', 'g', 't', 'r', 'c', 'x'], targetWPM: 40,
      generateContent() {
        const words = filterWords([...W_ADV, ...W_INTER], A_FULL);
        return wordsGen(words, 34);
      }
    },

    {
      id: 'a07', order: 7, level: 'advanced',
      title: 'கணக்கு குறிகள்',
      description: 'Shift+Z X C V B D A S — Tamil accounting symbols',
      focusKeys: ['Z', 'X', 'C', 'V', 'B', 'D', 'A', 'S', ';', 'q', 'y', 'f', 'k', 'l', 'v', 'm', 'd', 'o', 'h', 'i', 'j', 'u', 'e', "'", 'g', 'p', 't', 'n'], targetWPM: 18,
      generateContent() {
        const out = [];
        const symWords = ['நாள்', 'மாதம்', 'வருடம்', 'கடன்', 'பற்று', 'ரூபாய்', 'எண்', 'மேலே'];
        const symKeys = { 'நாள்': 'Z', 'மாதம்': 'X', 'வருடம்': 'C', 'கடன்': 'V', 'பற்று': 'B', 'ரூபாய்': 'A', 'எண்': 'S', 'மேலே': 'D' };
        function pw(w) { out.push(...tamilToKeys(w), sp); }
        for (let i = 0; i < 8; i++) {
          pw('நாள்'); out.push('Z', sp);
          pw('மாதம்'); out.push('X', sp);
          pw('வருடம்'); out.push('C', sp);
          if (i % 2 === 0) { pw('கடன்'); out.push('V', sp); pw('பற்று'); out.push('B', sp); }
          pw('ரூபாய்'); out.push('A', sp);
          pw('எண்'); out.push('S', sp);
          if (i % 3 === 0) { pw('மேலே'); out.push('D', sp); }
        }
        for (let i = 0; i < 6; i++) {
          const w = symWords[ri(symWords.length)];
          pw(w); out.push(symKeys[w], sp);
        }
        while (out.length && out[out.length - 1] === sp) out.pop();
        return out;
      }
    },
  ],
};

export const ALL_LESSONS = [
  ...LESSONS_DB.beginner,
  ...LESSONS_DB.intermediate,
  ...LESSONS_DB.advanced,
];

export function getLessonById(id) { return ALL_LESSONS.find(l => l.id === id) ?? null; }
export function getNextLesson(id) {
  const i = ALL_LESSONS.findIndex(l => l.id === id);
  // i === -1 (unknown id) must not fall through to ALL_LESSONS[0]
  return i >= 0 && i < ALL_LESSONS.length - 1 ? ALL_LESSONS[i + 1] : null;
}
export function getPrevLesson(id) { const i = ALL_LESSONS.findIndex(l => l.id === id); return i > 0 ? ALL_LESSONS[i - 1] : null; }
export function getLessonIndex(id) { return ALL_LESSONS.findIndex(l => l.id === id); }
export function getFirstIncomplete(done = []) { return ALL_LESSONS.find(l => !done.includes(l.id)) ?? ALL_LESSONS[0]; }
