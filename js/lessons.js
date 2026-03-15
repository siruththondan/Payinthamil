/**
 * lessons.js — 34 progressive Tamil typing lessons
 *
 * Design rules:
 *  • Beginner vowel lessons: pure drill on new vowels, then progressive mix
 *  • Beginner consonant lessons: new consonants + vowels + previous keys ~30%
 *  • Intermediate: CV combos, syllables, common words
 *  • Advanced: full keyboard, speed, complex sequences
 *
 * content: array of key strings the user must press in order
 *          ' ' = space (shown as · in UI)
 */

/* ── Content helpers ────────────────────────────── */
const sp = ' ';

// Repeat arr n times, spacing between reps
function rep(arr, n = 2) {
  return Array.from({ length: n }, () => arr).flat();
}

// Drill: each key repeated r times, space-separated
function drill(keys, r = 3) {
  return keys.flatMap(k => [...Array(r).fill(k), sp]);
}

// All pairs of keys (ab, ba, ac, ca ...)
function pairs(keys) {
  const out = [];
  for (let i = 0; i < keys.length; i++)
    for (let j = 0; j < keys.length; j++)
      if (i !== j) out.push(keys[i], keys[j], sp);
  return out;
}

// Interleave two key arrays with spaces
function interleave(main, review, mainRatio = 0.72, total = 90) {
  const out = [];
  const mainCount   = Math.round(total * mainRatio / main.length) * main.length;
  const reviewCount = Math.round(total * (1 - mainRatio) / (review.length || 1)) * (review.length || 1);

  // Drill the new keys first
  for (let i = 0; i < mainCount; i++) {
    out.push(main[i % main.length]);
    if ((i + 1) % 3 === 0) out.push(sp);
  }
  if (review.length === 0) return out;

  // Then sprinkle review
  out.push(sp);
  for (let i = 0; i < reviewCount; i++) {
    out.push(review[i % review.length]);
    if ((i + 1) % 3 === 0) out.push(sp);
  }

  // Mixed finale
  for (let i = 0; i < 16; i++) {
    out.push(main[i % main.length]);
    out.push(review[i % review.length]);
    out.push(sp);
  }
  return out;
}

/* ── Key shorthands ─────────────────────────────── */
// Vowels
const V_A  = ['a','q'];            // அ ஆ
const V_I  = ['s','w'];            // இ ஈ
const V_U  = ['d','e'];            // உ ஊ
const V_E  = ['g','t','r'];        // எ ஏ ஐ
const V_O  = ['c','x','z'];        // ஒ ஓ ஔ
const V_ALL = [...V_A,...V_I,...V_U,...V_E,...V_O];

// Home-row consonants
const C_HR  = ['h','j','k','l',';',"'"];   // க ப ம த ந ய
// Other consonants
const C_LRV = ['n','v'];           // ல வ
const C_RN  = ['u','i'];           // ற ன
const C_OPN = ['o','p'];           // ட ண
const C_CHN = ['[',']'];           // ச ஞ
const C_NGB = ['b'];               // ங
const C_LZH = ['y','/'];           // ள ழ
const C_ALL  = [...C_HR,...C_LRV,...C_RN,...C_OPN,...C_CHN,...C_NGB,...C_LZH];
const PU = 'f';  // pulli ்

/* ═══════════════════════════════════════════════════
   LESSON DATABASE
═══════════════════════════════════════════════════ */
export const LESSONS_DB = {

  /* ── BEGINNER ─────────────────────────────────── */
  beginner: [

    /* Vowels */
    {
      id:'b01', order:1, level:'beginner',
      title:'அ ஆ',
      description:'a  q  (left pinky)',
      focusKeys:['a','q'], targetWPM:10,
      content: [
        ...drill(['a'],4), ...drill(['q'],4),
        ...pairs(['a','q']),
        'a','q','a',sp,'q','a','q',sp,
        'a','a','q',sp,'q','q','a',sp,
        'a','q','q','a',sp,'q','a','a','q',sp,
        'a','q','a','q','a',sp,'q','a','q','a','q',
      ],
    },

    {
      id:'b02', order:2, level:'beginner',
      title:'இ ஈ',
      description:'s  w  (+review அ ஆ)',
      focusKeys:['s','w'], targetWPM:10,
      content: [
        ...drill(['s'],4), ...drill(['w'],4),
        ...pairs(['s','w']),
        's','w','s',sp,'w','s','w',sp,
        // review
        'a','q',sp,'a','a','q',sp,'q','q','a',sp,
        // mixed
        ...rep(['s','w',sp,'a','q',sp,'s',sp,'w','s',sp,'q','a',sp], 2),
      ],
    },

    {
      id:'b03', order:3, level:'beginner',
      title:'உ ஊ',
      description:'d  e  (+review இ ஈ அ ஆ)',
      focusKeys:['d','e'], targetWPM:10,
      content: [
        ...drill(['d'],4), ...drill(['e'],4),
        ...pairs(['d','e']),
        'd','e','d',sp,'e','d','e',sp,
        // review prev
        's','w',sp,'a','q',sp,'w','s',sp,'q','a',sp,
        // mixed
        'd','e',sp,'s','w',sp,'a',sp,'e','d',sp,'w','s',sp,'q','a',sp,
        'd',sp,'s',sp,'a',sp,'e',sp,'w',sp,'q',sp,'d','e','s','w','a','q',
      ],
    },

    {
      id:'b04', order:4, level:'beginner',
      title:'எ ஏ ஐ',
      description:'g  t  r  (+review உ-அ)',
      focusKeys:['g','t','r'], targetWPM:12,
      content: [
        ...drill(['g'],3),...drill(['t'],3),...drill(['r'],3),
        ...pairs(['g','t','r']),
        'g','t','r',sp,'r','t','g',sp,'g','r','t',sp,
        // review
        'd','e',sp,'s','w',sp,'a','q',sp,
        // mixed
        'g',sp,'d',sp,'t',sp,'s',sp,'r',sp,'a',sp,
        'g','t',sp,'d','e',sp,'r','g',sp,'s','w',sp,
        'g','t','r',sp,'d','e','s',sp,'w','a','q',
      ],
    },

    {
      id:'b05', order:5, level:'beginner',
      title:'ஒ ஓ ஔ',
      description:'c  x  z  (+review all prev vowels)',
      focusKeys:['c','x','z'], targetWPM:12,
      content: [
        ...drill(['c'],3),...drill(['x'],3),...drill(['z'],3),
        ...pairs(['c','x','z']),
        'c','x','z',sp,'z','x','c',sp,'c','z','x',sp,
        // review mix
        'g','t',sp,'d','e',sp,'s','w',sp,'a','q',sp,
        // full mix
        'c','g',sp,'x','t',sp,'z','r',sp,'d','e',sp,
        'c','x','z',sp,'g','t','r',sp,'d','e',sp,'s','w',sp,'a','q',
      ],
    },

    {
      id:'b06', order:6, level:'beginner',
      title:'All 12 Vowels',
      description:'உயிர் எழுத்து — full vowel review',
      focusKeys:V_ALL, targetWPM:14,
      content: [
        'a','q',sp,'s','w',sp,'d','e',sp,
        'g','t',sp,'r',sp,'c','x',sp,'z',sp,
        'a','s','d',sp,'q','w','e',sp,
        'g','r','c',sp,'t','x','z',sp,
        ...pairs(['a','q','s','w']),
        ...pairs(['d','e','g','t']),
        'a','q','s','w','d',sp,'e','g','t','r','c','x','z',sp,
        'z','x','c','r','t','g',sp,'e','d','w','s','q','a',
      ],
    },

    {
      id:'b07', order:7, level:'beginner',
      title:'Vowels — Speed',
      description:'All vowels, faster pace',
      focusKeys:V_ALL, targetWPM:18,
      content: rep([
        'a','s','d','g','c',sp,'q','w','e','t','x',sp,
        'r','z',sp,'a','q',sp,'s','w',sp,'d','e',sp,
        'g','t',sp,'r','c',sp,'x','z',sp,
        'a','q','s',sp,'w','d','e',sp,'g','t','r',sp,
        'c','x','z',sp,'a','s','g','c',sp,'q','w','t','x',
      ], 2),
    },

    /* Consonants */
    {
      id:'b08', order:8, level:'beginner',
      title:'க ப',
      description:'h  j  (right index) + vowels',
      focusKeys:['h','j','f',...V_A,...V_I], targetWPM:14,
      content: [
        ...drill(['h'],3),...drill(['j'],3),
        'h',PU,sp,'j',PU,sp,
        'h','a',sp,'j','a',sp,'h','q',sp,'j','q',sp,
        'h','s',sp,'j','s',sp,'h','w',sp,'j','w',sp,
        ...pairs(['h','j']),
        // with vowels
        'h','q',sp,'h',PU,sp,'j','q',sp,'j',PU,sp,
        'h','a','j','a',sp,'h','q','j','q',sp,
        'h','s','j','w',sp,'j','s','h','w',sp,
        // review vowels
        'a','q',sp,'s','w',sp,'h',PU,'j',PU,sp,
      ],
    },

    {
      id:'b09', order:9, level:'beginner',
      title:'ம த',
      description:'k  l  (right middle/ring) + prev',
      focusKeys:['k','l','f',...V_A,...V_I], targetWPM:14,
      content: [
        ...drill(['k'],3),...drill(['l'],3),
        'k',PU,sp,'l',PU,sp,
        'k','a',sp,'l','a',sp,'k','q',sp,'l','q',sp,
        ...pairs(['k','l']),
        // with prev consonants
        'h',PU,sp,'j',PU,sp,'k',PU,sp,'l',PU,sp,
        'h','a','k','a',sp,'j','a','l','a',sp,
        'h','q','k','q',sp,'j','q','l','q',sp,
        // vowel review
        'a','q',sp,'s','w',sp,'d','e',sp,
        'k','l',sp,'h','j',sp,'k','a','l','q',sp,'h','s','j','w',
      ],
    },

    {
      id:'b10', order:10, level:'beginner',
      title:'ந ய',
      description:"';'  '  (right pinky) + prev",
      focusKeys:[';',"'",'f',...V_A,...V_I], targetWPM:14,
      content: [
        ...drill([';'],3),...drill(["'"],3),
        ';',PU,sp,"'",PU,sp,
        ';','a',sp,"'",'a',sp,';','q',sp,"'",'q',sp,
        ...pairs([';',"'"]),
        // all home row consonants now
        'h',PU,sp,'j',PU,sp,'k',PU,sp,'l',PU,sp,';',PU,sp,"'",PU,sp,
        'h','a','j','a',sp,'k','a','l','a',sp,';','a',"'",'a',sp,
        // vowel review
        'd','e',sp,'g','t',sp,'a','q',sp,
        ';',sp,"'",sp,'h','j','k',sp,'l',sp,';',"'",sp,'a','q','s','w',
      ],
    },

    {
      id:'b11', order:11, level:'beginner',
      title:'Home Row — க ப ம த ந ய',
      description:'All 6 home-row consonants',
      focusKeys:[...C_HR,'f',...V_A], targetWPM:16,
      content: [
        ...drill(['h','j','k'],2),...drill(['l',';',"'"],2),
        ...pairs(['h','j','k']),
        ...pairs(['l',';',"'"]),
        'h',PU,'j',PU,'k',PU,sp,'l',PU,';',PU,"'",PU,sp,
        'h','a','j','a','k','a',sp,'l','a',';','a',"'",'a',sp,
        'h','q','j','q',sp,'k','q','l','q',sp,
        'h',PU,'k',PU,sp,'j',PU,'l',PU,sp,';',PU,"'",PU,sp,
        // vowel review
        'a','q',sp,'s','w',sp,'d','e',sp,'g','t',sp,
        'h','j',sp,'k','l',sp,';',"'",sp,'a','q','s','w',
      ],
    },

    {
      id:'b12', order:12, level:'beginner',
      title:'ல வ',
      description:'n  v  + home row + vowels',
      focusKeys:['n','v','f',...V_A,...C_HR], targetWPM:16,
      content: [
        ...drill(['n'],3),...drill(['v'],3),
        'n',PU,sp,'v',PU,sp,
        'n','a',sp,'v','a',sp,'n','q',sp,'v','q',sp,
        ...pairs(['n','v']),
        // with home row
        'h','n',PU,sp,'j','v',PU,sp,'k','n',PU,sp,
        'n','a','v','a',sp,'h',PU,'n',PU,sp,
        'v','q','n','q',sp,'h','a','n','a',sp,
        // prev review
        'h','j','k',sp,'l',';',"'",sp,'a','q',sp,'s','w',sp,
        'n','v',sp,'h','j',sp,'k','l',sp,'n','a','v','q',sp,
      ],
    },

    {
      id:'b13', order:13, level:'beginner',
      title:'ற ன',
      description:'u  i  + prev consonants + vowels',
      focusKeys:['u','i','f',...V_A,...C_HR,...C_LRV], targetWPM:16,
      content: [
        ...drill(['u'],3),...drill(['i'],3),
        'u',PU,sp,'i',PU,sp,
        'u','a',sp,'i','a',sp,'u','q',sp,'i','q',sp,
        ...pairs(['u','i']),
        // mix with prev
        'h','u',PU,sp,'j','i',PU,sp,'n','u',PU,sp,
        'u','a','i','a',sp,'h',PU,'u',PU,sp,
        'n','v',sp,'u','i',sp,'h','j',sp,
        // vowel review
        'a','q',sp,'s','w',sp,'d','e',sp,
        'u','i',sp,'n','v',sp,'h','j','k',sp,'l',';',"'",sp,'a','q',
      ],
    },

    {
      id:'b14', order:14, level:'beginner',
      title:'ட ண',
      description:'o  p  (retroflex) + prev',
      focusKeys:['o','p','f',...V_A,...C_HR,...C_LRV,...C_RN], targetWPM:16,
      content: [
        ...drill(['o'],3),...drill(['p'],3),
        'o',PU,sp,'p',PU,sp,
        'o','a',sp,'p','a',sp,'o','q',sp,'p','q',sp,
        ...pairs(['o','p']),
        // with prev
        'h','o',PU,sp,'j','p',PU,sp,'k','o',PU,sp,
        'o','a','p','a',sp,'u','o',PU,sp,'i','p',PU,sp,
        // all consonants so far
        'h',PU,'j',PU,'k',PU,sp,'n',PU,'v',PU,sp,'u',PU,'i',PU,sp,'o',PU,'p',PU,sp,
        'h','a','n','a',sp,'u','q','o','q',sp,'j','a','i','a','p','a',sp,
        'a','q',sp,'s','w',sp,'d','e',sp,'g','t',sp,
      ],
    },

    {
      id:'b15', order:15, level:'beginner',
      title:'ச',
      description:"'['  + prev consonants",
      focusKeys:['[','f',...V_A,...C_HR,...C_LRV,...C_RN,...C_OPN], targetWPM:16,
      content: [
        ...drill(['['],4),
        '[',PU,sp,'[','a',sp,'[','q',sp,'[','s',sp,'[','w',sp,
        // pairs with known consonants
        'h','[',PU,sp,'j','[',PU,sp,'[',PU,'h',PU,sp,
        '[','a','h','a',sp,'[','q','j','q',sp,
        // mix
        'h',PU,sp,'j',PU,sp,'[',PU,sp,'k',PU,sp,'n',PU,sp,
        '[','a','j','a',sp,'h','a','[','a',sp,
        // all so far
        'h',PU,'j',PU,'k',PU,sp,'n',PU,'v',PU,sp,'u',PU,'i',PU,sp,
        'o',PU,'p',PU,'[',PU,sp,'a','q','s','w',
      ],
    },

    {
      id:'b16', order:16, level:'beginner',
      title:'ஞ ங',
      description:"']'  b  + prev",
      focusKeys:[']','b','f',...V_A,...C_HR,...C_LRV], targetWPM:16,
      content: [
        ...drill([']'],3),...drill(['b'],3),
        ']',PU,sp,'b',PU,sp,
        ']','a',sp,'b','a',sp,']','q',sp,'b','q',sp,
        ...pairs([']','b']),
        ']',PU,'b',PU,sp,'[',PU,']',PU,sp,
        ']','a','[','a',sp,'b','a','h','a',sp,
        // full so far
        'h',PU,'j',PU,'k',PU,sp,'l',PU,';',PU,"'",PU,sp,
        'n',PU,'v',PU,'u',PU,'i',PU,sp,'o',PU,'p',PU,'[',PU,sp,
        ']',PU,'b',PU,sp,'a','q','s','w','d','e',
      ],
    },

    {
      id:'b17', order:17, level:'beginner',
      title:'ள ழ',
      description:"y  /  + prev",
      focusKeys:['y','/','f',...V_A,...C_HR,...C_LRV,...C_RN], targetWPM:16,
      content: [
        ...drill(['y'],3),...drill(['/'],3),
        'y',PU,sp,'/',PU,sp,
        'y','a',sp,'/','a',sp,'y','q',sp,'/','q',sp,
        ...pairs(['y','/']),
        'n','y',PU,sp,'l','/','PU',sp,'y',PU,'/','PU',sp,
        'y','a','/','a',sp,'n','a','y','a',sp,
        // ALL 18 consonants
        'h',PU,'j',PU,'k',PU,sp,'l',PU,';',PU,"'",PU,sp,
        'n',PU,'v',PU,'u',PU,'i',PU,sp,'o',PU,'p',PU,'[',PU,sp,
        ']',PU,'b',PU,'y',PU,'/',PU,sp,
        'a','q','s','w','d','e',
      ],
    },

    {
      id:'b18', order:18, level:'beginner',
      title:'All 18 Consonants',
      description:'மெய் எழுத்து — complete review',
      focusKeys:[...C_ALL,'f'], targetWPM:18,
      content: [
        ...C_ALL.flatMap(k => [k,PU,sp]),
        ...C_ALL.flatMap(k => [k,'a',sp]),
        ...C_ALL.flatMap(k => [k,'q',sp]),
        ...pairs(['h','j','k','l']),
        ...pairs(['n','v','u','i']),
        ...pairs(['o','p','[',']']),
        ...pairs(['y','/',';',"'"]),
        'h',PU,'j',PU,'k',PU,'l',PU,sp,'n',PU,'v',PU,'u',PU,'i',PU,sp,
        'o',PU,'p',PU,'[',PU,sp,']',PU,'b',PU,'y',PU,'/',PU,sp,
      ],
    },

    {
      id:'b19', order:19, level:'beginner',
      title:'் Pulli — Vowel Silencer',
      description:'f key — converting consonants with pulli',
      focusKeys:['f','h','j','k','l','n','v',...V_A], targetWPM:18,
      content: [
        // Consonant → pulli pattern
        'h',PU,sp,'j',PU,sp,'k',PU,sp,'l',PU,sp,
        'n',PU,sp,'v',PU,sp,'u',PU,sp,'i',PU,sp,
        'o',PU,sp,'p',PU,sp,'[',PU,sp,';',PU,sp,"'",PU,sp,
        // CV + pulli combos
        'h','a','j',PU,sp,'k','q','l',PU,sp,
        'n','q','v',PU,sp,';','a',PU,sp,
        'h',PU,'h','a',sp,'j',PU,'j','q',sp,'k',PU,'k','s',sp,
        // With all vowels
        'h','a',sp,'h','q',sp,'h','s',sp,'h','w',sp,'h','d',sp,
        'h','e',sp,'h','g',sp,'h','t',sp,'h','r',sp,'h','c',sp,'h',PU,sp,
      ],
    },

    {
      id:'b20', order:20, level:'beginner',
      title:'Beginner — Final Drill',
      description:'Everything so far at speed',
      focusKeys:[...V_ALL,...C_ALL,'f'], targetWPM:20,
      content: [
        'a','q',sp,'s','w',sp,'d','e',sp,'g','t',sp,'r',sp,'c','x','z',sp,
        ...C_HR.flatMap(k=>[k,PU,sp]),
        ...C_LRV.flatMap(k=>[k,PU,sp]),
        ...C_RN.flatMap(k=>[k,PU,sp]),
        ...C_OPN.flatMap(k=>[k,'a',sp]),
        ...C_CHN.flatMap(k=>[k,'q',sp]),
        'h','q',sp,'j','a',sp,'k','s',sp,'l','q',sp,';','a',sp,"'",'q',sp,
        'n','q',sp,'v','a',sp,'u','s',sp,'i','w',sp,
        'h',PU,'j',PU,'k',PU,'l',PU,sp,'n',PU,'v',PU,'u',PU,'i',PU,sp,
        'o','a','p','q',sp,'[','a',']','q',sp,'y',PU,'/',PU,sp,
        'a','q','s','w','d','e','g','t',
      ],
    },
  ],

  /* ── INTERMEDIATE ─────────────────────────────── */
  intermediate: [

    {
      id:'i01', order:1, level:'intermediate',
      title:'க + All Vowels',
      description:'க் கா கி கீ கு கூ ...',
      focusKeys:['h',PU,...V_ALL], targetWPM:22,
      content: [
        // All 12 vowel forms of க
        'h',PU,sp,'h','a',sp,'h','q',sp,'h','s',sp,
        'h','w',sp,'h','d',sp,'h','e',sp,'h','g',sp,
        'h','t',sp,'h','r',sp,'h','c',sp,'h','x',sp,
        // Pairs
        'h','q','h',PU,sp,'h','s','h','t',sp,'h','d','h','e',sp,
        'h','r','h','g',sp,'h','c','h','x',sp,
        // All again faster
        'h',PU,'h','q','h','s','h','w',sp,'h','d','h','e','h','g','h','t',sp,
        'h','r','h','c','h','x','h',PU,sp,
        // Review previous consonants
        'j',PU,sp,'j','a',sp,'j','q',sp,'k',PU,sp,'k','a',sp,
        'h','q','j','q',sp,'k','a','h','a',sp,
      ],
    },

    {
      id:'i02', order:2, level:'intermediate',
      title:'ப + All Vowels',
      description:'ப் பா பி பீ ...',
      focusKeys:['j',PU,...V_ALL], targetWPM:22,
      content: [
        'j',PU,sp,'j','a',sp,'j','q',sp,'j','s',sp,
        'j','w',sp,'j','d',sp,'j','e',sp,'j','g',sp,
        'j','t',sp,'j','r',sp,'j','c',sp,'j','x',sp,
        'j','q','j',PU,sp,'j','s','j','t',sp,'j','d','j','e',sp,
        'j','r','j','g',sp,'j','c','j','x',sp,
        'j',PU,'j','q','j','s','j','w',sp,'j','d','j','e','j','g','j','t',sp,
        // Review க
        'h',PU,sp,'h','a',sp,'h','q',sp,'h','s',sp,
        'h','q','j','q',sp,'h','a','j','a',sp,'h',PU,'j',PU,sp,
      ],
    },

    {
      id:'i03', order:3, level:'intermediate',
      title:'ம த + All Vowels',
      description:'ம் மா ... த் தா ...',
      focusKeys:['k','l',PU,...V_ALL], targetWPM:24,
      content: [
        'k',PU,sp,'k','a',sp,'k','q',sp,'k','s',sp,'k','w',sp,
        'k','d',sp,'k','e',sp,'k','g',sp,'k','t',sp,
        'l',PU,sp,'l','a',sp,'l','q',sp,'l','s',sp,'l','w',sp,
        'l','d',sp,'l','e',sp,'l','g',sp,'l','t',sp,
        'k','q','l','q',sp,'k','a','l','a',sp,
        'k',PU,'l',PU,sp,'k','s','l','t',sp,
        // Review h j
        'h','q','j','q',sp,'k','q','l','q',sp,
        'h',PU,'k',PU,sp,'j',PU,'l',PU,sp,
        'h','a','j','a','k','a','l','a',sp,
      ],
    },

    {
      id:'i04', order:4, level:'intermediate',
      title:'ந ய + Vowels',
      description:";  '  + vowel forms",
      focusKeys:[';',"'",PU,...V_ALL], targetWPM:24,
      content: [
        ';',PU,sp,';','a',sp,';','q',sp,';','s',sp,';','w',sp,
        ';','d',sp,';','e',sp,';','g',sp,';','t',sp,
        "'",'PU',sp,"'",'a',sp,"'",'q',sp,"'",'s',sp,"'",'w',sp,
        "'",'d',sp,"'",'e',sp,"'",'g',sp,"'",'t',sp,
        ';','q',"'",'q',sp,';','a',"'",'a',sp,
        ';',PU,"'",PU,sp,';','s',"'",'t',sp,
        // Review all home row
        'h',PU,'j',PU,'k',PU,'l',PU,';',PU,"'",PU,sp,
        'h','q','j','q','k','a',sp,'l','a',';','q',"'",'a',sp,
      ],
    },

    {
      id:'i05', order:5, level:'intermediate',
      title:'ல வ ற ன + Vowels',
      description:'n v u i + vowel forms',
      focusKeys:['n','v','u','i',PU,...V_ALL], targetWPM:24,
      content: [
        'n',PU,sp,'n','a',sp,'n','q',sp,'n','s',sp,
        'v',PU,sp,'v','a',sp,'v','q',sp,'v','s',sp,
        'u',PU,sp,'u','a',sp,'u','q',sp,'u','s',sp,
        'i',PU,sp,'i','a',sp,'i','q',sp,'i','s',sp,
        'n','q','v','q',sp,'u','q','i','q',sp,
        'n','a','v','a',sp,'u','a','i','a',sp,
        'n',PU,'v',PU,'u',PU,'i',PU,sp,
        // Review
        'h','q','n','q',sp,'j','a','v','a',sp,'k','q','u','q',sp,
        'l','a','i','a',sp,'n','v',sp,'u','i',sp,
      ],
    },

    {
      id:'i06', order:6, level:'intermediate',
      title:'Common Words I',
      description:'அம்மா · அப்பா · நல்ல · வா · மா',
      focusKeys:['a','k','j','l','n','v',';',PU,'q'], targetWPM:22,
      content: [
        // அம்மா   a·k·f·k·q
        'a','k',PU,'k','q',sp,
        // அப்பா   a·j·f·j·q
        'a','j',PU,'j','q',sp,
        // நல்ல    ;·n·f·n·a
        ';','n',PU,'n','a',sp,
        // வா      v·q
        'v','q',sp,
        // மா      k·q
        'k','q',sp,
        // கா      h·q
        'h','q',sp,
        // நாடு    ;·q·o·d
        ';','q','o','d',sp,
        // மலர்   k·n·a·u·f
        'k','n','a','u',PU,sp,
        // Review pairs
        'a','k',PU,'k','q',sp,'a','j',PU,'j','q',sp,
        ';','n',PU,'n','a',sp,'v','q',sp,'k','q',sp,
        'h','q',sp,'j','q',sp,';','q','o','d',sp,
      ],
    },

    {
      id:'i07', order:7, level:'intermediate',
      title:'Common Words II',
      description:'கல் · மல் · தல · நகர் · கவி',
      focusKeys:['h','k','l','n','v',';',PU,'a','q','s'], targetWPM:26,
      content: [
        // கல்    h·n·f
        'h','n',PU,sp,
        // மல்    k·n·f
        'k','n',PU,sp,
        // வல்    v·n·f
        'v','n',PU,sp,
        // நல்    ;·n·f
        ';','n',PU,sp,
        // தல     l·n·a
        'l','n','a',sp,
        // கமல    h·k·n·a
        'h','k','n','a',sp,
        // நலன்   ;·n·a·n·f
        ';','n','a','n',PU,sp,
        // வலி    v·n·s
        'v','n','s',sp,
        // மதி    k·l·s
        'k','l','s',sp,
        // கதி    h·l·s
        'h','l','s',sp,
        // கவி    h·v·s
        'h','v','s',sp,
        // All again
        'h','n',PU,sp,'k','n',PU,sp,'v','n',PU,sp,';','n',PU,sp,
        'l','n','a',sp,'h','k','n','a',sp,'v','n','s',sp,'h','v','s',sp,
      ],
    },

    {
      id:'i08', order:8, level:'intermediate',
      title:'Intermediate — Speed Drill',
      description:'All intermediate patterns at pace',
      focusKeys:[...C_HR,...C_LRV,...C_RN,PU,...V_ALL], targetWPM:30,
      content: rep([
        'h','q',sp,'k','a',sp,'j','s',sp,'n','q',sp,'v','a',sp,
        'l','q',sp,';','a',sp,'h',PU,sp,'k',PU,sp,'j',PU,sp,
        'n',PU,sp,'v',PU,sp,'l',PU,sp,';',PU,sp,
        'h','q','k',PU,sp,'j','q','n',PU,sp,'v','q',';',PU,sp,
        'h','a','j','a','k','a',sp,'l','a','n','a','v','a',sp,
        'u','a','i','a',sp,'o','a','p','q',sp,
      ],2),
    },
  ],

  /* ── ADVANCED ──────────────────────────────────── */
  advanced: [

    {
      id:'a01', order:1, level:'advanced',
      title:'Grantha — ஸ ஷ ஜ ஹ',
      description:'Shift+Q  W  E  R',
      focusKeys:['Q','W','E','R',PU,...V_A], targetWPM:26,
      content: rep([
        'Q',PU,sp,'W',PU,sp,'E',PU,sp,'R',PU,sp,
        'Q','a',sp,'W','a',sp,'E','a',sp,'R','a',sp,
        'Q','q',sp,'W','q',sp,'E','q',sp,'R','q',sp,
        ...pairs(['Q','W','E','R']),
        'Q',PU,'W',PU,sp,'E',PU,'R',PU,sp,
        'Q','a','W','a',sp,'E','q','R','q',sp,
        'h','q',sp,'Q','q',sp,'j','a',sp,'E','a',sp,
      ],2),
    },

    {
      id:'a02', order:2, level:'advanced',
      title:'ஃ Ayutha Ezhuthu',
      description:'Shift+F  — the unique aspirate',
      focusKeys:['F','h','j','k','l',';','n','v'], targetWPM:28,
      content: rep([
        'F','h',sp,'F','j',sp,'F','k',sp,'F','l',sp,
        'F',';',sp,'F','n',sp,'F','v',sp,'F','u',sp,
        'h','F','h',sp,'j','F','j',sp,'k','F','k',sp,
        ';','F',';',sp,'n','F','n',sp,'v','F','v',sp,
        'F','h','j',sp,'F','k','l',sp,'F','n','v',sp,
        'h',PU,sp,'j',PU,sp,'k',PU,sp,'l',PU,sp,'n',PU,sp,
      ],2),
    },

    {
      id:'a03', order:3, level:'advanced',
      title:'Speed Drill I',
      description:'Home row burst — 30+ WPM target',
      focusKeys:[...C_HR,...C_LRV,...V_A,...V_I,PU], targetWPM:32,
      content: rep([
        'h','q',sp,'k','a',sp,'j','s',sp,'n','q',sp,'v','a',sp,
        'l','q',sp,';','a',sp,'h',PU,sp,'k',PU,sp,'j',PU,sp,
        'n',PU,sp,'v',PU,sp,'l',PU,sp,';',PU,sp,
        'h','q','k',PU,sp,'j','q','n',PU,sp,'v','q',';',PU,sp,
        'h','j','k',sp,'l',';',"'",sp,'n','v','u',sp,
        'h','a','j','a','k','a',sp,'n','a','v','a','l','a',sp,
      ],2),
    },

    {
      id:'a04', order:4, level:'advanced',
      title:'Speed Drill II',
      description:'Full keyboard — all zones',
      focusKeys:[...C_ALL,PU,...V_ALL], targetWPM:36,
      content: rep([
        'h',PU,'j',PU,'k',PU,sp,'l',PU,';',PU,"'",PU,sp,
        'n',PU,'v',PU,'u',PU,'i',PU,sp,'o',PU,'p',PU,'[',PU,sp,
        ']',PU,'b',PU,'y',PU,'/',PU,sp,
        'h','a','j','q','k','s',sp,'l','w','n','d',sp,
        'v','e',';','g',sp,'y','t','o','r',sp,'i','c','/',PU,sp,
        'a','q','s','w','d','e',sp,'g','t','r','c','x','z',sp,
      ],2),
    },

    {
      id:'a05', order:5, level:'advanced',
      title:'All Characters Marathon',
      description:'Every character — endurance test',
      focusKeys:[...V_ALL,...C_ALL,'f','F','Q','W','E','R'], targetWPM:38,
      content: [
        'a','q','s','w','d','e',sp,'g','t','r','c','x','z',sp,
        ...C_ALL.flatMap(k=>[k,PU,sp]),
        'h','a','j','q','k','s',sp,'l','w',';','d',"'",'e',sp,
        'n','g','v','t','u','r',sp,'i','c','o','x','p','z',sp,
        '[','a',']','q','b','s',sp,'y','w','/',PU,sp,
        // Grantha mix
        'Q','a','W','q',sp,'E','a','R','q',sp,
        'h','q','Q','q',sp,'j','a','E','a',sp,
        // Final burst
        ...rep(['h','j','k',sp,'l',';',"'",sp,'n','v','u',sp,'i','o','p',sp],2),
      ],
    },

    {
      id:'a06', order:6, level:'advanced',
      title:'Tamil Text — Speed',
      description:'Complex sequences for peak speed',
      focusKeys:[...C_HR,...C_LRV,...C_RN,PU,...V_ALL], targetWPM:40,
      content: [
        // நீர்  ;·w·u·f
        ';','w','u',PU,sp,
        // இல்லா  s·n·f·n·q
        's','n',PU,'n','q',sp,
        // இடம்   s·o·k·f
        's','o','k',PU,sp,
        // வாழ்   v·q·/·f
        'v','q','/',PU,sp,
        // கற்றது h·u·f·u·a·l·d
        'h','u',PU,'u','a','l','d',sp,
        // கை     h·q·'
        'h','q',"'",sp,
        // மண்    k·a·p·f
        'k','a','p',PU,sp,
        // அளவு   a·y·v·d
        'a','y','v','d',sp,
        // Full phrases repeated
        ';','w','u',PU,sp,'s','n',PU,'n','q',sp,
        'h','u',PU,'u','a','l','d',sp,'k','a','p',PU,sp,'a','y','v','d',sp,
        'v','q','/',PU,sp,'s','o','k',PU,sp,'h','q',"'",sp,
      ],
    },
  ],
};

export const ALL_LESSONS = [
  ...LESSONS_DB.beginner,
  ...LESSONS_DB.intermediate,
  ...LESSONS_DB.advanced,
];

export function getLessonById(id)      { return ALL_LESSONS.find(l=>l.id===id) ?? null; }
export function getNextLesson(id)      { const i=ALL_LESSONS.findIndex(l=>l.id===id); return i>=0&&i<ALL_LESSONS.length-1?ALL_LESSONS[i+1]:null; }
export function getPrevLesson(id)      { const i=ALL_LESSONS.findIndex(l=>l.id===id); return i>0?ALL_LESSONS[i-1]:null; }
export function getLessonIndex(id)     { return ALL_LESSONS.findIndex(l=>l.id===id); }
export function getLessonByIndex(idx)  { return ALL_LESSONS[idx] ?? null; }
export function getFirstIncomplete(done=[]) { return ALL_LESSONS.find(l=>!done.includes(l.id))??ALL_LESSONS[0]; }