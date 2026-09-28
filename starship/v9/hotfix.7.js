(()=>{
'use strict';
const R=window.SR;if(!R?.App)return;
R.VERSION='0.9.6';
const AP=R.App.prototype,$=s=>document.querySelector(s);
const fmt=n=>{n=Math.max(0,Math.round(Number(n)||0));return n<1000?String(n):n<1e6?(n/1000).toFixed(n<10000?1:0)+'k':(n/1e6).toFixed(1)+'m'};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const migrate96=R.migrate;R.migrate=s=>{s=migrate96(s);if(!s)return s;s.version='0.9.6';return s};

AP.v96StopAmbient=function(){
  this.v92StopMain?.();
  cancelAnimationFrame(this._v92MainAnim||0);this._v92MainAnim=0;
  cancelAnimationFrame(this._v93ShipAnim||0);this._v93ShipAnim=0;
  this.v95ClearLaunchShell?.();
  document.querySelectorAll('#v92MainScene,.v83MainShip,#v92MainDiag,.v92MainScene,.v92MainOverlay').forEach(n=>n.remove());
};

AP.v96Confirm=function({title,body,action='CONFIRM',danger=false,onConfirm}){
  document.querySelector('#v96Confirm')?.remove();
  const o=document.createElement('div');o.id='v96Confirm';o.className='v96Confirm';
  o.innerHTML=`<div class="v96ConfirmCard"><small>FLAGSHIP DATA</small><h2>${esc(title)}</h2><p>${esc(body)}</p><div><button data-cancel>CANCEL</button><button class="${danger?'danger':''}" data-confirm>${esc(action)}</button></div></div>`;
  document.body.append(o);requestAnimationFrame(()=>o.classList.add('show'));
  const close=()=>{o.classList.remove('show');setTimeout(()=>o.remove(),160)};
  o.querySelector('[data-cancel]').onclick=close;
  o.querySelector('[data-confirm]').onclick=()=>{close();onConfirm?.()};
};

AP.slots=function(){
  this.v96StopAmbient();
  this.s=null;
  document.body.className='v96SlotsBody';
  const app=$('#app');if(!app)return;
  const all=R.loadAll?.()||{slots:{},last:1};
  app.innerHTML=`<main class="v96Slots"><header><button class="v96Back" data-back>‹</button><span><small>LoE</small><h1>NEW / LOAD</h1><b>FLAGSHIP RECORDS</b></span><i></i></header><section class="v96SlotList"></section><footer><span><i></i>ARCHIVE LINK // READY</span><b>v0.9.6</b></footer></main>`;
  const root=app.querySelector('.v96Slots'),list=root.querySelector('.v96SlotList');
  root.querySelector('[data-back]').onclick=()=>this.main();
  for(let i=1;i<=3;i++){
    const s=R.getSlot?.(i),card=document.createElement('article');card.className='v96Slot '+(s?'occupied':'empty')+(Number(all.last)===i&&s?' last':'');
    if(s){
      const hull=R.HULLS?.[s.hull]?.name||'Flagship',rec=s.records||{};
      card.innerHTML=`<div class="v96SlotHead"><span><small>SLOT 0${i}${Number(all.last)===i?' // LAST USED':''}</small><h2>${esc(s.shipName||'WAYFARER')}</h2><b>${esc(hull.toUpperCase())}</b></span><i>◈ ${rec.wave||0}</i></div><div class="v96SlotStats"><span><small>BEST WAVE</small><b>${rec.wave||0}</b></span><span><small>BOSSES</small><b>${rec.bosses||0}</b></span><span><small>SALVAGE</small><b>▰ ${fmt(s.salvage||0)}</b></span><span><small>RUNS</small><b>${rec.runs||0}</b></span></div><div class="v96SlotActions"><button class="primary" data-load>▶ LOAD</button><button data-overwrite>OVERWRITE</button><button class="danger" data-delete>DELETE</button></div>`;
      card.querySelector('[data-load]').onclick=()=>{this.s=R.getSlot(i);R.audio.master=this.s?.settings?.audio??1;this.station('ship')};
      card.querySelector('[data-overwrite]').onclick=()=>this.v96Confirm({title:`OVERWRITE SLOT 0${i}?`,body:'This replaces the existing flagship and all permanent progression in this slot.',action:'OVERWRITE',danger:true,onConfirm:()=>{this.s=R.newSave(i);R.audio.master=this.s.settings?.audio??1;this.station('ship')}});
      card.querySelector('[data-delete]').onclick=()=>this.v96Confirm({title:`DELETE SLOT 0${i}?`,body:'This permanently deletes this flagship record. This cannot be undone.',action:'DELETE',danger:true,onConfirm:()=>{const a=R.loadAll();delete a.slots[i];if(Number(a.last)===i){const left=Object.keys(a.slots||{}).map(Number).sort((a,b)=>a-b);a.last=left[0]||1}localStorage.setItem('sr_mobile_v2',JSON.stringify(a));this.slots()}});
    }else{
      card.innerHTML=`<div class="v96EmptyMark">◇</div><div><small>SLOT 0${i}</small><h2>EMPTY RECORD</h2><p>Commission a new Starfighter and begin a fresh flagship record.</p></div><button class="primary" data-new>＋ NEW FLAGSHIP</button>`;
      card.querySelector('[data-new]').onclick=()=>{this.s=R.newSave(i);R.audio.master=this.s.settings?.audio??1;this.station('ship')};
    }
    list.append(card);
  }
  requestAnimationFrame(()=>root.classList.add('show'));
};

const sync96=()=>{R.VERSION='0.9.6';if(R.app?.s){R.app.s.version='0.9.6';try{R.save?.(R.app.s)}catch{}}if(!document.body)return;const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;while((n=w.nextNode()))if(n.nodeValue&&/0\.9\.[0-5]/.test(n.nodeValue))n.nodeValue=n.nodeValue.replace(/0\.9\.[0-5]/g,'0.9.6')};
const main96=AP.main;if(main96)AP.main=function(...args){this.v96StopAmbient?.();document.body.classList.remove('v96SlotsBody');const out=main96.apply(this,args);requestAnimationFrame(sync96);return out};
const station96=AP.station;if(station96)AP.station=function(...args){document.body.classList.remove('v96SlotsBody');const out=station96.apply(this,args);requestAnimationFrame(sync96);return out};
requestAnimationFrame(sync96);setTimeout(sync96,150);
})();