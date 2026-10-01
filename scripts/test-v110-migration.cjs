const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

const store=new Map();
global.localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v))};
global.window={SR:{
 WEAPONS:[
  {id:'weapon.autocannon',family:'autocannon',cost:240},{id:'weapon.pulse',family:'pulse',cost:300},
  {id:'weapon.railgun',family:'railgun',cost:650},{id:'weapon.beam',family:'beam',cost:950},
  {id:'weapon.plasma',family:'plasma',cost:1200},{id:'weapon.flak',family:'flak',cost:1100},
  {id:'weapon.ion',family:'ion',cost:1400},{id:'weapon.missile',family:'missile',cost:1800},
  {id:'weapon.torpedo',family:'torpedo',cost:2800}
 ],
 HULLS:[{weapons:2}],
 migrate:s=>s,
 save:s=>{window.SR._saved=s},
 newSave:i=>({slot:i,salvage:900,hull:0,weaponMounts:['weapon.autocannon','weapon.pulse'],weapons:['weapon.autocannon','weapon.pulse'],weaponInventory:{'weapon.autocannon':1,'weapon.pulse':1},weaponStock:{'weapon.autocannon':1,'weapon.pulse':1},unlockedW:['weapon.autocannon','weapon.pulse']})
}};
const R=window.SR;
store.set('sr_mobile_v2',JSON.stringify({slots:{1:{version:'0.9.9'}}}));
vm.runInThisContext(fs.readFileSync('starship/v10/data.js','utf8'),{filename:'data.js'});
vm.runInThisContext(fs.readFileSync('starship/v10/migration.js','utf8'),{filename:'migration.js'});

assert(store.has('sr_mobile_v2_pre_cards_v110'),'pre-v1.1 backup created');
const save={slot:1,salvage:100,weaponMounts:['weapon.pulse','weapon.flak','weapon.beam','weapon.torpedo'],weapons:['weapon.pulse','weapon.flak','weapon.beam','weapon.torpedo'],weaponInventory:{'weapon.autocannon':2,'weapon.pulse':1,'weapon.flak':2,'weapon.beam':1,'weapon.torpedo':1},weaponStock:{'weapon.autocannon':2,'weapon.pulse':1,'weapon.flak':2,'weapon.beam':1,'weapon.torpedo':1},unlockedW:['weapon.pulse','weapon.flak','weapon.beam','weapon.torpedo']};
const migrated=R.migrate(save);
assert.deepStrictEqual(migrated.weaponMounts,['weapon.autocannon','weapon.autocannon','weapon.railgun','weapon.missile'],'mount positions convert in place');
assert.strictEqual(migrated.weaponInventory['weapon.autocannon'],5,'autocannon stock preserves existing + converted copies');
assert.strictEqual(migrated.weaponInventory['weapon.railgun'],1,'beam becomes railgun');
assert.strictEqual(migrated.weaponInventory['weapon.missile'],1,'torpedo becomes missile');
for(const id of ['weapon.pulse','weapon.flak','weapon.beam','weapon.torpedo'])assert(!(id in migrated.weaponInventory),`${id} removed from inventory`);
assert.strictEqual(migrated.salvage,3180,'positive price-difference salvage refund is correct');
assert.strictEqual(migrated.saveSchema,8,'schema 8');
assert(migrated.cardCodex&&migrated.cardCodex.evolutions,'Evolution Bible initialized');
const once={salvage:migrated.salvage,inventory:JSON.stringify(migrated.weaponInventory),refund:migrated._v110WeaponRefund};
R.migrate(migrated);
assert.strictEqual(migrated.salvage,once.salvage,'migration is refund-idempotent');
assert.strictEqual(JSON.stringify(migrated.weaponInventory),once.inventory,'migration is inventory-idempotent');
assert.strictEqual(migrated._v110WeaponRefund,once.refund,'refund marker stable');

const fresh=R.newSave(2);
assert.deepStrictEqual(fresh.weaponMounts.slice(0,2),['weapon.autocannon','weapon.autocannon'],'fresh save starts with two Autocannons');
assert.strictEqual(fresh.salvage,900,'fresh save receives no conversion refund');
assert.strictEqual(fresh.weaponInventory['weapon.autocannon'],2,'fresh save owns two Autocannons');
for(const id of ['weapon.pulse','weapon.flak','weapon.beam','weapon.torpedo'])assert(!(id in fresh.weaponInventory),`fresh save has no ${id}`);
console.log('v1.1 migration validated: weapon conversion, refund, idempotence, fresh loadout');
