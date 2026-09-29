(()=>{
'use strict';
const R=window.SR;if(!R?.App||!R?.Game)return;
const AP=R.App.prototype;

// ---------------------------------------------------------------------------
// v0.9.9 FOUNDATION UI / LEGACY FLEET FOLLOW-UP
// Keep the accepted Ship layout intact, surface hull evolution near the ship,
// and restore legacy support-craft seating where the old save had usable crew.
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
const supportIds=s=>Array.isArray(s?.equippedSupports)?s.equippedSupports:(Array.isArray(s?.supports)?s.supports:[]);
const activeCount=s=>(s?.crew||[]).filter(c=>c?.assignment&&c.assignment!=='reserve').length;
const seatTaken=(s,a)=>(s?.crew||[]).some(c=>c?.assignment===a);
const fireCount=s=>(s?.crew||[]).filter(c=>roleOf(c)==='gunner'&&c.assignment==='fire').length;
const canActivate=(s,c)=>c?.assignment!=='reserve'||activeCount(s)<Math.max(0,Number(s?.quarters)||0);
const takeCrew=(s,role,seat)=>{
  let pool=(s?.crew||[]).filter(c=>roleOf(c)===role&&c.assignment!==seat&&!String(c.assignment||'').startsWith('support:'));
  if(role==='pilot')pool=pool.filter(c=>c.assignment!=='helm').sort((a,b)=>Number(a.assignment==='reserve')-Number(b.assignment==='reserve'));
  else if(role==='gunner')pool=pool.filter(c=>c.assignment==='reserve'||(c.assignment==='fire'&&fireCount(s)>1)).sort((a,b)=>Number(b.assignment==='reserve')-Number(a.assignment==='reserve'));
  else pool=pool.sort((a,b)=>Number(b.assignment==='reserve')-Number(a.assignment==='reserve'));
  const c=pool.find(q=>canActivate(s,q));
  if(!c)return false;
  c.assignment=seat;c.assigned=true;return true;
};
const repairLegacySupportSeats=s=>{
  if(!s||s._v99SupportSeatRepair)return false;
  const ids=supportIds(s);let changed=false;
  ids.forEach((id,i)=>{
    const d=(R.SUPPORTS||[]).find(x=>x.id===id);if(!d)return;
    const pilot=`support:${i}:pilot`,gunner=`support:${i}:gunner`;
    if(!seatTaken(s,pilot))changed=takeCrew(s,'pilot',pilot)||changed;
    if((d.crewReq||1)>=2&&!seatTaken(s,gunner))changed=takeCrew(s,'gunner',gunner)||changed;
  });
  s._v99SupportSeatRepair=1;
  for(const c of s.crew||[])c.assigned=!!c.assignment&&c.assignment!=='reserve';
  return changed;
};

const migrate17=R.migrate;
R.migrate=s=>{s=migrate17?.(s)||s;if(!s)return s;repairLegacySupportSeats(s);s.version='0.9.9';return s};

// Put only the hull-evolution control near the top. Everything else on the
// accepted Ship page stays exactly where the existing layout places it.
const ship17=AP.tab_ship;
AP.tab_ship=function(c){
  const out=ship17?.call(this,c);
  const place=()=>{
    const upgrade=c?.querySelector?.('.v99HullUpgrade');if(!upgrade)return;
    const hero=c.querySelector('.v92ShipHero,.v8ShipHero,.commandHero,.shipDiag,.v8ShipDeck .v92ShipHero');
    if(hero&&upgrade.previousElementSibling!==hero)hero.insertAdjacentElement('afterend',upgrade);
    else if(!hero&&c.firstElementChild!==upgrade)c.insertBefore(upgrade,c.firstElementChild);
  };
  place();requestAnimationFrame(place);return out;
};

// Re-run migration on the loaded slot immediately so already-migrated legacy
// fleets receive the seating repair without requiring the player to re-unlock
// or re-buy their support craft.
if(R.app?.s){R.app.s=R.migrate(R.app.s);try{R.save?.(R.app.s)}catch{}}
if(R.app&&!document.body.classList.contains('combat'))setTimeout(()=>{try{R.app.station(R.app.tab||'ship')}catch{}},30);
})();
