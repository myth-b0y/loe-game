(()=>{
'use strict';
const R=window.SR,V=R?.V10;if(!R?.Game||!V)throw new Error('V1.2.1 UX requires v10 runtime');
const GP=R.Game.prototype,$=s=>document.querySelector(s),clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
const RELEASE='1.2.1';
const choiceKey=q=>`${q?.kind||''}:${q?.id||''}:${q?.rank||''}`;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const E=(t,c,h)=>{const e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e};

// ---------------------------------------------------------------------------
// AUTO BUILD BRAIN
// Understand the visible symbol language without reading undiscovered recipe data.
// ---------------------------------------------------------------------------
const partnerFor=p=>V.PATHS.find(x=>x.id!==p?.id&&x.symbol===p?.symbol)||null;
const rawRank=(g,id)=>Math.max(0,Number(V.rawRank?.(g,id)??V.rank?.(g,id))||0);
const hpRatio=g=>clamp((Number(g.hp)||0)/Math.max(1,Number(g.maxHp)||1),0,1);
const shieldRatio=g=>clamp((Number(g.shield)||0)/Math.max(1,Number(g.maxShield)||1),0,1);

V.v121PairState=(g,pathId)=>{
 const p=V.PATH_BY_ID?.[pathId],partner=partnerFor(p);
 return{path:p||null,partner,rank:p?rawRank(g,p.id):0,partnerRank:partner?rawRank(g,partner.id):0,symbol:p?.symbol||''};
};

V.scoreChoice=(g,q)=>{
 if(!q)return-1e9;
 let score=0;const h=hpRatio(g),sh=shieldRatio(g);
 if(q.kind==='path'){
   const p=V.PATH_BY_ID?.[q.id];if(!p)return-1e9;
   const state=V.v121PairState(g,p.id),current=state.rank,next=Math.max(current+1,Number(q.rank)||1),mate=state.partnerRank;
   score=current>0?34:20;
   score+=next*2.5;
   // A real pair bonus exists only when the OTHER Path with this symbol is owned.
   if(mate>0){
     score+=current>0?34:52; // Taking the second half is a major strategic commitment.
     if(next>=7&&mate>=7)score+=140; // Complete the MAX + MAX pair now.
     else if(mate>=7)score+=62+next*2; // One half is waiting at MAX.
     else{
       const gap=mate-current;
       if(current>0&&gap>0)score+=18+Math.min(20,gap*5); // Catch the lagging half up.
       if(current>0&&gap<0)score-=Math.min(10,Math.abs(gap)*2); // Avoid wildly overfeeding one half.
       score+=Math.min(20,Math.min(next,mate)*2.5); // Reward a pair advancing together.
     }
   }
   // Emergency defensive Paths can interrupt the long-term plan, but only when
   // the current ship state actually needs them.
   if(sh<.28&&p.category==='shield')score+=sh<.12?95:42;
   if(h<.26&&['ship','defDrone','defSupport'].includes(p.category))score+=h<.14?70:30;
   // If the partner is not owned there is deliberately no symbol bonus. This fixes
   // the old bug where a Path could effectively count its own symbol as a partner.
 }else if(q.kind==='core'){
   score=12+(Number(q.rank)||1)*1.25;
   if(q.id==='hull')score+=h<.15?260:h<.28?110:h<.45?38:h<.65?12:0;
   if(q.id==='repairEfficiency')score+=h<.15?205:h<.28?88:h<.48?30:h<.7?8:0;
   if(q.id==='shield')score+=sh<.12?185:sh<.22?85:sh<.42?34:sh<.65?10:0;
   if(q.id==='damage'||q.id==='fireRate')score+=8;
   if(q.id==='crit')score+=5;
   if(q.id==='xp'&&(g.wave||0)<20)score+=6;
   if(q.id==='salvage'&&(g.wave||0)<28)score+=3;
 }else return-1e9;
 return score+Math.random()*1.5;
};

// Lightweight synth tones so the Auto cursor has the old boop-boop-BEEP personality.
let aiAudio=null;
const audioAllowed=g=>{
 const s=g?.s?.settings||{};return s.sound!==false&&s.sfx!==false&&s.audio!==false&&s.muted!==true;
};
const pulseTone=(freq,dur=.07,vol=.022,type='sine',delay=0)=>{
 try{
   const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
   aiAudio=aiAudio||new AC();if(aiAudio.state==='suspended')aiAudio.resume?.().catch(()=>{});
   const t=aiAudio.currentTime+delay,o=aiAudio.createOscillator(),a=aiAudio.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);a.gain.setValueAtTime(.0001,t);a.gain.exponentialRampToValueAtTime(vol,t+.008);a.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(a);a.connect(aiAudio.destination);o.start(t);o.stop(t+dur+.015);
 }catch{}
};
const aiSound=(g,final,index=0)=>{
 if(!audioAllowed(g))return;
 if(final){pulseTone(610,.075,.026,'sine');pulseTone(860,.09,.022,'sine',.055)}
 else pulseTone(315+index*48,.065,.018,'sine');
};

const draftButtons=()=>[...document.querySelectorAll('#cards .v110DraftCards .v110DraftCard')];
const clearAiCursor=()=>draftButtons().forEach(b=>b.classList.remove('v120AiPick','v121AiCursor','v121AiFinal'));

V.runAiDraftDecision=(g,{fast=false}={})=>{
 const offer=g?._v110Offer;if(!offer?.picks?.length||g._v121AutoPickPending)return false;
 const scored=offer.picks.map((q,i)=>({q,i,score:V.scoreChoice(g,q)})).sort((a,b)=>b.score-a.score),winner=scored[0];
 if(!winner)return false;
 g._v121AutoPickPending=true;g._v120AutoPickPending=true;
 const buttons=draftButtons(),moves=fast?3:3+Math.floor(Math.random()*4),sequence=[];
 let last=-1;
 for(let step=0;step<moves-1;step++){
   const pool=scored.slice(0,Math.min(3,scored.length)).filter(x=>x.i!==last&&!(step===moves-2&&x.i===winner.i));
   const chosen=pool.length?pool[Math.floor(Math.random()*pool.length)]:scored.find(x=>x.i!==last)||winner;
   sequence.push(chosen.i);last=chosen.i;
 }
 if(sequence.length&&sequence[sequence.length-1]===winner.i&&scored.length>1)sequence[sequence.length-1]=scored[1].i;
 sequence.push(winner.i);
 let step=0;
 const cancel=()=>{g._v121AutoPickPending=false;g._v120AutoPickPending=false;clearAiCursor();document.querySelectorAll('.v121AutoDraft').forEach(b=>b.disabled=false)};
 const advance=()=>{
   if(g._v110Offer!==offer){cancel();return}
   clearAiCursor();const idx=sequence[step],button=buttons[idx]||draftButtons()[idx],final=step===sequence.length-1;
   if(button){button.classList.add(final?'v121AiFinal':'v121AiCursor');button.setAttribute('aria-selected',final?'true':'false')}
   aiSound(g,final,idx);step++;
   if(final){
     setTimeout(()=>{
       if(g._v110Offer!==offer){cancel();return}
       g._v121AutoPickPending=false;g._v120AutoPickPending=false;
       V.applyChoice(g,winner.q,{prep:!!offer.opt?.prep});
     },fast?170:300);
   }else setTimeout(advance,fast?125:180+Math.random()*120);
 };
 document.querySelectorAll('.v121AutoDraft').forEach(b=>b.disabled=true);advance();return true;
};

GP.autoChoose=function(){return V.runAiDraftDecision(this,{fast:!!this._v110Offer?.opt?.prep})};

// Normal drafts can hand this ONE decision to Auto without enabling global Auto mode.
const renderDraft121=V.renderDraft;
V.renderDraft=(g,picks,opt={})=>{
 renderDraft121(g,picks,opt);
 const foot=$('#cards .v110DraftFoot');if(!foot||opt.prep||foot.querySelector('.v121AutoDraft'))return;
 const b=E('button','v110DraftTool v121AutoDraft','AUTO');b.type='button';b.setAttribute('aria-label','Auto choose this card draft');b.onclick=()=>g.autoChoose?.();foot.append(b);
};

// ---------------------------------------------------------------------------
// BUILD FOCUS LAYER
// Focused cards are physically moved to a foreground presentation above stats,
// symbols, fan, inspect panel and header rather than fighting local z-index.
// ---------------------------------------------------------------------------
const showRunDeck120=GP.showRunDeck;
GP.showRunDeck=function(...args){
 const out=showRunDeck120.apply(this,args),sheet=$('#v110Build'),build=sheet?.querySelector('.v110Build'),fan=sheet?.querySelector('.v110Fan');
 if(!sheet||!build||!fan||build.dataset.v121FocusReady)return out;
 build.dataset.v121FocusReady='1';build.classList.add('v121BuildForegroundHost');
 const layer=E('div','v121FocusLayer');layer.hidden=true;layer.innerHTML='<button class="v121FocusBackdrop" type="button" aria-label="Return card to deck"></button><div class="v121FocusSlot"></div>';build.append(layer);
 const slot=layer.querySelector('.v121FocusSlot'),back=layer.querySelector('.v121FocusBackdrop'),inspect=sheet.querySelector('.v110Inspect');
 const dismiss=()=>{layer.hidden=true;slot.innerHTML='';fan.classList.remove('hasFocus');fan.querySelectorAll('.focus').forEach(x=>x.classList.remove('focus'));if(inspect)inspect.innerHTML='<small>SELECT A CARD</small><b>YOUR BUILD</b><p>Tap a card in the fan to inspect it.</p>'};
 back.addEventListener('click',dismiss);
 for(const card of fan.querySelectorAll('.v110FanCard'))card.addEventListener('click',()=>requestAnimationFrame(()=>{
   if(!card.classList.contains('focus'))return;
   const clone=card.cloneNode(true);clone.classList.remove('focus');clone.classList.add('v121FocusCard');clone.style.removeProperty('--x');clone.style.removeProperty('--rot');clone.style.removeProperty('--z');clone.style.removeProperty('z-index');
   const desc=inspect?.querySelector('p')?.textContent||'';if(desc){const p=document.createElement('p');p.className='v121FocusDesc';p.textContent=desc;clone.append(p)}
   slot.innerHTML='';slot.append(clone);layer.hidden=false;clone.addEventListener('click',dismiss);
 }));
 return out;
};

// ---------------------------------------------------------------------------
// VERSION OWNERSHIP
// Older Foundation layers intentionally keep historical stamps. v1.2.1 owns the
// user-visible release label after all compatibility layers finish rendering.
// ---------------------------------------------------------------------------
V.syncVersionLabel=()=>{
 R.VERSION=RELEASE;V.VERSION=RELEASE;
 const root=document.getElementById('app');if(!root)return;
 for(const el of root.querySelectorAll('*')){
   if(el.children.length)continue;
   const t=String(el.textContent||'').trim();
   if(/^(?:VERSION\s*)?V?\d+\.\d+\.\d+$/i.test(t)){
     if(/^VERSION/i.test(t))el.textContent='VERSION '+RELEASE;
     else if(/^V/i.test(t))el.textContent='v'+RELEASE;
     else el.textContent=RELEASE;
   }
 }
};
let versionFrame=0;
const scheduleVersionSync=()=>{if(document.body.classList.contains('combat')||versionFrame)return;versionFrame=requestAnimationFrame(()=>{versionFrame=0;V.syncVersionLabel()})};
const appRoot=document.getElementById('app');if(appRoot)new MutationObserver(scheduleVersionSync).observe(appRoot,{childList:true,subtree:true,characterData:true});
V.syncVersionLabel();setTimeout(V.syncVersionLabel,300);setTimeout(V.syncVersionLabel,800);
})();
