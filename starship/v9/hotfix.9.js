(()=>{
'use strict';
const R=window.SR;if(!R?.App||!R?.Game)return;
R.VERSION='0.9.8';
const AP=R.App.prototype,GP=R.Game.prototype,$=s=>document.querySelector(s),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const E=(t,c,h)=>{const e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e};
const fmt=n=>{n=Math.max(0,Math.round(Number(n)||0));return n<1000?String(n):n<1e6?(n/1000).toFixed(n<10000?1:0)+'k':(n/1e6).toFixed(1)+'m'};
let activeGame98=null;

// ---------------------------------------------------------------------------
// VERSION + CHECKPOINT MIGRATION
// Bosses now close sectors on 9/19/29... and the unlocked sector starts are
// 10/20/30... . Existing 11/21/31 saves are migrated backward one wave.
// ---------------------------------------------------------------------------
const migrate98=R.migrate;
R.migrate=s=>{
  s=migrate98(s);if(!s)return s;
  const cps=(Array.isArray(s.checkpoints)?s.checkpoints:[1]).map(v=>{
    v=Math.max(1,Math.floor(Number(v)||1));
    if(v>1&&v%10===1)return v-1;
    return v;
  });
  s.checkpoints=[...new Set([1,...cps])].sort((a,b)=>a-b);
  s.version='0.9.8';return s;
};

GP.v98Tier=function(w=this.wave){w=Math.max(1,Number(w)||1);return w<10?0:Math.floor(w/10)};
GP.v98SectorPos=function(w=this.wave){w=Math.max(1,Number(w)||1);return w<10?w-1:w%10};
GP.v91Tier=function(w=this.wave){return this.v98Tier(w)};
if(GP.sectorIndex)GP.sectorIndex=function(){return this.v98Tier(this.wave)};

// Preserve continuous-pressure logic but align it to the new sector boundary.
GP.v91Type=function(sector,wave){
  const tier=this.v98Tier(wave),pos=this.v98SectorPos(wave),maxRole=Math.min(7,2+tier*2+Math.floor(pos/4)),minRole=tier>=4?1:0;let t=null;
  for(let i=0;i<18;i++){const q=this._v8SpawnType?.(sector);if(!q)continue;t=q;const r=q.role||0;if(r>=minRole&&r<=maxRole)break}
  t=t||this._v8SpawnType?.(sector);if(!t)return null;t={...t};
  const within=pos/9;
  t.hp*=1+tier*.115+within*.035;t.damage*=1+tier*.09+within*.025;t.speed*=1+tier*.028+within*.012;
  t.hp*=1+tier*.34+pos*.022;t.damage*=1+tier*.17+pos*.012;t.speed*=1+tier*.022;
  t._v91Tier=tier;return t;
};
const beginCombat98=GP._v8BeginCombat;
GP._v8BeginCombat=function(wave,sector){
  beginCombat98.call(this,wave,sector);const e=this._v8Encounter;if(!e||e.type!=='combat')return;
  const oldTier=Math.max(0,Math.floor((wave-1)/10)),tier=this.v98Tier(wave),pos=this.v98SectorPos(wave),delta=Math.max(0,tier-oldTier);
  if(delta&&e.queue)e.queue.push(...Array(delta*3).fill(1));
  e.tier=tier;e.pos=pos;e.total=(e.total||0)+delta*3;e.pressureCap=Math.min(23,6+Math.floor(pos/3)+tier*3.25);
};

// Own wave sequencing here so there is one boss rule and one checkpoint rule.
GP.spawnWave=function(){
  if(this._v8Encounter&&!this._v8Encounter.complete)return;
  const wave=(Number(this.wave)||0)+1,idx=this.v98Tier(wave),sector=this.pickSector?this.pickSector(idx):(this.currentSector||{kind:'base',name:'UNKNOWN',color:'#8aa'});
  this.wave=wave;this.currentSector=sector;this.active=true;
  const we=$('#wave');if(we)we.textContent=`◈ ${wave} · ${sector?.name||'UNKNOWN'}`;
  const begin=()=>{
    if(wave%10===9)return this._v8BeginBoss(wave,sector);
    const canField=wave>=4&&this._v8LastEncounterType!=='asteroid'&&Math.random()<.08;
    return canField?this._v8BeginAsteroids(wave,sector):this._v8BeginCombat(wave,sector);
  };
  if(wave===1||wave%10===0){
    const label=this.v8SectorLabel?.(sector)||this.v7SectorLabel?.(sector)||{race:sector?.name||'UNKNOWN',force:sector?.forceName||`${sector?.name||'UNKNOWN'} FLEET`};
    this.paused=true;this._v8Encounter={type:'intro',wave,sector,complete:false};
    const done=()=>{this._v8Encounter=null;this.paused=false;begin()};
    if(this.v83Warning){const color=sector?.kind==='void'?(sector.accent||'#b875ff'):(sector?.color||'#8fdfff');this.v83Warning({kicker:sector?.kind==='void'?'SYSTEM // ANOMALOUS CONTACT':sector?.kind==='pirate'?'SYSTEM // UNALIGNED FLEET':'NAV // SECTOR CONTACT',title:label.force,sub:label.race,color},done)}
    else if(this.showSectorIntro)this.showSectorIntro(sector,done);else done();
  }else begin();
};

// ---------------------------------------------------------------------------
// BOSS RECURRENCE + DURABILITY
// Clear prior-boss death evidence before a new approach begins. Older post-death
// watchers can no longer mistake an approaching boss for an already-dead boss.
// ---------------------------------------------------------------------------
const beginBoss98=GP.v9BeginBoss;
GP.v9BeginBoss=function(wave,sector,forced){
  this._v91LastBossName=null;this._v91LastBossColor=null;this._v94BossPending=false;this._v94BossSettle=0;this._v93BossSettle=0;
  const out=beginBoss98.call(this,wave,sector,forced);
  if(this._v8Encounter?.type==='boss'){this._v8Encounter.v98BossWave=wave;this._v8Encounter.v98BossAlive=true;this._v8Encounter.victoryResolved=false;this._v8Encounter.traderResolved=((wave+1)%20!==0)}
  return out;
};
GP._v8BeginBoss=function(wave,sector){return this.v9BeginBoss(wave,sector)};
GP.startSectorBoss=function(){return this.v9BeginBoss(this.wave,this.currentSector||this.pickSector?.(this.v98Tier(this.wave)),this._v9ForcedProfileId)};
GP.startBossIntro=GP.startSectorBoss;
const createBoss98=GP.v9CreateBoss;
GP.v9CreateBoss=function(profile,sector,wave){
  const e=createBoss98.call(this,profile,sector,wave),tier=this.v98Tier(wave),expected=5+tier*3,over=Math.max(0,(this.level||1)-expected),mul=1.28+Math.min(.9,over*.075);
  e.hp*=mul;e.max*=mul;e.shield*=1.16+Math.min(.45,over*.035);e.maxShield*=1.16+Math.min(.45,over*.035);
  for(const s of e.subsystems||[]){s.hp*=mul;s.max*=mul}
  return e;
};

// Boss death still runs all old reward bookkeeping, then normalizes checkpoint
// ownership and bounds any synchronous shield-on-kill sustain.
const enemyDie98=GP.enemyDie;
GP.enemyDie=function(e){
  const wasBoss=!!e?.boss,beforeShield=Number(this.shield)||0;
  const out=enemyDie98.call(this,e);
  const afterShield=Number(this.shield)||0;
  if(!wasBoss&&afterShield>beforeShield){
    const allowed=this._v98KillShieldCd>0?0:Math.min(afterShield-beforeShield,(this.maxShield||1)*.04);
    this.shield=Math.min(this.maxShield,beforeShield+allowed);if(allowed>0)this._v98KillShieldCd=.7;
  }
  if(wasBoss){
    if(this._v8Encounter?.type==='boss')this._v8Encounter.v98BossAlive=false;
    const next=(Number(this.wave)||0)+1,cps=(this.s.checkpoints||[1]).map(v=>v>1&&v%10===1?v-1:v).filter(v=>v===1||v%10===0);
    this.s.checkpoints=[...new Set([1,...cps,next])].sort((a,b)=>a-b);try{R.save(this.s)}catch{}
  }
  return out;
};

// ---------------------------------------------------------------------------
// SHIELD RESTART WINDOW
// Existing recharge multipliers remain useful, but taking a hit now creates a
// real restart delay so high-density sustain cannot become permanent immunity.
// ---------------------------------------------------------------------------
const hitShip98=GP.hitShip;
GP.hitShip=function(d,x,y){
  const before=Number(this.shield)||0,out=hitShip98.call(this,d,x,y);
  if((Number(this.shield)||0)<before||d>0){const sys=R.shipStats?.(this.s),factor=clamp(Number(sys?.shieldDelay)||1,.45,1.2);this._v98ShieldRestart=Math.max(this._v98ShieldRestart||0,1.55*factor)}
  return out;
};
const update98=GP.update;
GP.update=function(dt){
  // Engineer scene must animate even though combat is intentionally paused.
  if(this._v98Engineer)this.v98EngineerStep(dt);
  this._v98KillShieldCd=Math.max(0,(this._v98KillShieldCd||0)-dt);
  this._v98ShieldRestart=Math.max(0,(this._v98ShieldRestart||0)-dt);
  const regen=this.mods?.shieldRegen;
  if(this.mods&&this._v98ShieldRestart>0)this.mods.shieldRegen=0;
  try{return update98.call(this,dt)}finally{if(this.mods&&regen!=null)this.mods.shieldRegen=regen}
};

// ---------------------------------------------------------------------------
// RUN HUD: level is always visible.
// ---------------------------------------------------------------------------
const build98=GP.build;
GP.build=function(...args){
  const out=build98.apply(this,args);activeGame98=this;
  let lv=$('#v98Level');if(!lv){lv=E('div','v98Level');lv.id='v98Level';document.body.append(lv)}
  lv.textContent=`LV ${this.level||1}`;return out;
};
const hud98=GP.hud;
GP.hud=function(){const out=hud98?.call(this);const lv=$('#v98Level');if(lv)lv.textContent=`LV ${this.level||1}`;return out};

// ---------------------------------------------------------------------------
// BUILD WINDOW: stats + a real fanned hand of cards.
// ---------------------------------------------------------------------------
GP.showRunDeck=function(){
  if($('#runDeckSheet'))return;const was=this.paused;this.paused=true;
  const owned=(this.cards||[]).map(id=>R.CARDS?.find(c=>c.id===id)).filter(Boolean),counts={};owned.forEach(c=>counts[c.id]=(counts[c.id]||0)+1);
  const unique=[...new Map(owned.map(c=>[c.id,c])).values()],o=E('div','runDeckSheet v98RunDeck');o.id='runDeckSheet';
  const armor=clamp((this.permaArmor||0)+(this.mods?.armor||0),0,.95),stats=[
    ['LV',this.level||1],['HULL',`${Math.round(this.hp)}/${Math.round(this.maxHp)}`],['SHIELD',`${Math.round(this.shield)}/${Math.round(this.maxShield)}`],
    ['DAMAGE','×'+(this.mods?.damage||1).toFixed(2)],['FIRE RATE','×'+(this.mods?.rate||1).toFixed(2)],['CRIT',Math.round((this.mods?.crit||0)*100)+'%'],
    ['ARMOR',Math.round(armor*100)+'%'],['REPAIR',(this.mods?.regen||0).toFixed(2)+'/s'],['DRONES',String(this.droneUnits?.length||0)]
  ];
  o.innerHTML=`<div class="v98DeckPanel"><header><span><small>RUN BUILD</small><h2>${unique.length} CARDS · LV ${this.level||1}</h2></span><button aria-label="Close">×</button></header><div class="v98RunStats">${stats.map(([a,b])=>`<span><small>${a}</small><b>${b}</b></span>`).join('')}</div><div class="v98CardFan"></div><div class="v98CardRead"><small>BUILD DECK</small><b>${unique.length?'SELECT A CARD':'NO CARDS YET'}</b><p>${unique.length?'Tap a card to inspect it.':'Your run cards will fan out here as the build grows.'}</p></div></div>`;
  const fan=o.querySelector('.v98CardFan'),read=o.querySelector('.v98CardRead'),n=Math.max(1,unique.length);
  unique.forEach((c,i)=>{const rel=i-(n-1)/2,rot=clamp(rel*2.15,-11,11),b=E('button',`v98FanCard ${c.rarity||'common'}`);b.style.setProperty('--rot',rot+'deg');b.innerHTML=`<small>${R.RARITIES?.[c.rarity]?.name||String(c.rarity||'COMMON').toUpperCase()}</small><i>${c.icon||'◇'}</i><b>${c.name}${counts[c.id]>1?' ×'+counts[c.id]:''}</b><em>RUN CARD</em>`;b.onclick=()=>{fan.querySelectorAll('.selected').forEach(q=>q.classList.remove('selected'));b.classList.add('selected');read.innerHTML=`<small>${R.RARITIES?.[c.rarity]?.name||String(c.rarity||'COMMON').toUpperCase()}</small><b>${c.name}${counts[c.id]>1?' ×'+counts[c.id]:''}</b><p>${c.desc||this.cardText?.(c)||'No description.'}</p>`};fan.append(b)});
  document.body.append(o);o.querySelector('header button').onclick=()=>{o.remove();this.paused=was};
};

// ---------------------------------------------------------------------------
// DRONES: both roles stay attached to the flagship on opposite orbital tracks.
// Defense moves clockwise on the inner track. Offense moves counter-clockwise
// on the outer track and fires from its current orbital position.
// ---------------------------------------------------------------------------
GP.allies=function(dt){
  const hostiles=(this.en||[]).filter(e=>!e.dead);
  for(const u of this.droneUnits||[]){
    const d=u.def;if(!d)continue;u.cd=(u.cd||0)-dt;
    const defensive=d.role==='defense',dir=defensive?1:-1,rad=defensive?(48+(u.index%3)*6):(78+(u.index%3)*8),squash=defensive?.72:.78;
    u.angle=(u.angle||0)+dir*dt*(defensive?(1.00+u.index*.025):(.72+u.index*.02));
    const tx=this.cx+Math.cos(u.angle)*rad,ty=this.cy+Math.sin(u.angle)*rad*squash;u.x+=(tx-u.x)*Math.min(1,dt*7);u.y+=(ty-u.y)*Math.min(1,dt*7);
    if(defensive){
      if(d.pd){const p=(this.bad||[]).find(p=>p.life>0&&Math.hypot(p.x-u.x,p.y-u.y)<78);if(p&&Math.random()<d.pd*12*dt){p.life=0;R.audio?.play('drone')}}
      if(d.repair)this.hp=Math.min(this.maxHp,this.hp+d.repair*dt);
      if(d.shield)this.shield=Math.min(this.maxShield,this.shield+this.maxShield*d.shield*dt);
    }else{
      let target=this.priority&&this.validTarget?.(this.priority)&&Math.hypot(this.priority.x-u.x,this.priority.y-u.y)<285?this.priority:null;
      if(!target)target=hostiles.filter(e=>Math.hypot(e.x-u.x,e.y-u.y)<285).sort((a,b)=>Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(b.x-u.x,b.y-u.y))[0];
      if(target&&u.cd<=0){this.fireAlly(target,u.x,u.y,d.damage*this.mods.droneDmg,d.aoe,d.ion,'drone');u.cd=1/(d.rate*this.mods.droneRate*(this.droneBuff?1.8:1))}
    }
  }
  for(const u of this.supportUnits||[]){
    const d=u.def,side=u.index%2?1:-1,row=u.index/2|0,tx=this.cx+side*(72+row*18),ty=this.cy+54+row*18;u.x+=(tx-u.x)*Math.min(1,dt*2.2);u.y+=(ty-u.y)*Math.min(1,dt*2.2);u.cd=(u.cd||0)-dt;
    if(d.repair){this.hp=Math.min(this.maxHp,this.hp+d.repair*dt);continue}
    const target=hostiles.slice().sort((a,b)=>Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(b.x-u.x,b.y-u.y))[0];if(target&&u.cd<=0){this.fireAlly(target,u.x,u.y,d.damage*this.mods.escortDmg,d.aoe,d.ion,'support');u.cd=1/(d.rate*this.mods.escortRate*(this.escortBuff?1.8:1))}
  }
};

// ---------------------------------------------------------------------------
// WEAPON MUZZLES + RICOCHET
// Match muzzle origin to the canonical visible hardpoint geometry. Player shots
// are redrawn above the flagship so they never appear to fire under the hull.
// ---------------------------------------------------------------------------
GP.muzzleFor=function(i,target){
  const hull=clamp(this.s?.hull|0,0,6),scale=1+hull*.11,z=34*scale,side=i%2?1:-1,row=i/2|0,maxRow=Math.min(4,row),bx=this.cx+side*z*(.43+maxRow*.075+hull*.025),by=this.cy-z*.46+maxRow*z*.26,a=target?Math.atan2(target.y-by,target.x-bx):-Math.PI/2;
  return{x:bx+Math.cos(a)*z*.35,y:by+Math.sin(a)*z*.35};
};
if(!R.CARDS?.some(c=>c.id==='v98.ricochet'))R.CARDS?.push({id:'v98.ricochet',group:'general',name:'Ricochet',icon:'↗',rarity:'rare',desc:'Mounted projectiles ricochet once into a nearby target at reduced damage.',effect:{k:'ricochet',v:1}});
const applyCard98=GP.applyCard;
GP.applyCard=function(c){if(c?.effect?.k==='ricochet'){if(!this.cards.includes(c.id))this.cards.push(c.id);this.mods.ricochet=Math.max(this.mods.ricochet||0,c.effect.v||1);return}return applyCard98.call(this,c)};
const fireAt98=GP.fireAt;
GP.fireAt=function(t,w,origin){const at=this.shots?.length||0,out=fireAt98.call(this,t,w,origin);for(let i=at;i<(this.shots?.length||0);i++)this.shots[i].ricochet=Math.max(this.shots[i].ricochet||0,this.mods.ricochet||0);return out};
GP.v98Bounce=function(p,hit){
  if(!(p.ricochet>0)||p.pierce>0)return null;const candidates=[...(this.allTargets?.()||[]),...(this.rocks||[])].filter(t=>t!==hit&&!t.dead&&this.validTarget?.(t)!==false&&Math.hypot(t.x-p.x,t.y-p.y)<=260).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y));
  const t=candidates[0];if(!t)return null;const sp=Math.max(300,Math.hypot(p.vx,p.vy)||650),a=Math.atan2(t.y-p.y,t.x-p.x),dist=Math.hypot(t.x-p.x,t.y-p.y);
  return{...p,x:p.x,y:p.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,damage:p.damage*.72,life:Math.max(.35,Math.min(1.25,dist/sp+.28)),pierce:0,ricochet:p.ricochet-1,target:t,homing:false};
};
GP.projectiles=function(dt){
  const targets=this.allTargets?.()||[],bounces=[];
  for(const p of this.shots||[]){
    if(p.homing&&p.target&&this.validTarget(p.target)){const a=Math.atan2(p.target.y-p.y,p.target.x-p.x),sp=Math.hypot(p.vx,p.vy)||1;p.vx+=Math.cos(a)*sp*.9*dt;p.vy+=Math.sin(a)*sp*.9*dt;const n=Math.hypot(p.vx,p.vy)||1;p.vx=p.vx/n*sp;p.vy=p.vy/n*sp}
    p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;let hit=null;
    for(const t of targets){const rad=t.parentBoss?8:(t.size||10)+5;if(Math.hypot(t.x-p.x,t.y-p.y)<rad){hit=t;break}}
    if(hit){this.damageTarget(hit,p.damage);const host=hit.parentBoss||hit;if(p.ion){if(host.shield!=null)host.shield=Math.max(0,host.shield-p.damage*.8);host.ion=1.3;if(p.chain){const near=this.en.filter(e=>e!==host&&Math.hypot(e.x-host.x,e.y-host.y)<130).slice(0,p.chain);near.forEach(e=>this.damageTarget(e,p.damage*.45))}}if(p.aoe){for(const e of this.en)if(e!==host&&Math.hypot(e.x-host.x,e.y-host.y)<p.aoe)this.damageTarget(e,p.damage*.5)}if(p.pierce>0)p.pierce--;else{const q=this.v98Bounce(p,hit);if(q)bounces.push(q);p.life=0}}
    if(!hit)for(const r of this.rocks||[]){if(Math.hypot(r.x-p.x,r.y-p.y)<r.r+4){this.damageRock(r,p.damage);const q=this.v98Bounce(p,r);if(q)bounces.push(q);p.life=0;break}}
  }
  this.shots=(this.shots||[]).filter(p=>p.life>0&&p.x>-110&&p.x<this.w+110&&p.y>-110&&p.y<this.hgt+110);if(bounces.length)this.shots.push(...bounces);
  for(const p of this.bad||[]){
    if(!p||p.life<=0)continue;if(p.homing){const a=Math.atan2(this.cy-p.y,this.cx-p.x),sp=Math.hypot(p.vx,p.vy)||1;p.vx+=(Math.cos(a)*sp-p.vx)*dt*.8;p.vy+=(Math.sin(a)*sp-p.vy)*dt*.8}
    const x0=p.x,y0=p.y,x1=x0+p.vx*dt,y1=y0+p.vy*dt;p.life-=dt;if(this.mods.pd>0&&Math.random()<this.mods.pd*dt*2){p.life=0;continue}
    const pad=(p.r||2.5)*.65,q=this.v97ShipContact?.(this.shield>0,pad);if(q){const sx=(x0-this.cx)/q.rx,sy=(y0-this.cy)/q.ry,ex=(x1-this.cx)/q.rx,ey=(y1-this.cy)/q.ry,dx=ex-sx,dy=ey-sy,A=dx*dx+dy*dy,B=2*(sx*dx+sy*dy),C=sx*sx+sy*sy-1,D=B*B-4*A*C;let hit=null;if(sx*sx+sy*sy<=1)hit={x:x0,y:y0};else if(A>1e-8&&D>=0){const root=Math.sqrt(D),t1=(-B-root)/(2*A),t2=(-B+root)/(2*A),t=t1>=0&&t1<=1?t1:t2>=0&&t2<=1?t2:null;if(t!=null)hit={x:x0+(x1-x0)*t,y:y0+(y1-y0)*t}}if(hit){p.x=hit.x;p.y=hit.y;this.hitShip(p.damage,hit.x,hit.y);p.life=0;continue}}
    p.x=x1;p.y=y1;
  }
  this.bad=(this.bad||[]).filter(p=>p&&p.life>0&&p.x>-110&&p.x<this.w+110&&p.y>-110&&p.y<this.hgt+110);
  for(let i=this.en.length-1;i>=0;i--)if(this.en[i].hp<=0){const e=this.en[i];this.en.splice(i,1);this.enemyDie(e)}this.rocks=this.rocks.filter(r=>!r.dead);
};

// ---------------------------------------------------------------------------
// GALACTIC ENGINEERS: physical arrival, whale-scale ship, hail, trade, departure.
// ---------------------------------------------------------------------------
GP.v98EngineerDue=function(){return this.wave>0&&(this.wave+1)%20===0};
GP.v98StartEngineer=function(){
  if(this._v98Engineer)return;this.paused=true;this.bad=[];this.tele=[];this.shots=[];this._v98PlayerScale=1;
  this._v98Engineer={stage:'approach',t:0,centerY:-this.hgt*1.15,targetY:-this.hgt*.34};
  document.querySelectorAll('#v98EngineerComms,#engineerTrader').forEach(n=>n.remove());R.audio?.play('boss');
};
GP.v98ShowEngineerComms=function(){
  if($('#v98EngineerComms'))return;const o=E('div','v98EngineerComms');o.id='v98EngineerComms';o.innerHTML=`<div><small>NEUTRAL CONTACT // GALACTIC ENGINEERS</small><h2>TRANSMISSION RECEIVED</h2><p>“Little flagship. You have traveled far enough to interest us. Bring your salvage closer.”</p><span>DOCKING VECTOR ACCEPTED</span><button class="btn primary" data-trade>OPEN TRADE</button><button class="btn quiet" data-leave>DECLINE</button></div>`;document.body.append(o);requestAnimationFrame(()=>o.classList.add('show'));o.querySelector('[data-trade]').onclick=()=>{o.remove();this.v98OpenEngineerTrade()};o.querySelector('[data-leave]').onclick=()=>{o.remove();this.v98EngineerDepart()};
};
GP.v98OpenEngineerTrade=function(){
  if($('#engineerTrader'))return;const pool=(R.CARDS||[]).filter(c=>['legendary','mythic'].includes(c.rarity)&&!this.cards.includes(c.id)),picks=[];while(picks.length<3&&pool.length){const c=pool.splice(Math.random()*pool.length|0,1)[0];if(c)picks.push(c)}const fee=Math.round(550+this.wave*45),o=E('div','engineerTrader v98EngineerTrade');o.id='engineerTrader';o.innerHTML=`<div class="v98TradeCard"><small>GALACTIC ENGINEERS // EXCHANGE CHANNEL</small><h2>WE HAVE THREE THINGS YOU MIGHT SURVIVE.</h2><p>Select one technology for <b>▰ ${fmt(fee)}</b>, or disengage.</p><div class="v98TradeChoices"></div><button class="btn quiet" data-skip>CONTINUE</button></div>`;document.body.append(o);const g=o.querySelector('.v98TradeChoices');if(!picks.length)g.innerHTML='<div class="v98NoTrade">NO NEW PREMIUM TECHNOLOGY AVAILABLE</div>';picks.forEach(c=>{const b=E('button',`v98Trade ${c.rarity||''}`,`<i>${c.icon||'◇'}</i><b>${c.name}</b><span>${R.RARITIES?.[c.rarity]?.name||String(c.rarity||'TECH').toUpperCase()}</span><small>${c.desc||''}</small><em>▰ ${fmt(fee)}</em>`);b.onclick=()=>{if(this.salvage<fee){this.app?.deny?.('NEED SALVAGE');return}this.salvage-=fee;this.applyCard(c);o.remove();this.v98EngineerDepart()};g.append(b)});o.querySelector('[data-skip]').onclick=()=>{o.remove();this.v98EngineerDepart()};
};
GP.v98EngineerDepart=function(){if(!this._v98Engineer)return;this._v98Engineer.stage='depart';this._v98Engineer.t=0;document.querySelectorAll('#v98EngineerComms,#engineerTrader').forEach(n=>n.remove())};
GP.v98EngineerStep=function(dt){
  const s=this._v98Engineer;if(!s)return;s.t+=dt;
  if(s.stage==='approach'){const p=clamp(s.t/3.4,0,1),ease=p*p*(3-2*p);s.centerY=(-this.hgt*1.15)+(s.targetY+this.hgt*1.15)*ease;this._v98PlayerScale=1-(.46*ease);if(p>=1){s.stage='comms';s.t=0;this._v98PlayerScale=.54;setTimeout(()=>this.v98ShowEngineerComms(),180)}}
  else if(s.stage==='comms'||s.stage==='trade'){this._v98PlayerScale=.54}
  else if(s.stage==='depart'){const p=clamp(s.t/2.7,0,1),ease=p*p*(3-2*p);s.centerY=s.targetY-this.hgt*.95*ease;this._v98PlayerScale=.54+.46*ease;if(p>=1){this._v98PlayerScale=1;this._v98Engineer=null;if(this._v8Encounter?.type==='boss')this._v8Encounter.traderResolved=true;this.paused=false}}
};
GP.v98DrawEngineer=function(){
  const s=this._v98Engineer;if(!s||!this.x)return;const x=this.x,w=this.w,h=this.hgt,cy=s.centerY,len=h*2.45,top=cy-len*.5,bottom=cy+len*.5,L=w*.08,RX=w*.92,innerL=w*.31,innerR=w*.69;
  x.save();x.globalAlpha=.98;const grad=x.createLinearGradient(0,top,0,bottom);grad.addColorStop(0,'#101a20');grad.addColorStop(.52,'#263943');grad.addColorStop(1,'#111b21');x.fillStyle=grad;x.strokeStyle='#7795a2';x.lineWidth=2.2;
  const side=(flip=false)=>{const a=flip?RX:L,b=flip?innerR:innerL,sgn=flip?-1:1;x.beginPath();x.moveTo(a,top);x.lineTo(b,top+len*.10);x.lineTo(b+sgn*w*.025,bottom-len*.10);x.lineTo(a-sgn*w*.03,bottom);x.lineTo(a-sgn*w*.11,bottom-len*.28);x.lineTo(a-sgn*w*.08,top+len*.24);x.closePath();x.fill();x.stroke()};side(false);side(true);
  x.fillStyle='#0a1116';x.strokeStyle='#5f8797';x.beginPath();x.moveTo(innerL,top+len*.10);x.lineTo(innerR,top+len*.10);x.lineTo(innerR+w*.025,bottom-len*.10);x.lineTo(innerL-w*.025,bottom-len*.10);x.closePath();x.stroke();
  x.strokeStyle='rgba(115,224,246,.34)';x.lineWidth=1;for(let i=0;i<19;i++){const yy=top+len*(.12+i*.041);x.beginPath();x.moveTo(L+w*.035,yy);x.lineTo(innerL-w*.018,yy+10);x.moveTo(innerR+w*.018,yy+10);x.lineTo(RX-w*.035,yy);x.stroke()}
  const pulse=.35+.18*Math.sin((this.t||0)*2.4);x.fillStyle=`rgba(111,224,244,${pulse})`;for(let i=0;i<11;i++){const yy=top+len*(.16+i*.061);x.fillRect(L+w*.07,yy,5,18);x.fillRect(RX-w*.07-5,yy,5,18)}
  x.strokeStyle='rgba(230,247,251,.55)';x.lineWidth=2;x.beginPath();x.moveTo(w*.41,bottom-len*.17);x.lineTo(w*.5,bottom-len*.08);x.lineTo(w*.59,bottom-len*.17);x.stroke();x.restore();
};
const draw98=GP.draw;
GP.draw=function(){const out=draw98.call(this);if(this._v98Engineer)this.v98DrawEngineer();const x=this.x;if(x&&!this._v98Engineer)for(const p of this.shots||[]){x.save();x.strokeStyle=p.color||'#fff';x.lineWidth=p.family==='beam'?3:1.8;x.beginPath();x.moveTo(p.x,p.y);x.lineTo(p.x-p.vx*.018,p.y-p.vy*.018);x.stroke();x.restore()}return out};

// Shrink only the flagship renderer during the Engineer arrival, not the HUD or
// surrounding encounter canvas.
const drawShip98=R.drawShip;
R.drawShip=function(ctx,cx,cy,scale=1,weapons=[],tier=0,preview=false,state={}){const shrink=activeGame98?._v98Engineer&&!preview?(activeGame98._v98PlayerScale||1):1;return drawShip98(ctx,cx,cy,scale*shrink,weapons,tier,preview,state)};

// ---------------------------------------------------------------------------
// BOSS VICTORY TRANSACTION with Engineer handoff on 19/39/59...
// ---------------------------------------------------------------------------
GP.showBossVictory=function(){
  const enc=this._v8Encounter;if(!enc||enc.type!=='boss'||enc.victoryResolved||this.dead)return;if((this.en||[]).some(e=>e?.boss))return;
  if(this.v94DraftBlocked?.()){this._v94BossPending=true;this._v94AfterDraft=()=>this.showBossVictory();return}if($('#bossVictory'))return;
  this.v94ClearDeadBossField?.();this.paused=true;const missingH=1-this.hp/Math.max(1,this.maxHp),missingS=1-this.shield/Math.max(1,this.maxShield),cost=Math.max(0,Math.round((missingH*.72+missingS*.28)*(320+this.wave*38))),next=this.wave+1,color=this._v91LastBossColor||this.currentSector?.color||'#67dfff';
  const o=E('div','v91BossVictory v93BossVictory');o.id='bossVictory';o.style.setProperty('--accent',color);o.innerHTML=`<div class="v91VictoryCard v93VictoryCard"><small>SYSTEM // BOSS DESTROYED</small><h2>${this._v91LastBossName||'COMMAND SHIP'} DESTROYED</h2><p>NEXT SECTOR CHECKPOINT <b>WAVE ${next}</b> UNLOCKED</p><div class="v91BossStatus"><span>HULL <b>${Math.round(this.hp/Math.max(1,this.maxHp)*100)}%</b></span><span>SHIELD <b>${Math.round(this.shield/Math.max(1,this.maxShield)*100)}%</b></span><span>SALVAGE <b>▰ ${fmt(this.salvage)}</b></span></div><button class="btn primary" data-a="repair">FULL REPAIR <small>▰ ${fmt(cost)}</small></button><button class="btn" data-a="continue">CONTINUE DAMAGED</button><button class="btn quiet" data-a="return">RETURN TO STATION</button></div>`;document.body.append(o);requestAnimationFrame(()=>o.classList.add('show'));
  const continueRun=()=>{o.remove();enc.victoryResolved=true;if(this.v98EngineerDue()){enc.traderResolved=false;this.v98StartEngineer()}else{enc.traderResolved=true;this.paused=false}};
  o.querySelector('[data-a=repair]').onclick=()=>{if(this.salvage<cost){this.app?.deny?.('NEED SALVAGE');return}this.salvage-=cost;this.hp=this.maxHp;this.shield=this.maxShield;continueRun()};
  o.querySelector('[data-a=continue]').onclick=continueRun;
  o.querySelector('[data-a=return]').onclick=()=>{o.remove();enc.victoryResolved=true;enc.traderResolved=true;this.dead=true;this.paused=true;const result=this.v91RunResult?.()||{wave:this.wave,kills:this.kills,bosses:this.bosses,salvage:this.salvage,cores:this.cores,level:this.level};if(this._v91DevSession){this.app?.v91ShowReport?.(result,'success',()=>this.app.main?.());return}if(this.app){this.app._v91PendingMode='success';this.app._v91PendingMeta={level:this.level||1};this.app.finish?.(result,'success')}};
};
GP.v93ShowEngineerTrader=function(){return this.v98StartEngineer()};
GP.showEngineerTrader=function(){return this.v98StartEngineer()};

// ---------------------------------------------------------------------------
// VERSION SYNC after older screen wrappers stamp historical numbers.
// ---------------------------------------------------------------------------
const sync98=()=>{R.VERSION='0.9.8';if(R.app?.s){R.app.s=R.migrate(R.app.s);R.app.s.version='0.9.8';try{R.save(R.app.s)}catch{}}if(!document.body)return;const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;while((n=w.nextNode()))if(n.nodeValue&&/0\.9\.[0-7]/.test(n.nodeValue))n.nodeValue=n.nodeValue.replace(/0\.9\.[0-7]/g,'0.9.8')};
const main98=AP.main;if(main98)AP.main=function(...args){R.VERSION='0.9.8';const out=main98.apply(this,args);requestAnimationFrame(sync98);return out};
const station98=AP.station;if(station98)AP.station=function(...args){R.VERSION='0.9.8';const out=station98.apply(this,args);requestAnimationFrame(sync98);return out};
requestAnimationFrame(sync98);setTimeout(sync98,180);
})();
