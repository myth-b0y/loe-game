(()=>{
'use strict';
const R=window.SR;if(!R?.App)return;
const AP=R.App.prototype;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
const E=(t,c,h)=>{const e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e};
const B=(h,fn,c='btn')=>{const b=E('button',c,h);b.onclick=()=>{R.audio?.play?.('ui');fn?.()};return b};
const fmt=n=>{n=Math.max(0,Math.round(Number(n)||0));return n<1000?String(n):n<1e6?(n/1000).toFixed(n<10000?1:0)+'k':(n/1e6).toFixed(1)+'m'};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// ---------------------------------------------------------------------------
// v0.9.9 SUPPORT PROGRESSION RECONCILIATION
//
// Foundation introduced foundationRD.flight while the older Station R&D screen
// still wrote rd.fleet. A migrated/stale Home Screen runtime could therefore
// show Flight Development II as purchased while Fleet read rank 0 and locked
// every support craft. Keep both representations synchronized and make Fleet
// unlock from the highest earned value.
// ---------------------------------------------------------------------------
const legacyFlight=s=>{
  const v=clamp(s?.rd?.fleet||0,0,3);
  return v>=3?6:v>=2?4:v>=1?2:0;
};
const effectiveFlight=s=>clamp(Math.max(Number(s?.foundationRD?.flight)||0,legacyFlight(s)),0,6);
const flightCap=rank=>[0,1,1,2,2,3,4][clamp(rank,0,6)]||0;
const hullIndex=s=>clamp(s?.hull||0,0,6);
const hullSupport=s=>Math.max(0,Number(R.HULLS?.[hullIndex(s)]?.supportCap)||0);
const supportReq=d=>clamp(Number(d?.foundationFlightReq)||((Number(d?.rd)||1)*2),2,6);

const reconcileSupportProgress=s=>{
  if(!s)return s;
  s.rd=Object.assign({weapons:0,drones:0,tactical:0,fleet:0},s.rd||{});
  s.foundationRD=Object.assign({fire:0,drones:0,flight:0,tactical:0,engineering:0,operations:0},s.foundationRD||{});
  s.systems=Object.assign({hangar:0},s.systems||{});
  const rank=effectiveFlight(s);
  s.foundationRD.flight=rank;
  const legacy=rank>=6?3:rank>=4?2:rank>=2?1:0;
  s.rd.fleet=Math.max(Number(s.rd.fleet)||0,legacy);
  // Flight Development I commissions the Hangar. If the player already earned
  // that research before reaching a support-capable hull, install the first
  // berth as soon as the hull physically supports it.
  if(rank>=1&&hullSupport(s)>0)s.systems.hangar=Math.max(1,Number(s.systems.hangar)||0);
  s.version='0.9.9';
  return s;
};

const migrate19=R.migrate;
R.migrate=s=>reconcileSupportProgress(migrate19?.(s)||s);
R.effectiveFlightDevelopment=effectiveFlight;
R.foundationSupportCapacity=s=>{
  s=reconcileSupportProgress(s);
  if(!s)return 0;
  return Math.min(4,hullSupport(s),Math.max(0,Number(s.systems?.hangar)||0),flightCap(effectiveFlight(s)));
};
AP.supportCapacity=function(){return R.foundationSupportCapacity(this.s)};

const ensureSupportState=s=>{
  const ids=Array.isArray(s.equippedSupports)?s.equippedSupports.slice():(Array.isArray(s.supports)?s.supports.slice():[]);
  s.equippedSupports=ids;s.supports=ids.slice();s.supportStock=s.supportStock||{};
  for(const d of R.SUPPORTS||[]){
    const deployed=ids.filter(x=>x===d.id).length;
    const legacy=(s.ownedSupports||[]).includes?.(d.id)?1:0;
    s.supportStock[d.id]=Math.max(Number(s.supportStock[d.id])||0,deployed,legacy);
  }
  return ids;
};
const cleanupSupportAssignments=s=>{
  const n=(s.equippedSupports||[]).length;
  for(const c of s.crew||[]){
    if(!String(c.assignment||'').startsWith('support:'))continue;
    const i=Number(String(c.assignment).split(':')[1]);
    if(!Number.isFinite(i)||i<0||i>=n){c.assignment='reserve';c.assigned=false}
  }
};
const blockers=(s,d)=>{
  const out=[],rank=effectiveFlight(s),req=supportReq(d),minHull=Math.max(0,Number(d?.minHull)||0);
  if(rank<req)out.push(`FLIGHT DEVELOPMENT ${req}`);
  if(hullIndex(s)<minHull)out.push((R.HULLS?.[minHull]?.name||'LARGER HULL').toUpperCase());
  else if(hullSupport(s)>0&&(Number(s.systems?.hangar)||0)<=0)out.push('HANGAR');
  return out;
};

AP.listSupports=function(c){
  this.s=R.migrate(this.s);const s=this.s,ids=ensureSupportState(s),cap=R.foundationSupportCapacity(s),rank=effectiveFlight(s),physical=hullSupport(s);
  c.append(E('div','hint v99Hint',`<span>▷ ${ids.length}/${cap}</span><small>FLIGHT ${rank}/6 · HANGAR ${Number(s.systems?.hangar)||0}/${physical}. One-seat craft need a Pilot; two-seat craft need a Pilot + Gunner.</small>`));
  for(const d of R.SUPPORTS||[]){
    const req=supportReq(d),owned=Math.max(0,Number(s.supportStock[d.id])||0),on=ids.filter(x=>x===d.id).length,missing=blockers(s,d),unlocked=missing.length===0;
    const p=E('div','panel gear '+(on?'on ':'')+(!unlocked?'locked':''));
    p.innerHTML=`<i class="gearIcon">${d.icon||'▷'}</i><span class="gearBody"><b>${esc(d.name)}</b><small><strong>${(d.crewReq||1)>=2?'PILOT + GUNNER':'PILOT'}</strong> · ${esc(d.desc||'')}</small><strong>OWNED ${owned} · DEPLOYED ${on}</strong>${!unlocked?`<em>🔒 ${esc(missing.join(' · '))}</em>`:`<em>FLIGHT ${req} ✓</em>`}</span>`;
    const a=E('div','weaponActions');
    if(unlocked){
      a.append(B(`BUY<small>▰ ${fmt(d.cost||0)}</small>`,()=>{
        if(s.salvage<(d.cost||0))return this.deny?.('NEED SALVAGE');
        s.salvage-=d.cost||0;s.supportStock[d.id]=owned+1;R.save(s);this.station('fleet');
      },'btn small'));
      if(owned>on)a.append(B('DEPLOY',()=>{
        const current=ensureSupportState(s);
        const currentCap=R.foundationSupportCapacity(s);
        if(current.length>=currentCap)return this.deny?.('HANGAR FULL');
        current.push(d.id);s.equippedSupports=current;s.supports=current.slice();R.save(s);this.station('fleet');
      },'btn small primary'));
      if(on>0)a.append(B('REMOVE',()=>{
        const current=ensureSupportState(s),i=current.lastIndexOf(d.id);
        if(i>=0)current.splice(i,1);
        s.equippedSupports=current;s.supports=current.slice();cleanupSupportAssignments(s);R.save(s);this.station('fleet');
      },'btn small'));
    }
    p.append(a);c.append(p);
  }
};

// Apply immediately so a save already showing the split state repairs without
// requiring another research purchase or hull upgrade.
if(R.app?.s){
  R.app.s=R.migrate(R.app.s);
  try{R.save?.(R.app.s)}catch{}
}
if(R.app&&!document.body.classList.contains('combat'))setTimeout(()=>{try{R.app.station(R.app.tab||'fleet')}catch{}},40);
})();
