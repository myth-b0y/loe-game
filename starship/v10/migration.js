(()=>{
'use strict';
const R=window.SR,V=R?.V10;if(!R||!V)throw new Error('V10 migration requires card data');
const SAVE_KEY='sr_mobile_v2',BACKUP_KEY='sr_mobile_v2_pre_cards_v110';
const mapId=id=>V.WEAPON_MIGRATION[id]||id;
const stockAt=(o,id)=>Math.max(0,Number(o?.[id])||0);
const count=(a,id)=>(a||[]).filter(x=>x===id).length;
try{const raw=localStorage.getItem(SAVE_KEY);if(raw&&!localStorage.getItem(BACKUP_KEY))localStorage.setItem(BACKUP_KEY,raw)}catch{}

function preMapWeapons(s){
  if(!s||s._v110WeaponMigration)return s;
  const legacy=V.LEGACY_WEAPON_BY_ID||{},inv={...(s.weaponInventory||{})},stock={...(s.weaponStock||{})},mounts=(Array.isArray(s.weaponMounts)?s.weaponMounts:(s.weapons||[])).slice(),unlocked=Array.isArray(s.unlockedW)?s.unlockedW.slice():[];
  const all=new Set([...Object.keys(inv),...Object.keys(stock),...mounts.filter(Boolean),...unlocked]);
  let refund=0;
  for(const oldId of all){
    const dest=mapId(oldId);if(dest===oldId)continue;
    const owned=Math.max(stockAt(inv,oldId),stockAt(stock,oldId),count(mounts,oldId));
    const oldCost=Number(legacy[oldId]?.cost)||0,newCost=Number(legacy[dest]?.cost)||0;
    refund+=Math.max(0,oldCost-newCost)*owned;
    if(owned>0){inv[dest]=stock[dest]=Math.max(stockAt(inv,dest),stockAt(stock,dest))+owned}
    delete inv[oldId];delete stock[oldId];
  }
  s.weaponMounts=mounts.map(id=>id?mapId(id):null);
  s.weapons=s.weaponMounts.slice();
  s.weaponInventory=inv;s.weaponStock=stock;
  s.unlockedW=[...new Set(unlocked.map(mapId).filter(id=>(R.WEAPONS||[]).some(w=>w.id===id)))];
  if(refund>0)s.salvage=(Number(s.salvage)||0)+refund;
  s._v110WeaponRefund=refund;
  s._v110WeaponMigration=1;
  return s;
}

const priorMigrate=R.migrate;
R.migrate=s=>{
  if(!s)return s;
  preMapWeapons(s);
  s=priorMigrate?.(s)||s;
  if(!s)return s;
  // Prior Foundation migration may have reconstructed inventory. Normalize once more,
  // but do not pay the migration refund twice.
  const mounts=(Array.isArray(s.weaponMounts)?s.weaponMounts:(s.weapons||[])).map(id=>id?mapId(id):null);
  s.weaponMounts=mounts;s.weapons=mounts.slice();
  s.weaponInventory=s.weaponInventory||{};s.weaponStock=s.weaponStock||{};
  for(const [oldId,dest] of Object.entries(V.WEAPON_MIGRATION)){
    const n=Math.max(stockAt(s.weaponInventory,oldId),stockAt(s.weaponStock,oldId));
    if(n>0){s.weaponInventory[dest]=Math.max(stockAt(s.weaponInventory,dest),n);s.weaponStock[dest]=Math.max(stockAt(s.weaponStock,dest),n)}
    delete s.weaponInventory[oldId];delete s.weaponStock[oldId];
  }
  for(const w of R.WEAPONS||[]){const n=Math.max(stockAt(s.weaponInventory,w.id),stockAt(s.weaponStock,w.id),count(mounts,w.id));if(n>0){s.weaponInventory[w.id]=n;s.weaponStock[w.id]=n}}
  s.unlockedW=[...new Set((s.unlockedW||[]).map(mapId).filter(id=>(R.WEAPONS||[]).some(w=>w.id===id)))];
  s.cardCodex=s.cardCodex||{};s.cardCodex.evolutions=s.cardCodex.evolutions||{};
  s.saveSchema=Math.max(V.SAVE_SCHEMA,Number(s.saveSchema)||0);
  s.version=V.VERSION;
  return s;
};

const priorNew=R.newSave;
if(priorNew)R.newSave=i=>{
  let s=priorNew(i);s=R.migrate(s);
  // Starter equipment is free, so a fresh save must not receive legacy conversion equity.
  if((s._v110WeaponRefund||0)>0)s.salvage=Math.max(0,(Number(s.salvage)||0)-s._v110WeaponRefund);
  const h=R.HULLS?.[s.hull||0],slots=Math.max(2,h?.weapons||2),arr=Array.isArray(s.weaponMounts)?s.weaponMounts.slice(0,slots):[];
  while(arr.length<slots)arr.push(null);
  arr[0]='weapon.autocannon';arr[1]='weapon.autocannon';
  for(let n=2;n<arr.length;n++)if(arr[n]&&V.WEAPON_MIGRATION[arr[n]])arr[n]=mapId(arr[n]);
  s.weaponMounts=arr;s.weapons=arr.slice();
  s.weaponInventory=s.weaponInventory||{};s.weaponStock=s.weaponStock||{};
  s.weaponInventory['weapon.autocannon']=Math.max(2,stockAt(s.weaponInventory,'weapon.autocannon'));
  s.weaponStock['weapon.autocannon']=Math.max(2,stockAt(s.weaponStock,'weapon.autocannon'));
  for(const id of Object.keys(V.WEAPON_MIGRATION)){delete s.weaponInventory[id];delete s.weaponStock[id]}
  s.unlockedW=[...new Set([...(s.unlockedW||[]).map(mapId),'weapon.autocannon'])].filter(id=>(R.WEAPONS||[]).some(w=>w.id===id));
  s._v110WeaponMigration=1;s._v110WeaponRefund=0;s.saveSchema=V.SAVE_SCHEMA;s.version=V.VERSION;
  try{R.save?.(s)}catch{}
  return s;
};

V.migrateSave=R.migrate;
if(R.app?.s){R.app.s=R.migrate(R.app.s);try{R.save?.(R.app.s)}catch{}}
})();
