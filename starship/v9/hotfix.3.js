(()=>{
'use strict';
const R=window.SR;if(!R?.App||!R?.Game)return;
R.VERSION='0.9.2';
const AP=R.App.prototype,GP=R.Game.prototype,$=s=>document.querySelector(s),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const E=(t,c,h)=>{const e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e};
const fmt=n=>{n=Math.max(0,Math.round(Number(n)||0));return n<1000?String(n):n<1e6?(n/1000).toFixed(n<10000?1:0)+'k':(n/1e6).toFixed(1)+'m'};
const centerX=g=>Number.isFinite(g?.cx)?g.cx:(g?.x?.canvas?.width?g.x.canvas.width/2:(g?.w||innerWidth)/2);

// ---------------------------------------------------------------------------
// VERSION / SAVE MIGRATION
// ---------------------------------------------------------------------------
const migrate92=R.migrate;
R.migrate=s=>{s=migrate92(s);if(!s)return s;s.version='0.9.2';return s};
const syncVersion=()=>{
  R.VERSION='0.9.2';
  if(R.app?.s){R.app.s.version='0.9.2';try{R.save?.(R.app.s)}catch{}}
  if(!document.body)return;
  const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;
  while((n=w.nextNode()))if(n.nodeValue&&/0\.9\.[01]/.test(n.nodeValue))n.nodeValue=n.nodeValue.replace(/0\.9\.[01]/g,'0.9.2');
};

// ---------------------------------------------------------------------------
// BOSS REVEAL: one owner, one centerline, deterministic intimidating approach.
// ---------------------------------------------------------------------------
GP.v92BossApproachStep=function(dt){
  const e=this.boss,s=this.bossState;if(!e||!s||s.stage!=='approach')return;
  const q=this.v91BossExtent?.(e)||{y:(e.size||64)*1.2};
  const duration=3.15;s._v92ApproachT=(s._v92ApproachT||0)+dt;
  const p=clamp(s._v92ApproachT/duration,0,1),ease=p*p*(3-2*p),off=-q.y-28,target=this.v91BossAnchorY?.(e)??this.hgt*.235;
  e.x=centerX(this);e.y=off+(target-off)*ease;this.syncSubsystems?.(e);
};
const beginBoss92=GP.v9BeginBoss;
GP.v9BeginBoss=function(wave,sector,forced){
  const out=beginBoss92.call(this,wave,sector,forced);
  if(this.boss&&this.bossState){const q=this.v91BossExtent?.(this.boss)||{y:(this.boss.size||64)*1.2};this.bossState.stage='approach';this.bossState._v92ApproachT=0;this.boss.x=centerX(this);this.boss.y=-q.y-28;this.syncSubsystems?.(this.boss)}
  if(R._v92BossLabNext){this._v91DevSession=true;this._v92BossLabSession=true;R._v92BossLabNext=false;}
  return out;
};
GP._v8BeginBoss=function(wave,sector){this.v9BeginBoss(wave,sector)};
GP.startSectorBoss=function(){this.v9BeginBoss(this.wave,this.currentSector||this.pickSector?.(this.sectorIndex?.()||0),this._v9ForcedProfileId)};
GP.startBossIntro=GP.startSectorBoss;
const bossUpdate92=GP.bossUpdate;
GP.bossUpdate=function(dt){if(this.bossState?.stage==='approach'){this.syncSubsystems?.(this.boss);return}return bossUpdate92?.call(this,dt)};
const startBoss92=GP.v9StartBossFight;
GP.v9StartBossFight=function(){if(this.bossState)this.bossState._v92ApproachT=3.15;const out=startBoss92?.call(this);if(this.boss){this.boss.x=centerX(this);this.boss.y=this.v91BossAnchorY?.(this.boss)??this.hgt*.235;this.v91ConstrainBoss?.(this.boss,true)}return out};
GP.startBossFight=GP.v9StartBossFight;

// Bosses must survive long enough to actually be boss fights.
const createBoss92=GP.v9CreateBoss;
GP.v9CreateBoss=function(profile,sector,wave){
  const e=createBoss92.call(this,profile,sector,wave),tier=Math.max(0,Math.floor((wave-1)/10)),lvl=Math.max(1,this.level||1),over=Math.max(0,lvl-(5+tier*2));
  const hpMul=1.95+tier*.58+over*.13,shieldMul=1.65+tier*.42+over*.08;
  e.hp*=hpMul;e.max*=hpMul;e.shield*=shieldMul;e.maxShield*=shieldMul;
  for(const s of e.subsystems||[]){s.hp*=hpMul;s.max*=hpMul}
  return e;
};

// ---------------------------------------------------------------------------
// RUN PACING: level slower, post-boss sectors step up harder, offscreen immunity.
// ---------------------------------------------------------------------------
const type92=GP.v91Type;
GP.v91Type=function(sector,wave){
  const t=type92.call(this,sector,wave);if(!t)return t;
  const tier=Math.max(0,Math.floor((wave-1)/10)),pos=(wave-1)%10;
  t.hp*=1+tier*.34+pos*.022;t.damage*=1+tier*.17+pos*.012;t.speed*=1+tier*.022;
  return t;
};
const beginCombat92=GP._v8BeginCombat;
GP._v8BeginCombat=function(wave,sector){
  beginCombat92.call(this,wave,sector);const e=this._v8Encounter;if(!e||e.type!=='combat')return;
  const tier=Math.max(0,Math.floor((wave-1)/10)),pos=(wave-1)%10,extra=tier*3;
  if(extra>0)e.queue.push(...Array(extra).fill(1));e.total=(e.total||0)+extra;e.pressureCap=Math.min(23,6+Math.floor(pos/3)+tier*3.25);
};
const valid92=GP.validTarget;
if(valid92)GP.validTarget=function(t){if(t&&!t.boss&&(t._v92Entry||0)>0)return false;if(t&&!t.boss&&Number.isFinite(t.y)&&t.y<54)return false;return valid92.call(this,t)};
const spawnOne92=GP.v91SpawnOne;
GP.v91SpawnOne=function(force=false){const before=new Set(this.en||[]),ok=spawnOne92.call(this,force);if(ok)for(const e of this.en||[])if(!before.has(e)&&!e.boss)e._v92Entry=.62;return ok};
const enemyDie92=GP.enemyDie;
GP.enemyDie=function(e){const out=enemyDie92.call(this,e);const tier=Math.max(0,Math.floor((Math.max(1,this.wave)-1)/10)),lvl=Math.max(1,this.level||1),minNext=Math.round(62+Math.pow(lvl,1.28)*24+tier*38);if(Number.isFinite(this.next))this.next=Math.max(this.next,minNext);return out};

// ---------------------------------------------------------------------------
// 3-SECOND WAVE GAPS + TIMED RESOURCE FIELDS.
// Normal combat remains kill-complete. Asteroid fields are the deliberate exception.
// ---------------------------------------------------------------------------
const finishEncounter92=GP._v8FinishEncounter;
GP._v8FinishEncounter=function(){
  const e=this._v8Encounter;if(e?.type==='asteroid'&&e.timed&&(e.timeLeft||0)>0)return;
  const out=finishEncounter92.call(this);this.count=3;document.querySelector('#v92FieldTimer')?.remove();return out;
};
const startCheckpoint92=AP.startAtCheckpoint;
if(startCheckpoint92)AP.startAtCheckpoint=function(w){const out=startCheckpoint92.call(this,w);if(R.game)R.game.count=3;return out};
GP.v92SpawnFieldRock=function(){
  const e=this._v8Encounter;if(!e||e.type!=='asteroid')return null;
  const size=Math.random()<.22?3:Math.random()<.72?2:1,rich=Math.random()<.19,r=size===3?38:size===2?27:17;
  let x=r+14+Math.random()*Math.max(20,this.w-r*2-28),y=98+r+Math.random()*50;
  const rock=this._v8MakeRock?.(size,rich,x,y);if(!rock)return null;
  rock.vx=(Math.random()-.5)*(size===3?34:48);rock.vy=24+Math.random()*32;rock._v92Field=true;rock._v92TTL=5.5+Math.random()*4;this.rocks.push(rock);return rock;
};
GP._v8BeginAsteroids=function(wave,sector){
  this._v8Encounter={type:'asteroid-intro',wave,sector,complete:false};this.en=[];this.bad=[];this.tele=[];this.rocks=[];this.active=true;this.count=999;this.paused=true;this.v83SetWaveHUD?.(wave,sector,'RESOURCE FIELD');
  this.v83Warning?.({kicker:'SENSOR // RESOURCE CONTACT',title:'ASTEROID FIELD',sub:'MINING WINDOW INBOUND',color:'#8fc7d9'},()=>{
    const tier=Math.max(0,Math.floor((wave-1)/10)),duration=Math.min(24,15+tier*1.6),cap=Math.min(18,11+tier*2);
    this.paused=false;this._v8Encounter={type:'asteroid',wave,sector,complete:false,timed:true,timeLeft:duration,duration,spawnCooldown:.25,cap};this.en=[];this.bad=[];this.tele=[];this.rocks=[];this.active=true;this.count=999;
    for(let i=0;i<Math.min(cap,8+tier);i++)this.v92SpawnFieldRock();
    const timer=E('div','v92FieldTimer');timer.id='v92FieldTimer';timer.innerHTML='<small>RESOURCE FIELD</small><b></b>';document.body.append(timer);
  });
};

// ---------------------------------------------------------------------------
// CARD FEEL: rarity-colored focus + dedicated two-note selection tick.
// ---------------------------------------------------------------------------
R.v92CardSound=()=>{try{const a=R.audio;if(!a||a.master<=0)return;a.ctx=a.ctx||new (window.AudioContext||window.webkitAudioContext)();const c=a.ctx;if(c.state==='suspended')c.resume?.();const t=c.currentTime;[[620,0],[930,.045]].forEach(([f,d])=>{const o=c.createOscillator(),g=c.createGain();o.type='triangle';o.frequency.setValueAtTime(f,t+d);g.gain.setValueAtTime(.0001,t+d);g.gain.linearRampToValueAtTime(.028*a.master,t+d+.01);g.gain.exponentialRampToValueAtTime(.0001,t+d+.09);o.connect(g);g.connect(c.destination);o.start(t+d);o.stop(t+d+.1)})}catch{R.audio?.play?.('ui')}};
if(!R._v92CardEvents){R._v92CardEvents=true;document.addEventListener('pointerdown',ev=>{const c=ev.target?.closest?.('#cards .card');if(!c)return;document.querySelectorAll('#cards .card.v92Focus').forEach(n=>n.classList.remove('v92Focus'));c.classList.add('v92Focus');R.audio?.play?.('ui')},{passive:true});document.addEventListener('click',ev=>{const c=ev.target?.closest?.('#cards .card');if(c)R.v92CardSound()});}

// ---------------------------------------------------------------------------
// SHIP PAGE: one-screen live diagnostic window, compact status + records.
// ---------------------------------------------------------------------------
AP.tab_ship=function(c){
  this.s=R.migrate(this.s);cancelAnimationFrame(this._v92ShipAnim||0);this._v92ShipAnim=0;c.classList.add('commandDeck','v92ShipDeck');
  const s=this.s,h=R.HULLS[s.hull],st=R.shipStats?.(s)||{},rec=s.records||{},assigned=(s.crew||[]).filter(x=>x.assigned).length,weaponCap=Math.max(1,this.weaponCapacity?.()||h.weapons),droneCap=Math.max(0,R.droneCapacity?.(s)??s.systems?.droneBay??0),hangarCap=Math.max(0,s.systems?.hangar||0);
  const hero=E('section','v92ShipHero',`<div class="v92ShipIdentity"><span><small>LIVE FLAGSHIP LINK</small><h1>${s.shipName||'WAYFARER'}</h1><b>${h.name.toUpperCase()} · FLAGSHIP</b></span><button class="renameShip" aria-label="Rename ship">✎</button></div><div class="v92LiveStage"><canvas id="ship" width="900" height="500"></canvas><div class="v92LiveRead"><span><i></i>LIVE</span><b>DOCK // TELEMETRY</b></div></div>`);c.append(hero);hero.querySelector('.renameShip').onclick=()=>this.v7RenameShip?.();
  const rows=[['♥','HULL',st.hull||h.hp,Math.round(h.hp*1.75)],['⬡','SHIELD',st.shield||h.shield,Math.round(h.shield*1.8)],['⚡','REACTOR',Math.round(((st.reactor||1)-1)*100),60],['▰','ARMOR',Math.round((st.armor||0)*100),22],['👥','CREW',assigned,s.quarters||h.crew],['⊙','WEAPONS',(s.weaponMounts||s.weapons||[]).filter(Boolean).length,weaponCap],['◇','DRONES',(s.equippedDrones||s.drones||[]).length,droneCap||1],['▷','HANGAR',(s.equippedSupports||s.supports||[]).length,hangarCap||1]];
  const grid=E('section','v92DiagGrid');rows.forEach(([ic,n,v,m])=>{const pct=clamp((Number(v)||0)/(Number(m)||1)*100,0,100);grid.append(E('div','v92Diag',`<i>${ic}</i><span><small>${n}</small><b>${v}/${m}</b><u><s style="width:${pct}%"></s></u></span>`))});c.append(grid);
  const records=E('section','v92Records');[['◈','BEST',rec.wave||0],['✕','SHIPS',fmt(rec.kills||0)],['◆','BOSSES',rec.bosses||0],['↻','RUNS',rec.runs||0]].forEach(x=>records.append(E('div','v92Record',`<i>${x[0]}</i><b>${x[2]}</b><small>${x[1]}</small>`)));c.append(records);
  this.v92AnimateShipPage?.();
};
AP.v92AnimateShipPage=function(){
  cancelAnimationFrame(this._v92ShipAnim||0);const cv=$('#ship');if(!cv)return;const x=cv.getContext('2d'),s=this.s,mounts=(s.weaponMounts||s.weapons||[]).filter(Boolean),stars=Array.from({length:80},()=>({x:Math.random()*cv.width,y:Math.random()*cv.height,z:.3+Math.random()*1.4}));let t=0;
  const frame=()=>{if(!cv.isConnected)return;t+=.016;x.clearRect(0,0,cv.width,cv.height);const g=x.createLinearGradient(0,0,0,cv.height);g.addColorStop(0,'#07121b');g.addColorStop(.62,'#02070c');g.addColorStop(1,'#050a0e');x.fillStyle=g;x.fillRect(0,0,cv.width,cv.height);
    for(const q of stars){q.y+=q.z*.18;if(q.y>cv.height){q.y=0;q.x=Math.random()*cv.width}x.fillStyle=`rgba(190,225,238,${.08+q.z*.13})`;x.fillRect(q.x,q.y,q.z>1?2:1,q.z>1?2:1)}
    x.strokeStyle='rgba(84,142,168,.12)';x.lineWidth=2;for(const sx of [80,145,cv.width-145,cv.width-80]){x.beginPath();x.moveTo(sx,0);x.lineTo(sx+(sx<cv.width/2?65:-65),cv.height);x.stroke()}for(let i=0;i<5;i++){x.fillStyle=`rgba(99,211,244,${.18+.12*Math.sin(t*2+i)})`;x.fillRect(52+i*170,cv.height-30,42,3)}
    const bob=Math.sin(t*1.25)*4;R.drawShip?.(x,cv.width/2,cv.height*.53+bob,2.18,mounts,s.hull,true,{drones:s.equippedDrones||s.drones||[],supports:s.equippedSupports||s.supports||[]});
    this._v92ShipAnim=requestAnimationFrame(frame)};frame();
};

// ---------------------------------------------------------------------------
// BOSS LAB lives in Settings. No floating dev-site button.
// ---------------------------------------------------------------------------
AP.v92OpenBossLab=function(){
  if(!this.v9OpenBossLab)return this.deny?.('BOSS LAB UNAVAILABLE');this.v9OpenBossLab();requestAnimationFrame(()=>{const o=$('#v9BossLab'),b=o?.querySelector('[data-launch]');if(!b||b._v92Wrapped)return;b._v92Wrapped=true;const old=b.onclick;b.onclick=function(ev){R._v92BossLabNext=true;return old?.call(this,ev)}})
};
AP.v92InjectBossLab=function(){
  if(document.body.classList.contains('combat')||$('.v92BossLabSetting'))return;
  const heading=[...document.querySelectorAll('h1,h2,h3,.sheetTitle,.settingsTitle')].find(n=>/^SETTINGS$/i.test((n.textContent||'').trim()));if(!heading)return;
  const root=heading.closest('.screen,.sheet,.panel,main')||heading.parentElement;if(!root)return;
  const p=E('section','v92BossLabSetting','<span><small>DEVELOPER</small><b>BOSS LAB</b><p>Launch any boss directly for encounter testing.</p></span>');const b=E('button','btn','OPEN');b.onclick=()=>this.v92OpenBossLab();p.append(b);root.append(p);
};
const settingsNames=['settings','openSettings','tab_settings'];for(const k of settingsNames){const fn=AP[k];if(typeof fn==='function')AP[k]=function(...args){const out=fn.apply(this,args);requestAnimationFrame(()=>this.v92InjectBossLab());return out}};
if(!R._v92SettingsObserver){R._v92SettingsObserver=new MutationObserver(()=>R.app?.v92InjectBossLab?.());R._v92SettingsObserver.observe(document.documentElement,{childList:true,subtree:true});}

// ---------------------------------------------------------------------------
// LIVE MAIN MENU: moving space, animated ship feed, telemetry, stronger logo.
// ---------------------------------------------------------------------------
AP.v92StopMain=function(){cancelAnimationFrame(this._v92MainAnim||0);this._v92MainAnim=0;$('#v92MainScene')?.remove();$('#v92MainDiag')?.remove();document.body.classList.remove('v92Main')};
AP.v92StartMain=function(){
  this.v92StopMain();document.body.classList.add('v92Main');const bg=E('canvas','v92MainScene');bg.id='v92MainScene';document.body.prepend(bg);const diag=E('div','v92MainDiag','<small>FLAGSHIP LINK // LIVE</small><span>REACTOR <b>STABLE</b></span><span>NAV <b>READY</b></span><span>TELEMETRY <b>SYNCED</b></span>');diag.id='v92MainDiag';document.body.append(diag);
  const live=$('.v83MainShip');if(live){live.width=420;live.height=300;live.classList.add('v92MainShipLive')}
  const stars=Array.from({length:115},()=>({x:Math.random(),y:Math.random(),z:.25+Math.random()*1.7}));let t=0;
  const frame=()=>{if(!document.body.classList.contains('v92Main')||!bg.isConnected)return;const dpr=Math.min(2,window.devicePixelRatio||1),w=innerWidth,h=innerHeight;if(bg.width!==Math.round(w*dpr)||bg.height!==Math.round(h*dpr)){bg.width=Math.round(w*dpr);bg.height=Math.round(h*dpr);bg.style.width=w+'px';bg.style.height=h+'px'}const x=bg.getContext('2d');x.setTransform(dpr,0,0,dpr,0,0);x.fillStyle='#02050a';x.fillRect(0,0,w,h);t+=.016;
    const halo=x.createRadialGradient(w*.5,h*.31,0,w*.5,h*.31,w*.48);halo.addColorStop(0,'rgba(21,69,91,.2)');halo.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=halo;x.fillRect(0,0,w,h);
    for(const s of stars){s.y+=s.z*.00055;if(s.y>1){s.y=0;s.x=Math.random()}x.fillStyle=`rgba(214,239,248,${.12+s.z*.18})`;const sz=s.z>1.25?1.6:1;x.fillRect(s.x*w,s.y*h,sz,sz*(s.z>1.35?2.5:1))}
    x.strokeStyle='rgba(83,190,224,.055)';x.lineWidth=1;x.beginPath();x.arc(w*.5,h*.31,Math.min(w,h)*(.28+.01*Math.sin(t*.7)),0,Math.PI*2);x.stroke();
    if(live?.isConnected){const lx=live.getContext('2d'),lw=live.width,lh=live.height;lx.clearRect(0,0,lw,lh);const s=this.s||R.getSlot?.(R.loadAll?.().last||1),mounts=(s?.weaponMounts||s?.weapons||[]).filter(Boolean);const glow=lx.createRadialGradient(lw/2,lh*.7,0,lw/2,lh*.7,lw*.38);glow.addColorStop(0,'rgba(73,200,238,.12)');glow.addColorStop(1,'rgba(0,0,0,0)');lx.fillStyle=glow;lx.fillRect(0,0,lw,lh);R.drawShip?.(lx,lw/2,lh*.52+Math.sin(t*1.1)*3,1.42,mounts,s?.hull||0,true,{drones:s?.equippedDrones||[],supports:s?.equippedSupports||[]})}
    this._v92MainAnim=requestAnimationFrame(frame)};frame();
};
const main92=AP.main;
AP.main=function(...args){R.VERSION='0.9.2';const out=main92.apply(this,args);requestAnimationFrame(()=>{syncVersion();this.v92StartMain()});return out};
const station92=AP.station;
AP.station=function(...args){this.v92StopMain?.();R.VERSION='0.9.2';const out=station92.apply(this,args);requestAnimationFrame(syncVersion);return out};
const build92=GP.build;
GP.build=function(...args){this.app?.v92StopMain?.();document.querySelectorAll('.v9BossLabButton').forEach(n=>n.remove());return build92.apply(this,args)};

// ---------------------------------------------------------------------------
// UPDATE LAYER: deterministic boss reveal, entry protection, timed asteroid stream.
// ---------------------------------------------------------------------------
const update92=GP.update;
GP.update=function(dt){
  update92.call(this,dt);if(this.dead)return;
  for(const e of this.en||[])if(!e.boss&&e._v92Entry)e._v92Entry=Math.max(0,e._v92Entry-dt);
  if(this.bossState?.stage==='approach')this.v92BossApproachStep(dt);
  if(this.paused)return;
  const e=this._v8Encounter;if(!e||e.type!=='asteroid'||!e.timed)return;
  e.timeLeft-=dt;e.spawnCooldown=(e.spawnCooldown||0)-dt;this.en=[];this.bad=[];this.tele=[];this.active=true;this.count=999;
  const timer=$('#v92FieldTimer');if(timer){const b=timer.querySelector('b');if(b)b.textContent=Math.max(0,e.timeLeft).toFixed(1)+'s'}
  if(e.timeLeft>0){for(const r of [...(this.rocks||[])])if(r._v92Field){r._v92TTL=(r._v92TTL??7)-dt;if(r._v92TTL<=0){r._v8Split=true;const i=this.rocks.indexOf(r);if(i>=0)this.rocks.splice(i,1)}}if(e.spawnCooldown<=0&&(this.rocks?.length||0)<e.cap){const room=e.cap-(this.rocks?.length||0),n=Math.min(room,Math.random()<.35?2:1);for(let i=0;i<n;i++)this.v92SpawnFieldRock();e.spawnCooldown=.48+Math.random()*.42;}return;}
  this.rocks=[];this.bad=[];this.tele=[];document.querySelector('#v92FieldTimer')?.remove();e.timeLeft=0;finishEncounter92.call(this);this.count=3;
};

requestAnimationFrame(syncVersion);setTimeout(syncVersion,180);
})();
