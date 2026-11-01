(()=>{
'use strict';
const R=window.SR,V=R?.V10,P=R?.V131;if(!R?.App||!R?.Game||!V||!P)throw new Error('V1.3.1 checkpoints requires runtime');
const AP=R.App.prototype,GP=R.Game.prototype;
const E=(t,c,h)=>{const e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e};

const migrate130=R.migrate;
R.migrate=s=>P.normalizeCheckpoints(migrate130(s));

const prepStart130=V.startPrep;
V.startPrep=g=>{
 const p=g?._v110Prep;if(p?.v131){
   g.level=Math.max(1,p.targetLevel-p.remaining+1);
 }
 return prepStart130(g);
};

const start130=AP.startAtCheckpoint;
AP.startAtCheckpoint=function(w){
 this.s=R.migrate(this.s);w=P.normalizeCheckpointValue(w)||1;R.save(this.s);
 const g=new R.Game(this,this.s);R.game=g;g.startCheckpoint=w;g.wave=Math.max(0,w-1);g.count=999;g.sectorMap={};
 const target=P.standardLevelForWave(w),prep=Math.max(0,target-1);
 if(prep){
   g.level=1;g.xp=0;if(Number.isFinite(g.next))g.next=P.nextXpForLevel(target,w);
   g._v110Prep={remaining:prep,total:prep,targetLevel:target,v131:true};
   setTimeout(()=>V.startPrep(g),80);
 }else{g.level=1;g.xp=0;g.count=3}
 return g;
};

function makeSheet(app,cps){
 const sh=E('div','launchSheet v131LaunchSheet'),card=E('div','launchCard v131LaunchCard');
 card.innerHTML='<small>LAUNCH CHECKPOINT</small><h2>SELECT START WAVE</h2><p>Select an unlocked sector entry, then launch.</p>';
 const grid=E('div','checkpointGrid v131CheckpointGrid');for(const w of cps){const b=E('button','btn',`WAVE ${w}`);b.dataset.wave=String(w);grid.append(b)}
 const foot=E('div','v131LaunchActions'),cancel=E('button','btn quiet','CANCEL'),go=E('button','btn primary v131LaunchConfirm','▶ LAUNCH');
 cancel.onclick=()=>sh.remove();foot.append(cancel,go);card.append(grid,foot);sh.append(card);document.body.append(sh);return sh;
}
function patchSheet(app,sh){
 if(!sh||sh._v131Patched)return;sh._v131Patched=true;
 const card=sh.querySelector('.launchCard'),grid=sh.querySelector('.checkpointGrid');if(!card||!grid)return;
 const oldActions=[...card.children].filter(x=>x.tagName==='BUTTON');for(const b of oldActions)b.remove();
 const h=card.querySelector('h2');if(h)h.textContent='SELECT START WAVE';
 const p=card.querySelector('p');if(p)p.textContent='Select an unlocked sector entry, then launch.';
 const buttons=[...grid.querySelectorAll('button')],waves=buttons.map(b=>P.normalizeCheckpointValue((b.textContent.match(/\d+/)||[])[0])).filter(Boolean);
 let selected=waves.includes(1)?1:(waves[0]||1);
 const paint=()=>buttons.forEach(b=>{const w=P.normalizeCheckpointValue((b.textContent.match(/\d+/)||[])[0]);b.dataset.wave=String(w||1);b.classList.toggle('primary',w===selected);b.classList.toggle('v131Selected',w===selected);b.setAttribute('aria-pressed',w===selected?'true':'false');b.onclick=()=>{selected=w||1;paint()}});
 paint();
 let actions=card.querySelector('.v131LaunchActions');if(!actions){actions=E('div','v131LaunchActions');card.append(actions)}
 actions.innerHTML='';
 const cancel=E('button','btn quiet','CANCEL'),go=E('button','btn primary v131LaunchConfirm','▶ LAUNCH');
 cancel.onclick=()=>sh.remove();go.onclick=()=>{const w=selected;sh.remove();app.startAtCheckpoint(w)};
 actions.append(cancel,go);
}
const launch130=AP.launch;
AP.launch=function(...args){
 this.s=R.migrate(this.s);R.save(this.s);
 const hadOwn=Object.prototype.hasOwnProperty.call(this,'startAtCheckpoint'),own=this.startAtCheckpoint;let intercepted=null,out;
 this.startAtCheckpoint=w=>{intercepted=P.normalizeCheckpointValue(w)||1};
 try{out=launch130.apply(this,args)}finally{if(hadOwn)this.startAtCheckpoint=own;else delete this.startAtCheckpoint}
 let sh=document.querySelector('.launchSheet');
 if(intercepted!=null&&!sh){const cps=[...new Set(this.s.checkpoints||[1])].map(P.normalizeCheckpointValue).filter(Boolean).sort((a,b)=>a-b);sh=makeSheet(this,cps)}
 if(sh)patchSheet(this,sh);return out;
};

const enemyDie130=GP.enemyDie;
GP.enemyDie=function(e){
 const boss=!!e?.boss,out=enemyDie130.call(this,e);
 if(boss&&!this._v91DevSession&&this.s){
   P.normalizeCheckpoints(this.s);
   if((this.wave||0)%10===9&&!this.s.checkpoints.includes(this.wave+1))this.s.checkpoints.push(this.wave+1);
   P.normalizeCheckpoints(this.s);try{R.save(this.s)}catch{}
 }
 return out;
};
})();