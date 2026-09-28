(()=>{
'use strict';
const R=window.SR;if(!R?.Game)return;
const GP=R.Game.prototype,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
R.VERSION='0.9.8';

// ---------------------------------------------------------------------------
// v0.9.8 ACCEPTANCE HOTFIX 2 — PLAYER PROJECTILE INTEGRITY
// Keep the proven hostile-projectile pipeline untouched. Player shots are
// temporarily removed while the prior resolver runs, then resolved here
// against the real combat target API: allCombatTargets().
// ---------------------------------------------------------------------------
const projectileBase983=GP.projectiles;

const segCircle983=(x0,y0,x1,y1,cx,cy,r)=>{
  const dx=x1-x0,dy=y1-y0,fx=x0-cx,fy=y0-cy;
  const A=dx*dx+dy*dy;
  if(A<1e-9){const inside=fx*fx+fy*fy<=r*r;return inside?{t:0,x:x0,y:y0}:null}
  const C=fx*fx+fy*fy-r*r;
  if(C<=0)return{t:0,x:x0,y:y0};
  const B=2*(fx*dx+fy*dy),D=B*B-4*A*C;
  if(D<0)return null;
  const q=Math.sqrt(D),t1=(-B-q)/(2*A),t2=(-B+q)/(2*A);
  const t=t1>=0&&t1<=1?t1:t2>=0&&t2<=1?t2:null;
  return t==null?null:{t,x:x0+dx*t,y:y0+dy*t};
};

const combatTargets983=g=>{
  if(typeof g.allCombatTargets==='function')return g.allCombatTargets()||[];
  // Defensive fallback only. In dev mode, make the missing contract loud.
  if((g._v91DevSession||/[?&]dev(?:=1|&|$)/.test(location.search))&&!g._v983MissingTargetApiLogged){
    g._v983MissingTargetApiLogged=true;console.error('[STARSHIP] allCombatTargets() missing; using emergency target reconstruction.');
  }
  const out=[...(g.en||[])];
  for(const e of g.en||[])if(e?.boss&&e.subsystems)for(const s of e.subsystems)if(!s.dead)out.push(s);
  return out;
};

const aliveTarget983=(g,t)=>{
  if(!t||t.dead)return false;
  if(t.parentBoss)return !t.dead&&(g.en||[]).includes(t.parentBoss)&&!t.parentBoss.dead;
  if(t.rock)return (g.rocks||[]).includes(t)&&!t.dead;
  return (g.en||[]).includes(t)&&!t.dead;
};

const radius983=t=>t?.parentBoss?10:Math.max(5,(Number(t?.r)||Number(t?.size)||10)+5);

const findContact983=(g,p,x0,y0,x1,y1)=>{
  const hits=p._v983Hits||(p._v983Hits=new Set());let best=null;
  // A deliberately targeted boss subsystem must remain targetable even though
  // its collision circle sits inside the parent boss silhouette.
  const preferred=p.target;
  if(preferred?.parentBoss&&!hits.has(preferred)&&aliveTarget983(g,preferred)&&(typeof g.validTarget!=='function'||g.validTarget(preferred)!==false)){
    const q=segCircle983(x0,y0,x1,y1,preferred.x,preferred.y,radius983(preferred)+(Number(p.r)||0));
    if(q)return{kind:'combat',obj:preferred,q};
  }
  for(const t of combatTargets983(g)){
    if(preferred?.parentBoss===t)continue;
    if(hits.has(t)||!aliveTarget983(g,t))continue;
    if(typeof g.validTarget==='function'&&g.validTarget(t)===false)continue;
    const q=segCircle983(x0,y0,x1,y1,t.x,t.y,radius983(t)+(Number(p.r)||0));
    if(q&&(!best||q.t<best.q.t))best={kind:'combat',obj:t,q};
  }
  for(const r of g.rocks||[]){
    if(hits.has(r)||r.dead||r.hp<=0)continue;
    const q=segCircle983(x0,y0,x1,y1,r.x,r.y,(Number(r.r)||12)+(Number(p.r)||0)+2);
    if(q&&(!best||q.t<best.q.t))best={kind:'rock',obj:r,q};
  }
  return best;
};

const ricochetTarget983=(g,p,from)=>{
  if(!(p.ricochet>0))return null;
  const hits=p._v983Hits||(p._v983Hits=new Set()),pool=[];
  for(const t of combatTargets983(g))if(t!==from&&!hits.has(t)&&aliveTarget983(g,t)&&(typeof g.validTarget!=='function'||g.validTarget(t)!==false))pool.push(t);
  for(const r of g.rocks||[])if(r!==from&&!hits.has(r)&&!r.dead&&r.hp>0)pool.push(r);
  return pool.filter(t=>Math.hypot(t.x-p.x,t.y-p.y)<=260).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0]||null;
};

const applyCombatImpact983=(g,p,hit)=>{
  const target=hit.obj;p._v983Hits.add(target);p.x=hit.q.x;p.y=hit.q.y;
  g.damageTarget(target,p.damage);
  const host=target.parentBoss||target;
  if(p.ion){
    if(host.shield!=null)host.shield=Math.max(0,host.shield-p.damage*.8);
    host.ion=1.3;
    if(p.chain){
      const near=(g.en||[]).filter(e=>e!==host&&!e.dead&&Math.hypot(e.x-host.x,e.y-host.y)<130).slice(0,p.chain);
      near.forEach(e=>g.damageTarget(e,p.damage*.45));
    }
  }
  if(p.aoe){for(const e of g.en||[])if(e!==host&&!e.dead&&Math.hypot(e.x-host.x,e.y-host.y)<p.aoe)g.damageTarget(e,p.damage*.5)}
};

const applyRockImpact983=(g,p,hit)=>{
  const rock=hit.obj;p._v983Hits.add(rock);p.x=hit.q.x;p.y=hit.q.y;g.damageRock(rock,p.damage);
};

const continueAfterHit983=(g,p,hit)=>{
  if(p.pierce>0){
    p.pierce--;
    const sp=Math.hypot(p.vx,p.vy)||1;p.x+=p.vx/sp*1.5;p.y+=p.vy/sp*1.5;
    return true;
  }
  const next=ricochetTarget983(g,p,hit.obj);
  if(next){
    const sp=Math.max(300,Math.hypot(p.vx,p.vy)||650),a=Math.atan2(next.y-p.y,next.x-p.x);
    p.vx=Math.cos(a)*sp;p.vy=Math.sin(a)*sp;p.damage*=.72;p.ricochet--;p.target=next;p.homing=false;p.life=Math.max(p.life,.35);
    p.x+=Math.cos(a)*1.5;p.y+=Math.sin(a)*1.5;
    return true;
  }
  p.life=0;return false;
};

const stepPlayerShot983=(g,p,dt)=>{
  if(!p||p.life<=0)return;
  if(p.homing&&p.target&&aliveTarget983(g,p.target)&&(typeof g.validTarget!=='function'||g.validTarget(p.target)!==false)){
    const a=Math.atan2(p.target.y-p.y,p.target.x-p.x),sp=Math.hypot(p.vx,p.vy)||1;
    p.vx+=Math.cos(a)*sp*.9*dt;p.vy+=Math.sin(a)*sp*.9*dt;
    const n=Math.hypot(p.vx,p.vy)||1;p.vx=p.vx/n*sp;p.vy=p.vy/n*sp;
  }
  const x0=p.x,y0=p.y,x1=x0+p.vx*dt,y1=y0+p.vy*dt;p.life-=dt;
  if(p.life<=0){p.x=x1;p.y=y1;return}
  const hit=findContact983(g,p,x0,y0,x1,y1);
  if(!hit){p.x=x1;p.y=y1;return}
  if(hit.kind==='combat')applyCombatImpact983(g,p,hit);else applyRockImpact983(g,p,hit);
  continueAfterHit983(g,p,hit);
};

GP.projectiles=function(dt){
  dt=Math.max(0,Number(dt)||0);
  const playerShots=this.shots||[];
  // Let the current 0.9.7/0.9.8 hostile resolver do exactly what it already
  // does, but with no player shots available to its broken target lookup.
  this.shots=[];
  try{projectileBase983.call(this,dt)}finally{this.shots=playerShots}

  const rawTargets=combatTargets983(this),liveEnemies=(this.en||[]).filter(e=>!e.dead);
  if(playerShots.some(p=>p&&p.life>0)&&liveEnemies.length&&rawTargets.length===0&&(this._v91DevSession||/[?&]dev(?:=1|&|$)/.test(location.search))){
    const now=performance.now();if(!this._v983EmptyTargetWarnAt||now-this._v983EmptyTargetWarnAt>2000){this._v983EmptyTargetWarnAt=now;console.warn('[STARSHIP] PLAYER PROJECTILE TARGET SET EMPTY WITH LIVE HOSTILES');}
  }

  let maxSpeed=0;for(const p of playerShots)if(p&&p.life>0)maxSpeed=Math.max(maxSpeed,Math.hypot(p.vx||0,p.vy||0));
  const steps=clamp(Math.ceil((maxSpeed*dt)/8),1,6),sub=steps?dt/steps:dt;
  for(let i=0;i<steps;i++)for(const p of playerShots)stepPlayerShot983(this,p,sub);
  this.shots=playerShots.filter(p=>p&&p.life>0&&p.x>-110&&p.x<this.w+110&&p.y>-110&&p.y<this.hgt+110);
};

})();
