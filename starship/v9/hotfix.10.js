(()=>{
'use strict';
const R=window.SR;if(!R?.Game)return;
const GP=R.Game.prototype,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const priorEngineerDraw=GP.v98DrawEngineer;
if(priorEngineerDraw)GP.v98DrawEngineer=function(){
  priorEngineerDraw.call(this);
  const s=this._v98Engineer,x=this.x;if(!s||!x)return;
  const w=this.w,h=this.hgt,cy=s.centerY,len=h*2.45,top=cy-len*.5,bottom=cy+len*.5,innerL=w*.31,innerR=w*.69;
  x.save();x.fillStyle='rgba(3,8,12,.97)';x.strokeStyle='rgba(95,135,151,.72)';x.lineWidth=1.5;x.beginPath();x.moveTo(innerL,top+len*.10);x.lineTo(innerR,top+len*.10);x.lineTo(innerR+w*.025,bottom-len*.10);x.lineTo(innerL-w*.025,bottom-len*.10);x.closePath();x.fill();x.stroke();
  const hull=clamp(this.s?.hull|0,0,6),shrink=this._v98PlayerScale||1,save={hull,weaponMounts:[...(this.s?.weapons||[])],equippedDrones:[...(this.s?.equippedDrones||[])],equippedSupports:[...(this.s?.equippedSupports||[])]},draw=R.v97DrawFlagship||R.drawFlagshipDisplay;
  if(typeof draw==='function')draw(x,this.cx,this.cy,(1+hull*.11)*shrink,save,{t:this.t||0,shield:this.shield>0,weaponTargets:this.weaponTargets||[]});
  x.restore();
};

// HOME SCREEN COMPATIBILITY BRIDGE
const loaderVersion=()=>{
  const el=document.querySelector('script[src*="loader-v9.js"]');
  if(!el)return'';
  try{return new URL(el.src,location.href).searchParams.get('v')||''}catch{return''}
};
const versionCode=v=>{const p=String(v||'').split('.').map(n=>Number(n)||0);return(p[0]||0)*10000+(p[1]||0)*100+(p[2]||0)};
const compatFetch=async path=>{
  const sep=path.includes('?')?'&':'?',url=path+sep+'compat=9.9.10&t='+Date.now();
  const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw new Error('COMPAT '+path);return r.text();
};
const compatEval=async path=>(0,eval)(await compatFetch(path));
const compatJoinEval=async(root,name,count)=>{let code='';for(let i=0;i<count;i++)code+=await compatFetch(`${root}${name}.${i}.txt`);return(0,eval)(code)};
const compatStyle=async path=>{
  const key='v99-'+path.replace(/[^a-z0-9]/gi,'-');if(document.querySelector(`style[data-compat="${key}"]`))return;
  const s=document.createElement('style');s.dataset.compat=key;s.textContent=await compatFetch(path);document.head.append(s);
};
const inferCode=()=>{
  const direct=versionCode(loaderVersion());if(direct)return direct;
  if(R._v99SupportProgress20)return 90910;
  if(R.effectiveFlightDevelopment)return 90909;
  if(R.FOUNDATION_RD)return 90903;
  if(String(R.VERSION||'').startsWith('0.9.9'))return 90900;
  return 90804;
};
const runHomeCompat=async()=>{
  if(R._v99HomeCompatRunning)return;
  const code=inferCode();if(code>=90910)return;
  R._v99HomeCompatRunning=true;
  try{
    if(code<90802){await compatStyle('./v9/style.7.css');await compatEval('./v9/hotfix.11.js')}
    if(code<90803)await compatEval('./v9/hotfix.12.js');
    if(code<90804){await compatStyle('./v9/style.8.css');await compatEval('./v9/hotfix.13.js')}
    if(code<90900)await compatEval('./v9/hotfix.14.js');
    if(code<90901)await compatEval('./v9/hotfix.15.js');
    if(code<90903){await compatStyle('./v9/style.9.css');await compatJoinEval('./v9/','hotfix.16',5)}
    if(code<90905)await compatEval('./v9/hotfix.17.js');
    if(code<90906)await compatEval('./v9/hotfix.18.js');
    if(code<90909)await compatEval('./v9/hotfix.19.js');
    if(code<90910)await compatEval('./v9/hotfix.20.js');
    R.VERSION='0.9.9';
    if(R.app?.s){R.app.s=R.migrate?.(R.app.s)||R.app.s;R.app.s.version='0.9.9';try{R.save?.(R.app.s)}catch{}}
    R._v99HomeCompatLoaded=true;
  }catch(e){console.error('[STARSHIP] Home Screen compatibility update failed',e)}finally{R._v99HomeCompatRunning=false}
};
setTimeout(runHomeCompat,700);

})();
