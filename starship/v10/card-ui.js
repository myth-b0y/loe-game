(()=>{
'use strict';
const R=window.SR,V=R?.V10;if(!R?.Game||!V)throw new Error('V10 UI requires card engine');
const GP=R.Game.prototype,$=s=>document.querySelector(s),clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const E=(t,c,h)=>{const e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e};
const rankName=r=>r>=7?'MAX':V.RANK_NAMES[r]||'';
const rankClass=r=>'v110R'+clamp(r,1,7);
const symbolCounts=g=>{const m={};for(const q of V.ownedSymbols(g))m[q]=(m[q]||0)+1;return m};

V.renderDraft=(g,picks,opt={})=>{
 const root=$('#cards');if(!root)return;const owned=symbolCounts(g),prep=!!opt.prep;
 root.innerHTML='';root.classList.add('show','v110Show');
 const shell=E('div','v110Draft');
 const head=E('header','v110DraftHead',`<small>${prep?`CHECKPOINT PREP ${opt.prepIndex||1} / ${opt.prepTotal||1}`:'LEVEL '+(g.level||1)}</small><b>${prep?'PREP BUILD':'CHOOSE UPGRADE'}</b>`);shell.append(head);
 const strip=E('div','v110Symbols');for(const [sym,n] of Object.entries(owned)){for(let i=0;i<n;i++){const z=E('i','v110OwnedSymbol',esc(sym));z.dataset.symbol=sym;strip.append(z)}}if(!strip.children.length)strip.append(E('span','v110NoSymbols','◇'));shell.append(strip);
 const row=E('div','v110DraftCards');
 for(const q of picks){const d=V.describeChoice(g,q),match=d.symbol&&owned[d.symbol]>0,b=E('button',`card v110DraftCard ${rankClass(q.rank)} ${q.kind==='core'?'v110Core':''} ${match?'v110Match':''}`);b.style.setProperty('--rank',d.color);b.innerHTML=`<span class="v110CardTop"><i>${esc(d.symbol||d.icon||'◇')}</i><em>${rankName(q.rank)}</em></span><small>${esc(d.category)}</small><b>${esc(d.name)}</b><p>${esc(d.desc)}</p><u></u>`;b.onclick=()=>V.applyChoice(g,q,{prep});row.append(b);if(match)for(const o of strip.querySelectorAll('.v110OwnedSymbol'))if(o.dataset.symbol===d.symbol)o.classList.add('v110Match')}
 shell.append(row);
 const foot=E('footer','v110DraftFoot');const rer=E('button','v110DraftTool',`↻ <b>${Math.max(0,g.rerolls||0)}</b>`);rer.disabled=(g.rerolls||0)<=0;rer.onclick=()=>g.v110Reroll?.();foot.append(rer);if(prep){const auto=E('button','v110DraftTool','AUTO PREP');auto.onclick=()=>g.autoChoose?.();foot.append(auto)}shell.append(foot);root.append(shell);
};

V.renderEvolution=(g,e,fresh,done)=>{
 const root=$('#cards');if(!root){done?.();return}root.innerHTML='';root.classList.add('show','v110Show','v110EvolutionShow');
 const a=V.PATH_BY_ID[e.sources[0]],b=V.PATH_BY_ID[e.sources[1]],box=E('div','v110Evolution');
 box.innerHTML=`<small>${fresh?'NEW RECIPE DISCOVERED':'EVOLUTION'}</small><div class="v110Fuse"><div class="card v110Source"><i>${esc(e.symbol)}</i><b>${esc(a.name)}</b><em>MAX</em></div><span>${esc(e.symbol)}</span><div class="card v110Source"><i>${esc(e.symbol)}</i><b>${esc(b.name)}</b><em>MAX</em></div></div><div class="card v110EvolutionCard"><i>${esc(e.symbol)}</i><small>EVOLUTION</small><b>${esc(e.name)}</b><p>${esc(e.desc)}</p></div>`;
 root.append(box);requestAnimationFrame(()=>box.classList.add('go'));setTimeout(()=>{root.classList.remove('show','v110Show','v110EvolutionShow');root.innerHTML='';done?.()},1550);
};

const buildEntries=g=>{
 const out=[];
 for(const e of V.EVOLUTIONS)if(V.evoOn(g,e.id))out.push({type:'evolution',id:e.id,name:e.name,symbol:e.symbol,rank:'EVOLUTION',desc:e.desc,color:'prismatic'});
 for(const p of V.PATHS){const rr=V.rank(g,p.id);if(rr>0)out.push({type:'path',id:p.id,name:p.name,symbol:p.symbol,rank:rankName(rr),desc:p.desc,color:V.RANK_COLORS[rr]})}
 for(const c of V.CORES){const rr=V.coreRank(g,c.id);if(rr>0){const val=V.rankValue(c.values,rr);out.push({type:'core',id:c.id,name:c.name,symbol:c.icon,rank:rankName(rr),desc:c.format(val),color:V.RANK_COLORS[rr]})}}
 return out;
};

GP.showRunDeck=function(){
 if($('#v110Build'))return;const was=this.paused;this.paused=true;const entries=buildEntries(this),o=E('div','v110BuildSheet');o.id='v110Build';
 o.innerHTML=`<div class="v110Build"><header><span><small>RUN BUILD</small><b>${entries.length} CARDS</b></span><div><button data-codex>◇</button><button data-close>×</button></div></header><div class="v110Fan"></div><section class="v110Inspect"><small>${entries.length?'SELECT A CARD':'EMPTY DECK'}</small><b>${entries.length?'YOUR BUILD':'NO CARDS YET'}</b><p>${entries.length?'Tap a card in the fan to inspect it.':'Level up to begin shaping this run.'}</p></section></div>`;
 const fan=o.querySelector('.v110Fan'),inspect=o.querySelector('.v110Inspect'),n=entries.length,mid=(n-1)/2,span=Math.min(46,n>1?Math.max(18,520/(n-1)):0);
 entries.forEach((d,i)=>{const off=(i-mid)*span,rot=clamp((i-mid)*3.2,-28,28),b=E('button',`card v110FanCard ${d.type==='evolution'?'v110EvoCard':d.type==='core'?'v110Core':''}`);b.style.setProperty('--x',off+'px');b.style.setProperty('--rot',rot+'deg');b.style.setProperty('--rank',d.color);b.style.zIndex=String(i+1);b.innerHTML=`<span class="v110CardTop"><i>${esc(d.symbol)}</i><em>${esc(d.rank)}</em></span><small>${d.type==='evolution'?'EVOLUTION':d.type==='core'?'CORE':'PATH'}</small><b>${esc(d.name)}</b>`;b.onclick=()=>{fan.querySelectorAll('.focus').forEach(x=>x.classList.remove('focus'));b.classList.add('focus');inspect.innerHTML=`<small>${d.type==='evolution'?'EVOLUTION':d.type==='core'?'CORE':'PATH'} · ${esc(d.rank)}</small><b>${esc(d.name)}</b><p>${esc(d.desc)}</p>`};fan.append(b)});
 document.body.append(o);requestAnimationFrame(()=>o.classList.add('show'));o.querySelector('[data-close]').onclick=()=>{o.classList.remove('show');setTimeout(()=>o.remove(),180);this.paused=was};o.querySelector('[data-codex]').onclick=()=>V.openCodex(this);
};

V.openCodex=g=>{if($('#v110Codex'))return;const codex=g.s?.cardCodex?.evolutions||{},o=E('div','v110CodexSheet');o.id='v110Codex';o.innerHTML=`<div class="v110Codex"><header><span><small>EVOLUTION BIBLE</small><b>${Object.keys(codex).length} / 18 DISCOVERED</b></span><button>×</button></header><div class="v110CodexGrid"></div></div>`;const grid=o.querySelector('.v110CodexGrid');for(const e of V.EVOLUTIONS){const known=!!codex[e.id],a=V.PATH_BY_ID[e.sources[0]],b=V.PATH_BY_ID[e.sources[1]],c=E('article',known?'known':'locked');c.innerHTML=known?`<i>${esc(e.symbol)}</i><small>${esc(a.name)} + ${esc(b.name)}</small><b>${esc(e.name)}</b><p>${esc(e.desc)}</p>`:`<i>${esc(e.symbol)}</i><small>${esc(e.symbol)} + ${esc(e.symbol)}</small><b>???</b><p>UNDISCOVERED</p>`;grid.append(c)}document.body.append(o);requestAnimationFrame(()=>o.classList.add('show'));o.querySelector('header button').onclick=()=>{o.classList.remove('show');setTimeout(()=>o.remove(),180)}};

// Galactic Engineer becomes a legal one-rank refit, never a new Path choice.
GP.v93ShowEngineerTrader=function(){
 if($('#engineerTrader'))return;const st=V.initState(this),pool=[];for(const p of V.PATHS){const rr=V.rawRank(this,p.id);if(rr>0&&rr<7&&!st.consumedPaths[p.id])pool.push({kind:'path',id:p.id,rank:rr+1})}for(const c of V.CORES){const rr=V.coreRank(this,c.id);if(rr>0&&rr<7)pool.push({kind:'core',id:c.id,rank:rr+1})}
 const picks=[];while(pool.length&&picks.length<3)picks.push(pool.splice(Math.random()*pool.length|0,1)[0]);const fee=Math.round(550+(this.wave||0)*45),o=E('div','engineerTrader v110Refit');o.id='engineerTrader';o.innerHTML=`<div class="v110RefitCard"><small>GALACTIC ENGINEER // REFIT</small><h2>UPGRADE EXISTING BUILD</h2><p>Advance one owned card by one rank.</p><div class="v110RefitChoices"></div><button class="btn quiet" data-skip>CONTINUE</button></div>`;const row=o.querySelector('.v110RefitChoices');if(!picks.length)row.innerHTML='<p>NO LEGAL REFIT AVAILABLE</p>';for(const q of picks){const d=V.describeChoice(this,q),b=E('button',`card v110RefitChoice ${rankClass(q.rank)}`);b.style.setProperty('--rank',d.color);b.innerHTML=`<span class="v110CardTop"><i>${esc(d.symbol||d.icon)}</i><em>${rankName(q.rank)}</em></span><small>${esc(d.category)}</small><b>${esc(d.name)}</b><p>${esc(d.desc)}</p><strong>▰ ${fee}</strong>`;b.onclick=()=>{if(this.salvage<fee)return this.app?.deny?.('NEED SALVAGE');this.salvage-=fee;const cs=this.cardState;if(q.kind==='path'){cs.paths[q.id]=(cs.paths[q.id]||0)+1;cs.history.push({t:'refit',id:q.id,rank:cs.paths[q.id],level:this.level||1})}else{cs.core[q.id]=(cs.core[q.id]||0)+1;V.recomputeCore(this)}V.checkReady(this);finish()};row.append(b)}
 const finish=()=>{o.remove();this.v93MarkTraderResolved?.();this.paused=false};o.querySelector('[data-skip]').onclick=finish;document.body.append(o);this.paused=true;
};
GP.showEngineerTrader=function(){return this.v93ShowEngineerTrader()};

V.openLab=g=>{if($('#v110LabSheet'))return;const o=E('div','v110LabSheet');o.id='v110LabSheet';const refresh=()=>{const s=V.initState(g);o.innerHTML=`<div class="v110Lab"><header><span><small>DEVELOPER</small><b>CARD LAB</b></span><button data-x>×</button></header><div class="v110LabActions"><button data-level>+ LEVEL</button><button data-reset>RESET RUN CARDS</button><button data-rainbow>6 EVOLUTION BUILD</button></div><div class="v110LabPaths"></div><pre>${esc(JSON.stringify(s,null,2))}</pre></div>`;const list=o.querySelector('.v110LabPaths');for(const p of V.PATHS){const rr=V.rawRank(g,p.id),b=E('button','v110LabPath',`${esc(p.symbol)} ${esc(p.name)} <b>${rr||0}/7</b>`);b.onclick=()=>{const st=V.initState(g);st.categories[p.category]=p.id;st.paths[p.id]=rr>=7?0:rr+1;if(st.paths[p.id]===0){delete st.paths[p.id];delete st.categories[p.category]}V.checkReady(g);refresh()};list.append(b)}o.querySelector('[data-x]').onclick=()=>o.remove();o.querySelector('[data-level]').onclick=()=>{g.level=(g.level||1)+1;V.openOffer(g)};o.querySelector('[data-reset]').onclick=()=>{V.resetRun(g);refresh()};o.querySelector('[data-rainbow]').onclick=()=>{const st=V.initState(g);for(const e of V.EVOLUTIONS.filter((_,i)=>i%3===0)){for(const id of e.sources){const p=V.PATH_BY_ID[id];st.categories[p.category]=id;st.paths[id]=7}st.evolutions[e.id]=true;for(const id of e.sources)st.consumedPaths[id]=true}refresh()}};refresh();document.body.append(o)};

const build0=GP.build;GP.build=function(...args){const out=build0.apply(this,args);setTimeout(()=>{let d=$('#runDeck');if(!d){d=E('button','runDeck','▤');d.id='runDeck';document.body.append(d)}d.onclick=()=>this.showRunDeck();d.setAttribute('aria-label','Run build deck');if(new URLSearchParams(location.search).get('dev')==='1'&&!$('#v110Lab')){const b=E('button','v110LabButton','⚙');b.id='v110Lab';b.onclick=()=>V.openLab(this);document.body.append(b)}},0);return out};
})();
