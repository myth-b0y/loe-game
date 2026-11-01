(()=>{
'use strict';
const R=window.SR,V=R?.V10,X=R?.V130;if(!R?.Game||!V||!X)throw new Error('V1.3 UI requires reward runtime');
const GP=R.Game.prototype,$=s=>document.querySelector(s),clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const E=(t,c,h)=>{const e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e};
const rankName=r=>r>=7?'MAX':V.RANK_NAMES?.[r]||String(r||'');
const rankClass=r=>'v110R'+clamp(r,1,7);
const choiceKey=q=>`${q?.kind||''}:${q?.id||''}:${q?.rank||''}`;
const currentRank=(g,q)=>q.kind==='path'?Math.max(0,Number(V.rawRank?.(g,q.id))||0):q.kind==='core'?Math.max(0,Number(V.coreRank?.(g,q.id))||0):0;
const symbolCounts=g=>{const m={};for(const q of V.ownedSymbols?.(g)||[])m[q]=(m[q]||0)+1;return m};

V.renderDraft=(g,picks,opt={})=>{
 const root=$('#cards');if(!root)return;const owned=symbolCounts(g),prep=!!opt.prep,luck=X.luck(g),ban=X.banishAvailable(g);
 root.innerHTML='';root.classList.add('show','v110Show');
 const shell=E('div',`v110Draft v130Draft ${picks.length>3?'v130Wide':''}`);shell.style.setProperty('--draft-count',String(picks.length));
 const head=E('header','v110DraftHead v130DraftHead',`<span><small>${prep?`CHECKPOINT PREP ${opt.prepIndex||1} / ${opt.prepTotal||1}`:'LEVEL '+(g.level||1)}</small><b>${prep?'PREP BUILD':'CHOOSE UPGRADE'}</b></span><span class="v130DraftMeta"><i>✦ ${luck}</i><i>⊘ ${ban}</i></span>`);shell.append(head);
 const strip=E('div','v110Symbols');for(const [sym,n] of Object.entries(owned))for(let i=0;i<n;i++){const z=E('i','v110OwnedSymbol',esc(sym));z.dataset.symbol=sym;strip.append(z)}if(!strip.children.length)strip.append(E('span','v110NoSymbols','◇'));shell.append(strip);
 const row=E('div','v110DraftCards v130DraftCards');
 picks.forEach((q,index)=>{
   const d=V.describeChoice(g,q),match=q.kind==='path'&&d.symbol&&owned[d.symbol]>0,classes=['card','v110DraftCard'];if(q.kind==='core')classes.push('v110Core','v120CoreCard');else if(q.kind==='unique')classes.push('v130Unique');else classes.push(rankClass(q.rank));if(match)classes.push('v110Match');
   const card=E('div',classes.join(' '));card.dataset.v120Choice=choiceKey(q);card.style.setProperty('--rank',d.color);if(q.kind==='unique')card.style.setProperty('--unique',X.color(d.aspect||'purple'));
   const cur=currentRank(g,q),jump=q.kind==='unique'?0:Math.max(0,(Number(q.rank)||cur+1)-(cur+1)),top=q.kind==='unique'?`<i>${esc(d.icon||'✦')}</i><em>UNIQUE</em>`:`<i>${q.kind==='core'?'':esc(d.symbol||d.icon||'◇')}</i><em>${rankName(q.rank)}</em>`;
   const face=E('button','v130PickFace');face.type='button';face.innerHTML=`<span class="v110CardTop ${q.kind==='core'?'v120CoreTop':''}">${top}</span><small>${esc(d.category)}</small><b>${esc(d.name)}</b><p>${esc(d.desc)}</p>${jump?`<strong class="v130RankJump">↑${jump}</strong>`:''}<u></u>`;face.onclick=()=>{if(!g._v121AutoPickPending)V.applyChoice(g,q,{prep})};card.append(face);
   if(X.canBanish(g,q)){const bx=E('button','v130Banish','⊘');bx.type='button';bx.setAttribute('aria-label','Banish '+d.name+' for this run');bx.onclick=ev=>{ev.stopPropagation();X.banishChoice(g,q,index)};card.append(bx)}
   row.append(card);if(match)for(const o of strip.querySelectorAll('.v110OwnedSymbol'))if(o.dataset.symbol===d.symbol)o.classList.add('v110Match');
 });
 shell.append(row);
 const foot=E('footer','v110DraftFoot');const free=X.freeRerollReady(g),rer=E('button','v110DraftTool',free?'↻ <b>FREE</b>':`↻ <b>${Math.max(0,g.rerolls||0)}</b>`);rer.disabled=!free&&(g.rerolls||0)<=0;rer.onclick=()=>g.v110Reroll?.();foot.append(rer);
 const auto=E('button','v110DraftTool v121AutoDraft',prep?'AUTO PREP':'AUTO');auto.onclick=()=>g.autoChoose?.();foot.append(auto);shell.append(foot);root.append(shell);
};

// Add Luck, Uniques and run-only Modules to the existing Build sheet without
// replacing the proven card fan / foreground focus implementation.
const show121=GP.showRunDeck;
GP.showRunDeck=function(...args){
 const out=show121.apply(this,args);requestAnimationFrame(()=>{
   const root=$('#v110Build .v110Build'),meta=root?.querySelector('.v120BuildMeta');if(!root||!meta||root.querySelector('.v130BuildExtras'))return;
   const uniques=X.uniqueObjects(this),mods=X.moduleObjects(this),box=E('div','v130BuildExtras');
   const uniq=uniques.length?uniques.map(u=>`<i class="v130UniqueChip" style="--accent:${X.color(u.aspect)}">${esc(u.icon)} ${esc(u.name)}</i>`).join(''):'<span>NO UNIQUE</span>';
   const modules=mods.length?mods.map(m=>`<i class="v130ModuleChip" style="--accent:${X.color(m.aspect)}">${esc(m.icon)} ${esc(m.name)}</i>`).join(''):'<span>EMPTY MODULE BAY</span>';
   box.innerHTML=`<div class="v130RunNumbers"><b>✦ ${X.luck(this)}</b><b>⊘ ${X.banishAvailable(this)}</b><b>▣ ${mods.length}/${X.CONFIG.moduleSlots}</b></div><div class="v130UniqueStrip">${uniq}</div><div class="v130ModuleStrip">${modules}</div>`;meta.append(box);
 });return out;
};

V.syncVersionLabel=()=>{
 R.VERSION='1.3.0';V.VERSION='1.3.0';
 const root=document.getElementById('app');if(!root)return;
 for(const el of root.querySelectorAll('*')){if(el.children.length)continue;const t=String(el.textContent||'').trim();if(/^(?:VERSION\s*)?V?\d+\.\d+\.\d+$/i.test(t)){if(/^VERSION/i.test(t))el.textContent='VERSION 1.3.0';else if(/^V/i.test(t))el.textContent='v1.3.0';else el.textContent='1.3.0'}}
};
V.syncVersionLabel();setTimeout(V.syncVersionLabel,0);setTimeout(V.syncVersionLabel,300);setTimeout(V.syncVersionLabel,800);
})();
