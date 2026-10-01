const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

global.document={querySelector:()=>null};
global.window={SR:{
 WEAPONS:[
  {id:'weapon.autocannon',family:'autocannon',damage:10,rate:4,cost:240},
  {id:'weapon.railgun',family:'railgun',damage:90,rate:.7,cost:650},
  {id:'weapon.plasma',family:'plasma',damage:62,rate:.55,cost:1200},
  {id:'weapon.ion',family:'ion',damage:20,rate:1.8,cost:1400},
  {id:'weapon.missile',family:'missile',damage:50,rate:.8,cost:1800}
 ],DRONES:[],SUPPORTS:[],TACTICAL:[],
 Game:function(){},App:function(){},
 audio:{play:()=>{}},save:()=>{},migrate:s=>s,
 foundationWeaponCapacity:()=>1,foundationDroneCapacity:()=>0,foundationSupportCapacity:()=>0
}};
const R=window.SR;R.Game.prototype={build:()=>{}};R.App.prototype={};
vm.runInThisContext(fs.readFileSync('starship/v10/data.js','utf8'),{filename:'data.js'});
vm.runInThisContext(fs.readFileSync('starship/v10/card-engine.js','utf8'),{filename:'card-engine.js'});
vm.runInThisContext(fs.readFileSync('starship/v10/capabilities.js','utf8'),{filename:'capabilities.js'});
const V=R.V10;
const game={
 s:{weaponMounts:['weapon.autocannon'],weapons:['weapon.autocannon'],equippedDrones:[],equippedSupports:[],tactical:[],crew:[],systems:{shield:1}},
 h:{shield:100},maxShield:100,shield:100,maxHp:100,hp:100,mods:{damage:1,rate:1,crit:.05,aoe:1,salvage:1,xp:1},cards:[],level:1,rerolls:3,paused:false
};
V.initState(game);V.snapshotCapabilities(game);
let candidates=V.candidates(game);
const pathCats=()=>new Set(candidates.filter(x=>x.kind==='path').map(x=>V.PATH_BY_ID[x.id].category));
let cats=pathCats();
assert(cats.has('autocannon'),'equipped Autocannon contributes a Path');
assert(cats.has('shield'),'functional shield contributes a Path');
assert(cats.has('ship'),'Ship always contributes a Path');
for(const id of ['railgun','plasma','ion','missile','offDrone','defDrone','offSupport','defSupport','tactical'])assert(!cats.has(id),`${id} does not leak into draft without operational system`);

// Commit one Autocannon Path and verify the other two identities never return.
assert(V.applyChoice(game,{kind:'path',id:'ricochet',rank:1}),'first Path selection applies');
candidates=V.candidates(game);
const autos=candidates.filter(x=>x.kind==='path'&&V.PATH_BY_ID[x.id].category==='autocannon');
assert.strictEqual(autos.length,1,'committed category contributes one upgrade');
assert.strictEqual(autos[0].id,'ricochet','committed category only returns selected Path');
assert.strictEqual(autos[0].rank,2,'next rank is offered');
assert(!V.applyChoice(game,{kind:'path',id:'burst',rank:1}),'rejected Path cannot be selected after commitment');

// Rank VII exits the pool.
game.cardState.paths.ricochet=7;
candidates=V.candidates(game);
assert(!candidates.some(x=>x.kind==='path'&&V.PATH_BY_ID[x.id].category==='autocannon'),'MAX Path leaves draft pool');

// Mismatched symbols do not evolve.
game.cardState.categories.shield='reflector';game.cardState.paths.reflector=7;
game.cardState.categories.defDrone='aegis';game.cardState.paths.aegis=7;
V.checkReady(game);
assert.strictEqual(game.cardState.evolutionQueue.length,0,'mismatched MAX Paths do not evolve');

// Matching symbols do evolve and queue only once.
game.cardState.categories.defDrone='countermeasure';delete game.cardState.paths.aegis;game.cardState.paths.countermeasure=7;
V.checkReady(game);V.checkReady(game);
assert.deepStrictEqual(game.cardState.evolutionQueue,['mirrorstorm'],'matching MAX Paths queue exactly one Evolution');

// Core ranks are independent and MAX Core exits the pool.
game.cardState.core.damage=6;
candidates=V.candidates(game);
const dmg=candidates.find(x=>x.kind==='core'&&x.id==='damage');
assert(dmg&&dmg.rank===7,'Core next rank offered independently');
game.cardState.core.damage=7;
candidates=V.candidates(game);
assert(!candidates.some(x=>x.kind==='core'&&x.id==='damage'),'MAX Core exits draft pool');

console.log('v1.1 engine validated: no dead cards, category lock, MAX removal, Evolution matching, Core ranks');
