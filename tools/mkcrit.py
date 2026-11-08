# Regenerates the inline critical CSS for index.html from styles/style.css.
# Usage (from repo root): python3 tools/mkcrit.py > /tmp/critical.css
# then replace the critical block inside the inline <style> in index.html.
import re,sys,os
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
css=open(os.path.join(ROOT,'styles','style.css'),encoding='utf-8').read()
# strip comments (keeps rules verbatim, comments omitted)
nc=re.sub(r'/\*.*?\*/','',css,flags=re.S)
def blocks(text):
    out=[];i=0;n=len(text)
    while i<n:
        while i<n and text[i].isspace(): i+=1
        if i>=n:break
        j=text.index('{',i); sel=text[i:j].strip(); depth=1;k=j+1
        while depth:
            c=text[k]
            if c=='{':depth+=1
            elif c=='}':depth-=1
            k+=1
        out.append((sel,text[j+1:k-1].strip())); i=k
    return out
EXACT={':root','[data-theme="light"]','*, *::before, *::after','html','body','#app','#navbar','#logo','#nav-right','.icon-btn',
'.nav-pill-btn','.nav-pill-btn svg','#btn-view-icon','.nav-sep','.hints-label','.mini-toggle','.mini-toggle input','.mt-track','.mt-track::before',
'.hints-label:has(input:not(:checked)) > span:first-child','.mini-toggle input:checked + .mt-track','.mini-toggle input:checked + .mt-track::before',
'#tab-bar','.tab-btn','.tab-btn.active','.tab-list','#lesson-title-bar','#practice-main, #kural-main','#top-bar','#stats-strip',
'.tb-stat','.tb-val','.tb-val-sm','.tb-lbl','.tb-div','.tb-goal','.tb-goal-track','.tb-goal-fill','.tb-goallbl','.tb-secondary',
'#top-right-nav','#stat-time','#lesson-counter','.nav-btn','.nav-btn:disabled','#key-panel','#key-panel.hidden',
'#progress-row','#lesson-label','#progress-track','#progress-fill','#progress-text',
'#typing-wrapper','#focus-overlay','#focus-overlay.hidden','#focus-overlay span','#typing-area','#typing-wrapper::after',
'#lesson-container','.word','.char','#key-guide','#key-guide.hint-hidden','#keyboard','#keyboard svg','#footer','#footer a',
'.char.current','.char.current::after','.char.space-char','.char-syl','.char-syl.current::after','.modal-overlay','.modal-overlay.visible','.hidden','#kb-lang-banner.hidden','#mobile-gate'}
import re as _re
DYN=_re.compile(r'(^|[ ,])(\[data-theme="light"\] )?\.(kp-|leg-|hk|shift-badge)')
def want(s): return s in EXACT or s in INNER_EXTRA or bool(DYN.search(s))
def keep_inner(inner):
    return [(s,b) for s,b in blocks(inner) if want(s)]
INNER_EXTRA={'#tab-bar, #navbar','#navbar, #tab-bar','.nav-pill-btn span','.nav-pill-btn','#lesson-title-bar','.hints-label > span:first-child','#btn-tour','#top-bar','#top-right-nav','#lesson-counter','#stat-time','.nav-btn','#footer','#key-panel','#typing-area','#btn-info','#btn-finger','.tab-btn','.tb-goal','#nav-right','.nav-sep',
 'html:not([data-desktop-override]) #app','html[data-desktop-override] #mobile-gate','html:not([data-desktop-override]) #mobile-gate','.mg-card','.mg-logo','.mg-title','.mg-body','.mg-body strong','.mg-figure','.mg-figure img','.mg-figure figcaption','.mg-cta','.mg-cta-icon','.mg-rule','.mg-en','.mg-en strong','.mg-continue','.mg-continue:focus-visible','.mg-continue-en',
 '#practice-main, #kural-main','#practice-main[data-view="1"] #typing-area','#practice-main[data-view="2"] #typing-area'}
SKIP_IN_MEDIA_MAIN=set()
out=[]
def mini(s): return re.sub(r'\s+',' ',s).strip()
for sel,body in blocks(nc):
    if sel.startswith('@media'):
        if 'print' in sel or 'reduced-motion' in sel: continue
        inner=keep_inner(body)
        # for mobile gate media keep all
        if 'pointer: coarse' in sel:
            inner=blocks(body)
        if inner:
            out.append(sel+'{'+''.join(f'{s}{{{mini(b)}}}' for s,b in inner)+'}')
    elif want(sel):
        out.append(f'{sel}{{{mini(body)}}}')
    elif sel=='@keyframes blink': out.append(f'{sel}{{{mini(body)}}}')
s='\n'.join(out)
s=re.sub(r'\s*([{};,>])\s*',r'\1',s); s=re.sub(r': ',':',s); s=s.replace(';}','}')
RESERVE='#key-panel{min-height:7.4rem}@media (max-height:820px){#key-panel{min-height:6.4rem}}@media (max-height:780px){#key-panel{min-height:6.2rem}}'
s=s+RESERVE
sys.stdout.write(s)
print(len(s),'bytes', len(out),'rules',file=sys.stderr)
