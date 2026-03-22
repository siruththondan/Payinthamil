/**
 * practice.js — keybr-style Tamil typing practice.
 * Single-span composed-form syllable rendering with CSS gradient partial state.
 */

import { storage }                                   from './storage.js';
import { MAPPING, tamilOf, hintLabel, needsShift }   from './mapping.js';
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
         initTopBar, renderTopBar, renderKeyPanel }   from './metrics.js';
import { initKural, adjustKuralWidth } from './thirukkural.js';

/* ── Tamil99 maps ─────────────────────────────── */
const STANDALONE = {
  // Vowels (left hand)
  a:'அ', q:'ஆ', s:'இ', w:'ஈ', d:'உ', e:'ஊ', g:'எ', t:'ஏ', r:'ஐ', c:'ஒ', x:'ஓ', z:'ஔ',
  // Pulli
  f:'்',
  // Consonants (right hand)
  h:'க', b:'ங', '[':'ச', ']':'ஞ', o:'ட', p:'ண', l:'த', ';':'ந',
  i:'ன', j:'ப', k:'ம', "'":'ய', m:'ர', n:'ல', v:'வ', '/':'ழ', y:'ள', u:'ற',
  // Grantha (Shift)
  Q:'ஸ', W:'ஷ', E:'ஜ', R:'ஹ', T:'க்ஷ', Y:'ஸ்ரீ', F:'ஃ',
  // Tamil accounting symbols (Shift + home/bottom row)
  A:'₹',   // ரூபாய் (rupee)
  Z:'௳',   // நாள் (day)
  X:'௴',   // மாதம் (month)
  C:'௵',   // ஆண்டு (year)
  V:'௶',   // பற்று (debit)
  B:'௷',   // கடன் (credit)
  D:'௸',   // மேலே (as above/ditto)
  S:'௺',   // எண் (number sign)
};
const MATRA = {q:'ா',s:'ி',w:'ீ',d:'ு',e:'ூ',g:'ெ',t:'ே',r:'ை',c:'ொ',x:'ோ',z:'ௌ'};
const SYL_CONS = new Set(['h','j','k','l',';',"'",'n','v','u','i','o','p','[',']','b','y','/','m','Q','W','E','R','F']);
const SYL_VOW  = new Set(['q','s','w','d','e','g','t','r','c','x','z','f']);
// Matra position for CSS gradient direction
const VOWEL_TYPE = {q:'right',s:'top',w:'top',d:'bottom',e:'bottom',g:'left',t:'left',r:'right',c:'left',x:'left',z:'right',f:'dot'};

function composedForm(c,v){ return (STANDALONE[c]??c)+(v==='f'?'்':(MATRA[v]??'')); }

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
      syls.push({keys:[k],display:STANDALONE[k]??k,start:i});
      map[i]=si;i++;
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

/* ── State ─────────────────────────────────────── */
const S={
  lesson:null,content:[],pointer:0,totalKeys:0,correctKeys:0,hadErrorHere:false,
  startTime:null,pausedAt:null,elapsedMs:0,
  timerInt:null,hintTimeout:null,metricsInt:null,finished:false,
  syllables:[],sylMap:[],sylErrors:{},
};
const HINT_DELAY=2000;

function calcWpm(){
  if(!S.startTime||S.correctKeys<3)return 0;
  const ms=(Date.now()-S.startTime)+S.elapsedMs;
  const mins=ms/60000;
  return mins<0.08?0:Math.round((S.correctKeys/5)/mins);
}

const $=id=>document.getElementById(id);
const $$=sel=>document.querySelectorAll(sel);
const showModal=id=>$(id).classList.add('visible');
const hideModal=id=>$(id).classList.remove('visible');

/* ── Active tab tracker ─────────────────────────── */
let activeTab = 'practice';

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
const VIEW_TITLES_PRACTICE=['Hide keyboard','Larger text','Zen mode'];
const VIEW_TITLES_KURAL=['Hide keyboard','Larger text','Zen mode'];

function applyViewMode(mode){
  $('btn-view').innerHTML=VIEW_ICONS[mode];
  if(activeTab==='kural'){
    setVisible(mode===0);
    const km=$('kural-main');
    if(km){
      km.dataset.view=mode;
      // Set CSS vars on kural-main — both #kural-typing-area and
      // #kural-container inherit these for responsive height & font size
      km.style.setProperty('--kural-sz', KURAL_SIZES[mode]);
      km.style.setProperty('--urai-sz',  KURAL_URAI_SIZES[mode]);
    }
    $('btn-view').title=VIEW_TITLES_KURAL[mode];
    // Re-measure kural line widths after zoom changes font size.
    // Two rAFs: first lets CSS vars apply & reflow, second measures accurately.
    requestAnimationFrame(() => requestAnimationFrame(adjustKuralWidth));
  }else{
    document.documentElement.style.setProperty('--char-size',CHAR_SIZES[mode]);
    const s=storage.getSettings();
    setVisible(mode===0);
    $('key-guide').classList.toggle('hint-hidden',mode>=2||!s.showHints);
    $('key-panel').classList.toggle('hidden',mode>=2);
    $('btn-view').title=VIEW_TITLES_PRACTICE[mode];
    $('practice-main').dataset.view=mode;
  }
}
function cycleView(){
  const next=(storage.getSettings().viewMode+1)%3;
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
      `<kbd class="hk ${done===0?'':'hk-next'}">${hintLabel(k2)}</kbd>`+
      `<span class="hk-sep">→</span>`+
      `<span class="hk-char">${syl.composed}</span>`+
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
  renderTopBar();
  renderKeyPanel($('key-panel'),S.content[0]??'',lesson.focusKeys??[]);
  setTimeout(()=>{$('typing-area').focus();handleFocus();},60);
}
function restartLesson(){if(S.lesson)startLesson(S.lesson);}
function refreshMetrics(){renderTopBar();renderKeyPanel($('key-panel'),S.content[S.pointer]??'',S.lesson?.focusKeys??[]);}

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
  if(S.finished)return;
  if(e.key==='Shift'){setShiftActive(true);return;}
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
  if(S.pointer>=S.content.length){finishLesson();return;}
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
function startTimer(){
  S.startTime=Date.now();S.pausedAt=null;
  S.timerInt=setInterval(()=>{
    const ms=(Date.now()-S.startTime)+S.elapsedMs;
    $('stat-time').textContent=fmtTime(ms/1000);renderTopBar();
  },1000);
  S.metricsInt=setInterval(()=>{renderKeyPanel($('key-panel'),S.content[S.pointer]??'',S.lesson?.focusKeys??[]);storage.addDailySeconds(3);},3000);
}
function pauseTimer(){
  if(!S.startTime||S.pausedAt||S.finished)return;
  S.pausedAt=Date.now();S.elapsedMs+=(S.pausedAt-S.startTime);S.startTime=null;
  clearInterval(S.timerInt);clearInterval(S.metricsInt);
}
function resumeTimer(){
  if(!S.pausedAt||S.finished)return;
  S.pausedAt=null;S.startTime=Date.now();
  S.timerInt=setInterval(()=>{
    const ms=(Date.now()-S.startTime)+S.elapsedMs;
    $('stat-time').textContent=fmtTime(ms/1000);renderTopBar();
  },1000);
  S.metricsInt=setInterval(()=>{renderKeyPanel($('key-panel'),S.content[S.pointer]??'',S.lesson?.focusKeys??[]);storage.addDailySeconds(3);},3000);
}

const fmtTime=s=>`${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,'0')}`;
function updateStats(){updateProgress();renderTopBar();}
function resetStats(){
  $('stat-time').textContent='0:00';$('progress-fill').style.width='0%';
  $('progress-text').textContent=`0 / ${S.content.length}`;renderTopBar();
}
function updateProgress(){const p=Math.round((S.pointer/S.content.length)*100);$('progress-fill').style.width=p+'%';$('progress-text').textContent=`${S.pointer} / ${S.content.length}`;}

/* ── Focus / blur ────────────────────────────────── */
function handleFocus(){
  $('focus-overlay').classList.add('hidden');
  if(S.pausedAt)resumeTimer();
  updateHintBar();scheduleHint();
}
function handleBlur(){
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
  storage.recordResult(S.lesson.id,wpm,accuracy,S.totalKeys,S.correctKeys);refreshMetrics();
  $('results-wpm').textContent=wpm;$('results-accuracy').textContent=accuracy+'%';
  $('results-time').textContent=fmtTime(timeSec);
  $('results-stars').textContent='★'.repeat(stars)+'☆'.repeat(3-stars);
  $('result-msg').textContent=stars>=3?'நன்று! Excellent!':stars>=2?'நல்லது! Well done!':stars>=1?'தொடர்க! Keep going!':'மீண்டும் முயற்சி!';
  const next=getNextLesson(S.lesson.id),nxt=$('btn-next-lesson');
  if(next){nxt.textContent=`${next.title} →`;nxt.style.display='';nxt.onclick=()=>{hideModal('modal-results');startLesson(next);};}
  else nxt.style.display='none';
  setTimeout(()=>showModal('modal-results'),380);
}

/* ── Lessons modal ───────────────────────────────── */
let activeLevelTab='beginner';
function openLessonsModal(){renderLessonList(activeLevelTab);showModal('modal-lessons');}

function lessonDisplayChars(lesson){
  const uyirIds=new Set(['b13','b14','b15','b16','b17','i01','i02','i03','i04','i05']);
  if(uyirIds.has(lesson.id)){
    const c=lesson.focusKeys.find(k=>SYL_CONS.has(k));
    if(c)return['q','s','w','d','e','g','t','r'].slice(0,6).map(v=>composedForm(c,v)).join(' ');
  }
  return lesson.focusKeys
    .filter(k=>k!=='f'&&k!==' ')
    .slice(0,7)
    .map(k=>MAPPING[k]??(k.length===1?(STANDALONE[k]??''):''))
    .filter(Boolean).join(' ');
}

function switchToPracticeTab(){
  activeTab='practice';
  $$('.tab-btn').forEach(b=>b.classList.toggle('active',b.dataset.tab==='practice'));
  $('practice-main').classList.remove('hidden');
  $('kural-main').classList.add('hidden');
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

function renderLessonList(level){
  const listEl=$('lesson-list'),progress=storage.getProgress(),lessons=LESSONS_DB[level];
  listEl.innerHTML='';
  lessons.forEach((lesson,idx)=>{
    const done=progress.completedLessons.includes(lesson.id),best=progress.lessonBests[lesson.id];
    const locked=idx>0&&!progress.completedLessons.includes(lessons[idx-1].id),isCur=S.lesson?.id===lesson.id;
    const row=document.createElement('button');
    row.className=`lesson-row${isCur?' is-current':''}${locked?' locked':''}`;
    row.innerHTML=`<span class="row-num">${String(lesson.order).padStart(2,'0')}</span><span class="row-chars">${lessonDisplayChars(lesson)||lesson.title}</span><span class="row-right">${isCur?'<span class="row-dot"></span>':''}${done&&best?`<span class="row-wpm">${best.wpm}</span><span class="row-done">✓</span>`:''}${locked?'<span style="opacity:.25">🔒</span>':''}</span>`;
    if(!locked)row.addEventListener('click',()=>{
      // Same guard as the nav arrow: if mid-lesson (typed but not finished), block
      if(S.pointer > 0 && !S.finished && S.lesson?.id !== lesson.id){
        hideModal('modal-lessons');
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
const NON_ENGLISH_KEYS = new Set([
  // Tamil Unicode ranges, Devanagari, Arabic, Chinese, etc.
]);
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
    $btn.addEventListener('click', () => $modal.classList.add('visible'));
    $close?.addEventListener('click', () => $modal.classList.remove('visible'));
    $modal.addEventListener('click', e => { if (e.target === $modal) $modal.classList.remove('visible'); });
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
  await loadKeyboard('keyboard');
  const s=storage.getSettings();
  initTopBar($('stats-strip'));
  document.documentElement.setAttribute('data-theme',s.theme);
  applyViewMode(s.viewMode);syncThemeIcon(s.theme);
  $('toggle-hints').checked=s.showHints;

  const p=storage.getProgress();
  const startL=p.lastLessonId?(getLessonById(p.lastLessonId)??getFirstIncomplete(p.completedLessons)):getFirstIncomplete(p.completedLessons);
  startLesson(startL);
  if(shouldAutoShow())setTimeout(()=>openFingerGuide(),800);

  $('btn-view').addEventListener('click',cycleView);
  $('btn-lessons').addEventListener('click',openLessonsModal);
  $('btn-finger').addEventListener('click',openFingerGuide);
  $('btn-theme').addEventListener('click',()=>{
    const cur=storage.getSettings().theme,nxt=cur==='dark'?'light':'dark';
    storage.saveSettings({theme:nxt});document.documentElement.setAttribute('data-theme',nxt);syncThemeIcon(nxt);
  });
  $('logo').addEventListener('click',openLessonsModal);
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
    // Lock: once you've typed even one character (pointer > 0), you must finish the lesson.
    // Allowed only when: lesson not yet started (pointer === 0) OR lesson finished.
    if(S.pointer > 0 && !S.finished){
      const btn = $('btn-next-lesson-nav');
      btn.style.color='var(--wrong)';btn.style.borderColor='var(--wrong)';
      setTimeout(()=>{btn.style.color='';btn.style.borderColor='';},700);
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
  });
  $('btn-close-lessons').addEventListener('click',()=>hideModal('modal-lessons'));
  $('modal-lessons').addEventListener('click',e=>{if(e.target===$('modal-lessons'))hideModal('modal-lessons');});
  $$('.lvl-tab').forEach(btn=>btn.addEventListener('click',()=>{activeLevelTab=btn.dataset.level;$$('.lvl-tab').forEach(b=>b.classList.toggle('active',b===btn));renderLessonList(activeLevelTab);}));
  $('btn-close-finger').addEventListener('click',closeFingerGuide);
  $('modal-finger').addEventListener('click',e=>{if(e.target===$('modal-finger'))closeFingerGuide();});
  $('btn-retry').addEventListener('click',()=>{hideModal('modal-results');restartLesson();});
  $('btn-back-lessons').addEventListener('click',()=>{hideModal('modal-results');openLessonsModal();});
  $('modal-results').addEventListener('click',e=>{if(e.target===$('modal-results'))hideModal('modal-results');});

  initKural();

  $$('.tab-btn').forEach(btn=>btn.addEventListener('click',()=>{
    const tab=btn.dataset.tab;
    activeTab=tab;
    $$('.tab-btn').forEach(b=>b.classList.toggle('active',b===btn));
    $('practice-main').classList.toggle('hidden',tab!=='practice');
    $('kural-main').classList.toggle('hidden',tab!=='kural');
    const kb=$('keyboard');
    if(kb){if(tab==='kural')$('kural-kb-slot')?.appendChild(kb);else $('practice-main')?.appendChild(kb);}
    if(tab==='kural'){
      applyViewMode(storage.getSettings().viewMode);
      window.dispatchEvent(new CustomEvent('kural-tab-activated'));
    }else{
      // BUG FIX: restore lesson title bar when returning to practice tab
      if(S.lesson){
        $('lesson-title-bar').textContent=S.lesson.title;
        $('lesson-label').textContent=S.lesson.title;
      }
      applyViewMode(storage.getSettings().viewMode);
      setTimeout(()=>ta.focus(),60);
    }
  }));

  initInfoModal();
}

function syncThemeIcon(theme){
  $('icon-sun').style.display=theme==='dark'?'block':'none';
  $('icon-moon').style.display=theme==='light'?'block':'none';
}
document.addEventListener('DOMContentLoaded',init);