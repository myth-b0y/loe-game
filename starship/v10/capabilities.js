(()=>{
'use strict';
const R=window.SR,V=R?.V10;if(!R?.Game||!V)throw new Error('V10 capabilities requires card engine');
const mounted=s=>(Array.isArray(s?.weaponMounts)?s.weaponMounts:(s?.weapons||[])).filter(Boolean);
const droneIds=s=>Array.isArray(s?.equippedDrones)?s.equippedDrones:(s?.drones||[]);
const supportIds=s=>Array.isArray(s?.equippedSupports)?s.equippedSupports:(s?.supports||[]);
const roleOf=c=>String(c?.role||'').toLowerCase()||({0:'pilot',1:'gunner',5:'engineer'}[Number(c?.profession)]||'');
const hasDroneOperator=s=>(s?.crew||[]).some(c=>c?.assigned&&((roleOf(c)==='engineer'&&c.specialty==='Drone Systems')||Number(c?.profession)===5));
const supportStaffed=(s,i,def)=>{const crew=s?.crew||[],p=crew.some(c=>c.assignment===`support:${i}:pilot`&&roleOf(c)==='pilot'),g=(def?.crewReq||1)<2||crew.some(c=>c.assignment===`support:${i}:gunner`&&roleOf(c)==='gunner');return p&&g};
const finiteOr=(value,fallback)=>Number.isFinite(Number(value))?Math.max(0,Number(value)):fallback;

// Hard rule: a run may only draft cards for equipment that is genuinely
// operational for this launch. Inventory, inactive hardpoints, unstaffed fleet
// craft and unavailable systems do not unlock card categories.
V.snapshotCapabilities=g=>{
 const s=g.s||{},caps={weaponFamilies:[],offensiveDrones:false,defensiveDrones:false,offensiveSupports:false,defensiveSupports:false,shields:false,ship:true,tactical:false};
 const ids=mounted(s),weaponCap=finiteOr(R.foundationWeaponCapacity?.(s),ids.length),activeWeapons=ids.slice(0,weaponCap);
 caps.weaponFamilies=[...new Set(activeWeapons.map(id=>(R.WEAPONS||[]).find(w=>w.id===id)?.family).filter(f=>['autocannon','railgun','plasma','ion','missile'].includes(f)))];

 const dIds=droneIds(s),droneCap=finiteOr(R.foundationDroneCapacity?.(s,true),dIds.length),droneOk=droneCap>0&&hasDroneOperator(s);
 if(droneOk){
   const actual=(g.droneUnits?.length?g.droneUnits.map(u=>u.def?.id).filter(Boolean):dIds).slice(0,droneCap);
   for(const id of actual){const d=(R.DRONES||[]).find(x=>x.id===id);if(d?.role==='defense')caps.defensiveDrones=true;else if(d)caps.offensiveDrones=true}
 }

 const sIds=supportIds(s),supportCap=finiteOr(R.foundationSupportCapacity?.(s),sIds.length),activeSupports=sIds.slice(0,supportCap);
 activeSupports.forEach((id,i)=>{const d=(R.SUPPORTS||[]).find(x=>x.id===id);if(!d||!supportStaffed(s,i,d))return;if(V.OFF_SUPPORT_IDS.has(id))caps.offensiveSupports=true;if(V.DEF_SUPPORT_IDS.has(id))caps.defensiveSupports=true});
 // Combat synchronization is authoritative too, but only for definitions that
 // survived Foundation capacity and seating rules.
 for(const u of g.supportUnits||[]){const id=u?.def?.id;if(!activeSupports.includes(id))continue;if(V.OFF_SUPPORT_IDS.has(id))caps.offensiveSupports=true;if(V.DEF_SUPPORT_IDS.has(id))caps.defensiveSupports=true}

 caps.shields=(Number(g.maxShield)||0)>0&&((Number(s.systems?.shield)||0)>0||(Number(g.h?.shield)||0)>0);
 caps.tactical=(s.tactical||s.actives||[]).some(id=>(R.TACTICAL||[]).some(a=>a.id===id));
 g.cardState=g.cardState||{};g.cardState.capabilities=caps;return caps;
};
})();
