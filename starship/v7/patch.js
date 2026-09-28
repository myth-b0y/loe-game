(()=>{
const R=window.SR;
if(!R||!R.App||!R.Game)throw new Error('V7 base runtime missing');
R.VERSION='0.7.0';
const AP=R.App.prototype, GP=R.Game.prototype;
const $=s=>document.querySelector(s);
const E=(t,c,h)=>{const e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e};
const B=(h,fn,c='btn')=>{const b=E('button',c,h);b.onclick=fn;return b};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const fmt=n=>n<1000?Math.floor(n):n<1e6?(n/1000).toFixed(1)+'k':(n/1e6).toFixed(1)+'m';
const priorMigrate=R.migrate;
R.migrate=s=>{
  s=priorMigrate(s);if(!s)return s;
  if(!s.shipName||/^UNNAMED/i.test(s.shipName))s.shipName='WAYFARER';
  s.systems=Object.assign({shield:0,armor:0,reactor:0,engines:0,droneBay:0,hangar:0},s.systems||{});
  s.records=Object.assign({wave:0,kills:0,bosses:0,runs:0},s.records||{});
  s.version='0.7.0';
  return s;
};
R.shipStats=s=>{
  const h=R.HULLS[s.hull];
  const sys=s.systems||{};
  return {
    hull:Math.round(h.hp*(1+(sys.armor||0)*.045)),
    shield:Math.round(h.shield*(1+(sys.shield||0)*.16)),
    shieldRecharge:1+(sys.shield||0)*.12+(sys.reactor||0)*.035,
    shieldDelay:Math.max(.48,1-(sys.shield||0)*.06),
    reactor:1+(sys.reactor||0)*.06,
    tactical:1+(sys.reactor||0)*.10,
    engines:1+(sys.engines||0)*.07,
    armor:(sys.armor||0)*.035
  };
};
AP.tab_ship=function(c){
  this.s=R.migrate(this.s);
  c.classList.add('commandDeck');
  const h=R.HULLS[this.s.hull], st=R.shipStats(this.s), rec=this.s.records||{};
  const hero=E('section','commandHero');
  hero.innerHTML=`
    <div class="shipIdentity"><button class="renameShip" aria-label="Rename ship">✎</button><h1>${this.s.shipName}</h1><small>${h.name.toUpperCase()} · FLAGSHIP</small></div>
    <div class="shipStage"><canvas id="ship" width="720" height="340"></canvas></div>`;
  c.append(hero);
  hero.querySelector('.renameShip').onclick=()=>this.v7RenameShip();
  setTimeout(()=>this.v7DrawShip(),0);
  const assigned=(this.s.crew||[]).filter(x=>x.assigned).length;
  const cap=Math.max(1,this.weaponCapacity?this.weaponCapacity():h.weapons);
  const rows=[
    ['♥','HULL',st.hull,Math.round(h.hp*1.75),'STRUCTURE'],
    ['⬡','SHIELD',st.shield,Math.round(h.shield*1.8),'ARRAY'],
    ['⚡','REACTOR',Math.round((st.reactor-1)*100),60,'OUTPUT'],
    ['▰','ARMOR',Math.round(st.armor*100),22,'PLATING'],
    ['👥','CREW',assigned,this.s.quarters||h.crew,'ACTIVE'],
    ['⊙','WEAPONS',(this.s.weaponMounts||this.s.weapons||[]).filter(Boolean).length,cap,'MOUNTS'],
    ['◇','DRONES',(this.s.equippedDrones||this.s.drones||[]).length,Math.max(1,(this.s.systems?.droneBay||0)),'BAY'],
    ['▷','HANGAR',(this.s.equippedSupports||this.s.supports||[]).length,Math.max(1,(this.s.systems?.hangar||0)),'CRAFT']
  ];
  const grid=E('section','diagGrid');
  rows.forEach(([ic,n,v,m,sub])=>{const pct=clamp((Number(v)||0)/(Number(m)||1)*100,0,100);grid.append(E('div','diagUnit',`<i>${ic}</i><span><b>${n}</b><em>${v}/${m}</em><small>${sub}</small><u><s style="width:${pct}%"></s></u></span>`))});
  c.append(grid);
  const records=E('section','recordStrip');
  [['◈','BEST WAVE',rec.wave||0],['✕','SHIPS',fmt(rec.kills||0)],['◆','BOSSES',rec.bosses||0],['↻','RUNS',rec.runs||0]].forEach(x=>records.append(E('div','recordStat',`<i>${x[0]}</i><b>${x[2]}</b><small>${x[1]}</small>`)));
  c.append(records);
};
AP.v7RenameShip=function(){
  const o=E('div','v7Sheet');o.innerHTML=`<div class="v7Card"><small>FLAGSHIP IDENTITY</small><h2>RENAME SHIP</h2><input id="v7ShipName" maxlength="24" value="${String(this.s.shipName||'WAYFARER').replace(/"/g,'&quot;')}"><div class="v7Actions"><button class="btn" data-a="cancel">CANCEL</button><button class="btn primary" data-a="save">SAVE</button></div></div>`;document.body.append(o);
  o.querySelector('[data-a=cancel]').onclick=()=>o.remove();o.querySelector('[data-a=save]').onclick=()=>{this.s.shipName=o.querySelector('#v7ShipName').value.trim()||'WAYFARER';R.save(this.s);o.remove();this.station('ship')};
};
AP.v7DrawShip=function(){const cv=$('#ship');if(!cv)return;const x=cv.getContext('2d'),w=cv.width,h=cv.height;x.clearRect(0,0,w,h);for(let i=0;i<90;i++){x.fillStyle='rgba(220,242,255,.18)';x.fillRect(Math.random()*w,Math.random()*h,1,1)}const mounts=(this.s.weaponMounts||this.s.weapons||[]).filter(Boolean);R.drawShip?.(x,w/2,h/2+10,1.55,mounts,this.s.hull,true,{drones:this.s.equippedDrones||this.s.drones||[],supports:this.s.equippedSupports||this.s.supports||[]})};
const priorStation=AP.station;
AP.station=function(t=this.tab){priorStation.call(this,t);requestAnimationFrame(()=>this.v7Chrome())};
AP.v7Chrome=function(){
  if(document.body.classList.contains('combat'))return;
  const top=$('.top');if(top){top.classList.add('v7Top');top.innerHTML=`<button class="v7Menu" aria-label="Menu">☰</button><b>LOE: STARSHIP SURVIVOR</b><span>▰ ${fmt(this.s?.salvage||0)}　◆ ${this.s?.cores||0}</span>`;top.querySelector('.v7Menu').onclick=()=>this.main();}
  const foot=$('.foot');if(foot){foot.classList.add('v7Foot');const first=foot.querySelector('button:not(.launch)');if(first)first.remove();}
};
const priorMount=AP.mountWeapon;
AP.mountWeapon=function(id){priorMount.call(this,id);requestAnimationFrame(()=>{const cv=$('#mountCanvas');if(cv){cv.style.aspectRatio='1 / 1';cv.style.height='auto';cv.style.maxHeight='56dvh'}})};
const priorBuild=GP.build;
GP.build=function(){priorBuild.call(this);this.autoMode=!!this.autoMode;this._v7TacticalClock=0;this._sectorIntroShown={};
  let deck=$('#runDeck');if(deck)deck.remove();deck=B('▤',()=>this.showRunDeck(),'runDeck');deck.id='runDeck';deck.setAttribute('aria-label','Run cards');document.body.append(deck);
  const auto=$('#autoRun');if(auto){auto.onclick=()=>{this.autoMode=!this.autoMode;auto.classList.toggle('on',this.autoMode);auto.textContent=this.autoMode?'AUTO ✓':'AUTO';if(this.autoMode&&$('#cards')?.classList.contains('show'))this.autoChoose?.()};}
};
GP.showRunDeck=function(){if($('#runDeckSheet'))return;const was=this.paused;this.paused=true;const o=E('div','runDeckSheet');o.id='runDeckSheet';const owned=(this.cards||[]).map(id=>R.CARDS.find(c=>c.id===id)).filter(Boolean),counts={};owned.forEach(c=>counts[c.id]=(counts[c.id]||0)+1);const unique=[...new Map(owned.map(c=>[c.id,c])).values()];o.innerHTML=`<div class="runDeckCard"><header><span><small>RUN BUILD</small><h2>${owned.length} CARDS</h2></span><button>×</button></header><div class="runDeckList"></div></div>`;const list=o.querySelector('.runDeckList');if(!unique.length)list.innerHTML='<p>No cards collected yet.</p>';unique.forEach(c=>list.append(E('div','runCard '+(c.rarity||'common'),`<i>${c.icon||'◇'}</i><span><b>${c.name}${counts[c.id]>1?' ×'+counts[c.id]:''}</b><small>${R.RARITIES?.[c.rarity]?.name||c.rarity||'COMMON'}</small><p>${c.desc||'No description.'}</p></span>`)));document.body.append(o);o.querySelector('header button').onclick=()=>{o.remove();this.paused=was};};
GP.v7SectorLabel=function(sector){if(!sector)return{race:'UNKNOWN',force:'UNKNOWN CONTACT'};if(sector.kind==='void')return{race:'VOID',force:'VOID INCURSION'};if(sector.kind==='pirate')return{race:'PIRATES',force:'FREEBOOTER FLOTILLA'};return{race:sector.name||'UNKNOWN',force:(sector.forceName||((sector.name||'UNKNOWN')+' FLEET'))};};
GP.showSectorIntro=function(sector,cb){const idx=this.sectorIndex?this.sectorIndex():Math.floor((Math.max(1,this.wave)-1)/10);if(this._sectorIntroShown?.[idx]){cb?.();return}this._sectorIntroShown=this._sectorIntroShown||{};this._sectorIntroShown[idx]=true;const label=this.v7SectorLabel(sector),warn=sector.kind==='void'||sector.kind==='pirate';const o=E('div','sectorIntro '+(warn?'warning':'normal'));o.innerHTML=`<div class="sectorIntroCard"><small>${sector.kind==='void'?'⚠ ANOMALOUS CONTACT':sector.kind==='pirate'?'⚠ UNALIGNED FLEET':'SECTOR CONTACT'}</small><h1>${label.force}</h1><b>${label.race}</b><p>${sector.desc||''}</p></div>`;document.body.append(o);R.audio?.play(sector.kind==='void'?'boss':'ui');setTimeout(()=>o.classList.add('show'),20);setTimeout(()=>{o.classList.remove('show');setTimeout(()=>{o.remove();cb?.()},260)},1650)};
const priorSpawnWave=GP.spawnWave;
GP.spawnWave=function(){
  const next=(Number(this.wave)||0)+1,idx=Math.floor((Math.max(1,next)-1)/10);
  if(next%10===1){const sector=this.pickSector?this.pickSector(idx):null;this.paused=true;this.showSectorIntro(sector,()=>{this.paused=false;priorSpawnWave.call(this)});return;}
  priorSpawnWave.call(this);
};
const priorUpdate=GP.update;
GP._v7WaveState=null;
GP._v7StartSustainedWave=function(){const dur=Math.min(88,38+this.wave*1.15),sector=this.currentSector||this.pickSector?.(this.sectorIndex?.()||0);this._v7WaveState={time:dur,spawn:0,finished:false,sector};};
GP._v7SpawnPulse=function(){if(this.bossState||this.wave%10===0)return;const sector=this._v7WaveState?.sector||this.currentSector;const count=1+Math.floor(this.wave/12)+((Math.random()*2)|0);for(let i=0;i<count;i++){const t=this._safeSectorType?this._safeSectorType(sector):null;if(t)this.spawn(t)}};
GP._v7AsteroidField=function(){this._v7Asteroid=true;this.active=true;this.en=[];this.bad=[];this.tele=[];this.rocks=[];for(let i=0;i<12+Math.min(18,Math.floor(this.wave*.7));i++){const rich=Math.random()<.22,r=18+Math.random()*22;this.rocks.push({rock:true,x:Math.random()*this.w,y:-Math.random()*this.hgt*.8-40,vx:(Math.random()-.5)*10,vy:18+Math.random()*22,r,hp:(rich?300:190)+this.wave*6,max:(rich?300:190)+this.wave*6,value:Math.round((rich?170:80)+this.wave*(rich?7:4)),rich,spin:Math.random()*6})}const msg=E('div','fieldNotice','<small>SYSTEM CONTACT</small><b>RESOURCE FIELD DETECTED</b><span>Mine the field. No collision threat.</span>');document.body.append(msg);setTimeout(()=>msg.remove(),1500)};
const priorSW=GP.spawnWave;
GP.spawnWave=function(){
  const next=(Number(this.wave)||0)+1,idx=Math.floor((Math.max(1,next)-1)/10);
  const start=()=>{if(next%10!==0&&next>2&&Math.random()<.10){this.wave=next;this.currentSector=this.pickSector?this.pickSector(idx):this.currentSector;const we=$('#wave');if(we)we.textContent=`◈ ${this.wave} · RESOURCE FIELD`;this._v7AsteroidField();return;}priorSW.call(this);if(this.wave%10!==0&&!this.bossState)this._v7StartSustainedWave();};
  if(next%10===1){const sector=this.pickSector?this.pickSector(idx):null;this.paused=true;this.showSectorIntro(sector,()=>{this.paused=false;start()});return;}start();
};
GP.update=function(dt){
  if(this._bossFaulted)return;
  priorUpdate.call(this,dt);
  if(this.dead||this.paused)return;
  if(this._v7Asteroid){for(const r of this.rocks||[])r.y+=r.vy*dt;if((this.rocks||[]).length){this.active=true;this.count=Math.max(Number(this.count)||0,1)}else{this._v7Asteroid=false;this.active=false;this.bad=[];this.tele=[];this.count=.8;}return;}
  if(this._v7WaveState&&!this.bossState){const w=this._v7WaveState;w.time-=dt;w.spawn-=dt;if(w.time>0){this.active=true;this.count=Math.max(Number(this.count)||0,1);if(w.spawn<=0){this._v7SpawnPulse();w.spawn=Math.max(1.5,4.6-this.wave*.035)+Math.random()*1.2}}if(w.time<=0)w.finished=true;if(w.finished&&(this.en?.length||0)===0){this._v7WaveState=null;this.active=false;this.bad=[];this.tele=[];if(this.mines)this.mines=[];this.count=.8;}}
  if(this.autoMode)this.v7AutoTactical(dt);
};
GP.v7AutoTactical=function(dt){this._v7TacticalClock=(this._v7TacticalClock||0)-dt;if(this._v7TacticalClock>0||this.bossState)return;this._v7TacticalClock=.8;const ids=this.s.tactical||this.s.actives||[];ids.forEach((id,i)=>{const cd=this.activeCd?.[i]||0;if(cd>0)return;const a=R.TACTICAL?.find(q=>q.id===id);if(!a)return;const hp=this.hp/Math.max(1,this.maxHp),sh=this.shield/Math.max(1,this.maxShield),n=(this.en||[]).length;let use=false;const nm=(a.name||'').toLowerCase();if(/shield|repair|barrier/.test(nm))use=sh<.35||hp<.5;else if(/ion|emp|gravity|nova|bomb/.test(nm))use=n>=5;else if(/missile|barrage|strike|laser|overdrive/.test(nm))use=n>=4;else use=n>=7&&Math.random()<.22;if(use&&Math.random()<.82)this.useTactical?.(i)});};
const priorOffer=GP.offer;
GP.offer=function(){priorOffer.call(this);if(this.autoMode)setTimeout(()=>this.autoChoose?.(),120)};
const priorStartBoss=GP.startSectorBoss||GP.startBossIntro;
if(priorStartBoss){GP.startSectorBoss=function(){this._bossResolved=false;this._bossAdvanceBlocked=true;this._bossFaulted=false;try{return priorStartBoss.call(this)}catch(e){this.paused=true;this._bossFaulted=true;this._showRuntimeFault?.(e);throw e}};}
const priorEnemyDie=GP.enemyDie;
GP.enemyDie=function(e){const wasBoss=!!e?.boss;const out=priorEnemyDie.call(this,e);if(wasBoss){this._bossResolved=true;this._bossAdvanceBlocked=false;this._bossFaulted=false;}return out};
const priorFault=GP._showRuntimeFault;
GP._showRuntimeFault=function(err){const msg=String(err?.message||err||'Unknown combat fault');if(this.bossState||this.wave%10===0){this.paused=true;this._bossAdvanceBlocked=true;this._bossFaulted=true;}if(priorFault)priorFault.call(this,err);let n=$('#runtimeFault');if(n){n.textContent='COMBAT FAULT · '+msg.slice(0,110);clearTimeout(this._faultTimer);this._faultTimer=setTimeout(()=>n?.remove(),10000)}};
const priorInit=GP.initShip;
GP.initShip=function(){priorInit.call(this);const st=R.shipStats(this.s);this.maxHp=st.hull;this.hp=Math.min(this.hp||st.hull,st.hull);this.maxShield=st.shield;this.shield=Math.min(this.shield||st.shield,st.shield);this.permaArmor=st.armor;this.engineBonus=st.engines;this.reactorWeaponBonus=st.reactor;this.reactorTacticalBonus=st.tactical;if(this.mods){this.mods.shieldRegen=(this.mods.shieldRegen||1)*st.shieldRecharge;this.mods.shieldDelay=(this.mods.shieldDelay||1)*st.shieldDelay;}};
const priorFireMount=GP.fireFromMount;
if(priorFireMount)GP.fireFromMount=function(t,w,slot){const old=w.damage;const copy={...w,damage:old*(this.reactorWeaponBonus||1)};return priorFireMount.call(this,t,copy,slot)};
const priorUseTac=GP.useTactical;
if(priorUseTac)GP.useTactical=function(i){const before=this.activeCd?.[i]||0;const out=priorUseTac.call(this,i);if(this.activeCd&&this.activeCd[i]>before)this.activeCd[i]/=(this.reactorTacticalBonus||1);return out};
})();
