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

// ─── Tamil Unicode → Tamil99 key ─────────────────────────────────────────────
const TAMIL99_MAP = {
  'அ': 'a', 'ஆ': 'q', 'இ': 's', 'ஈ': 'w', 'உ': 'd', 'ஊ': 'e',
  'எ': 'g', 'ஏ': 't', 'ஐ': 'r', 'ஒ': 'c', 'ஓ': 'x', 'ஔ': 'z',
  'க': 'h', 'ங': 'b', 'ச': '[', 'ஞ': ']', 'ட': 'o', 'ண': 'p',
  'த': 'l', 'ந': ';', 'ப': 'j', 'ம': 'k', 'ய': "'", 'ர': 'm',
  'ல': 'n', 'வ': 'v', 'ழ': '/', 'ள': 'y', 'ற': 'u', 'ன': 'i',
  'ா': 'q', 'ி': 's', 'ீ': 'w', 'ு': 'd', 'ூ': 'e',
  'ெ': 'g', 'ே': 't', 'ை': 'r', 'ொ': 'c', 'ோ': 'x', 'ௌ': 'z',
  '்': PU,
  'ஃ': 'F', 'ஷ': 'W', 'ஸ': 'Q', 'ஜ': 'E', 'ஹ': 'R',
  '௳': 'Z', '௴': 'X', '௵': 'C', '௶': 'V', '௷': 'B', '௸': 'D', '௹': 'A', '௺': 'S',
};

/** Convert Tamil Unicode string → array of Tamil99 key characters */
function wordToKeys(word) {
  const keys = [];
  for (const ch of word) {
    if (ch === ' ') { keys.push(sp); continue; }
    const k = TAMIL99_MAP[ch];
    if (k !== undefined) keys.push(k);
  }
  return keys;
}

/**
 * Given a Tamil Unicode word and a Set of allowed keys,
 * return true if every key in the word is in the allowed set.
 */
function wordAllowed(word, allowed) {
  return wordToKeys(word).every(k => allowed.has(k));
}

/** Filter a word array to only those whose keys are all in `allowed` */
function filterWords(arr, allowed) {
  return arr.filter(w => wordAllowed(w, allowed));
}

// ─── Key groups ───────────────────────────────────────────────────────────────
const V_A = ['a', 'q'];
const V_I = ['s', 'w'];
const V_U = ['d', 'e'];
const V_E = ['g', 't', 'r'];
const V_O = ['c', 'x', 'z'];
const V_ALL = [...V_A, ...V_I, ...V_U, ...V_E, ...V_O];

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
    for (const v of vows) o.push([c, v]);
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
  const sh = [...syl].sort(() => Math.random() - 0.5);
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
  const sc = [...cons].sort(() => Math.random() - 0.5);
  const out = [];
  for (const c of sc) {
    for (const v of vows) out.push(c, v);
    out.push(sp);
  }
  while (out.length && out[out.length - 1] === sp) out.pop();
  return out;
}

// ─── Word generation helpers ──────────────────────────────────────────────────

/** Emit `count` words randomly picked from `wordList` */
function wordsGen(wordList, count) {
  if (!wordList.length || count <= 0) return [];
  const out = [];
  for (let i = 0; i < count; i++)
    out.push(...wordToKeys(wordList[ri(wordList.length)]), sp);
  while (out.length && out[out.length - 1] === sp) out.pop();
  return out;
}

/**
 * Build a lesson block: 25% drill, 75% words — both filtered to `allowed`.
 * `drillSyls`  — syllable array for keybr() (pass [] for word-only lessons)
 * `mainWords`  — primary word pool (lesson-focused)
 * `reviewWords`— secondary word pool (prior lessons, for variety)
 * `totalWords` — how many word tokens to emit
 * `drillChars` — how many drill keystrokes (≈ 25 % of total)
 */
function lessonBlock(allowed, drillSyls, mainWords, reviewWords, totalWords, drillChars) {
  // Filter every word list to allowed keys
  const main = filterWords(mainWords, allowed);
  const review = filterWords(reviewWords, allowed);
  const drill = drillSyls.length
    ? keybr(drillSyls.filter(s => s.every(k => allowed.has(k))), drillChars)
    : [];

  // 70 % main, 30 % review (of the word portion)
  const mainN = Math.round(totalWords * 0.70);
  const reviewN = totalWords - mainN;
  const tokens = [];
  const safeMain = main.length ? main : (review.length ? review : []);
  const safeReview = review.length ? review : safeMain;
  for (let i = 0; i < mainN; i++) tokens.push(safeMain[ri(safeMain.length)]);
  for (let i = 0; i < reviewN; i++) tokens.push(safeReview[ri(safeReview.length)]);
  // Shuffle
  for (let i = tokens.length - 1; i > 0; i--) {
    const j = ri(i + 1);[tokens[i], tokens[j]] = [tokens[j], tokens[i]];
  }
  const wordPart = [];
  tokens.forEach(w => wordPart.push(...wordToKeys(w), sp));
  while (wordPart.length && wordPart[wordPart.length - 1] === sp) wordPart.pop();

  return drill.length ? [...drill, sp, ...wordPart] : wordPart;
}

// ─────────────────────────────────────────────────────────────────────────────
//  WORD DATABASE
//  All words are real Tamil Unicode strings.
//  Annotated with the Tamil99 consonant keys each requires.
//  Organised from simplest (fewest keys) to most complex.
// ─────────────────────────────────────────────────────────────────────────────

// ── b01 keys: h j a q f  (க ப + அ ஆ + ்) ──────────────────────────────────
const W01 = [
  // Only க / ப consonants + அ / ஆ vowels + ்
  'அக', 'ஆக', 'கா', 'பா', 'காக', 'பாக',
  'கக்', 'பக்', 'அக்க', 'கப்', 'பக',
  'ககா', 'பாப்', 'காப்', 'அப்',
  'கப்பம்',                     // ் on last ம — but ம is not yet! skip
];
// Safe b01 words: only h j a q f
const W01_SAFE = [
  'அக', 'ஆக', 'கா', 'பா',
  'கப்', 'பக்', 'காக', 'பாப்', 'காப்',
];

// ── b02 adds: k l ; '  (ம த ந ய) ──────────────────────────────────────────
// Now available: h j k l ; ' a q f
const W02 = [
  'அம்மா', 'அப்பா', 'அக்கா', 'கம்மா',
  'நாயம்', 'மாயம்', 'தாயம்', 'நயம்', 'மயம்',
  'அந்த', 'மாதம்', 'தந்தம்', 'நாதம்',
  'காகம்', 'பாகம்', 'பாதம்', 'தாகம்', 'நாகம்',
  'கம்பம்', 'ஆதாயம்', 'ஆகாயம்', 'அந்தம்',
  'மந்தம்', 'தந்தனம்', 'கந்தன்',
  'நகம்', 'மகம்', 'தகம்', 'கதம்',
  'பயம்', 'நயன்', 'மயக்கம்',
  'நம்பி', 'பம்பம்', 'மம்மா', 'நன்மை',
  'கன்னம்', 'பன்னம்', 'தன்மை', 'மன்னன்',
  'அம்பி', 'கம்பி', 'நம்பல்', 'தம்பி',
];

// ── b04 adds: s w  (இ ஈ) ────────────────────────────────────────────────────
// Available: h j k l ; ' a q f s w
const W04 = [
  'இனி', 'நிழல்', 'விழி', 'விடி',
  'கிளி', 'பிணி', 'நிலை', 'விலை',
  'நீதி', 'கீதம்', 'தீபம்', 'மீன்', 'நீர்',
  'பீடம்', 'தீர்', 'நீள்', 'மீது',
  'யாதி', 'நாதி', 'மாதி', 'தீவு', 'நீலம்',
  'திலை', 'கிளி', 'பிழை', 'திரை',
  'நிறை', 'கிழி', 'நிம்மதி', 'மிகி',
  'நிதி', 'மிதி', 'கிதி',
  'மிகவும்', 'நிகழ்வு',
  'இனிய', 'நிறைய', 'கிரீடம்',
];

// ── b05 adds: d e  (உ ஊ) ────────────────────────────────────────────────────
// Available: h j k l ; ' a q f s w d e
const W05 = [
  'உப்பு', 'புது', 'துயர்', 'துணை',
  'குடம்', 'முடம்', 'புதிய',
  'கூடம்', 'தூக்கம்', 'பூமி', 'மூடம்', 'நூல்',
  'மூக்கு', 'கூடு', 'தூண்',
  'உதவி', 'உணவு', 'உடல்', 'முகம்',
  'குடும்பம்', 'பூண்டு', 'தூரம்',
  'கும்பம்', 'குமிழ்', 'கும்மி',
  'பூக்கு', 'நூக்கு', 'மூக்கு',
  'முன்பு', 'துன்பம்', 'குன்றம்',
  'நுனி', 'முனி', 'குனி',
  'கூடுதல்', 'மூடுதல்', 'தூடுதல்',
];

// ── b06 adds: g t r  (எ ஏ ஐ) ───────────────────────────────────────────────
// Available: h j k l ; ' a q f s w d e g t r
const W06 = [
  'எழில்', 'ஏணி', 'ஐயம்', 'தேனி', 'எடை', 'தேன்',
  'கேள்வி', 'தேர்வு', 'பேய்', 'மேகம்', 'நேர்மை',
  'ஐந்து', 'மையம்', 'பையன்', 'தையல்',
  'எழுத்து', 'ஏழை', 'மேடை',
  'நேயம்', 'தேடல்', 'பேதை', 'மேய்ச்சல்',
  'எல்லை', 'மேலே', 'நேரில்',
  'பெரிய', 'தெரிய', 'கேட்டல்',
  'நெய்', 'தெய்வம்', 'மெய்யன்',
  'கெட்ட', 'பெட்டி', 'தெட்டி',
  'கைதி', 'மைதி', 'நைதி',
];

// ── b07 adds: c x z  (ஒ ஓ ஔ) — all 12 vowels ───────────────────────────────
// Available: all vowels + h j k l ; ' + f
const W07 = [
  'ஒலி', 'ஓடை', 'கௌரி', 'ஒளி', 'ஓரம்',
  'கோடு', 'போது', 'மோதல்', 'தோகை', 'நோய்',
  'கொண்டு', 'போகம்', 'மொழி', 'நொந்து',
  'கோபம்', 'நோக்கம்', 'தோல்வி', 'போதனை',
  'ஓர்மை', 'கோட்டை', 'போர்', 'மோர்', 'தோட்டம்',
  'ஒழுக்கம்', 'போல்', 'மோகம்', 'தோழன்',
  'கொடி', 'பொதி', 'மொதி', 'தொடி',
  'கோதை', 'போதை', 'மோதை', 'நோதை',
  'யோகம்', 'யோசனை', 'நோக்கி',
];

// ── b08 adds: n v  (ல வ) ────────────────────────────────────────────────────
// Available: all vowels + h j k l ; ' n v + f
const W08 = [
  'பல்', 'கல்', 'நல்', 'வில்', 'வல்',
  'வலம்', 'பலம்', 'கவி', 'வடிவம்',
  'பகல்', 'காவல்', 'தகவல்', 'கல்வி',
  'வலிமை', 'நலமான', 'கலம்', 'தலம்',
  'நிலம்', 'விலம்', 'விலங்கு',
  'கோவில்', 'நாவல்', 'பாவல்',
  'வாழை', 'வாழ்வு', 'நாழி',
  'கல்லூரி', 'வல்லுனர்', 'நல்லூர்',
  'வலி', 'நலி', 'கலி', 'தலி',
  'வேலை', 'கேலி', 'நேலி',
  'வீடு', 'நீடு', 'கூடல்',
  'மாலை', 'காலை', 'தாலி',
  'வணக்கம்', 'கவலை', 'நலன்',
  'விலை', 'நிலை', 'திலை',
  'வெல்ல', 'கெல்ல', 'நெல்',
  'வேலன்', 'கலைஞன்', 'நலன்',
];

// ── b09 adds: u i  (ற ன) ────────────────────────────────────────────────────
// Available: all vowels + h j k l ; ' n v u i + f
const W09 = [
  'அவன்', 'இவன்', 'பறவை', 'அறம்', 'திறம்', 'மறம்',
  'கற்றல்', 'விறகு', 'கன்னம்', 'மன்னன்', 'அன்னம்',
  'உறவு', 'முறை', 'திறன்', 'விறன்',
  'நன்றி', 'தன்மை', 'மன்னிப்பு', 'கன்னி',
  'இன்று', 'நன்று', 'மன்னர்',
  'அன்பு', 'கன்பு', 'தன்பு', 'நன்பு',
  'பறவை', 'உறவு', 'நிறை', 'குறை', 'திறை',
  'இனிதன்', 'நினைவு', 'தினை',
  'உன்னை', 'இன்னல்', 'மன்னல்',
  'கன்று', 'பன்று', 'தன்று',
  'கறி', 'பறி', 'மறி', 'வறி',
  'குறிப்பு', 'நிறுவன்', 'திருவு',
  'வன்மை', 'நன்மை', 'தன்னம்',
  'ஊரன்', 'நாடன்', 'கோடன்',
];

// ── b10 adds: o p  (ட ண) ────────────────────────────────────────────────────
// Available: all vowels + h j k l ; ' n v u i o p + f
const W10 = [
  'நண்டு', 'வண்டு', 'கண்டு', 'பண்டு', 'மண்டை',
  'கண்ணன்', 'அண்ணன்', 'எண்ணம்', 'பண்ணை', 'வண்ணம்',
  'மண்டபம்', 'தண்டம்', 'கண்ணாடி', 'தண்ணீர்', 'உண்மை',
  'கொண்டாட', 'பெண்ணரசி', 'மண்டலம்', 'வண்டி',
  'வட்டம்', 'பட்டம்', 'திட்டம்', 'மட்டம்',
  'மட்டுமே', 'நட்பு',
  'கட்டை', 'பட்டை', 'மட்டை', 'தட்டை',
  'நடிகன்', 'படிப்பு', 'மடிப்பு', 'கடினம்',
  'படை', 'நடை', 'கடை', 'மடை',
  'குடம்', 'புடம்', 'முடம்',
  'குணம்', 'பணம்', 'மணம்', 'கணம்',
  'வணிகம்', 'பணிவு', 'குணவான்',
  'ஆடல்', 'நாடல்', 'பாடல்', 'கோடல்',
  'பாட்டு', 'நாட்டு', 'காட்டு', 'கோட்டு',
];

// ── b11 adds: [  (ச) ──────────────────────────────────────────────────────
// Available: all vowels + h j k l ; ' n v u i o p [ + f
const W11 = [
  'சந்தை', 'சமயம்', 'சரம்', 'சக்கரம்',
  'சகம்', 'சதம்', 'சலம்', 'சடம்',
  'சிறந்த', 'சிறந்தவன்', 'சினம்',
  'சாதனை', 'சாம்பல்', 'சாந்தி',
  'சந்தனம்', 'சங்கீதம்',
  'சிரிப்பு', 'சிதைவு', 'சிகரம்',
  'சோர்வு', 'சோகம்', 'சோதனை',
  'செய்தி', 'செல்வம்', 'செவி',
  'சுமை', 'சுகம்', 'சுண்டு',
  'கசடு', 'பசி', 'தசை', 'நசை',
  'இசை', 'விசை', 'திசை', 'விசித்திரம்',
  'கசப்பு', 'இனிச்சை', 'நிசம்',
];

// ── b12 adds: m  (ர) ──────────────────────────────────────────────────────
// Available: all vowels + h j k l ; ' n v u i o p [ m + f
const W12 = [
  'மரம்', 'தரம்', 'வரம்', 'கரம்', 'பரம்',
  'சரம்', 'நரம்', 'உரம்', 'இரவு',
  'அரசு', 'மரியாதை', 'தரவு', 'வரலாறு',
  'கரிசனம்', 'சரிதம்', 'மரிதம்',
  'பரிசு', 'தரிசனம்', 'வரிசை',
  'இரக்கம்', 'உரக்க', 'நரகம்',
  'ரத்தம்', 'ரசம்', 'ரசிகர்',
  'கருணை', 'வருகை', 'தருகை',
  'பருவம்', 'மருவல்', 'கருமம்',
  'சுரம்', 'புரம்', 'முரம்',
  'நிரை', 'விரை', 'திரை', 'கிரை',
  'வரிசை', 'தரிசனம்', 'பரிந்து',
];

// ── b13 adds: y /  (ள ழ) ─────────────────────────────────────────────────
// Available: all vowels + all consonants except ] b  + f
const W13 = [
  'தமிழ்', 'மகிழ்ச்சி', 'பழம்', 'ஆழம்', 'பள்ளம்', 'வெள்ளம்',
  'மகிழ்வு', 'பழைய', 'வள்ளல்', 'துள்ளல்',
  'ஆழமான', 'இளமை', 'உளமான', 'நளினம்', 'கழிவு',
  'தாழி', 'காழி', 'நாழி', 'வாழை', 'பாழி',
  'விழா', 'மழை', 'குழை', 'பழை',
  'பாழ்', 'தாழ்', 'ஏழை', 'மேழை',
  'வாழ்வு', 'தாழ்வு', 'மாழை',
  'கள்ளம்', 'தள்ளல்', 'மள்ளர்',
  'விழல்', 'கழல்', 'மழல்',
  'குழந்தை', 'தொழில்', 'மொழி',
  'வெள்ளி', 'நள்ளிரவு', 'கல்யாணம்',
];

// ── b14 adds: ] b  (ஞ ங) ─────────────────────────────────────────────────
// Available: ALL consonants + ALL vowels + f
const W14 = [
  'சங்கம்', 'ஞாயிறு', 'அங்கு', 'பங்கு',
  'ஞாபகம்', 'பங்கீடு', 'அங்காடி',
  'ஞானம்', 'தங்கம்', 'மங்கல்',
  'சங்கீதம்', 'மகிழ்ந்த', 'மஞ்சள்',
  'ஞாயிறு', 'அஞ்சு', 'தஞ்சம்',
  'மங்கை', 'தங்கை', 'சங்கு',
  'பங்கு', 'நங்கை', 'கங்கை',
  'ஞாலம்', 'ஞாதி', 'விஞ்ஞானம்',
  'சிங்கம்', 'திங்கள்', 'மிங்கல்',
  'வெங்கையம்', 'செங்கோல்', 'தெங்கு',
];

// ── COMMON EVERYDAY WORDS (b08 scope — ல வ available) ────────────────────────
// All use only keys available by b08
const W_EVERYDAY_BASIC = [
  'அம்மா', 'அப்பா', 'அக்கா', 'தம்பி', 'மகன்', 'மகள்',
  'நன்றி', 'வணக்கம்', 'சரி', 'இல்லை', 'ஆம்',
  'தலை', 'கை', 'கால்', 'வாய்', 'உடல்', 'முகம்',
  'மழை', 'மரம்', 'இலை', 'பூ', 'பழம்',
  'பால்', 'தண்ணீர்', 'உணவு', 'உப்பு',
  'படி', 'எழுது', 'வா', 'போ', 'பார்', 'கேள்',
  'நல்ல', 'கெட்ட', 'பெரிய', 'சிறிய',
  'வீடு', 'நகரம்', 'ஊர்', 'வழி',
  'கதவு', 'மேசை', 'வீடு', 'மாலை', 'காலை',
  'இன்று', 'நாளை', 'நேற்று', 'இப்போது',
  'அங்கு', 'இங்கு', 'எங்கு',
];

// ── FULL EVERYDAY WORDS (b14 scope — all consonants available) ────────────────
const W_EVERYDAY_FULL = [
  ...W_EVERYDAY_BASIC,
  'கண்', 'மூக்கு', 'காது', 'கழுத்து', 'முதுகு', 'வயிறு',
  'கடல்', 'மலை', 'நதி', 'ஆறு', 'வானம்', 'நிலா',
  'மீன்', 'காரம்', 'எண்ணெய்', 'காய்கறி', 'அரிசி', 'இனிப்பு',
  'ஓடு', 'நட', 'தூங்கு', 'விளையாடு', 'பேசு', 'சிரி',
  'அழகு', 'வலிமை', 'மென்மை', 'வேகம்',
  'பள்ளி', 'கோவில்', 'சந்தை', 'பாதை',
  'நாற்காலி', 'ஜன்னல்', 'கண்ணாடி',
  'குழந்தை', 'தாத்தா', 'பாட்டி', 'தங்கை',
];

// ── INTERMEDIATE WORDS ────────────────────────────────────────────────────────
const W_INTER = [
  'பயணம்', 'கடிதம்', 'வாழ்க்கை', 'இயற்கை', 'அறிவு', 'துணிவு',
  'பண்பு', 'நட்பு', 'புத்தகம்', 'அகராதி', 'கணினி', 'விவசாயம்',
  'பெருமை', 'சமுதாயம்', 'இணையம்', 'வரலாறு', 'பண்பாடு',
  'கல்வி', 'தொழில்', 'குடும்பம்', 'திருமணம்', 'பிறந்தநாள்',
  'கொண்டாட்டம்', 'மகிழ்ச்சி', 'சந்தோஷம்', 'ஆனந்தம்', 'இன்பம்',
  'நேர்மை', 'உண்மை', 'அன்பு', 'கருணை', 'தயவு',
  'முயற்சி', 'திறமை', 'சாதனை', 'வெற்றி', 'தோல்வி',
  'சிரிப்பு', 'அழுகை', 'மகிழ்வு', 'கலக்கம்', 'நம்பிக்கை',
  'விடுதலை', 'சுதந்திரம்', 'உரிமை', 'கடமை', 'பொறுப்பு',
  'ஞாயிறு', 'திங்கள்', 'செவ்வாய்', 'புதன்', 'வியாழன்',
  'வெள்ளி', 'சனி', 'காலை', 'மாலை', 'இரவு', 'நண்பகல்',
  'மாதம்', 'வருடம்', 'கோடை', 'குளிர்',
  'கடல்', 'காற்று', 'வெயில்', 'நட்சத்திரம்',
  'நாடகம்', 'கவிதை', 'கட்டுரை', 'சிறுகதை', 'நாவல்',
];

// ── ADVANCED WORDS ────────────────────────────────────────────────────────────
const W_ADV = [
  'தொல்காப்பியம்', 'இலக்கணம்', 'சங்கத்தமிழ்', 'கவிதை',
  'இலக்கியம்', 'எழுத்ததிகாரம்', 'சொல்லதிகாரம்',
  'முன்னேற்றம்', 'பல்கலைக்கழகம்', 'தொழில்நுட்பம்',
  'அரசாங்கம்', 'நிர்வாகம்', 'பொருளாதாரம்',
  'இயற்பியல்', 'வேதியியல்', 'உயிரியல்', 'கணிதம்',
  'திருக்குறள்', 'கம்பராமாயணம்', 'மணிமேகலை', 'சிலப்பதிகாரம்',
  'குறுந்தொகை', 'அகநானூறு', 'புறநானூறு', 'நற்றிணை',
  'காகிதம்', 'பயிற்சி', 'கணக்கு', 'திறமை', 'விதை', 'நெறி',
  'வாழ்க்கைமுறை', 'நற்பண்புகள்', 'குடும்பமுறை', 'சமூகமுறை',
  'ஜனநாயகம்', 'மக்களாட்சி', 'சட்டம்', 'நீதி',
  'பொதுவுடைமை', 'சமத்துவம்', 'மனித உரிமை',
];

// ── Grantha words (a01 scope) ────────────────────────────────────────────────
const W_GRANTHA = [
  'ஸபரி', 'ஷண்முகம்', 'ஜன்னல்', 'ஹரி', 'புஷ்பம்',
  'விஷயம்', 'கஷ்டம்', 'நிமிஷம்', 'ஸந்தோஷம்', 'தேசம்', 'ஜயம்',
  'ஜனவரி', 'ஜலம்', 'ஹரிதம்', 'ஸமாதானம்', 'ஷோரூம்',
  'ஜாதி', 'ஷம்', 'ஜனாதிபதி', 'ஹாஸ்பிடல்',
];

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
  // 1. Filter words to allowed keys
  const main = filterWords(mainWords, allowed);
  const extra = filterWords(extraWords, allowed);
  const safe = main.length ? main : extra;
  if (!safe.length) return [];   // shouldn't happen

  // 2. Syllable drill  (25 %)
  const safeSyls = drillSyls.filter(s => s.every(k => allowed.has(k)));
  const drillOut = safeSyls.length ? keybr(safeSyls, drillLen) : [];

  // 3. Word portion  (75 %) — 70% main + 30% extra, shuffled
  const mainN = Math.round(wordCount * 0.70);
  const extraN = wordCount - mainN;
  const tokens = [];
  for (let i = 0; i < mainN; i++) tokens.push(safe[ri(safe.length)]);
  for (let i = 0; i < extraN; i++) tokens.push((extra.length ? extra : safe)[ri((extra.length ? extra : safe).length)]);
  for (let i = tokens.length - 1; i > 0; i--) {
    const j = ri(i + 1);[tokens[i], tokens[j]] = [tokens[j], tokens[i]];
  }
  const wordOut = [];
  tokens.forEach(w => wordOut.push(...wordToKeys(w), sp));
  while (wordOut.length && wordOut[wordOut.length - 1] === sp) wordOut.pop();

  return drillOut.length ? [...drillOut, sp, ...wordOut] : wordOut;
}

/** 100% word lesson (no drill) — for intermediate and advanced */
function buildWordOnly(allowed, mainWords, extraWords, wordCount) {
  return buildLesson(allowed, [], mainWords, extraWords, wordCount, 0);
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
        const syls = pool(['h', 'j'], V_A, true); // CV + pulli
        const drill = intro(syls);
        const words = filterWords(W01_SAFE, A.b01);
        const wordOut = wordsGen(words, 8);
        return [...drill, sp, ...wordOut];
      }
    },

    // ── b02: ம த ந ய ──────────────────────────────────────────────────────
    {
      id: 'b02', order: 2, level: 'beginner',
      title: 'ம த ந ய',
      description: "k l ; ' — home row complete",
      focusKeys: ['k', 'l', ';', "'", 'a', 'q', 'f'], targetWPM: 10,
      generateContent() {
        const newSyls = pool(['k', 'l', ';', "'"], V_A, true);
        const drill = wKeybr(newSyls, pool(['h', 'j'], V_A, true), 30);
        const words = filterWords(W02, A.b02);
        return buildLesson(A.b02, newSyls, W02, W01_SAFE, 18, 30);
      }
    },

    // ── b03: Home Row Speed ────────────────────────────────────────────────
    {
      id: 'b03', order: 3, level: 'beginner',
      title: 'Home Row Speed',
      description: 'All 6 home consonants — speed up with real words',
      focusKeys: [...C_HR, 'a', 'q', 'f'], targetWPM: 12,
      generateContent() {
        return buildLesson(A.b03, pool(C_HR, V_A, true), W02, W01_SAFE, 22, 25);
      }
    },

    // ── b04: இ ஈ ──────────────────────────────────────────────────────────
    {
      id: 'b04', order: 4, level: 'beginner',
      title: 'இ ஈ',
      description: 's w — left ring finger',
      focusKeys: [...C_HR, 's', 'w', 'f'], targetWPM: 12,
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
      focusKeys: [...C_HR, 'd', 'e', 'f'], targetWPM: 12,
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
      focusKeys: [...C_HR, 'g', 't', 'r', 'f'], targetWPM: 14,
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
      focusKeys: [...C_HR, 'c', 'x', 'z', 'f'], targetWPM: 14,
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
      focusKeys: ['n', 'v', ...V_ALL, ...C_HR, 'f'], targetWPM: 14,
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
      focusKeys: ['u', 'i', ...V_ALL, ...C_HR, 'n', 'v', 'f'], targetWPM: 14,
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
      focusKeys: ['o', 'p', ...V_ALL, ...C_HR, 'n', 'v', 'u', 'i', 'f'], targetWPM: 14,
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
      focusKeys: ['[', ...V_ALL, ...C_HR, 'n', 'v', 'u', 'i', 'o', 'p', 'f'], targetWPM: 14,
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
      focusKeys: ['m', ...V_ALL, ...C_HR, 'n', 'v', 'u', 'i', 'o', 'p', '[', 'f'], targetWPM: 14,
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
      focusKeys: ['y', '/', ...V_ALL, ...C_HR, 'n', 'v', 'u', 'i', 'o', 'p', '[', 'm', 'f'], targetWPM: 14,
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
      focusKeys: [']', 'b', ...V_ALL, ...C_ALL, 'f'], targetWPM: 14,
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
      focusKeys: ['h', 'j', 'f', ...V_ALL], targetWPM: 16,
      generateContent() {
        const grid = uyirmeiGrid(['h', 'j'], V_ALL);
        const words = filterWords([...W01_SAFE, ...W02, ...W04, ...W_EVERYDAY_FULL], A_FULL);
        return [...grid, sp, ...wordsGen(words, 18)];
      }
    },

    {
      id: 'b16', order: 16, level: 'beginner',
      title: 'உயிர்மெய் — ம த',
      description: 'ம மா மி மீ மு மூ மெ மே மை மொ மோ மௌ … த …',
      focusKeys: ['k', 'l', 'f', ...V_ALL], targetWPM: 16,
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
      focusKeys: [';', "'", 'f', ...V_ALL], targetWPM: 16,
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
      focusKeys: ['n', 'v', 'f', ...V_ALL], targetWPM: 18,
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
      focusKeys: ['u', 'i', 'f', ...V_ALL], targetWPM: 18,
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
      focusKeys: [...V_ALL, ...C_ALL, 'f'], targetWPM: 22,
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
      focusKeys: ['o', 'p', 'f', ...V_ALL], targetWPM: 20,
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
      focusKeys: ['[', 'm', 'f', ...V_ALL], targetWPM: 20,
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
      focusKeys: ['y', '/', 'f', ...V_ALL], targetWPM: 20,
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
      focusKeys: [']', 'b', 'f', ...V_ALL], targetWPM: 20,
      generateContent() {
        const grid = uyirmeiGrid([']', 'b'], V_A);
        const words = filterWords([...W14, ...W_EVERYDAY_FULL, ...W_INTER.slice(0, 20)], A_FULL);
        return [...grid, sp, ...wordsGen(words, 22)];
      }
    },

    {
      id: 'i05', order: 5, level: 'intermediate',
      title: 'All Uyirmei Speed',
      description: 'All consonants × all vowels — words only',
      focusKeys: [...C_ALL, 'f', ...V_ALL], targetWPM: 24,
      generateContent() {
        const words = filterWords([...W_EVERYDAY_FULL, ...W_INTER], A_FULL);
        return wordsGen(words, 30);
      }
    },

    {
      id: 'i06', order: 6, level: 'intermediate',
      title: 'Words — Speed I',
      description: 'Common Tamil words at 26 WPM',
      focusKeys: [...C_ALL, 'f', ...V_ALL], targetWPM: 26,
      generateContent() {
        const words = filterWords([...W_INTER, ...W_EVERYDAY_FULL], A_FULL);
        return wordsGen(words, 30);
      }
    },

    {
      id: 'i07', order: 7, level: 'intermediate',
      title: 'Words — Speed II',
      description: 'Richer vocabulary at 28 WPM',
      focusKeys: [...C_ALL, 'f', ...V_ALL], targetWPM: 28,
      generateContent() {
        const words = filterWords([...W_INTER, ...W_ADV.slice(0, 20)], A_FULL);
        return wordsGen(words, 30);
      }
    },

    {
      id: 'i08', order: 8, level: 'intermediate',
      title: 'Intermediate Speed',
      description: 'Full vocabulary — 30 WPM',
      focusKeys: [...C_ALL, 'f', ...V_ALL], targetWPM: 30,
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
      focusKeys: ['Q', 'W', 'E', 'R', 'f', ...V_A], targetWPM: 26,
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
      focusKeys: ['F', 'f', ...C_HR, ...V_ALL], targetWPM: 28,
      generateContent() {
        const np = C_HR.map(c => ['F', c]);
        const drill = intro(np);
        const words = filterWords([...W_ADV, ...W_INTER], A_GRANTHA);
        return [...drill, sp, ...wordsGen(words, 20)];
      }
    },

    {
      id: 'a03', order: 3, level: 'advanced',
      title: 'Speed Drill I',
      description: 'Home row + all vowels — 32 WPM',
      focusKeys: [...C_HR, ...C_LV, ...V_ALL, 'f'], targetWPM: 32,
      generateContent() {
        const words = filterWords([...W_ADV, ...W_INTER], A_FULL);
        return wordsGen(words, 32);
      }
    },

    {
      id: 'a04', order: 4, level: 'advanced',
      title: 'Speed Drill II',
      description: 'Full keyboard — 36 WPM — words only',
      focusKeys: [...C_ALL, 'f', ...V_ALL], targetWPM: 36,
      generateContent() {
        const words = filterWords([...W_ADV, ...W_INTER, ...W_EVERYDAY_FULL], A_FULL);
        return wordsGen(words, 32);
      }
    },

    {
      id: 'a05', order: 5, level: 'advanced',
      title: 'Marathon',
      description: 'All keys — 38 WPM',
      focusKeys: [...V_ALL, ...C_ALL, 'f', 'Q', 'W', 'E', 'R'], targetWPM: 38,
      generateContent() {
        const words = filterWords([...W_ADV, ...W_GRANTHA, ...W_INTER], A_GRANTHA);
        return wordsGen(words, 32);
      }
    },

    {
      id: 'a06', order: 6, level: 'advanced',
      title: 'Tamil Text Speed',
      description: 'Literary and complex words — 40 WPM',
      focusKeys: [...C_ALL, 'f', ...V_ALL], targetWPM: 40,
      generateContent() {
        const words = filterWords([...W_ADV, ...W_INTER], A_FULL);
        return wordsGen(words, 34);
      }
    },

    {
      id: 'a07', order: 7, level: 'advanced',
      title: 'கணக்கு குறிகள்',
      description: 'Shift+Z X C V B D A S — Tamil accounting symbols',
      focusKeys: ['Z', 'X', 'C', 'V', 'B', 'D', 'A', 'S'], targetWPM: 18,
      generateContent() {
        const out = [];
        const symWords = ['நாள்', 'மாதம்', 'வருடம்', 'கடன்', 'பற்று', 'ரூபாய்', 'எண்', 'மேலே'];
        const symKeys = { 'நாள்': 'Z', 'மாதம்': 'X', 'வருடம்': 'C', 'கடன்': 'V', 'பற்று': 'B', 'ரூபாய்': 'A', 'எண்': 'S', 'மேலே': 'D' };
        function pw(w) { out.push(...wordToKeys(w), sp); }
        for (let i = 0; i < 8; i++) {
          pw('நாள்'); out.push('Z', sp);
          pw('மாதம்'); out.push('X', sp);
          pw('வருடம்'); out.push('C', sp);
          if (i % 2 === 0) { pw('கடன்'); out.push('V', sp); pw('பற்று'); out.push('B', sp); }
          pw('ரூபாய்'); out.push('S', 'A', sp);
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
  return ALL_LESSONS[i + 1] ?? null; 
    // return i >= 0 && i < ALL_LESSONS.length - 1 ? ALL_LESSONS[i + 1] : null;
}
export function getPrevLesson(id) { const i = ALL_LESSONS.findIndex(l => l.id === id); return i > 0 ? ALL_LESSONS[i - 1] : null; }
export function getLessonIndex(id) { return ALL_LESSONS.findIndex(l => l.id === id); }
export function getFirstIncomplete(done = []) { return ALL_LESSONS.find(l => !done.includes(l.id)) ?? ALL_LESSONS[0]; }