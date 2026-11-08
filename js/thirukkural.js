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

import { MAPPING, buildSyls, tamilToTypeableKeys, STANDALONE, MATRA, SYL_CONS, SYL_VOW, composedForm, tamilOf, hintLabel, needsShift } from './mapping.js';
import { showHint, flashCorrect, flashWrong, flashKeyPress,
         setShiftActive, clearHints } from './keyboard.js';
import { storage } from './storage.js';

/* ── Vowel-type map for syllable rendering (kural-specific) ──── */
const VOWEL_TYPE={q:'right',s:'top',w:'top',d:'bottom',e:'bottom',g:'left',t:'left',r:'right',c:'left',x:'left',z:'right',f:'dot'};

function createSylSpan(syl,si){
  const span=document.createElement('span');
  if(syl.isSpace){span.className='char space-char';span.dataset.si=si;span.textContent='·';return span;}
  if(syl.keys.length===2){span.className='char char-syl';span.dataset.si=si;span.dataset.vtype=VOWEL_TYPE[syl.keys[1]]??'right';span.textContent=syl.display;return span;}
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

/**
 * splitKuralWords — last-resort splitter used only when a verse has no
 * explicit line1/line2 (the API's data.kural[0]/[1] are always preferred,
 * because the 4+3 word rule is wrong for some verses).
 */
function splitKuralWords(fullText) {
  const words = fullText.trim().split(/\s+/).filter(Boolean);
  const line1 = words.slice(0, 4).join(' ');
  const line2 = words.slice(4).join(' ');
  return { line1, line2 };
}

/* ── API ─────────────────────────────────────────── */
const API='https://tamil-kural-api.vercel.app/api/kural';

/* ── Local fallback — 10 verses for offline / API timeout ──
   Text taken verbatim from the API; no ';' in urai (it would map to the ந key). */
const KURAL_FALLBACK = [
  { number: 1, line1: "அகர முதல எழுத்தெல்லாம் ஆதி", line2: "பகவன் முதற்றே உலகு", urai: "எழுத்துக்கள் எல்லாம் அகரத்தை அடிப்படையாக கொண்டிருக்கின்றன. அதுபோல உலகம் கடவுளை அடிப்படையாக கொண்டிருக்கிறது", english: "Just as the letter \"அ\" (A) Just as the letter 'A' is the first and foundation of all letters, Valluvar says that everything in the world begins from a fundamental source. Nothing exists or succeeds without a strong beginning.", chapter: "கடவுள் வாழ்த்து" },
  { number: 2, line1: "கற்றதனால் ஆய பயனென்கொல்", line2: "வாலறிவன் நற்றாள் தொழாஅர் எனின்", urai: "தூய அறிவு வடிவாக விளங்கும் இறைவனுடைய நல்ல திருவடிகளை தொழாமல் இருப்பாரானால், அவர் கற்ற கல்வியினால் ஆகிய பயன் என்ன?", english: "Valluvar asks what benefit learning brings if it does not lead a person toward true wisdom and understanding. Knowledge alone is not the final goal.", chapter: "கடவுள் வாழ்த்து" },
  { number: 391, line1: "கற்க கசடறக் கற்பவை கற்றபின்", line2: "நிற்க அதற்குத் தக", urai: "கல்வி கற்க நல்ல நூல்களைக் குற்றமறக் கற்க வேண்டும், அவ்வாறு கற்ற பிறகு, கற்ற கல்விக்கு தக்கவாறு நெறியில் நிற்க வேண்டும்", english: "Let a man learn thoroughly whatever he may learn, and let his conduct be worthy of his learning.", chapter: "கல்வி" },
  { number: 423, line1: "எப்பொருள் யார்யார்வாய்க் கேட்பினும் அப்பொருள்", line2: "மெய்ப்பொருள் காண்ப தறிவு", urai: "எப்பொருளை யார் யார் இடம் கேட்டாலும் (கேட்டவாறே கொள்ளாமல்) அப் பொருளின் மெய்யானப் பொருளைக் காண்பதே அறிவாகும்", english: "To discern the truth in every thing, by whomsoever spoken, is wisdom.", chapter: "அறிவுடைமை" },
  { number: 595, line1: "வெள்ளத் தனைய மலர்நீட்டம் மாந்தர்தம்", line2: "உள்ளத் தனையது உயர்வு", urai: "நீர்ப்பூக்களின் தாளின் நீளம் அவை நின்ற நீரின் அளவினவாகும், மக்களின் ஊக்கத்தை அளவினதாகும் வாழ்க்கையின் உயர்வு", english: "The stalks of water-flowers are proportionate to the depth of water; so is men’s greatness proportionate to their minds.", chapter: "ஊக்கம் உடைமை" },
  { number: 624, line1: "மடுத்தவா யெல்லாம் பகடன்னான் உற்ற", line2: "இடுக்கண் இடர்ப்பாடு உடைத்து", urai: "தடைபட்ட இடங்களில் எல்லாம் (வண்டியை இழுத்துச் செல்லும்) எருதுபோல் விடாமுயற்சி உடையவன் உற்றத் துன்பமே துன்பப்படுவதாகும்", english: "Troubles will vanish (i.e., will be troubled) before the man who (struggles against dificulties) as a buffalo (drawing a cart) through deep mire.", chapter: "இடுக்கண் அழியாமை" },
  { number: 703, line1: "குறிப்பிற் குறிப்புணர் வாரை உறுப்பினுள்", line2: "யாது கொடுத்தும் கொளல்", urai: "(முகம் கண் இவற்றின்) குறிப்புக்களால் உள்ள குறிப்பை உணர வல்லவரை நாட்டின் உறுப்புக்களுள் எதைக் கொடுத்தாவது துணையாக பெற்றுக்கொள்ள வேண்டும்", english: "The king should ever give whatever (is asked) of his belongings and secure him who, by the indications (of his own mind) is able to read those of another.", chapter: "குறிப்பறிதல்" },
  { number: 972, line1: "பிறப்பொக்கும் எல்லா உயிர்க்கும் சிறப்பொவ்வா", line2: "செய்தொழில் வேற்றுமை யான்", urai: "எல்லா உயிர்க்கும் பிறப்பு ஒருத் தன்மையானதே, ஆயினும் செய்கின்ற தொழில்களின் உயர்வு தாழ்வு வேறுபாடுகளால் சிறப்பியல்பு ஒத்திருப்பதில்லை", english: "All human beings agree as regards their birth but difer as regards their characteristics, because of the d ifferent qualities of their actions.", chapter: "பெருமை" },
  { number: 1090, line1: "உண்டார்கண் அல்லது அடுநறாக் காமம்போல்", line2: "கண்டார் மகிழ்செய்தல் இன்று", urai: "கள், தன்னை உண்டவரிடத்தில் அல்லாமல் காமத்தைப் போல் தன்னைக் கண்டவரிடத்தில் மயக்கத்தை உண்டாக்குவதில்லையே", english: "Unlike boiled honey which yields delight only when it is drunk, love give spleasure even when looked at.", chapter: "தகையணங்குறுத்தல்" },
  { number: 1330, line1: "ஊடுதல் காமத்திற்கு இன்பம் அதற்கின்பம்", line2: "கூடி முயங்கப் பெறின்", urai: "காமத்திற்கு இன்பம் தருவது ஊடுதல் ஆகும், ஊடல் முடிந்த பின் கூடித் தழுவப் பெற்றால் அந்த ஊடலுக்கு இன்பமாகும்", english: "Dislike adds delight to love; and a hearty embrace (thereafter) will add delight to dislike.", chapter: "ஊடலுவகை" },
];

function buildFallbackKural(n) {
  const found = KURAL_FALLBACK.find(k => k.number === n);
  const k = found || KURAL_FALLBACK[Math.floor(Math.random() * KURAL_FALLBACK.length)];
  return {
    number: k.number,
    line1: k.line1,
    line2: k.line2,
    fullText: k.line1 + ' ' + k.line2,
    urai: k.urai,
    uraiSource: '',
    english: k.english,
    chapter: k.chapter,
    chapterGroup: '',
    isFallback: true,
  };
}

/* The API returns chapter/section either as a plain string (older shape) or as
   { id, names: { ta, en } } (current shape). Normalise to a Tamil string. */
function nameOf(v){
  if(!v) return '';
  if(typeof v === 'string') return v.trim();
  return (v.names?.ta ?? v.names?.en ?? v.name ?? '').trim();
}

async function fetchKural(num){
  const n=num??(Math.floor(Math.random()*1330)+1);
  const controller=new AbortController();
  const timeoutId=setTimeout(()=>controller.abort(),5000);
  try{
    const res=await fetch(`${API}/${n}`,{signal:controller.signal});
    clearTimeout(timeoutId);
    if(!res.ok)throw new Error(`HTTP ${res.status}`);
    const data=await res.json();
    const lines=data.kural??[];
    const clean=s=>(s??'').trim().replace(/[.।]$/,'').trim();
    const line1=clean(lines[0]),line2=clean(lines[1]);
    const fullText=(line1+' '+line2).trim();
    // Track urai source for attribution label in the divider
    const rawMuVa = data.meaning?.ta_mu_va;
    const rawTa   = data.meaning?.ta ?? '';
    // The API does not emit a "முவா :" prefix; strip it defensively only if present.
    const muVa = rawMuVa ? clean(rawMuVa).replace(/^முவா\s*[:：]\s*/,'') : '';
    const urai = muVa || clean(rawTa);
    const uraiSource = muVa ? 'முவா' : '';
    return{
      number:data.number??n,
      line1,line2,
      fullText,
      urai,
      uraiSource,
      english:(data.meaning?.en??'').trim(),
      // BUG FIX: the API returns `chapter`/`section` as objects
      // ({id, names:{ta, en}}), not strings. Calling .trim() on them threw,
      // which sent EVERY request into the catch block — so the 1330-verse API
      // was never actually used and the 10-verse local fallback served
      // a random verse for every lookup. Handle both shapes.
      chapter:nameOf(data.chapter),
      chapterGroup:nameOf(data.section),
    };
  }catch(err){
    clearTimeout(timeoutId);
    console.warn('[Thirukkural] API failed, using fallback:',err.message);
    return buildFallbackKural(n);
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
  // Tamil: /3 to match practice.js (English /5 would under-report Tamil keystrokes)
  return ms/60000<0.05?0:Math.round((TS.correctKeys/3)/(ms/60000));
}

/* ── Metadata ─────────────────────────────────────── */
function renderMeta(k){
  const el=$('kural-meta');if(!el)return;
  // Build skeleton with innerHTML (no user data), then set textContent for API-sourced values
  el.innerHTML='';
  const top=document.createElement('div');top.className='km-top';
  const numSpan=document.createElement('span');numSpan.className='km-num';numSpan.textContent=k.number;
  top.appendChild(numSpan);
  if(k.chapterGroup){
    const bookSpan=document.createElement('span');bookSpan.className='km-book';bookSpan.textContent=k.chapterGroup;
    top.appendChild(document.createTextNode(' '));top.appendChild(bookSpan);
  }
  if(k.chapterGroup&&k.chapter){
    const arrow=document.createElement('span');arrow.className='km-arrow';arrow.textContent='›';
    top.appendChild(document.createTextNode(' '));top.appendChild(arrow);
  }
  if(k.chapter){
    const chapSpan=document.createElement('span');chapSpan.className='km-chapter';chapSpan.textContent=k.chapter;
    top.appendChild(document.createTextNode(' '));top.appendChild(chapSpan);
  }
  el.appendChild(top);
  if(k.english){
    const p=document.createElement('p');p.className='km-english';p.textContent=k.english;
    el.appendChild(p);
  }
  if(k.isFallback){
    const note=document.createElement('p');note.className='km-notice';
    note.style.cssText='font-size:.8em;color:var(--fg-3);margin:4px 0 0';
    note.textContent=(k.requested&&k.requested!==k.number)
      ?`குறள் ${k.requested} இப்போது கிடைக்கவில்லை · Verse ${k.requested} isn't available offline — showing saved verse ${k.number}`
      :'சேமித்த குறள் (இணைப்பு இல்லை) · Saved verse shown — offline or not available';
    el.appendChild(note);
  }
}

/* ── Load ────────────────────────────────────────── */
let loadGen=0;          // bumped on every loadKural(); stale responses are dropped
let loading=false;       // true while the newest loadKural() is in flight (also covers a rejected fetch)
let inflightNum=null;   // verse number currently being fetched (null = random / idle)
const _kuralTabActive=()=>{try{return sessionStorage.getItem('activeTab')==='kural';}catch{return false;}};

export async function loadKural(num){
  const myGen=++loadGen;
  loading=true;
  try{
    inflightNum=num??null;
    _clearTimers();
    const meta=$('kural-meta');if(meta)meta.innerHTML='<div class="kc-loading">குறள் ஏற்றுகிறது…</div>';
    $('kural-result')?.classList.add('hidden');
    const inp=$('kural-num-input');if(inp)inp.disabled=true;
    let k=await fetchKural(num);
    if(myGen!==loadGen)return; // a newer load superseded this one
    inflightNum=null;
    if(k.isFallback)k={...k,requested:num??null}; // copy: never mutate the shared fallback entry
    TS.kural=k;
    // Always show the verse actually served (may differ from the request on fallback)
    if(inp){inp.value=k.number;inp.disabled=false;}
    renderMeta(k);

    // Update shared lesson-title-bar (only while the kural tab is showing)
    const titleEl=$('lesson-title-bar');
    if(titleEl&&_kuralTabActive())titleEl.textContent=`குறள் ${k.number}${k.chapter?' — '+k.chapter:''}`;

    _startTyping(k);
  }finally{
    // Only the newest load clears the flag (a superseded load must not).
    if(myGen===loadGen)loading=false;
  }
}

function _startTyping(k){
  _clearTimers();
  // Use the API's own line split; fall back to the word-count rule only if absent
  const{line1,line2}=(k.line1&&k.line2)?{line1:k.line1,line2:k.line2}:splitKuralWords(k.fullText);
  const l1Keys=tamilToTypeableKeys(line1);
  const l2Keys=tamilToTypeableKeys(line2);
  const uraiKeys=k.urai?tamilToTypeableKeys(k.urai):[];
  // A space key joins the two lines so the typist is not forced to run them together
  const kuralKeys=l2Keys.length?[...l1Keys,' ',...l2Keys]:[...l1Keys];
  const content=uraiKeys.length?[...kuralKeys,' ',...uraiKeys]:kuralKeys;

  if(!content.length){
    const box=$('kural-container');
    if(box)box.innerHTML='<span style="color:var(--fg-3)">இந்த குறளை தட்டச்சு செய்ய முடியவில்லை</span>';
    return;
  }

  Object.assign(TS,{
    content,
    line1End:l2Keys.length?l1Keys.length+1:kuralKeys.length, // key index at start of line2 (after line1 + separator space)
    kuralEnd:uraiKeys.length?kuralKeys.length+1:kuralKeys.length, // key index at start of urai (after separator space)
    pointer:0,totalKeys:0,correctKeys:0,
    startTime:null,pausedAt:null,elapsedMs:0,finished:false,
    syllables:[],sylMap:[],sylErrors:{},
  });

  _renderChars();_resetStats();updateKuralHintBar();
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

  // Cap expansion at parent width to prevent horizontal overflow on #kural-main
  const parentW = wrapper.parentElement ? wrapper.parentElement.clientWidth : natural;
  const capped  = Math.min(needed, parentW);

  if (capped > natural) {
    const px = capped + 'px';
    area.style.width    = px;
    wrapper.style.width = px;
    if (rowU) rowU.style.width = capped + 'px';
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
  if(e.ctrlKey||e.metaKey||e.altKey)return;
  if(e.key==='Tab')return;
  if(e.repeat)return; // held-key autorepeat is not a keystroke
  if(e.key==='Escape'){document.getElementById('kural-num-input')?.focus();return;}
  if(e.key==='Shift'){setShiftActive(true);return;}
  if(/^F\d{1,2}$/.test(e.key))return;
  if(e.key.length>1&&e.key!==' '){e.preventDefault();return;}
  e.preventDefault();
  const expected=TS.content[TS.pointer],pressed=e.key;
  if(!TS.startTime&&!TS.pausedAt)_startTimer();
  else if(TS.pausedAt)_resumeTimer();
  TS.totalKeys++;_cancelHint();
  flashKeyPress(pressed);
  const ok=pressed===expected;
  if(ok)_correct();else _wrong(pressed,expected);
  // Per-key stats for the report tab (storage ignores ' ' by design)
  storage.recordKeypress(expected,ok,calcWpm());
  if(TS.finished)storage.flushKeyData();
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
    else{setSylState(prevSpan,'partial',false);clearTimeout(TS.hintTimeout);updateKuralHintBar();showHint(TS.content[TS.pointer]);return;}
  if(TS.pointer>=TS.content.length){
    const pf=$('kural-progress-fill'),pt=$('kural-progress-txt');
    if(pf)pf.style.width='100%';
    if(pt)pt.textContent=`${TS.pointer} / ${TS.content.length}`;
    _finish();return;
  }
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

function _scheduleHint(){clearTimeout(TS.hintTimeout);if(TS.pointer>=TS.content.length)return;updateKuralHintBar();TS.hintTimeout=setTimeout(()=>showHint(TS.content[TS.pointer]),HINT_DELAY);}
function _cancelHint(){clearTimeout(TS.hintTimeout);}
function _immediateHint(k){clearTimeout(TS.hintTimeout);updateKuralHintBar();showHint(k);}

/* ── Kural hint bar — mirrors practice.js updateHintBar() ── */
function updateKuralHintBar(){
  const guide=$('kural-key-guide');
  if(!guide)return;
  if(!storage.getSettings().showHints||TS.pointer>=TS.content.length){guide.innerHTML='';return;}
  const key=TS.content[TS.pointer],si=TS.sylMap?.[TS.pointer];
  const syl=si!==undefined?TS.syllables?.[si]:null;
  if(syl&&syl.keys.length===2){
    const done=TS.pointer-syl.start,k1=syl.keys[0],k2=syl.keys[1];
    guide.innerHTML=
      `<kbd class="hk ${done>0?'hk-done':'hk-next'}">${hintLabel(k1)}</kbd>`+
      `<span class="hk-sep">+</span>`+
      `<kbd class="hk ${done===0?'hk-dim':'hk-next'}">${hintLabel(k2)}</kbd>`+
      `<span class="hk-sep">→</span>`+
      `<span class="hk-char">${syl.display}</span>`+
      (needsShift(key)?`<span class="shift-badge">+ Shift</span>`:'');
  }else{
    const ch=key===' '?'·':(STANDALONE[key]??tamilOf(key));
    guide.innerHTML=
      `<span class="hk-label">press</span>`+
      `<kbd class="hk hk-next">${hintLabel(key)}</kbd>`+
      `<span class="hk-char">${ch}</span>`+
      (needsShift(key)?`<span class="shift-badge">+ Shift</span>`:'');
  }
}
function clearKuralHintBar(){const g=$('kural-key-guide');if(g)g.innerHTML='';}

/* ── Timer — pauses on blur ─────────────────────── */
/* Daily-goal seconds are batched (3s, like practice.js) to avoid a localStorage write every second */
let _dailyPending=0;
function _dailyTick(){if(++_dailyPending>=3)_flushDaily();}
function _flushDaily(){if(_dailyPending>0){storage.addDailySeconds(_dailyPending);_dailyPending=0;}}

function _startTimer(){
  clearInterval(TS.timerInt);
  TS.startTime=Date.now();TS.pausedAt=null;
  TS.timerInt=setInterval(()=>{
    const ms=(Date.now()-TS.startTime)+TS.elapsedMs;
    const s=Math.round(ms/1000);
    const el=$('kural-time');if(el)el.textContent=`${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;
    _dailyTick();
  },1000);
}
function _pauseTimer(){
  if(!TS.startTime||TS.pausedAt||TS.finished)return;
  TS.pausedAt=Date.now();TS.elapsedMs+=(TS.pausedAt-TS.startTime);TS.startTime=null;
  clearInterval(TS.timerInt);
  _flushDaily();
}
function _resumeTimer(){
  if(!TS.pausedAt||TS.finished)return;
  clearInterval(TS.timerInt);
  TS.pausedAt=null;TS.startTime=Date.now();
  TS.timerInt=setInterval(()=>{
    const ms=(Date.now()-TS.startTime)+TS.elapsedMs;
    const s=Math.round(ms/1000);
    const el=$('kural-time');if(el)el.textContent=`${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;
    _dailyTick();
  },1000);
}
function _clearTimers(){clearInterval(TS.timerInt);clearTimeout(TS.hintTimeout);_flushDaily();}

function _resetStats(){
  const w=$('kural-wpm'),a=$('kural-acc'),t=$('kural-time'),pf=$('kural-progress-fill'),pt=$('kural-progress-txt');
  if(w)w.textContent='0';if(a)a.textContent='100%';if(t)t.textContent='0:00';
  if(pf)pf.style.width='0%';if(pt)pt.textContent=`0 / ${TS.content.length}`;
}

function _finish(){
  TS.finished=true;_clearTimers();clearHints();clearKuralHintBar();setShiftActive(false);
  const wpm=calcWpm();
  const totalMs=TS.elapsedMs+(TS.startTime?Date.now()-TS.startTime:0);
  const acc=TS.totalKeys?Math.round((TS.correctKeys/TS.totalKeys)*100):100;
  const secs=Math.round(totalMs/1000),m=Math.floor(secs/60),ss=(secs%60).toString().padStart(2,'0');
  const stars=wpm>=30?3:wpm>=20?2:wpm>=10?1:0;
  const msg=stars>=3?'நன்று! Excellent!':stars>=2?'நல்லது! Well done!':stars>=1?'தொடர்க! Keep going!':'மீண்டும் முயற்சி!';
  // curriculum:false keeps kural verses out of completedLessons / lessonBests
  storage.recordResult(`kural-${TS.kural.number}`,wpm,acc,TS.totalKeys,TS.correctKeys,{curriculum:false});
  storage.flushKeyData();
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
  const go=(e)=>{
    const n=parseInt(inp?.value,10);
    if(n>=1&&n<=1330){
      // No-op if this verse is already loaded or already being fetched
      // (blur after Enter / click-away would otherwise reload and wipe progress)
      if(n===TS.kural?.number||n===TS.kural?.requested||n===inflightNum){
        if(TS.kural&&inp)inp.value=TS.kural.number;   // keep the field matching the verse shown
        return;
      }
      loadKural(n);
    }else if(inp){
      // Tell the user why the value snapped back (not on blur — avoid a popup on click-away)
      if(e?.type!=='blur'&&inp.value!==''){
        inp.setCustomValidity('1 முதல் 1330 வரை எண் தரவும் — Enter a number from 1 to 1330');
        inp.reportValidity();
        setTimeout(()=>inp.setCustomValidity(''),2000);
      }
      inp.value=TS.kural?.number??'';
    }
  };
  inp?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();go(e);}});
  inp?.addEventListener('blur',go);
  $('btn-go-kural')?.addEventListener('click',go);
  window.addEventListener('kural-tab-activated', () => {
    // Called every time user switches to kural tab.
    // We set the title TWICE: immediately (synchronous) and in the next rAF.
    // The rAF catches any synchronous overwrite that happens after this event
    // (e.g. applyViewMode or other title-setting code that may fire after dispatch).
    function _applyKuralTitle() {
      const el = document.getElementById('lesson-title-bar');
      if (el && TS.kural && _kuralTabActive()) {
        el.textContent = `குறள் ${TS.kural.number}${TS.kural.chapter ? ' — ' + TS.kural.chapter : ''}`;
      }
    }
    if (!TS.kural && !loading) {
      loadKural(null); // loadKural sets title internally via renderMeta
    } else {
      _applyKuralTitle();    // immediate
      ta.focus();
      requestAnimationFrame(_applyKuralTitle); // safety net — overrides any sync rewrite
    }
  });
}