(()=>{
'use strict';
const R=window.SR;if(!R?.Game)return;
const GP=R.Game.prototype,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const priorEngineerDraw=GP.v98DrawEngineer;
if(priorEngineerDraw)GP.v98DrawEngineer=function(){
  priorEngineerDraw.call(this);
  const s=this._v98Engineer,x=this.x;if(!s||!x)return;
  const w=this.w,h=this.hgt,cy=s.centerY,len=h*2.45,top=cy-len*.5,bottom=cy+len*.5,innerL=w*.31,innerR=w*.69;
  // Opaque docking throat hides the normal combat-scale formation before we
  // redraw the whole player group at Engineer-scene scale.
  x.save();x.fillStyle='rgba(3,8,12,.97)';x.strokeStyle='rgba(95,135,151,.72)';x.lineWidth=1.5;x.beginPath();x.moveTo(innerL,top+len*.10);x.lineTo(innerR,top+len*.10);x.lineTo(innerR+w*.025,bottom-len*.10);x.lineTo(innerL-w*.025,bottom-len*.10);x.closePath();x.fill();x.stroke();
  const hull=clamp(this.s?.hull|0,0,6),shrink=this._v98PlayerScale||1,save={hull,weaponMounts:[...(this.s?.weapons||[])],equippedDrones:[...(this.s?.equippedDrones||[])],equippedSupports:[...(this.s?.equippedSupports||[])]},draw=R.v97DrawFlagship||R.drawFlagshipDisplay;
  if(typeof draw==='function')draw(x,this.cx,this.cy,(1+hull*.11)*shrink,save,{t:this.t||0,shield:this.shield>0,weaponTargets:this.weaponTargets||[]});
  x.restore();
};
})();
