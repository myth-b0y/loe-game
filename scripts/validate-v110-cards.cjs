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
]}};
vm.runInThisContext(fs.readFileSync('starship/v10/data.js','utf8'),{filename:'data.js'});
const V=window.SR.V10;
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
assert.deepStrictEqual(window.SR.WEAPONS.map(w=>w.id).sort(),['weapon.autocannon','weapon.ion','weapon.missile','weapon.plasma','weapon.railgun'].sort(),'five surviving weapons');
const loader=fs.readFileSync('starship/loader-v9.js','utf8');
for(const f of ['data.js','migration.js','card-engine.js','card-systems.js','card-ui.js','style.css'])assert(loader.includes(f),`loader references ${f}`);
assert(loader.indexOf("v10+'data.js'")<loader.indexOf("v10+'migration.js'"),'data before migration');
assert(loader.indexOf("v10+'migration.js'")<loader.indexOf("v10+'card-engine.js'"),'migration before engine');
assert(loader.indexOf("v10+'card-engine.js'")<loader.indexOf("v10+'card-systems.js'"),'engine before systems');
assert(loader.indexOf("v10+'card-systems.js'")<loader.indexOf("v10+'card-ui.js'"),'systems before UI');
console.log('v1.1 card catalog validated:',V.PATHS.length,'paths,',V.EVOLUTIONS.length,'evolutions,',V.CORES.length,'core cards');
