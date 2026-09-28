(()=>{
'use strict';
const R=window.SR;if(!R?.App||!R?.Game)return;
const AP=R.App.prototype,GP=R.Game.prototype,$=s=>document.querySelector(s),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const E=(t,c,h)=>{const e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e};
R.VERSION='0.9.8';

// ---------------------------------------------------------------------------
// ACCEPTANCE COLLISION: adaptive projectile substeps prevent fast shots from
// tunneling through small enemies/subsystems between rendered frames.
// ---------------------------------------------------------------------------
const projectiles981=GP.projectiles;
GP.projectiles=function(dt){
  dt=Math.max(0,Number(dt)||0);let maxSpeed=0;
  for(const p of this.shots||[])maxSpeed=Math.max(maxSpeed,Math.hypot(p.vx||0,p.vy||0));
  for(const p of this.bad||[])maxSpeed=Math.max(maxSpeed,Math.hypot(p.vx||0,p.vy||0));
  const steps=clamp(Math.ceil((maxSpeed*dt)/8),1,5),step=steps?dt/steps:dt;
  for(let i=0;i<steps;i++){projectiles981.call(this,step);if(this.dead)break}
};

// ---------------------------------------------------------------------------
// RUN LEVEL: text-only, anchored directly above the player stat bars. Keeping
// it inside #bars also guarantees it disappears when combat leaves the DOM.
// ---------------------------------------------------------------------------
const build981=GP.build;
GP.build=function(...args){
  const out=build981.apply(this,args),bars=$('#bars');let lv=$('#v98Level');
  if(lv&&bars){lv.className='v98LevelInline';lv.textContent=`LV ${this.level||1}`;bars.prepend(lv)}
  return out;
};
const hud981=GP.hud;
GP.hud=function(){const out=hud981?.call(this);const lv=$('#v98Level');if(lv)lv.textContent=`LV ${this.level||1}`;return out};
const clearRunLevel=()=>$('#v98Level')?.remove();

// ---------------------------------------------------------------------------
// DRONE FORMATIONS + SUPPORT FLIGHT
// Drones use shared clocks so spacing never collapses. Support craft now have
// velocity/heading and operate as ships instead of oversized orbiting drones.
// ---------------------------------------------------------------------------
const normAngle=a=>Math.atan2(Math.sin(a),Math.cos(a));
const steerPoint=(u,tx,ty,dt,maxSpeed=170,response=2.8)=>{
  u.vx=Number(u.vx)||0;u.vy=Number(u.vy)||0;
  const dx=tx-u.x,dy=ty-u.y,d=Math.hypot(dx,dy)||1,s=Math.min(maxSpeed,d*3.1),dvx=dx/d*s,dvy=dy/d*s,k=Math.min(1,dt*response);
  u.vx+=(dvx-u.vx)*k;u.vy+=(dvy-u.vy)*k;u.x+=u.vx*dt;u.y+=u.vy*dt;
  if(Math.hypot(u.vx,u.vy)>3)u.heading=Math.atan2(u.vy,u.vx);
};
const freeFly=(g,u,target,dt)=>{
  u.vx=Number(u.vx)||0;u.vy=Number(u.vy)||0;u.heading=Number.isFinite(u.heading)?u.heading:Math.atan2(u.vy||-1,u.vx||0);u.passSide=u.passSide||((u.index%2)?1:-1);
  const dx=target.x-u.x,dy=target.y-u.y,d=Math.hypot(dx,dy)||1;let desired=Math.atan2(dy,dx);
  if(d<92)desired+=u.passSide*1.38;else if(d<165)desired+=u.passSide*.52;
  const turn=2.7,da=normAngle(desired-u.heading);u.heading+=clamp(da,-turn*dt,turn*dt);
  const speed=d>155?178:d>85?152:132,k=Math.min(1,dt*2.7),dvx=Math.cos(u.heading)*speed,dvy=Math.sin(u.heading)*speed;
  u.vx+=(dvx-u.vx)*k;u.vy+=(dvy-u.vy)*k;u.x+=u.vx*dt;u.y+=u.vy*dt;
  const pad=28;if(u.x<-pad||u.x>g.w+pad||u.y<-pad||u.y>g.hgt+pad){steerPoint(u,g.cx,g.cy,dt,190,4.2)}
};
GP.allies=function(dt){
  const hostiles=(this.en||[]).filter(e=>!e.dead),rocks=(this.rocks||[]).filter(r=>!r.dead),enc=this._v8Encounter,bossMode=this.bossState?.stage==='fight',field=enc?.type==='asteroid',combat=enc?.type==='combat'&&!enc.complete;
  const defensive=(this.droneUnits||[]).filter(u=>u.def?.role==='defense'),offensive=(this.droneUnits||[]).filter(u=>u.def?.role!=='defense');
  this._v981DefOrbit=(this._v981DefOrbit||0)+dt*1.02;this._v981OffOrbit=(this._v981OffOrbit||0)-dt*.78;
  const orbit=(list,isDefense)=>list.forEach((u,i)=>{
    const d=u.def;if(!d)return;u.cd=(u.cd||0)-dt;const a=(isDefense?this._v981DefOrbit:this._v981OffOrbit)+(i/Math.max(1,list.length))*Math.PI*2,rad=isDefense?52:84,flat=isDefense?.72:.78;
    u.angle=a;const tx=this.cx+Math.cos(a)*rad,ty=this.cy+Math.sin(a)*rad*flat,k=Math.min(1,dt*9);u.x+=(tx-u.x)*k;u.y+=(ty-u.y)*k;
    if(isDefense){
      if(d.pd){const p=(this.bad||[]).find(p=>p.life>0&&Math.hypot(p.x-u.x,p.y-u.y)<78);if(p&&Math.random()<d.pd*12*dt){p.life=0;R.audio?.play('drone')}}
      if(d.repair)this.hp=Math.min(this.maxHp,this.hp+d.repair*dt);
      if(d.shield)this.shield=Math.min(this.maxShield,this.shield+this.maxShield*d.shield*dt);
    }else{
      let target=this.priority&&this.validTarget?.(this.priority)&&Math.hypot(this.priority.x-u.x,this.priority.y-u.y)<300?this.priority:null;
      if(!target)target=hostiles.filter(e=>Math.hypot(e.x-u.x,e.y-u.y)<300).sort((a,b)=>Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(b.x-u.x,b.y-u.y))[0];
      if(!target&&field)target=rocks.filter(r=>Math.hypot(r.x-u.x,r.y-u.y)<300).sort((a,b)=>Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(b.x-u.x,b.y-u.y))[0];
      if(target&&u.cd<=0){this.fireAlly(target,u.x,u.y,d.damage*this.mods.droneDmg,d.aoe,d.ion,'drone');u.cd=1/(d.rate*this.mods.droneRate*(this.droneBuff?1.8:1))}
    }
  });
  orbit(defensive,true);orbit(offensive,false);

  const supports=this.supportUnits||[];
  supports.forEach((u,i)=>{
    const d=u.def;if(!d)return;u.cd=(u.cd||0)-dt;u.index=i;
    const side=i%2?1:-1,row=i>>1,tight=bossMode,homeX=this.cx+side*(tight?48:72+row*18),homeY=this.cy+(tight?34+row*12:56+row*18);
    if(d.repair){steerPoint(u,homeX,homeY,dt,tight?145:155,3.1);this.hp=Math.min(this.maxHp,this.hp+d.repair*dt);return}
    let target=null;
    if(this.priority&&this.validTarget?.(this.priority))target=this.priority;
    if(!target&&hostiles.length)target=hostiles.slice().sort((a,b)=>Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(b.x-u.x,b.y-u.y))[0];
    if(!target&&(field||combat))target=rocks.slice().sort((a,b)=>Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(b.x-u.x,b.y-u.y))[0];
    if(bossMode){steerPoint(u,homeX,homeY,dt,150,3.5)}
    else if((combat||field)&&target){freeFly(this,u,target,dt)}
    else if(combat||field){u.loiter=(u.loiter||((i/Math.max(1,supports.length))*Math.PI*2))+dt*(.28+((i%3)*.025));const lr=105+(i%2)*18;steerPoint(u,this.cx+Math.cos(u.loiter)*lr,this.cy+Math.sin(u.loiter)*lr*.68,dt,155,2.8)}
    else{steerPoint(u,homeX,homeY,dt,165,3.4)}
    if(target&&u.cd<=0&&Math.hypot(target.x-u.x,target.y-u.y)<355){this.fireAlly(target,u.x,u.y,d.damage*this.mods.escortDmg,d.aoe,d.ion,'support');u.cd=1/(d.rate*this.mods.escortRate*(this.escortBuff?1.8:1))}
  });
};

// Draw a directional support-craft silhouette over the legacy static glyph so
// their turns and attack passes are readable immediately.
const draw981=GP.draw;
GP.draw=function(){
  const out=draw981.call(this);if(this._v98Engineer)return out;const x=this.x;if(!x)return out;
  for(const u of this.supportUnits||[]){const a=Number.isFinite(u.heading)?u.heading:-Math.PI/2;x.save();x.translate(u.x,u.y);x.rotate(a+Math.PI/2);x.fillStyle='#b9d3de';x.strokeStyle='#edfaff';x.lineWidth=1;x.beginPath();x.moveTo(0,-9);x.lineTo(6.5,7);x.lineTo(0,4);x.lineTo(-6.5,7);x.closePath();x.fill();x.stroke();x.restore()}
  return out;
};

// ---------------------------------------------------------------------------
// AMBIENT ASTEROIDS: real destructible rocks can cross ordinary combat waves,
// but they are not encounter objectives and therefore never block completion.
// ---------------------------------------------------------------------------
GP.v981SpawnAmbientRock=function(){
  if(this._v8Encounter?.type!=='combat')return null;const edge=Math.random()*4|0,size=Math.random()<.18?2:1,r=size===2?25:16,rich=Math.random()<.08,speed=24+Math.random()*24;let x,y,vx,vy;
  if(edge===0){x=-r-18;y=90+Math.random()*Math.max(80,this.hgt-190);vx=speed;vy=(Math.random()-.5)*18}
  else if(edge===1){x=this.w+r+18;y=90+Math.random()*Math.max(80,this.hgt-190);vx=-speed;vy=(Math.random()-.5)*18}
  else if(edge===2){x=30+Math.random()*Math.max(40,this.w-60);y=-r-18;vx=(Math.random()-.5)*18;vy=speed}
  else{x=30+Math.random()*Math.max(40,this.w-60);y=this.hgt+r+18;vx=(Math.random()-.5)*18;vy=-speed}
  let rock=this._v8MakeRock?.(size,rich,x,y);if(!rock)rock={rock:true,x,y,r,hp:(rich?145:82)+this.wave*2,max:(rich?145:82)+this.wave*2,value:Math.round((rich?95:38)+this.wave*(rich?2.4:1.2)),rich,spin:Math.random()*6};
  rock.x=x;rock.y=y;rock.vx=vx;rock.vy=vy;rock.r=rock.r||r;rock._v981Ambient=true;rock._v97Entered=false;(this.rocks||(this.rocks=[])).push(rock);return rock;
};
const update981=GP.update;
GP.update=function(dt){
  const out=update981.call(this,dt);if(this.dead||this.paused)return out;const enc=this._v8Encounter;
  if(enc?.type==='combat'&&!enc.complete&&!this.bossState){this._v981AmbientClock=(this._v981AmbientClock??(3.5+Math.random()*3))-dt;const n=(this.rocks||[]).filter(r=>r._v981Ambient&&!r.dead).length;if(this._v981AmbientClock<=0&&n<3){this.v981SpawnAmbientRock();this._v981AmbientClock=5.5+Math.random()*6.5}}
  else this._v981AmbientClock=null;return out;
};

// ---------------------------------------------------------------------------
// REAL-SCENARIO INJECTOR
// Settings can launch actual combat-flow scenarios using the player's loadout.
// Boss tests use the normal boss controller; Engineer tests clear a real combat
// wave first, then run the complete Engineer arrival/comms/trade/departure flow.
// ---------------------------------------------------------------------------
const spawnWave981=GP.spawnWave;
GP.spawnWave=function(){
  const s=this._v981Scenario;if(!s||s.started)return spawnWave981.call(this);s.started=true;this._v91DevSession=true;
  const wave=s.type==='boss'?Math.max(1,Math.floor(s.wave||50)):18,sector=this.pickSector?.(this.v98Tier?.(wave)??Math.floor(wave/10))||this.currentSector;
  this.wave=wave;this.currentSector=sector;this.active=true;const we=$('#wave');if(we)we.textContent=`◈ ${wave} · ${sector?.name||'TEST SECTOR'}`;
  if(s.type==='boss'){s.stage='boss';return this._v8BeginBoss(wave,sector)}
  s.stage='combat';s.engineerAfterClear=true;return this._v8BeginCombat(wave,sector);
};
const finishEncounter981=GP._v8FinishEncounter;
GP._v8FinishEncounter=function(...args){
  const enc=this._v8Encounter,s=this._v981Scenario,inject=!!(s?.engineerAfterClear&&!s.engineerTriggered&&enc?.type==='combat');const out=finishEncounter981.apply(this,args);
  if(inject){s.engineerTriggered=true;s.engineerAfterClear=false;setTimeout(()=>{if(!this.dead)this.v98StartEngineer?.()},120)}
  return out;
};
const enemyDie981=GP.enemyDie;
GP.enemyDie=function(e){
  if(!(this._v981Scenario&&e?.boss))return enemyDie981.call(this,e);
  const save=R.save,cps=[...(this.s?.checkpoints||[1])];try{R.save=()=>{};return enemyDie981.call(this,e)}finally{R.save=save;if(this.s)this.s.checkpoints=cps}
};
AP.v981LaunchScenario=function(type,wave=50){
  const start=this.startAtCheckpoint;if(typeof start!=='function')return this.deny?.('SCENARIO UNAVAILABLE');clearRunLevel();start.call(this,1);
  let tries=0;const arm=()=>{const g=R.game;if(!g&&tries++<20)return setTimeout(arm,25);if(!g)return this.deny?.('SCENARIO FAILED');g._v981Scenario={type,wave:Number(wave)||50,started:false};g._v91DevSession=true;g.wave=0;g.active=false;g._v8Encounter=null;g.count=.18;g.paused=false;g.dead=false};arm();
};
AP.v981ScenarioSettings=function(){
  const grid=$('.v93SettingsGrid');if(!grid||grid.querySelector('.v981ScenarioPanel'))return;const row=E('article','v981ScenarioPanel');
  row.innerHTML=`<div><small>DEVELOPER</small><b>SCENARIO INJECTOR</b><p>Launch real expedition flow without grinding through prerequisite waves.</p></div><div class="v981ScenarioControls"><button class="v93Action" data-eng>ENGINEER CONTACT</button><label><span>BOSS WAVE</span><input data-wave type="number" inputmode="numeric" min="1" max="999" value="50"></label><button class="v93Action" data-boss>RUN BOSS</button></div>`;grid.append(row);
  row.querySelector('[data-eng]').onclick=()=>this.v981LaunchScenario('engineer',18);row.querySelector('[data-boss]').onclick=()=>this.v981LaunchScenario('boss',row.querySelector('[data-wave]').value);
};
const settings981=AP.settings;
AP.settings=function(...args){clearRunLevel();const out=settings981.apply(this,args);requestAnimationFrame(()=>this.v981ScenarioSettings());return out};
for(const name of ['main','station']){const prior=AP[name];if(typeof prior==='function')AP[name]=function(...args){clearRunLevel();return prior.apply(this,args)}}

// Keep the internal candidate version at 0.9.8 while older wrappers may stamp
// historical version strings into newly rendered screens.
const sync981=()=>{R.VERSION='0.9.8';if(R.app?.s){R.app.s.version='0.9.8';try{R.save(R.app.s)}catch{}}};
requestAnimationFrame(sync981);setTimeout(sync981,180);
})();
