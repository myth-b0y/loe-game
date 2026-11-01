const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

const read=p=>fs.readFileSync(p,'utf8');
const data=read('starship/v11/data.js');
const rewards=read('starship/v11/rewards.js');
const modules=read('starship/v11/modules.js');
const targeting=read('starship/v11/targeting.js');
const ui=read('starship/v11/ui.js');
const css=read('starship/v11/style.css');
const loader=read('starship/loader-v9.js');
const index=read('starship/index.html');

assert(data.includes("X.VERSION='1.3.0'"),'v1.3 data version exists');
assert(data.includes("V.RANK_COLORS[7]='#f4f7ff'"),'MAX no longer uses purple');
assert(data.includes("X.UNIQUE_COLOR='#b987ff'"),'purple is reserved for Unique cards');
assert(data.includes('locked:false'),'color grammar remains centrally editable');
assert(rewards.includes('X.rollRank'),'rank-jump generator exists');
assert(rewards.includes('X.draftWidth'),'Luck-driven draft width exists');
assert(rewards.includes("kind:'unique'"),'Unique cards enter reward offers');
assert(rewards.includes('X.banishChoice'),'Banish removes run reward identities');
assert(rewards.includes('target>current+1?target-1:current'),'rank jumps apply their actual target rank');
assert(modules.includes('moduleSlots'),'run Modules respect a slot cap');
assert(modules.includes('bossModuleBase'),'boss/elite Module drops exist');
assert(modules.includes('v130EngineerModules'),'Engineer sells run Modules');
assert(targeting.includes('friendlyThreatScore'),'friendly fleet uses flagship-threat scoring');
assert(targeting.includes('enemySupportChance'),'enemy roles have companion-target chances');
assert(targeting.includes('this.en=sorted'),'offensive drones inherit flagship-threat ordering');
assert(targeting.includes('_v130Target'),'hostile projectiles remember companion targets');
assert(ui.includes('v130Banish'),'draft UI exposes Banish');
assert(ui.includes("prep?'AUTO PREP':'AUTO'"),'AUTO remains available in normal and prep drafts');
assert(ui.includes('v130Unique'),'Unique cards have a dedicated visual class');
assert(ui.includes('v130BuildExtras'),'Build screen shows Luck, Uniques and Modules');
assert(css.includes('.v130Unique'),'purple Unique styling exists');
assert(css.includes('.v130Wide'),'4/5-card drafts have compact overflow layout');
assert(loader.includes("const V='13.0.0'"),'loader cache key is v1.3');
assert(loader.includes("v11='./v11/'"),'loader declares removable v11 layer');
for(const f of ['data.js','rewards.js','modules.js','targeting.js','ui.js'])assert(loader.includes("v11+'"+f+"'"),`loader includes ${f}`);
assert(loader.includes("window.SR.VERSION='1.3.0'"),'final runtime is v1.3.0');
assert(loader.includes("version='1.3.0'"),'save display version is v1.3.0 without schema bump');
assert(index.includes('loader-v9.js?v=13.0.0'),'HTML cache key is v1.3');

// Execute the reward engine against a minimal canonical v10 runtime.
global.document={querySelector:()=>null};
global.window={SR:{
 WEAPONS:[
  {id:'weapon.autocannon',family:'autocannon',damage:10,rate:4,cost:240},
  {id:'weapon.railgun',family:'railgun',damage:90,rate:.7,cost:650},
  {id:'weapon.plasma',family:'plasma',damage:62,rate:.55,cost:1200},
  {id:'weapon.ion',family:'ion',damage:20,rate:1.8,cost:1400},
  {id:'weapon.missile',family:'missile',damage:50,rate:.8,cost:1800}
 ],DRONES:[],SUPPORTS:[],TACTICAL:[],
 Game:function(){},App:function(){},audio:{play:()=>{}},save:()=>{},migrate:s=>s,
 foundationWeaponCapacity:()=>1,foundationDroneCapacity:()=>0,foundationSupportCapacity:()=>0
}};
const R=window.SR;R.Game.prototype={build:()=>{}};R.App.prototype={};
vm.runInThisContext(read('starship/v10/data.js'),{filename:'v10-data.js'});
vm.runInThisContext(read('starship/v10/card-engine.js'),{filename:'v10-card-engine.js'});
vm.runInThisContext(read('starship/v10/capabilities.js'),{filename:'v10-capabilities.js'});
vm.runInThisContext(data,{filename:'v11-data.js'});
vm.runInThisContext(rewards,{filename:'v11-rewards.js'});
const V=R.V10,X=R.V130;
const game={
 s:{weaponMounts:['weapon.autocannon'],weapons:['weapon.autocannon'],equippedDrones:[],equippedSupports:[],tactical:[],crew:[],systems:{shield:1},banishCharges:2},
 h:{shield:100},maxShield:100,shield:100,maxHp:100,hp:100,mods:{damage:1,rate:1,crit:.05,aoe:1,salvage:1,xp:1},cards:[],level:1,rerolls:3,paused:false,wave:1
};
V.initState(game);V.snapshotCapabilities(game);X.ensure(game);
assert.strictEqual(V.SAVE_SCHEMA,8,'v1.3 does not bump the persistent save schema');
assert.strictEqual(V.RANK_COLORS[7],'#f4f7ff','MAX is white in runtime');
assert.strictEqual(X.UNIQUE_COLOR,'#b987ff','Unique runtime color is purple');
assert.strictEqual(X.banishAvailable(game),2,'future ship/crew banish hooks feed the run counter');

const oldRandom=Math.random;
Math.random=()=>.999999;
assert.strictEqual(X.rollRank(game,0),1,'ordinary roll advances one rank');
Math.random=()=>0;
assert.strictEqual(X.rollRank(game,0),7,'jackpot roll can leap directly to MAX');
Math.random=oldRandom;

assert(V.applyChoice(game,{kind:'path',id:'ricochet',rank:4}),'rank-jump Path selection applies');
assert.strictEqual(V.rawRank(game,'ricochet'),4,'taking a Rank IV offer bypasses II and III');
let cats=V.candidates(game).filter(q=>q.kind==='path'&&V.PATH_BY_ID[q.id].category==='autocannon');
assert.strictEqual(cats.length,1,'category commitment remains intact after a rank jump');
assert.strictEqual(cats[0].id,'ricochet','committed Path identity remains the only Autocannon Path');
assert(!X.canBanish(game,{kind:'path',id:'ricochet'}),'committed Path cannot be banished and brick the category');
assert(X.canBanish(game,{kind:'core',id:'damage'}),'Core can be banished');

assert(V.applyChoice(game,{kind:'unique',id:'fortuneCircuit'}),'Unique can be acquired');
assert(!V.applyChoice(game,{kind:'unique',id:'fortuneCircuit'}),'Unique cannot be acquired twice');
assert.strictEqual(X.luck(game),24,'Unique Luck contributes to run Luck');
X.ensure(game).modules.push('luckyCoil');
assert.strictEqual(X.luck(game),34,'Module and Unique Luck stack');
X.ensure(game).uniques.widebandOracle=true;
Math.random=()=>.999999;
assert.strictEqual(X.draftWidth(game),4,'Wideband Oracle guarantees at least four choices');
Math.random=oldRandom;

console.log('v1.3 run depth validated: rollback-safe state, rank jumps, Luck, Uniques, Banish, Modules, fleet targeting');
