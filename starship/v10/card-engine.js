(()=>{
'use strict';
const R=window.SR,V=R?.V10;if(!R?.Game||!V)throw new Error('V10 card engine requires runtime');
const GP=R.Game.prototype,AP=R.App?.prototype;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
const mounted=s=>(Array.isArray(s?.weaponMounts)?s.weaponMounts:(s?.weapons||[])).filter(Boolean);
const droneIds=s=>Array.isArray(s?.equippedDrones)?s.equippedDrones:(s?.drones||[]);
const supportIds=s=>Array.isArray(s?.equippedSupports)?s.equippedSupports:(s?.supports||[]);
const roleOf=c=>String(c?.role||'').toLowerCase()||({0:'pilot',1:'gunner',5:'engineer'}[Number(c?.profession)]||'');
const hasDroneOperator=s=>(s?.crew||[]).some(c=>c?.assigned&&((roleOf(c)==='engineer'&&c.specialty==='Drone Systems')||Number(c.profession)===5));
const supportStaffed=(s,i,def)=>{const crew=s?.crew||[],p=crew.some(c=>c.assignment===`support:${i}:pilot`&&roleOf(c)==='pilot'),g=(def?.crewReq||1)<2||crew.some(c=>c.assignment===`support:${i}:gunner`&&roleOf(c)==='gunner');return p&&g};
const rankOf=(g,id)=>Math.max(0,Number(g?.cardState?.paths?.[id])||0);
const coreRank=(g,id)=>Math.max(0,Number(g?.cardState?.core?.[id])||0);
const evoOn=(g,id)=>!!g?.cardState?.evolutions?.[id];
const consumed=(g,id)=>!!g?.cardState?.consumedPaths?.[id];
V.rank=(g,id)=>consumed(g,id)?0:rankOf(g,id);
V.rawRank=rankOf;V.coreRank=coreRank;V.evoOn=evoOn;
V.path=(id)=>V.PATH_BY_ID[id];V.evo=id=>V.EVO_BY_ID[id];
V.stat=(g,pathId,key)=>{const p=V.path(pathId),r=V.rank(g,pathId);return p&&r?V.rankValue(p.stats[key],r):0};
V.coreValue=(g,id)=>{const c=V.CORE_BY_ID[id],r=coreRank(g,id);return c&&r?V.rankValue(c.values,r):0};

V.initState=g=>{
 if(g.cardState)return g.cardState;
 g.cardState={categories:{},paths:{},core:{damage:0,fireRate:0,crit:0,hull:0,shield:0,tacticalCooldown:0,repairEfficiency:0,blastRadius:0,salvage:0,xp:0},evolutions:{},consumedPaths:{},evolutionQueue:[],history:[],capabilities:null};
 g._v110BaseMods={...(g.mods||{})};
 g._v110BaseMaxHp=null;g._v110BaseMaxShield=null;
 return g.cardState;
};

V.snapshotCapabilities=g=>{
 const s=g.s||{},caps={weaponFamilies:[],offensiveDrones:false,defensiveDrones:false,offensiveSupports:false,defensiveSupports:false,shields:false,ship:true,tactical:false};
 const ids=mounted(s),cap=Math.max(0,Number(R.foundationWeaponCapacity?.(s))||ids.length),active=ids.slice(0,cap||ids.length);
 caps.weaponFamilies=[...new Set(active.map(id=>(R.WEAPONS||[]).find(w=>w.id===id)?.family).filter(f=>['autocannon','railgun','plasma','ion','missile'].includes(f)))];
 const realDrones=(g.droneUnits?.length?g.droneUnits.map(u=>u.def?.id).filter(Boolean):droneIds(s));
 const droneOk=(Number(R.foundationDroneCapacity?.(s,true))||0)>0&&hasDroneOperator(s);
 if(droneOk)for(const id of realDrones){const d=(R.DRONES||[]).find(x=>x.id===id);if(d?.role==='defense')caps.defensiveDrones=true;else if(d)caps.offensiveDrones=true}
 const maxS=Math.max(0,Number(R.foundationSupportCapacity?.(s))||supportIds(s).length),sid=supportIds(s).slice(0,maxS||supportIds(s).length);
 sid.forEach((id,i)=>{const d=(R.SUPPORTS||[]).find(x=>x.id===id);if(!d||!supportStaffed(s,i,d))return;if(V.OFF_SUPPORT_IDS.has(id))caps.offensiveSupports=true;if(V.DEF_SUPPORT_IDS.has(id))caps.defensiveSupports=true});
 // If combat has already synchronized allies, trust the actual surviving operational definitions.
 for(const u of g.supportUnits||[]){const id=u?.def?.id;if(V.OFF_SUPPORT_IDS.has(id))caps.offensiveSupports=true;if(V.DEF_SUPPORT_IDS.has(id))caps.defensiveSupports=true}
 caps.shields=(Number(g.maxShield)||Number(g.h?.shield)||0)>0;
 caps.tactical=(s.tactical||s.actives||[]).some(id=>(R.TACTICAL||[]).some(a=>a.id===id));
 g.cardState.capabilities=caps;return caps;
};
V.categoryEligible=(g,id)=>{const c=V.CATEGORIES[id],q=g.cardState?.capabilities||V.snapshotCapabilities(g);if(!c)return false;if(c.kind==='weapon')return q.weaponFamilies.includes(c.family);if(c.kind==='offDrone')return q.offensiveDrones;if(c.kind==='defDrone')return q.defensiveDrones;if(c.kind==='offSupport')return q.offensiveSupports;if(c.kind==='defSupport')return q.defensiveSupports;if(c.kind==='shield')return q.shields;if(c.kind==='tactical')return q.tactical;if(c.kind==='ship')return true;return false};

V.checkReady=g=>{
 const st=V.initState(g),queued=new Set(st.evolutionQueue);
 for(const e of V.EVOLUTIONS){if(st.evolutions[e.id]||queued.has(e.id))continue;const [a,b]=e.sources;if(rankOf(g,a)>=7&&rankOf(g,b)>=7&&!consumed(g,a)&&!consumed(g,b)){st.evolutionQueue.push(e.id);queued.add(e.id)}}
};
V.symbolOwned=(g,symbol)=>V.PATHS.filter(p=>p.symbol===symbol&&rankOf(g,p.id)>0&&!consumed(g,p.id)).length;
V.ownedSymbols=g=>V.PATHS.filter(p=>rankOf(g,p.id)>0&&!consumed(g,p.id)).map(p=>p.symbol);

V.candidates=g=>{
 const st=V.initState(g);if(!st.capabilities)V.snapshotCapabilities(g);const out=[];
 for(const [catId,cat] of Object.entries(V.CATEGORIES)){
   if(!V.categoryEligible(g,catId))continue;
   const chosen=st.categories[catId];
   if(chosen){const r=rankOf(g,chosen);if(r>0&&r<7&&!consumed(g,chosen))out.push({kind:'path',id:chosen,rank:r+1,weight:1.35});continue}
   const list=V.PATHS_BY_CATEGORY[catId]||[];if(!list.length)continue;
   // An uncommitted category contributes one of its three identities per offer.
   const p=list[Math.random()*list.length|0];out.push({kind:'path',id:p.id,rank:1,weight:1});
 }
 for(const c of V.CORES){const r=coreRank(g,c.id);if(r<7)out.push({kind:'core',id:c.id,rank:r+1,weight:.70})}
 return out;
};
const weighted=(pool,n)=>{const a=pool.slice(),out=[];while(a.length&&out.length<n){const sum=a.reduce((s,x)=>s+Math.max(.01,x.weight||1),0);let r=Math.random()*sum,i=0;for(;i<a.length;i++){r-=Math.max(.01,a[i].weight||1);if(r<=0)break}out.push(a.splice(Math.min(i,a.length-1),1)[0])}return out};
V.rollOffer=g=>{
 const pool=V.candidates(g),paths=pool.filter(x=>x.kind==='path'),cores=pool.filter(x=>x.kind==='core');let picks=[];
 if(paths.length)picks.push(weighted(paths,1)[0]);
 const used=new Set(picks.map(x=>x.kind+':'+x.id));const rest=pool.filter(x=>!used.has(x.kind+':'+x.id));
 for(const q of weighted(rest,6)){if(picks.length>=3)break;if(q.kind==='core'&&picks.filter(x=>x.kind==='core').length>=2)continue;picks.push(q)}
 if(picks.length<3)for(const q of pool){if(picks.length>=3)break;if(!picks.some(x=>x.kind===q.kind&&x.id===q.id))picks.push(q)}
 return picks.slice(0,3);
};

V.describeChoice=(g,q)=>{
 if(q.kind==='core'){const c=V.CORE_BY_ID[q.id],v=V.rankValue(c.values,q.rank);return{...q,name:c.name,icon:c.icon,symbol:'',category:'CORE',desc:c.format(v),color:V.RANK_COLORS[q.rank]}}
 const p=V.PATH_BY_ID[q.id];return{...q,name:p.name,icon:p.symbol,symbol:p.symbol,category:V.CATEGORIES[p.category]?.name||p.category,desc:p.desc,color:V.RANK_COLORS[q.rank]};
};

V.recomputeCore=g=>{
 V.initState(g);const b=g._v110BaseMods||(g._v110BaseMods={...(g.mods||{})}),m=g.mods||{};
 m.damage=(b.damage??1)*(1+V.coreValue(g,'damage'));
 m.rate=(b.rate??1)*(1+V.coreValue(g,'fireRate'));
 m.crit=(b.crit??.05)+V.coreValue(g,'crit');
 m.aoe=(b.aoe??1)*(1+V.coreValue(g,'blastRadius'));
 m.salvage=(b.salvage??1)*(1+V.coreValue(g,'salvage'));
 m.xp=(b.xp??1)*(1+V.coreValue(g,'xp'));
 const hv=V.coreValue(g,'hull'),sv=V.coreValue(g,'shield');
 if(Number.isFinite(g.maxHp)){
   if(g._v110BaseMaxHp==null)g._v110BaseMaxHp=g.maxHp/Math.max(.01,1+(g._v110AppliedHull||0));
   const old=g.maxHp,next=g._v110BaseMaxHp*(1+hv);g.maxHp=next;if(next>old)g.hp=Math.min(next,(Number(g.hp)||0)+(next-old));g._v110AppliedHull=hv;
 }
 if(Number.isFinite(g.maxShield)){
   if(g._v110BaseMaxShield==null)g._v110BaseMaxShield=g.maxShield/Math.max(.01,1+(g._v110AppliedShield||0));
   const old=g.maxShield,next=g._v110BaseMaxShield*(1+sv);g.maxShield=next;if(next>old)g.shield=Math.min(next,(Number(g.shield)||0)+(next-old));g._v110AppliedShield=sv;
 }
 return m;
};
V.repairMultiplier=g=>1+V.coreValue(g,'repairEfficiency');
V.tacticalCooldownMultiplier=g=>Math.max(.25,1-V.coreValue(g,'tacticalCooldown'));

V.applyChoice=(g,q,opt={})=>{
 const st=V.initState(g);if(!q)return false;
 if(q.kind==='path'){
   const p=V.PATH_BY_ID[q.id];if(!p||!V.categoryEligible(g,p.category))return false;
   const chosen=st.categories[p.category];if(chosen&&chosen!==p.id)return false;
   const current=rankOf(g,p.id);if(current>=7)return false;
   st.categories[p.category]=p.id;st.paths[p.id]=current+1;st.history.push({t:'path',id:p.id,rank:current+1,level:g.level||1});
 }else if(q.kind==='core'){
   const current=coreRank(g,q.id);if(current>=7||!V.CORE_BY_ID[q.id])return false;
   st.core[q.id]=current+1;st.history.push({t:'core',id:q.id,rank:current+1,level:g.level||1});V.recomputeCore(g);
 }else return false;
 if(Array.isArray(g.cards))g.cards.push(`v110:${q.kind}:${q.id}:${q.rank||''}`);
 V.checkReady(g);R.audio?.play?.('level');
 if(opt.prep)return V.finishPrepStep(g);
 V.closeDraft(g);return true;
};

V.closeDraft=g=>{const c=document.querySelector('#cards');if(c){c.classList.remove('show','v110Show');c.innerHTML=''}g._v110Offer=null;g.paused=false};
V.openOffer=(g,opt={})=>{
 V.initState(g);V.snapshotCapabilities(g);V.checkReady(g);
 if(g.cardState.evolutionQueue.length){return V.resolveNextEvolution(g,()=>{if(opt.prep)V.finishPrepStep(g,true);else{g.paused=false}})}
 const picks=V.rollOffer(g);if(!picks.length){if(opt.prep)V.finishPrepStep(g,true);else g.paused=false;return}
 g.paused=true;g._v110Offer={picks,opt};V.renderDraft?.(g,picks,opt);
 if(g.autoMode)setTimeout(()=>g.autoChoose?.(),100);
};

V.discover=(g,e)=>{if(!g?.s||!e)return;g.s.cardCodex=g.s.cardCodex||{};g.s.cardCodex.evolutions=g.s.cardCodex.evolutions||{};const fresh=!g.s.cardCodex.evolutions[e.id];g.s.cardCodex.evolutions[e.id]=true;try{R.save?.(g.s)}catch{}return fresh};
V.resolveNextEvolution=(g,done)=>{
 const st=V.initState(g),id=st.evolutionQueue.shift(),e=V.EVO_BY_ID[id];if(!e){done?.();return}
 st.evolutions[id]=true;for(const p of e.sources)st.consumedPaths[p]=true;st.history.push({t:'evolution',id,level:g.level||1});
 const fresh=V.discover(g,e);if(Array.isArray(g.cards))g.cards.push('v110:evolution:'+id);
 g.paused=true;V.renderEvolution?.(g,e,fresh,()=>{V.recomputeCore(g);done?.()})||setTimeout(()=>{V.recomputeCore(g);done?.()},50);
};

V.scoreChoice=(g,q)=>{
 let score=q.kind==='path'?(rankOf(g,q.id)>0?30:20):10;
 if(q.kind==='path'){const p=V.PATH_BY_ID[q.id];score+=q.rank*2;if(V.symbolOwned(g,p.symbol)>0)score+=7}
 if(q.kind==='core'){if(q.id==='damage'||q.id==='fireRate')score+=4;if(q.id==='hull'&&g.hp/Math.max(1,g.maxHp)<.45)score+=8;if(q.id==='shield'&&g.shield/Math.max(1,g.maxShield)<.35)score+=6;if(q.id==='xp'&&(g.wave||0)<20)score+=4}
 return score+Math.random()*2;
};
GP.autoChoose=function(){const o=this._v110Offer;if(!o?.picks?.length)return;const q=o.picks.slice().sort((a,b)=>V.scoreChoice(this,b)-V.scoreChoice(this,a))[0];V.applyChoice(this,q,{prep:!!o.opt?.prep})};

GP.v110Reroll=function(){if(!this._v110Offer||this.rerolls<=0)return;this.rerolls--;R.audio?.play?.('reroll');const picks=V.rollOffer(this);this._v110Offer.picks=picks;V.renderDraft?.(this,picks,this._v110Offer.opt)};

const oldBuild=GP.build;
GP.build=function(...args){const out=oldBuild.apply(this,args);V.initState(this);setTimeout(()=>{if(!this.dead){V.snapshotCapabilities(this);V.recomputeCore(this)}},0);return out};

// v10 is the sole owner of level-up drafting.
GP.offer=function(){V.openOffer(this,{prep:false})};
GP.applyCard=function(c){if(c?.v110Choice)return V.applyChoice(this,c.v110Choice);return false};

const oldUse=GP.useTactical;
if(oldUse)GP.useTactical=function(i,...args){const before=Number(this.activeCd?.[i])||0,out=oldUse.call(this,i,...args),after=Number(this.activeCd?.[i])||0;if(after>before&&this.cardState)this.activeCd[i]=after*V.tacticalCooldownMultiplier(this);return out};

V.startPrep=g=>{
 const p=g._v110Prep;if(!p)return;
 g.paused=true;
 if(p.remaining<=0){g._v110Prep=null;g.paused=false;g.count=3;return}
 const idx=p.total-p.remaining+1;V.openOffer(g,{prep:true,prepIndex:idx,prepTotal:p.total});
};
V.finishPrepStep=(g,wasEvolution=false)=>{const p=g._v110Prep;if(!p){V.closeDraft(g);return}const c=document.querySelector('#cards');if(c){c.classList.remove('show','v110Show');c.innerHTML=''}p.remaining=Math.max(0,p.remaining-1);g._v110Offer=null;if(p.remaining<=0){g._v110Prep=null;g.paused=false;g.count=3;return}setTimeout(()=>V.startPrep(g),wasEvolution?100:55)};

if(AP){
 AP.startAtCheckpoint=function(w){
   this.s=R.migrate(this.s);R.save(this.s);const g=new R.Game(this,this.s);R.game=g;g.startCheckpoint=w;g.wave=Math.max(0,w-1);g.count=999;g.sectorMap={};
   const bundle=w>1?Math.min(18,Math.max(0,Math.floor((w-1)*.33))):0;
   if(bundle){g.level=Math.max(g.level||1,1+bundle);g.xp=0;if(Number.isFinite(g.next))g.next=Math.max(g.next,80+bundle*35);g._v110Prep={remaining:bundle,total:bundle};setTimeout(()=>V.startPrep(g),80)}else g.count=3;
   return g;
 };
}

V.resetRun=g=>{g.cardState=null;V.initState(g);V.snapshotCapabilities(g);g._v110BaseMods={...(g.mods||{})};g._v110BaseMaxHp=g.maxHp;g._v110BaseMaxShield=g.maxShield;V.recomputeCore(g)};
})();
