/**
 * thirukkural.js
 *
 * Key fixes this iteration:
 * 1. Word-count line split: first kural line = first 4 words, second line = remaining 3.
 *    Does NOT rely on API's line1/line2 which can vary — counts whitespace-delimited words.
 * 2. Kural typing area height updates when view mode changes.
 * 3. Timer pauses on blur (accumulated in elapsedMs).
 * 4. NFC normalization fixes கோ/கொ/கௌ.
 * 5. Any-key SVG flash + shift handling.
 * 6. Title bar updates on kural load.
 */

import { MAPPING } from './mapping.js';
import { showHint, flashCorrect, flashWrong, flashKeyPress,
         setShiftActive, clearHints } from './keyboard.js';
import { storage } from './storage.js';

/* ── Syllable engine (identical to practice.js) ──── */
const T99={a:'அ',q:'ஆ',s:'இ',w:'ஈ',d:'உ',e:'ஊ',g:'எ',t:'ஏ',r:'ஐ',c:'ஒ',x:'ஓ',z:'ஔ',f:'்',h:'க',b:'ங','[':'ச',']':'ஞ',o:'ட',p:'ண',l:'த',';':'ந',i:'ன',j:'ப',k:'ம',"'":'ய',m:'ர',n:'ல',v:'வ','/':'ழ',y:'ள',u:'ற',Q:'ஸ',W:'ஷ',E:'ஜ',R:'ஹ',F:'ஃ'};
const MATRA={q:'ா',s:'ி',w:'ீ',d:'ு',e:'ூ',g:'ெ',t:'ே',r:'ை',c:'ொ',x:'ோ',z:'ௌ'};
const SYL_CONS=new Set(['h','j','k','l',';',"'",'n','v','u','i','o','p','[',']','b','y','/','m','Q','W','E','R','F']);
const SYL_VOW=new Set(['q','s','w','d','e','g','t','r','c','x','z','f']);
const VOWEL_TYPE={q:'right',s:'top',w:'top',d:'bottom',e:'bottom',g:'left',t:'left',r:'right',c:'left',x:'left',z:'right',f:'dot'};

function composedForm(c,v){return(T99[c]??c)+(v==='f'?'்':(MATRA[v]??''));}

function buildSyls(keys){
  const syls=[],map=new Array(keys.length);let i=0;
  while(i<keys.length){
    const k=keys[i],si=syls.length;
    if(k===' '){syls.push({keys:[' '],isSpace:true,start:i});map[i]=si;i++;}
    else if(SYL_CONS.has(k)&&i+1<keys.length&&SYL_VOW.has(keys[i+1])){
      const v=keys[i+1];
      syls.push({keys:[k,v],start:i,composed:composedForm(k,v),vtype:VOWEL_TYPE[v]??'right'});
      map[i]=si;map[i+1]=si;i+=2;
    }else{
      syls.push({keys:[k],display:T99[k]??k,start:i});map[i]=si;i++;
    }
  }
  return{syls,map};
}

function createSylSpan(syl,si){
  const span=document.createElement('span');
  if(syl.isSpace){span.className='char space-char';span.dataset.si=si;span.textContent='·';return span;}
  if(syl.keys.length===2){span.className='char char-syl';span.dataset.si=si;span.dataset.vtype=syl.vtype;span.textContent=syl.composed;return span;}
  span.className='char';span.dataset.si=si;span.textContent=syl.display;return span;
}

function setSylState(span,state,hadError){
  if(!span)return;
  span.classList.remove('current','syl-partial','incorrect','correct','corrected','pop');
  if(state==='current')span.classList.add('current');
  else if(state==='partial')span.classList.add('syl-partial');
  else if(state==='correct'){span.classList.add(hadError?'corrected':'correct','pop');setTimeout(()=>span.classList.remove('pop'),220);}
  else if(state==='incorrect')span.classList.add('incorrect');
}

/* ── NFC Tamil → Tamil99 ─────────────────────────
   MUST use NFC not NFD: கோ (U+0BCB) stays as one codepoint in NFC.
   NFD splits it to ே+ா → wrong key mapping. */
const CHAR_TO_KEY=(()=>{
  const map={};
  for(const[key,char]of Object.entries(MAPPING))
    if(char&&typeof char==='string')for(const cp of char){if(!map[cp])map[cp]=key;}
  Object.assign(map,{
    'அ':'a','ஆ':'q','இ':'s','ஈ':'w','உ':'d','ஊ':'e','எ':'g','ஏ':'t','ஐ':'r','ஒ':'c','ஓ':'x','ஔ':'z',
    'ா':'q','ி':'s','ீ':'w','ு':'d','ூ':'e','ெ':'g','ே':'t','ை':'r',
    'ொ':'c','ோ':'x','ௌ':'z',   // NFC precomposed
    '்':'f',
    'க':'h','ங':'b','ச':'[','ஞ':']','ட':'o','ண':'p','த':'l','ந':';','ன':'i','ப':'j','ம':'k','ய':"'",
    'ர':'m','ல':'n','வ':'v','ழ':'/','ள':'y','ற':'u','ஸ':'Q','ஷ':'W','ஜ':'E','ஹ':'R','ஃ':'F',
    // Tamil accounting symbols
    '௹':'A','௳':'Z','௴':'X','௵':'C','௶':'V','௷':'B','௸':'D','௺':'S',
  });
  return map;
})();

function tamilToKeys(text){
  const keys=[];
  for(const ch of text.normalize('NFC')){
    if(ch===' '||ch==='\n'||ch==='\u00a0'){if(keys.length&&keys[keys.length-1]!==' ')keys.push(' ');}
    else{const k=CHAR_TO_KEY[ch];if(k!==undefined)keys.push(k);}
  }
  while(keys.length&&keys[keys.length-1]===' ')keys.pop();
  return keys;
}

/**
 * splitKuralWords — splits a full kural text (7 words) into [line1, line2]
 * by word count: first 4 words → line1, remaining → line2.
 * This is robust against API formatting variations.
 */
function splitKuralWords(fullText) {
  const words = fullText.trim().split(/\s+/).filter(Boolean);
  const line1 = words.slice(0, 4).join(' ');
  const line2 = words.slice(4).join(' ');
  return { line1, line2 };
}

/* ── API ─────────────────────────────────────────── */
const API='https://tamil-kural-api.vercel.app/api/kural';
const FALLBACK=[
  {number:1,fullText:'அகர முதல எழுத்தெல்லாம் ஆதி பகவன் முதற்றே உலகு',urai:'எழுத்துக்கள் எல்லாவற்றிற்கும் அகரம் முதலாக இருப்பது போல உலகிற்கு கடவுளே ஆதி காரணமாக இருக்கிறான்',uraiSource:'முவா',english:'As A is the first of all letters, so the eternal God is first in the world.',chapter:'கடவுள் வாழ்த்து',chapterGroup:'அறத்துப்பால்'},
  {number:390,fullText:'கற்க கசடறக் கற்பவை கற்றபின் நிற்க அதற்குத் தக',urai:'கற்கத்தக்கவற்றை குற்றமறக் கற்க; கற்ற பிறகு அதற்குத் தக நடக்க',uraiSource:'முவா',english:'Learn thoroughly what is worth learning; then live accordingly.',chapter:'கல்வி',chapterGroup:'பொருட்பால்'},
];

async function fetchKural(num){
  const n=num??(Math.floor(Math.random()*1330)+1);
  try{
    const res=await fetch(`${API}/${n}`);if(!res.ok)throw new Error(`HTTP ${res.status}`);
    const data=await res.json();
    const lines=data.kural??[];
    const clean=s=>(s??'').trim().replace(/[.।]$/,'').trim();
    // Combine both lines, then split by word count
    const fullText=(clean(lines[0])+' '+clean(lines[1])).trim();
    // Track urai source for attribution label in the divider
    const rawMuVa = data.meaning?.ta_mu_va;
    const rawTa   = data.meaning?.ta ?? '';
    // .slice(7) removes "முவா :" prefix (7 Tamil chars) from Mu.Va. source only
    const urai = rawMuVa ? clean(rawMuVa).slice(7) : clean(rawTa);
    const uraiSource = rawMuVa ? 'முவா' : rawTa ? '' : '';
    return{
      number:data.number??n,
      fullText,
      urai,
      uraiSource,
      english:(data.meaning?.en??'').trim(),
      chapter:(data.chapter??'').trim(),
      chapterGroup:(data.section??'').trim(),
    };
  }catch(err){
    console.warn('[Thirukkural]',err.message);
    return FALLBACK[Math.floor(Math.random()*FALLBACK.length)];
  }
}

/* ── State ───────────────────────────────────────── */
const TS={
  content:[],line1End:0,kuralEnd:0,
  pointer:0,totalKeys:0,correctKeys:0,
  startTime:null,pausedAt:null,elapsedMs:0,
  timerInt:null,hintTimeout:null,finished:false,
  kural:null,syllables:[],sylMap:[],sylErrors:{},
};
const HINT_DELAY=2000;
const $=id=>document.getElementById(id);

function calcWpm(){
  if(!TS.startTime||TS.correctKeys<3)return 0;
  const ms=(Date.now()-TS.startTime)+TS.elapsedMs;
  return ms/60000<0.05?0:Math.round((TS.correctKeys/5)/(ms/60000));
}

/* ── Metadata ─────────────────────────────────────── */
function renderMeta(k){
  const el=$('kural-meta');if(!el)return;
  el.innerHTML=`<div class="km-top"><span class="km-num">${k.number}</span>${k.chapterGroup?`<span class="km-book">${k.chapterGroup}</span>`:''} ${k.chapterGroup&&k.chapter?'<span class="km-arrow">›</span>':''} ${k.chapter?`<span class="km-chapter">${k.chapter}</span>`:''}</div>${k.english?`<p class="km-english">${k.english}</p>`:''}`;
}

/* ── Load ────────────────────────────────────────── */
export async function loadKural(num){
  _clearTimers();
  const meta=$('kural-meta');if(meta)meta.innerHTML='<div class="kc-loading">குறள் ஏற்றுகிறது…</div>';
  $('kural-result')?.classList.add('hidden');
  const inp=$('kural-num-input');if(inp)inp.disabled=true;
  const k=await fetchKural(num);TS.kural=k;
  if(inp){inp.value=k.number;inp.disabled=false;}
  renderMeta(k);

  // Update shared lesson-title-bar
  const titleEl=$('lesson-title-bar');
  if(titleEl)titleEl.textContent=`குறள் ${k.number}${k.chapter?' — '+k.chapter:''}`;

  _startTyping(k);
}

function _startTyping(k){
  _clearTimers();
  // Split full kural text into 4-word line1 and 3-word line2
  const{line1,line2}=splitKuralWords(k.fullText);
  const l1Keys=tamilToKeys(line1);
  const l2Keys=tamilToKeys(line2);
  const uraiKeys=k.urai?tamilToKeys(k.urai):[];
  const kuralKeys=[...l1Keys,...l2Keys];
  const content=uraiKeys.length?[...kuralKeys,' ',...uraiKeys]:kuralKeys;

  if(!content.length){
    const box=$('kural-container');
    if(box)box.innerHTML='<span style="color:var(--fg-3)">இந்த குறளை தட்டச்சு செய்ய முடியவில்லை</span>';
    return;
  }

  Object.assign(TS,{
    content,
    line1End:l1Keys.length,      // key index at start of line2 (after line1)
    kuralEnd:kuralKeys.length,   // key index at start of urai
    pointer:0,totalKeys:0,correctKeys:0,
    startTime:null,pausedAt:null,elapsedMs:0,finished:false,
    syllables:[],sylMap:[],sylErrors:{},
  });

  _renderChars();_resetStats();
  $('kural-focus-overlay')?.classList.remove('hidden');
  setTimeout(()=>{$('kural-typing-area')?.focus();_handleFocus();},80);
}

/* ── Render chars — structured kural display ──────────
   Structure:
     <div class="kural-line-row">  ← line1 (4 words, nowrap, overflow hidden)
     <div class="kural-line-row">  ← line2 (3 words, nowrap, overflow hidden)
     <div class="kural-divider">
     <div class="kural-urai-row">  ← urai (wrapping, smaller font)

   Each .kural-line-row is display:flex;flex-wrap:nowrap so its words
   NEVER wrap to a second line regardless of font size.
   The .kural-urai-row is display:flex;flex-wrap:wrap for flowing urai text.
*/
function _renderChars(){
  const box=$('kural-container');if(!box)return;box.innerHTML='';
  const{syls,map}=buildSyls(TS.content);
  TS.syllables=syls;TS.sylMap=map;TS.sylErrors={};

  // Syllable index boundaries
  const line2SylStart = TS.line1End>0 && TS.line1End<TS.content.length ? map[TS.line1End] : -1;
  const uraiSylStart  = TS.kuralEnd<TS.content.length ? map[TS.kuralEnd] : -1;

  // Determine section for each syllable index
  function sectionOf(si){
    if(uraiSylStart>=0 && si>=uraiSylStart) return 'urai';
    if(line2SylStart>=0 && si>=line2SylStart) return 'line2';
    return 'line1';
  }

  // Build three row containers
  const row1=document.createElement('div');row1.className='kural-line-row kural-row-1';
  const row2=document.createElement('div');row2.className='kural-line-row kural-row-2';
  const rowU=document.createElement('div');rowU.className='kural-urai-row';
  // const divider=document.createElement('div');divider.className='kural-divider';

  // Distribute syllables into rows using word spans
  const rows={line1:row1,line2:row2,urai:rowU};
  const currentWords={line1:null,line2:null,urai:null};

  function getWord(sec){
    if(!currentWords[sec]){
      const w=document.createElement('span');w.className='word';
      currentWords[sec]=w;
    }
    return currentWords[sec];
  }
  function flushWord(sec){
    const w=currentWords[sec];
    if(w&&w.children.length){rows[sec].appendChild(w);currentWords[sec]=null;}
  }

  syls.forEach((syl,si)=>{
    const sec=sectionOf(si);
    const span=createSylSpan(syl,si);
    if(syl.isSpace){
      getWord(sec).appendChild(span);
      flushWord(sec);
    }else{
      getWord(sec).appendChild(span);
    }
  });
  // Flush any remaining partial words
  ['line1','line2','urai'].forEach(sec=>flushWord(sec));

  // Assemble into box
  box.appendChild(row1);
  if(row2.children.length) box.appendChild(row2);
  if(rowU.children.length){
    // Show urai attribution label above the dashed divider line
    const uraiLabel = document.createElement('div');
    uraiLabel.className = 'kural-urai-label';
    const src = TS.kural?.uraiSource;
    uraiLabel.textContent = src ? src + ' உரை' : 'உரை';
    box.appendChild(uraiLabel);
    // box.appendChild(divider);
    box.appendChild(rowU);
  }

  const first=box.querySelector('[data-si="0"]');if(first)first.classList.add('current');
  _resetScroll();
  // Expand width to fit content — must run after DOM is in document
  // so scrollWidth returns the real rendered width
  requestAnimationFrame(_adjustWidth);
}

/**
 * _adjustWidth()
 * ──────────────
 * The kural line rows (flex, nowrap) can be wider than the 860px
 * max-width parent container. CSS alone cannot break out of a flex
 * parent's max-width constraint, so we measure the actual rendered
 * scrollWidth of the widest row and explicitly set the typing area
 * and its wrapper to that width.
 *
 * This runs in a requestAnimationFrame after _renderChars() so that
 * the browser has already laid out the DOM and scrollWidth is accurate.
 */
/** Exported so applyViewMode in practice.js can trigger a re-measure after zoom changes. */
export function adjustKuralWidth() { _adjustWidth(); }

function _adjustWidth() {
  const area    = $('kural-typing-area');
  const wrapper = $('kural-typing-wrapper');
  const box     = $('kural-container');
  const row1    = box?.querySelector('.kural-row-1');
  const row2    = box?.querySelector('.kural-row-2');
  const rowU    = box?.querySelector('.kural-urai-row');
  if (!area || !wrapper) return;

  // Reset previous overrides so we measure the natural (parent-constrained) width
  area.style.width    = '';
  wrapper.style.width = '';
  if (rowU) rowU.style.width = '';

  // Natural width = rendered width constrained by parent max-width (e.g. 860px)
  const natural = area.offsetWidth;

  // scrollWidth of each kural line row = full content width including overflow
  const w1 = row1 ? row1.scrollWidth : 0;
  const w2 = row2 ? row2.scrollWidth : 0;
  const needed = Math.max(w1, w2);

  if (needed > natural) {
    // Expand area and wrapper so kural lines are fully visible
    const px = needed + 'px';
    area.style.width    = px;
    wrapper.style.width = px;

    // Give urai the same width as the kural lines so it can
    // use the full expanded space for wrapping.
    // The container width is NOT driven by urai because urai has
    // explicit width set here — it won't push the container wider.
    if (rowU) rowU.style.width = needed + 'px';
  }
}

function _sylSpan(si){return $('kural-container').querySelector(`[data-si="${si}"]`);}

let _lineY=-1;
function _scrollToSyl(si){
  const area=$('kural-typing-area'),span=_sylSpan(si);if(!span)return;
  const y=span.offsetTop;
  if(_lineY<0){_lineY=y;area.scrollTop=0;return;}
  if(y>_lineY){area.scrollTop=Math.max(0,area.scrollTop+(y-_lineY));_lineY=y;}
}
function _resetScroll(){_lineY=-1;const a=$('kural-typing-area');if(a)a.scrollTop=0;}

/* ── Keydown / keyup ──────────────────────────────── */
function _onKeyDown(e){
  if(TS.finished)return;
  if(e.key==='Shift'){setShiftActive(true);return;}
  if(e.key.length>1&&e.key!==' '){e.preventDefault();return;}
  e.preventDefault();
  const expected=TS.content[TS.pointer],pressed=e.key;
  if(!TS.startTime&&!TS.pausedAt)_startTimer();
  else if(TS.pausedAt)_resumeTimer();
  TS.totalKeys++;_cancelHint();
  flashKeyPress(pressed);
  if(pressed===expected)_correct();else _wrong(pressed,expected);
  const wpmEl=$('kural-wpm'),accEl=$('kural-acc');
  if(wpmEl)wpmEl.textContent=calcWpm();
  if(accEl)accEl.textContent=TS.totalKeys?Math.round((TS.correctKeys/TS.totalKeys)*100)+'%':'100%';
}

function _onKeyUp(e){if(e.key==='Shift')setShiftActive(false);}

function _correct(){
  const prevSi=TS.sylMap[TS.pointer],prevSyl=TS.syllables[prevSi],prevSpan=_sylSpan(prevSi);
  flashCorrect(TS.content[TS.pointer]);TS.correctKeys++;TS.pointer++;
  const done=TS.pointer-prevSyl.start;
  if(done>=prevSyl.keys.length){setSylState(prevSpan,'correct',!!TS.sylErrors[prevSi]);}
  else{setSylState(prevSpan,'partial',false);clearTimeout(TS.hintTimeout);showHint(TS.content[TS.pointer]);return;}
  if(TS.pointer>=TS.content.length){_finish();return;}
  const newSi=TS.sylMap[TS.pointer];
  if(newSi!==TS.sylMap[TS.pointer-1]){setSylState(_sylSpan(newSi),'current',false);_scrollToSyl(newSi);}
  const pct=Math.round((TS.pointer/TS.content.length)*100);
  const pf=$('kural-progress-fill'),pt=$('kural-progress-txt');
  if(pf)pf.style.width=pct+'%';
  if(pt)pt.textContent=`${TS.pointer} / ${TS.content.length}`;
  _scheduleHint();
}

function _wrong(pressed,expected){
  const si=TS.sylMap[TS.pointer];TS.sylErrors[si]=true;
  const span=_sylSpan(si);
  if(span){span.classList.add('incorrect','shake');setTimeout(()=>span.classList.remove('shake'),300);}
  flashWrong(pressed,expected);_immediateHint(expected);
}

function _scheduleHint(){clearTimeout(TS.hintTimeout);if(TS.pointer>=TS.content.length)return;TS.hintTimeout=setTimeout(()=>showHint(TS.content[TS.pointer]),HINT_DELAY);}
function _cancelHint(){clearTimeout(TS.hintTimeout);}
function _immediateHint(k){clearTimeout(TS.hintTimeout);showHint(k);}

/* ── Timer — pauses on blur ─────────────────────── */
function _startTimer(){
  TS.startTime=Date.now();TS.pausedAt=null;
  TS.timerInt=setInterval(()=>{
    const ms=(Date.now()-TS.startTime)+TS.elapsedMs;
    const s=Math.round(ms/1000);
    const el=$('kural-time');if(el)el.textContent=`${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;
    storage.addDailySeconds(1);
  },1000);
}
function _pauseTimer(){
  if(!TS.startTime||TS.pausedAt||TS.finished)return;
  TS.pausedAt=Date.now();TS.elapsedMs+=(TS.pausedAt-TS.startTime);TS.startTime=null;
  clearInterval(TS.timerInt);
}
function _resumeTimer(){
  if(!TS.pausedAt||TS.finished)return;
  TS.pausedAt=null;TS.startTime=Date.now();
  TS.timerInt=setInterval(()=>{
    const ms=(Date.now()-TS.startTime)+TS.elapsedMs;
    const s=Math.round(ms/1000);
    const el=$('kural-time');if(el)el.textContent=`${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;
    storage.addDailySeconds(1);
  },1000);
}
function _clearTimers(){clearInterval(TS.timerInt);clearTimeout(TS.hintTimeout);}

function _resetStats(){
  const w=$('kural-wpm'),a=$('kural-acc'),t=$('kural-time'),pf=$('kural-progress-fill'),pt=$('kural-progress-txt');
  if(w)w.textContent='0';if(a)a.textContent='100%';if(t)t.textContent='0:00';
  if(pf)pf.style.width='0%';if(pt)pt.textContent=`0 / ${TS.content.length}`;
}

function _finish(){
  TS.finished=true;_clearTimers();clearHints();setShiftActive(false);
  const wpm=calcWpm();
  const totalMs=TS.elapsedMs+(TS.startTime?Date.now()-TS.startTime:0);
  const acc=TS.totalKeys?Math.round((TS.correctKeys/TS.totalKeys)*100):100;
  const secs=Math.round(totalMs/1000),m=Math.floor(secs/60),ss=(secs%60).toString().padStart(2,'0');
  const stars=wpm>=30?3:wpm>=20?2:wpm>=10?1:0;
  const msg=stars>=3?'நன்று! Excellent!':stars>=2?'நல்லது! Well done!':stars>=1?'தொடர்க! Keep going!':'மீண்டும் முயற்சி!';
  storage.recordResult(`kural-${TS.kural.number}`,wpm,acc,TS.totalKeys,TS.correctKeys);
  const el=$('kural-result');if(!el)return;
  el.innerHTML=`<div class="kr-inner"><div class="kr-left"><div class="kr-msg">${msg}</div><div class="kr-stars">${'★'.repeat(stars)}${'☆'.repeat(3-stars)}</div></div><div class="kr-grid"><div class="kr-cell"><span class="kr-val">${wpm}</span><span class="kr-lbl">WPM</span></div><div class="kr-cell"><span class="kr-val">${acc}%</span><span class="kr-lbl">Accuracy</span></div><div class="kr-cell"><span class="kr-val">${m}:${ss}</span><span class="kr-lbl">Time</span></div></div></div>`;
  el.classList.remove('hidden');el.scrollIntoView({behavior:'smooth',block:'nearest'});
}

function _handleFocus(){
  $('kural-focus-overlay')?.classList.add('hidden');
  if(TS.pausedAt)_resumeTimer();
  _scheduleHint();
}
function _handleBlur(){
  $('kural-focus-overlay')?.classList.remove('hidden');
  _cancelHint();setShiftActive(false);
  if(TS.startTime&&!TS.finished)_pauseTimer();
}

export function initKural(){
  const ta=$('kural-typing-area');if(!ta)return;
  ta.addEventListener('keydown',_onKeyDown);
  ta.addEventListener('keyup',_onKeyUp);
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
  window.addEventListener('kural-tab-activated', () => {
    // Called every time user switches to kural tab.
    // We set the title TWICE: immediately (synchronous) and in the next rAF.
    // The rAF catches any synchronous overwrite that happens after this event
    // (e.g. applyViewMode or other title-setting code that may fire after dispatch).
    function _applyKuralTitle() {
      const el = document.getElementById('lesson-title-bar');
      if (el && TS.kural) {
        el.textContent = `குறள் ${TS.kural.number}${TS.kural.chapter ? ' — ' + TS.kural.chapter : ''}`;
      }
    }
    if (!TS.kural) {
      loadKural(null); // loadKural sets title internally via renderMeta
    } else {
      _applyKuralTitle();    // immediate
      ta.focus();
      requestAnimationFrame(_applyKuralTitle); // safety net — overrides any sync rewrite
    }
  });
}