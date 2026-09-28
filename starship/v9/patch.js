(()=>{
'use strict';
const R=window.SR;if(!R?.App||!R?.Game)return;
R.VERSION='0.9.0';
const AP=R.App.prototype,GP=R.Game.prototype,$=s=>document.querySelector(s),clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),pick=a=>a?.length?a[Math.random()*a.length|0]:null;
const clone=o=>JSON.parse(JSON.stringify(o));

// ---------------------------------------------------------------------------
// BOSS PROFILES: recovered v0.4 archetypes, adapted to current sector identity.
// Dreadnought = broadside, Carrier Prime = carrier, Reaper = pursuit/lance.
// ---------------------------------------------------------------------------
R.BOSS_ARCHETYPES_V9={
  broadside:{key:'broadside',title:'DREADNOUGHT',desc:'Heavy salvos, sweeping lanes, and armored weapon batteries.',hp:1.18,shield:.34,move:'strafe',cool:1.32,
    subs:[['PORT BATTERY',-.62,.02,'gun'],['STBD BATTERY',.62,.02,'gun'],['SHIELD NODE',0,-.42,'shield']]},
  carrier:{key:'carrier',title:'CARRIER PRIME',desc:'Fighter launches, pressure waves, and targetable hangar systems.',hp:1.08,shield:.42,move:'hold',cool:1.65,
    subs:[['PORT HANGAR',-.58,.10,'hangar'],['STBD HANGAR',.58,.10,'hangar'],['SHIELD NODE',0,-.42,'shield']]},
  reaper:{key:'reaper',title:'REAPER',desc:'Fast lances, charge lanes, and dangerous pursuit patterns.',hp:.96,shield:.24,move:'hunter',cool:1.00,
    subs:[['LANCE',0,-.62,'lance'],['ENGINE',0,.58,'engine'],['SHIELD NODE',.48,-.08,'shield']]}
};
R.BOSS_MODIFIERS_V9=[
  {id:'armored',name:'ARMORED',hp:1.24},
  {id:'fortified',name:'FORTIFIED',shield:1.45},
  {id:'overcharged',name:'OVERCHARGED',rate:.82},
  {id:'regenerative',name:'REGENERATIVE',regen:.008},
  {id:'berserk',name:'BERSERK',phase2Rate:.72},
  {id:'ionized',name:'IONIZED',ionized:true}
];
R.v9FactionExtra=fid=>({
  olydran:['AUX SHIELD',-.48,-.24,'shield'],
  elsari:['ION ARRAY',-.46,-.20,'ion'],
  rakkan:['MISSILE BANK',.48,-.16,'missile'],
  svarin:['VECTOR ENGINE',-.40,.46,'engine'],
  ashari:['OVERDRIVE CORE',.40,.36,'reactor'],
  nevari:['REPAIR CORE',-.42,.34,'repair'],
  aaruian:['TARGETING NODE',.42,-.22,'targeting']
}[fid]||null);
R.v9BossProfilesForSector=(sector,wave=10)=>{
  const fid=sector?.id||sector?.kind||'unknown',color=sector?.color||sector?.accent||'#b7cbd6',accent=sector?.accent||color;
  const names=sector?.kind==='void'?{broadside:'VOID LEVIATHAN',carrier:'VOID BROODSHIP',reaper:'VOID NEEDLE'}:
    sector?.kind==='pirate'?{broadside:'PIRATE DREADNOUGHT',carrier:'PIRATE CARRIER PRIME',reaper:'PIRATE REAPER'}:null;
  return Object.values(R.BOSS_ARCHETYPES_V9).map((a,i)=>({
    id:`v9.${fid}.${a.key}`,factionId:fid,sectorKind:sector?.kind||'base',archetype:a.key,pattern:a.key,
    name:names?.[a.key]||`${sector?.name||'UNKNOWN'} ${a.title}`,desc:a.desc,color,accent,classIndex:Math.min(9,Math.max(2,Math.floor(wave/10)+2+(sector?.kind==='void'?1:0))),
    hpMult:a.hp*(sector?.kind==='void'?1.18:1),shieldMult:a.shield*(sector?.kind==='void'?1.25:1),move:a.move,cool:a.cool,subDefs:a.subs.map(x=>[...x])
  }));
};
R.v9BossProfile=(sector,wave,forced)=>{
  const list=R.v9BossProfilesForSector(sector,wave);if(forced){const f=list.find(x=>x.id===forced||x.archetype===forced);if(f)return f;}
  return list[Math.max(0,(Math.floor(wave/10)-1)%list.length)]||list[0];
};

GP.v9BossScale=function(e){return this.classScale?this.classScale(this.entityClass?this.entityClass(e):e?.type?.classIndex):1};
GP.v9ApplyBossModifiers=function(e,wave){
  e.modifiers=[];let count=wave>=60?2:wave>=30?1:0;
  const seed=Math.floor(wave/10);for(let i=0;i<count;i++){const m=R.BOSS_MODIFIERS_V9[(seed+i*3)%R.BOSS_MODIFIERS_V9.length];if(!m||e.modifiers.some(x=>x.id===m.id))continue;e.modifiers.push(m);if(m.hp){e.hp*=m.hp;e.max*=m.hp}if(m.shield){e.shield*=m.shield;e.maxShield*=m.shield}if(m.rate)e.rateMod*=m.rate;if(m.regen)e.modRegen=(e.modRegen||0)+m.regen;if(m.phase2Rate)e.phase2Rate=m.phase2Rate;if(m.ionized)e.ionizedShots=true;}
};
GP.v9CreateBoss=function(profile,sector,wave){
  const baseHp=2750+wave*90,baseShield=720+wave*25,size=64;
  const e={type:{...profile,role:7,speed:.7,void:sector?.kind==='void',pirate:sector?.kind==='pirate'},boss:true,x:this.w/2,y:-size*2.1,
    hp:baseHp*profile.hpMult,max:baseHp*profile.hpMult,shield:baseShield*profile.shieldMult,maxShield:baseShield*profile.shieldMult,
    damage:1,cd:1.1,flavorCd:3.8,angle:0,slow:0,ion:0,size,phase:1,dead:false,engineBroken:false,weaponBroken:0,hangarBroken:0,rateMod:1,attackIndex:0,moveClock:0,charge:null};
  const defs=profile.subDefs.map(x=>[...x]);const extra=R.v9FactionExtra(profile.factionId);if(extra&&sector?.kind==='base')defs.push(extra);
  e.subsystems=defs.map((d,i)=>({parentBoss:e,name:d[0],nx:d[1],ny:d[2],type:d[3],hp:e.max*(i<3?.115:.085),max:e.max*(i<3?.115:.085),dead:false,x:e.x,y:e.y,id:`${profile.id}.sub.${i}`}));
  this.v9ApplyBossModifiers(e,wave);return e;
};
GP.syncSubsystems=function(e){if(!e?.subsystems)return;const sc=this.v9BossScale(e),s=e.size*sc;for(const q of e.subsystems){q.x=e.x+q.nx*s;q.y=e.y+q.ny*s;}};
GP.destroySubsystem=function(s){
  if(!s||s.dead)return;s.dead=true;const b=s.parentBoss;if(!b)return;
  if(s.type==='shield'){b.shield=0;b.maxShield=0;b.shieldBroken=true}
  else if(s.type==='engine'){b.engineBroken=true}
  else if(s.type==='hangar'){b.hangarBroken=(b.hangarBroken||0)+1}
  else if(s.type==='gun'||s.type==='lance'){b.weaponBroken=(b.weaponBroken||0)+1}
  else if(s.type==='repair')b.repairBroken=true;
  else if(s.type==='ion')b.ionBroken=true;
  else if(s.type==='missile')b.missileBroken=true;
  else if(s.type==='targeting')b.targetingBroken=true;
  else if(s.type==='reactor')b.reactorBroken=true;
  this.fx?.push({x:s.x,y:s.y,r:22,life:.75,color:'#ffd36b'});R.audio?.play('boom',(s.x/Math.max(1,this.w)-.5)*2);
};

// ---------------------------------------------------------------------------
// BOSS CONTROLLER LIFECYCLE
// ---------------------------------------------------------------------------
GP.v9BeginBoss=function(wave,sector,forcedProfile){
  const profile=R.v9BossProfile(sector,wave,forcedProfile||this._v9ForcedProfileId);
  this._v8Encounter={type:'boss',wave,sector,complete:false,victoryResolved:false,traderResolved:wave%20!==0};
  this.en=[];this.rocks=[];this.bad=[];this.tele=[];this.shots=this.shots||[];this.active=true;this.count=999;this.paused=false;
  this.boss=this.v9CreateBoss(profile,sector,wave);this.bossPreview=this.boss;
  this.bossState={stage:'approach',phaseFlash:0,attackIndex:0,profileId:profile.id,started:false};
  this.moveTarget={x:this.w/2,y:this.hgt*.74};this.v83SetWaveHUD?.(wave,sector);
  const color=sector?.kind==='void'?(sector.accent||'#b875ff'):(sector?.color||'#ff8797');
  R.audio?.play('boss');
  const mods=this.boss.modifiers?.length?` · ${this.boss.modifiers.map(m=>m.name).join(' / ')}`:'';
  this.v83Warning?.({kicker:sector?.kind==='void'?'SYSTEM // ANOMALY WARNING':'SYSTEM // BOSS WARNING',title:profile.name,sub:`${profile.desc}${mods}`,color,countdown:3},()=>this.v9StartBossFight());
};
GP._v8BeginBoss=function(wave,sector){this.v9BeginBoss(wave,sector)};
GP.startSectorBoss=function(){this.v9BeginBoss(this.wave,this.currentSector||this.pickSector?.(this.sectorIndex?.()||0),this._v9ForcedProfileId)};
GP.startBossIntro=GP.startSectorBoss;
GP.v9StartBossFight=function(){
  if(!this.boss||this.dead)return;this.bossState=this.bossState||{};this.bossState.stage='fight';this.bossState.started=true;this.boss.phase=1;
  this.boss.y=Math.max(this.boss.y,this.hgt*.18);if(!this.en.includes(this.boss))this.en.push(this.boss);this.bossPreview=null;this.paused=false;
  const bb=$('#boss');if(bb)bb.classList.add('v9BossHud');R.audio?.play('phase');
  if(this._v9ForcePhase2){this.boss.hp=this.boss.max*.49;this._v9ForcePhase2=false;}
};
GP.startBossFight=GP.v9StartBossFight;
GP.bossUpdate=function(dt){
  const e=this.boss,s=this.bossState;if(!e||!s)return;
  if(s.stage==='approach'){
    const targetY=this.hgt*.18;e.y+=(targetY-e.y)*Math.min(1,dt*.72);this.syncSubsystems(e);return;
  }
  if(s.stage!=='fight')return;
  this.syncSubsystems(e);
  if(e.hp/e.max<=.5&&e.phase===1){
    e.phase=2;s.phaseFlash=1.35;e.cd=Math.min(e.cd,.45);e.flavorCd=Math.min(e.flavorCd,1.2);const bb=$('#boss');if(bb)bb.classList.add('phase2');
    const n=document.createElement('div');n.className='v9PhaseAlert';n.style.setProperty('--phaseColor',e.type.accent||e.type.color);n.innerHTML=`<small>THREAT ESCALATION</small><b>PHASE II</b><span>${e.type.name}</span>`;document.body.append(n);setTimeout(()=>n.classList.add('show'),20);setTimeout(()=>{n.classList.remove('show');setTimeout(()=>n.remove(),450)},1250);R.audio?.play('phase');
  }
  s.phaseFlash=Math.max(0,(s.phaseFlash||0)-dt);
};

// ---------------------------------------------------------------------------
// MOVEMENT / PATTERNS / TELEGRAPHS
// ---------------------------------------------------------------------------
GP.enemyShot=GP.enemyShot||function(e,speed,damage,angleOffset=0,homing=false){const a=Math.atan2(this.cy-e.y,this.cx-e.x)+angleOffset;this.bad.push({x:e.x,y:e.y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,damage,life:6,homing,r:homing?4:2.5})};
GP.fan=GP.fan||function(e,n,spread,speed,damage){for(let i=0;i<n;i++)this.enemyShot(e,speed,damage,(i-(n-1)/2)*spread)};
GP.ring=GP.ring||function(e,n,speed,damage,offset=0){for(let i=0;i<n;i++){const a=i/n*Math.PI*2+offset;this.bad.push({x:e.x,y:e.y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,damage,life:6,r:3})}};
GP.addTele=function(kind,x,y,delay,data={}){this.tele=this.tele||[];this.tele.push({kind,x,y,delay,life:delay,data,done:false})};
GP.v9SpawnBossAdds=function(e,n){
  const sector=this.currentSector,pool=(R.ENEMIES||[]).filter(Boolean);for(let i=0;i<n;i++){const t=this._v8SpawnType?.(sector)||pick(pool);if(!t)continue;const a=this.spawn(t);if(a){a.x=e.x+(i-(n-1)/2)*46;a.y=e.y+35}}
};
GP.v9FactionFlavor=function(e,phase){
  const f=e.type.factionId,damage=8+this.wave*.48;
  if(f==='olydran')this.addTele('lane',this.cx,0,.9,{width:phase===2?62:48,damage:30+this.wave*.65});
  else if(f==='elsari'){if(!e.ionBroken)this.addTele('ion',this.cx,this.cy,.9,{radius:phase===2?82:66,damage:12+this.wave*.25,strip:.42});}
  else if(f==='rakkan'){const n=e.missileBroken?(phase===2?2:1):(phase===2?5:3);for(let i=0;i<n;i++)this.enemyShot(e,150,damage*1.1,(i-(n-1)/2)*.17,true);}
  else if(f==='svarin')this.fan(e,phase===2?7:5,.10,phase===2?285:240,damage*.85);
  else if(f==='ashari'){this.ring(e,phase===2?15:10,135+(phase-1)*35,damage*.88,this.t*.45);}
  else if(f==='nevari'){if(!e.repairBroken)e.hp=Math.min(e.max,e.hp+e.max*(phase===2?.026:.016));if(phase===2&&e.hangarBroken<2)this.v9SpawnBossAdds(e,1);}
  else if(f==='aaruian'){const w=e.targetingBroken?78:46;this.addTele('lane',this.cx,0,.72,{width:w,damage:34+this.wave*.72});}
  else if(e.type.pirate){const r=(e.attackIndex||0)%3;if(r===0)this.fan(e,5,.14,210,damage);else if(r===1)for(let i=0;i<3;i++)this.enemyShot(e,155,damage*1.05,(i-1)*.2,true);else this.addTele('target',this.cx,this.cy,.75,{radius:62,damage:30+this.wave*.6});}
  else if(e.type.void){this.ring(e,phase===2?16:11,120+(phase-1)*28,damage*.82,this.t*.3);if(phase===2)this.addTele('target',this.cx,this.cy,.8,{radius:72,damage:32+this.wave*.7});}
};
GP.bossAI=function(e,dt){
  if(!e||this.bossState?.stage!=='fight')return;this.syncSubsystems(e);e.ion=Math.max(0,(e.ion||0)-dt);e.moveClock=(e.moveClock||0)+dt;
  const phase=e.phase||1,broken=e.engineBroken?.48:1,profile=e.type,center=this.w/2;
  if(profile.move==='hold'){
    const tx=center+Math.sin(this.t*.35)*this.w*.13*broken,ty=this.hgt*.18;e.x+=(tx-e.x)*Math.min(1,dt*.48*broken);e.y+=(ty-e.y)*Math.min(1,dt*.9);
  }else if(profile.move==='hunter'){
    const amp=this.w*(phase===2?.31:.25)*broken,tx=center+Math.sin(this.t*(phase===2?1.05:.72))*amp,ty=this.hgt*(.18+.025*Math.sin(this.t*.8));e.x+=(tx-e.x)*Math.min(1,dt*1.15*broken);e.y+=(ty-e.y)*Math.min(1,dt*1.1);
  }else{
    const amp=this.w*(phase===2?.27:.22)*broken,tx=center+Math.sin(this.t*(phase===2?.82:.55))*amp,ty=this.hgt*.18;e.x+=(tx-e.x)*Math.min(1,dt*.82*broken);e.y+=(ty-e.y)*Math.min(1,dt*1.0);
  }
  e.cd-=dt;e.flavorCd-=dt;
  if(e.modRegen)e.hp=Math.min(e.max,e.hp+e.max*e.modRegen*dt);
  if(e.cd<=0&&!e.ion){
    const brokenWeapons=Math.min(.6,(e.weaponBroken||0)*.2),mult=1-brokenWeapons,rate=e.rateMod*(phase===2?(e.phase2Rate||.76):1)*(e.reactorBroken?1.18:1);
    if(profile.pattern==='broadside'){
      this.fan(e,phase===1?5:8,.14,195+(phase-1)*38,(9+this.wave*.52)*mult);
      if(e.attackIndex%3===2)this.addTele('lane',e.attackIndex%2?this.w*.32:this.w*.68,0,.86,{width:phase===2?66:54,damage:27+this.wave*.66});
    }else if(profile.pattern==='carrier'){
      this.ring(e,phase===1?8:13,145+(phase-1)*30,(7+this.wave*.42)*mult,this.t*.25);
      if((e.hangarBroken||0)<2&&e.attackIndex%2===1)this.v9SpawnBossAdds(e,phase===2?3:2);
    }else{
      this.fan(e,phase===1?3:5,.072,315+(phase-1)*50,(14+this.wave*.62)*mult);
      if(e.attackIndex%3===1)this.addTele('target',this.cx,this.cy,.72,{radius:phase===2?66:54,damage:32+this.wave*.74});
      if(e.attackIndex%4===3)this.addTele('charge',e.x,e.y,.82,{width:phase===2?68:52,damage:38+this.wave*.78});
    }
    e.attackIndex++;e.cd=Math.max(.38,profile.cool*rate);
  }
  if(e.flavorCd<=0){this.v9FactionFlavor(e,phase);e.flavorCd=phase===2?3.0:4.1;}
};
GP.telegraphs=function(dt){
  for(const t of this.tele||[]){t.delay-=dt;t.life-=dt;if(t.delay<=0&&!t.done){t.done=true;
    if(t.kind==='lane'||t.kind==='charge'){if(Math.abs(this.cx-t.x)<t.data.width/2)this.hitShip(t.data.damage,t.x,this.cy);this.fx.push({x:t.x,y:this.hgt/2,r:t.data.width*.5,life:.55,color:'#ff6b7a',line:true});}
    else if(t.kind==='target'){if(Math.hypot(this.cx-t.x,this.cy-t.y)<t.data.radius)this.hitShip(t.data.damage,t.x,t.y);this.fx.push({x:t.x,y:t.y,r:t.data.radius,life:.55,color:'#ff8a6b'});}
    else if(t.kind==='ion'){if(Math.hypot(this.cx-t.x,this.cy-t.y)<t.data.radius){this.shield=Math.max(0,this.shield-this.maxShield*(t.data.strip||.3));this.hitShip(t.data.damage,t.x,t.y)}this.fx.push({x:t.x,y:t.y,r:t.data.radius,life:.6,color:'#9d82ff'});}
  }}this.tele=(this.tele||[]).filter(t=>!t.done||t.life>-.2);
};

// ---------------------------------------------------------------------------
// BOSS HUD
// ---------------------------------------------------------------------------
const oldHud=GP.hud;
GP.hud=function(){oldHud?.call(this);const bb=$('#boss'),e=this.boss;if(!bb)return;if(!e||!this.bossState||this.bossState.stage==='approach'){bb.innerHTML='';bb.classList.remove('v9BossHud','phase2');return;}const hp=clamp(e.hp/Math.max(1,e.max),0,1),sh=e.maxShield?clamp(e.shield/e.maxShield,0,1):0,alive=(e.subsystems||[]).filter(s=>!s.dead).length,total=(e.subsystems||[]).length,mods=e.modifiers?.map(m=>m.name).join(' · ')||'';bb.classList.add('v9BossHud');bb.innerHTML=`<small>${e.type.factionId?.toUpperCase()||'BOSS'}${mods?' · '+mods:''}</small><b>${e.type.name}</b><span>PHASE ${e.phase} · SYSTEMS ${alive}/${total}</span><u><i style="width:${hp*100}%"></i></u>${e.maxShield?`<em><i style="width:${sh*100}%"></i></em>`:''}`;};

// ---------------------------------------------------------------------------
// DRAW: restore boss silhouettes, physical subsystems and telegraphs while
// preserving the current relative-scale model for everything else.
// ---------------------------------------------------------------------------
GP.v9DrawTelegraphs=function(x){for(const t of this.tele||[]){const pulse=.15+.08*Math.sin(this.t*13);x.save();x.globalAlpha=pulse;if(t.kind==='lane'||t.kind==='charge'){x.fillStyle=t.kind==='charge'?'#ff9b62':'#ff596d';x.fillRect(t.x-t.data.width/2,0,t.data.width,this.hgt)}else{x.fillStyle=t.kind==='ion'?'#9d82ff':'#ff7b6e';x.beginPath();x.arc(t.x,t.y,t.data.radius,0,Math.PI*2);x.fill()}x.restore();}};
GP.v9DrawBoss=function(e){
  const x=this.x,sc=this.v9BossScale(e),s=e.size*sc,accent=e.type.accent||e.type.color,fill=e.type.void?'#111318':e.type.pirate?'#62686d':e.type.color;
  x.save();x.translate(e.x,e.y);x.fillStyle=fill;x.strokeStyle=accent;x.lineWidth=e.type.void?3:2;x.beginPath();
  if(e.type.pattern==='carrier'){x.moveTo(0,-s*.82);x.lineTo(s*.42,-s*.58);x.lineTo(s*1.00,-s*.18);x.lineTo(s*.86,s*.66);x.lineTo(s*.34,s*.48);x.lineTo(0,s*.70);x.lineTo(-s*.34,s*.48);x.lineTo(-s*.86,s*.66);x.lineTo(-s*1.00,-s*.18);x.lineTo(-s*.42,-s*.58)}
  else if(e.type.pattern==='reaper'){x.moveTo(0,-s*1.25);x.lineTo(s*.35,-s*.18);x.lineTo(s*.54,s*.72);x.lineTo(0,s*.42);x.lineTo(-s*.54,s*.72);x.lineTo(-s*.35,-s*.18)}
  else{x.moveTo(0,-s*1.02);x.lineTo(s*.55,-s*.56);x.lineTo(s*.96,-s*.04);x.lineTo(s*.72,s*.72);x.lineTo(s*.28,s*.50);x.lineTo(0,s*.67);x.lineTo(-s*.28,s*.50);x.lineTo(-s*.72,s*.72);x.lineTo(-s*.96,-s*.04);x.lineTo(-s*.55,-s*.56)}
  x.closePath();x.fill();x.stroke();
  // faction geometry accents
  x.globalAlpha=.65;x.strokeStyle=accent;x.lineWidth=1.5;
  if(e.type.factionId==='olydran'){for(const k of [-.45,.45]){x.strokeRect(k*s-s*.14,-s*.18,s*.28,s*.52)}}
  else if(e.type.factionId==='elsari'){x.beginPath();x.arc(0,-s*.05,s*.23,0,7);x.stroke();x.beginPath();x.arc(0,-s*.05,s*.36,0,7);x.stroke()}
  else if(e.type.factionId==='rakkan'){for(const k of [-1,1]){x.beginPath();x.moveTo(k*s*.5,s*.15);x.lineTo(k*s*1.08,s*.5);x.stroke()}}
  else if(e.type.factionId==='svarin'){x.beginPath();x.moveTo(-s*.85,-s*.05);x.lineTo(-s*.25,-s*.42);x.moveTo(s*.85,-s*.05);x.lineTo(s*.25,-s*.42);x.stroke()}
  else if(e.type.factionId==='ashari'){x.beginPath();x.moveTo(-s*.4,s*.45);x.lineTo(0,-s*.5);x.lineTo(s*.4,s*.45);x.stroke()}
  else if(e.type.factionId==='nevari'){x.beginPath();x.arc(0,s*.05,s*.4,.15*Math.PI,.85*Math.PI);x.stroke()}
  else if(e.type.factionId==='aaruian'){x.beginPath();x.moveTo(0,-s*.7);x.lineTo(0,s*.55);x.stroke();}
  x.globalAlpha=1;x.restore();
  this.syncSubsystems(e);
  for(const q of e.subsystems||[]){if(q.dead)continue;const r=Math.max(5,6*sc);x.fillStyle=q.type==='shield'?'#62dcff':q.type==='engine'?'#82f6ff':q.type==='repair'?'#72df8c':q.type==='ion'?'#a78bff':q.type==='reactor'?'#ff6b62':'#ffd36b';x.strokeStyle='#061018';x.lineWidth=2;x.beginPath();x.arc(q.x,q.y,r,0,7);x.fill();x.stroke();if(this.priority===q){x.strokeStyle='#fff';x.lineWidth=1.5;x.beginPath();x.arc(q.x,q.y,r+6,0,7);x.stroke()}}
};
GP.draw=function(){
  const x=this.x;x.clearRect(0,0,this.w,this.hgt);x.fillStyle='#02050a';x.fillRect(0,0,this.w,this.hgt);
  for(const s of this.stars||[]){s.y+=s.z*(1.25+this.wave*.005+(this.bossState?-.12:0));if(s.y>this.hgt){s.y=-2;s.x=Math.random()*this.w}x.fillStyle=`rgba(220,242,255,${.13+s.z*.22})`;x.fillRect(s.x,s.y,s.z>1.3?1.5:1,s.z>1.3?3:1)}
  this.v9DrawTelegraphs(x);const worldScale=Math.pow(.9,this.s.hull||0);
  for(const r of this.rocks||[]){const rr=r.r*worldScale;x.save();x.translate(r.x,r.y);x.rotate(r.spin);x.fillStyle=r.rich?'#8a7447':'#55616a';x.strokeStyle=r.rich?'#e6c56b':'#8997a0';x.beginPath();for(let k=0;k<7;k++){const a=k/7*Math.PI*2,q=rr*(.75+((k*13)%7)/20);k?x.lineTo(Math.cos(a)*q,Math.sin(a)*q):x.moveTo(Math.cos(a)*q,Math.sin(a)*q)}x.closePath();x.fill();x.stroke();x.restore()}
  if(this.bossState&&this.boss&&!this.en.includes(this.boss))this.v9DrawBoss(this.boss);
  for(const e of this.en||[]){if(e.boss){this.v9DrawBoss(e);continue}const sc=this.classScale?this.classScale(this.entityClass(e)):1,sz=e.size*sc;x.save();x.translate(e.x,e.y);x.rotate(Math.atan2(this.cy-e.y,this.cx-e.x)+Math.PI/2);x.fillStyle=e.type?.void?'#2d3036':e.type?.pirate?'#70777c':e.type.color;x.strokeStyle=e.type?.accent||e.type?.sectorColor||e.type.color;x.lineWidth=e.type?.void?3:1;x.beginPath();if(e.type?.void){x.moveTo(0,-sz);x.lineTo(sz*.8,-sz*.1);x.lineTo(sz*.25,sz*.9);x.lineTo(-sz*.7,sz*.45);x.lineTo(-sz*.45,-sz*.4)}else{x.moveTo(0,-sz);x.lineTo(sz*.62,sz*.72);x.lineTo(0,sz*.42);x.lineTo(-sz*.62,sz*.72)}x.closePath();x.fill();x.stroke();x.restore();}
  for(const u of this.droneUnits||[]){const c=R.droneColor?.(u.def)||'#72dfff';x.fillStyle=c;x.beginPath();x.arc(u.x,u.y,4.5*worldScale,0,7);x.fill()}
  for(const u of this.supportUnits||[]){const sc=Math.max(.5,worldScale);x.strokeStyle='#d6e6ef';x.lineWidth=1.5;x.beginPath();x.moveTo(u.x,u.y-8*sc);x.lineTo(u.x+7*sc,u.y+7*sc);x.lineTo(u.x-7*sc,u.y+7*sc);x.closePath();x.stroke()}
  for(const p of this.shots||[]){x.strokeStyle=p.color;x.lineWidth=p.family==='beam'?3:1.5;x.beginPath();x.moveTo(p.x,p.y);x.lineTo(p.x-p.vx*.018,p.y-p.vy*.018);x.stroke()}
  for(const p of this.bad||[]){x.fillStyle=p.homing?'#ff9b62':'#ff7282';x.beginPath();x.arc(p.x,p.y,(p.r||2.4)*worldScale,0,7);x.fill()}
  for(const f of this.fx||[]){x.globalAlpha=clamp(f.life*2,0,1);x.strokeStyle=f.color;x.lineWidth=2;if(f.line){x.beginPath();x.moveTo(f.x,0);x.lineTo(f.x,this.hgt);x.stroke()}else{x.beginPath();x.arc(f.x,f.y,f.r*(1+(1-f.life)*1.8)*worldScale,0,7);x.stroke()}}x.globalAlpha=1;
  R.drawShip?.(x,this.cx,this.cy,1.06,this.s.weaponMounts||this.s.weapons||[],this.s.hull,false,{shield:this.shield>0,shieldPulse:this.shield>0?this.shieldPulse:0,hit:this.hitPulse>0,hp:this.hp/this.maxHp,weaponTargets:this.weaponTargets});
  if(this.bossState?.phaseFlash>0){x.fillStyle=`rgba(255,95,112,${Math.min(.16,this.bossState.phaseFlash*.1)})`;x.fillRect(0,0,this.w,this.hgt)}
};

// ---------------------------------------------------------------------------
// DEV BOSS LAB: hidden unless ?dev=1 is present.
// ---------------------------------------------------------------------------
AP.v9OpenBossLab=function(){
  if($('#v9BossLab'))return;const base=this.s||R.getSlot?.(R.loadAll?.().last||1);if(!base)return this.deny?.('LOAD A SAVE FIRST');
  const o=document.createElement('div');o.id='v9BossLab';o.className='v9BossLab';const factions=(R.SECTOR_FACTIONS||[]).map(f=>`<option value="${f.id}">${f.name}</option>`).join('');const hulls=(R.HULLS||[]).map((h,i)=>`<option value="${i}">${h.name}</option>`).join('');o.innerHTML=`<div class="v9BossLabCard"><header><span><small>DEVELOPER TOOL</small><h2>BOSS LAB</h2></span><button data-close>×</button></header><label>FACTION<select data-faction>${factions}<option value="pirates">PIRATES</option><option value="void">VOID</option></select></label><label>ARCHETYPE<select data-arch><option value="broadside">DREADNOUGHT</option><option value="carrier">CARRIER PRIME</option><option value="reaper">REAPER</option></select></label><label>WAVE<input data-wave type="number" min="10" step="10" value="10"></label><label>PLAYER HULL<select data-hull>${hulls}</select></label><label class="v9Check"><input data-p2 type="checkbox"> START NEAR PHASE II</label><button class="btn primary" data-launch>LAUNCH BOSS</button></div>`;document.body.append(o);o.querySelector('[data-close]').onclick=()=>o.remove();o.querySelector('[data-hull]').value=String(base.hull||0);o.querySelector('[data-launch]').onclick=()=>{const fid=o.querySelector('[data-faction]').value,arch=o.querySelector('[data-arch]').value,wave=Math.max(10,Math.round((+o.querySelector('[data-wave]').value||10)/10)*10),hull=+o.querySelector('[data-hull]').value||0,p2=o.querySelector('[data-p2]').checked;let sector;if(fid==='void')sector={kind:'void',id:'void',name:'VOID',color:'#34363b',accent:'#9d82ff'};else if(fid==='pirates')sector={kind:'pirate',id:'pirates',name:'PIRATES',color:'#747b80',accent:'#ff9d42'};else sector={...(R.SECTOR_FACTIONS||[]).find(f=>f.id===fid),kind:'base'};const save=R.migrate(clone(base));save.hull=hull;o.remove();const g=new R.Game(this,save);R.game=g;g.wave=wave;g.currentSector=sector;g._v9ForcedProfileId=arch;g._v9ForcePhase2=p2;g.v9BeginBoss(wave,sector,arch);};
};
const priorMain=AP.main;
if(priorMain)AP.main=function(...args){const out=priorMain.apply(this,args);requestAnimationFrame(()=>{document.querySelectorAll('.v9BossLabButton').forEach(n=>n.remove());if(new URLSearchParams(location.search).get('dev')==='1'){const b=document.createElement('button');b.className='v9BossLabButton';b.textContent='⚙ BOSS LAB';b.onclick=()=>this.v9OpenBossLab();document.body.append(b)}});return out;};

})();
