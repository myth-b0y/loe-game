(()=>{
'use strict';
const R=window.SR;if(!R?.App||!R?.Game)return;
const AP=R.App.prototype,GP=R.Game.prototype,$=s=>document.querySelector(s),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const E=(t,c,h)=>{const e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e};
R.VERSION='0.9.8';

// ---------------------------------------------------------------------------
// v0.9.8 FOUNDATION POLISH — fleet behavior, shields, asteroids, presentation.
// ---------------------------------------------------------------------------
const norm=a=>Math.atan2(Math.sin(a),Math.cos(a));
const now=()=>performance.now()/1000;
const roleOf=e=>Number(e?.type?.role??e?.role??0)||0;
const activeSupport=u=>u&&!(u._v984Respawn>0)&&u._v984State!=='dead';

// Reusable local FX bucket.
GP.v984Fx=function(kind,x,y,data={}){this._v984Fx=this._v984Fx||[];this._v984Fx.push({kind,x,y,life:data.life||.5,max:data.life||.5,...data})};

// ---------------------------------------------------------------------------
// CANONICAL SUPPORT / DRONE RENDERERS
// ---------------------------------------------------------------------------
R.v984SupportColor=def=>def?.ion?'#9d9cff':def?.repair?'#7cf0ba':def?.id?.includes('bomber')?'#ffb374':'#c9e6f2';
R.v984DrawEngineTrail=function(ctx,x,y,heading,size=1,power=1,color='#72ddff'){
  const len=(10+18*clamp(power,0,1.4))*size,w=2.1*size,ax=x-Math.cos(heading)*7*size,ay=y-Math.sin(heading)*7*size;
  ctx.save();ctx.globalAlpha=.16+.16*clamp(power,0,1);ctx.strokeStyle=color;ctx.lineWidth=w*2.1;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(ax-Math.cos(heading)*len,ay-Math.sin(heading)*len);ctx.stroke();ctx.globalAlpha=.62;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(ax-Math.cos(heading)*len*.68,ay-Math.sin(heading)*len*.68);ctx.stroke();ctx.restore();
};
R.v984DrawSupport=function(ctx,u,def,opt={}){
  if(!u||!def)return;const size=opt.size||1,a=Number.isFinite(u.heading)?u.heading:-Math.PI/2,color=R.v984SupportColor(def),speed=Math.hypot(u.vx||0,u.vy||0),power=opt.idle?.28:clamp(speed/175,.22,1.18);
  R.v984DrawEngineTrail(ctx,u.x,u.y,a,size,power,def.ion?'#a79cff':'#65dfff');
  ctx.save();ctx.translate(u.x,u.y);ctx.rotate(a+Math.PI/2);
  if((u._v984Shield||0)>0){ctx.globalAlpha=.13+(u._v984ShieldFlash||0)*.3;ctx.strokeStyle='#6fe5ff';ctx.lineWidth=1.2*size;ctx.beginPath();ctx.ellipse(0,0,11*size,13*size,0,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1}
  ctx.fillStyle='#12232d';ctx.strokeStyle=color;ctx.lineWidth=1.1*size;ctx.beginPath();ctx.moveTo(0,-9*size);ctx.lineTo(5.7*size,-1.5*size);ctx.lineTo(7.2*size,7*size);ctx.lineTo(1.8*size,4.8*size);ctx.lineTo(0,7*size);ctx.lineTo(-1.8*size,4.8*size);ctx.lineTo(-7.2*size,7*size);ctx.lineTo(-5.7*size,-1.5*size);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle=color;ctx.globalAlpha=.45;ctx.fillRect(-1.2*size,-4.4*size,2.4*size,5.2*size);ctx.restore();
  if(opt.health!==false&&u._v984Hp!=null&&u._v984Hp<u._v984MaxHp){const pct=clamp(u._v984Hp/Math.max(1,u._v984MaxHp),0,1);ctx.save();ctx.globalAlpha=.75;ctx.fillStyle='rgba(3,8,12,.8)';ctx.fillRect(u.x-10*size,u.y+12*size,20*size,2.5*size);ctx.fillStyle=pct>.45?'#8fe6be':'#ff9b87';ctx.fillRect(u.x-10*size,u.y+12*size,20*size*pct,2.5*size);ctx.restore()}
};
R.v984DrawDrone=function(ctx,u,def,opt={}){
  if(!u||!def)return;const c=def.role==='defense'?'#79e8ff':(def.ion?'#9a9cff':'#ffbe78'),r=opt.size||3.6;
  ctx.save();ctx.translate(u.x,u.y);ctx.fillStyle='#10212a';ctx.strokeStyle=c;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,-r);ctx.lineTo(r*.9,0);ctx.lineTo(0,r);ctx.lineTo(-r*.9,0);ctx.closePath();ctx.fill();ctx.stroke();ctx.globalAlpha=.45;ctx.fillStyle=c;ctx.beginPath();ctx.arc(0,0,r*.38,0,Math.PI*2);ctx.fill();ctx.restore();
};

// Station/preview uses the exact same visual pieces as combat.
const drawShip984=R.drawShip;
R.drawShip=function(ctx,cx,cy,scale=1,weapons=[],tier=0,preview=false,state={}){
  if(!preview)return drawShip984(ctx,cx,cy,scale,weapons,tier,preview,state);
  const clean={...state,drones:[],supports:[]},out=drawShip984(ctx,cx,cy,scale,weapons,tier,preview,clean),t=now(),hull=clamp(tier|0,0,6),z=34*scale,shieldRx=z*(1.36+hull*.07),shieldRy=z*(1.62+hull*.045),ds=state.drones||[],ss=state.supports||[];
  ds.forEach((id,i)=>{const def=R.DRONES?.find(d=>d.id===id),defensive=def?.role==='defense',a=(defensive?t:-t)*.46+i/Math.max(1,ds.length)*Math.PI*2,u={x:cx+Math.cos(a)*(shieldRx+(defensive?-4:7)),y:cy+Math.sin(a)*(shieldRy+(defensive?-4:7))};R.v984DrawDrone(ctx,u,def,{size:Math.max(3,scale*2.2)})});
  ss.forEach((id,i)=>{const def=R.SUPPORTS?.find(d=>d.id===id),a=t*.24+i/Math.max(1,ss.length)*Math.PI*2,rx=z*(2.05+(i%2)*.18),ry=z*(1.15+(i%2)*.12),u={x:cx+Math.cos(a)*rx,y:cy+Math.sin(a)*ry,vx:-Math.sin(a)*rx*.24,vy:Math.cos(a)*ry*.24,heading:Math.atan2(Math.cos(a)*ry,-Math.sin(a)*rx)};R.v984DrawSupport(ctx,u,def,{size:Math.max(.72,scale*.5),health:false,idle:true})});
  return out;
};

// ---------------------------------------------------------------------------
// ALLY STATE + FLIGHT
// ---------------------------------------------------------------------------
const syncAllies984=GP.syncAllies;
GP.syncAllies=function(...args){const out=syncAllies984?.apply(this,args);for(const u of this.supportUnits||[])this.v984InitSupport(u);return out};
GP.v984InitSupport=function(u){
  if(!u||!u.def)return;const id=u.def.id||'',hp=id.includes('gunship')?220:id.includes('bomber')?165:id.includes('repair')?155:id.includes('fighter')?135:id.includes('ew')?125:100,sh=id.includes('gunship')?100:id.includes('fighter')?72:id.includes('bomber')?62:id.includes('repair')?74:52;
  if(!Number.isFinite(u._v984MaxHp)){u._v984MaxHp=hp;u._v984Hp=hp;u._v984MaxShield=sh;u._v984Shield=sh;u._v984State='formation';u._v984Respawn=0;u._v984ShieldDelay=0;u.heading=-Math.PI/2;u.vx=0;u.vy=0}
};
GP.v984SupportHit=function(u,damage,x=u.x,y=u.y){
  if(!activeSupport(u))return false;damage=Math.max(0,Number(damage)||0);this.v984InitSupport(u);
  if(u._v984Shield>0){const take=Math.min(u._v984Shield,damage);u._v984Shield-=take;damage-=take;u._v984ShieldDelay=2.2;u._v984ShieldFlash=.55;this.v984Fx('supportShield',x,y,{life:.38,color:'#72e5ff'})}
  if(damage>0){u._v984Hp-=damage;this.v984Fx('supportHit',x,y,{life:.32,color:'#ff9f79'})}
  if(u._v984Hp<=0){u._v984Hp=0;u._v984Shield=0;u._v984State='dead';u._v984Respawn=18;u.vx=u.vy=0;this.v984Fx('supportBoom',u.x,u.y,{life:.9,color:'#ffb06a'});R.audio?.play?.('boom')}
  return true;
};
GP.v984FireFriendly=function(target,u,def,kind='support'){
  if(!target||!u||!def)return;const a=Math.atan2(target.y-u.y,target.x-u.x),sp=kind==='drone'?470:520,dmg=(def.damage||6)*(kind==='drone'?(this.mods.droneDmg||1):(this.mods.escortDmg||1));
  (this.shots||(this.shots=[])).push({x:u.x,y:u.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,damage:dmg,life:1.45,target,homing:!!def.homing,aoe:def.aoe||0,ion:!!def.ion,chain:def.chain||0,pierce:0,color:kind==='drone'?'#9deeff':'#d9f6ff',family:kind});this.v984Fx('muzzle',u.x,u.y,{life:.14,color:kind==='drone'?'#77e7ff':'#e6fbff'});
};
const steer984=(u,tx,ty,dt,maxSpeed=170,response=3)=>{u.vx=Number(u.vx)||0;u.vy=Number(u.vy)||0;const dx=tx-u.x,dy=ty-u.y,d=Math.hypot(dx,dy)||1,s=Math.min(maxSpeed,d*3),dvx=dx/d*s,dvy=dy/d*s,k=Math.min(1,dt*response);u.vx+=(dvx-u.vx)*k;u.vy+=(dvy-u.vy)*k;u.x+=u.vx*dt;u.y+=u.vy*dt;if(Math.hypot(u.vx,u.vy)>3)u.heading=Math.atan2(u.vy,u.vx)};
const fly984=(g,u,target,dt)=>{u.vx=Number(u.vx)||0;u.vy=Number(u.vy)||0;u.heading=Number.isFinite(u.heading)?u.heading:-Math.PI/2;u._v984Pass=u._v984Pass||((u.index%2)?1:-1);const dx=target.x-u.x,dy=target.y-u.y,d=Math.hypot(dx,dy)||1;let desired=Math.atan2(dy,dx);if(d<88)desired+=u._v984Pass*1.5;else if(d<160)desired+=u._v984Pass*.5;u.heading+=clamp(norm(desired-u.heading),-3.2*dt,3.2*dt);const speed=d>180?190:d>95?168:142,k=Math.min(1,dt*3.1);u.vx+=(Math.cos(u.heading)*speed-u.vx)*k;u.vy+=(Math.sin(u.heading)*speed-u.vy)*k;u.x+=u.vx*dt;u.y+=u.vy*dt;if(u.x<-38||u.x>g.w+38||u.y<58||u.y>g.hgt+38)steer984(u,g.cx,g.cy,dt,205,4.5)};
GP.v984SupportTarget=function(u,bossMode,field){
  if(this.priority&&this.validTarget?.(this.priority))return this.priority;
  const all=(this.en||[]).filter(e=>!e.dead),rocks=(this.rocks||[]).filter(r=>!r.dead&&r.hp>0);
  if(bossMode){const subs=this.boss?.subsystems?.filter(s=>!s.dead)||[];if(subs.length)return subs.sort((a,b)=>Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(b.x-u.x,b.y-u.y))[0];const adds=all.filter(e=>!e.boss);if(adds.length)return adds[0];return all.find(e=>e.boss)||null}
  const fighters=all.filter(e=>roleOf(e)<=1);if(fighters.length)return fighters.sort((a,b)=>Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(b.x-u.x,b.y-u.y))[0];
  if(rocks.length&&(field||u.index%3===0))return rocks.sort((a,b)=>Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(b.x-u.x,b.y-u.y))[0];
  return all.sort((a,b)=>Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(b.x-u.x,b.y-u.y))[0]||rocks[0]||null;
};
GP.allies=function(dt){
  const enc=this._v8Encounter,bossMode=this.bossState?.stage==='fight',field=String(enc?.type||'').includes('asteroid'),combat=enc?.type==='combat'&&!enc.complete;
  const hull=clamp(this.s?.hull|0,0,6),shield=this.v97ShipContact?.(true)||{rx:62+hull*4,ry:78+hull*4},def=(this.droneUnits||[]).filter(u=>u.def?.role==='defense'),off=(this.droneUnits||[]).filter(u=>u.def?.role!=='defense');
  this._v984DefOrbit=(this._v984DefOrbit||0)+dt*.92;this._v984OffOrbit=(this._v984OffOrbit||0)-dt*.72;
  const orbit=(list,isDef)=>list.forEach((u,i)=>{const d=u.def;if(!d)return;u.cd=(u.cd||0)-dt;u._v984FxCd=(u._v984FxCd||0)-dt;const a=(isDef?this._v984DefOrbit:this._v984OffOrbit)+i/Math.max(1,list.length)*Math.PI*2,ox=isDef?-4:8,oy=isDef?-4:8;u.angle=a;u.x=this.cx+Math.cos(a)*(shield.rx+ox);u.y=this.cy+Math.sin(a)*(shield.ry+oy);
    if(isDef){if(d.pd){const p=(this.bad||[]).find(p=>p.life>0&&Math.hypot(p.x-u.x,p.y-u.y)<76);if(p&&Math.random()<d.pd*12*dt){p.life=0;this.v984Fx('intercept',p.x,p.y,{life:.24,color:'#9df3ff'});R.audio?.play?.('drone')}}if(d.repair&&this.hp<this.maxHp){this.hp=Math.min(this.maxHp,this.hp+d.repair*dt);if(u._v984FxCd<=0){this.v984Fx('repairLink',u.x,u.y,{life:.34,tx:this.cx,ty:this.cy,color:'#7af0b7'});u._v984FxCd=.42}}if(d.shield&&this.shield<this.maxShield){this.shield=Math.min(this.maxShield,this.shield+this.maxShield*d.shield*dt);if(u._v984FxCd<=0){const k=1/Math.sqrt(((u.x-this.cx)/shield.rx)**2+((u.y-this.cy)/shield.ry)**2||1),tx=this.cx+(u.x-this.cx)*k,ty=this.cy+(u.y-this.cy)*k;this.v984Fx('shieldLink',u.x,u.y,{life:.34,tx,ty,color:'#6fe6ff'});u._v984FxCd=.38}}}
    else{let target=this.priority&&this.validTarget?.(this.priority)?this.priority:null;if(!target){const enemies=(this.en||[]).filter(e=>!e.dead&&Math.hypot(e.x-u.x,e.y-u.y)<330);target=enemies[0]||((field||combat)?(this.rocks||[]).find(r=>!r.dead&&r.hp>0&&Math.hypot(r.x-u.x,r.y-u.y)<330):null)}if(target&&u.cd<=0){this.v984FireFriendly(target,u,d,'drone');u.cd=1/((d.rate||1)*(this.mods.droneRate||1)*(this.droneBuff?1.8:1))}}
  });orbit(def,true);orbit(off,false);

  const supports=this.supportUnits||[];supports.forEach((u,i)=>{this.v984InitSupport(u);u.index=i;u._v984ShieldFlash=Math.max(0,(u._v984ShieldFlash||0)-dt*2.4);if(u._v984Respawn>0){u._v984Respawn-=dt;if(u._v984Respawn<=0){u._v984Hp=u._v984MaxHp;u._v984Shield=u._v984MaxShield;u._v984State='launch';u._v984LaunchT=0;u.x=this.cx;u.y=this.cy+16;u.vx=0;u.vy=0;this.v984Fx('hatch',this.cx,this.cy+20,{life:.85,color:'#7cecff'})}return}
    if(u._v984ShieldDelay>0)u._v984ShieldDelay-=dt;else if(u._v984Shield<u._v984MaxShield)u._v984Shield=Math.min(u._v984MaxShield,u._v984Shield+u._v984MaxShield*.12*dt);
    if(u._v984State==='launch'){u._v984LaunchT+=dt;const p=clamp(u._v984LaunchT/.9,0,1);u.x=this.cx+(i%2?1:-1)*18*p;u.y=this.cy+14+62*p;u.heading=Math.PI/2;u.vx=(i%2?1:-1)*22;u.vy=105;if(p>=1)u._v984State='combat';return}
    u.cd=(u.cd||0)-dt;const side=i%2?1:-1,row=i>>1,homeX=this.cx+side*(bossMode?48:76+row*20),homeY=this.cy+(bossMode?38+row*13:62+row*18),target=this.v984SupportTarget(u,bossMode,field),d=u.def;
    if(d.repair){steer984(u,homeX,homeY,dt,bossMode?150:165,3.2);if(this.hp<this.maxHp){this.hp=Math.min(this.maxHp,this.hp+d.repair*dt);u._v984FxCd=(u._v984FxCd||0)-dt;if(u._v984FxCd<=0){this.v984Fx('repairLink',u.x,u.y,{life:.4,tx:this.cx,ty:this.cy,color:'#76efae'});u._v984FxCd=.45}}return}
    if(bossMode)steer984(u,homeX,homeY,dt,160,3.8);else if((combat||field)&&target)fly984(this,u,target,dt);else steer984(u,homeX,homeY,dt,170,3.5);
    if(target&&u.cd<=0&&Math.hypot(target.x-u.x,target.y-u.y)<390){this.v984FireFriendly(target,u,d,'support');u.cd=1/((d.rate||.8)*(this.mods.escortRate||1)*(this.escortBuff?1.8:1))}
  });
};

// ---------------------------------------------------------------------------
// SUPPORT DAMAGE + ACCURATE FLAGSHIP HOSTILE CONTACT
// hotfix.12 owns player shots. This wrapper temporarily removes hostile shots,
// lets player shots resolve, then runs hostile contact against support ships,
// the real shield ellipse, and a fitted multi-circle flagship hull.
// ---------------------------------------------------------------------------
const projectiles984=GP.projectiles;
const segCircle=(x0,y0,x1,y1,cx,cy,r)=>{const dx=x1-x0,dy=y1-y0,fx=x0-cx,fy=y0-cy,A=dx*dx+dy*dy;if(A<1e-9)return fx*fx+fy*fy<=r*r?{t:0,x:x0,y:y0}:null;const C=fx*fx+fy*fy-r*r;if(C<=0)return{t:0,x:x0,y:y0};const B=2*(fx*dx+fy*dy),D=B*B-4*A*C;if(D<0)return null;const q=Math.sqrt(D),a=(-B-q)/(2*A),b=(-B+q)/(2*A),t=a>=0&&a<=1?a:b>=0&&b<=1?b:null;return t==null?null:{t,x:x0+dx*t,y:y0+dy*t}};
const segEllipse=(x0,y0,x1,y1,cx,cy,rx,ry)=>{const sx=(x0-cx)/rx,sy=(y0-cy)/ry,ex=(x1-cx)/rx,ey=(y1-cy)/ry,dx=ex-sx,dy=ey-sy,A=dx*dx+dy*dy;if(A<1e-9)return sx*sx+sy*sy<=1?{t:0,x:x0,y:y0}:null;const C=sx*sx+sy*sy-1;if(C<=0)return{t:0,x:x0,y:y0};const B=2*(sx*dx+sy*dy),D=B*B-4*A*C;if(D<0)return null;const q=Math.sqrt(D),a=(-B-q)/(2*A),b=(-B+q)/(2*A),t=a>=0&&a<=1?a:b>=0&&b<=1?b:null;return t==null?null:{t,x:x0+(x1-x0)*t,y:y0+(y1-y0)*t}};
GP.v984HullContact=function(x0,y0,x1,y1,pad=0){const h=clamp(this.s?.hull|0,0,6),z=34*(1+h*.11),parts=[[0,-.76,.22],[0,-.27,.34],[0,.23,.39],[-.45-h*.025,.19,.25],[.45+h*.025,.19,.25],[0,.58,.27]];let best=null;for(const [nx,ny,nr] of parts){const q=segCircle(x0,y0,x1,y1,this.cx+nx*z,this.cy+ny*z,z*nr+pad);if(q&&(!best||q.t<best.t))best=q}return best};
GP.projectiles=function(dt){
  const hostile=this.bad||[];this.bad=[];projectiles984.call(this,dt);this.bad=hostile;const shipShield=this.v97ShipContact?.(true)||{rx:66,ry:82};
  for(const p of this.bad){if(!p||p.life<=0)continue;if(p.homing){const a=Math.atan2(this.cy-p.y,this.cx-p.x),sp=Math.hypot(p.vx,p.vy)||1;p.vx+=(Math.cos(a)*sp-p.vx)*dt*.8;p.vy+=(Math.sin(a)*sp-p.vy)*dt*.8}const x0=p.x,y0=p.y,x1=x0+(p.vx||0)*dt,y1=y0+(p.vy||0)*dt;p.life-=dt;if((this.mods?.pd||0)>0&&Math.random()<this.mods.pd*dt*2){p.life=0;continue}
    let best=null,kind=null,obj=null;for(const u of this.supportUnits||[]){if(!activeSupport(u)||u._v984State==='launch')continue;const q=segCircle(x0,y0,x1,y1,u.x,u.y,10+(p.r||2));if(q&&(!best||q.t<best.t)){best=q;kind='support';obj=u}}
    const pad=(p.r||2.5)*.65;if(this.shield>0){const q=segEllipse(x0,y0,x1,y1,this.cx,this.cy,shipShield.rx+pad,shipShield.ry+pad);if(q&&(!best||q.t<best.t)){best=q;kind='shield';obj=null}}
    else{const q=this.v984HullContact(x0,y0,x1,y1,pad);if(q&&(!best||q.t<best.t)){best=q;kind='hull';obj=null}}
    if(best){p.x=best.x;p.y=best.y;if(kind==='support')this.v984SupportHit(obj,p.damage,best.x,best.y);else this.hitShip(p.damage,best.x,best.y);p.life=0;continue}p.x=x1;p.y=y1
  }this.bad=this.bad.filter(p=>p&&p.life>0&&p.x>-120&&p.x<this.w+120&&p.y>-120&&p.y<this.hgt+120)
};

// ---------------------------------------------------------------------------
// ENEMY SHIELDS + FIGHTER DOGFIGHT BEHAVIOR
// ---------------------------------------------------------------------------
const spawn984=GP.spawn;
GP.spawn=function(type,...args){const before=new Set(this.en||[]),out=spawn984.call(this,type,...args),fresh=out&&typeof out==='object'?out:(this.en||[]).find(e=>!before.has(e));if(fresh&&!fresh.boss&&!fresh._v984ShieldInit){fresh._v984ShieldInit=true;const role=roleOf(fresh),eligible=role>=2||(role<=1&&this.wave>=9&&Math.random()<.22);if(eligible){const base=Math.max(20,(fresh.max||fresh.hp||60)*(role>=4?.28:role>=2?.22:.16));fresh._v984MaxShield=base;fresh._v984Shield=base;fresh._v984ShieldDelay=0}}return out};
const damageTarget984=GP.damageTarget;
GP.damageTarget=function(t,d,...args){if(t&&!t.boss&&!t.parentBoss&&!t.rock&&t._v984MaxShield>0&&t._v984Shield>0){const hit=Math.min(t._v984Shield,d);t._v984Shield-=hit;d-=hit;t._v984ShieldDelay=2.35;t._v984ShieldFlash=.6;this.v984Fx('enemyShield',t.x,t.y,{life:.32,color:'#73dcff'});if(d<=0)return hit}return damageTarget984.call(this,t,d,...args)};
GP.v984FighterStep=function(e,dt,prev){if(!e||e.dead||e.boss||roleOf(e)>1||e._v92Entry>0||e.y<52)return;const supports=(this.supportUnits||[]).filter(activeSupport);if(!e._v984DogTarget||!activeSupport(e._v984DogTarget)||Math.random()<dt*.08)e._v984DogTarget=supports.length?supports[Math.random()*supports.length|0]:null;const t=e._v984DogTarget||{x:this.cx,y:this.cy},dx=t.x-prev.x,dy=t.y-prev.y,d=Math.hypot(dx,dy)||1;e._v984Heading=Number.isFinite(e._v984Heading)?e._v984Heading:Math.atan2(dy,dx);let desired=Math.atan2(dy,dx);if(d<80)desired+=(e._v984Side||(e._v984Side=Math.random()<.5?-1:1))*1.4;else if(d<145)desired+=(e._v984Side||1)*.38;e._v984Heading+=clamp(norm(desired-e._v984Heading),-2.9*dt,2.9*dt);const speed=135+Math.min(55,this.wave*.7),k=Math.min(1,dt*3);e._v984Vx=(e._v984Vx||0)+(Math.cos(e._v984Heading)*speed-(e._v984Vx||0))*k;e._v984Vy=(e._v984Vy||0)+(Math.sin(e._v984Heading)*speed-(e._v984Vy||0))*k;e.x=prev.x+e._v984Vx*dt;e.y=prev.y+e._v984Vy*dt;e.x=clamp(e.x,-30,this.w+30);e.y=clamp(e.y,48,this.hgt*.72);if(e._v984DogTarget){e._v984DogCd=(e._v984DogCd||(.4+Math.random()))-dt;if(e._v984DogCd<=0&&d<310){const a=Math.atan2(t.y-e.y,t.x-e.x),sp=300+(this.wave*.7);this.bad.push({x:e.x,y:e.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,damage:Math.max(3,(e.damage||5)*.7),life:2.2,r:2.1,color:'#ff9f7d'});e._v984DogCd=.9+Math.random()*.8}}};

// ---------------------------------------------------------------------------
// ASTEROIDS — ambient normal-wave traffic + dedicated 20 second fields.
// ---------------------------------------------------------------------------
// Disable the previous acceptance ambient spawner so only one controller owns normal-wave rocks.
GP.v981SpawnAmbientRock=function(){return null};
GP.v984SpawnRock=function(field=false){const edge=Math.random()*4|0,size=Math.random()<.16?3:Math.random()<.58?2:1,rich=Math.random()<.13,r=size===3?37:size===2?26:16,speed=(field?34:25)+Math.random()*(field?34:24);let x,y,vx,vy;if(edge===0){x=-r*.6;y=92+Math.random()*Math.max(80,this.hgt-190);vx=speed;vy=(Math.random()-.5)*20}else if(edge===1){x=this.w+r*.6;y=92+Math.random()*Math.max(80,this.hgt-190);vx=-speed;vy=(Math.random()-.5)*20}else if(edge===2){x=28+Math.random()*Math.max(40,this.w-56);y=-r*.6;vx=(Math.random()-.5)*20;vy=speed}else{x=28+Math.random()*Math.max(40,this.w-56);y=this.hgt+r*.6;vx=(Math.random()-.5)*20;vy=-speed}let rock=this._v8MakeRock?.(size,rich,x,y);if(!rock)rock={rock:true,x,y,r,hp:(rich?260:150)+this.wave*4,max:(rich?260:150)+this.wave*4,value:Math.round((rich?125:48)+this.wave*(rich?3:1.4)),rich,spin:Math.random()*6};rock.x=x;rock.y=y;rock.vx=vx;rock.vy=vy;rock.r=rock.r||r;rock._v8Size=rock._v8Size||size;rock._v984Field=field;rock._v984Ambient=!field;rock._v97Entered=true;(this.rocks||(this.rocks=[])).push(rock);return rock};
GP._v8BeginAsteroids=function(wave,sector){this._v8Encounter={type:'asteroid-intro',wave,sector,complete:false};this.en=[];this.bad=[];this.tele=[];this.rocks=[];this.active=true;this.count=999;this.paused=true;this.v83SetWaveHUD?.(wave,sector,'RESOURCE FIELD');const go=()=>{this.paused=false;this._v8Encounter={type:'asteroid984',wave,sector,complete:false,timed:true,timeLeft:20,spawnCooldown:0,cap:Math.min(16,10+Math.floor(wave/20)*2),drain:0};this.en=[];this.bad=[];this.tele=[];this.rocks=[];this.active=true;this.count=999;for(let i=0;i<7;i++)this.v984SpawnRock(true);let timer=$('#v984FieldTimer');if(timer)timer.remove();timer=E('div','v984FieldTimer');timer.id='v984FieldTimer';timer.innerHTML='<small>ASTEROID FIELD</small><b>20.0</b>';document.body.append(timer)};if(this.v83Warning)this.v83Warning({kicker:'SENSOR // RESOURCE CONTACT',title:'ASTEROID FIELD',sub:'20 SECOND MINING WINDOW',color:'#8fc7d9'},go);else go()};
const damageRock984=GP.damageRock;
GP.damageRock=function(r,d,...args){const size=r?._v8Size||1,vx=r?.vx||0,vy=r?.vy||0,x=r?.x,y=r?.y,rich=r?.rich,was=(r?.hp||0)>0,out=damageRock984.call(this,r,d,...args);if(was&&this._v8Encounter?.type==='asteroid984'&&r&&(r.dead||r.hp<=0)&&size>1&&!r._v984Split){r._v984Split=true;for(let i=0;i<2;i++){const c=this._v8MakeRock?.(size-1,rich,x+(i?5:-5),y);if(!c)continue;const a=Math.atan2(vy,vx||1)+(i?1:-1)*(.42+Math.random()*.18),sp=Math.max(38,Math.hypot(vx,vy))*(.72+Math.random()*.15);c.vx=vx*.42+Math.cos(a)*sp;c.vy=vy*.42+Math.sin(a)*sp;c._v8Size=size-1;c._v984Field=true;c._v97Entered=true;this.rocks.push(c)}}return out};

// ---------------------------------------------------------------------------
// ENGINEER VISUAL + TRADE POLISH
// ---------------------------------------------------------------------------
GP.v98DrawEngineer=function(){const s=this._v98Engineer;if(!s||!this.x)return;const x=this.x,w=this.w,h=this.hgt,cy=s.centerY,len=h*2.45,top=cy-len*.5,bottom=cy+len*.5,L=w*.07,RX=w*.93,innerL=w*.30,innerR=w*.70,cols=['#ff9b36','#71df91','#69c8ff','#ff6a62','#f4dc59','#b67cff','#f5f7ff'];x.save();const grad=x.createLinearGradient(0,top,0,bottom);grad.addColorStop(0,'#1c1008');grad.addColorStop(.48,'#5a2f12');grad.addColorStop(1,'#21130b');x.fillStyle=grad;x.strokeStyle='#c87a35';x.lineWidth=2.4;const side=flip=>{const a=flip?RX:L,b=flip?innerR:innerL,sgn=flip?-1:1;x.beginPath();x.moveTo(a,top);x.lineTo(b,top+len*.10);x.lineTo(b+sgn*w*.025,bottom-len*.10);x.lineTo(a-sgn*w*.03,bottom);x.lineTo(a-sgn*w*.11,bottom-len*.28);x.lineTo(a-sgn*w*.08,top+len*.24);x.closePath();x.fill();x.stroke()};side(false);side(true);x.fillStyle='#120d09';x.strokeStyle='#a65b27';x.beginPath();x.moveTo(innerL,top+len*.10);x.lineTo(innerR,top+len*.10);x.lineTo(innerR+w*.025,bottom-len*.10);x.lineTo(innerL-w*.025,bottom-len*.10);x.closePath();x.fill();x.stroke();x.lineWidth=1.2;for(let i=0;i<21;i++){const yy=top+len*(.12+i*.038),c=cols[i%cols.length];x.strokeStyle=c;x.globalAlpha=.20+.18*Math.sin((this.t||0)*1.8+i*.7);x.beginPath();x.moveTo(L+w*.045,yy);x.lineTo(innerL-w*.018,yy+8);x.moveTo(innerR+w*.018,yy+8);x.lineTo(RX-w*.045,yy);x.stroke()}x.globalAlpha=1;for(let i=0;i<14;i++){const yy=top+len*(.15+i*.055),c=cols[(i*3)%cols.length];x.fillStyle=c;x.globalAlpha=.36+.22*Math.sin((this.t||0)*2.1+i);x.fillRect(L+w*.072,yy,5,15);x.fillRect(RX-w*.072-5,yy,5,15)}x.globalAlpha=1;x.strokeStyle='#ffb357';x.lineWidth=2.4;x.beginPath();x.moveTo(w*.405,bottom-len*.17);x.lineTo(w*.5,bottom-len*.075);x.lineTo(w*.595,bottom-len*.17);x.stroke();x.restore();const draw=R.v97DrawFlagship||R.drawFlagshipDisplay;if(typeof draw==='function'){const hull=clamp(this.s?.hull|0,0,6),save={hull,weaponMounts:[...(this.s?.weapons||[])],equippedDrones:[],equippedSupports:[]};draw(x,this.cx,this.cy,(1+hull*.11)*(this._v98PlayerScale||1),save,{t:this.t||0,shield:this.shield>0,weaponTargets:this.weaponTargets||[]})}};
GP.v98OpenEngineerTrade=function(){if($('#engineerTrader'))return;const pool=(R.CARDS||[]).filter(c=>['legendary','mythic'].includes(c.rarity)&&!this.cards.includes(c.id)),picks=[];while(picks.length<3&&pool.length){const c=pool.splice(Math.random()*pool.length|0,1)[0];if(c)picks.push(c)}const fee=Math.round(550+this.wave*45),o=E('div','engineerTrader v98EngineerTrade');o.id='engineerTrader';o.innerHTML=`<div class="v98TradeCard"><small>GALACTIC ENGINEERS // EXCHANGE CHANNEL</small><h2>THREE THINGS. ONE CHOICE.</h2><p>Select a technology for <b>▰ ${Math.round(fee)}</b>, or decline and continue the expedition.</p><div class="v98TradeChoices"></div><button class="btn quiet v984Decline" data-skip>DECLINE TRADE / CONTINUE</button></div>`;document.body.append(o);const g=o.querySelector('.v98TradeChoices');if(!picks.length)g.innerHTML='<div class="v98NoTrade">NO NEW PREMIUM TECHNOLOGY AVAILABLE</div>';picks.forEach(c=>{const b=E('button',`v98Trade v984Rarity ${c.rarity||''}`,`<i>${c.icon||'◇'}</i><b>${c.name}</b><span>${R.RARITIES?.[c.rarity]?.name||String(c.rarity||'TECH').toUpperCase()}</span><small>${c.desc||''}</small><em>▰ ${Math.round(fee)}</em>`);if(this.salvage<fee)b.classList.add('unaffordable');b.onclick=()=>{if(this.salvage<fee){this.app?.deny?.('NEED SALVAGE');return}this.salvage-=fee;this.applyCard(c);o.remove();this.v98EngineerDepart()};g.append(b)});o.querySelector('[data-skip]').onclick=()=>{o.remove();this.v98EngineerDepart()}};

// ---------------------------------------------------------------------------
// UPDATE: fighter replacement motion, shield recharge, ambient rocks, 20s field.
// ---------------------------------------------------------------------------
const update984=GP.update;
GP.update=function(dt){const prev=new Map();for(const e of this.en||[])if(!e.dead&&!e.boss&&roleOf(e)<=1)prev.set(e,{x:e.x,y:e.y});const out=update984.call(this,dt);for(const fx of this._v984Fx||[])fx.life-=dt;this._v984Fx=(this._v984Fx||[]).filter(f=>f.life>0);if(this.dead||this.paused)return out;
  for(const e of this.en||[]){if(e._v984ShieldFlash)e._v984ShieldFlash=Math.max(0,e._v984ShieldFlash-dt*2.3);if(e._v984MaxShield>0){if(e._v984ShieldDelay>0)e._v984ShieldDelay-=dt;else if(e._v984Shield<e._v984MaxShield)e._v984Shield=Math.min(e._v984MaxShield,e._v984Shield+e._v984MaxShield*.075*dt)}const p=prev.get(e);if(p)this.v984FighterStep(e,dt,p)}
  const enc=this._v8Encounter;
  if(enc?.type==='combat'&&!enc.complete&&!this.bossState){this._v984AmbientClock=(this._v984AmbientClock??1.8)-dt;const live=(this.rocks||[]).filter(r=>r._v984Ambient&&!r.dead).length;if(this._v984AmbientClock<=0&&live<3){this.v984SpawnRock(false);this._v984AmbientClock=3.8+Math.random()*4.2}}
  else if(enc?.type!=='asteroid984')this._v984AmbientClock=null;
  if(enc?.type==='asteroid984'){this.en=[];this.bad=[];this.tele=[];this.active=true;this.count=999;const timer=$('#v984FieldTimer');if(enc.timeLeft>0){enc.timeLeft=Math.max(0,enc.timeLeft-dt);enc.spawnCooldown-=dt;if(timer)timer.querySelector('b').textContent=enc.timeLeft.toFixed(1);const live=(this.rocks||[]).filter(r=>!r.dead).length;if(enc.spawnCooldown<=0&&live<enc.cap){this.v984SpawnRock(true);enc.spawnCooldown=.28+Math.random()*.34}if(enc.timeLeft<=0){enc.drain=.001;if(timer){timer.classList.add('done');timer.querySelector('b').textContent='CLEAR'}}}else{enc.drain=(enc.drain||0)+dt;if(timer)timer.querySelector('b').textContent='CLEAR';if(enc.drain>1.35){$('#v984FieldTimer')?.remove();this.rocks=[];enc.timed=false;enc.type='asteroid';enc.complete=false;this.active=false;this.count=.8;this._v8FinishEncounter?.()}}}
  return out};

// ---------------------------------------------------------------------------
// DRAW: suppress legacy ally glyphs, then draw one canonical fleet layer,
// localized effects, enemy shields, and stronger engine trails.
// ---------------------------------------------------------------------------
const draw984=GP.draw;
GP.draw=function(){const su=this.supportUnits,du=this.droneUnits;this.supportUnits=[];this.droneUnits=[];let out;try{out=draw984.call(this)}finally{this.supportUnits=su;this.droneUnits=du}const x=this.x;if(!x)return out;
  // Enemy shields + trails.
  for(const e of this.en||[]){if(e.dead)continue;const heading=Number.isFinite(e._v984Heading)?e._v984Heading:Math.atan2((e.vy||18),(e.vx||0)),speed=Math.hypot(e._v984Vx||e.vx||0,e._v984Vy||e.vy||0),sz=clamp((e.size||10)/14,.65,2.3);R.v984DrawEngineTrail(x,e.x,e.y,heading,sz*.55,clamp(speed/170,.18,.8),e.type?.void?'#b37cff':'#ff987a');if((e._v984Shield||0)>0){x.save();x.globalAlpha=.10+(e._v984ShieldFlash||0)*.34;x.strokeStyle=e.type?.color||'#72ddff';x.lineWidth=1.15;x.beginPath();x.ellipse(e.x,e.y,(e.size||12)*1.35,(e.size||12)*1.5,0,0,Math.PI*2);x.stroke();x.restore()}}
  // Flagship trail.
  R.v984DrawEngineTrail(x,this.cx,this.cy+32,-Math.PI/2,1.25,.42,'#70e2ff');
  // Canonical drones and support craft. Engineer docking owns the foreground while active.
  if(!this._v98Engineer){for(const u of this.droneUnits||[])R.v984DrawDrone(x,u,u.def);for(const u of this.supportUnits||[]){if(!activeSupport(u))continue;R.v984DrawSupport(x,u,u.def,{health:true})}}
  // Local player shield ripples from the exact contact points recorded by v0.9.7.
  for(const h of this._v97ShieldHits||[]){const p=clamp(h.life/Math.max(.001,h.max||.42),0,1),r=(1-p)*24+5;x.save();x.globalAlpha=p*.55;x.strokeStyle='#85edff';x.lineWidth=1.4;x.beginPath();x.arc(this.cx+h.dx,this.cy+h.dy,r,0,Math.PI*2);x.stroke();x.restore()}
  // Foundation FX.
  for(const f of this._v984Fx||[]){const p=clamp(f.life/Math.max(.001,f.max),0,1);x.save();x.globalAlpha=p;x.strokeStyle=f.color||'#fff';x.fillStyle=f.color||'#fff';x.lineWidth=1.5;if(f.kind==='repairLink'||f.kind==='shieldLink'){x.beginPath();x.moveTo(f.x,f.y);x.lineTo(f.tx,f.ty);x.stroke();x.beginPath();x.arc(f.tx,f.ty,(1-p)*10+2,0,Math.PI*2);x.stroke()}else if(f.kind==='supportBoom'){x.beginPath();x.arc(f.x,f.y,(1-p)*24+4,0,Math.PI*2);x.stroke();for(let i=0;i<6;i++){const a=i/6*Math.PI*2;x.beginPath();x.moveTo(f.x,f.y);x.lineTo(f.x+Math.cos(a)*(1-p)*30,f.y+Math.sin(a)*(1-p)*30);x.stroke()}}else if(f.kind==='hatch'){x.beginPath();x.arc(f.x,f.y,(1-p)*15+3,0,Math.PI*2);x.stroke()}else{x.beginPath();x.arc(f.x,f.y,(1-p)*10+2,0,Math.PI*2);x.stroke()}x.restore()}
  // Travel/exploration streaks during inter-wave motion.
  if(!this.active&&!this.dead&&this.count>0){x.save();x.globalAlpha=.12;for(let i=0;i<10;i++){const sx=(i*83+(this.t||0)*37)%this.w,sy=(i*127+(this.t||0)*64)%this.hgt;x.strokeStyle='#bfefff';x.beginPath();x.moveTo(sx,sy);x.lineTo(sx,sy+18);x.stroke()}x.restore()}
  return out};

})();
