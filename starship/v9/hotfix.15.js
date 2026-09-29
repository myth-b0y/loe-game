(()=>{
'use strict';
const R=window.SR;if(!R?.App)return;
const AP=R.App.prototype;
const fixText=node=>{
  if(!node)return;
  if(node.nodeType===Node.TEXT_NODE){
    if(node.nodeValue&&/0\.9\.[0-8]/.test(node.nodeValue))node.nodeValue=node.nodeValue.replace(/0\.9\.[0-8]/g,'0.9.9');
    return;
  }
  if(node.nodeType!==Node.ELEMENT_NODE&&node.nodeType!==Node.DOCUMENT_FRAGMENT_NODE)return;
  const w=document.createTreeWalker(node,NodeFilter.SHOW_TEXT);let n;
  while((n=w.nextNode()))if(n.nodeValue&&/0\.9\.[0-8]/.test(n.nodeValue))n.nodeValue=n.nodeValue.replace(/0\.9\.[0-8]/g,'0.9.9');
};
const sync99=()=>{
  R.VERSION='0.9.9';
  if(R.app?.s){R.app.s.version='0.9.9';try{R.save?.(R.app.s)}catch{}}
  fixText(document.body);
};
const settle99=()=>{
  sync99();
  requestAnimationFrame(()=>{sync99();requestAnimationFrame(sync99)});
  setTimeout(sync99,240);
};
for(const k of ['main','station','settings','slots']){
  const fn=AP[k];if(typeof fn!=='function')continue;
  AP[k]=function(...args){R.VERSION='0.9.9';const out=fn.apply(this,args);settle99();return out};
}
if(document.body&&!R._v991VersionObserver){
  R._v991VersionObserver=new MutationObserver(list=>{
    R.VERSION='0.9.9';
    for(const m of list){
      if(m.type==='characterData')fixText(m.target);
      else for(const n of m.addedNodes)fixText(n);
    }
  });
  R._v991VersionObserver.observe(document.body,{subtree:true,childList:true,characterData:true});
}
settle99();
})();
