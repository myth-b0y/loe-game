(()=>{
'use strict';
const R=window.SR;if(!R)return;
R.VERSION='0.9.1';
const AP=R.App?.prototype;
const syncVersionText=()=>{
  R.VERSION='0.9.1';
  if(R.app?.s){R.app.s.version='0.9.1';try{R.save?.(R.app.s)}catch{}}
  const root=document.body;if(!root)return;
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  let n;while((n=walker.nextNode())){if(n.nodeValue&&n.nodeValue.includes('0.9.0'))n.nodeValue=n.nodeValue.replaceAll('0.9.0','0.9.1');}
};
if(AP){
  const oldMain=AP.main;if(oldMain)AP.main=function(...args){R.VERSION='0.9.1';const out=oldMain.apply(this,args);requestAnimationFrame(syncVersionText);return out};
  const oldStation=AP.station;if(oldStation)AP.station=function(...args){R.VERSION='0.9.1';const out=oldStation.apply(this,args);requestAnimationFrame(syncVersionText);return out};
}
requestAnimationFrame(syncVersionText);
setTimeout(syncVersionText,120);
})();