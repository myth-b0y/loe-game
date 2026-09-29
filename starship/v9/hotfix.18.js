(()=>{
'use strict';
const R=window.SR;if(!R?.App)return;
const AP=R.App.prototype;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
const E=(t,c,h)=>{const e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e};
const B=(h,fn,c='btn')=>{const b=E('button',c,h);b.onclick=()=>{R.audio?.play?.('ui');fn?.()};return b};
const fmt=n=>{n=Math.max(0,Math.round(Number(n)||0));return n<1000?String(n):n<1e6?(n/1000).toFixed(n<10000?1:0)+'k':(n/1e6).toFixed(1)+'m'};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const flightFromLegacy=v=>v>=3?6:v>=2?4:v>=1?2:0;

// Foundation R&D is authoritative, but v0.9.8 research values may still be
// ahead on migrated saves. Reconcile upward so paid legacy progress is never
// lost, then mirror Foundation values back for older compatibility readers.
const migrate18=R.migrate;
R.migrate=s=>{
  s=migrate18?.(s)||s;if(!s)return s;
  s.rd=Object.assign({weapons:0,drones:0,tactical:0,fleet:0},s.rd||{});
  s.foundationRD=Object.assign({fire:0,drones:0,flight:0,tactical:0,engineering:0,operations:0},s.foundationRD||{});
  const f=s.foundationRD;
  f.fire=clamp(Math.max(f.fire||0,s.rd.weapons||0),0,6);
  f.drones=clamp(Math.max(f.drones||0,s.rd.drones||0),0,6);
  f.flight=clamp(Math.max(f.flight||0,flightFromLegacy(s.rd.fleet||0)),0,6);
  f.tactical=clamp(Math.max(f.tactical||0,s.rd.tactical||0),0,6);
  s.rd.weapons=Math.max(s.rd.weapons||0,f.fire||0);
  s.rd.drones=Math.max(s.rd.drones||0,f.drones||0);
  s.rd.tactical=Math.max(s.rd.tactical||0,f.tactical||0);
  s.rd.fleet=Math.max(s.rd.fleet||0,f.flight>=6?3:f.flight>=4?2:f.flight>=2?1:0);
  // First research rank commissions its physical facility. Repair migrated
  // saves where the old research rank exists but the facility flag did not.
  s.systems=s.systems||{};
  if((f.drones||0)>=1&&s.hull>=1)s.systems.droneBay=Math.max(1,Number(s.systems.droneBay)||0);
  if((f.flight||0)>=1&&s.hull>=3)s.systems.hangar=Math.max(1,Number(s.systems.hangar)||0);
  s._v99RDSync=1;s.version='0.9.9';return s;
};

// Re-own the R&D screen after all legacy layers. This prevents the v0.9.8
// five-rank lab from displaying/updating rd.* while Fleet reads Foundation R&D.
AP.tab_research=function(c){
  clearInterval(this._rdInterval);this.s=R.migrate(this.s);const s=this.s;
  c.append(E('div','hint v99Hint','<span>◆ R&D</span><small>Research unlocks capability. Hardware installation and capacity live in Systems and the hull.</small>'));
  for(const [key,t] of Object.entries(R.FOUNDATION_RD||{})){
    const lvl=clamp(s.foundationRD?.[key]||0,0,6),next=lvl+1;
    const p=E('div','panel v99Research '+(lvl>=6?'maxed':''));
    const path=(t.milestones||[]).map((m,i)=>`<span class="${i<lvl?'done':i===lvl?'next':''}"><i>${i<lvl?'✓':i+1}</i>${esc(m)}</span>`).join('');
    p.innerHTML=`<div class="v99RDHead"><i class="gearIcon">${t.icon||'◆'}</i><span><b>${esc(t.name)}</b><small>${esc(t.desc)}</small><strong>RANK ${lvl}/6</strong></span></div><div class="v99TechPath">${path}</div>`;
    if(lvl>=6)p.append(E('i','ok','✓ COMPLETE'));
    else{
      const min=Math.min(6,Math.max(t.minHull||0,Math.floor((next-1)*.75))),needHull=Math.max(t.minHull||0,Math.min(6,min));
      const cost=Number(t.cost?.[next])||0,cores=Number(t.cores?.[next])||0;
      if(s.hull<needHull)p.append(E('em','lock',`🔒 ${esc(R.HULLS?.[needHull]?.name||'LARGER HULL')}`));
      else p.append(B(`RESEARCH ${next}<small>▰ ${fmt(cost)}${cores?' · ◆ '+cores:''}</small>`,()=>{
        if(s.salvage<cost||s.cores<cores)return this.deny?.('NEED RESOURCES');
        s.salvage-=cost;s.cores-=cores;s.foundationRD[key]=next;
        if(key==='drones'&&next===1)s.systems.droneBay=Math.max(1,s.systems.droneBay||0);
        if(key==='flight'&&next===1)s.systems.hangar=Math.max(1,s.systems.hangar||0);
        this.s=R.migrate(s);R.save(this.s);this.station('research');
      },'btn small primary'));
    }
    c.append(p);
  }
};

// Apply the reconciliation immediately to the loaded slot. Fleet's existing
// unlock checks now see the same ranks displayed by the R&D screen.
if(R.app?.s){R.app.s=R.migrate(R.app.s);try{R.save?.(R.app.s)}catch{}}
if(R.app&&!document.body.classList.contains('combat'))setTimeout(()=>{try{R.app.station(R.app.tab||'ship')}catch{}},30);
})();
