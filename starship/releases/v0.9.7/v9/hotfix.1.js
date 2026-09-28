(()=>{
'use strict';
const R=window.SR;if(!R?.App||!R?.Game)return;
R.VERSION='0.9.1';
const AP=R.App.prototype,GP=R.Game.prototype,$=s=>document.querySelector(s),clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),pick=a=>a?.length?a[Math.random()*a.length|0]:null;
const fmt=n=>{n=Math.max(0,Math.round(Number(n)||0));return n<1000?String(n):n<1e6?(n/1000).toFixed(n<10000?1:0)+'k':(n/1e6).toFixed(1)+'m'};

// Save migration: boss clears unlock the next sector, never the boss wave itself.
const migrate91=R.migrate;
R.migrate=s=>{
  s=migrate91(s);if(!s)return s;
  const cps=(Array.isArray(s.checkpoints)?s.checkpoints:[1]).map(x=>{x=Math.max(1,Math.floor(+x||1));return x>1&&x%10===0?x+1:x});
  s.checkpoints=[...new Set([1,...cps])].sort((a,b)=>a-b);s.version='0.9.1';return s;
};
if(R.app?.s){R.app.s=R.migrate(R.app.s);try{R.save(R.app.s)}catch{}}

// Slightly compress visual progression so older enemies shrink more gradually.
GP.classScale=function(cls){const p=this.s?.hull||0,c=Number.isFinite(+cls)?+cls:0;return clamp(Math.pow(.86,p-c),.52,1.92)};
GP.v9BossScale=function(e){
  const raw=this.classScale?this.classScale(this.entityClass?this.entityClass(e):e?.type?.classIndex):1,size=Math.max(1,e?.size||64);
  const maxW=Math.max(.72,(this.w*.245)/size),maxH=Math.max(.72,(this.hgt*.135)/size),cap=Math.min(1.55,maxW,maxH);
  return clamp(raw,.48,cap);
};
GP.v91BossExtent=function(e){const sc=this.v9BossScale(e),s=(e?.size||64)*sc,p=e?.type?.pattern;return{x:s*(p==='carrier'?1.03:p==='reaper'?.58:.99)+10,y:s*(p==='reaper'?1.27:1.05)+10,scale:sc,s}};
GP.v91BossAnchorY=function(e){const q=this.v91BossExtent(e);return clamp(Math.max(this.hgt*.235,q.y+82),q.y+58,this.hgt*.34)};
GP.v91ConstrainBoss=function(e,fight=true){if(!e)return;const q=this.v91BossExtent(e),pad=8;e.x=clamp(e.x,q.x+pad,Math.max(q.x+pad,this.w-q.x-pad));if(fight)e.y=clamp(e.y,this.v91BossAnchorY(e),Math.max(this.v91BossAnchorY(e),this.hgt*.39));this.syncSubsystems?.(e)};

// Boss approach is visible and centered. Fight movement can roam, but never offscreen.
const bossUpdate90=GP.bossUpdate;
GP.bossUpdate=function(dt){
  const e=this.boss,s=this.bossState;if(!e||!s)return bossUpdate90?.call(this,dt);
  if(s.stage==='approach'){
    const ty=this.v91BossAnchorY(e);e.x+=(this.w/2-e.x)*Math.min(1,dt*1.8);e.y+=(ty-e.y)*Math.min(1,dt*.95);this.syncSubsystems?.(e);return;
  }
  bossUpdate90?.call(this,dt);if(s.stage==='fight')this.v91ConstrainBoss(e,true);
};
const bossAI90=GP.bossAI;
GP.bossAI=function(e,dt){bossAI90?.call(this,e,dt);if(e?.boss&&this.bossState?.stage==='fight')this.v91ConstrainBoss(e,true)};
const startBoss90=GP.v9StartBossFight;
GP.v9StartBossFight=function(){const out=startBoss90?.call(this);if(this.boss){this.boss.x=this.w/2;this.boss.y=this.v91BossAnchorY(this.boss);this.v91ConstrainBoss(this.boss,true)}return out};
GP.startBossFight=GP.v9StartBossFight;
const beginBoss90=GP.v9BeginBoss;
GP.v9BeginBoss=function(wave,sector,forced){const out=beginBoss90.call(this,wave,sector,forced);if(this.boss){const q=this.v91BossExtent(this.boss);this.boss.x=this.w/2;this.boss.y=-q.y-18;this.syncSubsystems?.(this.boss)}if(forced&&new URLSearchParams(location.search).get('dev')==='1')this._v91DevSession=true;return out};
GP._v8BeginBoss=function(wave,sector){this.v9BeginBoss(wave,sector)};
GP.startSectorBoss=function(){this.v9BeginBoss(this.wave,this.currentSector||this.pickSector?.(this.sectorIndex?.()||0),this._v9ForcedProfileId)};
GP.startBossIntro=GP.startSectorBoss;

// Keep developer controls out of the actual arena.
const build90=GP.build;
GP.build=function(){document.querySelectorAll('.v9BossLabButton,#v9BossLab').forEach(n=>n.remove());return build90.call(this)};

// Cleaner boss HUD. Sector identity already lives in the wave header.
const hud90=GP.hud;
GP.hud=function(){
  hud90?.call(this);const bb=$('#boss'),e=this.boss;if(!bb||!e||!this.bossState||this.bossState.stage==='approach')return;
  const hp=clamp(e.hp/Math.max(1,e.max),0,1),sh=e.maxShield?clamp(e.shield/e.maxShield,0,1):0,alive=(e.subsystems||[]).filter(s=>!s.dead).length,total=(e.subsystems||[]).length,mods=e.modifiers?.map(m=>m.name).join(' · ')||'COMMAND SHIP';
  bb.classList.add('v9BossHud','v91BossHud');bb.innerHTML=`<small>${mods}</small><b>${e.type.name}</b><span>PHASE ${e.phase} · SYSTEMS ${alive}/${total}</span><u><i style="width:${hp*100}%"></i></u>${e.maxShield?`<em><i style="width:${sh*100}%"></i></em>`:''}`;
};

// Continuous wave pressure. A wave owns a full queue and refills the active cap as kills open space.
GP.v91Tier=function(w=this.wave){return Math.max(0,Math.floor((Math.max(1,w)-1)/10))};
GP.v91PressureOf=function(e){const r=Math.max(0,Math.min(7,e?.type?.role||0));return .9+r*.12};
GP.v91Pressure=function(){return (this.en||[]).filter(e=>!e.boss).reduce((n,e)=>n+this.v91PressureOf(e),0)};
GP.v91Type=function(sector,wave){
  const tier=this.v91Tier(wave),pos=(Math.max(1,wave)-1)%10,maxRole=Math.min(7,2+tier*2+Math.floor(pos/4)),minRole=tier>=4?1:0;let t=null;
  for(let i=0;i<18;i++){const q=this._v8SpawnType?.(sector);if(!q)continue;t=q;const r=q.role||0;if(r>=minRole&&r<=maxRole)break}
  t=t||this._v8SpawnType?.(sector);if(!t)return null;t={...t};
  const threshold=tier,within=pos/9;t.hp*=1+threshold*.115+within*.035;t.damage*=1+threshold*.09+within*.025;t.speed*=1+threshold*.028+within*.012;t._v91Tier=tier;return t;
};
GP.v91SpawnOne=function(force=false){
  const e=this._v8Encounter;if(!e||e.type!=='combat'||!e.queue?.length)return false;if(!force&&this.v91Pressure()>=e.pressureCap)return false;
  const type=this.v91Type(e.sector,e.wave);if(!type)return false;e.queue.shift();const unit=this.spawn(type);if(unit){unit._v91Cadence=Math.max(.66,1-e.tier*.055-e.pos*.006);unit._v91Threat=e.tier;}e.spawned++;e.queueDone=e.queue.length===0;this.active=true;this.count=999;return true;
};
GP._v8SpawnGroup=function(){const e=this._v8Encounter;if(!e||e.type!=='combat')return;if((e.spawnCooldown||0)>0)return;if(this.v91SpawnOne(false))e.spawnCooldown=.12+Math.random()*.22};
GP._v8BeginCombat=function(wave,sector){
  const tier=this.v91Tier(wave),pos=(wave-1)%10,total=Math.min(72,11+Math.floor(wave*.82)+tier*4),pressureCap=Math.min(19,6+Math.floor(pos/3)+tier*2.5);
  this._v8Encounter={type:'combat',wave,sector,queue:Array(total).fill(1),queueDone:false,complete:false,total,spawned:0,pressureCap,tier,pos,spawnCooldown:0};
  this.en=[];this.rocks=[];this.bad=[];this.tele=[];this.active=true;this.count=999;
  const opening=Math.min(3,total);for(let i=0;i<opening;i++)this.v91SpawnOne(true);this._v8Encounter.spawnCooldown=.16;
};
const update91=GP.update;
GP.update=function(dt){
  update91.call(this,dt);if(this.dead||this.paused)return;const e=this._v8Encounter;if(!e||e.type!=='combat')return;
  e.spawnCooldown=Math.max(0,(e.spawnCooldown||0)-dt);if(!e.queueDone&&e.spawnCooldown<=0&&this.v91Pressure()<e.pressureCap)this._v8SpawnGroup();
  if(e.queue?.length===0)e.queueDone=true;
};
const enemies91=GP.enemies;
GP.enemies=function(dt){
  const before=new Map((this.en||[]).filter(e=>!e.boss).map(e=>[e,Number(e.cd)||0]));enemies91.call(this,dt);
  for(const [e,cd] of before){if(e.boss||!this.en?.includes(e)||!e._v91Cadence)continue;if(cd<=dt+.025&&e.cd>0)e.cd*=e._v91Cadence;}
};

// Checkpoint correction and a tiny slowdown to temporary build acceleration.
const enemyDie91=GP.enemyDie;
GP.enemyDie=function(e){
  const wasBoss=!!e?.boss,bossName=e?.type?.name,bossColor=e?.type?.accent||e?.type?.color,beforeLevel=this.level||1,devBoss=wasBoss&&this._v91DevSession;
  if(devBoss){const save=R.save;try{R.save=()=>{};enemyDie91.call(this,e)}finally{R.save=save}}else enemyDie91.call(this,e);
  if((this.level||1)>beforeLevel){const tier=this.v91Tier(),mult=1.04+Math.min(.04,tier*.01);this.next=Math.round((40+(this.level||1)*15)*mult)}
  if(wasBoss){this._v91LastBossName=bossName||'COMMAND SHIP';this._v91LastBossColor=bossColor||this.currentSector?.color||'#67dfff';const next=this.wave+1;this.s.checkpoints=[...new Set((this.s.checkpoints||[1]).map(x=>x>1&&x%10===0?x+1:x).filter(x=>x!==this.wave).concat(next,1))].sort((a,b)=>a-b);if(!devBoss)try{R.save(this.s)}catch{}}
};

GP.v91RunResult=function(){return{wave:this.wave||0,kills:this.kills||0,bosses:this.bosses||0,salvage:Math.round(this.salvage||0),cores:this.cores||0,level:this.level||1,ship:this.s?.shipName||'FLAGSHIP'}};
GP.v91ResolveBossChoice=function(){const e=this._v8Encounter;if(e?.type==='boss'){e.victoryResolved=true;if(this.wave%20!==0)e.traderResolved=true}}
GP.showBossVictory=function(){
  if($('#bossVictory'))return;this.paused=true;const missingH=1-this.hp/Math.max(1,this.maxHp),missingS=1-this.shield/Math.max(1,this.maxShield),cost=Math.max(0,Math.round((missingH*.72+missingS*.28)*(320+this.wave*38))),next=this.wave+1,color=this._v91LastBossColor||this.currentSector?.color||'#67dfff';
  const o=document.createElement('div');o.id='bossVictory';o.className='v91BossVictory';o.style.setProperty('--accent',color);o.innerHTML=`<div class="v91VictoryCard"><small>SYSTEM // BOSS DESTROYED</small><h2>${this._v91LastBossName||'COMMAND SHIP'} DESTROYED</h2><p>NEXT SECTOR CHECKPOINT <b>WAVE ${next}</b> UNLOCKED</p><div class="v91BossStatus"><span>HULL <b>${Math.round(this.hp/Math.max(1,this.maxHp)*100)}%</b></span><span>SHIELD <b>${Math.round(this.shield/Math.max(1,this.maxShield)*100)}%</b></span><span>SALVAGE <b>▰ ${fmt(this.salvage)}</b></span></div><button class="btn primary" data-a="repair">FULL REPAIR <small>▰ ${fmt(cost)}</small></button><button class="btn" data-a="continue">CONTINUE DAMAGED</button><button class="btn quiet" data-a="return">RETURN TO STATION</button>`;document.body.append(o);
  const leaveOverlay=()=>o.remove();
  const continueRun=()=>{leaveOverlay();this.v91ResolveBossChoice();if(this.wave%20===0){this.showEngineerTrader?.()}else this.paused=false};
  o.querySelector('[data-a=repair]').onclick=()=>{if(this.salvage<cost){this.app?.deny?.('NEED SALVAGE');return}this.salvage-=cost;this.hp=this.maxHp;this.shield=this.maxShield;continueRun()};
  o.querySelector('[data-a=continue]').onclick=continueRun;
  o.querySelector('[data-a=return]').onclick=()=>{leaveOverlay();this.v91ResolveBossChoice();this.dead=true;this.paused=true;const result=this.v91RunResult();if(this._v91DevSession){this.app?.v91ShowReport?.(result,'success',()=>this.app.main?.());return}if(this.app){this.app._v91PendingMode='success';this.app._v91PendingMeta={level:this.level||1};this.app.finish?.(result,'success')}};
};

// Unified terminal report. The legacy finish still performs all save bookkeeping underneath it.
AP.v91ShowReport=function(r,mode='lost',done){
  document.querySelectorAll('#v91Report').forEach(n=>n.remove());const success=mode==='success',o=document.createElement('div');o.id='v91Report';o.className='v91Report '+(success?'success':'lost');
  const level=r.level||this._v91PendingMeta?.level||1,rows=[['WAVE REACHED',r.wave||0],['HOSTILES DESTROYED',r.kills||0],['BOSSES DESTROYED',r.bosses||0],['RUN LEVEL',level],['SALVAGE RECOVERED','▰ '+fmt(r.salvage||0)],['BOSS CORES','◆ '+(r.cores||0)]];
  o.innerHTML=`<div class="v91Terminal"><header><small>LOE // EXPEDITION STATUS</small><h2>${success?'SUCCESS':'SIGNAL LOST'}</h2><span>${success?'RETURN VECTOR CONFIRMED':'FLAGSHIP TELEMETRY TERMINATED'}</span></header><div class="v91TerminalLines"></div><footer><i></i><b>${success?'STATUS REPORT COMPLETE':'RECOVERY REPORT COMPLETE'}</b></footer><button class="btn primary" disabled>RETURN TO STATION</button></div>`;document.body.append(o);
  const box=o.querySelector('.v91TerminalLines'),button=o.querySelector('button');rows.forEach((row,i)=>setTimeout(()=>{const d=document.createElement('div');d.innerHTML=`<span>${row[0]}</span><b>${row[1]}</b>`;box.append(d);requestAnimationFrame(()=>d.classList.add('show'));if(i===rows.length-1)setTimeout(()=>{o.querySelector('footer').classList.add('show');button.disabled=false},260)},160+i*135));
  R.audio?.play(success?'level':'boss');button.onclick=()=>{o.remove();this._v91PendingMeta=null;this._v91PendingMode=null;(done||(()=>this.station?.()))()};
};
const finish90=AP.finish;
AP.finish=function(r,mode='lost'){
  const actualMode=mode||this._v91PendingMode||'lost',data={...(r||{}),level:r?.level||this._v91PendingMeta?.level||1};finish90.call(this,r);this.v91ShowReport(data,actualMode,()=>this.station?.());
};
const die91=GP.die;
GP.die=function(){if(this.dead)return;if(this._v91DevSession){this.dead=true;this.paused=true;const r=this.v91RunResult();this.app?.v91ShowReport?.(r,'lost',()=>this.app.main?.());return}if(this.app)this.app._v91PendingMeta={level:this.level||1};return die91.call(this)};

})();