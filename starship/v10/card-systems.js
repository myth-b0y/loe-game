(()=>{
'use strict';
const R=window.SR,V=R?.V10;if(!R?.Game||!V)throw new Error('V10 systems require card engine');
const GP=R.Game.prototype,clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
const now=()=>performance.now()/1000;
const activeEvo=(g,id)=>V.evoOn(g,id);
const r=(g,id)=>V.rank(g,id);
const s=(g,id,key)=>V.stat(g,id,key);
const nearest=(g,x,y,max=1e9)=>{let best=null,d=max;for(const e of g.en||[]){if(!e||e.dead)continue;const q=Math.hypot((e.x||0)-x,(e.y||0)-y);if(q<d){d=q;best=e}}return best};
const damageRadius=(g,x,y,rad,dmg,knock=0)=>{for(const e of g.en||[]){if(!e||e.dead)continue;const dx=(e.x||0)-x,dy=(e.y||0)-y,d=Math.hypot(dx,dy);if(d>rad)continue;const fall=1-.3*(d/Math.max(1,rad));g.damageTarget?.(e,dmg*fall);if(knock&&!e.boss){const k=knock*(1-d/Math.max(1,rad));e.x+=dx/(d||1)*k;e.y+=dy/(d||1)*k}}};
const shot=(g,x,y,target,damage,opt={})=>{if(!target)return null;const a=Math.atan2(target.y-y,target.x-x),sp=opt.speed||520,p={x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,damage,life:opt.life||1.7,target,homing:!!opt.homing,aoe:opt.aoe||0,ion:!!opt.ion,chain:opt.chain||0,pierce:opt.pierce||0,color:opt.color||'#eaf8ff',family:opt.family||'v110',_v110Generation:opt.generation||0};(g.shots||(g.shots=[])).push(p);return p};
const fx=(g,kind,x,y,data={})=>g.v984Fx?.(kind,x,y,{life:data.life||.4,color:data.color||'#9eefff',...data});

V.ensureTransient=g=>{g._v110Fields=g._v110Fields||[];g._v110Clocks=g._v110Clocks||{};g._v110Charge=g._v110Charge||{};g._v110Aegis=g._v110Aegis||new Map();return g};
V.addField=(g,f)=>{V.ensureTransient(g);g._v110Fields.push({life:f.life,max:f.life,tick:0,...f});if(g._v110Fields.length>18)g._v110Fields.splice(0,g._v110Fields.length-18)};

function patchWeaponDefs(g){
 const backups=[];for(const w of R.WEAPONS||[]){backups.push([w,{...w}]);
  if(w.family==='autocannon'){
   if(activeEvo(g,'packfire')){w.chain=6;w.damage*=1.25}
   else if(r(g,'ricochet'))w.chain=s(g,'ricochet','bounces');
   if(activeEvo(g,'synchronizedSalvo')){w.burst=10;w.rate*=1.25}
   else if(r(g,'burst')){w.burst=s(g,'burst','rounds');w.rate*=Math.max(.72,1/(s(g,'burst','recovery')+.55))}
   if(activeEvo(g,'bulletHive')){w.scatter=10;w.damage*=.32;w.homing=true}
   else if(r(g,'scatter')){w.scatter=s(g,'scatter','shots');w.damage*=s(g,'scatter','damage')}
  }
  if(w.family==='railgun'){
   if(activeEvo(g,'ironSpine'))w.pierce=12;else if(r(g,'penetrator'))w.pierce=(w.pierce||0)+s(g,'penetrator','pierce');
   if(activeEvo(g,'singularityDriver')){w.rate*=.72}
   else if(r(g,'capacitorShot')){w.damage*=s(g,'capacitorShot','damage');w.rate=1/Math.max(.2,s(g,'capacitorShot','charge'))}
   if(activeEvo(g,'shrapnelCrown')){w.scatter=12;w.damage*=.30}
   else if(r(g,'shattershot')){w.scatter=s(g,'shattershot','fragments');w.damage*=s(g,'shattershot','damage')}
  }
  if(w.family==='plasma'){
   if(activeEvo(g,'starbreaker')){w.damage*=4.5;w.aoe=(w.aoe||60)*2.1;w.rate/=1.10}
   else if(r(g,'overcharge')){w.damage*=s(g,'overcharge','damage');w.rate/=s(g,'overcharge','cycle');w.aoe=(w.aoe||60)*s(g,'overcharge','radius')}
   if(activeEvo(g,'meteorBroadside')){w.scatter=9;w.damage*=.34}
   else if(r(g,'clusterCore')){w.scatter=s(g,'clusterCore','fragments');w.damage*=s(g,'clusterCore','damage')}
  }
  if(w.family==='ion'){
   if(activeEvo(g,'stormNet'))w.chain=9;else if(r(g,'chainArc'))w.chain=(w.chain||0)+s(g,'chainArc','jumps');
  }
  if(w.family==='missile'){
   if(activeEvo(g,'eventHorizonTorpedo')){w.damage*=5.5;w.rate*=.60;w.aoe=(w.aoe||60)*2.3;w.slow=true;w.homing=true}
   else if(r(g,'torpedoRack')){w.damage*=s(g,'torpedoRack','damage');w.rate*=s(g,'torpedoRack','rate');w.aoe=(w.aoe||60)*s(g,'torpedoRack','radius');w.slow=true;w.homing=true}
   if(activeEvo(g,'hunterConstellation')){w.burst=12;w.damage*=.34;w.homing=true}
   else if(r(g,'swarmRack')){w.burst=s(g,'swarmRack','count');w.damage*=s(g,'swarmRack','damage');w.homing=true}
   if(activeEvo(g,'novaBloom')){w.scatter=10;w.damage*=.35}
   else if(r(g,'clusterRack')){w.scatter=s(g,'clusterRack','count');w.damage*=s(g,'clusterRack','damage')}
  }
 }
 return()=>{for(const [w,b] of backups){for(const k of Object.keys(w))if(!(k in b))delete w[k];Object.assign(w,b)}};
}

function ensureArmor(g){
 V.ensureTransient(g);
 const rr=r(g,'ablative'),iron=activeEvo(g,'ironSpine');if(!rr&&!iron){g._v110Armor=null;return null}
 const count=iron?5:s(g,'ablative','plates'),frac=iron?.10:s(g,'ablative','hp');
 if(!g._v110Armor||g._v110Armor.max!==count){g._v110Armor={max:count,plates:Array.from({length:count},()=>g.maxHp*frac),frac,rebuild:0}}
 return g._v110Armor;
}
const armorCount=a=>a?a.plates.filter(v=>v>0).length:0;

function patchAllyDefs(g){
 const backups=[];for(const d of R.DRONES||[]){backups.push([d,{...d}]);if(d.role==='offense'){
   if(activeEvo(g,'packfire')){d.damage=(d.damage||8)*1.8;d.rate=(d.rate||1)*1.9}
   else if(r(g,'hunter')){d.damage=(d.damage||8)*(1+s(g,'hunter','killDamage')*((g._v110HunterBuff||0)>0?1:.45));d.rate=(d.rate||1)*(1+s(g,'hunter','move')*.55)}
   if(activeEvo(g,'bulletHive')){d.damage=(d.damage||8)*6*.40;d.rate=(d.rate||1)*1.25}
   else if(r(g,'swarmDrones')){d.damage=(d.damage||8)*s(g,'swarmDrones','count')*s(g,'swarmDrones','damage');d.rate=(d.rate||1)*s(g,'swarmDrones','rate')}
  }else{
   if(activeEvo(g,'mirrorstorm'))d.pd=Math.max(d.pd||0,.30);else if(r(g,'countermeasure'))d.pd=Math.max(d.pd||0,.06+s(g,'countermeasure','reliability')*.16);
   if(activeEvo(g,'phoenixMesh'))d.repair=Math.max(d.repair||0,g.maxHp*.011/3*V.repairMultiplier(g));else if(r(g,'repairDrones'))d.repair=Math.max(d.repair||0,g.maxHp*s(g,'repairDrones','repair')/Math.max(.5,s(g,'repairDrones','pulse'))*V.repairMultiplier(g));
  }}
 for(const d of R.SUPPORTS||[]){backups.push([d,{...d}]);if(V.OFF_SUPPORT_IDS.has(d.id)){
   if(activeEvo(g,'meteorBroadside')){d.rate=(d.rate||1)*1.9;d.damage=(d.damage||10)*1.4}
   else if(r(g,'gunshipWing')){d.rate=(d.rate||1)*(1+s(g,'gunshipWing','rate'));d.damage=(d.damage||10)*(1+s(g,'gunshipWing','damage'))}
   if(activeEvo(g,'starbreaker'))d.damage=(d.damage||10)*2.25;
  }
  if(d.repair)d.repair*=V.repairMultiplier(g);
 }
 return()=>{for(const [d,b] of backups){for(const k of Object.keys(d))if(!(k in b))delete d[k];Object.assign(d,b)}};
}

const oldWeapons=GP.weapons;
if(oldWeapons)GP.weapons=function(dt){V.ensureTransient(this);V.recomputeCore(this);const restore=patchWeaponDefs(this),before=(this.shots||[]).length;let out;try{out=oldWeapons.call(this,dt)}finally{restore()}
 const fresh=(this.shots||[]).slice(before);V.postWeaponFire(this,fresh);return out};

V.postWeaponFire=(g,fresh)=>{
 if(!fresh.length)return;const t=now();
 for(const p of fresh){p._v110Track=p._v110Track||Math.random().toString(36).slice(2);if(!p.family&&p.ion)p.family='ion';if(activeEvo(g,'eventHorizonTorpedo')&&p.family==='missile')p._v110EventHorizon=true}
 const auto=fresh.filter(p=>p.family==='autocannon');if(auto.length&&activeEvo(g,'synchronizedSalvo')&&t>(g._v110Clocks.salvo||0)){g._v110Clocks.salvo=t+.34;for(const u of g.droneUnits||[]){if(u.def?.role==='defense')continue;const target=nearest(g,u.x,u.y,700);if(!target)continue;for(let i=0;i<6;i++)shot(g,u.x,u.y,target,(u.def?.damage||8)*1.25,{speed:500+i*8,family:'drone',color:'#ffd28b'})}}
 const rail=fresh.filter(p=>p.family==='railgun');for(const p of rail){
   const armor=ensureArmor(g);if(activeEvo(g,'ironSpine')&&armor&&armorCount(armor)>0){const i=armor.plates.findIndex(v=>v>0);if(i>=0){armor.plates[i]=0;armor.rebuild=8;p.damage*=2.25;p.pierce=Math.max(p.pierce||0,12);p.r=(p.r||2)*1.5;fx(g,'muzzle',p.x,p.y,{life:.3,color:'#f5fbff'})}}
   if(activeEvo(g,'singularityDriver')&&(g._v110Charge.singularity||0)>=5){p.damage*=6;p.pierce=Math.max(p.pierce||0,14);p.r=(p.r||2)*2;g._v110Charge.singularity=0;g._v110Charge.recovery=1;fx(g,'muzzle',p.x,p.y,{life:.65,color:'#ffffff'})}
   else if(r(g,'capacitorBank')&&(g._v110Charge.bank||0)>=s(g,'capacitorBank','charge')){p.damage*=1+s(g,'capacitorBank','damage');g._v110Charge.bank=0}
   if(activeEvo(g,'shrapnelCrown')&&(g._v110Crown||0)>0){const n=g._v110Crown;g._v110Crown=0;const target=nearest(g,p.x,p.y,1200);if(target)for(let i=0;i<n;i++)shot(g,p.x,p.y,target,p.damage*.22,{speed:620+i*3,pierce:2,family:'crown',color:'#f4e7ff'})}
 }
};

const oldAllies=GP.allies;
if(oldAllies)GP.allies=function(dt){V.ensureTransient(this);const restore=patchAllyDefs(this);let out;try{out=oldAllies.call(this,dt)}finally{restore()}V.postAllies(this,dt);return out};

V.postAllies=(g,dt)=>{
 g._v110HunterBuff=Math.max(0,(g._v110HunterBuff||0)-dt);
 // Strike Drone regular volleys.
 if(r(g,'strike')&&!activeEvo(g,'synchronizedSalvo')){g._v110Clocks.strike=(g._v110Clocks.strike||0)-dt;if(g._v110Clocks.strike<=0){g._v110Clocks.strike=s(g,'strike','interval');for(const u of g.droneUnits||[]){if(u.def?.role==='defense')continue;const target=nearest(g,u.x,u.y,700);if(!target)continue;for(let i=0;i<s(g,'strike','shots');i++)shot(g,u.x,u.y,target,(u.def?.damage||8)*s(g,'strike','damage'),{speed:490+i*9,family:'drone',color:'#ffd29a'})}}}
 // Bomber Wing uses real offensive supports as emission points.
 if(r(g,'bomberWing')||activeEvo(g,'sunscar')){g._v110Clocks.bomber=(g._v110Clocks.bomber||0)-dt;if(g._v110Clocks.bomber<=0){g._v110Clocks.bomber=activeEvo(g,'sunscar')?4:s(g,'bomberWing','interval');for(const u of g.supportUnits||[]){if(!V.OFF_SUPPORT_IDS.has(u.def?.id))continue;const target=nearest(g,u.x,u.y,850);if(!target)continue;const n=activeEvo(g,'sunscar')?6:s(g,'bomberWing','bombs'),mul=activeEvo(g,'sunscar')?.90:s(g,'bomberWing','damage');for(let i=0;i<n;i++)shot(g,u.x,u.y,target,(u.def?.damage||20)*mul,{speed:360+i*5,aoe:45,family:'supportBomb',color:'#ff9a75'});if(activeEvo(g,'sunscar'))V.addField(g,{kind:'lane',x:u.x,y:u.y,r:72,life:6,damage:(V.weaponByFamily('plasma')?.damage||62)*.30})}}}
 // EW Frigate / Dead Zone.
 if(r(g,'ewFrigate')||activeEvo(g,'deadZone')){g._v110Clocks.ew=(g._v110Clocks.ew||0)-dt;if(g._v110Clocks.ew<=0){g._v110Clocks.ew=activeEvo(g,'deadZone')?9:s(g,'ewFrigate','interval');const dur=activeEvo(g,'deadZone')?6:s(g,'ewFrigate','duration');g._v110EW=dur;fx(g,'field',g.cx,g.cy,{life:.7,color:'#9b8cff'})}}
 // Shield Tender / Thunderhead.
 if(r(g,'shieldTender')||activeEvo(g,'thunderhead')){g._v110Clocks.tender=(g._v110Clocks.tender||0)-dt;if(g._v110Clocks.tender<=0){const frac=activeEvo(g,'thunderhead')?.32:s(g,'shieldTender','shield'),dur=activeEvo(g,'thunderhead')?6.5:s(g,'shieldTender','duration');g._v110Clocks.tender=activeEvo(g,'thunderhead')?6:s(g,'shieldTender','cooldown');g._v110Overshield=Math.max(g._v110Overshield||0,g.maxShield*frac);g._v110OvershieldMax=g.maxShield*(activeEvo(g,'thunderhead')?.40:.35);g._v110Overshield=Math.min(g._v110Overshield,g._v110OvershieldMax);g._v110OvershieldLife=dur;fx(g,'shieldLink',g.cx,g.cy,{life:.5,tx:g.cx,ty:g.cy-34,color:'#92eaff'})}}
};

const oldFriendly=GP.v984FireFriendly;
if(oldFriendly)GP.v984FireFriendly=function(target,u,def,kind='support'){
 const before=(this.shots||[]).length,copy={...def};
 if(kind==='support'&&V.OFF_SUPPORT_IDS.has(def?.id)&&(r(this,'siegeWing')||activeEvo(this,'starbreaker'))){const boss=!!(target?.boss||target?.parentBoss),mul=activeEvo(this,'starbreaker')?2.25:s(this,'siegeWing','heavy')*(boss?1+s(this,'siegeWing','boss'):1);copy.damage=(copy.damage||10)*mul}
 if(kind==='support'&&V.DEF_SUPPORT_IDS.has(def?.id)&&r(this,'interceptorEscort'))copy.damage=(copy.damage||10)*(1+s(this,'interceptorEscort','damage'));
 const out=oldFriendly.call(this,target,u,copy,kind);for(const p of (this.shots||[]).slice(before))p._v110Track=p._v110Track||Math.random().toString(36).slice(2);return out;
};

const reflectable=(g,p)=>p&&p.life>0&&!p.super&&!p.unreflectable&&(Number(p.damage)||0)<Math.max(45,(g.maxShield||100)*.22);
const redirect=(g,p,mul,x=p.x,y=p.y)=>{const target=nearest(g,x,y,1200);if(!target)return false;p.life=0;shot(g,x,y,target,(p.damage||1)*mul,{speed:Math.max(420,Math.hypot(p.vx||0,p.vy||0)*1.1),homing:true,life:2,family:'reflect',color:'#d8f7ff'});return true};
V.preHostileProjectiles=g=>{
 V.ensureTransient(g);const q=g.v97ShipContact?.(true)||{rx:68,ry:82};
 // Countermeasure and Aegis drones intercept before the projectile reaches the ship.
 for(const u of g.droneUnits||[]){if(u.def?.role!=='defense')continue;u._v110CounterCd=Math.max(0,(u._v110CounterCd||0)-1/60);const aegis=r(g,'aegis')||activeEvo(g,'citadelHalo');if(aegis){const max=(activeEvo(g,'citadelHalo')?.20:s(g,'aegis','hp'))*g.maxShield,rec=activeEvo(g,'citadelHalo')?4.5:s(g,'aegis','rebuild');let st=g._v110Aegis.get(u);if(!st){st={hp:max,max,rebuild:0};g._v110Aegis.set(u,st)}st.max=max;if(st.hp<=0){st.rebuild-=1/60;if(st.rebuild<=0)st.hp=max}for(const p of g.bad||[]){if(!reflectable(g,p)||st.hp<=0)continue;if(Math.hypot(p.x-u.x,p.y-u.y)<18){const take=Math.min(st.hp,p.damage||1);st.hp-=take;p.life=0;if(st.hp<=0)st.rebuild=rec;fx(g,'intercept',p.x,p.y,{life:.22,color:'#8beeff'});break}}}
  const cm=r(g,'countermeasure')||activeEvo(g,'mirrorstorm');if(cm&&u._v110CounterCd<=0){const rad=92*(1+(activeEvo(g,'mirrorstorm')?.40:s(g,'countermeasure','radius'))),p=(g.bad||[]).find(p=>reflectable(g,p)&&Math.hypot(p.x-u.x,p.y-u.y)<rad);if(p){if(activeEvo(g,'mirrorstorm'))redirect(g,p,1.75,u.x,u.y);else p.life=0;u._v110CounterCd=activeEvo(g,'mirrorstorm')?.55:s(g,'countermeasure','cooldown');fx(g,'intercept',p.x,p.y,{life:.25,color:activeEvo(g,'mirrorstorm')?'#f5b9ff':'#9df3ff'})}}
 }
 // Reflector Field / Mirrorstorm shield reflection.
 if(g.shield>0&&(r(g,'reflector')||activeEvo(g,'mirrorstorm'))){const chance=activeEvo(g,'mirrorstorm')?.50:s(g,'reflector','chance'),mul=activeEvo(g,'mirrorstorm')?1.50:s(g,'reflector','returnDamage');for(const p of g.bad||[]){if(!reflectable(g,p)||Math.random()>chance)continue;const nx=(p.x-g.cx)/Math.max(1,q.rx*1.1),ny=(p.y-g.cy)/Math.max(1,q.ry*1.1);if(nx*nx+ny*ny<=1.15&&redirect(g,p,mul,p.x,p.y))fx(g,'shieldHit',p.x,p.y,{life:.25,color:'#e7c8ff'})}}
};

const oldProjectiles=GP.projectiles;
if(oldProjectiles)GP.projectiles=function(dt){V.preHostileProjectiles(this);const before=(this.shots||[]).map(p=>({p,x:p.x,y:p.y,life:p.life,family:p.family,damage:p.damage,aoe:p.aoe}));const out=oldProjectiles.call(this,dt);const alive=new Set(this.shots||[]);for(const z of before)if(z.life>0&&!alive.has(z.p)&&z.x>-40&&z.x<this.w+40&&z.y>-40&&z.y<this.hgt+40)V.onFriendlyImpact(this,z);return out};

V.onFriendlyImpact=(g,z)=>{
 const family=z.family;if(family==='plasma'){
   if(r(g,'scorch')||activeEvo(g,'sunscar')){const dur=activeEvo(g,'sunscar')?7:s(g,'scorch','duration'),dps=(V.weaponByFamily('plasma')?.damage||62)*(activeEvo(g,'sunscar')?.35:s(g,'scorch','dps')),rad=(z.aoe||78)*(activeEvo(g,'sunscar')?1.3:s(g,'scorch','radius'));V.addField(g,{kind:'scorch',x:z.x,y:z.y,r:rad,life:dur,damage:dps});if(activeEvo(g,'sunscar')){const lane=(g._v110Fields||[]).find(f=>f.kind==='lane'&&Math.hypot(f.x-z.x,f.y-z.y)<f.r+rad);if(lane){damageRadius(g,z.x,z.y,rad*1.4,(V.weaponByFamily('plasma')?.damage||62)*1.6);fx(g,'boom',z.x,z.y,{life:.65,color:'#ff7bdc'})}}}
   if(r(g,'clusterCore')&&!activeEvo(g,'meteorBroadside')){const n=s(g,'clusterCore','fragments'),d=(V.weaponByFamily('plasma')?.damage||62)*s(g,'clusterCore','damage');for(let i=0;i<n;i++){const a=i/n*Math.PI*2,t=nearest(g,z.x+Math.cos(a)*30,z.y+Math.sin(a)*30,500);if(t)shot(g,z.x,z.y,t,d,{speed:360+i*6,aoe:(z.aoe||78)*s(g,'clusterCore','radius'),family:'plasmaFrag',color:'#ff8be0'})}}
   if(activeEvo(g,'meteorBroadside')){const t=now();if(t>(g._v110Clocks.meteor||0)){g._v110Clocks.meteor=t+1.5;for(const u of g.supportUnits||[]){if(!V.OFF_SUPPORT_IDS.has(u.def?.id))continue;for(let i=0;i<2;i++){const target={x:z.x+(i?18:-18),y:z.y};shot(g,u.x,u.y,target,(u.def?.damage||20)*.70,{speed:560,aoe:42,family:'meteor',color:'#ff93d7'})}}}}
 }
 if(family==='ion'){
   const e=nearest(g,z.x,z.y,90);if(e){if(r(g,'blackout')||activeEvo(g,'deadZone')){e._v110Blackout=Math.max(e._v110Blackout||0,activeEvo(g,'deadZone')?1.2:s(g,'blackout','duration'))}
   if(r(g,'staticCharge')||activeEvo(g,'thunderhead')){const need=r(g,'staticCharge')?s(g,'staticCharge','stacks'):4;e._v110Static=(e._v110Static||0)+1;e._v110StaticLife=r(g,'staticCharge')?s(g,'staticCharge','life'):6;if(e._v110Static>=need){e._v110Static=0;const dmg=(V.weaponByFamily('ion')?.damage||20)*(r(g,'staticCharge')?s(g,'staticCharge','damage'):2.3);g.damageTarget?.(e,dmg);let cur=e;for(let i=0;i<(r(g,'staticCharge')?s(g,'staticCharge','chains'):4);i++){const n=(g.en||[]).filter(x=>x!==cur&&!x.dead).sort((a,b)=>Math.hypot(a.x-cur.x,a.y-cur.y)-Math.hypot(b.x-cur.x,b.y-cur.y))[0];if(!n)break;g.damageTarget?.(n,dmg*.72);cur=n}fx(g,'intercept',e.x,e.y,{life:.5,color:'#9aa9ff'})}}}
 }
 if(family==='missile'&&activeEvo(g,'novaBloom')){damageRadius(g,z.x,z.y,(z.aoe||60)*2,(V.weaponByFamily('missile')?.damage||50)*1.8,36);fx(g,'boom',z.x,z.y,{life:.65,color:'#ffe4ff'})}
};

const oldHit=GP.hitShip;
if(oldHit)GP.hitShip=function(d,x=this.cx,y=this.cy){V.ensureTransient(this);let damage=Math.max(0,Number(d)||0),absorbed=0;
 if((this._v110Overshield||0)>0){const take=Math.min(this._v110Overshield,damage);this._v110Overshield-=take;damage-=take;absorbed+=take;if(activeEvo(this,'thunderhead'))this._v110ThunderStore=Math.min((this._v110ThunderStore||0)+take*.35,this.maxShield*.40)}
 if(damage>0&&this.shield<=0){const a=ensureArmor(this);if(a){for(let i=0;i<a.plates.length&&damage>0;i++){if(a.plates[i]<=0)continue;const take=Math.min(a.plates[i],damage);a.plates[i]-=take;damage-=take;if(a.plates[i]<=0)a.rebuild=activeEvo(this,'ironSpine')?8:999}}
  const react=r(this,'reactive')||activeEvo(this,'shrapnelCrown');if(react&&(this._v110ReactiveCd||0)<=0){const mult=activeEvo(this,'shrapnelCrown')?1.10:s(this,'reactive','damage'),rad=(activeEvo(this,'shrapnelCrown')?1.45:s(this,'reactive','radius'))*80;damageRadius(this,this.cx,this.cy,rad,Math.max(1,damage)*mult);this._v110ReactiveCd=activeEvo(this,'shrapnelCrown')?.8:s(this,'reactive','cooldown');if(activeEvo(this,'shrapnelCrown'))this._v110Crown=Math.min(18,(this._v110Crown||0)+3);fx(this,'boom',this.cx,this.cy,{life:.35,color:'#ffd1bd'})}}
 const out=damage>0?oldHit.call(this,damage,x,y):undefined;this._v110NoHullDamage=damage>0&&this.shield<=0?0:(this._v110NoHullDamage||0);if(absorbed>0)fx(this,'shieldHit',x,y,{life:.25,color:'#9aeaff'});return out};

const oldEnemyDie=GP.enemyDie;
if(oldEnemyDie)GP.enemyDie=function(e){const x=e?.x||0,y=e?.y||0,boss=!!e?.boss,out=oldEnemyDie.call(this,e);if(!boss){if(r(this,'hunter')||activeEvo(this,'packfire'))this._v110HunterBuff=2;if(activeEvo(this,'packfire')){for(let i=0;i<2;i++){const t=nearest(this,x,y,900);if(t)shot(this,x,y,t,(V.weaponByFamily('autocannon')?.damage||10)*.70,{speed:590+i*18,chain:2,family:'packfire',color:'#ffd493',generation:1})}}}return out};

function updateFields(g,dt){
 V.ensureTransient(g);for(const f of g._v110Fields){f.life-=dt;f.tick=(f.tick||0)-dt;if(f.tick<=0){f.tick=.5;if(f.kind==='scorch'||f.kind==='lane')damageRadius(g,f.x,f.y,f.r,(f.damage||0)*.5)}}g._v110Fields=g._v110Fields.filter(f=>f.life>0);
}
function updateTacticalPaths(g,dt){
 if(r(g,'targetPainter')||activeEvo(g,'hunterConstellation')){g._v110Clocks.paint=(g._v110Clocks.paint||0)-dt;if(g._v110Clocks.paint<=0){const n=activeEvo(g,'hunterConstellation')?6:s(g,'targetPainter','targets'),dur=activeEvo(g,'hunterConstellation')?8:s(g,'targetPainter','duration');g._v110Clocks.paint=activeEvo(g,'hunterConstellation')?5:s(g,'targetPainter','cooldown');const list=(g.en||[]).filter(e=>!e.dead).sort((a,b)=>(b.boss?1:0)-(a.boss?1:0)||(b.max||b.hp||0)-(a.max||a.hp||0)).slice(0,n);for(const e of list)e._v110Paint=dur}}
 if(r(g,'gravityWell')&&!activeEvo(g,'eventHorizonTorpedo')){g._v110Clocks.gravity=(g._v110Clocks.gravity||0)-dt;if(g._v110Clocks.gravity<=0){g._v110Clocks.gravity=s(g,'gravityWell','cooldown');const target=nearest(g,g.cx,g.cy-170,1200),x=target?.x??g.cx,y=target?.y??g.cy-180;V.addField(g,{kind:'gravity',x,y,r:120*s(g,'gravityWell','radius'),life:s(g,'gravityWell','duration'),pull:s(g,'gravityWell','pull')});fx(g,'field',x,y,{life:.7,color:'#8e7cff'})}}
 if(r(g,'novaPulse')&&!activeEvo(g,'novaBloom')){g._v110Clocks.nova=(g._v110Clocks.nova||0)-dt;if(g._v110Clocks.nova<=0){g._v110Clocks.nova=s(g,'novaPulse','cooldown');damageRadius(g,g.cx,g.cy,145*s(g,'novaPulse','radius'),22*s(g,'novaPulse','damage'),32*s(g,'novaPulse','knock'));fx(g,'boom',g.cx,g.cy,{life:.55,color:'#f3c9ff'})}}
 for(const f of g._v110Fields||[])if(f.kind==='gravity'){for(const e of g.en||[]){if(!e||e.dead)continue;const dx=f.x-e.x,dy=f.y-e.y,d=Math.hypot(dx,dy);if(d>f.r)continue;const k=(e.boss?.12:1)*(f.pull||1)*42*dt*(1-d/f.r);e.x+=dx/(d||1)*k;e.y+=dy/(d||1)*k}}
}
function updateEvolutions(g,dt){
 if(activeEvo(g,'stormNet')){g._v110Clocks.storm=(g._v110Clocks.storm||0)-dt;if(g._v110Clocks.storm<=0){g._v110Clocks.storm=.7;for(const e of g.en||[]){if(e.dead)continue;const near=(g.supportUnits||[]).some(u=>V.DEF_SUPPORT_IDS.has(u.def?.id)&&Math.hypot(e.x-u.x,e.y-u.y)<185);if(near)g.damageTarget?.(e,(V.weaponByFamily('ion')?.damage||20)*.35)}}}
 if(activeEvo(g,'eventHorizonTorpedo'))for(const p of g.shots||[]){if(!p._v110EventHorizon)continue;for(const e of g.en||[]){const dx=p.x-e.x,dy=p.y-e.y,d=Math.hypot(dx,dy),rad=190;if(d<rad&&!e.dead){const k=(e.boss?.08:1)*2.5*36*dt*(1-d/rad);e.x+=dx/(d||1)*k;e.y+=dy/(d||1)*k}}}
 if(activeEvo(g,'hunterConstellation'))for(const p of g.shots||[]){if(p.family!=='missile')continue;if(!p.target||p.target.dead||!g.validTarget?.(p.target)){const t=nearest(g,p.x,p.y,1200);if(t)p.target=t}p.homing=true}
 if(activeEvo(g,'phoenixMesh')){const repair=(g.droneUnits||[]).filter(u=>u.def?.role==='defense').length*g.maxHp*.011/3*dt*V.repairMultiplier(g);if(repair>0&&g.hp<g.maxHp){const mult=g.hp/g.maxHp<.25?2:1,amt=repair*mult;g.hp=Math.min(g.maxHp,g.hp+amt);g.shield=Math.min(g.maxShield,g.shield+amt*.35)}if(g.shield>=g.maxShield&&g.hp<g.maxHp)g.hp=Math.min(g.maxHp,g.hp+g.maxShield*.0035*dt)}
}

const oldDamageTarget=GP.damageTarget;
if(oldDamageTarget)GP.damageTarget=function(t,d,...args){let dmg=d;if(t?._v110Paint>0){const bonus=activeEvo(this,'hunterConstellation')?.35:s(this,'targetPainter','damage');dmg*=1+bonus}return oldDamageTarget.call(this,t,dmg,...args)};

const oldUpdate=GP.update;
if(oldUpdate)GP.update=function(dt){V.ensureTransient(this);V.recomputeCore(this);this._v110ReactiveCd=Math.max(0,(this._v110ReactiveCd||0)-dt);this._v110NoHullDamage=(this._v110NoHullDamage||0)+dt;this._v110OvershieldLife=Math.max(0,(this._v110OvershieldLife||0)-dt);if(this._v110OvershieldLife<=0&&this._v110Overshield>0){if(activeEvo(this,'thunderhead')&&(this._v110ThunderStore||0)>0){damageRadius(this,this.cx,this.cy,220,(this._v110ThunderStore||0)*1.5+(V.weaponByFamily('ion')?.damage||20)*2.5);this._v110ThunderStore=0;fx(this,'boom',this.cx,this.cy,{life:.65,color:'#9faeff'})}this._v110Overshield=0}
 const armor=ensureArmor(this);if(armor&&activeEvo(this,'ironSpine')&&armorCount(armor)<armor.max&&this._v110NoHullDamage>=8){armor.rebuild-=dt;if(armor.rebuild<=0){const i=armor.plates.findIndex(v=>v<=0);if(i>=0){armor.plates[i]=this.maxHp*.10;armor.rebuild=8}}}
 this._v110Charge.bank=(this._v110Charge.bank||0)+dt;this._v110Charge.singularity=(this._v110Charge.singularity||0)+dt;this._v110Charge.recovery=Math.max(0,(this._v110Charge.recovery||0)-dt);
 const beforeBad=(this.bad||[]).length,out=oldUpdate.call(this,dt);for(const e of this.en||[]){e._v110Paint=Math.max(0,(e._v110Paint||0)-dt);e._v110Blackout=Math.max(0,(e._v110Blackout||0)-dt);e._v110StaticLife=Math.max(0,(e._v110StaticLife||0)-dt);if(e._v110StaticLife<=0)e._v110Static=0}
 this._v110EW=Math.max(0,(this._v110EW||0)-dt);if(this._v110EW>0&&(this.bad||[]).length>beforeBad){const penalty=activeEvo(this,'deadZone')?.60:(r(this,'ewFrigate')?s(this,'ewFrigate','penalty'):0);for(const p of (this.bad||[]).slice(beforeBad))if(Math.random()<penalty)p.life=0}
 updateFields(this,dt);updateTacticalPaths(this,dt);updateEvolutions(this,dt);
 // Regenerative shield behavior uses real time-since-hit state.
 if(r(this,'regenerative')||activeEvo(this,'phoenixMesh')){const delay=activeEvo(this,'phoenixMesh')?.60:s(this,'regenerative','delay'),regen=activeEvo(this,'phoenixMesh')?1.30:s(this,'regenerative','regen');if((this.timeSinceHit||0)>Math.max(.35,2.4*(1-delay))&&this.shield<this.maxShield)this.shield=Math.min(this.maxShield,this.shield+this.maxShield*(.012*(1+regen))*dt)}
 return out};

const oldDraw=GP.draw;
if(oldDraw)GP.draw=function(){const out=oldDraw.call(this),x=this.x;if(!x||this.dead)return out;V.drawCardEffects(this,x);return out};
V.drawCardEffects=(g,x)=>{const t=now();x.save();
 // Persistent fields.
 for(const f of g._v110Fields||[]){const a=clamp(f.life/Math.max(.01,f.max||f.life),0,1);x.globalAlpha=.08+.16*a;x.strokeStyle=f.kind==='scorch'||f.kind==='lane'?'#ff72cf':'#9a87ff';x.lineWidth=2;x.beginPath();x.arc(f.x,f.y,f.r*(.96+.04*Math.sin(t*3)),0,Math.PI*2);x.stroke()}
 // Layered shield / Citadel Halo.
 if((r(g,'layered')||activeEvo(g,'citadelHalo'))&&g.shield>0){const n=activeEvo(g,'citadelHalo')?Math.max(2,(g.droneUnits||[]).filter(u=>u.def?.role==='defense').length):s(g,'layered','layers'),q=g.v97ShipContact?.(true)||{rx:68,ry:82};for(let i=0;i<n;i++){x.globalAlpha=.10+i*.018;x.strokeStyle=activeEvo(g,'citadelHalo')?'#c7b6ff':'#7fe9ff';x.lineWidth=1.2;x.beginPath();x.ellipse(g.cx,g.cy,q.rx+5+i*5,q.ry+5+i*5,0,0,Math.PI*2);x.stroke()}}
 if(activeEvo(g,'mirrorstorm')&&g.shield>0){const q=g.v97ShipContact?.(true)||{rx:68,ry:82};x.globalAlpha=.20;x.strokeStyle='#f0b7ff';x.setLineDash([7,5]);x.beginPath();x.ellipse(g.cx,g.cy,q.rx+5,q.ry+5,0,t*.4,Math.PI*2+t*.4);x.stroke();x.setLineDash([])}
 if((g._v110Overshield||0)>0){const pct=clamp(g._v110Overshield/Math.max(1,g._v110OvershieldMax||g.maxShield),0,1),q=g.v97ShipContact?.(true)||{rx:68,ry:82};x.globalAlpha=.18+.14*pct;x.strokeStyle=activeEvo(g,'thunderhead')?'#a89dff':'#8eeaff';x.lineWidth=2.2;x.beginPath();x.ellipse(g.cx,g.cy,q.rx+11,q.ry+13,0,0,Math.PI*2);x.stroke()}
 if(activeEvo(g,'stormNet')){x.globalAlpha=.18;x.strokeStyle='#93a4ff';x.lineWidth=1.3;const pts=[{x:g.cx,y:g.cy},...(g.supportUnits||[]).filter(u=>V.DEF_SUPPORT_IDS.has(u.def?.id))];for(let i=0;i<pts.length-1;i++){x.beginPath();x.moveTo(pts[i].x,pts[i].y);x.lineTo(pts[i+1].x,pts[i+1].y);x.stroke()}}
 if(activeEvo(g,'deadZone')&&g._v110EW>0){x.globalAlpha=.10;x.strokeStyle='#8874ff';x.lineWidth=3;x.beginPath();x.arc(g.cx,g.cy,220+Math.sin(t*2)*5,0,Math.PI*2);x.stroke()}
 if(activeEvo(g,'shrapnelCrown')&&(g._v110Crown||0)>0){x.globalAlpha=.72;x.fillStyle='#f0e1ff';const n=g._v110Crown;for(let i=0;i<n;i++){const a=t*.7+i/n*Math.PI*2;x.fillRect(g.cx+Math.cos(a)*78-1,g.cy+Math.sin(a)*60-1,3,3)}}
 if(r(g,'swarmDrones')||activeEvo(g,'bulletHive')){const n=activeEvo(g,'bulletHive')?6:s(g,'swarmDrones','count');x.fillStyle='#ffbf79';x.globalAlpha=.55;for(const u of g.droneUnits||[]){if(u.def?.role==='defense')continue;for(let i=0;i<n;i++){const a=-t*2+i/n*Math.PI*2;x.fillRect(u.x+Math.cos(a)*9-1,u.y+Math.sin(a)*9-1,2,2)}}}
 x.restore()};
})();
