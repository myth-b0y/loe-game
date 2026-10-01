(()=>{
'use strict';
const R=window.SR,V=R?.V10;if(!R?.Game||!V)throw new Error('V1.2.1 systems require v10 runtime');
const GP=R.Game.prototype,clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
const AUX_COLORS=['#9f8cff','#aa91ff','#b69cff','#c3a8ff','#cfb4ff'];
const rank=g=>Math.max(0,Number(V.rank?.(g,'layered'))||0);
const stat=(g,key)=>Number(V.stat?.(g,'layered',key))||0;
const now=()=>performance.now()/1000;

const config=g=>{
 const rr=rank(g);if(!rr||!(Number(g.maxShield)>0))return null;
 const total=Math.max(2,Math.round(stat(g,'layers')||2)),count=Math.max(1,total-1),capacity=Math.max(0,stat(g,'capacity')),overflow=clamp(stat(g,'overflow'),0,.8);
 return{rank:rr,total,count,capacity,overflow,mainMax:Math.max(1,Number(g.maxShield)||1)};
};

const preserveLayer=(old,max)=>{
 if(!old)return{hp:max,max,delay:0,broken:false,reform:0,flash:0,breakFx:0,reformFx:.38,impact:null};
 const pct=old.max>0?clamp(old.hp/old.max,0,1):0;
 return{...old,max,hp:old.broken?0:max*pct};
};

V.ensureLayeredShields=g=>{
 const cfg=config(g);if(!cfg){g._v121Layered=null;return null}
 const per=Math.max(.5,cfg.mainMax*cfg.capacity/cfg.count),sig=`${cfg.rank}:${cfg.count}:${Math.round(cfg.mainMax*100)/100}:${Math.round(cfg.capacity*1000)}`;
 let st=g._v121Layered;
 if(!st||st.sig!==sig){
   const prior=st?.layers||[];
   st={sig,rank:cfg.rank,count:cfg.count,total:cfg.total,capacity:cfg.capacity,overflow:cfg.overflow,per,layers:Array.from({length:cfg.count},(_,i)=>preserveLayer(prior[i],per))};
   g._v121Layered=st;
 }
 st.overflow=cfg.overflow;return st;
};

const outerLive=st=>{if(!st)return-1;for(let i=st.layers.length-1;i>=0;i--)if(!st.layers[i].broken&&st.layers[i].hp>0)return i;return-1};
const hasLive=st=>outerLive(st)>=0;
const radiusScale=i=>({x:1+.065*(i+1),y:1+.055*(i+1)});
V.v121LayeredState=g=>V.ensureLayeredShields(g);

// Expand the actual shield collision ellipse to the outermost living mini-shield.
const contact121=GP.v97ShipContact;
if(contact121)GP.v97ShipContact=function(shield=true,pad=0){
 const q=contact121.call(this,shield,pad);if(!shield||!q)return q;
 const st=V.ensureLayeredShields(this),i=outerLive(st);if(i<0)return q;const k=radiusScale(i);
 return{...q,rx:q.rx*k.x,ry:q.ry*k.y,_v121Layer:i};
};

// Layered Field shells take damage from the outside inward. Each shell owns its
// HP, recharge delay, break state, reform timer and impact feedback.
const hit121=GP.hitShip;
GP.hitShip=function(d,x=this.cx,y=this.cy){
 let damage=Math.max(0,Number(d)||0);const st=V.ensureLayeredShields(this);
 if(st&&damage>0){
   while(damage>0){
     const i=outerLive(st);if(i<0)break;const layer=st.layers[i],take=Math.min(layer.hp,damage);
     layer.hp=Math.max(0,layer.hp-take);damage-=take;layer.delay=2.5;layer.flash=Math.max(layer.flash,.62);layer.impact={x,y,life:.34,max:.34};
     this.v984Fx?.('shieldHit',x,y,{life:.28,color:AUX_COLORS[i%AUX_COLORS.length]});
     if(layer.hp<=0){
       layer.hp=0;layer.broken=true;layer.reform=4.8;layer.breakFx=.82;layer.flash=0;damage*=1-st.overflow;
       this.v984Fx?.('shieldHit',x,y,{life:.48,color:AUX_COLORS[i%AUX_COLORS.length],burst:true});
     }else damage=0;
   }
 }
 if(damage<=0)return;
 // During projectile collision we may temporarily expose an epsilon main shield
 // solely so the canonical collision path can see regenerated auxiliary shells.
 if(this._v121FakeMainShield&&outerLive(st)<0)this.shield=0;
 return hit121.call(this,damage,x,y);
};

// Canonical projectile collision historically checked main shield HP before using
// shield geometry. An epsilon sentinel keeps regenerated auxiliary shells collidable
// even while the main field is broken, without giving the main field real HP.
const projectiles121=GP.projectiles;
if(projectiles121)GP.projectiles=function(dt){
 const st=V.ensureLayeredShields(this),actual=Number(this.shield)||0,fake=actual<=0&&hasLive(st);
 if(fake){this._v121FakeMainShield=true;this.shield=1e-7}
 try{return projectiles121.call(this,dt)}finally{
   if(fake&&this._v121FakeMainShield&&this.shield<=1e-6)this.shield=0;
   this._v121FakeMainShield=false;
 }
};

const updateLayers=(g,dt)=>{
 const st=V.ensureLayeredShields(g);if(!st)return;
 for(const l of st.layers){
   l.delay=Math.max(0,(l.delay||0)-dt);l.flash=Math.max(0,(l.flash||0)-dt*2.7);l.breakFx=Math.max(0,(l.breakFx||0)-dt);l.reformFx=Math.max(0,(l.reformFx||0)-dt*1.8);
   if(l.impact){l.impact.life-=dt;if(l.impact.life<=0)l.impact=null}
   if(!l.broken&&l.delay<=0&&l.hp<l.max){
     const canonical=Math.max(0,Number(g.mods?.shieldRegen)||0)/Math.max(1,st.count),regen=l.max*.10+canonical;
     l.hp=Math.min(l.max,l.hp+regen*dt);
   }
 }
 // Broken shells come back from the inside outward. Living-but-damaged shells
 // still regenerate independently while a deeper broken shell reforms.
 const next=st.layers.findIndex(l=>l.broken);
 if(next>=0){const l=st.layers[next];l.reform=Math.max(0,(l.reform||0)-dt);if(l.reform<=0){l.broken=false;l.hp=l.max*.18;l.delay=1.1;l.reformFx=.72;l.flash=.28;g.v984Fx?.('shieldLink',g.cx,g.cy,{life:.5,tx:g.cx,ty:g.cy-30,color:AUX_COLORS[next%AUX_COLORS.length]})}}
};

const update121=GP.update;
GP.update=function(dt){const out=update121.call(this,dt);if(!this.dead)updateLayers(this,dt);return out};

const drawLayered=(g,x,base)=>{
 const st=V.ensureLayeredShields(g);if(!st||!x||!base)return;const t=now();
 x.save();
 for(let i=0;i<st.layers.length;i++){
   const l=st.layers[i],k=radiusScale(i),rx=base.rx*k.x,ry=base.ry*k.y,color=AUX_COLORS[i%AUX_COLORS.length];
   if(!l.broken&&l.hp>0){
     const pct=clamp(l.hp/Math.max(.01,l.max),0,1),flash=clamp(l.flash||0,0,1);
     x.strokeStyle=color;x.lineWidth=1.1+1.1*pct;x.globalAlpha=.10+.18*pct+.24*flash;x.beginPath();x.ellipse(g.cx,g.cy,rx,ry,0,0,Math.PI*2);x.stroke();
     if(flash>0){x.globalCompositeOperation='screen';x.fillStyle=color;x.globalAlpha=.055+.16*flash;x.beginPath();x.ellipse(g.cx,g.cy,rx,ry,0,0,Math.PI*2);x.fill();x.globalCompositeOperation='source-over'}
     if(l.delay<=0&&pct<.999){x.strokeStyle=color;x.globalAlpha=.18;x.lineWidth=.9;x.setLineDash([3,7]);x.lineDashOffset=-t*18*(i+1);x.beginPath();x.ellipse(g.cx,g.cy,rx-1.5,ry-1.5,0,0,Math.PI*2);x.stroke();x.setLineDash([])}
     if(l.impact){const p=clamp(l.impact.life/l.impact.max,0,1);x.globalCompositeOperation='screen';x.strokeStyle=color;x.globalAlpha=.65*p;x.lineWidth=1.2+2*p;x.beginPath();x.arc(l.impact.x,l.impact.y,4+(1-p)*15,0,Math.PI*2);x.stroke();x.globalCompositeOperation='source-over'}
     if(l.reformFx>0){const p=clamp(l.reformFx/.72,0,1);x.strokeStyle=color;x.globalAlpha=.5*p;x.lineWidth=1+2*p;x.setLineDash([5,5]);x.beginPath();x.ellipse(g.cx,g.cy,rx*(1.05-.05*p),ry*(1.05-.05*p),0,0,Math.PI*2);x.stroke();x.setLineDash([])}
   }
   if(l.breakFx>0){
     const p=clamp(l.breakFx/.82,0,1),grow=1+(1-p)*.18;x.strokeStyle=color;x.globalAlpha=.68*p;x.lineWidth=1.2+2.4*p;x.setLineDash([6,6]);x.beginPath();x.ellipse(g.cx,g.cy,rx*grow,ry*grow,0,0,Math.PI*2);x.stroke();x.setLineDash([]);
     for(let n=0;n<8;n++){const a=n/8*Math.PI*2+(1-p)*.22;x.beginPath();x.moveTo(g.cx+Math.cos(a)*rx*.92,g.cy+Math.sin(a)*ry*.92);x.lineTo(g.cx+Math.cos(a)*rx*(1.05+(1-p)*.22),g.cy+Math.sin(a)*ry*(1.05+(1-p)*.22));x.stroke()}
   }
 }
 x.restore();
};

// Suppress the old decorative Layered Field rings and replace them with the real
// per-shell renderer. Citadel Halo keeps its existing Evolution presentation.
const draw121=GP.draw;
GP.draw=function(){
 const layered=rank(this)>0,rankFn=V.rank;let out;
 if(layered){V.rank=(g,id)=>id==='layered'&&g===this?0:rankFn(g,id);try{out=draw121.call(this)}finally{V.rank=rankFn}}
 else out=draw121.call(this);
 if(layered&&this.x&&!this.dead){const base=contact121?.call(this,true,0)||{rx:68,ry:82};drawLayered(this,this.x,base)}
 return out;
};
})();
