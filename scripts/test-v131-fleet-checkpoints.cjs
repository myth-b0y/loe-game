const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

const read=p=>fs.readFileSync(p,'utf8');
const data=read('starship/v12/data.js');
const checkpoints=read('starship/v12/checkpoints.js');
const fleet=read('starship/v12/fleet.js');
const ui=read('starship/v12/ui.js');
const css=read('starship/v12/style.css');
const v10=read('starship/v10/data.js');
const loader=read('starship/loader-v9.js');
const index=read('starship/index.html');

assert(data.includes("P.VERSION='1.3.1'"),'v1.3.1 data version exists');
assert(data.includes('10:5,20:9,30:13'),'checkpoint standard-level table is explicit');
assert(data.includes("if(mod===0)return v"),'multiples of ten remain canonical checkpoints');
assert(data.includes("if(mod===1)return v-1"),'legacy 11/21-style checkpoints normalize backward');
assert(data.includes("if(mod===9)return v+1"),'legacy boss-wave checkpoint values normalize forward');
assert(data.includes("'support.bomber':{primaryFamily:'plasma',hull:{family:'autocannon'"),'Bomber has hull guns plus plasma turret family');
assert(data.includes("'support.ew':{primaryFamily:'ion',hull:{family:'autocannon'"),'EW Craft has hull guns plus ion turret family');
assert(data.includes("'support.repair':{primaryFamily:'repair',hull:{family:'autocannon'"),'Rescue Cutter has hull guns plus repair turret channel');
assert(data.includes("'support.gunship':{primaryFamily:'railgun',hull:{family:'autocannon'"),'Gunship has hull guns plus railgun turret family');
assert(data.includes("id:'fleetLink'"),'fleet-command Unique expands Fleet Echo');
assert(data.includes("id:'formationLock'"),'fleet-command Unique protects supports');
assert(data.includes("id:'rapidRecovery'"),'fleet-command Unique accelerates support rebuild');

assert(checkpoints.includes("let intercepted=null"),'launch wrapper intercepts old direct checkpoint starts');
assert(checkpoints.includes("b.onclick=()=>{selected=w||1;paint()}"),'wave buttons select instead of immediately launching');
assert(checkpoints.includes("go.onclick=()=>{const w=selected;sh.remove();app.startAtCheckpoint(w)}"),'only confirmation LAUNCH starts selected checkpoint');
assert(checkpoints.includes("g.wave=Math.max(0,w-1)"),'selected checkpoint begins on its exact wave');
assert(checkpoints.includes("const target=P.standardLevelForWave(w),prep=Math.max(0,target-1)"),'checkpoint prep derives from standard level');
assert(checkpoints.includes("g._v110Prep={remaining:prep,total:prep,targetLevel:target,v131:true}"),'one real draft is queued per prior standard level');
assert(checkpoints.includes("g.level=Math.max(1,p.targetLevel-p.remaining+1)"),'prep drafts advance through simulated player levels');
assert(!checkpoints.includes("Math.floor((w-1)*.33)"),'legacy .33 compensation heuristic is gone from v1.3.1');

assert(fleet.includes('P.fireHullWeapon'),'two-crew supports own an independent hull-gun channel');
assert(fleet.includes('u._v131HullCd'),'hull guns have an independent cooldown');
assert(fleet.includes("P.SUPPORT_WEAPONS[def?.id]?.primaryFamily"),'specialist turret shots receive weapon-family tags');
assert(fleet.includes("p.family='fleet.'+family"),'companion projectiles are separated from full flagship Path processing');
assert(fleet.includes("rank(g,'ricochet')"),'Fleet Echo supports Autocannon ricochet');
assert(fleet.includes("rank(g,'scatter')"),'Fleet Echo supports Autocannon scatter');
assert(fleet.includes("rank(g,'burst')"),'Fleet Echo supports Autocannon burst');
assert(fleet.includes("rank(g,'chainArc')"),'Fleet Echo supports Ion chaining');
assert(fleet.includes("rank(g,'clusterCore')"),'Fleet Echo supports Plasma clustering');
assert(fleet.includes("rank(g,'shattershot')"),'Fleet Echo supports Railgun shatter');
assert(fleet.includes("rank(g,'clusterRack')"),'Fleet Echo supports Missile clustering');
assert(fleet.includes('(g.shots?.length||0)<420'),'fleet projectile generation has a hard cap');
assert(fleet.includes("X.effectSum?.(this,'supportDefense')"),'Formation Lock reduces support damage');
assert(fleet.includes("X.effectSum?.(this,'supportRespawn')"),'Rapid Recovery affects support rebuild time');

assert(v10.includes('V.SAVE_SCHEMA=8'),'v1.3.1 does not change persistent save schema');
assert(loader.includes("const V='13.1.0'"),'loader cache key is v1.3.1');
assert(loader.includes("v12='./v12/'"),'loader declares removable v12 patch layer');
for(const f of ['data.js','checkpoints.js','fleet.js','ui.js'])assert(loader.includes("v12+'"+f+"'"),'loader includes v12 '+f);
assert(loader.indexOf("v11+'ui.js'")<loader.indexOf("v12+'data.js'"),'v1.3.1 loads strictly after known-good v1.3.0');
assert(loader.includes("window.SR.VERSION='1.3.1'"),'final runtime is v1.3.1');
assert(loader.includes("version='1.3.1'"),'save display version is v1.3.1 without schema bump');
assert(index.includes('loader-v9.js?v=13.1.0'),'HTML cache key is v1.3.1');
assert(ui.includes("R.VERSION='1.3.1'"),'visible runtime label is v1.3.1');
assert(css.includes('.v131Selected'),'selected checkpoint has a dedicated visual state');

// Execute the small data layer to prove checkpoint standards and Unique extension.
global.window={SR:{Game:function(){},V10:{},V130:{UNIQUES:[],UNIQUE_BY_ID:{}},SUPPORTS:[]}};
vm.runInThisContext(data,{filename:'v131-data.js'});
const P=window.SR.V131,X=window.SR.V130;
assert.strictEqual(P.standardLevelForWave(1),1);
assert.strictEqual(P.standardLevelForWave(10),5);
assert.strictEqual(P.standardLevelForWave(20),9);
assert.strictEqual(P.standardLevelForWave(30),13);
assert.strictEqual(P.standardLevelForWave(110),45,'deep checkpoints continue the explicit four-level-per-sector standard');
assert.deepStrictEqual(P.normalizeCheckpoints({checkpoints:[1,9,11,19,20,31]}).checkpoints,[1,10,20,30]);
assert.strictEqual(X.UNIQUES.length,3,'v1.3.1 adds three fleet-command Uniques');

console.log('v1.3.1 validated: checkpoint selection, standard prep, dual-channel supports, Fleet Echo, rollback-safe schema');
