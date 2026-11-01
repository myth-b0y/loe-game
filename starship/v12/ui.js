(()=>{
'use strict';
const R=window.SR,V=R?.V10;if(!R||!V)return;
V.syncVersionLabel=()=>{
 R.VERSION='1.3.1';V.VERSION='1.3.1';
 const root=document.getElementById('app');if(!root)return;
 for(const el of root.querySelectorAll('*')){if(el.children.length)continue;const t=String(el.textContent||'').trim();if(/^(?:VERSION\s*)?V?\d+\.\d+\.\d+$/i.test(t)){if(/^VERSION/i.test(t))el.textContent='VERSION 1.3.1';else if(/^V/i.test(t))el.textContent='v1.3.1';else el.textContent='1.3.1'}}
};
V.syncVersionLabel();setTimeout(V.syncVersionLabel,0);setTimeout(V.syncVersionLabel,300);setTimeout(V.syncVersionLabel,800);
})();