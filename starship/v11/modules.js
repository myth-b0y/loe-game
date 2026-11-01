(()=>{
'use strict';
const R=window.SR,V=R?.V10,X=R?.V130;if(!R?.Game||!V||!X)throw new Error('V1.3 modules requires reward runtime');
const GP=R.Game.prototype,clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
const E=(t,c,h)=>{const e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const role=e=>Number(e?.type?.role??e?.role??0)||0;

X.toast=(title,sub='',aspect='white')=>{
 const old=document.querySelector('.v130Toast');old?.remove();const d=E('div','v130Toast');d.style.setProperty('--accent',X.color(aspect));d.innerHTML=`<small>${esc(sub)}</small><b>${esc(title)}</b>`;document.body.append(d);requestAnimationFrame(()=>d.classList.add('show'));setTimeout(()=>{d.classList.remove('show');setTimeout(()=>d.remove(),180)},1800);
};
X.addModule=(g,id,source='MODULE ACQUIRED')=>{
 const run=X.ensure(g),m=X.MODULE_BY_ID[id];if(!m||run.modules.includes(id)||run.modules.length>=X.CONFIG.moduleSlots)return false;
 run.modules.push(id);V.initState(g).history.push({t:'module',id,level:g.level||1});X.toast(m.name,source,m.aspect);return true;
};
X.randomModule=g=>{
 const owned=new Set(X.ensure(g).modules),pool=X.MODULES.filter(m=>!owned.has(m.id));return pool.length?pool[Math.random()*pool.length|0]:null;
};
X.onUniqueAdded=(g,u)=>{X.toast(u.name,'UNIQUE ACQUIRED',u.aspect)};

// Passive rule changes. They are intentionally run-local and require no save migration.
const hit121=GP.hitShip;
GP.hitShip=function(d,x=this.cx,y=this.cy){
 let damage=Math.max(0,Number(d)||0);if(damage<=0)return hit121.call(this,damage,x,y);
 const deflect=clamp(X.effectSum(this,'deflect'),0,.35);if(deflect>0&&Math.random()<deflect){this.v984Fx?.('shieldHit',x,y,{life:.32,color:X.color('white')});X.toast('DEFLECT','PASSIVE MODULE','white');return 0}
 if((Number(this.shield)||0)<=0){const red=clamp(X.effectSum(this,'shieldDownReduction'),0,.5);damage*=1-red}
 const before=Number(this.shield)||0,out=hit121.call(this,damage,x,y),after=Number(this.shield)||0;
 const pulse=X.effectSum(this,'shieldBreakPulse');if(before>0&&after<=0&&pulse>0){
   const amount=Math.max(4,(Number(this.maxShield)||0)*pulse),radius=180;
   for(const e of [...(this.en||[])])if(e&&!e.dead&&Math.hypot((e.x||0)-this.cx,(e.y||0)-this.cy)<=radius)this.damageTarget?.(e,amount);
   this.v984Fx?.('shieldBreak',this.cx,this.cy,{life:.7,color:X.color('blue')});
 }
 return out;
};

const damage121=GP.damageTarget;
GP.damageTarget=function(t,d,...args){
 let damage=Math.max(0,Number(d)||0);if(t&&!t.dead&&damage>0){
   const radius=X.effectMax(this,'nearRadius',180),near=X.effectSum(this,'nearDamage');if(near>0&&Math.hypot((t.x||0)-this.cx,(t.y||0)-this.cy)<=radius)damage*=1+near;
   const critical=X.effectSum(this,'criticalDamage'),criticalHull=X.effectMax(this,'criticalHull',.30);if(critical>0&&(Number(this.hp)||0)/Math.max(1,Number(this.maxHp)||1)<=criticalHull)damage*=1+critical;
   const execute=X.effectSum(this,'executeDamage'),executeHull=X.effectMax(this,'executeHull',.20),tm=Number(t.max||t.maxHp||t.hp)||1;if(execute>0&&(Number(t.hp)||0)/Math.max(1,tm)<=executeHull)damage*=1+execute;
 }
 return damage121.call(this,t,damage,...args);
};

const update121=GP.update;
GP.update=function(dt){
 const out=update121.call(this,dt);if(!this.dead&&!this.paused){const r=X.effectSum(this,'fullShieldRepair');if(r>0&&this.maxShield>0&&this.shield>=this.maxShield*.995&&this.hp<this.maxHp)this.hp=Math.min(this.maxHp,this.hp+this.maxHp*r*dt)}return out;
};

const initSupport=GP.v984InitSupport;
if(initSupport)GP.v984InitSupport=function(u){
 const out=initSupport.call(this,u);if(!u||!Number.isFinite(u._v984MaxHp))return out;
 const bonus=clamp(X.effectSum(this,'escortDefense'),0,1),old=Number(u._v130EscortBonus)||0;if(Math.abs(bonus-old)>.0001){
   const hpPct=(u._v984Hp||0)/Math.max(1,u._v984MaxHp||1),shPct=(u._v984Shield||0)/Math.max(1,u._v984MaxShield||1),ratio=(1+bonus)/Math.max(.01,1+old);
   u._v984MaxHp=Math.round(u._v984MaxHp*ratio);u._v984Hp=Math.min(u._v984MaxHp,Math.round(u._v984MaxHp*hpPct));u._v984MaxShield=Math.round(u._v984MaxShield*ratio);u._v984Shield=Math.min(u._v984MaxShield,Math.round(u._v984MaxShield*shPct));u._v130EscortBonus=bonus;
 }
 return out;
};

// Enemy salvage amplification and rare run-only Module drops.
const enemyDie121=GP.enemyDie;
GP.enemyDie=function(e){
 const before=Number(this.salvage)||0,beforeSave=Number(this.s?.salvage)||0,boss=!!e?.boss,elite=!boss&&role(e)>=4,eligible=(boss||elite)&&!e?._v130ModuleRolled;
 if(e)e._v130ModuleRolled=true;const out=enemyDie121.call(this,e),after=Number(this.salvage)||0,afterSave=Number(this.s?.salvage)||0,bonus=clamp(X.effectSum(this,'salvage'),0,1.5);
 if(bonus>0){if(after>before)this.salvage=after+(after-before)*bonus;else if(this.s&&afterSave>beforeSave)this.s.salvage=afterSave+(afterSave-beforeSave)*bonus}
 if(eligible&&X.ensure(this).modules.length<X.CONFIG.moduleSlots){
   const scan=X.effectSum(this,'moduleDrop'),chance=clamp((boss?X.CONFIG.bossModuleBase:X.CONFIG.eliteModuleBase)+X.luck(this)*(boss?.0015:.0004)+scan,0,boss?.75:.20);
   if(Math.random()<chance){const m=X.randomModule(this);if(m)X.addModule(this,m.id,boss?'BOSS DROP':'ELITE DROP')}
 }
 return out;
};

// Add a compact run-Module shelf to the existing Galactic Engineer Refit UI.
const engineer121=GP.v93ShowEngineerTrader;
if(engineer121)GP.v93ShowEngineerTrader=function(...args){
 const out=engineer121.apply(this,args);requestAnimationFrame(()=>{
   const root=document.querySelector('#engineerTrader .v110RefitCard');if(!root||root.querySelector('.v130EngineerModules'))return;
   const slots=X.ensure(this).modules.length;if(slots>=X.CONFIG.moduleSlots)return;
   const pool=X.MODULES.filter(m=>!X.hasModule(this,m.id)),picks=[];while(pool.length&&picks.length<2)picks.push(pool.splice(Math.random()*pool.length|0,1)[0]);if(!picks.length)return;
   const fee=Math.round(700+(this.wave||0)*55),sec=E('section','v130EngineerModules');sec.innerHTML=`<small>RUN MODULES · ${slots}/${X.CONFIG.moduleSlots}</small><div class="v130EngineerModuleRow"></div>`;const row=sec.querySelector('.v130EngineerModuleRow');
   for(const m of picks){const b=E('button','v130ModuleOffer');b.style.setProperty('--accent',X.color(m.aspect));b.innerHTML=`<i>${esc(m.icon)}</i><span><b>${esc(m.name)}</b><small>${esc(m.desc)}</small></span><strong>▰ ${fee}</strong>`;b.onclick=()=>{if(X.ensure(this).modules.length>=X.CONFIG.moduleSlots)return this.app?.deny?.('MODULE BAY FULL');if(this.salvage<fee)return this.app?.deny?.('NEED SALVAGE');this.salvage-=fee;if(X.addModule(this,m.id,'ENGINEER MODULE')){b.disabled=true;b.classList.add('installed');b.querySelector('strong').textContent='INSTALLED'}};row.append(b)}
   sec.append(row);const skip=root.querySelector('[data-skip]');if(skip)root.insertBefore(sec,skip);else root.append(sec);
 });return out;
};
})();
