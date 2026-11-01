(()=>{
'use strict';
const R=window.SR,V=R?.V10,X=R?.V130;if(!R?.Game||!V||!X)throw new Error('V1.3 rewards requires v1.3 data');
const GP=R.Game.prototype,clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
const rawRank=(g,id)=>Math.max(0,Number(V.rawRank?.(g,id)??V.rank?.(g,id))||0);
const coreRank=(g,id)=>Math.max(0,Number(V.coreRank?.(g,id))||0);
const key=q=>`${q?.kind||''}:${q?.id||''}`;

X.ensure=g=>{
 const st=V.initState(g);st.v130=st.v130||{banished:{},uniques:{},modules:[],banishSpent:0,freeRerollWave:-999};
 st.v130.banished=st.v130.banished||{};st.v130.uniques=st.v130.uniques||{};st.v130.modules=Array.isArray(st.v130.modules)?st.v130.modules:[];
 return st.v130;
};
X.hasUnique=(g,id)=>!!X.ensure(g).uniques[id];
X.hasModule=(g,id)=>X.ensure(g).modules.includes(id);
X.moduleObjects=g=>X.ensure(g).modules.map(id=>X.MODULE_BY_ID[id]).filter(Boolean);
X.uniqueObjects=g=>Object.keys(X.ensure(g).uniques).filter(id=>X.ensure(g).uniques[id]).map(id=>X.UNIQUE_BY_ID[id]).filter(Boolean);
X.effectSum=(g,effect)=>{
 let n=0;for(const u of X.uniqueObjects(g))n+=Number(u.effects?.[effect])||0;for(const m of X.moduleObjects(g))n+=Number(m.effects?.[effect])||0;return n;
};
X.effectFlag=(g,effect)=>X.uniqueObjects(g).some(u=>u.effects?.[effect])||X.moduleObjects(g).some(m=>m.effects?.[effect]);
X.effectMax=(g,effect,fallback=0)=>{
 let n=fallback;for(const u of X.uniqueObjects(g))n=Math.max(n,Number(u.effects?.[effect])||0);for(const m of X.moduleObjects(g))n=Math.max(n,Number(m.effects?.[effect])||0);return n;
};
X.luck=g=>{
 let n=Number(g?.s?.luck)||Number(g?.s?.runLuck)||0;
 for(const c of g?.s?.crew||[])n+=Number(c?.luck)||0;
 n+=X.effectSum(g,'luck');return Math.max(0,Math.round(n));
};
X.banishCapacity=g=>Math.max(0,Math.floor(Number(g?.s?.banish)||Number(g?.s?.banishCharges)||0)+Math.floor(X.effectSum(g,'banish')));
X.banishAvailable=g=>Math.max(0,X.banishCapacity(g)-(X.ensure(g).banishSpent||0));
X.isBanished=(g,q)=>!!X.ensure(g).banished[key(q)];
X.canBanish=(g,q)=>{
 if(!q||X.banishAvailable(g)<=0||X.isBanished(g,q))return false;
 if(q.kind==='path'){
   const p=V.PATH_BY_ID?.[q.id],st=V.initState(g);if(!p)return false;
   if(st.categories?.[p.category])return false;
   return rawRank(g,q.id)<=0;
 }
 if(q.kind==='core')return true;
 if(q.kind==='unique')return !X.hasUnique(g,q.id);
 return false;
};

X.rollRank=(g,current)=>{
 current=clamp(current,0,7);if(current>=7)return 7;
 let target=current+1,extra=1,luck=X.luck(g);
 while(target<7){
   const p=clamp(X.CONFIG.rankJumpBase+luck*X.CONFIG.rankJumpLuckRate-(extra-1)*X.CONFIG.rankJumpDecay,.005,X.CONFIG.maxRankJumpStep);
   if(Math.random()>=p)break;target++;extra++;
 }
 return target;
};
X.draftWidth=g=>{
 const luck=X.luck(g);let width=3;
 const floor=X.effectMax(g,'draftFloor',3);width=Math.max(width,floor);
 if(width<4&&Math.random()<Math.min(X.CONFIG.maxFourthChance,luck*X.CONFIG.luckFourthRate))width=4;
 if(width<5&&luck>X.CONFIG.fifthLuckStart&&Math.random()<Math.min(X.CONFIG.maxFifthChance,(luck-X.CONFIG.fifthLuckStart)*X.CONFIG.fifthLuckRate))width=5;
 return clamp(width,3,5);
};
X.uniqueChance=g=>clamp(X.CONFIG.baseUniqueChance+X.luck(g)*X.CONFIG.luckUniqueRate,X.CONFIG.baseUniqueChance,X.CONFIG.maxUniqueChance);

const weighted=(pool,n)=>{const a=pool.slice(),out=[];while(a.length&&out.length<n){const sum=a.reduce((s,x)=>s+Math.max(.01,x.weight||1),0);let r=Math.random()*sum,i=0;for(;i<a.length;i++){r-=Math.max(.01,a[i].weight||1);if(r<=0)break}out.push(a.splice(Math.min(i,a.length-1),1)[0])}return out};

V.candidates=g=>{
 const st=V.initState(g);X.ensure(g);if(!st.capabilities)V.snapshotCapabilities(g);const out=[];
 for(const [catId] of Object.entries(V.CATEGORIES)){
   if(!V.categoryEligible(g,catId))continue;
   const chosen=st.categories[catId];
   if(chosen){const r=rawRank(g,chosen);if(r>0&&r<7&&!st.consumedPaths?.[chosen])out.push({kind:'path',id:chosen,rank:X.rollRank(g,r),weight:1.35});continue}
   const list=(V.PATHS_BY_CATEGORY[catId]||[]).filter(p=>!X.isBanished(g,{kind:'path',id:p.id}));if(!list.length)continue;
   const p=list[Math.random()*list.length|0];out.push({kind:'path',id:p.id,rank:X.rollRank(g,0),weight:1});
 }
 for(const c of V.CORES){const r=coreRank(g,c.id);if(r<7&&!X.isBanished(g,{kind:'core',id:c.id}))out.push({kind:'core',id:c.id,rank:X.rollRank(g,r),weight:.70})}
 return out;
};

X.availableUniques=g=>X.UNIQUES.filter(u=>!X.hasUnique(g,u.id)&&!X.isBanished(g,{kind:'unique',id:u.id}));
V.rollOffer=g=>{
 const pool=V.candidates(g),paths=pool.filter(x=>x.kind==='path'),width=X.draftWidth(g);let picks=[];
 if(paths.length)picks.push(weighted(paths,1)[0]);
 const used=new Set(picks.map(key)),rest=pool.filter(x=>!used.has(key(x)));
 for(const q of weighted(rest,Math.max(6,width*2))){if(picks.length>=width)break;if(q.kind==='core'&&picks.filter(x=>x.kind==='core').length>=2)continue;picks.push(q)}
 if(picks.length<width)for(const q of pool){if(picks.length>=width)break;if(!picks.some(x=>key(x)===key(q)))picks.push(q)}
 const uniques=X.availableUniques(g);
 if(uniques.length&&Math.random()<X.uniqueChance(g)){
   const u=uniques[Math.random()*uniques.length|0],q={kind:'unique',id:u.id,rank:0,weight:.3};
   if(picks.length<width)picks.push(q);
   else{let idx=picks.findIndex(x=>x.kind==='core');if(idx<0)idx=picks.length-1;picks[idx]=q}
 }
 return picks.slice(0,width);
};

const describe121=V.describeChoice;
V.describeChoice=(g,q)=>{
 if(q?.kind==='unique'){
   const u=X.UNIQUE_BY_ID[q.id];return{...q,name:u?.name||q.id,icon:u?.icon||'✦',symbol:'',category:'UNIQUE',desc:u?.desc||'',color:X.UNIQUE_COLOR,aspect:u?.aspect||'purple'};
 }
 return describe121(g,q);
};

const apply121=V.applyChoice;
V.applyChoice=(g,q,opt={})=>{
 if(!q)return false;const run=X.ensure(g),st=V.initState(g);
 if(q.kind==='unique'){
   const u=X.UNIQUE_BY_ID[q.id];if(!u||run.uniques[q.id]||X.isBanished(g,q))return false;
   run.uniques[q.id]=true;st.history.push({t:'unique',id:q.id,level:g.level||1});if(Array.isArray(g.cards))g.cards.push(`v130:unique:${q.id}`);
   X.onUniqueAdded?.(g,u);R.audio?.play?.('level');if(opt.prep)return V.finishPrepStep(g);V.closeDraft(g);return true;
 }
 if(q.kind!=='path'&&q.kind!=='core')return apply121(g,q,opt);
 const isPath=q.kind==='path',current=isPath?rawRank(g,q.id):coreRank(g,q.id),target=clamp(Math.max(current+1,Number(q.rank)||current+1),1,7);
 if(target<=current)return false;
 if(isPath){const p=V.PATH_BY_ID?.[q.id];if(!p||!V.categoryEligible(g,p.category))return false;const chosen=st.categories?.[p.category];if(chosen&&chosen!==p.id)return false}
 else if(!V.CORE_BY_ID?.[q.id])return false;
 const holder=isPath?st.paths:st.core,had=holder[q.id],pre=target>current+1?target-1:current;
 if(target>current+1)holder[q.id]=pre;
 const ok=apply121(g,{...q,rank:target},opt);
 if(!ok){if(had==null)delete holder[q.id];else holder[q.id]=had}
 return ok;
};

X.banishChoice=(g,q,index)=>{
 if(!X.canBanish(g,q)||g._v121AutoPickPending)return false;const run=X.ensure(g),offer=g._v110Offer;if(!offer?.picks?.length)return false;
 run.banished[key(q)]=true;run.banishSpent=(run.banishSpent||0)+1;R.audio?.play?.('reroll');
 const kept=offer.picks.filter((_,i)=>i!==index),used=new Set(kept.map(key));let replacement=null;
 for(let tries=0;tries<6&&!replacement;tries++)replacement=V.rollOffer(g).find(x=>!used.has(key(x))&&!X.isBanished(g,x))||null;
 if(replacement){const next=kept.slice();next.splice(Math.min(index,next.length),0,replacement);offer.picks=next}
 else offer.picks=V.rollOffer(g);
 V.renderDraft?.(g,offer.picks,offer.opt);return true;
};

const score121=V.scoreChoice;
V.scoreChoice=(g,q)=>{
 if(q?.kind==='unique'){
   const u=X.UNIQUE_BY_ID[q.id];if(!u)return-1e9;let s=Number(u.ai)||50;
   if(q.id==='phaseMirror'&&g.hp/Math.max(1,g.maxHp)<.4)s+=18;
   if(q.id==='escortMesh'&&(g.supportUnits?.length||0)>1)s+=10;
   if(q.id==='fortuneCircuit'&&X.luck(g)<25)s+=8;
   return s+Math.random()*1.5;
 }
 let s=score121(g,q),current=q?.kind==='path'?rawRank(g,q.id):q?.kind==='core'?coreRank(g,q.id):0;
 if(q?.kind==='path'||q?.kind==='core'){const jump=Math.max(0,(Number(q.rank)||current+1)-(current+1));s+=jump*24;if((Number(q.rank)||0)>=7)s+=8}
 return s;
};

X.freeRerollReady=g=>X.effectFlag(g,'freeReroll')&&X.ensure(g).freeRerollWave!==(g.wave||0);
GP.v110Reroll=function(){
 if(!this._v110Offer)return;const free=X.freeRerollReady(this);if(!free&&(this.rerolls||0)<=0)return;
 if(free)X.ensure(this).freeRerollWave=this.wave||0;else this.rerolls--;
 R.audio?.play?.('reroll');const picks=V.rollOffer(this);this._v110Offer.picks=picks;V.renderDraft?.(this,picks,this._v110Offer.opt);
};

const auto121=GP.autoChoose;
GP.autoChoose=function(){
 const o=this._v110Offer;if(!o?.picks?.length||this._v121AutoPickPending)return auto121.call(this);
 if(X.banishAvailable(this)>0&&(this.level||1)>=12){
   const scored=o.picks.map((q,i)=>({q,i,s:V.scoreChoice(this,q)})).sort((a,b)=>b.s-a.s),best=scored[0],worst=scored[scored.length-1];
   const committed=Object.keys(V.initState(this).categories||{}).length;
   if(committed>=2&&best&&worst&&best.s-worst.s>80&&worst.s<16&&X.canBanish(this,worst.q)){
     X.banishChoice(this,worst.q,worst.i);return setTimeout(()=>auto121.call(this),90);
   }
 }
 return auto121.call(this);
};
})();
