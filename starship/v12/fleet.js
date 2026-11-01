(()=>{
'use strict';
const R=window.SR,V=R?.V10,X=R?.V130,P=R?.V131;if(!R?.Game||!V||!X||!P)throw new Error('V1.3.1 fleet requires runtime');
const GP=R.Game.prototype,clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
const rank=(g,id)=>Math.max(0,Number(V.rank?.(g,id))||0),stat=(g,id,k)=>Number(V.stat?.(g,id,k))||0,evo=(g,id)=>!!V.evoOn?.(g,id);
const activeSupport=u=>u&&!(u._v984Respawn>0)&&u._v984State!=='dead'&&u._v984State!=='launch'&&Number(u._v984Hp??1)>0;
const nearest=(g,x,y,max=1e9)=>{let best=null,d=max;for(const e of g.en||[]){if(!e||e.dead)continue;const q=Math.hypot((e.x||0)-x,(e.y||0)-y);if(q<d){d=q;best=e}}return best};
const fleetStrength=g=>clamp(P.FLEET_ECHO_BASE+(X.effectSum?.(g,'fleetEcho')||0),.30,.72);
const shotCap=g=>(g.shots?.length||0)<420;

function pushShot(g,p){if(!shotCap(g))return null;(g.shots||(g.shots=[])).push(p);return p}
function fragment(g,p,target,angleOffset=0,damage=.45,family='fleet.fragment'){
 if(!target||!shotCap(g))return null;const a=Math.atan2(target.y-p.y,target.x-p.x)+angleOffset,sp=Math.max(360,Math.hypot(p.vx||0,p.vy||0)*.92);
 return pushShot(g,{x:p.x,y:p.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,damage:Math.max(1,p.damage*damage),life:1.35,target,homing:false,aoe:0,ion:false,chain:0,pierce:0,ricochet:0,color:p.color||'#d9f6ff',family,_v131Fleet:true,_v131Secondary:true});
}
function fanExtras(g,p,target,count,spreadDeg,damage=.42){
 count=clamp(count,0,4);if(!count||!target)return;
 const step=(spreadDeg*Math.PI/180)/Math.max(1,count);
 for(let i=0;i<count;i++){const side=i%2?1:-1,band=Math.floor(i/2)+1;fragment(g,p,target,side*band*step,damage)}
}
function burstExtras(g,p,target,count,damage=.50){
 count=clamp(count,0,3);if(!count||!target)return;
 const base=Math.atan2(target.y-p.y,target.x-p.x),sp=Math.max(380,Math.hypot(p.vx||0,p.vy||0));
 for(let i=0;i<count;i++){if(!shotCap(g))break;const s=sp*(.94+i*.035);pushShot(g,{x:p.x,y:p.y,vx:Math.cos(base)*s,vy:Math.sin(base)*s,damage:Math.max(1,p.damage*damage),life:1.35,target,homing:!!p.homing,aoe:(p.aoe||0)*.65,ion:!!p.ion,chain:0,pierce:0,ricochet:0,color:p.color||'#d9f6ff',family:'fleet.fragment',_v131Fleet:true,_v131Secondary:true})}
}

P.applyFleetEcho=(g,p,family,target)=>{
 if(!p||p._v131EchoApplied)return p;p._v131EchoApplied=true;p._v131WeaponFamily=family;p._v131Fleet=true;
 const k=fleetStrength(g);
 if(family==='autocannon'){
   const ric=evo(g,'packfire')?6:rank(g,'ricochet')?stat(g,'ricochet','bounces'):0;if(ric)p.ricochet=Math.max(p.ricochet||0,clamp(Math.round(ric*k),1,3));
   const sc=evo(g,'bulletHive')?10:rank(g,'scatter')?stat(g,'scatter','shots'):0;if(sc)fanExtras(g,p,target,Math.min(4,Math.max(1,Math.round((sc-1)*k))),evo(g,'bulletHive')?28:22,.38);
   const br=evo(g,'synchronizedSalvo')?10:rank(g,'burst')?stat(g,'burst','rounds'):0;if(br)burstExtras(g,p,target,Math.min(3,Math.max(1,Math.round((br-1)*k*.55))),.46);
 }
 if(family==='railgun'){
   const pen=evo(g,'ironSpine')?12:rank(g,'penetrator')?stat(g,'penetrator','pierce'):0;if(pen)p.pierce=Math.max(p.pierce||0,clamp(Math.round(pen*k),1,5));
   const cap=evo(g,'singularityDriver')?6:rank(g,'capacitorShot')?stat(g,'capacitorShot','damage'):0;if(cap)p.damage*=1+(Math.max(1,cap)-1)*k*.45;
   const sh=evo(g,'shrapnelCrown')?12:rank(g,'shattershot')?stat(g,'shattershot','fragments'):0;if(sh)p._v131Shatter=clamp(Math.round(sh*k),1,5);
 }
 if(family==='plasma'){
   const heavy=evo(g,'starbreaker')?4.5:rank(g,'overcharge')?stat(g,'overcharge','damage'):0;if(heavy){p.damage*=1+(Math.max(1,heavy)-1)*k*.45;p.aoe=(p.aoe||48)*(1+k*.35)}
   if(evo(g,'sunscar')||rank(g,'scorch'))p._v131Scorch=true;
   const cl=evo(g,'meteorBroadside')?9:rank(g,'clusterCore')?stat(g,'clusterCore','fragments'):0;if(cl)p._v131Cluster=clamp(Math.round(cl*k),1,4);
 }
 if(family==='ion'){
   p.ion=true;const ch=evo(g,'stormNet')?9:rank(g,'chainArc')?stat(g,'chainArc','jumps'):0;if(ch)p.chain=Math.max(p.chain||0,clamp(Math.round(ch*k),1,4));
   if(rank(g,'blackout')||evo(g,'deadZone'))p._v131Blackout=true;
   if(rank(g,'staticCharge')||evo(g,'thunderhead'))p._v131Static=true;
 }
 if(family==='missile'){
   p.homing=true;const swarm=evo(g,'hunterConstellation')?12:rank(g,'swarmRack')?stat(g,'swarmRack','count'):0;if(swarm)burstExtras(g,p,target,Math.min(3,Math.max(1,Math.round((swarm-1)*k*.5))),.40);
   const torp=evo(g,'eventHorizonTorpedo')?5.5:rank(g,'torpedoRack')?stat(g,'torpedoRack','damage'):0;if(torp){p.damage*=1+(Math.max(1,torp)-1)*k*.4;p.aoe=(p.aoe||50)*(1+k*.45)}
   const cl=evo(g,'novaBloom')?10:rank(g,'clusterRack')?stat(g,'clusterRack','count'):0;if(cl)p._v131MissileCluster=clamp(Math.round(cl*k),1,4);
 }
 return p;
};

const fire130=GP.v984FireFriendly;
if(fire130)GP.v984FireFriendly=function(target,u,def,kind='support'){
 const before=(this.shots||[]).length,out=fire130.call(this,target,u,def,kind),fresh=(this.shots||[]).slice(before);
 let family=null;if(kind==='support')family=P.SUPPORT_WEAPONS[def?.id]?.primaryFamily||'autocannon';else if(kind==='drone')family=P.DRONE_FAMILY(def?.id);
 if(family&&family!=='repair')for(const p of fresh){p.family='fleet.'+family;P.applyFleetEcho(this,p,family,target)}
 return out;
};

P.fireHullWeapon=(g,u,target,cfg)=>{
 if(!target||!u||!cfg||!shotCap(g))return false;
 const heading=Number.isFinite(u.heading)?u.heading:-Math.PI/2,ox=u.x+Math.cos(heading)*9,oy=u.y+Math.sin(heading)*9,a=Math.atan2(target.y-oy,target.x-ox),sp=560;
 let damage=cfg.damage*(g.mods?.escortDmg||1),rate=cfg.rate*(g.mods?.escortRate||1)*(g.escortBuff?1.8:1);
 if(V.OFF_SUPPORT_IDS?.has(u.def?.id)&&rank(g,'gunshipWing')){damage*=1+stat(g,'gunshipWing','damage');rate*=1+stat(g,'gunshipWing','rate')}
 if(V.DEF_SUPPORT_IDS?.has(u.def?.id)&&rank(g,'interceptorEscort'))damage*=1+stat(g,'interceptorEscort','damage')*.45;
 const p=pushShot(g,{x:ox,y:oy,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,damage,life:1.35,target,homing:false,aoe:0,ion:false,chain:0,pierce:0,ricochet:0,color:'#d9f6ff',family:'fleet.'+cfg.family,_v131Fleet:true,_v131Hull:true});
 if(!p)return false;P.applyFleetEcho(g,p,cfg.family,target);g.v984Fx?.('muzzle',ox,oy,{life:.12,color:'#e6fbff'});R.audio?.play?.('support',(ox/g.w-.5)*2);
 u._v131HullCd=1/Math.max(.15,rate);return true;
};

const allies130=GP.allies;
if(allies130)GP.allies=function(dt){
 for(const u of this.supportUnits||[])u._v131HullCd=Math.max(0,(u._v131HullCd||0)-dt);
 const out=allies130.call(this,dt),enc=this._v8Encounter,bossMode=this.bossState?.stage==='fight',field=String(enc?.type||'').includes('asteroid');
 const respawn=X.effectSum?.(this,'supportRespawn')||0;
 for(const u of this.supportUnits||[]){
   if(u._v984Respawn>0&&respawn>0)u._v984Respawn=Math.max(0,u._v984Respawn-dt*(1/Math.max(.2,1-respawn)-1));
   const cfg=P.SUPPORT_WEAPONS[u.def?.id];if(!cfg||!activeSupport(u))continue;
   const turretTarget=u.def?.repair?{x:this.cx,y:this.cy}:this.v984SupportTarget?.(u,bossMode,field);
   if(turretTarget)u._v99TurretAngle=Math.atan2(turretTarget.y-u.y,turretTarget.x-u.x);
   if(!cfg.hull||u._v131HullCd>0)continue;
   const hullTarget=nearest(this,u.x,u.y,cfg.hull.range||430);if(hullTarget)P.fireHullWeapon(this,u,hullTarget,cfg.hull);
 }
 return out;
};

const supportHit130=GP.v984SupportHit;
if(supportHit130)GP.v984SupportHit=function(u,damage,...args){
 const reduce=clamp(X.effectSum?.(this,'supportDefense')||0,0,.55);
 return supportHit130.call(this,u,Math.max(0,Number(damage)||0)*(1-reduce),...args);
};

const impact130=V.onFriendlyImpact;
V.onFriendlyImpact=(g,z)=>{
 const out=impact130?.(g,z),p=z?.p,family=p?._v131WeaponFamily;if(!p?._v131Fleet||p._v131Secondary||!family)return out;
 const k=fleetStrength(g),target=nearest(g,z.x,z.y,100);
 if(family==='railgun'&&p._v131Shatter&&target){const n=clamp(p._v131Shatter,1,5);for(let i=0;i<n;i++)fragment(g,{...p,x:z.x,y:z.y,damage:z.damage},target,(i-(n-1)/2)*.10,.28)}
 if(family==='plasma'){
   if(p._v131Scorch&&V.addField){const dur=evo(g,'sunscar')?3.2:Math.max(1.4,stat(g,'scorch','duration')*k),rad=Math.max(34,(z.aoe||52)*(1+k*.25));V.addField(g,{kind:'scorch',x:z.x,y:z.y,r:rad,life:dur,damage:Math.max(2,z.damage*.18)})}
   if(p._v131Cluster&&target){const n=clamp(p._v131Cluster,1,4);for(let i=0;i<n;i++)fragment(g,{...p,x:z.x,y:z.y,damage:z.damage},target,(i-(n-1)/2)*.18,.24)}
 }
 if(family==='ion'&&target){
   if(p._v131Blackout){const dur=evo(g,'deadZone')?.7:stat(g,'blackout','duration')*k;target._v110Blackout=Math.max(target._v110Blackout||0,dur)}
   if(p._v131Static){const need=evo(g,'thunderhead')?6:Math.max(5,Math.round((stat(g,'staticCharge','stacks')||8)/Math.max(.35,k)));target._v131FleetStatic=(target._v131FleetStatic||0)+1;if(target._v131FleetStatic>=need){target._v131FleetStatic=0;g.damageTarget?.(target,Math.max(3,z.damage*(evo(g,'thunderhead')?1.15:.85)));g.v984Fx?.('intercept',target.x,target.y,{life:.4,color:'#9aa9ff'})}}
 }
 if(family==='missile'&&p._v131MissileCluster&&target){const n=clamp(p._v131MissileCluster,1,4);for(let i=0;i<n;i++)fragment(g,{...p,x:z.x,y:z.y,damage:z.damage},target,(i-(n-1)/2)*.16,.25)}
 return out;
};
})();