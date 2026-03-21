/**
 * lessons.js — 34 lessons.
 * Uyirmei coverage: all 18 consonants × 12 vowels = 216 forms
 * (ங and ஞ only get 2 forms: standalone + pulli).
 * Each lesson ≤ 100 keystrokes. Math.random for variety.
 */

const sp = ' ';
const PU = 'f';
const ri = n => Math.floor(Math.random() * n);

function pool(cons, vows, wp) {
  const o = [];
  for (const c of cons) {
    for (const v of vows) o.push([c, v]);
    if (wp) o.push([c, PU]);
  }
  return o;
}

function keybr(syls, chars) {
  if (!syls.length) return [];
  const out = []; let n = 0, lastW = null;
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
    lastW = ws; out.push(...word, sp); n += word.length + 1;
  }
  while (out.length && out[out.length - 1] === sp) out.pop();
  return out;
}

function wKeybr(np, rp, chars) {
  return keybr([...np,...np,...np,...np,...np,...np,...np,...rp,...rp,...rp], chars);
}

// intro: each syl ×2 then space, + 6 two-syl combos (to keep size small)
function intro(syl) {
  const sh = [...syl].sort(() => Math.random() - 0.5);
  const out = [];
  for (const s of sh) { out.push(...s, ...s, sp); }
  for (let w = 0; w < 6; w++)
    out.push(...syl[ri(syl.length)], ...syl[ri(syl.length)], sp);
  return out;
}

// uyirmeiAll: 2 cons × 12 vowels, groups of 3
function uyirmeiAll(cons, vows) {
  vows = vows || V_ALL;
  const sc = [...cons].sort(() => Math.random() - 0.5);
  const vg = [];
  for (let i = 0; i < vows.length; i += 3) vg.push(vows.slice(i, i + 3));
  const out = [];
  for (const c of sc) {
    const vgs = [...vg].sort(() => Math.random() - 0.5);
    for (const grp of vgs) { for (const v of grp) out.push(c, v); out.push(sp); }
  }
  return out;
}

function wordGen(words, count) {
  const out = [];
  for (let i = 0; i < count; i++) out.push(...words[ri(words.length)], sp);
  while (out.length && out[out.length - 1] === sp) out.pop();
  return out;
}

const V_A=['a','q'],V_I=['s','w'],V_U=['d','e'],V_E=['g','t','r'],V_O=['c','x','z'];
const V_ALL=[...V_A,...V_I,...V_U,...V_E,...V_O];
const C_HR=['h','j','k','l',';',"'"],C_LV=['n','v'],C_RN=['u','i'];
const C_OPN=['o','p'],C_CH=['[',']'],C_REST=['b','y','/'];
const C_ALL=[...C_HR,...C_LV,...C_RN,...C_OPN,...C_CH,...C_REST];

const W1=[['h','q'],['j','q'],['k','q'],['l','q'],[';','q'],['v','q'],['h','n',PU],['k','n',PU],['v','n',PU],['j','n',PU],[';','n',PU,'n','a'],['h','n',PU,'n','a'],['h','v','s'],['k','l','s'],['v','n','s'],['l','n','a']];
const W2=[['a','k',PU,'k','q'],['a','j',PU,'j','q'],['h','j',PU,'j','q'],[';','n',PU,'n','a'],['v','w','o','d'],[';','q','o','d'],['k','n','a','u',PU],[';','q','k',PU],['l','k',PU],['h','q','n','a'],['k','q','k',PU],['v','q','/',PU]];
const W3=[[';','w','u',PU],['s','n',PU,'n','q'],['h','u',PU,'u','a','l','d'],['k','a','p',PU],['h','k','n','a'],[';','n','a','n',PU],['k','l','a','l',PU],['v','n',PU,'n','a']];

export const LESSONS_DB = {
  beginner: [
    { id:'b01',order:1,level:'beginner',title:'க ப',description:'h j + அ ஆ',focusKeys:['h','j','a','q'],targetWPM:10,
      generateContent(){ const p=pool(['h','j'],V_A); return [...intro(p),...keybr(p,40)]; } },
    { id:'b02',order:2,level:'beginner',title:'ம த ந ய',description:"k l ; ' home row",focusKeys:['k','l',';',"'",'a','q'],targetWPM:10,
      generateContent(){ const np=pool(['k','l',';',"'"],V_A); return [...intro(np),...wKeybr(np,pool(['h','j'],V_A),18)]; } },
    { id:'b03',order:3,level:'beginner',title:'Home Row Speed',description:'All 6 home consonants × அ ஆ',focusKeys:[...C_HR,'a','q'],targetWPM:12,
      generateContent(){ return keybr(pool(C_HR,V_A),90); } },
    { id:'b04',order:4,level:'beginner',title:'இ ஈ',description:'s w — left ring',focusKeys:[...C_HR,'s','w'],targetWPM:12,
      generateContent(){ const np=pool(C_HR,V_I); return [...intro(np),...wKeybr(np,pool(C_HR,V_A),2)]; } },
    { id:'b05',order:5,level:'beginner',title:'உ ஊ',description:'d e — left middle',focusKeys:[...C_HR,'d','e'],targetWPM:12,
      generateContent(){ const np=pool(C_HR,V_U); return [...intro(np),...wKeybr(np,pool(C_HR,[...V_A,...V_I]),2)]; } },
    { id:'b06',order:6,level:'beginner',title:'எ ஏ ஐ',description:'g t r — left index',focusKeys:[...C_HR,'g','t','r'],targetWPM:14,
      generateContent(){ return wKeybr(pool(C_HR,V_E),pool(C_HR,[...V_A,...V_I,...V_U]),90); } },
    { id:'b07',order:7,level:'beginner',title:'ஒ ஓ ஔ',description:'c x z — all 12 vowels',focusKeys:[...C_HR,'c','x','z'],targetWPM:14,
      generateContent(){ return wKeybr(pool(C_HR,V_O),pool(C_HR,[...V_A,...V_I,...V_U,...V_E]),90); } },
    { id:'b08',order:8,level:'beginner',title:'் புள்ளி',description:'f — க் ப் ம் ...',focusKeys:[PU,...C_HR,'a','q'],targetWPM:14,
      generateContent(){ const pp=C_HR.map(c=>[c,PU]); return [...intro(pp),...keybr([...pp,...pp,...pp,...pool(C_HR,V_A)],28)]; } },
    { id:'b09',order:9,level:'beginner',title:'ல வ',description:'n v — very common',focusKeys:['n','v',PU,'a','q','s'],targetWPM:14,
      generateContent(){ const np=[...pool(['n','v'],[...V_A,...V_I]),['n',PU],['v',PU]]; return intro(np); } },
    { id:'b10',order:10,level:'beginner',title:'ற ன',description:'u i — word endings',focusKeys:['u','i',PU,'a','q'],targetWPM:14,
      generateContent(){ const np=[...pool(['u','i'],V_A),['u',PU],['i',PU]]; return [...intro(np),...wKeybr(np,[...pool(['n','v'],V_A,true),...pool(C_HR,V_A,true)],26)]; } },
    { id:'b11',order:11,level:'beginner',title:'ட ண',description:'o p — retroflex',focusKeys:['o','p',PU,'a','q'],targetWPM:14,
      generateContent(){ const np=[...pool(['o','p'],[...V_A,...V_I]),['o',PU],['p',PU]]; return [...intro(np),...wKeybr(np,pool([...C_HR,...C_LV,...C_RN],V_A,true),16)]; } },
    { id:'b12',order:12,level:'beginner',title:'ச ஞ ங ள ழ',description:'[ ] b y / — remaining',focusKeys:['[',']','b','y','/',PU,'a','q'],targetWPM:14,
      generateContent(){ const nc=[...C_CH,...C_REST]; const np=[...pool(nc,V_A),...nc.map(c=>[c,PU])]; return wKeybr(np,pool([...C_HR,...C_LV,...C_RN,...C_OPN],V_A,true),78); } },

    // ── உயிர்மெய் series — covers all 216 forms ──────────────────
    // uyirmeiAll(2cons) ≈ 56 keys + keybr(28) ≈ 84 total ✓
    { id:'b13',order:13,level:'beginner',title:'உயிர்மெய் — க ப',
      description:'க கா கி கீ கு கூ கெ கே கை கொ கோ கௌ ... ப பா ...',
      focusKeys:['h','j',PU,...V_ALL],targetWPM:16,
      generateContent(){ return [...uyirmeiAll(['h','j']),...keybr(pool(['h','j'],V_ALL),26)]; } },
    { id:'b14',order:14,level:'beginner',title:'உயிர்மெய் — ம த',
      description:'ம மா மி மீ ... த தா தி தீ ...',
      focusKeys:['k','l',PU,...V_ALL],targetWPM:16,
      generateContent(){ return [...uyirmeiAll(['k','l']),...keybr(pool(['k','l'],V_ALL),26)]; } },
    { id:'b15',order:15,level:'beginner',title:'உயிர்மெய் — ந ய',
      description:'ந நா நி நீ ... ய யா யி யீ ...',
      focusKeys:[';',"'",PU,...V_ALL],targetWPM:16,
      generateContent(){ return [...uyirmeiAll([';',"'"]),...keybr(pool([';',"'"],V_ALL),26)]; } },
    { id:'b16',order:16,level:'beginner',title:'உயிர்மெய் — ல வ',
      description:'ல லா லி லீ ... வ வா வி வீ ...',
      focusKeys:['n','v',PU,...V_ALL],targetWPM:16,
      generateContent(){ return [...uyirmeiAll(['n','v']),...keybr(pool(['n','v'],V_ALL),26)]; } },
    { id:'b17',order:17,level:'beginner',title:'உயிர்மெய் — ற ன',
      description:'ற றா றி றீ ... ன னா னி னீ ...',
      focusKeys:['u','i',PU,...V_ALL],targetWPM:16,
      generateContent(){ return [...uyirmeiAll(['u','i']),...keybr(pool(['u','i'],V_ALL),26)]; } },

    { id:'b18',order:18,level:'beginner',title:'Common Words I',description:'அம்மா · நல்ல · வீடு · கல்',focusKeys:[...C_HR,...C_LV,PU,'a','q','s'],targetWPM:20,
      generateContent(){ return wordGen([...W1,...W2],19); } },
    { id:'b19',order:19,level:'beginner',title:'Common Words II',description:'கவி · வலி · நாடு · வாழ் · மலர்',focusKeys:[...C_HR,...C_LV,PU,...V_A,...V_I],targetWPM:22,
      generateContent(){ return wordGen([...W2,...W3],17); } },
    { id:'b20',order:20,level:'beginner',title:'Beginner — Final',description:'Full keyboard at speed',focusKeys:[...V_ALL,...C_ALL,PU],targetWPM:22,
      generateContent(){ return keybr(pool(C_ALL,V_ALL,true),90); } },
  ],

  intermediate: [
    { id:'i01',order:1,level:'intermediate',title:'உயிர்மெய் — ட ண',
      description:'ட டா டி டீ ... ண ணா ணி ணீ ...',focusKeys:['o','p',PU,...V_ALL],targetWPM:20,
      generateContent(){ return [...uyirmeiAll(['o','p']),...keybr(pool(['o','p'],V_ALL),26)]; } },
    { id:'i02',order:2,level:'intermediate',title:'உயிர்மெய் — ச ர',
      description:'ச சா சி சீ ... ர ரா ரி ரீ ...',focusKeys:['[','m',PU,...V_ALL],targetWPM:20,
      generateContent(){ return [...uyirmeiAll(['[','m']),...keybr(pool(['[','m'],V_ALL),26)]; } },
    { id:'i03',order:3,level:'intermediate',title:'உயிர்மெய் — ள ழ',
      description:'ள ளா ளி ளீ ... ழ ழா ழி ழீ ...',focusKeys:['y','/',PU,...V_ALL],targetWPM:20,
      generateContent(){ return [...uyirmeiAll(['y','/']),...keybr(pool(['y','/'],V_ALL),26)]; } },
    { id:'i04',order:4,level:'intermediate',title:'உயிர்மெய் — ங ஞ',
      description:'ங ங் · ஞ ஞ் + full uyirmei review',focusKeys:['b',']',PU,...V_A,...C_HR],targetWPM:20,
      generateContent(){
        const out=[['b','a'],['b',PU],[']','a'],[']',PU]].flatMap(f=>[...f,sp]);
        return [...out,...keybr(pool([...C_HR,...C_LV,...C_RN],V_A,true),62)];
      } },
    { id:'i05',order:5,level:'intermediate',title:'All Uyirmei Speed',description:'All 18 cons × 12 vowels at pace',focusKeys:[...C_ALL,PU,...V_ALL],targetWPM:24,
      generateContent(){ return keybr(pool(C_ALL,V_ALL,true),90); } },
    { id:'i06',order:6,level:'intermediate',title:'Words — Speed I',description:'Common Tamil words at 26 WPM',focusKeys:[...C_HR,...C_LV,PU,...V_ALL],targetWPM:26,
      generateContent(){ return wordGen([...W1,...W2,...W3],18); } },
    { id:'i07',order:7,level:'intermediate',title:'Words — Speed II',description:'Complex words at 28 WPM',focusKeys:[...C_HR,...C_LV,...C_RN,PU,...V_ALL],targetWPM:28,
      generateContent(){ return [...wordGen([...W2,...W3],7),sp,...keybr(pool([...C_HR,...C_LV,...C_RN],[...V_A,...V_I,...V_U],true),52)]; } },
    { id:'i08',order:8,level:'intermediate',title:'Intermediate Speed',description:'All patterns — 30 WPM',focusKeys:[...C_HR,...C_LV,...C_RN,PU,...V_ALL],targetWPM:30,
      generateContent(){ return keybr(pool([...C_HR,...C_LV,...C_RN],V_ALL,true),90); } },
  ],

  advanced: [
    { id:'a01',order:1,level:'advanced',title:'Grantha — ஸ ஷ ஜ ஹ',description:'Shift+Q W E R',focusKeys:['Q','W','E','R',PU,...V_A],targetWPM:26,
      generateContent(){ return wKeybr(pool(['Q','W','E','R'],[...V_A,...V_I],true),pool(C_HR,V_A,true),88); } },
    { id:'a02',order:2,level:'advanced',title:'ஃ Ayutha Ezhuthu',description:'Shift+F',focusKeys:['F',...C_HR],targetWPM:28,
      generateContent(){ const np=C_HR.map(c=>['F',c]); return [...intro(np),...wKeybr(np,pool(C_HR,V_A,true),32)]; } },
    { id:'a03',order:3,level:'advanced',title:'Speed Drill I',description:'Home row + all vowels — 32 WPM',focusKeys:[...C_HR,...C_LV,...V_ALL,PU],targetWPM:32,
      generateContent(){ return keybr(pool([...C_HR,...C_LV],V_ALL,true),90); } },
    { id:'a04',order:4,level:'advanced',title:'Speed Drill II',description:'Full keyboard — 36 WPM',focusKeys:[...C_ALL,PU,...V_ALL],targetWPM:36,
      generateContent(){ return keybr(pool(C_ALL,V_ALL,true),90); } },
    { id:'a05',order:5,level:'advanced',title:'Marathon',description:'Every character — 38 WPM',focusKeys:[...V_ALL,...C_ALL,PU,'Q','W','E','R'],targetWPM:38,
      generateContent(){ return keybr([...pool(C_ALL,V_ALL,true),...pool(['Q','W','E','R'],[...V_A,...V_I],true)],90); } },
    { id:'a06',order:6,level:'advanced',title:'Tamil Text Speed',description:'Complex sequences — 40 WPM',focusKeys:[...C_HR,...C_LV,...C_RN,PU,...V_ALL],targetWPM:40,
      generateContent(){
        const syl=pool([...C_HR,...C_LV,...C_RN],V_ALL,true);const out=[];
        for(let i=0;i<12;i++){if(i%4===3)out.push(...W3[ri(W3.length)],sp);else{const wl=2+ri(3);for(let j=0;j<wl;j++)out.push(...syl[ri(syl.length)]);out.push(sp);}}
        while(out.length&&out[out.length-1]===sp)out.pop();return out;
      } },
  ],
};

export const ALL_LESSONS=[...LESSONS_DB.beginner,...LESSONS_DB.intermediate,...LESSONS_DB.advanced];
export function getLessonById(id)          { return ALL_LESSONS.find(l=>l.id===id)??null; }
export function getNextLesson(id)          { const i=ALL_LESSONS.findIndex(l=>l.id===id);return i>=0&&i<ALL_LESSONS.length-1?ALL_LESSONS[i+1]:null; }
export function getPrevLesson(id)          { const i=ALL_LESSONS.findIndex(l=>l.id===id);return i>0?ALL_LESSONS[i-1]:null; }
export function getLessonIndex(id)         { return ALL_LESSONS.findIndex(l=>l.id===id); }
export function getFirstIncomplete(done=[]){ return ALL_LESSONS.find(l=>!done.includes(l.id))??ALL_LESSONS[0]; }