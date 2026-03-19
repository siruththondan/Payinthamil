/**
 * lessons.js — 34 lessons, keybr-style.
 *
 * VARIETY: Content uses Math.random() and is generated fresh each session
 * via generateContent() thunks — same lesson feels different every run.
 *
 * UYIR-MEI: Lessons b13–b17 cover all 216 forms (18 cons × 12 vow).
 * LIMIT: Every lesson ≤ 150 keystrokes.
 */

const sp = ' ';
const PU = 'f'; // pulli ்

const ri = n => Math.floor(Math.random() * n);

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
  const out = [];
  let n = 0, lastW = null;
  while (n < chars) {
    const wl = 2 + ri(4);
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
    lastW = ws;
    out.push(...word, sp);
    n += word.length + 1;
  }
  while (out.length && out[out.length - 1] === sp) out.pop();
  return out;
}

function wKeybr(np, rp, chars) {
  return keybr([...np,...np,...np,...np,...np,...np,...np,...rp,...rp,...rp], chars);
}

function intro(syl) {
  const shuffled = [...syl].sort(() => Math.random() - 0.5);
  const out = [];
  for (const s of shuffled) { out.push(...s, ...s, sp); }
  for (let w = 0; w < 8; w++)
    out.push(...syl[ri(syl.length)], ...syl[ri(syl.length)], sp);
  return out;
}

// Structured uyir-mei: all 12 vowel forms per consonant, 3/word
// Shuffles both consonant order AND vowel-group order each run
function uyirMeiAll(cons) {
  const shuffledCons = [...cons].sort(() => Math.random() - 0.5);
  const vGroups = [];
  for (let i = 0; i < V_ALL.length; i += 3) vGroups.push(V_ALL.slice(i, i + 3));
  const out = [];
  for (const c of shuffledCons) {
    const vg = [...vGroups].sort(() => Math.random() - 0.5);
    for (const grp of vg) { for (const v of grp) out.push(c, v); out.push(sp); }
  }
  return out;
}

function wordGen(words, count) {
  const out = [];
  for (let i = 0; i < count; i++) out.push(...words[ri(words.length)], sp);
  while (out.length && out[out.length - 1] === sp) out.pop();
  return out;
}

const V_A = ['a','q'], V_I = ['s','w'], V_U = ['d','e'];
const V_E = ['g','t','r'], V_O = ['c','x','z'];
const V_ALL = [...V_A,...V_I,...V_U,...V_E,...V_O];
const C_HR  = ['h','j','k','l',';',"'"];
const C_LV  = ['n','v'], C_RN = ['u','i'], C_OPN = ['o','p'];
const C_CH  = ['[',']'], C_REST = ['b','y','/'];
const C_ALL = [...C_HR,...C_LV,...C_RN,...C_OPN,...C_CH,...C_REST];

const W1 = [
  ['h','q'],['j','q'],['k','q'],['l','q'],[';','q'],['v','q'],
  ['h','n',PU],['k','n',PU],['v','n',PU],['j','n',PU],
  [';','n',PU,'n','a'],['h','n',PU,'n','a'],
  ['h','v','s'],['k','l','s'],['v','n','s'],['l','n','a'],
];
const W2 = [
  ['a','k',PU,'k','q'],['a','j',PU,'j','q'],['h','j',PU,'j','q'],
  [';','n',PU,'n','a'],['v','w','o','d'],[';','q','o','d'],
  ['k','n','a','u',PU],[';','q','k',PU],['l','k',PU],
  ['h','q','n','a'],['k','q','k',PU],['v','q','/',PU],
];
const W3 = [
  [';','w','u',PU],['s','n',PU,'n','q'],['h','u',PU,'u','a','l','d'],
  ['k','a','p',PU],['h','k','n','a'],[';','n','a','n',PU],
  ['k','l','a','l',PU],['v','n',PU,'n','a'],
];

export const LESSONS_DB = {
  beginner: [
    { id:'b01',order:1,level:'beginner', title:'க ப',
      description:'h j — first consonants + அ ஆ', focusKeys:['h','j','a','q'],targetWPM:10,
      generateContent(){ const p=pool(['h','j'],V_A); return [...intro(p),...keybr(p,70)]; } },
    { id:'b02',order:2,level:'beginner', title:'ம த ந ய',
      description:"k l ; ' — home row complete", focusKeys:['k','l',';',"'",'a','q'],targetWPM:10,
      generateContent(){ const np=pool(['k','l',';',"'"],V_A); return [...intro(np),...wKeybr(np,pool(['h','j'],V_A),55)]; } },
    { id:'b03',order:3,level:'beginner', title:'Home Row — Speed',
      description:'All 6 home consonants × அ ஆ', focusKeys:[...C_HR,'a','q'],targetWPM:12,
      generateContent(){ return keybr(pool(C_HR,V_A),110); } },
    { id:'b04',order:4,level:'beginner', title:'இ ஈ',
      description:'s w — left ring finger', focusKeys:[...C_HR,'s','w'],targetWPM:12,
      generateContent(){ const np=pool(C_HR,V_I); return [...intro(np),...wKeybr(np,pool(C_HR,V_A),40)]; } },
    { id:'b05',order:5,level:'beginner', title:'உ ஊ',
      description:'d e — left middle finger', focusKeys:[...C_HR,'d','e'],targetWPM:12,
      generateContent(){ const np=pool(C_HR,V_U); return [...intro(np),...wKeybr(np,pool(C_HR,[...V_A,...V_I]),40)]; } },
    { id:'b06',order:6,level:'beginner', title:'எ ஏ ஐ',
      description:'g t r — left index finger', focusKeys:[...C_HR,'g','t','r'],targetWPM:14,
      generateContent(){ return wKeybr(pool(C_HR,V_E),pool(C_HR,[...V_A,...V_I,...V_U]),120); } },
    { id:'b07',order:7,level:'beginner', title:'ஒ ஓ ஔ',
      description:'c x z — all 12 vowels now known', focusKeys:[...C_HR,'c','x','z'],targetWPM:14,
      generateContent(){ return wKeybr(pool(C_HR,V_O),pool(C_HR,[...V_A,...V_I,...V_U,...V_E]),120); } },
    { id:'b08',order:8,level:'beginner', title:'் புள்ளி',
      description:'f — consonant endings க் ப் ம் ...', focusKeys:[PU,...C_HR,'a','q'],targetWPM:14,
      generateContent(){ const pp=C_HR.map(c=>[c,PU]); return [...intro(pp),...keybr([...pp,...pp,...pp,...pool(C_HR,V_A)],55)]; } },
    { id:'b09',order:9,level:'beginner', title:'ல வ',
      description:'n v — extremely common', focusKeys:['n','v',PU,'a','q','s'],targetWPM:14,
      generateContent(){ const np=[...pool(['n','v'],[...V_A,...V_I]),['n',PU],['v',PU]]; return [...intro(np),...wKeybr(np,pool(C_HR,V_A,true),45)]; } },
    { id:'b10',order:10,level:'beginner', title:'ற ன',
      description:'u i — common word endings', focusKeys:['u','i',PU,'a','q'],targetWPM:14,
      generateContent(){ const np=[...pool(['u','i'],V_A),['u',PU],['i',PU]]; return [...intro(np),...wKeybr(np,[...pool(['n','v'],V_A,true),...pool(C_HR,V_A,true)],45)]; } },
    { id:'b11',order:11,level:'beginner', title:'ட ண',
      description:'o p — retroflex consonants', focusKeys:['o','p',PU,'a','q'],targetWPM:14,
      generateContent(){ const np=[...pool(['o','p'],[...V_A,...V_I]),['o',PU],['p',PU]]; return [...intro(np),...wKeybr(np,pool([...C_HR,...C_LV,...C_RN],V_A,true),40)]; } },
    { id:'b12',order:12,level:'beginner', title:'ச ஞ ங ள ழ',
      description:'[ ] b y / — final consonants', focusKeys:['[',']','b','y','/',PU,'a','q'],targetWPM:14,
      generateContent(){ const nc=[...C_CH,...C_REST]; const np=[...pool(nc,V_A),...nc.map(c=>[c,PU])]; return wKeybr(np,pool([...C_HR,...C_LV,...C_RN,...C_OPN],V_A,true),110); } },

    // ── உயிர்மெய் series — all 216 forms ──
    { id:'b13',order:13,level:'beginner', title:'உயிர்மெய் — க ப ம',
      description:'க கா கி கீ கு கூ கெ கே கை கொ கோ கௌ க் ...',
      focusKeys:['h','j','k',PU,...V_ALL],targetWPM:16,
      generateContent(){ return [...uyirMeiAll(['h','j','k']),...keybr(pool(['h','j','k'],V_ALL,true),35)]; } },
    { id:'b14',order:14,level:'beginner', title:'உயிர்மெய் — த ந ய',
      description:'த தா தி தீ ... ந நா நி ... ய யா யி ...',
      focusKeys:['l',';',"'",PU,...V_ALL],targetWPM:16,
      generateContent(){ return [...uyirMeiAll(['l',';',"'"]),...keybr(pool(['l',';',"'"],V_ALL,true),35)]; } },
    { id:'b15',order:15,level:'beginner', title:'உயிர்மெய் — ல வ ற',
      description:'ல லா லி ... வ வா வி ... ற றா றி ...',
      focusKeys:['n','v','u',PU,...V_ALL],targetWPM:16,
      generateContent(){ return [...uyirMeiAll(['n','v','u']),...keybr(pool(['n','v','u'],V_ALL,true),35)]; } },
    { id:'b16',order:16,level:'beginner', title:'உயிர்மெய் — ன ட ண ர',
      description:'ன னா னி ... ட டா டி ... ண ணா ... ர ரா ...',
      focusKeys:['i','o','p','m',PU,...V_ALL],targetWPM:16,
      generateContent(){ return [...uyirMeiAll(['i','o','p','m']),...keybr(pool(['i','o','p','m'],V_ALL,true),30)]; } },
    { id:'b17',order:17,level:'beginner', title:'உயிர்மெய் — ச ஞ ங ள ழ',
      description:'ச சா சி ... ஞ ஞா ... ங ங்கா ... ள ளா ... ழ ழா ...',
      focusKeys:['[',']','b','y','/',PU,...V_ALL],targetWPM:16,
      generateContent(){ return uyirMeiAll(['[',']','b','y','/']); } },

    { id:'b18',order:18,level:'beginner', title:'Common Words I',
      description:'அம்மா · அப்பா · நல்ல · வீடு · கல்',
      focusKeys:[...C_HR,...C_LV,PU,'a','q','s'],targetWPM:20,
      generateContent(){ return wordGen([...W1,...W2],22); } },
    { id:'b19',order:19,level:'beginner', title:'Common Words II',
      description:'கவி · வலி · நாடு · வாழ் · மலர்',
      focusKeys:[...C_HR,...C_LV,PU,...V_A,...V_I],targetWPM:22,
      generateContent(){ return wordGen([...W2,...W3],22); } },
    { id:'b20',order:20,level:'beginner', title:'Beginner — Final',
      description:'Full keyboard at speed', focusKeys:[...V_ALL,...C_ALL,PU],targetWPM:22,
      generateContent(){ return keybr(pool(C_ALL,V_ALL,true),130); } },
  ],

  intermediate: [
    { id:'i01',order:1,level:'intermediate', title:'க × 12 Vowels',
      description:'க் கா கி கீ கு கூ கெ கே கை கொ கோ கௌ at pace',
      focusKeys:['h',PU,...V_ALL],targetWPM:22,
      generateContent(){ return keybr(pool(['h'],V_ALL,true),130); } },
    { id:'i02',order:2,level:'intermediate', title:'ப × 12 Vowels',
      description:'ப் பா பி பீ பு பூ ...', focusKeys:['j',PU,...V_ALL],targetWPM:22,
      generateContent(){ return wKeybr(pool(['j'],V_ALL,true),pool(['h'],V_ALL,true),130); } },
    { id:'i03',order:3,level:'intermediate', title:'ம த × 12 Vowels',
      description:'ம் மா மி ... த் தா தி ...', focusKeys:['k','l',PU,...V_ALL],targetWPM:24,
      generateContent(){ return wKeybr(pool(['k','l'],V_ALL,true),pool(['h','j'],V_ALL,true),130); } },
    { id:'i04',order:4,level:'intermediate', title:'ந ய ல வ × 12 Vowels',
      description:'ந் நா நி ... ல் லா ... வ் வா ...', focusKeys:[';',"'",'n','v',PU,...V_ALL],targetWPM:24,
      generateContent(){ return wKeybr(pool([';',"'",'n','v'],V_ALL,true),pool(['h','j','k','l'],V_ALL,true),130); } },
    { id:'i05',order:5,level:'intermediate', title:'ற ன ட ண × 12 Vowels',
      description:'ற றா றி ... ன னா ... ட டா ... ண ணா ...', focusKeys:['u','i','o','p',PU,...V_ALL],targetWPM:24,
      generateContent(){ return wKeybr(pool(['u','i','o','p'],V_ALL,true),pool([...C_HR,...C_LV],V_ALL,true),130); } },
    { id:'i06',order:6,level:'intermediate', title:'Words — Speed I',
      description:'Common Tamil words at 26 WPM', focusKeys:[...C_HR,...C_LV,PU,...V_ALL],targetWPM:26,
      generateContent(){ return wordGen([...W1,...W2,...W3],28); } },
    { id:'i07',order:7,level:'intermediate', title:'Words — Speed II',
      description:'Complex words at 28 WPM', focusKeys:[...C_HR,...C_LV,...C_RN,PU,...V_ALL],targetWPM:28,
      generateContent(){ return [...wordGen([...W2,...W3],10),sp,...keybr(pool([...C_HR,...C_LV,...C_RN],[...V_A,...V_I,...V_U],true),80)]; } },
    { id:'i08',order:8,level:'intermediate', title:'Intermediate — Speed',
      description:'All patterns — 30 WPM target', focusKeys:[...C_HR,...C_LV,...C_RN,PU,...V_ALL],targetWPM:30,
      generateContent(){ return keybr(pool([...C_HR,...C_LV,...C_RN],V_ALL,true),130); } },
  ],

  advanced: [
    { id:'a01',order:1,level:'advanced', title:'Grantha — ஸ ஷ ஜ ஹ',
      description:'Shift+Q W E R', focusKeys:['Q','W','E','R',PU,...V_A],targetWPM:26,
      generateContent(){ return wKeybr(pool(['Q','W','E','R'],[...V_A,...V_I],true),pool(C_HR,V_A,true),120); } },
    { id:'a02',order:2,level:'advanced', title:'ஃ Ayutha Ezhuthu',
      description:'Shift+F — unique aspirate', focusKeys:['F',...C_HR],targetWPM:28,
      generateContent(){ const np=C_HR.map(c=>['F',c]); return [...intro(np),...wKeybr(np,pool(C_HR,V_A,true),55)]; } },
    { id:'a03',order:3,level:'advanced', title:'Speed Drill I',
      description:'Home row + all vowels — 32 WPM', focusKeys:[...C_HR,...C_LV,...V_ALL,PU],targetWPM:32,
      generateContent(){ return keybr(pool([...C_HR,...C_LV],V_ALL,true),130); } },
    { id:'a04',order:4,level:'advanced', title:'Speed Drill II',
      description:'Full keyboard — 36 WPM', focusKeys:[...C_ALL,PU,...V_ALL],targetWPM:36,
      generateContent(){ return keybr(pool(C_ALL,V_ALL,true),130); } },
    { id:'a05',order:5,level:'advanced', title:'Marathon',
      description:'Every character — 38 WPM', focusKeys:[...V_ALL,...C_ALL,PU,'Q','W','E','R'],targetWPM:38,
      generateContent(){ return keybr([...pool(C_ALL,V_ALL,true),...pool(['Q','W','E','R'],[...V_A,...V_I],true)],130); } },
    { id:'a06',order:6,level:'advanced', title:'Tamil Text Speed',
      description:'Complex sequences — 40 WPM peak', focusKeys:[...C_HR,...C_LV,...C_RN,PU,...V_ALL],targetWPM:40,
      generateContent(){
        const syl=pool([...C_HR,...C_LV,...C_RN],V_ALL,true); const out=[];
        for(let i=0;i<18;i++){
          if(i%4===3){out.push(...W3[ri(W3.length)],sp);}
          else{const wl=2+ri(3);for(let j=0;j<wl;j++)out.push(...syl[ri(syl.length)]);out.push(sp);}
        }
        while(out.length&&out[out.length-1]===sp)out.pop(); return out;
      } },
  ],
};

export const ALL_LESSONS = [...LESSONS_DB.beginner,...LESSONS_DB.intermediate,...LESSONS_DB.advanced];
export function getLessonById(id)            { return ALL_LESSONS.find(l=>l.id===id)??null; }
export function getNextLesson(id)            { const i=ALL_LESSONS.findIndex(l=>l.id===id); return i>=0&&i<ALL_LESSONS.length-1?ALL_LESSONS[i+1]:null; }
export function getPrevLesson(id)            { const i=ALL_LESSONS.findIndex(l=>l.id===id); return i>0?ALL_LESSONS[i-1]:null; }
export function getLessonIndex(id)           { return ALL_LESSONS.findIndex(l=>l.id===id); }
export function getFirstIncomplete(done=[]){ return ALL_LESSONS.find(l=>!done.includes(l.id))??ALL_LESSONS[0]; }