/**
 * lessons.js — 34 progressive lessons, 150–350 keystrokes each.
 * Each lesson from b02 onward mixes ~75% new keys + ~25% review.
 */

const sp = ' ';
const PU = 'f'; // pulli ்

/* Content generators */
function times(arr, n) { return Array.from({length:n},()=>[...arr]).flat(); }

// Drill a set of keys: each key r times, then space
function drill(keys, r = 4) {
  return keys.flatMap(k => [...Array(r).fill(k), sp]);
}

// All n-grams of length 2 from keys (with spaces between)
function bigrams(keys) {
  const out = [];
  for (let i = 0; i < keys.length; i++)
    for (let j = 0; j < keys.length; j++)
      if (i !== j) out.push(keys[i], keys[j], sp);
  return out;
}

// Random-ish walk through keys with spaces every 3
// Simple pseudorandom walk using LCG — no infinite loops
function walk(keys, total = 120) {
  if (!keys.length) return [];
  const out = [];
  let seed = keys.length * 31 + total;
  const rand = () => { seed = (Math.imul(1664525, seed) + 1013904223) >>> 0; return seed; };
  let last = -1;
  for (let i = 0; i < total; i++) {
    let next = rand() % keys.length;
    if (next === last && keys.length > 1) next = (next + 1) % keys.length;
    last = next;
    out.push(keys[next]);
    if ((i + 1) % 3 === 0) out.push(sp);
  }
  return out;
}

// Interleave new keys (major) with review keys (minor)
function mix(newKeys, reviewKeys, newCount = 110, reviewCount = 40) {
  const out = [];
  // Drill new first
  out.push(...drill(newKeys, 5));
  out.push(...bigrams(newKeys));
  out.push(...walk(newKeys, newCount));
  // Then review
  if (reviewKeys.length) {
    out.push(...walk(reviewKeys, reviewCount));
    // Finale: interleaved
    for (let i = 0; i < 30; i++) {
      out.push(newKeys[i % newKeys.length]);
      out.push(reviewKeys[i % reviewKeys.length]);
      if ((i + 1) % 3 === 0) out.push(sp);
    }
  }
  return out;
}

// CV syllable patterns: consonant + vowel forms
function cvDrill(cons, vowels, r = 3) {
  const out = [];
  cons.forEach(c => {
    vowels.forEach(v => {
      for (let i = 0; i < r; i++) out.push(c, v);
      out.push(sp);
    });
  });
  return out;
}

/* Key groups */
const V_A   = ['a','q'];
const V_I   = ['s','w'];
const V_U   = ['d','e'];
const V_E   = ['g','t','r'];
const V_O   = ['c','x','z'];
const V_ALL = [...V_A,...V_I,...V_U,...V_E,...V_O];
const C_HR  = ['h','j','k','l',';',"'"];
const C_LV  = ['n','v'];
const C_RN  = ['u','i'];
const C_OPN = ['o','p'];
const C_CH  = ['[',']'];
const C_REST= ['b','y','/'];
const C_ALL = [...C_HR,...C_LV,...C_RN,...C_OPN,...C_CH,'b','y','/'];

export const LESSONS_DB = {

  /* ═══════════════════════════════ BEGINNER */
  beginner: [
    {
      id:'b01',order:1,level:'beginner',
      title:'அ ஆ',
      description:'a  q — left pinky',
      focusKeys:['a','q'],targetWPM:10,
      content:[
        ...drill(['a'],6),...drill(['q'],6),
        ...bigrams(['a','q']),
        ...walk(['a','q'],160),
        'a','q','a',sp,'q','a','q',sp,'a','a','q',sp,'q','q','a',sp,
        ...times(['a','q','a',sp,'q','a','a',sp],8),
      ],
    },
    {
      id:'b02',order:2,level:'beginner',
      title:'இ ஈ',
      description:'s  w  (+ அ ஆ review)',
      focusKeys:['s','w'],targetWPM:10,
      content:[
        ...drill(['s'],6),...drill(['w'],6),
        ...bigrams(['s','w']),
        ...mix(['s','w'],['a','q'],120,50),
        's','w','a',sp,'w','s','q',sp,'a','s','w',sp,'q','w','s',sp,
        ...times(['s','w',sp,'a','q',sp],10),
      ],
    },
    {
      id:'b03',order:3,level:'beginner',
      title:'உ ஊ',
      description:'d  e  (+ previous vowels)',
      focusKeys:['d','e'],targetWPM:10,
      content:[
        ...drill(['d'],6),...drill(['e'],6),
        ...bigrams(['d','e']),
        ...mix(['d','e'],[...V_A,...V_I],120,50),
        'd','e','a',sp,'e','d','s',sp,'d','q','e',sp,
        ...times(['d','e',sp,'s','w',sp,'a','q',sp],8),
      ],
    },
    {
      id:'b04',order:4,level:'beginner',
      title:'எ ஏ ஐ',
      description:'g  t  r  (+ previous vowels)',
      focusKeys:['g','t','r'],targetWPM:12,
      content:[
        ...drill(['g'],5),...drill(['t'],5),...drill(['r'],5),
        ...bigrams(['g','t','r']),
        ...mix(['g','t','r'],[...V_A,...V_I,...V_U],130,50),
        'g','t','r',sp,'r','t','g',sp,'g','r','d',sp,
        ...times(['g','t',sp,'d','e',sp,'s','w',sp,'a','q',sp],6),
      ],
    },
    {
      id:'b05',order:5,level:'beginner',
      title:'ஒ ஓ ஔ',
      description:'c  x  z  (+ all previous vowels)',
      focusKeys:['c','x','z'],targetWPM:12,
      content:[
        ...drill(['c'],5),...drill(['x'],5),...drill(['z'],5),
        ...bigrams(['c','x','z']),
        ...mix(['c','x','z'],[...V_A,...V_I,...V_U,...V_E],130,50),
        'c','x','z',sp,'z','x','c',sp,
        ...times(['c','x',sp,'g','t',sp,'d','e',sp,'s','w',sp,'a','q',sp],5),
      ],
    },
    {
      id:'b06',order:6,level:'beginner',
      title:'All 12 Vowels',
      description:'உயிர் எழுத்து — full review',
      focusKeys:V_ALL,targetWPM:15,
      content:[
        ...drill(V_ALL,3),
        ...bigrams([...V_A,...V_I,...V_U]),
        ...bigrams([...V_E,...V_O]),
        ...walk(V_ALL,220),
        'a','q',sp,'s','w',sp,'d','e',sp,'g','t',sp,'r',sp,'c','x',sp,'z',sp,
        ...times([...V_A,...V_I,...V_U,sp,...V_E,...V_O,sp],4),
      ],
    },
    {
      id:'b07',order:7,level:'beginner',
      title:'Vowels — Speed',
      description:'All vowels at faster pace',
      focusKeys:V_ALL,targetWPM:20,
      content:[
        ...walk(V_ALL,300),
        ...bigrams(V_ALL),
        ...times(['a','s','d','g','c',sp,'q','w','e','t','x',sp,'r','z',sp],8),
      ],
    },
    {
      id:'b08',order:8,level:'beginner',
      title:'க ப — புள்ளி',
      description:'h  j  f  (+ vowels a q s)',
      focusKeys:['h','j',PU,...V_A,...V_I],targetWPM:14,
      content:[
        ...drill(['h'],5),...drill(['j'],5),
        ...drill([PU],4),
        'h',PU,sp,'j',PU,sp,
        ...cvDrill(['h','j'],['a','q','s','w'],3),
        ...mix(['h','j','h',PU,'j',PU],[...V_A,...V_I],140,60),
        'h','a','j','a',sp,'h','q','j','q',sp,'h',PU,'j',PU,sp,
        'h','s','j','w',sp,'j','s','h','w',sp,
        ...times(['h',PU,sp,'j',PU,sp,'h','q',sp,'j','a',sp],8),
      ],
    },
    {
      id:'b09',order:9,level:'beginner',
      title:'ம த',
      description:'k  l  (+ prev consonants + vowels)',
      focusKeys:['k','l',PU,...V_A,...V_I],targetWPM:14,
      content:[
        ...drill(['k'],5),...drill(['l'],5),
        'k',PU,sp,'l',PU,sp,
        ...cvDrill(['k','l'],['a','q','s','w'],3),
        ...mix(['k','l','k',PU,'l',PU],['h','j','h',PU,'j',PU,...V_A,...V_I],140,60),
        'k','a','l','a',sp,'k','q','l','q',sp,'h','a','k','a',sp,
        ...times(['k',PU,sp,'l',PU,sp,'h',PU,sp,'j',PU,sp],7),
        ...times(['k','a','l','q',sp,'h','s','j','w',sp],6),
      ],
    },
    {
      id:'b10',order:10,level:'beginner',
      title:"ந ய",
      description:";  '  (+ all home-row consonants)",
      focusKeys:[';',"'",PU,...V_A,...V_I],targetWPM:14,
      content:[
        ...drill([';'],5),...drill(["'"],5),
        ';',PU,sp,"'",PU,sp,
        ...cvDrill([';',"'"],['a','q','s','w'],3),
        ...mix([';',"'",';',PU,"'",PU],['h','j','k','l',...V_A,...V_I],140,60),
        ';','a',"'",'a',sp,';','q',"'",'q',sp,
        'h',PU,'j',PU,'k',PU,'l',PU,';',PU,"'",PU,sp,
        ...times(['h','j','k',sp,'l',';',"'",sp],7),
      ],
    },
    {
      id:'b11',order:11,level:'beginner',
      title:'Home Row — Full',
      description:'க ப ம த ந ய all together',
      focusKeys:[...C_HR,PU,...V_A],targetWPM:16,
      content:[
        ...drill(C_HR,3),
        ...cvDrill(C_HR,[...V_A,PU],2),
        ...bigrams(C_HR),
        ...walk(C_HR.flatMap(k=>[k,PU,k,'a',k,'q']),180),
        ...times([...C_HR,sp,...C_HR.map(k=>k+PU)].join('').split('').filter(c=>c!==PU),3),
        'h','a','j','a','k','a',sp,'l','a',';','a',"'",'a',sp,
        'h','q','j','q','k','q',sp,'l','q',';','q',"'",'q',sp,
        'h',PU,'j',PU,'k',PU,sp,'l',PU,';',PU,"'",PU,sp,
        ...walk([...C_HR,...V_A,...V_I],100),
      ],
    },
    {
      id:'b12',order:12,level:'beginner',
      title:'ல வ',
      description:'n  v  (+ home row + vowels)',
      focusKeys:['n','v',PU,...V_A,...C_HR],targetWPM:16,
      content:[
        ...drill(['n'],5),...drill(['v'],5),
        'n',PU,sp,'v',PU,sp,
        ...cvDrill(['n','v'],['a','q','s','w',PU],3),
        ...mix(['n','v','n',PU,'v',PU],[...C_HR,...V_A,...V_I],160,60),
        'h','n',PU,sp,'j','v',PU,sp,'k','n',PU,sp,
        'n','a','v','a',sp,'n','q','v','q',sp,
        ...times(['n',PU,sp,'v',PU,sp,'h','j',sp,'k','l',sp],7),
        ...walk(['n','v','h','j','k','l',...V_A],100),
      ],
    },
    {
      id:'b13',order:13,level:'beginner',
      title:'ற ன',
      description:'u  i  (+ prev consonants + vowels)',
      focusKeys:['u','i',PU,...V_A,...C_HR,...C_LV],targetWPM:16,
      content:[
        ...drill(['u'],5),...drill(['i'],5),
        'u',PU,sp,'i',PU,sp,
        ...cvDrill(['u','i'],['a','q','s','w',PU],3),
        ...mix(['u','i','u',PU,'i',PU],[...C_HR,...C_LV,...V_A,...V_I],160,60),
        'h','u',PU,sp,'j','i',PU,sp,'n','u',PU,sp,
        'u','a','i','a',sp,'u','q','i','q',sp,
        ...times(['u',PU,sp,'i',PU,sp,'n',PU,sp,'v',PU,sp],7),
        ...walk(['u','i','n','v','h','j','k',...V_A],100),
      ],
    },
    {
      id:'b14',order:14,level:'beginner',
      title:'ட ண',
      description:'o  p  retroflex + prev',
      focusKeys:['o','p',PU,...V_A,...C_HR,...C_LV,...C_RN],targetWPM:16,
      content:[
        ...drill(['o'],5),...drill(['p'],5),
        'o',PU,sp,'p',PU,sp,
        ...cvDrill(['o','p'],['a','q','s','w',PU],3),
        ...mix(['o','p','o',PU,'p',PU],[...C_HR,...C_LV,...C_RN,...V_A,...V_I],160,60),
        'h','o',PU,sp,'j','p',PU,sp,'u','o',PU,sp,
        'o','a','p','a',sp,'o','q','p','q',sp,
        ...times(['o',PU,sp,'p',PU,sp,'u',PU,sp,'i',PU,sp],7),
        ...walk(['o','p','u','i','n','v','h','j',...V_A],100),
      ],
    },
    {
      id:'b15',order:15,level:'beginner',
      title:'ச ஞ',
      description:"[  ]  + prev consonants",
      focusKeys:['[',']',PU,...V_A,...C_HR,...C_LV,...C_RN,...C_OPN],targetWPM:16,
      content:[
        ...drill(['['],5),...drill([']'],5),
        '[',PU,sp,']',PU,sp,
        ...cvDrill(['[',']'],['a','q','s',PU],3),
        ...mix(['[',']','[',PU,']',PU],[...C_HR,...C_LV,...C_RN,...C_OPN,...V_A],160,60),
        'h','[',PU,sp,'j',']',PU,sp,
        '[','a',']','q',sp,'[',PU,']',PU,sp,
        ...times(['[',PU,sp,']',PU,sp,'o',PU,sp,'p',PU,sp],7),
        ...walk(['[',']','o','p','u','i','n','v','h','j',...V_A],100),
      ],
    },
    {
      id:'b16',order:16,level:'beginner',
      title:'ங ள ழ',
      description:'b  y  /  + prev',
      focusKeys:['b','y','/',PU,...V_A,...C_HR,...C_LV,...C_RN,...C_OPN,...C_CH],targetWPM:16,
      content:[
        ...drill(['b'],5),...drill(['y'],5),...drill(['/'],5),
        'b',PU,sp,'y',PU,sp,'/',PU,sp,
        ...cvDrill(['b','y','/'],['a','q','s',PU],3),
        ...mix(['b','y','/','b',PU,'y',PU,'/',PU],[...C_HR,...C_LV,...C_RN,...V_A],160,60),
        'b','a','y','a',sp,'/','q','b','q',sp,
        'y',PU,'/',PU,'b',PU,sp,
        ...times(['b',PU,sp,'y',PU,sp,'/',PU,sp],8),
        ...walk(['b','y','/','[',']','o','p',...V_A],100),
      ],
    },
    {
      id:'b17',order:17,level:'beginner',
      title:'All 18 Consonants',
      description:'மெய் எழுத்து — full consonant review',
      focusKeys:[...C_ALL,PU],targetWPM:18,
      content:[
        ...C_ALL.flatMap(k=>[...Array(3).fill(k),sp]),
        ...C_ALL.flatMap(k=>[k,PU,sp]),
        ...C_ALL.flatMap(k=>[k,'a',sp]),
        ...C_ALL.flatMap(k=>[k,'q',sp]),
        ...bigrams(['h','j','k','l']),
        ...bigrams(['n','v','u','i']),
        ...bigrams(['o','p','[',']']),
        ...walk(C_ALL.flatMap(k=>[k,PU,k,'a']),200),
        'h',PU,'j',PU,'k',PU,'l',PU,sp,'n',PU,'v',PU,'u',PU,'i',PU,sp,
        'o',PU,'p',PU,'[',PU,']',PU,'b',PU,'y',PU,'/',PU,sp,
      ],
    },
    {
      id:'b18',order:18,level:'beginner',
      title:'Consonants + All Vowels',
      description:'Every consonant with all 12 vowel forms',
      focusKeys:[...C_ALL,PU,...V_ALL],targetWPM:18,
      content:[
        ...cvDrill(['h','j','k'],V_ALL,2),
        ...cvDrill(['l',';',"'"],V_ALL,2),
        ...cvDrill(['n','v','u','i'],V_ALL,2),
        ...cvDrill(['o','p','[',']'],['a','q','s','w',PU],2),
        ...cvDrill(['b','y','/'],['a','q','s',PU],2),
        ...walk(C_ALL.flatMap(k=>[k,'a',k,'q',k,PU]),160),
      ],
    },
    {
      id:'b19',order:19,level:'beginner',
      title:'் Pulli — Patterns',
      description:'Consonant cluster practice with pulli',
      focusKeys:[PU,...C_HR,...C_LV,...C_RN,...V_A],targetWPM:18,
      content:[
        // Single consonant + pulli
        ...C_ALL.flatMap(k=>[...Array(3).fill([k,PU]),sp].flat()),
        // CV + C-pulli
        'h','q','j',PU,sp,'k','a','l',PU,sp,'n','q','v',PU,sp,
        ';','a',"'",PU,sp,'u','q','i',PU,sp,
        // CC pulli combos
        'h',PU,'j',PU,sp,'k',PU,'l',PU,sp,'n',PU,'v',PU,sp,
        // All forms of h
        'h','a','h','q','h','s','h','w','h','d','h','e','h',PU,sp,
        // All forms of k
        'k','a','k','q','k','s','k','w','k','d','k','e','k',PU,sp,
        ...walk(C_HR.flatMap(k=>[k,'a',k,'q',k,'s',k,PU]),180),
      ],
    },
    {
      id:'b20',order:20,level:'beginner',
      title:'Beginner — Final Drill',
      description:'Everything at speed — full keyboard',
      focusKeys:[...V_ALL,...C_ALL,PU],targetWPM:22,
      content:[
        ...walk(V_ALL,100),
        ...walk(C_ALL.flatMap(k=>[k,'a',k,PU]),200),
        ...bigrams(['h','j','k','l','n','v']),
        ...cvDrill(['h','j','k'],V_ALL,1),
        ...cvDrill(['n','v','l'],['a','q','s','w',PU],2),
        'h','q',sp,'j','a',sp,'k','s',sp,'l','q',sp,';','a',sp,"'",'q',sp,
        'n','q',sp,'v','a',sp,'u','s',sp,'i','w',sp,
        'o','a','p','q',sp,'[','a',']','q',sp,'y',PU,'/',PU,sp,
        ...walk([...C_HR,...C_LV,...V_A,...V_I],150),
      ],
    },
  ],

  /* ═══════════════════════════════ INTERMEDIATE */
  intermediate: [
    {
      id:'i01',order:1,level:'intermediate',
      title:'க + All Vowels',
      description:'க் கா கி கீ கு கூ ...',
      focusKeys:['h',PU,...V_ALL],targetWPM:22,
      content:[
        ...V_ALL.flatMap(v=>['h',v,sp,...Array(3).fill(['h',v]).flat(),sp]),
        'h',PU,sp,'h','a',sp,'h','q',sp,'h','s',sp,'h','w',sp,
        'h','d',sp,'h','e',sp,'h','g',sp,'h','t',sp,'h','r',sp,'h','c',sp,'h','x',sp,
        ...times(['h','q','h',PU,sp,'h','s','h','t',sp,'h','d','h','e',sp],4),
        'h',PU,'h','q','h','s','h','w',sp,'h','d','h','e','h','g','h','t',sp,
        'h','r','h','c','h','x','h',PU,sp,
        ...walk(V_ALL.flatMap(v=>['h',v]),200),
        // review h j
        'j',PU,sp,'j','a',sp,'j','q',sp,'h','q','j','q',sp,'k','a','h','a',sp,
      ],
    },
    {
      id:'i02',order:2,level:'intermediate',
      title:'ப + All Vowels',
      description:'ப் பா பி பீ ...',
      focusKeys:['j',PU,...V_ALL],targetWPM:22,
      content:[
        ...V_ALL.flatMap(v=>['j',v,sp,...Array(3).fill(['j',v]).flat(),sp]),
        ...times(['j','q','j',PU,sp,'j','s','j','t',sp,'j','d','j','e',sp],4),
        'j',PU,'j','q','j','s','j','w',sp,'j','d','j','e','j','g','j','t',sp,
        ...walk(V_ALL.flatMap(v=>['j',v]),200),
        // review h
        'h',PU,sp,'h','a',sp,'h','q',sp,'h','s',sp,
        'h','q','j','q',sp,'h','a','j','a',sp,'h',PU,'j',PU,sp,
      ],
    },
    {
      id:'i03',order:3,level:'intermediate',
      title:'ம த + Vowels',
      description:'ம் மா ... த் தா ...',
      focusKeys:['k','l',PU,...V_ALL],targetWPM:24,
      content:[
        ...V_ALL.flatMap(v=>['k',v,sp,'l',v,sp]),
        ...V_ALL.flatMap(v=>[...Array(2).fill(['k',v,'l',v]).flat(),sp]),
        'k','q','l','q',sp,'k','a','l','a',sp,'k',PU,'l',PU,sp,
        ...walk(V_ALL.flatMap(v=>['k',v,'l',v]),220),
        // Review h j
        'h','q','j','q',sp,'k','q','l','q',sp,'h',PU,'k',PU,sp,'j',PU,'l',PU,sp,
        'h','a','j','a','k','a','l','a',sp,
      ],
    },
    {
      id:'i04',order:4,level:'intermediate',
      title:'ந ய ல வ + Vowels',
      description:";  '  n  v + all vowel forms",
      focusKeys:[';',"'",'n','v',PU,...V_ALL],targetWPM:24,
      content:[
        ...V_ALL.flatMap(v=>[';',v,sp,"'",v,sp,'n',v,sp,'v',v,sp]),
        ';','q',"'",'q',sp,';','a',"'",'a',sp,
        'n','q','v','q',sp,'n','a','v','a',sp,
        ...walk(V_ALL.flatMap(v=>[';',v,"'",v,'n',v,'v',v]),200),
        // All home row review
        'h',PU,'j',PU,'k',PU,'l',PU,';',PU,"'",PU,sp,
        'h','q','j','q','k','a',sp,'l','a',';','q',"'",'a',sp,
        'n','q','v','a','n',PU,'v',PU,sp,
      ],
    },
    {
      id:'i05',order:5,level:'intermediate',
      title:'ற ன ட ண + Vowels',
      description:'u  i  o  p with vowel forms',
      focusKeys:['u','i','o','p',PU,...V_ALL],targetWPM:24,
      content:[
        ...V_ALL.flatMap(v=>['u',v,sp,'i',v,sp,'o',v,sp,'p',v,sp]),
        'u','q','i','q',sp,'o','a','p','a',sp,
        'u','a','i','q',sp,'o','q','p','a',sp,
        ...walk(V_ALL.flatMap(v=>['u',v,'i',v,'o',v,'p',v]),220),
        // All consonants so far
        ...C_ALL.slice(0,-3).flatMap(k=>[k,PU,sp]),
      ],
    },
    {
      id:'i06',order:6,level:'intermediate',
      title:'Common Tamil Words I',
      description:'அம்மா · அப்பா · நல்ல · வா · மா ...',
      focusKeys:['a','k','j','l','n','v',';',PU,'q'],targetWPM:22,
      content:[
        // Repeat each word multiple times
        ...times(['a','k',PU,'k','q',sp],8),          // அம்மா
        ...times(['a','j',PU,'j','q',sp],8),          // அப்பா
        ...times([';','n',PU,'n','a',sp],8),          // நல்ல
        ...times(['v','q',sp],10),                     // வா
        ...times(['k','q',sp],10),                     // மா
        ...times(['h','q',sp],10),                     // கா
        ...times([';','q','o','d',sp],6),              // நாடு
        ...times(['k','n','a','u',PU,sp],6),           // மலர்
        ...times(['v','n','s',sp],6),                  // வலி
        ...times(['k','l','s',sp],6),                  // மதி
        ...times(['h','l','s',sp],6),                  // கதி
        // Mixed
        'a','k',PU,'k','q',sp,'a','j',PU,'j','q',sp,
        ';','n',PU,'n','a',sp,'v','q',sp,'k','q',sp,'h','q',sp,
        ';','q','o','d',sp,'k','n','a','u',PU,sp,
        'v','n','s',sp,'k','l','s',sp,'h','l','s',sp,
        ...walk(['a','k','j','n','v','l',';','h',PU,'a','q'],120),
      ],
    },
    {
      id:'i07',order:7,level:'intermediate',
      title:'Common Tamil Words II',
      description:'கல் · மல் · தல · நகர் · கவி ...',
      focusKeys:['h','k','l','n','v',';',PU,'a','q','s'],targetWPM:26,
      content:[
        ...times(['h','n',PU,sp],8),                  // கல்
        ...times(['k','n',PU,sp],8),                  // மல்
        ...times(['v','n',PU,sp],8),                  // வல்
        ...times([';','n',PU,sp],8),                  // நல்
        ...times(['l','n','a',sp],8),                  // தல
        ...times(['h','k','n','a',sp],6),              // கமல
        ...times([';','n','a','n',PU,sp],6),           // நலன்
        ...times(['k','l','a','l',PU,sp],6),           // மதல்
        ...times(['h','v','s',sp],8),                  // கவி
        ...times(['k','v','s',sp],8),                  // மவி
        // Mixed word practice
        ...times(['h','n',PU,sp,'k','n',PU,sp,'v','n',PU,sp,';','n',PU,sp],5),
        ...times(['l','n','a',sp,'h','k','n','a',sp,'h','v','s',sp,'k','l','s',sp],4),
        ...walk(['h','k','l','n','v',';',PU,'a','q','s'],120),
      ],
    },
    {
      id:'i08',order:8,level:'intermediate',
      title:'Intermediate — Speed Drill',
      description:'All intermediate patterns at target pace',
      focusKeys:[...C_HR,...C_LV,...C_RN,PU,...V_ALL],targetWPM:30,
      content:[
        ...walk([...C_HR,...C_LV,...C_RN,...V_ALL],60),
        ...cvDrill([...C_HR,...C_LV],V_ALL.slice(0,8),1),
        ...bigrams([...C_HR,...C_LV]),
        'h','q',sp,'k','a',sp,'j','s',sp,'n','q',sp,'v','a',sp,
        'l','q',sp,';','a',sp,'h',PU,sp,'k',PU,sp,'j',PU,sp,
        'n',PU,sp,'v',PU,sp,'l',PU,sp,';',PU,sp,
        'h','q','k',PU,sp,'j','q','n',PU,sp,'v','q',';',PU,sp,
        'h','a','j','a','k','a',sp,'l','a','n','a','v','a',sp,
        'u','a','i','a',sp,'o','a','p','q',sp,
        ...walk([...C_HR,...C_LV,...C_RN,...V_A,...V_I],200),
      ],
    },
  ],

  /* ═══════════════════════════════ ADVANCED */
  advanced: [
    {
      id:'a01',order:1,level:'advanced',
      title:'Grantha — ஸ ஷ ஜ ஹ',
      description:'Shift+Q  W  E  R',
      focusKeys:['Q','W','E','R',PU,...V_A],targetWPM:26,
      content:[
        ...drill(['Q'],5),...drill(['W'],5),...drill(['E'],5),...drill(['R'],5),
        'Q',PU,sp,'W',PU,sp,'E',PU,sp,'R',PU,sp,
        'Q','a',sp,'W','a',sp,'E','a',sp,'R','a',sp,
        'Q','q',sp,'W','q',sp,'E','q',sp,'R','q',sp,
        ...bigrams(['Q','W','E','R']),
        ...walk(['Q','W','E','R'].flatMap(k=>[k,PU,k,'a',k,'q']),200),
        'h','q',sp,'Q','q',sp,'j','a',sp,'E','a',sp,'k','s',sp,'R','s',sp,
        ...walk(['Q','W','E','R','h','j','k',...V_A],120),
      ],
    },
    {
      id:'a02',order:2,level:'advanced',
      title:'ஃ Ayutha Ezhuthu',
      description:'Shift+F — the unique aspirate',
      focusKeys:['F','h','j','k','l',';','n','v'],targetWPM:28,
      content:[
        ...drill(['F'],6),
        'F','h',sp,'F','j',sp,'F','k',sp,'F','l',sp,
        'F',';',sp,'F','n',sp,'F','v',sp,'F','u',sp,
        'h','F','h',sp,'j','F','j',sp,'k','F','k',sp,
        ';','F',';',sp,'n','F','n',sp,'v','F','v',sp,
        'F','h','j',sp,'F','k','l',sp,'F','n','v',sp,
        ...walk(['F','h','j','k','l',';','n','v'],100),
        ...times(['F','h',sp,'F','j',sp,'F','k',sp,'F','l',sp,'h',PU,sp,'j',PU,sp],8),
        ...walk(['F','h','j','k','l',';','n','v','u','i'],150),
      ],
    },
    {
      id:'a03',order:3,level:'advanced',
      title:'Speed Drill I',
      description:'Home row + vowels — 32 WPM target',
      focusKeys:[...C_HR,...C_LV,...V_A,...V_I,PU],targetWPM:32,
      content:[
        ...walk([...C_HR,...C_LV,...V_ALL],80),
        ...bigrams([...C_HR,...C_LV]),
        ...cvDrill([...C_HR,...C_LV],V_ALL,1),
        ...walk([...C_HR,...C_LV,...V_A,...V_I,PU].flatMap(k=>[k]),280),
        'h','q',sp,'k','a',sp,'j','s',sp,'n','q',sp,'v','a',sp,
        'l','q',sp,';','a',sp,'h',PU,sp,'k',PU,sp,'j',PU,sp,
        'h','j','k',sp,'l',';',"'",sp,'n','v','u',sp,
        ...times(['h','a','j','a','k','a',sp,'n','a','v','a','l','a',sp],8),
      ],
    },
    {
      id:'a04',order:4,level:'advanced',
      title:'Speed Drill II',
      description:'Full keyboard — all zones',
      focusKeys:[...C_ALL,PU,...V_ALL],targetWPM:36,
      content:[
        ...walk(C_ALL.flatMap(k=>[k,PU,k,'a']),200),
        ...cvDrill(C_ALL,V_ALL.slice(0,6),1),
        ...bigrams(C_ALL.slice(0,8)),
        'h',PU,'j',PU,'k',PU,sp,'l',PU,';',PU,"'",PU,sp,
        'n',PU,'v',PU,'u',PU,'i',PU,sp,'o',PU,'p',PU,'[',PU,sp,
        ']',PU,'b',PU,'y',PU,'/',PU,sp,
        'h','a','j','q','k','s',sp,'l','w','n','d',sp,
        'v','e',';','g',sp,'y','t','o','r',sp,'i','c','/',PU,sp,
        'a','q','s','w','d','e',sp,'g','t','r','c','x','z',sp,
        ...walk([...C_ALL,...V_ALL,PU],200),
      ],
    },
    {
      id:'a05',order:5,level:'advanced',
      title:'All Characters Marathon',
      description:'Every key — ultimate endurance',
      focusKeys:[...V_ALL,...C_ALL,PU,'F','Q','W','E','R'],targetWPM:38,
      content:[
        ...walk(V_ALL,100),
        ...C_ALL.flatMap(k=>[k,PU,sp]),
        'h','a','j','q','k','s',sp,'l','w',';','d',"'",'e',sp,
        'n','g','v','t','u','r',sp,'i','c','o','x','p','z',sp,
        '[','a',']','q','b','s',sp,'y','w','/',PU,sp,
        'Q','a','W','q',sp,'E','a','R','q',sp,
        'h','q','Q','q',sp,'j','a','E','a',sp,
        ...walk([...C_ALL,...V_ALL,PU,'F','Q','W','E','R'],300),
        ...cvDrill(C_ALL,V_ALL,1),
      ],
    },
    {
      id:'a06',order:6,level:'advanced',
      title:'Tamil Text Speed',
      description:'Complex sequences — peak speed',
      focusKeys:[...C_HR,...C_LV,...C_RN,PU,...V_ALL],targetWPM:40,
      content:[
        // Proverb fragments, repeated
        ...times([';','w','u',PU,sp],6),              // நீர்
        ...times(['s','n',PU,'n','q',sp],6),          // இல்லா
        ...times(['s','o','k',PU,sp],6),              // இடம்
        ...times(['v','q','/',PU,sp],6),              // வாழ்
        ...times(['h','u',PU,'u','a','l','d',sp],5),  // கற்றது
        ...times(['k','a','p',PU,sp],6),              // மண்
        ...times(['a','y','v','d',sp],6),             // அளவு
        // Full phrases
        ...times([';','w','u',PU,sp,'s','n',PU,'n','q',sp,'s','o','k',PU,sp],4),
        ...times(['h','u',PU,'u','a','l','d',sp,'k','a','p',PU,sp,'a','y','v','d',sp],4),
        ...walk([...C_HR,...C_LV,...C_RN,...V_ALL,PU],220),
      ],
    },
  ],
};

export const ALL_LESSONS = [
  ...LESSONS_DB.beginner,
  ...LESSONS_DB.intermediate,
  ...LESSONS_DB.advanced,
];

export function getLessonById(id)     { return ALL_LESSONS.find(l=>l.id===id)??null; }
export function getNextLesson(id)     { const i=ALL_LESSONS.findIndex(l=>l.id===id); return i>=0&&i<ALL_LESSONS.length-1?ALL_LESSONS[i+1]:null; }
export function getPrevLesson(id)     { const i=ALL_LESSONS.findIndex(l=>l.id===id); return i>0?ALL_LESSONS[i-1]:null; }
export function getLessonIndex(id)    { return ALL_LESSONS.findIndex(l=>l.id===id); }
export function getFirstIncomplete(done=[]) { return ALL_LESSONS.find(l=>!done.includes(l.id))??ALL_LESSONS[0]; }