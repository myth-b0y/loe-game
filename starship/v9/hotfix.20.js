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
// v0.9.9 SUPPORT OWNERSHIP FIX
// One authoritative Flight Development value, one support-capacity calculation,
// and real crew seating when a craft is deployed.
// ---------------------------------------------------------------------------
const roleOf=c=>{
  const r=String(c?.role||'').toLowerCase();
  if(['pilot','gunner','engineer','tactical','command'].includes(r))return r;
  const p=Number(c?.profession);
  if(p===0||p===6)return'pilot';
  if(p===1)return'gunner';
  if([2,3,4,5,9].includes(p))return'engineer';
  if([7,8].includes(p))return'tactical';
  if([10,11].includes(p))return'command';
  return null;
};
const legacyFlight=s=>{const v=clamp(s?.rd?.fleet||0,0,3);return v>=3?6:v>=2?4:v>=1?2:0};
const effectiveFlight=s=>clamp(Math.max(Number(s?.foundationRD?.flight)||0,legacyFlight(s)),0,6);
const flightCap=rank=>[0,1,1,2,2,3,4][clamp(rank,0,6)]||0;
const hullIndex=s=>clamp(s?.hull||0,0,6);
const hullSupport=s=>Math.max(0,Number(R.HULLS?.[hullIndex(s)]?.supportCap)||0);
const supportReq=d=>clamp(Number(d?.foundationFlightReq)||((Number(d?.rd)||1)*2),2,6);
const supportIds=s=>Array.isArray(s?.equippedSupports)?s.equippedSupports:(Array.isArray(s?.supports)?s.supports:[]);
const activeCrew=s=>(s?.crew||[]).filter(c=>c?.assignment&&c.assignment!=='reserve');
const assignmentParts=a=>{const m=/^support:(\d+):(pilot|gunner)$/.exec(String(a||''));return m?{index:Number(m[1]),seat:m[2]}:null};
const stockAt=(obj,id)=>Math.max(0,Number(obj?.[id])||0);
const countId=(arr,id)=>(arr||[]).filter(x=>x===id).length;

const reconcile=s=>{
  if(!s)return s;
  s.rd=Object.assign({weapons:0,drones:0,tactical:0,fleet:0},s.rd||{});
  s.foundationRD=Object.assign({fire:0,drones:0,flight:0,tactical:0,engineering:0,operations:0},s.foundationRD||{});
  s.systems=Object.assign({hangar:0},s.systems||{});
  s.crew=Array.isArray(s.crew)?s.crew:[];
  const rank=effectiveFlight(s);
  s.foundationRD.flight=rank;
  s.rd.fleet=Math.max(Number(s.rd.fleet)||0,rank>=6?3:rank>=4?2:rank>=2?1:0);
  if(rank>=1&&hullSupport(s)>0)s.systems.hangar=Math.max(1,Number(s.systems.hangar)||0);
  const ids=supportIds(s).slice(0,4);s.equippedSupports=ids;s.supports=ids.slice();
  s.supportStock=s.supportStock||{};
  for(const d of R.SUPPORTS||[]){
    const deployed=countId(ids,d.id),legacy=(s.ownedSupports||[]).includes?.(d.id)?1:0;
    s.supportStock[d.id]=Math.max(stockAt(s.supportStock,d.id),deployed,legacy);
  }
  for(const c of s.crew){if(c.assigned==null)c.assigned=!!c.assignment&&c.assignment!=='reserve'}
  s.version='0.9.9';return s;
};

const migrate20=R.migrate;
R.migrate=s=>reconcile(migrate20?.(s)||s);
R.effectiveFlightDevelopment=effectiveFlight;
R.foundationSupportCapacity=s=>{
  s=reconcile(s);if(!s)return 0;
  const rank=effectiveFlight(s),physical=hullSupport(s),hangar=Math.max(0,Number(s.systems?.hangar)||0);
  return Math.min(4,physical,hangar,flightCap(rank));
};
AP.supportCapacity=function(){return R.foundationSupportCapacity(this.s)};

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
        this.s=R.migrate(s);R.save(this.s);this.station('research');
      },'btn small primary'));
    }
    c.append(p);
  }
};

const blockers=(s,d)=>{
  const out=[],rank=effectiveFlight(s),req=supportReq(d),minHull=Math.max(0,Number(d?.minHull)||0),physical=hullSupport(s);
  if(rank<req)out.push(`FLIGHT DEVELOPMENT ${req}`);
  if(hullIndex(s)<minHull)out.push((R.HULLS?.[minHull]?.name||'LARGER HULL').toUpperCase());
  else if(physical<=0)out.push('SUPPORT-CAPABLE HULL');
  else if((Number(s.systems?.hangar)||0)<=0)out.push('HANGAR');
  return out;
};
const reserveFor=(s,role,used=new Set())=>(s.crew||[]).find(c=>!used.has(c)&&roleOf(c)===role&&(!c.assignment||c.assignment==='reserve'))||null;
const seatsNeeded=d=>(d?.crewReq||1)>=2?['pilot','gunner']:['pilot'];
const seatCraft=(s,d,index)=>{
  const need=seatsNeeded(d),used=new Set(),chosen=[];
  for(const role of need){const c=reserveFor(s,role,used);if(!c)return{ok:false,msg:`NEED FREE ${role.toUpperCase()}`};used.add(c);chosen.push([role,c])}
  if(activeCrew(s).length+chosen.length>Math.max(0,Number(s.quarters)||0))return{ok:false,msg:'CREW QUARTERS FULL'};
  for(const [role,c] of chosen){c.assignment=`support:${index}:${role}`;c.assigned=true}
  return{ok:true};
};
const repairEquippedSeats=s=>{
  const ids=supportIds(s);let changed=false;
  for(let i=0;i<ids.length;i++){
    const d=(R.SUPPORTS||[]).find(x=>x.id===ids[i]);if(!d)continue;
    for(const seat of seatsNeeded(d)){
      const assignment=`support:${i}:${seat}`;
      const filled=(s.crew||[]).some(c=>c.assignment===assignment&&roleOf(c)===seat);
      if(filled)continue;
      const c=reserveFor(s,seat);if(!c||activeCrew(s).length>=Math.max(0,Number(s.quarters)||0))continue;
      c.assignment=assignment;c.assigned=true;changed=true;
    }
  }
  return changed;
};
const removeSupportAt=(s,index)=>{
  const ids=supportIds(s).slice();if(index<0||index>=ids.length)return false;
  ids.splice(index,1);s.equippedSupports=ids;s.supports=ids.slice();
  for(const c of s.crew||[]){
    const p=assignmentParts(c.assignment);if(!p)continue;
    if(p.index===index){c.assignment='reserve';c.assigned=false}
    else if(p.index>index){c.assignment=`support:${p.index-1}:${p.seat}`;c.assigned=true}
  }
  return true;
};

AP.listSupports=function(c){
  this.s=R.migrate(this.s);const s=this.s;repairEquippedSeats(s);R.save(s);
  const ids=supportIds(s),cap=R.foundationSupportCapacity(s),rank=effectiveFlight(s),physical=hullSupport(s),hangar=Math.max(0,Number(s.systems?.hangar)||0);
  c.append(E('div','hint v99Hint',`<span>▷ ${ids.length}/${cap}</span><small>FLIGHT ${rank}/6 · HANGAR ${hangar}/${physical}. Deploying a craft seats free Reserve crew automatically.</small>`));
  for(const d of R.SUPPORTS||[]){
    const req=supportReq(d),owned=stockAt(s.supportStock,d.id),on=countId(ids,d.id),missing=blockers(s,d),unlocked=missing.length===0;
    const p=E('div','panel gear '+(on?'on ':'')+(!unlocked?'locked':''));
    p.innerHTML=`<i class="gearIcon">${d.icon||'▷'}</i><span class="gearBody"><b>${esc(d.name)}</b><small><strong>${(d.crewReq||1)>=2?'PILOT + GUNNER':'PILOT'}</strong> · ${esc(d.desc||'')}</small><strong>OWNED ${owned} · DEPLOYED ${on}</strong>${unlocked?`<em>FLIGHT ${req} ✓</em>`:`<em>🔒 ${esc(missing.join(' · '))}</em>`}</span>`;
    const a=E('div','weaponActions');
    if(unlocked){
      a.append(B(`BUY<small>▰ ${fmt(d.cost||0)}</small>`,()=>{
        if(s.salvage<(d.cost||0))return this.deny?.('NEED SALVAGE');
        s.salvage-=d.cost||0;s.supportStock[d.id]=stockAt(s.supportStock,d.id)+1;R.save(s);this.station('fleet');
      },'btn small'));
      if(owned>on)a.append(B('DEPLOY',()=>{
        const current=supportIds(s).slice(),currentCap=R.foundationSupportCapacity(s);
        if(current.length>=currentCap)return this.deny?.(currentCap<=0?'NO SUPPORT CAPACITY':'HANGAR FULL');
        const seat=seatCraft(s,d,current.length);if(!seat.ok)return this.deny?.(seat.msg);
        current.push(d.id);s.equippedSupports=current;s.supports=current.slice();R.save(s);this.station('fleet');
      },'btn small primary'));
      if(on>0)a.append(B('REMOVE',()=>{
        const current=supportIds(s),i=current.lastIndexOf(d.id);if(i<0)return;
        removeSupportAt(s,i);R.save(s);this.station('fleet');
      },'btn small'));
    }
    p.append(a);c.append(p);
  }
};

if(R.app?.s){
  R.app.s=R.migrate(R.app.s);repairEquippedSeats(R.app.s);
  try{R.save?.(R.app.s)}catch{}
}
R._v99SupportProgress20=true;
if(R.app&&!document.body.classList.contains('combat'))setTimeout(()=>{try{R.app.station(R.app.tab||'fleet')}catch{}},40);
})();
