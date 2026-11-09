/**
 * practice.js — keybr-style Tamil typing practice.
 * Single-span composed-form syllable rendering with CSS gradient partial state.
 */

import { storage }                                   from './storage.js';
import { THEMES, applyTheme, THEME_CUSTOMIZABLE_VARS } from './themes.js';
import { MAPPING, tamilOf, hintLabel, needsShift,
         STANDALONE, MATRA, SYL_CONS, SYL_VOW, composedForm,
         buildSyls as buildSylsBase }                 from './mapping.js';
import { LESSONS_DB, ALL_LESSONS, getLessonById,
         getNextLesson, getPrevLesson, getLessonIndex,
         getFirstIncomplete }                         from './lessons.js';
import { loadKeyboard, showHint, flashCorrect,
         flashWrong, flashKeyPress, setShiftActive,
         clearHints, setVisible, getContainer }       from './keyboard.js';
import { setGuideMode, shouldAutoShow, markShown,
         FINGER_INFO }                                from './fingerGuide.js';
import { resetSession, recordKeypress,
         sessionAccuracy,
         initTopBar, renderTopBar, renderKeyPanel,
         renderProblemKeys }                          from './metrics.js';
/* ── Lazily-loaded feature modules ─────────────────────────────
 * thirukkural.js (26 KB), tour.js (31 KB) and report.js (7 KB) are not
 * needed to render the practice tab, which is what every user sees first.
 * Importing them statically put ~65 KB and 3 extra round trips on the
 * critical path. Each is now fetched at its real activation point.
 */
let kuralMod = null;   // set once the kural tab is first opened
let kuralPromise = null;   // cache the promise (not the module) so rapid clicks share one init
let reportPromise = null;

function loadKural() {
  kuralPromise ??= import('./thirukkural.js?v=20261109').then(m => { kuralMod = m; m.initKural(); return m; })
    .catch(e => { kuralPromise = null; throw e; });
  return kuralPromise;
}

function loadReport() {
  reportPromise ??= import('./report.js?v=20261109').then(m => { m.initReport(); return m; })
    .catch(e => { reportPromise = null; throw e; });
  return reportPromise;
}

/* ── Practice-specific maps ───────────────────── */
// Matra position for CSS gradient direction (practice-only)
const VOWEL_TYPE = {q:'right',s:'top',w:'top',d:'bottom',e:'bottom',g:'left',t:'left',r:'right',c:'left',x:'left',z:'right',f:'dot'};

// Practice-specific syllable builder (wraps shared buildSyls, adds vtype for CSS gradient)
function buildSyls(keys) {
  const { syls, map } = buildSylsBase(keys);
  syls.forEach(syl => {
    if (syl.keys.length === 2) {
      syl.vtype = VOWEL_TYPE[syl.keys[1]] ?? 'right';
    }
  });
  return { syls, map };
}

function createSylSpan(syl,si){
  const span=document.createElement('span');
  if(syl.isSpace){span.className='char space-char';span.dataset.si=si;span.textContent='·';return span;}
  if(syl.keys.length===2){span.className='char char-syl';span.dataset.si=si;span.dataset.vtype=syl.vtype;span.textContent=syl.display;return span;}
  span.className='char';span.dataset.si=si;span.textContent=syl.display;return span;
}

/* ── State ─────────────────────────────────────── */
const S={
  lesson:null,content:[],pointer:0,totalKeys:0,correctKeys:0,hadErrorHere:false,
  startTime:null,pausedAt:null,elapsedMs:0,
  timerInt:null,hintTimeout:null,metricsInt:null,finished:false,
  syllables:[],sylMap:[],sylErrors:{},
};
const HINT_DELAY=2000;

// EMA for live WPM display — α=0.2 (slightly responsive for display purposes)
const WPM_EMA_ALPHA = 0.2;
let _wpmEma = 0;

function calcWpm(){
  if(!S.startTime||S.correctKeys<3)return 0;
  const ms=(Date.now()-S.startTime)+S.elapsedMs;
  const mins=ms/60000;
  // Tamil: use /3 (≈1 Tamil syllable/word unit per ~3 keypresses) instead of English /5.
  // Gated on correctKeys>=3 above (no time-based clamp, so short real lessons record real WPM).
  return mins>0?Math.round((S.correctKeys/3)/mins):0;
}

// Advance the EMA once per tick (1s interval) and return the smoothed value.
// This is the single value shown in the top bar (see renderTopBar(wpm) in metrics.js).
function tickWpmEma() {
  const raw = calcWpm();
  if (raw === 0) { _wpmEma = 0; return 0; }
  _wpmEma = _wpmEma > 0
    ? WPM_EMA_ALPHA * raw + (1 - WPM_EMA_ALPHA) * _wpmEma
    : raw;
  return Math.round(_wpmEma);
}
const renderTop = () => renderTopBar(Math.round(_wpmEma));

const $=id=>document.getElementById(id);
const $$=sel=>document.querySelectorAll(sel);
// sessionStorage can throw (blocked storage, privacy modes): every access is guarded.
const setActiveTabSession = (tab) => { try { sessionStorage.setItem('activeTab', tab); } catch {} };
const getActiveTabSession = () => { try { return sessionStorage.getItem('activeTab'); } catch { return null; } };
const showModal=id=>$(id).classList.add('visible');
const hideModal=id=>$(id).classList.remove('visible');

/* ── Modal keyboard model ───────────────────────────
 * A MutationObserver watches every .modal-overlay, so ALL code paths that add
 * or remove `.visible` (showModal/hideModal, info modal, tour start closing
 * modals, results at lesson end) get identical behaviour:
 *   open  : remember opener, inert the page (#app), focus into the dialog
 *   Tab   : trapped inside the topmost dialog
 *   Escape: closes the topmost dialog
 *   close : drop inert, restore focus to the opener (else #typing-area)
 * Modals live outside #app, so inerting #app never inerts a dialog.
 */
const FOCUSABLE='a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
const modalStack=[];   // [{el, opener}] — last = topmost
const anyModalOpen=()=>!!document.querySelector('.modal-overlay.visible');
function modalFocusables(el){
  return [...el.querySelectorAll(FOCUSABLE)].filter(n=>n.tabIndex>=0&&n.getClientRects().length&&!n.closest('[hidden],.hidden'));
}
function focusIntoModal(el){
  const items=modalFocusables(el);
  const target=el.querySelector('.modal-close')??items[0]??el;
  if(target===el)el.setAttribute('tabindex','-1');
  target.focus({preventScroll:true});
}
function restoreModalFocus(opener){
  const ok=opener&&opener.isConnected&&!opener.disabled&&opener.getClientRects().length&&!opener.closest('[inert]');
  (ok?opener:$('typing-area'))?.focus({preventScroll:true});
}
function syncModals(){
  const app=$('app');
  const prevTop=modalStack[modalStack.length-1];
  // drop closed, add newly opened (in DOM order)
  for(let i=modalStack.length-1;i>=0;i--)
    if(!modalStack[i].el.classList.contains('visible'))modalStack.splice(i,1);
  const closedTop=prevTop&&!modalStack.includes(prevTop)?prevTop:null;
  $$('.modal-overlay.visible').forEach(el=>{
    if(!modalStack.some(m=>m.el===el)){
      const a=document.activeElement;
      modalStack.push({el,opener:a&&a!==document.body&&!el.contains(a)?a:null});
    }
  });
  const top=modalStack[modalStack.length-1];
  if(top){
    if(app)app.inert=true;
    if(top!==prevTop)focusIntoModal(top.el);
  }else{
    if(app)app.inert=false;
    if(closedTop)restoreModalFocus(closedTop.opener);
  }
}
function closeTopModal(){
  const top=modalStack[modalStack.length-1];
  if(!top)return;
  if(top.el.id==='modal-finger')closeFingerGuide();else hideModal(top.el.id);
}
function initModalA11y(){
  const mo=new MutationObserver(syncModals);
  $$('.modal-overlay').forEach(el=>mo.observe(el,{attributes:true,attributeFilter:['class']}));
  document.addEventListener('keydown',e=>{
    const top=modalStack[modalStack.length-1];
    if(!top)return;
    if(e.key==='Escape'){e.preventDefault();e.stopPropagation();closeTopModal();return;}
    if(e.key==='Tab'){
      const items=modalFocusables(top.el);
      if(!items.length){e.preventDefault();top.el.focus();return;}
      const first=items[0],last=items[items.length-1],act=document.activeElement;
      if(!items.includes(act)){e.preventDefault();(e.shiftKey?last:first).focus();}
      else if(e.shiftKey&&act===first){e.preventDefault();last.focus();}
      else if(!e.shiftKey&&act===last){e.preventDefault();first.focus();}
    }
  });
}

/* ── Active tab tracker ─────────────────────────── */
let activeTab = 'practice';
// Exactly one .tab-btn has aria-selected="true" (the active one).
function syncTabSelected(tab){
  $$('.tab-btn').forEach(b=>{
    const on=b.dataset.tab===tab;
    b.classList.toggle('active',on);
    b.setAttribute('aria-selected',on?'true':'false');
  });
}

/* ── View cycle ─────────────────────────────────── */
// Practice char sizes
const CHAR_SIZES = ['2rem','2.6rem','3.4rem'];
// Kural char sizes (bigger base for readability)
const KURAL_SIZES = ['1.75rem','2.2rem','2.8rem'];
const KURAL_URAI_SIZES = ['1.2rem','1.5rem','1.9rem'];

const VIEW_ICONS=[
  `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="13" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="12.01"/><line x1="8" y1="12" x2="8" y2="12.01"/><line x1="16" y1="12" x2="16" y2="12.01"/><line x1="10" y1="16" x2="14" y2="16"/></svg>`,
  `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>`,
  `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`,
];
// Indexed by the mode a click switches TO (not the current mode).
const VIEW_ACTIONS=['Show keyboard (compact view)','Larger text (hides keyboard)','Zen mode (hides hints and panels)'];
function viewActionText(mode){return `காட்சியை மாற்று — Switch to: ${VIEW_ACTIONS[(mode+1)%3]}`;}
const VIEW_LABELS=['Compact','Large','Zen'];

function setViewTooltip(mode){
  const b=$('btn-view');if(!b)return;
  const t=viewActionText(mode);
  b.title=t;b.setAttribute('aria-label',t);
}

function applyViewMode(mode){
  mode=Number.isInteger(mode)&&mode>=0&&mode<3?mode:0;
  const iconEl=$('btn-view-icon');
  const labelEl=$('btn-view-label');
  if(iconEl) iconEl.innerHTML=VIEW_ICONS[mode];
  if(labelEl) labelEl.textContent=VIEW_LABELS[mode];
  if(activeTab==='kural'){
    setVisible(mode===0);
    const s=storage.getSettings();
    $('kural-key-guide')?.classList.toggle('hint-hidden',mode>=2||!s.showHints);
    const km=$('kural-main');
    if(km){
      km.dataset.view=mode;
      // Set CSS vars on kural-main — both #kural-typing-area and
      // #kural-container inherit these for responsive height & font size
      km.style.setProperty('--kural-sz', KURAL_SIZES[mode]);
      km.style.setProperty('--urai-sz',  KURAL_URAI_SIZES[mode]);
    }
    setViewTooltip(mode);
    // Re-measure kural line widths after zoom changes font size.
    // Two rAFs: first lets CSS vars apply & reflow, second measures accurately.
    // activeTab==='kural' implies the module is already loaded.
    if(kuralMod) requestAnimationFrame(() => requestAnimationFrame(kuralMod.adjustKuralWidth));
  }else{
    document.documentElement.style.setProperty('--char-size',CHAR_SIZES[mode]);
    const s=storage.getSettings();
    setVisible(mode===0);
    $('key-guide').classList.toggle('hint-hidden',mode>=2||!s.showHints);
    $('key-panel').classList.toggle('hidden',mode>=2);
    setViewTooltip(mode);
    $('practice-main').dataset.view=mode;
  }
}
function cycleView(){
  const cur=storage.getSettings().viewMode;
  const next=((Number.isInteger(cur)&&cur>=0&&cur<3?cur:0)+1)%3;
  storage.saveSettings({viewMode:next});applyViewMode(next);
}

/* ── Hints ──────────────────────────────────────── */
function scheduleHint(){clearTimeout(S.hintTimeout);clearHints();if(S.pointer>=S.content.length)return;S.hintTimeout=setTimeout(()=>showHint(S.content[S.pointer]),HINT_DELAY);}
function cancelHint(){clearTimeout(S.hintTimeout);clearHints();}
function immediateHint(k){clearTimeout(S.hintTimeout);showHint(k);}

/* ── Hint bar: H + S → கி ─────────────────────── */
function updateHintBar(){
  const guide=$('key-guide');
  if(!guide||S.pointer>=S.content.length)return;
  const key=S.content[S.pointer],si=S.sylMap?.[S.pointer];
  const syl=si!==undefined?S.syllables?.[si]:null;
  if(syl&&syl.keys.length===2){
    const done=S.pointer-syl.start,k1=syl.keys[0],k2=syl.keys[1];
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

/* ── Lesson start ────────────────────────────────── */
function startLesson(lesson){
  clearInterval(S.timerInt);clearInterval(S.metricsInt);cancelHint();resetSession();
  _wpmEma = 0; // reset EMA on new lesson
  const content=lesson.generateContent?lesson.generateContent():(lesson.content??[]);
  Object.assign(S,{lesson,content,pointer:0,totalKeys:0,correctKeys:0,
    hadErrorHere:false,startTime:null,pausedAt:null,elapsedMs:0,finished:false,
    syllables:[],sylMap:[],sylErrors:{}});
  const idx=getLessonIndex(lesson.id);
  $('lesson-title-bar').textContent=lesson.title;
  $('lesson-label').textContent=lesson.title;
  $('lesson-counter').textContent=`${idx+1} / ${ALL_LESSONS.length}`;
  $('btn-prev-lesson').disabled=!getPrevLesson(lesson.id);
  $('btn-next-lesson-nav').disabled=!getNextLesson(lesson.id);
  renderChars();resetStats();
  applyViewMode(storage.getSettings().viewMode);
  storage.saveProgress({lastLessonId:lesson.id});
  renderTop();
  renderKeyPanel($('key-panel'),S.content[0]??'',lesson.focusKeys??[],lesson.targetWPM);
  setTimeout(()=>{$('typing-area').focus();handleFocus();},60);
}
function restartLesson(){if(S.lesson)startLesson(S.lesson);}
function refreshMetrics(){renderTop();renderKeyPanel($('key-panel'),S.content[S.pointer]??'',S.lesson?.focusKeys??[],S.lesson?.targetWPM);}

/* ── Render chars ───────────────────────────────── */
function renderChars(){
  const box=$('lesson-container');box.innerHTML='';
  const{syls,map}=buildSyls(S.content);
  S.syllables=syls;S.sylMap=map;S.sylErrors={};
  let wordEl=document.createElement('span');wordEl.className='word';
  syls.forEach((syl,si)=>{
    if(syl.isSpace){wordEl.appendChild(createSylSpan(syl,si));box.appendChild(wordEl);wordEl=document.createElement('span');wordEl.className='word';}
    else wordEl.appendChild(createSylSpan(syl,si));
  });
  if(wordEl.children.length)box.appendChild(wordEl);
  const first=box.querySelector('[data-si="0"]');if(first)first.classList.add('current');
  resetScroll();updateHintBar();
}

function sylSpan(si){return $('lesson-container').querySelector(`[data-si="${si}"]`);}

let currentLineY = -1;
function scrollToSyllable(si) {
  const area = $('typing-area');
  const span = sylSpan(si);
  if (!span || !area) return;

  // Use getBoundingClientRect relative to the area so we measure rendered position
  // regardless of offsetParent chain. areaTop is the top of the visible window.
  const areaRect = area.getBoundingClientRect();
  const spanRect = span.getBoundingClientRect();

  // Position of the span's top relative to the area's visible top, accounting for
  // current scroll. This gives us the "logical" y in the scroll coordinate space.
  const logicalY = spanRect.top - areaRect.top + area.scrollTop;

  if (currentLineY < 0) {
    // First character: establish baseline line position, no scroll needed yet
    currentLineY = logicalY;
    area.scrollTop = 0;
    return;
  }

  if (logicalY > currentLineY + 2) {
    // Moved to a new line (2px tolerance for sub-pixel rounding).
    // Scroll by exactly the line height so the new current char sits at the
    // same visual position where the previous line started — completed lines
    // scroll smoothly off the top.
    const delta = logicalY - currentLineY;
    area.scrollTop = Math.max(0, area.scrollTop + delta);
    currentLineY = logicalY;
  }
}
function resetScroll() { currentLineY = -1; $('typing-area').scrollTop = 0; }

function setSylState(span,state,hadError){
  if(!span)return;
  span.classList.remove('current','syl-partial','incorrect','correct','corrected','pop');
  if(state==='current')span.classList.add('current');
  else if(state==='partial')span.classList.add('syl-partial');
  else if(state==='correct'){span.classList.add(hadError?'corrected':'correct','pop');setTimeout(()=>span.classList.remove('pop'),220);}
  else if(state==='incorrect')span.classList.add('incorrect');
}

/* ── Keydown / keyup ─────────────────────────────── */
function onKeyDown(e){
  // Browser/OS shortcuts (Ctrl/Cmd/Alt + key) must pass through untouched.
  if(e.ctrlKey||e.metaKey||e.altKey)return;
  if(activeTab!=='practice')return;
  // OS key-repeat from a held key is not a deliberate keystroke.
  if(e.repeat&&e.key!=='Tab')return;
  // A dialog is open: nothing may reach the lesson behind it.
  if(anyModalOpen())return;
  // Tab / Shift+Tab: let focus move naturally; never counts as a keystroke.
  if(e.key==='Tab')return;
  // Escape leaves the typing area (keyboard-trap exit) and pauses via blur.
  if(e.key==='Escape'){e.preventDefault();$('btn-lessons')?.focus();return;}
  if(S.finished)return;
  if(e.key==='Shift'){setShiftActive(true);return;}
  // F1-F12: browser function keys pass through, not counted.
  if(/^F\d{1,2}$/.test(e.key))return;
  if(e.key.length>1&&e.key!==' '){e.preventDefault();return;}
  e.preventDefault();
  const expected=S.content[S.pointer],pressed=e.key;
  checkKeyboardLanguage(pressed);
  if(!S.startTime&&!S.pausedAt)startTimer();
  else if(S.pausedAt)resumeTimer();
  S.totalKeys++;cancelHint();
  flashKeyPress(pressed);   // dim flash for ANY key pressed
  if(pressed===expected)handleCorrect();
  else handleWrong(pressed,expected);
  recordKeypress(expected,pressed===expected,calcWpm());updateStats();
}
function onKeyUp(e){if(e.key==='Shift')setShiftActive(false);}

function handleCorrect(){
  const prevSi=S.sylMap[S.pointer],prevSyl=S.syllables[prevSi],prevSpan=sylSpan(prevSi);
  flashCorrect(S.content[S.pointer]);S.correctKeys++;S.pointer++;
  const doneInSyl=S.pointer-prevSyl.start;
  if(doneInSyl>=prevSyl.keys.length){setSylState(prevSpan,'correct',!!S.sylErrors[prevSi]);S.hadErrorHere=false;}
  else{setSylState(prevSpan,'partial',false);clearTimeout(S.hintTimeout);showHint(S.content[S.pointer]);updateHintBar();return;}
  if(S.pointer>=S.content.length){updateProgress();finishLesson();return;}
  const newSi=S.sylMap[S.pointer];
  if(newSi!==prevSi){setSylState(sylSpan(newSi),'current',false);scrollToSyllable(newSi);}
  updateHintBar();updateProgress();scheduleHint();
}

function handleWrong(pressed,expected){
  const si=S.sylMap[S.pointer];S.sylErrors[si]=true;
  const span=sylSpan(si);
  if(span){span.classList.add('incorrect','shake');setTimeout(()=>span.classList.remove('shake'),300);}
  flashWrong(pressed,expected);immediateHint(expected);
}

/* ── Timer — pauses on blur ──────────────────────── */
function startIntervals(){
  clearInterval(S.timerInt);clearInterval(S.metricsInt);
  S.timerInt=setInterval(()=>{
    const ms=(Date.now()-S.startTime)+S.elapsedMs;
    $('stat-time').textContent=fmtTime(ms/1000);
    tickWpmEma();
    renderTop();   // top bar shows the EMA-smoothed WPM (same value everywhere)
  },1000);
  S.metricsInt=setInterval(()=>{
    renderKeyPanel($('key-panel'),S.content[S.pointer]??'',S.lesson?.focusKeys??[],S.lesson?.targetWPM);
    storage.addDailySeconds(3);
  },3000);
}
function startTimer(){
  S.startTime=Date.now();S.pausedAt=null;
  storage.touchStreak();
  startIntervals();
}
function pauseTimer(){
  if(!S.startTime||S.pausedAt||S.finished)return;
  S.pausedAt=Date.now();S.elapsedMs+=(S.pausedAt-S.startTime);S.startTime=null;
  clearInterval(S.timerInt);clearInterval(S.metricsInt);
}
function resumeTimer(){
  if(!S.pausedAt||S.finished)return;
  S.pausedAt=null;S.startTime=Date.now();
  startIntervals();
}

const fmtTime=s=>`${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,'0')}`;
function updateStats(){updateProgress();}
function resetStats(){
  $('stat-time').textContent='0:00';$('progress-fill').style.width='0%';
  $('progress-text').textContent=`0 / ${S.content.length}`;renderTop();
}
function updateProgress(){const p=Math.round((S.pointer/S.content.length)*100);$('progress-fill').style.width=p+'%';$('progress-text').textContent=`${S.pointer} / ${S.content.length}`;}

/* ── Focus / blur ────────────────────────────────── */
function handleFocus(){
  $('focus-overlay').classList.add('hidden');
  if(S.pausedAt)resumeTimer();
  updateHintBar();scheduleHint();
}
function handleBlur(){
  // Don't show focus-overlay during the tour
  if(!$('focus-overlay')?.dataset?.tourHide)
    $('focus-overlay').classList.remove('hidden');
  cancelHint();setShiftActive(false);
  if(S.startTime&&!S.finished)pauseTimer();
}

/* ── Finish ──────────────────────────────────────── */
function finishLesson(){
  S.finished=true;clearInterval(S.timerInt);clearInterval(S.metricsInt);cancelHint();
  const wpm=calcWpm(),accuracy=sessionAccuracy();
  const totalMs=S.elapsedMs+(S.startTime?Date.now()-S.startTime:0);
  const timeSec=Math.round(totalMs/1000);
  const stars=wpm>=S.lesson.targetWPM*1.2?3:wpm>=S.lesson.targetWPM?2:wpm>=S.lesson.targetWPM*0.6?1:0;
  storage.recordResult(S.lesson.id,wpm,accuracy,S.totalKeys,S.correctKeys);
  storage.flushKeyData(); // persist buffered per-key stats at a natural pause
  refreshMetrics();
  $('results-wpm').textContent=wpm;$('results-accuracy').textContent=accuracy+'%';
  $('results-time').textContent=fmtTime(timeSec);
  $('results-stars').textContent='★'.repeat(stars)+'☆'.repeat(3-stars);
  $('results-stars').setAttribute('aria-label',`${stars} / 3 நட்சத்திரங்கள் — ${stars} of 3 stars`);
  $('result-msg').textContent=stars>=3?'நன்று! Excellent!':stars>=2?'நல்லது! Well done!':stars>=1?'தொடர்க! Keep going!':'மீண்டும் முயற்சி!';
  const next=getNextLesson(S.lesson.id),nxt=$('btn-next-lesson');
  if(next){nxt.textContent=`${next.title} →`;nxt.style.display='';nxt.onclick=()=>{hideModal('modal-results');startLesson(next);};}
  else nxt.style.display='none';
  renderProblemKeys($('results-problem-keys'), S.lesson?.focusKeys ?? []);
  setTimeout(()=>{if(activeTab==='practice')showModal('modal-results');},380);
}

/* ── Lessons modal ───────────────────────────────── */
let activeLevelTab='beginner';
function openLessonsModal(){renderLessonList(activeLevelTab);showModal('modal-lessons');}

function switchToPracticeTab(){
  activeTab='practice';
  setActiveTabSession('practice');
  syncTabSelected('practice');
  $('practice-main').classList.remove('hidden');
  $('kural-main').classList.add('hidden');
  // BUG FIX: report-main was never hidden here, so clicking the logo while on
  // the Report tab left both panels stacked on screen.
  $('report-main')?.classList.add('hidden');
  const ltb=$('lesson-title-bar');if(ltb)ltb.style.display='';
  const kb=$('keyboard');
  if(kb&&$('practice-main'))$('practice-main').appendChild(kb);
  // BUG FIX: restore lesson title when returning from Thirukkural tab
  if(S.lesson){
    $('lesson-title-bar').textContent=S.lesson.title;
    $('lesson-label').textContent=S.lesson.title;
  }
  applyViewMode(storage.getSettings().viewMode);
  // Restart hint scheduling after tab switch
  if(!S.finished)scheduleHint();
}

/* ── Block-reason live region ─────────────────────
 * One visually-hidden aria-live element (#block-reason), created from JS and
 * appended to #stats-strip. Written to whenever navigation is blocked. */
function ensureBlockReason(){
  let el=document.getElementById('block-reason');
  if(el)return el;
  el=document.createElement('span');
  el.id='block-reason';
  el.setAttribute('role','status');
  el.setAttribute('aria-live','polite');
  el.setAttribute('aria-atomic','true');
  el.style.cssText='position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0;';
  ($('stats-strip')||document.body).appendChild(el);
  return el;
}
let _blockTimer=null;
function announceBlock(tamil,en){
  const el=ensureBlockReason();
  el.textContent='';
  clearTimeout(_blockTimer);
  // Clear first, then set on next tick so repeated identical messages re-announce.
  setTimeout(()=>{el.textContent=`${tamil} — ${en}`;},30);
  _blockTimer=setTimeout(()=>{el.textContent='';},4000);
}

function renderLessonList(level){
  const listEl=$('lesson-list'),progress=storage.getProgress(),lessons=LESSONS_DB[level];
  listEl.innerHTML='';
  lessons.forEach((lesson,idx)=>{
    const done=progress.completedLessons.includes(lesson.id),best=progress.lessonBests[lesson.id];
    // Lock against the GLOBAL lesson order so the first intermediate/advanced
    // lesson is locked until the last lesson of the previous level is done.
    const gi=getLessonIndex(lesson.id),prevGlobal=gi>0?ALL_LESSONS[gi-1]:null;
    const locked=!!prevGlobal&&!progress.completedLessons.includes(prevGlobal.id),isCur=S.lesson?.id===lesson.id;
    const row=document.createElement('button');
    row.className=`lesson-row${isCur?' is-current':''}${locked?' locked':''}`;
    if(locked){
      row.setAttribute('aria-disabled','true');
      row.tabIndex=-1;
      row.title='முந்தைய பாடத்தை முடிக்கவும் — Finish the previous lesson first';
    }
         row.innerHTML = `
           <span class="row-num">${String(lesson.order).padStart(2, '0')}</span>
           <span class="row-chars" style="display:flex; flex-direction:column; gap:2px; text-align:left;">
             <strong style="font-size:1rem;">${lesson.title}</strong>
             <small style="font-size:0.75rem; opacity:0.6;">${lesson.description}</small>
           </span>
           <span class="row-right">
             ${isCur ? '<span class="row-dot"></span>' : ''}
             ${done && best ? `<span class="row-wpm">${best.wpm}</span><span class="row-done">✓</span>` : ''}
             ${locked ? '<svg class="row-lock" width="10" height="12" viewBox="0 0 10 12" fill="none" aria-label="Locked"><path d="M2.5 5V3.2a2.5 2.5 0 015 0V5" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/><rect x="1" y="5" width="8" height="6.2" rx="1.4" fill="currentColor"/></svg>' : ''}
           </span>
         `;
      row.addEventListener('click',()=>{
      // Locked rows: close the modal and announce why (aria-live).
      if(locked){
        hideModal('modal-lessons');
        announceBlock('முந்தைய பாடத்தை முடிக்கவும்','Finish the previous lesson first');
        return;
      }
      // Same guard as the nav arrow: if mid-lesson (typed but not finished), block
      if(S.pointer > 0 && !S.finished && S.lesson?.id !== lesson.id){
        hideModal('modal-lessons');
        announceBlock('இந்தப் பாடத்தை முதலில் முடிக்கவும்','Finish the current lesson first');
        const ta=$('typing-area');
        // Flash the typing area border red to signal "finish first"
        ta.style.borderBottomColor='var(--wrong)';
        setTimeout(()=>{ ta.style.borderBottomColor=''; ta.focus(); }, 700);
        return;
      }
      hideModal('modal-lessons');
      switchToPracticeTab();
      startLesson(lesson);
    });
    listEl.appendChild(row);
  });
}

/* ── Finger guide ────────────────────────────────── */
function openFingerGuide(){buildFingerLegend();setGuideMode(getContainer(),true);showModal('modal-finger');markShown();}
function closeFingerGuide(){setGuideMode(getContainer(),false);hideModal('modal-finger');}
function buildFingerLegend(){
  const kbWrap=$('finger-kb-wrap');
  // Always re-clone fresh (keyboard may have moved between practice/kural slots).
  // Also clear display:none that setVisible(false) may have set on the original.
  kbWrap.innerHTML='';
  const kbSrc=getContainer();
  if(kbSrc){
    const c=kbSrc.cloneNode(true);
    c.removeAttribute('id');
    c.style.display='';        // ← FIX: remove inline display:none from original
    c.classList.add('guide-mode');
    kbWrap.appendChild(c);
  }
  const legend=$('finger-legend');if(legend.children.length)return;
  // Pair left + right fingers so they appear side-by-side in the 2-column grid:
  // lp (left col) | rp (right col)
  // lr (left col) | rr (right col)
  // lm (left col) | rm (right col)
  // li (left col) | ri (right col)
  // Left fingers in left column, right fingers in right column.
  // Paired row by row: outer → inner (pinky→index on left, index→pinky on right)
  const pairs=[['lp','ri'],['lr','rm'],['lm','rr'],['li','rp']];
  pairs.forEach(([l,r])=>{
    legend.appendChild(mkFgRow(l,'fg-left'));
    legend.appendChild(mkFgRow(r,'fg-right'));
  });
  const thumb=document.createElement('div');thumb.className='fg-thumb-row';
  thumb.innerHTML=`<span class="fg-swatch" style="background:${FINGER_INFO.th.css}"></span><span>Thumbs — Space bar</span>`;
  legend.appendChild(thumb);
}
function mkFgRow(f,side=''){const info=FINGER_INFO[f],div=document.createElement('div');div.className='fg-row'+(side?' '+side:'');div.innerHTML=`<span class="fg-swatch" style="background:${info.css}"></span><span class="fg-label">${info.label}</span><span class="fg-chars">${info.tamil}</span>`;return div;}

/* ── Init ────────────────────────────────────────── */

/* ── Non-English keyboard detection ──────────────────
   Checks if user is pressing non-ASCII keys (e.g. typing
   in Tamil/Arabic/Devanagari layout instead of English).
   Shows a banner and also inside the info modal. */
let nonEnglishWarningShown = false;
function checkKeyboardLanguage(key) {
  if (nonEnglishWarningShown) return;
  if (key.length !== 1) return;
  const code = key.codePointAt(0);
  // Non-ASCII printable → likely non-English keyboard layout
  if (code > 127) {
    nonEnglishWarningShown = true;
    const banner = document.getElementById('kb-lang-banner');
    if (banner) {
      banner.classList.remove('hidden');
      // Auto-dismiss after 12 seconds
      setTimeout(() => banner.classList.add('hidden'), 12000);
    }
  }
}

/* ── Info modal ───────────────────────────────────── */
function initInfoModal() {
  const $btn = document.getElementById('btn-info');
  const $modal = document.getElementById('modal-info');
  const $close = document.getElementById('btn-close-info');
  const $banner = document.getElementById('kb-lang-banner');
  const $bannerClose = document.getElementById('btn-kb-banner-close');

  if ($btn && $modal) {
    $btn.addEventListener('click', () => showModal('modal-info'));
    $close?.addEventListener('click', () => hideModal('modal-info'));
    $modal.addEventListener('click', e => { if (e.target === $modal) hideModal('modal-info'); });
  }

  if ($bannerClose && $banner) {
    $bannerClose.addEventListener('click', () => {
      $banner.classList.add('hidden');
      nonEnglishWarningShown = true; // don't show again this session
    });
  }

  // OS tab switching in info modal
  document.querySelectorAll('.info-os-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const os = btn.dataset.os;
      document.querySelectorAll('.info-os-btn').forEach(b => b.classList.toggle('active', b === btn));
      document.querySelectorAll('.info-os-panel').forEach(p => p.classList.toggle('active', p.dataset.os === os));
    });
  });
}

async function init(){
  initModalA11y();
  // The keyboard SVG is not required for typing (every keyboard.js function guards on `loaded`),
  // so don't block init on its fetch. loadKeyboard() catches its own errors; the catch below
  // is only a guard against an unhandled rejection.
  const kbReady=loadKeyboard('keyboard');kbReady.catch(()=>{});
  const s=storage.getSettings();
  initTopBar($('stats-strip'));
  ensureBlockReason();
  applyTheme(s.themeId ?? s.theme ?? 'dark', storage.getCustomTheme());
  applyViewMode(s.viewMode);
  $('toggle-hints').checked=s.showHints;

  const p=storage.getProgress();
  const startL=p.lastLessonId?(getLessonById(p.lastLessonId)??getFirstIncomplete(p.completedLessons)):getFirstIncomplete(p.completedLessons);
  startLesson(startL);

  

  if(shouldAutoShow()){
    // First visit only. If the tour will auto-start, it already has a Finger
    // Guide step, so don't open the modal -- but still record the guide as
    // shown, otherwise it would pop open on the SECOND visit instead.
    if(storage.getTourSeen()){
      setTimeout(()=>openFingerGuide(),800);   // openFingerGuide() calls markShown()
    }else{
      markShown();
    }
  }

  $('btn-view').addEventListener('click',cycleView);
  $('btn-lessons').addEventListener('click',openLessonsModal);
  $('btn-finger').addEventListener('click',openFingerGuide);
  // btn-theme hidden — use Themes modal instead
  initThemePicker();
  $('logo').addEventListener('click',()=>{
    // Same mid-lesson guard as the lesson list / next arrow: don't discard progress.
    if(S.pointer>0&&!S.finished){
      announceBlock('இந்தப் பாடத்தை முதலில் முடிக்கவும்','Finish the current lesson first');
      const ta=$('typing-area');
      ta.style.borderBottomColor='var(--wrong)';
      setTimeout(()=>{ta.style.borderBottomColor='';},700);
      switchToPracticeTab();
      return;
    }
    const p=storage.getProgress();
    const home=getFirstIncomplete(p.completedLessons);
    startLesson(home);
    switchToPracticeTab();
  });
  $('btn-restart').addEventListener('click',restartLesson);
  $('btn-prev-lesson').addEventListener('click',()=>{
    const p=getPrevLesson(S.lesson?.id);
    if(!p)return;
    // Allow going back freely — prev resets the current lesson naturally
    startLesson(p);
  });
  $('btn-next-lesson-nav').addEventListener('click',()=>{
    const n=getNextLesson(S.lesson?.id);
    if(!n)return;
    const p=storage.getProgress();
    const currentCompleted=p.completedLessons.includes(S.lesson?.id);
    if(!currentCompleted && !S.finished){
      const btn = $('btn-next-lesson-nav');
      btn.style.color='var(--wrong)';btn.style.borderColor='var(--wrong)';
      setTimeout(()=>{btn.style.color='';btn.style.borderColor='';},700);
      announceBlock('இந்தப் பாடத்தை முதலில் முடிக்கவும்','Finish the current lesson first');
      return;
    }
    startLesson(n);
  });

  const ta=$('typing-area');
  ta.addEventListener('keydown',onKeyDown);
  ta.addEventListener('keyup',onKeyUp);
  ta.addEventListener('focus',handleFocus);
  ta.addEventListener('blur',handleBlur);
  $('focus-overlay').addEventListener('click',()=>ta.focus());

  $('toggle-hints').addEventListener('change',e=>{
    storage.saveSettings({showHints:e.target.checked});
    const vm=storage.getSettings().viewMode;
    $('key-guide').classList.toggle('hint-hidden',!e.target.checked||vm>=2);
    $('kural-key-guide')?.classList.toggle('hint-hidden',!e.target.checked||vm>=2);
  });
  $('btn-close-lessons').addEventListener('click',()=>hideModal('modal-lessons'));
  $('modal-lessons').addEventListener('click',e=>{if(e.target===$('modal-lessons'))hideModal('modal-lessons');});
  $$('.lvl-tab').forEach(btn=>btn.addEventListener('click',()=>{activeLevelTab=btn.dataset.level;$$('.lvl-tab').forEach(b=>b.classList.toggle('active',b===btn));renderLessonList(activeLevelTab);}));
  $('btn-close-finger').addEventListener('click',closeFingerGuide);
  $('modal-finger').addEventListener('click',e=>{if(e.target===$('modal-finger'))closeFingerGuide();});
  $('btn-close-results')?.addEventListener('click',()=>hideModal('modal-results'));
  $('btn-retry').addEventListener('click',()=>{hideModal('modal-results');restartLesson();});
  $('btn-back-lessons').addEventListener('click',()=>{hideModal('modal-results');openLessonsModal();});
  $('modal-results').addEventListener('click',e=>{if(e.target===$('modal-results'))hideModal('modal-results');});

  $$('.tab-btn').forEach(btn=>btn.addEventListener('click',async()=>{
    const tab=btn.dataset.tab;
    activeTab=tab;
    setActiveTabSession(tab);
    syncTabSelected(tab);
    $('practice-main').classList.toggle('hidden',tab!=='practice');
    $('kural-main').classList.toggle('hidden',tab!=='kural');
    $('report-main').classList.toggle('hidden',tab!=='report');
    const ltb=$('lesson-title-bar');if(ltb)ltb.style.display=tab==='practice'?'':'none';
    const kb=$('keyboard');
    if(kb){if(tab==='kural')$('kural-kb-slot')?.appendChild(kb);else if(tab==='practice')$('practice-main')?.appendChild(kb);}
    if(tab==='kural'){
      $('lesson-title-bar').textContent='திருக்குறள்';
      try{await loadKural();}catch(e){
        console.warn('kural load failed',e);
        const km=$('kural-meta');
        if(km)km.textContent='ஏற்ற முடியவில்லை — இணைப்பைச் சரிபார்த்து தாவலை மீண்டும் அழுத்தவும். Couldn\'t load — check connection and click the tab again.';
        return;
      }
      applyViewMode(storage.getSettings().viewMode);
      window.dispatchEvent(new CustomEvent('kural-tab-activated'));
    }else if(tab==='report'){
      $('lesson-title-bar').textContent='அறிக்கை';
      storage.flushKeyData(); // report reads keydata — persist the buffer first
      let m;
      try{m=await loadReport();}catch(e){
        console.warn('report load failed',e);
        const rm=$('report-main');
        if(rm)rm.textContent='ஏற்ற முடியவில்லை — இணைப்பைச் சரிபார்த்து தாவலை மீண்டும் அழுத்தவும். Couldn\'t load — check connection and click the tab again.';
        return;
      }
      m.renderReport();
    }else{
      // Restore lesson title when returning to practice tab
      if(S.lesson){
        $('lesson-title-bar').textContent=S.lesson.title;
        $('lesson-label').textContent=S.lesson.title;
      }
      applyViewMode(storage.getSettings().viewMode);
      setTimeout(()=>ta.focus(),60);
    }
  }));

  $('btn-reset-data')?.addEventListener('click',()=>{
    if(!confirm('எல்லா முன்னேற்றமும் புள்ளிவிவரங்களும் நீக்கப்படும். தொடரவா?\n\nThis will erase all progress, stats and settings stored in this browser. Continue?'))return;
    storage.clearAll();   // also cancels the pending keydata flush so nothing is resurrected
    try{sessionStorage.removeItem('activeTab');}catch{}
    location.reload();
  });

  initInfoModal();

  // Tour — lazily loaded. The 31 KB module is only needed on a first visit
  // or when the user explicitly clicks the tour button, so it is kept off
  // the initial page load entirely.
  {
    let tourPromise = null;   // cache the promise so warm-up + click share one initTour()
    const loadTour = () => (tourPromise ??= import('./tour.js?v=20261109').then(m => { m.initTour(storage); return m; })
      .catch(e => { tourPromise = null; throw e; }));
    const openTour = async () => {
      try { await loadTour(); } catch (e) { console.warn('tour load failed', e); return; }
      window.startTour?.();
    };
    $('btn-tour')?.addEventListener('click', openTour);
    // First visit: fetch during idle time, then auto-start as before.
    if (!storage.getTourSeen()) {
      const warm = () => { loadTour().catch(e => console.warn('tour load failed', e)); };
      'requestIdleCallback' in window
        ? requestIdleCallback(warm, { timeout: 1500 })
        : setTimeout(warm, 300);
    }
  }

  // Restore last active tab from session (survives refresh)
  {
    const savedTab = getActiveTabSession();
    if (savedTab && savedTab !== 'practice') {
      const tabBtn = document.querySelector(`[data-tab="${savedTab}"]`);
      if (tabBtn) tabBtn.click();
    }
  }

}

function syncThemeIcon(themeOrId){
  const theme=THEMES?.find(t=>t.id===themeOrId);
  const isDark=theme?theme.dark:themeOrId==='dark';
  $('icon-sun').style.display=isDark?'block':'none';
  $('icon-moon').style.display=!isDark?'block':'none';
}

function initThemePicker(){
  const $picker=$('btn-theme-picker');
  const $modal=$('modal-theme');
  const $close=$('btn-close-theme');
  const $grid=$('theme-grid');
  const $customSection=$('theme-custom-section');
  const $customGrid=$('theme-custom-grid');

  if($picker)$picker.addEventListener('click',()=>{
    buildThemeGrid();showModal('modal-theme');
  });
  if($close)$close.addEventListener('click',()=>hideModal('modal-theme'));
  $modal?.addEventListener('click',e=>{if(e.target===$modal)hideModal('modal-theme');});

  $('btn-theme-save')?.addEventListener('click',()=>{
    const customVars={};
    THEME_CUSTOMIZABLE_VARS.forEach(({key})=>{
      const input=$customGrid?.querySelector(`[data-var="${key}"]`);
      if(input)customVars[key]=input.value;
    });
    // font selects use <select> elements; collect separately
    $customGrid?.querySelectorAll('.theme-font-select').forEach(sel=>{
      customVars[sel.dataset.var]=sel.value;
    });
    const accent=customVars['--accent']??'#c47d56';
    customVars['--accent-dim']=hexToRgba(accent,0.12);
    customVars['--hint-fill']=hexToRgba(customVars['--cursor-bar']??'#9d99d8',0.45);
    customVars['--shift-fill']=hexToRgba(customVars['--warn']??'#c99a50',0.4);
    customVars['--bg-hover']=customVars['--bg-raised']??'#242424';
    customVars['--border-sub']=customVars['--border']??'#333';
    customVars['--corrected']=customVars['--cursor-bar']??'#6ba8e0';
    storage.saveCustomTheme(customVars);
    storage.saveSettings({themeId:'custom'});
    applyTheme('custom',customVars);
    buildThemeGrid();syncThemeIcon('custom');
  });

  $('btn-theme-reset')?.addEventListener('click',()=>{
    buildCustomGrid(THEMES.find(t=>t.id==='dark').vars);
  });

  function buildThemeGrid(){
    if(!$grid)return;
    const s=storage.getSettings();
    const activeId=s.themeId??s.theme??'dark';
    $grid.innerHTML=THEMES.map(theme=>{
      const v=theme.vars??THEMES.find(t=>t.id==='dark').vars;
      const isActive=theme.id===activeId;
      return `<button class="theme-card${isActive?' active':''}" data-theme-id="${theme.id}">
        <div class="theme-swatch">
          <span style="background:${v['--bg']}"></span>
          <span style="background:${v['--accent']}"></span>
          <span style="background:${v['--correct']}"></span>
          <span style="background:${v['--bg-raised']??v['--bg-alt']}"></span>
        </div>
        <span class="theme-card-tamil">${theme.tamil ?? theme.name}</span>
        <span class="theme-card-en">${theme.name}</span>
      </button>`;
    }).join('');

    $grid.querySelectorAll('.theme-card').forEach(card=>{
      card.addEventListener('click',()=>{
        const id=card.dataset.themeId;
        if(id==='custom'){
          const currentVars=storage.getCustomTheme()??THEMES.find(t=>t.id==='dark').vars;
          buildCustomGrid(currentVars);
          $customSection?.classList.remove('hidden');
        }else{
          $customSection?.classList.add('hidden');
          storage.saveSettings({themeId:id,theme:THEMES.find(t=>t.id===id)?.dark?'dark':'light'});
          applyTheme(id,null);
          syncThemeIcon(id);
          buildThemeGrid();
        }
      });
    });

    if(activeId==='custom'){
      const vars=storage.getCustomTheme()??THEMES.find(t=>t.id==='dark').vars;
      buildCustomGrid(vars);
      $customSection?.classList.remove('hidden');
    }
  }

  function buildCustomGrid(vars){
    if(!$customGrid)return;
    $customGrid.innerHTML=THEME_CUSTOMIZABLE_VARS.map(({key,label,type,options})=>{
      if(type==='font'){
        const current=vars[key]??options[0].value;
        const optHtml=options.map(o=>`<option value="${o.value}"${o.value===current?' selected':''}>${o.label}</option>`).join('');
        return `<div class="theme-color-row">
          <label>${label}</label>
          <select class="theme-font-select" data-var="${key}">${optHtml}</select>
        </div>`;
      }
      const val=vars[key]??'#888888';
      const hex=val.startsWith('#')?val:rgbToHex(val);
      return `<div class="theme-color-row">
        <label>${label}</label>
        <input type="color" class="theme-color-input" data-var="${key}" value="${hex}">
      </div>`;
    }).join('');
  }
}

function hexToRgba(hex,alpha){
  const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${alpha})`;
}
function rgbToHex(color){
  const m=color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if(!m)return'#888888';
  return'#'+[m[1],m[2],m[3]].map(n=>parseInt(n).toString(16).padStart(2,'0')).join('');
}

// index.html imports this module dynamically, so DOMContentLoaded may already have fired.
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
else init();
