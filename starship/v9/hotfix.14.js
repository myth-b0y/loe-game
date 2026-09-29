(()=>{
'use strict';
const R=window.SR;if(!R?.App||!R?.Game)return;
const AP=R.App.prototype,GP=R.Game.prototype,$=s=>document.querySelector(s),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
R.VERSION='0.9.9';

// ---------------------------------------------------------------------------
// v0.9.9 FOUNDATION POLISH 2
// Fleet caps/crew roles, two-seat support craft, shield presentation,
// even hardpoint capacities, enemy-trail cleanup, and FX hygiene.
// ---------------------------------------------------------------------------
const EVEN_WEAPONS=[2,4,4,6,8,10,12];
(R.HULLS||[]).forEach((h,i)=>{if(h&&EVEN_WEAPONS[i])h.weapons=EVEN_WEAPONS[i]});
if(R.SYSTEMS?.droneBay)R.SYSTEMS.droneBay.max=6;
if(R.SYSTEMS?.hangar)R.SYSTEMS.hangar.max=4;
R.MAX_DRONES=6;R.MAX_SUPPORTS=4;

const migrate99=R.migrate;
R.migrate=s=>{s=migrate99?.(s)||s;if(!s)return s;s.version='0.9.9';return s};

const crewRole=c=>{
  if(c?.role)return c.role;
  if(c?.profession===0)return'pilot';
  if(c?.profession===1)return'gunner';
  if(c?.profession===5)return'engineer';
  return null;
};
const assignedCrew=(s,role)=>((s?.crew)||[]).filter(c=>c?.assigned&&crewRole(c)===role);
const hasDroneOperator=s=>((s?.crew)||[]).some(c=>c?.assigned&&((c.role==='engineer'&&c.specialty==='Drone Systems')||c.profession===5));
const supportCrewPool=s=>({pilots:Math.max(0,assignedCrew(s,'pilot').length-1),gunners:assignedCrew(s,'gunner').length});
const supportIds=s=>{const a=Array.isArray(s?.supports)?s.supports:null,b=Array.isArray(s?.equippedSupports)?s.equippedSupports:null;return a&&a.length?a:(b||a||[])};
const supportDefs=s=>(supportIds(s).map(id=>(R.SUPPORTS||[]).find(x=>x.id===id)).filter(Boolean));
const supportPlan=(s,extra=null)=>{
  const pool=supportCrewPool(s),defs=supportDefs(s);if(extra)defs.push(typeof extra==='string'?(R.SUPPORTS||[]).find(x=>x.id===extra):extra);
  let p=0,g=0;for(const d of defs){if(!d)continue;p++;if((d.crewReq||1)>=2)g++}
  return{needPilots:p,needGunners:g,pilots:pool.pilots,gunners:pool.gunners,ok:p<=pool.pilots&&g<=pool.gunners};
};

// ---------------------------------------------------------------------------
// Capacity rules: mirrored gun pairs, absolute 6-drone / 4-support ceiling.
// ---------------------------------------------------------------------------
AP.weaponCapacity=function(){
  const h=R.HULLS?.[this.s?.hull||0],physical=Math.max(2,h?.weapons||2),gunners=assignedCrew(this.s,'gunner').length,current=(this.s?.weaponMounts||this.s?.weapons||[]).filter(Boolean).length,legacyEven=Math.ceil(current/2)*2;
  return Math.min(physical,Math.max(2,2+gunners*2,legacyEven));
};
AP.droneCapacity=function(){
  const h=R.HULLS?.[this.s?.hull||0];if(!h||!hasDroneOperator(this.s))return 0;
  return Math.min(6,h.droneCap||0,this.s?.systems?.droneBay||0);
};
AP.supportCapacity=function(){
  const h=R.HULLS?.[this.s?.hull||0];if(!h)return 0;
  return Math.min(4,h.supportCap||0,this.s?.systems?.hangar||0);
};
if(R.CREW_ROLES){const g=R.CREW_ROLES.find(r=>r.id==='gunner');if(g)g.desc='Operates paired flagship hardpoints and serves as the weapons officer aboard two-seat support craft.'}
if(R.PROFS?.[1])R.PROFS[1].desc='Brings another mirrored hardpoint pair online and serves as weapons officer aboard two-seat support craft.';

const listWeapons99=AP.listWeapons;
if(listWeapons99)AP.listWeapons=function(c){const out=listWeapons99.call(this,c);const hint=c?.querySelector?.('.hint small');if(hint)hint.textContent='Hull hardpoints mount in mirrored pairs. Each assigned Gunner brings another pair online.';return out};

// Keep the existing fleet screen, but make the cockpit requirement explicit.
const listSupports99=AP.listSupports;
if(listSupports99)AP.listSupports=function(c){
  const out=listSupports99.call(this,c);const plan=supportPlan(this.s),hint=c?.querySelector?.('.hint small');
  if(hint)hint.textContent=`${plan.needPilots}/${plan.pilots} support Pilots · ${plan.needGunners}/${plan.gunners} support Gunners · two-seat craft require one of each.`;
  const panels=[...c.querySelectorAll('.panel.gear')];panels.forEach((p,i)=>{const d=R.SUPPORTS?.[i];if(!d)return;const body=p.querySelector('.gearBody small');if(body){const req=(d.crewReq||1)>=2?'PILOT + GUNNER':'PILOT';body.innerHTML=`<strong>${req}</strong> · ${d.desc||''}`}
    const buttons=[...p.querySelectorAll('button')],action=buttons[buttons.length-1],oldClick=action?.onclick;if(action&&oldClick)action.onclick=ev=>{const ids=supportIds(this.s),isOn=ids.includes(d.id),owned=(this.s?.supportStock?.[d.id]||0)>0||(this.s?.ownedSupports||[]).includes(d.id);if(owned&&!isOn){const q=supportPlan(this.s,d);if(q.needPilots>q.pilots)return this.deny?.('NEED SUPPORT PILOT');if(q.needGunners>q.gunners)return this.deny?.('NEED SUPPORT GUNNER')}return oldClick.call(action,ev)};
  });return out;
};

// ---------------------------------------------------------------------------
// Combat fleet synchronization. Temporary card copies may not exceed the
// physical 6/4 fleet ceiling. Support seats consume real assigned roles.
// ---------------------------------------------------------------------------
const syncAllies99=GP.syncAllies;
GP.syncAllies=function(...args){
  const out=syncAllies99?.apply(this,args);
  if(Array.isArray(this.droneUnits))this.droneUnits=this.droneUnits.slice(0,6);
  if(Array.isArray(this.supportUnits)){
    const pool=supportCrewPool(this.s);let p=pool.pilots,g=pool.gunners;
    const kept=[];
    for(const u of this.supportUnits.slice(0,4)){
      const d=u?.def;if(!d||p<=0)continue;
      const two=(d.crewReq||1)>=2;if(two&&g<=0)continue;
      p--;if(two)g--;u._v99Pilot=true;u._v99Gunner=two;kept.push(u);
    }
    this.supportUnits=kept;
  }
  return out;
};

// ---------------------------------------------------------------------------
// Enemy propulsion cleanup. Retain the trail system for player/support craft,
// but suppress calls whose origin exactly matches a current enemy ship.
// ---------------------------------------------------------------------------
const trail99=R.v984DrawEngineTrail;
if(trail99)R.v984DrawEngineTrail=function(ctx,x,y,...rest){
  const g=R._v99DrawGame||R.game,enemy=g?.en?.some(e=>e&&!e.dead&&Math.abs((e.x||0)-x)<.75&&Math.abs((e.y||0)-y)<.75);
  if(enemy)return;return trail99.call(this,ctx,x,y,...rest);
};

// ---------------------------------------------------------------------------
// Two-seat support geometry. Larger hull + independent gunner turret.
// ---------------------------------------------------------------------------
const drawSupport99=R.v984DrawSupport;
if(drawSupport99)R.v984DrawSupport=function(ctx,u,def,opt={}){
  if(!u||!def)return;const two=(def.crewReq||1)>=2,mul=two?1.32:1;
  const o={...opt,size:(opt.size||1)*mul};drawSupport99.call(this,ctx,u,def,o);
  if(!two)return;
  const a=Number.isFinite(u._v99TurretAngle)?u._v99TurretAngle:(Number.isFinite(u.heading)?u.heading:-Math.PI/2),s=(opt.size||1)*mul;
  ctx.save();ctx.translate(u.x,u.y);ctx.rotate(a);ctx.fillStyle='#e9f6fb';ctx.strokeStyle='#10202a';ctx.lineWidth=Math.max(.8,s*.8);ctx.beginPath();ctx.arc(0,0,3.1*s,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle=R.v984SupportColor?.(def)||'#d9f6ff';ctx.fillRect(1.6*s,-.8*s,7.4*s,1.6*s);ctx.restore();
};

const shotPush=(g,o)=>{(g.shots||(g.shots=[])).push(o)};
GP.v99PilotFire=function(target,u,def){
  if(!target||!u||!def)return false;const desired=Math.atan2(target.y-u.y,target.x-u.x),heading=Number.isFinite(u.heading)?u.heading:desired,da=Math.atan2(Math.sin(desired-heading),Math.cos(desired-heading));
  if(Math.abs(da)>.62)return false;
  const base=def.damage||10,mul=(this.mods?.escortDmg||1),dmg=base*.64*mul,sp=540;
  shotPush(this,{x:u.x+Math.cos(heading)*8,y:u.y+Math.sin(heading)*8,vx:Math.cos(heading)*sp,vy:Math.sin(heading)*sp,damage:dmg,life:1.35,target,homing:false,aoe:def.aoe?def.aoe*.72:0,ion:!!def.ion,chain:0,pierce:0,color:'#e9fbff',family:'supportPilot'});
  this.v984Fx?.('muzzle',u.x+Math.cos(heading)*8,u.y+Math.sin(heading)*8,{life:.12,color:'#e9fbff'});return true;
};
GP.v99TurretFire=function(target,u,def){
  if(!target||!u||!def)return;const a=Number.isFinite(u._v99TurretAngle)?u._v99TurretAngle:Math.atan2(target.y-u.y,target.x-u.x),base=def.damage||10,mul=(this.mods?.escortDmg||1),dmg=Math.max(5,base*.48)*mul,sp=500;
  shotPush(this,{x:u.x+Math.cos(a)*6,y:u.y+Math.sin(a)*6,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,damage:dmg,life:1.45,target,homing:false,aoe:0,ion:false,chain:0,pierce:0,color:'#bfeeff',family:'supportTurret'});
  this.v984Fx?.('muzzle',u.x+Math.cos(a)*6,u.y+Math.sin(a)*6,{life:.12,color:'#bfeeff'});
};

const fireFriendly99=GP.v984FireFriendly;
if(fireFriendly99)GP.v984FireFriendly=function(target,u,def,kind='support'){
  if(kind==='support'&&(def?.crewReq||1)>=2)return this.v99PilotFire(target,u,def);
  return fireFriendly99.call(this,target,u,def,kind);
};

const allies99=GP.allies;
if(allies99)GP.allies=function(dt){
  const out=allies99.call(this,dt),enc=this._v8Encounter,bossMode=this.bossState?.stage==='fight',field=String(enc?.type||'').includes('asteroid');
  for(const u of this.supportUnits||[]){
    const d=u?.def;if(!d||(d.crewReq||1)<2||u._v984Respawn>0||u._v984State==='dead'||u._v984State==='launch')continue;
    u._v99TurretCd=(u._v99TurretCd||0)-dt;u._v99PilotCd=(u._v99PilotCd||0)-dt;
    let target=this.priority&&this.validTarget?.(this.priority)?this.priority:null;
    if(!target)target=this.v984SupportTarget?.(u,bossMode,field)||null;
    if(target){
      const desired=Math.atan2(target.y-u.y,target.x-u.x),cur=Number.isFinite(u._v99TurretAngle)?u._v99TurretAngle:(u.heading||desired),da=Math.atan2(Math.sin(desired-cur),Math.cos(desired-cur));u._v99TurretAngle=cur+clamp(da,-4.8*dt,4.8*dt);
      const rate=(d.rate||.8)*(this.mods?.escortRate||1)*(this.escortBuff?1.8:1);
      if(u._v99TurretCd<=0&&Math.hypot(target.x-u.x,target.y-u.y)<430){this.v99TurretFire(target,u,d);u._v99TurretCd=1/Math.max(.22,rate*.78)}
      // Repair cutters do not use the older offensive branch, so give their
      // pilot the same small forward gun as other two-seat craft.
      if(d.repair&&u._v99PilotCd<=0&&this.v99PilotFire(target,u,d))u._v99PilotCd=1/Math.max(.22,rate*.72);
    }
    // Larger crewed ships carry more structure and recover more slowly.
    if(d.crewReq>=2){u.vx*=.996;u.vy*=.996;if(u._v984MaxHp<150){u._v984MaxHp=Math.round(u._v984MaxHp*1.28);u._v984Hp=Math.min(u._v984MaxHp,Math.round((u._v984Hp||u._v984MaxHp)*1.28))}if(u._v984MaxShield<70){u._v984MaxShield=Math.round(u._v984MaxShield*1.3);u._v984Shield=Math.min(u._v984MaxShield,Math.round((u._v984Shield||u._v984MaxShield)*1.3))}}
  }
  return out;
};

// ---------------------------------------------------------------------------
// Shield renderer. Suppress the legacy ghost ellipse in combat and replace it
// with a percent-aware bubble, localized impacts, collapse, and reform.
// ---------------------------------------------------------------------------
const drawShip99=R.drawShip;
R.drawShip=function(ctx,cx,cy,scale=1,weapons=[],tier=0,preview=false,state={}){
  if(preview)return drawShip99.call(this,ctx,cx,cy,scale,weapons,tier,preview,state);
  return drawShip99.call(this,ctx,cx,cy,scale,weapons,tier,preview,{...state,shield:0,shieldPulse:0});
};

const hitShip99=GP.hitShip;
GP.hitShip=function(d,x=this.cx,y=this.cy){
  const before=Number(this.shield)||0,out=hitShip99.call(this,d,x,y),after=Number(this.shield)||0;
  if(before>0&&after<=0){this._v99ShieldBreak=.72;this._v99ShieldReform=0;this.v984Fx?.('shieldBreak',x,y,{life:.72,color:'#8beeff'})}
  return out;
};

const update99=GP.update;
GP.update=function(dt){
  const before=Number(this.shield)||0,out=update99.call(this,dt),after=Number(this.shield)||0;
  this._v99ShieldBreak=Math.max(0,(this._v99ShieldBreak||0)-dt);this._v99ShieldReform=Math.max(0,(this._v99ShieldReform||0)-dt);
  if(before<=0&&after>0)this._v99ShieldReform=.75;
  if(this._v97ShieldHits?.length>14)this._v97ShieldHits=this._v97ShieldHits.slice(-14);
  if(this._v984Fx?.length>96)this._v984Fx=this._v984Fx.slice(-96);
  if(this.fx?.length>140)this.fx=this.fx.slice(-140);
  return out;
};

const draw99=GP.draw;
GP.draw=function(){
  R._v99DrawGame=this;let out;try{out=draw99.call(this)}finally{R._v99DrawGame=null}const x=this.x;if(!x||this._v98Engineer)return out;
  const max=Math.max(1,Number(this.maxShield)||1),cur=Math.max(0,Number(this.shield)||0),pct=clamp(cur/max,0,1),q=this.v97ShipContact?.(true)||{rx:70,ry:86};
  if(cur>0){
    const reform=this._v99ShieldReform>0?1-clamp(this._v99ShieldReform/.75,0,1):1,pulse=.5+.5*Math.sin((this.t||0)*1.55),alpha=(.10+.13*pct+.025*pulse)*reform;
    x.save();const g=x.createRadialGradient(this.cx,this.cy,Math.min(q.rx,q.ry)*.35,this.cx,this.cy,Math.max(q.rx,q.ry));g.addColorStop(0,'rgba(80,215,255,0)');g.addColorStop(.72,`rgba(82,218,255,${alpha*.18})`);g.addColorStop(1,`rgba(130,238,255,${alpha*.42})`);x.fillStyle=g;x.beginPath();x.ellipse(this.cx,this.cy,q.rx,q.ry,0,0,Math.PI*2);x.fill();x.strokeStyle=`rgba(135,239,255,${Math.min(.58,alpha*2.1)})`;x.lineWidth=1.6+.9*pct;x.beginPath();x.ellipse(this.cx,this.cy,q.rx,q.ry,0,0,Math.PI*2);x.stroke();x.restore();
    for(const h of this._v97ShieldHits||[]){const p=clamp(h.life/Math.max(.001,h.max||.42),0,1),hx=this.cx+h.dx,hy=this.cy+h.dy,r=7+(1-p)*30;x.save();x.globalAlpha=p*.82;x.strokeStyle='#b6f6ff';x.lineWidth=1.4+1.5*p;x.beginPath();x.arc(hx,hy,r,0,Math.PI*2);x.stroke();x.globalAlpha=p*.24;x.fillStyle='#7feaff';x.beginPath();x.arc(hx,hy,6+10*(1-p),0,Math.PI*2);x.fill();x.restore()}
  }else if(this._v99ShieldBreak>0){
    const p=clamp(this._v99ShieldBreak/.72,0,1),expand=1+(1-p)*.16;x.save();x.globalAlpha=p*.55;x.strokeStyle='#8beeff';x.lineWidth=2.2*p;x.setLineDash([8,7]);x.beginPath();x.ellipse(this.cx,this.cy,q.rx*expand,q.ry*expand,0,0,Math.PI*2);x.stroke();x.setLineDash([]);x.restore();
  }
  // Give enemy shields a little actual surface without reintroducing trails.
  for(const e of this.en||[]){if(e?.dead||!(e._v984Shield>0))continue;const r=e.size||12,ep=clamp(e._v984Shield/Math.max(1,e._v984MaxShield||e._v984Shield),0,1);x.save();x.globalAlpha=.08+.12*ep+(e._v984ShieldFlash||0)*.28;x.strokeStyle=e.type?.color||'#7fe8ff';x.fillStyle=e.type?.color||'#7fe8ff';x.lineWidth=1.25;x.beginPath();x.ellipse(e.x,e.y,r*1.36,r*1.52,0,0,Math.PI*2);x.stroke();x.globalAlpha*=.13;x.fill();x.restore()}
  return out;
};

// ---------------------------------------------------------------------------
// Lightweight performance hygiene. This is NOT the endless/card rebalance.
// ---------------------------------------------------------------------------
const fx99=GP.v984Fx;
if(fx99)GP.v984Fx=function(...args){const out=fx99.apply(this,args);if(this._v984Fx?.length>96)this._v984Fx.splice(0,this._v984Fx.length-96);return out};

// ---------------------------------------------------------------------------
// Version sync after older layers stamp their historical runtime numbers.
// ---------------------------------------------------------------------------
const syncVersion99=()=>{R.VERSION='0.9.9';if(R.app?.s){R.app.s.version='0.9.9';try{R.save?.(R.app.s)}catch{}}if(!document.body)return;const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;while((n=w.nextNode()))if(n.nodeValue&&/0\.9\.8/.test(n.nodeValue))n.nodeValue=n.nodeValue.replace(/0\.9\.8/g,'0.9.9')};
for(const k of ['main','station','settings','slots']){const fn=AP[k];if(typeof fn==='function')AP[k]=function(...args){R.VERSION='0.9.9';const out=fn.apply(this,args);queueMicrotask(syncVersion99);return out}}
queueMicrotask(syncVersion99);

})();
