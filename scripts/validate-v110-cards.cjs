const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

global.window={SR:{WEAPONS:[
{id:'weapon.autocannon',family:'autocannon',cost:240},
{id:'weapon.pulse',family:'pulse',cost:300},
{id:'weapon.railgun',family:'railgun',cost:650},
{id:'weapon.beam',family:'beam',cost:950},
{id:'weapon.plasma',family:'plasma',cost:1200},
{id:'weapon.flak',family:'flak',cost:1100},
{id:'weapon.ion',family:'ion',cost:1400},
{id:'weapon.missile',family:'missile',cost:1800},
{id:'weapon.torpedo',family:'torpedo',cost:2800}
],DRONES:[
{id:'drone.striker',role:'offense'},
{id:'drone.guardian',role:'defense'}
],SUPPORTS:[
{id:'support.fighter',crewReq:1},
{id:'support.interceptor',crewReq:1}
],TACTICAL:[{id:'active.0'}]}};
vm.runInThisContext(fs.readFileSync('starship/v10/data.js','utf8'),{filename:'data.js'});
const R=window.SR,V=R.V10;
assert(V,'V10 missing');
assert.strictEqual(Object.keys(V.CATEGORIES).length,12,'12 categories');
assert.strictEqual(V.PATHS.length,36,'36 paths');
assert.strictEqual(V.CORES.length,10,'10 cores');
assert.strictEqual(V.EVOLUTIONS.length,18,'18 evolutions');
for(const [id,list] of Object.entries(V.PATHS_BY_CATEGORY))assert.strictEqual(list.length,3,`${id} has 3 paths`);
const symbols={};for(const p of V.PATHS){symbols[p.symbol]=(symbols[p.symbol]||0)+1;for(const [k,a] of Object.entries(p.stats))assert(Array.isArray(a)&&a.length===7,`${p.id}.${k} has seven ranks`)}
assert.strictEqual(Object.keys(symbols).length,18,'18 symbols');
for(const [s,n] of Object.entries(symbols))assert.strictEqual(n,2,`${s} occurs twice`);
for(const c of V.CORES)assert.strictEqual(c.values.length,7,`${c.id} has seven ranks`);
for(const e of V.EVOLUTIONS){assert.strictEqual(e.sources.length,2,`${e.id} has two sources`);const a=V.PATH_BY_ID[e.sources[0]],b=V.PATH_BY_ID[e.sources[1]];assert(a&&b,`${e.id} sources exist`);assert.strictEqual(a.symbol,e.symbol,`${e.id} symbol A`);assert.strictEqual(b.symbol,e.symbol,`${e.id} symbol B`)}
assert.deepStrictEqual(R.WEAPONS.map(w=>w.id).sort(),['weapon.autocannon','weapon.ion','weapon.missile','weapon.plasma','weapon.railgun'].sort(),'five surviving weapons');

const loader=fs.readFileSync('starship/loader-v9.js','utf8');
for(const f of ['data.js','migration.js','card-engine.js','capabilities.js','card-systems.js','card-ui.js','style.css'])assert(loader.includes(f),`loader references ${f}`);
assert(loader.indexOf("v10+'data.js'")<loader.indexOf("v10+'migration.js'"),'data before migration');
assert(loader.indexOf("v10+'migration.js'")<loader.indexOf("v10+'card-engine.js'"),'migration before engine');
assert(loader.indexOf("v10+'card-engine.js'")<loader.indexOf("v10+'capabilities.js'"),'engine before capability gate');
assert(loader.indexOf("v10+'capabilities.js'")<loader.indexOf("v10+'card-systems.js'"),'capability gate before systems');
assert(loader.indexOf("v10+'card-systems.js'")<loader.indexOf("v10+'card-ui.js'"),'systems before UI');

// Execute the operational capability gate with a tiny runtime stub. A mounted
// but unstaffed/unpowered system must not leak a Path into the draft pool.
R.Game=function(){};R.Game.prototype={};
R.foundationWeaponCapacity=()=>0;
R.foundationDroneCapacity=()=>0;
R.foundationSupportCapacity=()=>0;
vm.runInThisContext(fs.readFileSync('starship/v10/capabilities.js','utf8'),{filename:'capabilities.js'});
const save={weaponMounts:['weapon.autocannon'],equippedDrones:['drone.guardian'],equippedSupports:['support.fighter'],tactical:['active.0'],systems:{shield:1},crew:[
{role:'engineer',specialty:'Drone Systems',assigned:true},
{role:'pilot',assigned:true,assignment:'support:0:pilot'}
]};
const game={s:save,maxShield:90,h:{shield:90},cardState:{},droneUnits:[],supportUnits:[]};
let cap=V.snapshotCapabilities(game);
assert.deepStrictEqual(cap.weaponFamilies,[],'zero Fire Control capacity means no weapon Paths');
assert.strictEqual(cap.defensiveDrones,false,'zero Drone capacity means no drone Paths');
assert.strictEqual(cap.offensiveSupports,false,'zero Hangar/support capacity means no support Paths');
assert.strictEqual(cap.tactical,true,'equipped Tactical system enables Tactical Paths');
assert.strictEqual(cap.shields,true,'functional shield enables Shield Paths');

R.foundationWeaponCapacity=()=>1;
R.foundationDroneCapacity=()=>1;
R.foundationSupportCapacity=()=>1;
cap=V.snapshotCapabilities(game);
assert.deepStrictEqual(cap.weaponFamilies,['autocannon'],'operational mounted weapon enables its Path family');
assert.strictEqual(cap.defensiveDrones,true,'operational staffed defensive drone enables its Paths');
assert.strictEqual(cap.offensiveSupports,true,'operational staffed offensive support enables its Paths');
save.crew[0].assigned=false;
cap=V.snapshotCapabilities(game);
assert.strictEqual(cap.defensiveDrones,false,'unstaffed Drone Control removes drone Paths');
save.crew[0].assigned=true;save.crew[1].assignment='reserve';
cap=V.snapshotCapabilities(game);
assert.strictEqual(cap.offensiveSupports,false,'uncrewed support removes support Paths');

console.log('v1.1 validated:',V.PATHS.length,'paths,',V.EVOLUTIONS.length,'evolutions,',V.CORES.length,'core cards, operational draft gating');
