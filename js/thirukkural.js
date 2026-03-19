/**
 * thirukkural.js — Thirukkural typing practice
 *
 * • Keyboard: shared SVG moved to #kural-kb-slot by tab switch in practice.js
 * • Hints bar: hidden — keyboard is the visual assistant
 * • Typing area: open (no box/border), windowed scroll same as practice tab
 * • Syllable rendering: same CV-pair engine as practice tab
 */

import { MAPPING, tamilOf, hintLabel, needsShift } from './mapping.js';
import { showHint, flashCorrect, flashWrong, clearHints } from './keyboard.js';
import { storage } from './storage.js';

/* ═══ Syllable engine (identical to practice.js) ════════════════ */
const T99 = {
  a:'அ',q:'ஆ',s:'இ',w:'ஈ',d:'உ',e:'ஊ',
  g:'எ',t:'ஏ',r:'ஐ',c:'ஒ',x:'ஓ',z:'ஔ',f:'்',
  h:'க',b:'ங','[':'ச',']':'ஞ',o:'ட',p:'ண',
  l:'த',';':'ந',i:'ன',j:'ப',k:'ம',"'":'ய',
  m:'ர',n:'ல',v:'வ','/':'ழ',y:'ள',u:'ற',
  Q:'ஸ',W:'ஷ',E:'ஜ',R:'ஹ',F:'ஃ',
};
const SYL_CONS = new Set(['h','j','k','l',';',"'",'n','v','u','i','o','p','[',']','b','y','/','m','Q','W','E','R','F']);
const SYL_VOW  = new Set(['q','s','w','d','e','g','t','r','c','x','z','f']);
const MATRA    = {q:'ா',s:'ி',w:'ீ',d:'ு',e:'ூ',g:'ெ',t:'ே',r:'ை',c:'ொ',x:'ோ',z:'ௌ'};
function composeSyl(c,v){ return (T99[c]??c)+(v==='f'?'்':(MATRA[v]??'')); }
function buildSyls(keys){
  const syls=[],map=new Array(keys.length);let i=0;
  while(i<keys.length){const k=keys[i],si=syls.length;
    if(k===' '){syls.push({keys:[' '],display:'·',start:i,isSpace:true});map[i]=si;i++;}
    else if(SYL_CONS.has(k)&&i+1<keys.length&&SYL_VOW.has(keys[i+1])){
      syls.push({keys:[k,keys[i+1]],display:composeSyl(k,keys[i+1]),start:i});map[i]=si;map[i+1]=si;i+=2;}
    else{syls.push({keys:[k],display:T99[k]??k,start:i});map[i]=si;i++;}
  }
  return{syls,map};
}

/* ═══ Unicode → Tamil99 keys ════════════════════════════════════ */
const CHAR_TO_KEY=(()=>{
  const map={};
  for(const[key,char]of Object.entries(MAPPING))
    if(char&&typeof char==='string')for(const cp of char){if(!map[cp])map[cp]=key;}
  Object.assign(map,{
    'அ':'a','ஆ':'q','இ':'s','ஈ':'w','உ':'d','ஊ':'e','எ':'g','ஏ':'t','ஐ':'r','ஒ':'c','ஓ':'x','ஔ':'z',
    'ா':'q','ி':'s','ீ':'w','ு':'d','ூ':'e','ெ':'g','ே':'t','ை':'r','ொ':'c','ோ':'x','ௌ':'z','்':'f',
    'க':'h','ங':'b','ச':'[','ஞ':']','ட':'o','ண':'p','த':'l','ந':';','ன':'i','ப':'j','ம':'k','ய':"'",
    'ர':'m','ல':'n','வ':'v','ழ':'/','ள':'y','ற':'u','ஸ':'Q','ஷ':'W','ஜ':'E','ஹ':'R','ஃ':'F',
  });
  return map;
})();

function tamilToKeys(text){
  const keys=[];
  for(const ch of text.normalize('NFD')){
    if(ch===' '||ch==='\n'||ch==='\u00a0'){if(keys.length&&keys[keys.length-1]!==' ')keys.push(' ');}
    else{const k=CHAR_TO_KEY[ch];if(k!==undefined)keys.push(k);}
  }
  while(keys.length&&keys[keys.length-1]===' ')keys.pop();
  return keys;
}

/* ═══ API ════════════════════════════════════════════════════════ */
const API='https://tamil-kural-api.vercel.app/api/kural';
const FALLBACK=[
  {number:1,line1:'அகர முதல எழுத்தெல்லாம் ஆதி',line2:'பகவன் முதற்றே உலகு',
   urai:'எழுத்துக்கள் எல்லாவற்றிற்கும் அகரம் முதலாக இருப்பது போல உலகிற்கு கடவுளே ஆதி காரணமாக இருக்கிறான்',
   english:'As A is the first of all letters, so the eternal God is first in the world.',
   chapter:'கடவுள் வாழ்த்து',chapterGroup:'அறத்துப்பால்'},
  {number:390,line1:'கற்க கசடறக் கற்பவை கற்றபின்',line2:'நிற்க அதற்குத் தக',
   urai:'கற்கத்தக்கவற்றை குற்றமறக் கற்க; கற்ற பிறகு அதற்குத் தக நடக்க',
   english:'Learn thoroughly what is worth learning; then live accordingly.',
   chapter:'கல்வி',chapterGroup:'பொருட்பால்'},
];

async function fetchKural(num){
  const n=num??(Math.floor(Math.random()*1330)+1);
  try{
    const res=await fetch(`${API}/${n}`);
    if(!res.ok)throw new Error(`HTTP ${res.status}`);
    const data=await res.json(),lines=data.kural??[];
    const clean=s=>(s??'').trim().replace(/[.।]$/,'').trim();
    return{number:data.number??n,line1:clean(lines[0]),line2:clean(lines[1]),
           urai:clean(data.meaning?.ta_mu_va??data.meaning?.ta??''),
           english:(data.meaning?.en??'').trim(),chapter:(data.chapter??'').trim(),chapterGroup:(data.section??'').trim()};
  }catch(err){
    console.warn('[Thirukkural] API error, using fallback:',err.message);
    return FALLBACK[Math.floor(Math.random()*FALLBACK.length)];
  }
}

/* ═══ State ════════════════════════════════════════════════════════ */
const TS={
  content:[],kuralEnd:0,pointer:0,totalKeys:0,correctKeys:0,
  hadErrorHere:false,startTime:null,timerInt:null,hintTimeout:null,
  finished:false,kural:null,syllables:[],sylMap:[],sylErrors:{},
};
const HINT_DELAY=2000;
const $=id=>document.getElementById(id);

function calcWpm(){
  if(!TS.startTime||TS.correctKeys<3)return 0;
  const mins=(Date.now()-TS.startTime)/60000;
  return mins<0.05?0:Math.round((TS.correctKeys/5)/mins);
}

/* ═══ Metadata strip ════════════════════════════════════════════ */
function renderMeta(k){
  const el=$('kural-meta');if(!el)return;
  el.innerHTML=`
    <div class="km-top">
      <span class="km-num">${k.number}</span>
      ${k.chapterGroup?`<span class="km-book">${k.chapterGroup}</span>`:''}
      ${k.chapterGroup&&k.chapter?`<span class="km-arrow">›</span>`:''}
      ${k.chapter?`<span class="km-chapter">${k.chapter}</span>`:''}
    </div>
    ${k.english?`<p class="km-english">${k.english}</p>`:''}`;
}

/* ═══ Load + start ══════════════════════════════════════════════ */
export async function loadKural(num){
  _clearTimers();
  $('kural-meta').innerHTML='<div class="kc-loading">குறள் ஏற்றுகிறது…</div>';
  $('kural-result')?.classList.add('hidden');
  const inp=$('kural-num-input');if(inp)inp.disabled=true;
  const k=await fetchKural(num);TS.kural=k;
  if(inp){inp.value=k.number;inp.disabled=false;}
  renderMeta(k);_startTyping(k);
}

function _startTyping(k){
  _clearTimers();
  const kuralKeys=tamilToKeys(k.line1+' '+k.line2);
  const uraiKeys=k.urai?tamilToKeys(k.urai):[];
  const content=uraiKeys.length?[...kuralKeys,' ',...uraiKeys]:kuralKeys;
  if(!content.length){$('kural-container').innerHTML='<span style="color:var(--fg-3);font-size:.85rem">இந்த குறளை தட்டச்சு செய்ய முடியவில்லை</span>';return;}
  Object.assign(TS,{content,kuralEnd:kuralKeys.length,pointer:0,totalKeys:0,correctKeys:0,
    hadErrorHere:false,startTime:null,finished:false,syllables:[],sylMap:[],sylErrors:{}});
  _renderChars();_resetStats();
  $('kural-focus-overlay')?.classList.remove('hidden');
  setTimeout(()=>{$('kural-typing-area')?.focus();_handleFocus();},80);
}

/* ═══ Render chars ══════════════════════════════════════════════ */
function _renderChars(){
  const box=$('kural-container');if(!box)return;
  box.innerHTML='';
  const{syls,map}=buildSyls(TS.content);
  TS.syllables=syls;TS.sylMap=map;TS.sylErrors={};
  const uraiSylStart=TS.kuralEnd<TS.content.length?map[TS.kuralEnd]:-1;
  syls.forEach((syl,si)=>{
    if(si===uraiSylStart){const d=document.createElement('div');d.className='kural-divider';box.appendChild(d);}
    const span=document.createElement('span');
    span.className='char'+(syl.isSpace?' space-char':'');
    span.dataset.si=si;span.dataset.display=syl.display;span.textContent=syl.display;
    if(si===0)span.classList.add('current');
    box.appendChild(span);
  });
  _resetScroll();
}

/* ── Windowed scroll — same logic as practice.js ── */
let _lineY=-1;
function _scrollToSyl(si){
  const area=$('kural-typing-area');
  const span=$('kural-container').querySelector(`[data-si="${si}"]`);
  if(!span)return;
  const y=span.offsetTop;
  if(_lineY<0){_lineY=y;area.scrollTop=0;return;}
  if(y>_lineY){area.scrollTop=Math.max(0,area.scrollTop+(y-_lineY));_lineY=y;}
}
function _resetScroll(){_lineY=-1;const a=$('kural-typing-area');if(a)a.scrollTop=0;}

/* ═══ Keydown ════════════════════════════════════════════════════ */
function _onKeyDown(e){
  if(TS.finished)return;
  if(e.key.length>1&&e.key!==' '){e.preventDefault();return;}
  e.preventDefault();
  const expected=TS.content[TS.pointer],pressed=e.key;
  if(!TS.startTime)_startTimer();
  TS.totalKeys++;_cancelHint();
  if(pressed===expected)_correct();else _wrong(pressed,expected);
  $('kural-wpm').textContent=calcWpm();
  $('kural-acc').textContent=TS.totalKeys?Math.round((TS.correctKeys/TS.totalKeys)*100)+'%':'100%';
}

function _sylSpan(si){return $('kural-container').querySelector(`[data-si="${si}"]`);}

function _correct(){
  const prevSi=TS.sylMap[TS.pointer],prevSyl=TS.syllables[prevSi],prevSpan=_sylSpan(prevSi);
  flashCorrect(TS.content[TS.pointer]);
  TS.correctKeys++;TS.pointer++;
  if(prevSpan){
    const done=TS.pointer-prevSyl.start;
    if(done>=prevSyl.keys.length){
      prevSpan.classList.remove('current','syl-partial','incorrect');
      prevSpan.classList.add(TS.sylErrors[prevSi]?'corrected':'correct','pop');
      setTimeout(()=>prevSpan.classList.remove('pop'),220);
    }else{
      prevSpan.classList.remove('current','incorrect');
      prevSpan.classList.add('syl-partial');
      // Show vowel key on keyboard immediately
      clearTimeout(TS.hintTimeout);
      showHint(TS.content[TS.pointer]);
      return;
    }
  }
  if(TS.pointer>=TS.content.length){_finish();return;}
  const newSi=TS.sylMap[TS.pointer];
  if(newSi!==TS.sylMap[TS.pointer-1]){
    const ns=_sylSpan(newSi);if(ns)ns.classList.add('current');
    _scrollToSyl(newSi);
  }
  const pct=Math.round((TS.pointer/TS.content.length)*100);
  if($('kural-progress-fill'))$('kural-progress-fill').style.width=pct+'%';
  if($('kural-progress-txt'))$('kural-progress-txt').textContent=`${TS.pointer} / ${TS.content.length}`;
  _scheduleHint();
}

function _wrong(pressed,expected){
  const si=TS.sylMap[TS.pointer];TS.sylErrors[si]=true;
  const span=_sylSpan(si);
  if(span){span.classList.add('incorrect','shake');setTimeout(()=>span.classList.remove('shake'),300);}
  flashWrong(pressed,expected);_immediateHint(expected);
}

/* ═══ Hints (keyboard only, no text bar) ════════════════════════ */
function _scheduleHint(){clearTimeout(TS.hintTimeout);if(TS.pointer>=TS.content.length)return;TS.hintTimeout=setTimeout(()=>showHint(TS.content[TS.pointer]),HINT_DELAY);}
function _cancelHint(){clearTimeout(TS.hintTimeout);}
function _immediateHint(key){clearTimeout(TS.hintTimeout);showHint(key);}

/* ═══ Timer ════════════════════════════════════════════════════════ */
function _startTimer(){
  TS.startTime=Date.now();
  TS.timerInt=setInterval(()=>{
    const secs=Math.round((Date.now()-TS.startTime)/1000);
    $('kural-time').textContent=`${Math.floor(secs/60)}:${(secs%60).toString().padStart(2,'0')}`;
    storage.addDailySeconds(1);
  },1000);
}
function _clearTimers(){clearInterval(TS.timerInt);clearTimeout(TS.hintTimeout);}

function _resetStats(){
  $('kural-wpm').textContent='0';$('kural-acc').textContent='100%';$('kural-time').textContent='0:00';
  if($('kural-progress-fill'))$('kural-progress-fill').style.width='0%';
  if($('kural-progress-txt'))$('kural-progress-txt').textContent=`0 / ${TS.content.length}`;
}

/* ═══ Finish ════════════════════════════════════════════════════ */
function _finish(){
  TS.finished=true;_clearTimers();clearHints();
  const wpm=calcWpm(),acc=TS.totalKeys?Math.round((TS.correctKeys/TS.totalKeys)*100):100;
  const secs=TS.startTime?Math.round((Date.now()-TS.startTime)/1000):0;
  const m=Math.floor(secs/60),s=(secs%60).toString().padStart(2,'0');
  const stars=wpm>=30?3:wpm>=20?2:wpm>=10?1:0;
  const msg=stars>=3?'நன்று! Excellent!':stars>=2?'நல்லது! Well done!':stars>=1?'தொடர்க! Keep going!':'மீண்டும் முயற்சி!';
  storage.recordResult(`kural-${TS.kural.number}`,wpm,acc,TS.totalKeys,TS.correctKeys);
  const el=$('kural-result');if(!el)return;
  el.innerHTML=`<div class="kr-inner"><div class="kr-left"><div class="kr-msg">${msg}</div><div class="kr-stars">${'★'.repeat(stars)}${'☆'.repeat(3-stars)}</div></div><div class="kr-grid"><div class="kr-cell"><span class="kr-val">${wpm}</span><span class="kr-lbl">WPM</span></div><div class="kr-cell"><span class="kr-val">${acc}%</span><span class="kr-lbl">Accuracy</span></div><div class="kr-cell"><span class="kr-val">${m}:${s}</span><span class="kr-lbl">Time</span></div></div></div>`;
  el.classList.remove('hidden');
  el.scrollIntoView({behavior:'smooth',block:'nearest'});
}

/* ═══ Focus / blur ══════════════════════════════════════════════ */
function _handleFocus(){$('kural-focus-overlay')?.classList.add('hidden');_scheduleHint();}
function _handleBlur(){$('kural-focus-overlay')?.classList.remove('hidden');_cancelHint();clearHints();}

/* ═══ Init ══════════════════════════════════════════════════════ */
export function initKural(){
  const ta=$('kural-typing-area');if(!ta)return;
  ta.addEventListener('keydown',_onKeyDown);
  ta.addEventListener('focus',_handleFocus);
  ta.addEventListener('blur',_handleBlur);
  $('kural-focus-overlay')?.addEventListener('click',()=>ta.focus());
  $('btn-random-kural')?.addEventListener('click',()=>loadKural(null));
  $('btn-retry-kural')?.addEventListener('click',()=>{$('kural-result')?.classList.add('hidden');if(TS.kural)_startTyping(TS.kural);});
  const inp=$('kural-num-input');
  const go=()=>{const n=parseInt(inp?.value,10);if(n>=1&&n<=1330)loadKural(n);else if(inp)inp.value=TS.kural?.number??'';};
  inp?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();go();}});
  inp?.addEventListener('blur',go);
  $('btn-go-kural')?.addEventListener('click',go);
  window.addEventListener('kural-tab-activated',()=>{
    if(!TS.kural)loadKural(null);else ta.focus();
  });
}