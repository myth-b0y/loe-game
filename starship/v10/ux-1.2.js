(()=>{
'use strict';
const R=window.SR,V=R?.V10;if(!R?.Game||!V)throw new Error('V1.2 card UX requires v10 runtime');
const GP=R.Game.prototype,$=s=>document.querySelector(s),clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const E=(t,c,h)=>{const e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e};
const rankName=r=>r>=7?'MAX':V.RANK_NAMES?.[r]||String(r||'');
const choiceKey=q=>`${q?.kind||''}:${q?.id||''}:${q?.rank||''}`;
const pct=(v,sign=true)=>{const n=Math.round((Number(v)||0)*100);return `${sign&&n>0?'+':''}${n}%`};

// v1.2 visual language: Core cards still rank I-VII, but are neutral grey and never carry bond symbols.
const oldDescribe=V.describeChoice;
V.describeChoice=(g,q)=>{
 const d=oldDescribe(g,q);
 if(q?.kind==='core'){d.symbol='';d.icon='';d.color='#7f8992'}
 return d;
};

// Preserve the current draft card shape while annotating exact choices for visible Auto selection.
const oldRenderDraft=V.renderDraft;
V.renderDraft=(g,picks,opt={})=>{
 oldRenderDraft(g,picks,opt);
 const cards=[...document.querySelectorAll('#cards .v110DraftCards .v110DraftCard')];
 cards.forEach((b,i)=>{
   const q=picks[i];if(!q)return;
   b.dataset.v120Choice=choiceKey(q);
   if(q.kind==='core'){
     b.classList.add('v120CoreCard');
     const icon=b.querySelector('.v110CardTop i');if(icon){icon.textContent='';icon.setAttribute('aria-hidden','true')}
   }
 });
};

// Auto should be watchable: choose, visibly commit, then take the card.
GP.autoChoose=function(){
 const offer=this._v110Offer;if(!offer?.picks?.length||this._v120AutoPickPending)return;
 const q=offer.picks.slice().sort((a,b)=>V.scoreChoice(this,b)-V.scoreChoice(this,a))[0];
 const key=choiceKey(q),button=document.querySelector(`#cards [data-v120-choice="${CSS.escape(key)}"]`);
 this._v120AutoPickPending=true;
 if(button){button.classList.add('v120AiPick');button.setAttribute('aria-selected','true')}
 const delay=offer.opt?.prep?280:760;
 setTimeout(()=>{
   this._v120AutoPickPending=false;
   const current=this._v110Offer;
   if(current!==offer||!current?.picks?.some(x=>choiceKey(x)===key))return;
   V.applyChoice(this,q,{prep:!!offer.opt?.prep});
 },delay);
};

const coreStats=g=>{
 V.recomputeCore?.(g);
 const m=g.mods||{},hp=Math.max(0,Math.round(Number(g.hp)||0)),maxHp=Math.max(0,Math.round(Number(g.maxHp)||0));
 const sh=Math.max(0,Math.round(Number(g.shield)||0)),maxSh=Math.max(0,Math.round(Number(g.maxShield)||0));
 return [
   ['⚔','DMG',pct((Number(m.damage)||1)-1)],
   ['»','RATE',pct((Number(m.rate)||1)-1)],
   ['✦','CRIT',pct(Number(m.crit)||0,false)],
   ['♥','HULL',`${hp}/${maxHp}`],
   ['◈','SHLD',`${sh}/${maxSh}`],
   ['◎','REPAIR',pct((V.repairMultiplier?.(g)||1)-1)],
   ['◌','AOE',pct((Number(m.aoe)||1)-1)],
   ['⌁','CD',`-${Math.max(0,Math.round((1-(V.tacticalCooldownMultiplier?.(g)||1))*100))}%`]
 ];
};

const buildEntries=g=>{
 const out=[];
 for(const e of V.EVOLUTIONS)if(V.evoOn(g,e.id))out.push({type:'evolution',id:e.id,name:e.name,symbol:e.symbol,rank:'EVOLUTION',desc:e.desc,color:'prismatic'});
 for(const p of V.PATHS){const rr=V.rank(g,p.id);if(rr>0)out.push({type:'path',id:p.id,name:p.name,symbol:p.symbol,rank:rankName(rr),desc:p.desc,color:V.RANK_COLORS[rr]})}
 for(const c of V.CORES){const rr=V.coreRank(g,c.id);if(rr>0){const val=V.rankValue(c.values,rr);out.push({type:'core',id:c.id,name:c.name,symbol:'',rank:rankName(rr),desc:c.format(val),color:'#7f8992'})}}
 return out;
};

const buildSymbols=g=>{
 const active=[];
 for(const p of V.PATHS)if(V.rank(g,p.id)>0)active.push(p.symbol);
 const counts={};for(const s of active)counts[s]=(counts[s]||0)+1;
 const items=active.map(s=>({symbol:s,paired:counts[s]>=2,evolved:false}));
 for(const e of V.EVOLUTIONS)if(V.evoOn(g,e.id))items.push({symbol:e.symbol,paired:true,evolved:true});
 return items;
};

GP.showRunDeck=function(){
 if($('#v110Build'))return;
 const was=this.paused;this.paused=true;
 const entries=buildEntries(this),stats=coreStats(this),symbols=buildSymbols(this),o=E('div','v110BuildSheet');o.id='v110Build';
 const statHtml=stats.map(([icon,label,value])=>`<div><i>${esc(icon)}</i><small>${esc(label)}</small><b>${esc(value)}</b></div>`).join('');
 const symbolHtml=symbols.length?symbols.map(x=>`<i class="v120BuildSymbol ${x.paired?'paired':''} ${x.evolved?'evolved':''}">${x.evolved?'🌈':''}${esc(x.symbol)}</i>`).join(''):'<span class="v120NoBuildSymbols">◇</span>';
 o.innerHTML=`<div class="v110Build v120Build"><header><span><small>RUN BUILD</small><b>${entries.length} CARDS</b></span><div><button data-codex aria-label="Evolution Bible">◇</button><button data-close aria-label="Close">×</button></div></header><div class="v120BuildMeta"><div class="v120BuildStats">${statHtml}</div><div class="v120BuildSymbols" aria-label="Owned pairing symbols">${symbolHtml}</div></div><div class="v110Fan"></div><section class="v110Inspect"><small>${entries.length?'SELECT A CARD':'EMPTY DECK'}</small><b>${entries.length?'YOUR BUILD':'NO CARDS YET'}</b><p>${entries.length?'Tap a card in the fan to inspect it.':'Level up to begin shaping this run.'}</p></section></div>`;
 const fan=o.querySelector('.v110Fan'),inspect=o.querySelector('.v110Inspect'),n=entries.length,mid=(n-1)/2;
 const fanWidth=Math.min(Math.max(260,window.innerWidth-44),760),span=n>1?Math.min(44,Math.max(7,(fanWidth-138)/(n-1))):0;
 let focused=null,closed=false;
 const clearFocus=()=>{focused=null;fan.classList.remove('hasFocus');fan.querySelectorAll('.focus').forEach(x=>x.classList.remove('focus'));inspect.innerHTML=`<small>${entries.length?'SELECT A CARD':'EMPTY DECK'}</small><b>${entries.length?'YOUR BUILD':'NO CARDS YET'}</b><p>${entries.length?'Tap a card in the fan to inspect it.':'Level up to begin shaping this run.'}</p>`};
 entries.forEach((d,i)=>{
   const off=(i-mid)*span,rot=clamp((i-mid)*3.1,-28,28),classes=`card v110FanCard ${d.type==='evolution'?'v110EvoCard':d.type==='core'?'v110Core v120CoreCard':''}`;
   const b=E('button',classes);b.type='button';b.style.setProperty('--x',off+'px');b.style.setProperty('--rot',rot+'deg');b.style.setProperty('--rank',d.color);b.style.setProperty('--z',String(i+1));b.style.zIndex=String(i+1);
   const symbol=d.type==='core'?'':`<i>${esc(d.symbol)}</i>`;
   b.innerHTML=`<span class="v110CardTop ${d.type==='core'?'v120CoreTop':''}">${symbol}<em>${esc(d.rank)}</em></span><small>${d.type==='evolution'?'EVOLUTION':d.type==='core'?'CORE':'PATH'}</small><b>${esc(d.name)}</b>`;
   b.addEventListener('click',ev=>{ev.stopPropagation();if(focused===b){clearFocus();return}fan.querySelectorAll('.focus').forEach(x=>x.classList.remove('focus'));focused=b;fan.classList.add('hasFocus');b.classList.add('focus');inspect.innerHTML=`<small>${d.type==='evolution'?'EVOLUTION':d.type==='core'?'CORE':'PATH'} · ${esc(d.rank)}</small><b>${esc(d.name)}</b><p>${esc(d.desc)}</p>`});
   fan.append(b);
 });
 fan.addEventListener('click',ev=>{if(ev.target===fan)clearFocus()});
 const close=()=>{if(closed)return;closed=true;document.removeEventListener('keydown',onKey);o.classList.remove('show');setTimeout(()=>o.remove(),180);this.paused=was};
 const onKey=ev=>{if(ev.key==='Escape')close()};document.addEventListener('keydown',onKey);
 o.addEventListener('click',ev=>{if(ev.target===o)close()});
 o.querySelector('[data-close]').addEventListener('click',ev=>{ev.stopPropagation();close()});
 o.querySelector('[data-codex]').addEventListener('click',ev=>{ev.stopPropagation();V.openCodex(this)});
 document.body.append(o);requestAnimationFrame(()=>o.classList.add('show'));
};

// Keep the visible version label synchronized even if an older UI layer rendered before v1.2 finished loading.
V.syncVersionLabel=()=>{
 R.VERSION='1.2.0';
 for(const el of document.querySelectorAll('#app *')){
   if(el.children.length)continue;
   const t=String(el.textContent||'').trim();
   if(/^(?:VERSION\s*)?V?(?:0\.9\.9|1\.1\.0)$/i.test(t))el.textContent=t.toUpperCase().startsWith('VERSION')?'VERSION 1.2.0':(t.toLowerCase().startsWith('v')?'v1.2.0':'1.2.0');
 }
};
V.syncVersionLabel();setTimeout(V.syncVersionLabel,0);setTimeout(V.syncVersionLabel,250);
})();
