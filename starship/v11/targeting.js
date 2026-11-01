(()=>{
'use strict';
const R=window.SR,V=R?.V10,X=R?.V130;if(!R?.Game||!V||!X)throw new Error('V1.3 targeting requires runtime');
const GP=R.Game.prototype,clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
const role=e=>Number(e?.type?.role??e?.role??0)||0;
const activeSupport=u=>u&&!(u._v984Respawn>0)&&u._v984State!=='dead'&&u._v984State!=='launch'&&Number(u._v984Hp??1)>0;

X.friendlyThreatScore=(g,e,u)=>{
 const dFlag=Math.hypot((e.x||0)-g.cx,(e.y||0)-g.cy),dEscort=u?Math.hypot((e.x||0)-u.x,(e.y||0)-u.y):0,r=role(e);
 let score=1500-dFlag*2.55-dEscort*.22+r*34;if(e.boss)score+=650;if(dFlag<220)score+=(220-dFlag)*1.25;if(e._v130AttackingFlagship)score+=90;return score;
};
const supportTarget121=GP.v984SupportTarget;
if(supportTarget121)GP.v984SupportTarget=function(u,bossMode,field){
 if(this.priority&&this.validTarget?.(this.priority))return this.priority;
 if(bossMode)return supportTarget121.call(this,u,bossMode,field);
 const enemies=(this.en||[]).filter(e=>e&&!e.dead);if(enemies.length)return enemies.sort((a,b)=>X.friendlyThreatScore(this,b,u)-X.friendlyThreatScore(this,a,u))[0];
 return supportTarget121.call(this,u,bossMode,field);
};

// Offensive drones use the same flagship-threat ordering while preserving their
// existing range checks and orbit behavior. The enemy list is restored immediately
// after the canonical ally update so no other combat system inherits the sort.
const allies121=GP.allies;
if(allies121)GP.allies=function(dt){
 const original=this.en;if(!Array.isArray(original)||original.length<2)return allies121.call(this,dt);
 const sorted=original.slice().sort((a,b)=>X.friendlyThreatScore(this,b,null)-X.friendlyThreatScore(this,a,null));
 this.en=sorted;try{return allies121.call(this,dt)}finally{this.en=original}
};

X.enemySupportChance=e=>{
 if(e?.boss)return 0;const r=role(e);if(r<=1)return .72;if(r===2)return .38;if(r===3)return .24;return .10;
};
X.pickEnemyTarget=(g,e)=>{
 const supports=(g.supportUnits||[]).filter(activeSupport);if(!supports.length||Math.random()>=X.enemySupportChance(e))return null;
 const now=performance.now()/1000,old=e?._v130VolleyTarget;if(old&&activeSupport(old)&&now-(e._v130VolleyAt||0)<.7)return old;
 let best=null,bestScore=Infinity;
 for(const u of supports){const d=Math.hypot((e.x||0)-u.x,(e.y||0)-u.y),sat=(g.bad||[]).filter(p=>p?._v130Target===u&&p.life>0).length,ratio=(u._v984Hp||1)/Math.max(1,u._v984MaxHp||1),score=d+sat*85+(1-ratio)*18+Math.random()*20;if(score<bestScore){best=u;bestScore=score}}
 if(e){e._v130VolleyTarget=best;e._v130VolleyAt=now}return best;
};

// Reuse the canonical enemy-shot generator, but temporarily point its flagship
// coordinates at a chosen support craft. That preserves every existing weapon
// pattern while allowing small and medium enemies to acknowledge the fleet.
const enemyShot121=GP.enemyShot;
if(enemyShot121)GP.enemyShot=function(e,speed,damage,angleOffset=0,homing=false){
 const target=X.pickEnemyTarget(this,e),before=(this.bad||[]).length;if(!target){if(e)e._v130AttackingFlagship=true;return enemyShot121.call(this,e,speed,damage,angleOffset,homing)}
 if(e)e._v130AttackingFlagship=false;const ox=this.cx,oy=this.cy;let out;try{this.cx=target.x;this.cy=target.y;out=enemyShot121.call(this,e,speed,damage,angleOffset,homing)}finally{this.cx=ox;this.cy=oy}
 for(let i=before;i<(this.bad||[]).length;i++){const p=this.bad[i];if(p){p._v130Target=target;p._v130TargetKind='support'}}return out;
};

// The older homing loop always curves toward cx/cy. Tagged projectiles steer
// toward their intended support target here, then enter the canonical collision
// pipeline with homing temporarily disabled so the old flagship steering cannot
// overwrite the new vector.
const projectiles121=GP.projectiles;
if(projectiles121)GP.projectiles=function(dt){
 for(const p of this.bad||[]){
   const t=p?._v130Target;if(!p?.homing||!activeSupport(t))continue;
   const a=Math.atan2(t.y-p.y,t.x-p.x),sp=Math.hypot(p.vx||0,p.vy||0)||1,k=clamp(dt*.8,0,1);p.vx+=(Math.cos(a)*sp-p.vx)*k;p.vy+=(Math.sin(a)*sp-p.vy)*k;p._v130RestoreHoming=true;p.homing=false;
 }
 const out=projectiles121.call(this,dt);
 for(const p of this.bad||[])if(p?._v130RestoreHoming){p.homing=true;delete p._v130RestoreHoming;if(!activeSupport(p._v130Target)){delete p._v130Target;delete p._v130TargetKind}}
 return out;
};
})();
