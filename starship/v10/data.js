(()=>{
'use strict';
const R=window.SR;if(!R)throw new Error('V10 data requires SR');
const V=R.V10=R.V10||{};
V.VERSION='1.1.0';V.SAVE_SCHEMA=8;
V.RANK_COLORS={1:'#f4f7fb',2:'#69e58b',3:'#62a8ff',4:'#ffe06b',5:'#ff9d52',6:'#ff626f',7:'#b987ff',evolution:'prismatic'};
V.RANK_NAMES={1:'I',2:'II',3:'III',4:'IV',5:'V',6:'VI',7:'VII'};
V.CATEGORIES={
 shield:{id:'shield',name:'SHIELDS',kind:'shield'},defDrone:{id:'defDrone',name:'DEFENSIVE DRONES',kind:'defDrone'},
 autocannon:{id:'autocannon',name:'AUTOCANNON',kind:'weapon',family:'autocannon'},offDrone:{id:'offDrone',name:'OFFENSIVE DRONES',kind:'offDrone'},
 plasma:{id:'plasma',name:'PLASMA MORTAR',kind:'weapon',family:'plasma'},offSupport:{id:'offSupport',name:'OFFENSIVE SUPPORT',kind:'offSupport'},
 ion:{id:'ion',name:'ION ARC',kind:'weapon',family:'ion'},defSupport:{id:'defSupport',name:'DEFENSIVE SUPPORT',kind:'defSupport'},
 railgun:{id:'railgun',name:'RAILGUN',kind:'weapon',family:'railgun'},ship:{id:'ship',name:'SHIP',kind:'ship'},
 missile:{id:'missile',name:'MISSILES',kind:'weapon',family:'missile'},tactical:{id:'tactical',name:'TACTICAL / UTILITY',kind:'tactical'}
};
const P=(id,category,symbol,name,desc,stats,visual)=>({id,category,symbol,name,desc,stats,visual});
V.PATHS=[
 P('reflector','shield','◆','Reflector Field','Shield impacts can return hostile projectiles.',{chance:[.08,.11,.15,.19,.24,.30,.36],returnDamage:[.55,.62,.70,.78,.86,.94,1.05]},'Faceted glass geometry and sharper prism flashes.'),
 P('layered','shield','▲','Layered Field','The shield separates into independent protective layers.',{layers:[2,2,3,3,4,4,5],capacity:[.04,.08,.12,.16,.20,.25,.30],overflow:[0,.05,.10,.15,.20,.25,.30]},'Concentric shield shells break one at a time.'),
 P('regenerative','shield','●','Regenerative Field','Shield recovery accelerates after avoiding damage.',{delay:[.08,.14,.20,.27,.34,.42,.50],regen:[.15,.25,.38,.52,.68,.86,1.05]},'Luminous repair waves knit the field back together.'),
 P('countermeasure','defDrone','◆','Countermeasure Drones','Defensive drones intercept incoming projectiles.',{cooldown:[2.4,2.1,1.8,1.55,1.3,1.05,.8],radius:[0,.05,.10,.15,.20,.25,.30],reliability:[.75,.80,.85,.90,.94,.97,1]},'Fast interception dashes around the shield perimeter.'),
 P('aegis','defDrone','▲','Aegis Drones','Defensive drones become directional armor plates.',{hp:[.04,.05,.06,.07,.085,.105,.13],rebuild:[12,11,10,9,8,7,6],arc:[24,28,32,36,40,44,48]},'Broad shield faces rotate like armored petals.'),
 P('repairDrones','defDrone','●','Repair Drones','Defensive drones pulse hull repairs.',{pulse:[6,5.5,5,4.5,4,3.5,3],repair:[.0025,.0032,.004,.005,.0062,.0076,.0092]},'Repair beams, sparks and sealing hull lines.'),
 P('ricochet','autocannon','✦','Ricochet Feed','Autocannon rounds bounce between targets.',{bounces:[1,1,2,2,3,3,4],retain:[.50,.56,.62,.68,.74,.80,.86],range:[0,.05,.10,.15,.20,.25,.30]},'Bright angular tracer chains.'),
 P('burst','autocannon','✚','Burst Chamber','The Autocannon stores rounds and unloads violent bursts.',{rounds:[3,4,4,5,6,7,8],speed:[2.2,2.5,2.8,3.1,3.5,4,4.6],recovery:[.65,.62,.59,.56,.53,.49,.45]},'Tight rhythmic muzzle-flash volleys.'),
 P('scatter','autocannon','⬡','Scatter Feed','Each Autocannon cycle becomes a spreading fan of rounds.',{shots:[3,4,4,5,6,7,8],damage:[.45,.43,.42,.40,.38,.36,.35],spread:[18,20,22,24,26,28,30]},'Widening fans of kinetic tracers.'),
 P('hunter','offDrone','✦','Hunter Drones','Attack drones snap rapidly from kill to kill.',{retarget:[.60,.50,.40,.32,.25,.18,.12],move:[.10,.18,.27,.37,.48,.60,.75],killDamage:[.10,.15,.22,.30,.40,.52,.65]},'Sharper turns and long acceleration streaks.'),
 P('strike','offDrone','✚','Strike Drones','Attack drones fire synchronized volleys.',{interval:[5.5,5,4.6,4.2,3.8,3.4,3],shots:[2,2,3,3,4,4,5],damage:[.80,.82,.84,.86,.88,.90,.92]},'Drone firing lines flash together.'),
 P('swarmDrones','offDrone','⬡','Swarm Drones','Each real attack drone carries a cloud of microdrones.',{count:[2,2,3,3,4,4,5],damage:[.60,.60,.52,.52,.46,.46,.42],rate:[.85,.90,.95,1,1.05,1.10,1.15]},'The offensive orbit becomes a machine cloud.'),
 P('scorch','plasma','☀','Scorch Payload','Plasma impacts leave burning fields.',{duration:[2,2.5,3,3.5,4,4.75,5.5],dps:[.10,.12,.14,.17,.20,.24,.28],radius:[.75,.80,.85,.90,1,1.10,1.20]},'Molten plasma pools and heat shimmer.'),
 P('clusterCore','plasma','☄','Cluster Core','Plasma shells fragment into secondary explosions.',{fragments:[2,3,3,4,5,6,7],damage:[.24,.25,.26,.27,.28,.30,.32],radius:[.35,.38,.41,.44,.47,.50,.55]},'Two-stage impacts burst outward.'),
 P('overcharge','plasma','⌁','Overcharge Core','Plasma charges into slower, larger, heavier shots.',{damage:[1.45,1.65,1.90,2.15,2.40,2.70,3],cycle:[1.45,1.40,1.35,1.30,1.25,1.20,1.15],radius:[1.05,1.10,1.18,1.26,1.35,1.45,1.55]},'Growing plasma spheres with long luminous trails.'),
 P('bomberWing','offSupport','☀','Bomber Wing','Offensive support craft perform bombing runs.',{interval:[9,8.2,7.4,6.7,6,5.3,4.6],bombs:[2,2,3,3,4,4,5],damage:[.55,.60,.65,.70,.75,.80,.85]},'Support passes leave glowing bomb trails.'),
 P('gunshipWing','offSupport','☄','Gunship Wing','Heavy support craft sustain fire into groups.',{rate:[.10,.18,.27,.37,.48,.60,.75],damage:[0,.05,.10,.15,.20,.25,.30],uptime:[.20,.30,.40,.50,.60,.72,.85]},'Longer, denser broadside sequences.'),
 P('siegeWing','offSupport','⌁','Siege Wing','Support craft focus heavy attacks on elites and bosses.',{boss:[.20,.30,.42,.55,.68,.82,1],heavy:[1.30,1.45,1.60,1.80,2,2.25,2.50],charge:[2,1.9,1.8,1.7,1.6,1.5,1.4]},'Visible formation alignment before heavy shots.'),
 P('chainArc','ion','☾','Chain Arc','Ion damage jumps through nearby enemies.',{jumps:[1,2,3,4,5,6,7],retain:[.55,.58,.61,.64,.67,.70,.74],range:[0,.05,.10,.15,.20,.25,.30]},'Lightning branches across formations.'),
 P('blackout','ion','★','Blackout Arc','Ion hits suppress hostile weapon systems.',{duration:[.25,.35,.45,.55,.70,.85,1],cooldown:[4,3.6,3.2,2.8,2.4,2,1.6],bossRate:[.05,.08,.11,.14,.17,.20,.24]},'Struck ships flicker and lose weapon glow.'),
 P('staticCharge','ion','■','Static Charge','Repeated Ion hits build toward an electrical discharge.',{stacks:[8,8,7,7,6,5,4],life:[3,3.5,4,4.5,5,5.5,6],damage:[.80,1,1.20,1.45,1.70,2,2.30],chains:[1,1,2,2,3,3,4]},'Targets accumulate visible crackling charge.'),
 P('interceptorEscort','defSupport','☾','Interceptor Escort','Defensive supports aggressively engage close threats.',{response:[4.5,4,3.5,3,2.6,2.2,1.8],damage:[.15,.25,.35,.45,.55,.70,.90],radius:[1.10,1.15,1.20,1.25,1.30,1.40,1.50]},'Support craft peel away to meet rushers.'),
 P('ewFrigate','defSupport','★','EW Frigate','Defensive supports emit jamming pulses.',{interval:[11,10,9,8,7,6,5],duration:[1.2,1.5,1.8,2.1,2.4,2.8,3.2],penalty:[.10,.14,.18,.22,.27,.32,.38]},'Wide distortion waves darken hostile weapons.'),
 P('shieldTender','defSupport','■','Shield Tender','Defensive supports project temporary overshields.',{shield:[.06,.08,.10,.13,.16,.20,.25],duration:[3,3.5,4,4.5,5,5.5,6],cooldown:[13,12,11,10,9,8,7]},'Temporary shield bubbles bloom around the fleet.'),
 P('penetrator','railgun','◇','Penetrator','Railgun rounds retain force through multiple ships.',{pierce:[1,2,3,4,5,6,8],retain:[.82,.84,.86,.88,.90,.92,.95],speed:[.05,.10,.15,.20,.25,.30,.40]},'Long bright slugs spear through formations.'),
 P('capacitorShot','railgun','⊙','Capacitor Shot','Energy stores between Railgun attacks for a heavier shot.',{damage:[1.50,1.75,2,2.25,2.55,2.90,3.30],charge:[2.6,2.4,2.2,2,1.85,1.70,1.55],speed:[0,.05,.10,.15,.20,.25,.30]},'Energy crawls along the barrel before release.'),
 P('shattershot','railgun','✧','Shattershot','Railgun impacts burst into high-speed fragments.',{fragments:[3,4,5,6,7,8,10],damage:[.18,.20,.22,.24,.26,.29,.32],cone:[35,40,45,50,55,60,70]},'Impact sprays widen into fragment storms.'),
 P('ablative','ship','◇','Ablative Plating','Expendable armor sections absorb major hull hits.',{plates:[2,2,3,3,4,4,5],hp:[.05,.06,.06,.07,.07,.08,.09],overflow:[0,.05,.10,.15,.20,.25,.30]},'Visible hull plates shear away under damage.'),
 P('capacitorBank','ship','⊙','Capacitor Bank','Unused ship power accumulates for an empowered volley.',{charge:[10,9,8.2,7.5,6.8,6.1,5.5],damage:[.20,.25,.30,.36,.43,.51,.60],speed:[.05,.07,.09,.11,.14,.17,.20]},'Reactor light routes forward through the hull.'),
 P('reactive','ship','✧','Reactive Plating','Hull hits detonate defensive armor outward.',{cooldown:[2.5,2.2,1.9,1.6,1.4,1.2,1],damage:[.35,.45,.55,.65,.75,.90,1.10],radius:[.80,.90,1,1.10,1.20,1.30,1.45]},'Directional armor blasts answer hull impacts.'),
 P('swarmRack','missile','⊕','Swarm Rack','The Missile Rack launches many small independent seekers.',{count:[3,4,5,6,7,8,10],damage:[.45,.42,.40,.38,.36,.34,.32],homing:[.10,.15,.20,.25,.30,.35,.40]},'Missiles split into swirling clouds.'),
 P('torpedoRack','missile','♠','Torpedo Rack','Missiles become slow, enormous warheads.',{damage:[2.20,2.50,2.80,3.10,3.50,3.90,4.40],rate:[.55,.56,.57,.58,.59,.60,.62],radius:[1.25,1.35,1.45,1.55,1.65,1.80,2]},'Large warheads crawl away before accelerating.'),
 P('clusterRack','missile','✺','Cluster Rack','Missiles split into submunitions near the target.',{count:[3,4,4,5,6,7,8],damage:[.24,.25,.27,.29,.31,.33,.35],radius:[.10,.15,.20,.25,.30,.40,.50]},'Warheads blossom into submunition clouds.'),
 P('targetPainter','tactical','⊕','Target Painter','Tactical systems mark priority enemies for concentrated damage.',{targets:[1,1,2,2,3,4,5],damage:[.08,.11,.14,.18,.22,.27,.32],duration:[4,4.5,5,5.5,6,7,8],cooldown:[12,11,10,9,8,7,6]},'Bright brackets and linking target lines.'),
 P('gravityWell','tactical','♠','Gravity Well','Tactical systems create a temporary gravity anomaly.',{duration:[2,2.4,2.8,3.2,3.6,4.1,4.6],radius:[1,1.10,1.20,1.30,1.40,1.55,1.70],pull:[1,1.15,1.30,1.50,1.70,1.95,2.25],cooldown:[16,15,14,13,12,11,10]},'Dark spatial distortion bends nearby trajectories.'),
 P('novaPulse','tactical','✺','Nova Pulse','The flagship periodically releases a radial clearing blast.',{damage:[1,1.25,1.55,1.90,2.30,2.75,3.25],radius:[1,1.10,1.20,1.30,1.45,1.60,1.80],knock:[1,1.15,1.30,1.50,1.70,1.95,2.25],cooldown:[14,13,12,11,10,9,8]},'A luminous ring expands from the flagship.')
];
const C=(id,name,icon,values,format)=>({id,name,icon,values,format});
V.CORES=[
 C('damage','Damage','✦',[.08,.16,.25,.35,.46,.58,.72],v=>'+'+Math.round(v*100)+'% damage'),
 C('fireRate','Fire Rate','»',[.06,.12,.19,.27,.36,.46,.58],v=>'+'+Math.round(v*100)+'% fire rate'),
 C('crit','Crit Chance','◆',[.03,.06,.09,.13,.17,.22,.28],v=>'+'+Math.round(v*100)+'% crit chance'),
 C('hull','Hull','♥',[.10,.20,.31,.43,.56,.70,.85],v=>'+'+Math.round(v*100)+'% max hull'),
 C('shield','Shield','⬡',[.10,.20,.31,.43,.56,.70,.85],v=>'+'+Math.round(v*100)+'% max shield'),
 C('tacticalCooldown','Tactical Cooldown','◔',[.04,.08,.12,.16,.20,.24,.28],v=>'-'+Math.round(v*100)+'% Tactical cooldown'),
 C('repairEfficiency','Repair Efficiency','✚',[.10,.20,.32,.45,.60,.76,.95],v=>'+'+Math.round(v*100)+'% repair'),
 C('blastRadius','Blast Radius','✹',[.08,.16,.25,.35,.46,.58,.72],v=>'+'+Math.round(v*100)+'% blast radius'),
 C('salvage','Salvage','◇',[.06,.12,.20,.28,.37,.47,.58],v=>'+'+Math.round(v*100)+'% salvage'),
 C('xp','XP Gain','△',[.05,.10,.15,.21,.27,.34,.42],v=>'+'+Math.round(v*100)+'% XP')
];
const E=(id,symbol,name,a,b,desc,stats,visual)=>({id,symbol,name,sources:[a,b],desc,stats,visual});
V.EVOLUTIONS=[
 E('mirrorstorm','◆','MIRRORSTORM','reflector','countermeasure','Shield and drones turn incoming fire into retaliation.',{reflect:.50,shieldDamage:1.50,intercept:.55,redirectDamage:1.75,speed:1.35,radius:1.40},'Prismatic shield facets and rainbow redirected fire.'),
 E('citadelHalo','▲','CITADEL HALO','layered','aegis','Defensive drones lock into a rotating segmented fortress.',{segmentHp:.20,shield:.40,rebuild:4.5,overflow:.50,rotation:1.25},'Concentric armored shield segments rotate around the ship.'),
 E('phoenixMesh','●','PHOENIX MESH','regenerative','repairDrones','Hull and shield recovery become one linked regenerative mesh.',{delay:.60,shieldRegen:1.30,repair:.011,cross:.35,critical:2,criticalTime:5,criticalCd:20},'Living circuitry seals hull scars as shield energy returns.'),
 E('packfire','✦','PACKFIRE','ricochet','hunter','Ricochets and Hunter Drones become one cascading kill chain.',{bounces:6,retain:.92,retarget:.05,move:.90,droneDamage:.80,killShots:2,killShotDamage:.70,recursion:2},'Drones chase the same zigzag tracer constellation.'),
 E('synchronizedSalvo','✚','SYNCHRONIZED SALVO','burst','strike','Every flagship burst commands the entire drone wing to fire.',{rounds:10,speed:5.2,recovery:.40,droneShots:6,droneDamage:1,damage:.25,refund:.06,refundCap:.36},'One enormous synchronized wall of tracer fire.'),
 E('bulletHive','⬡','BULLET HIVE','scatter','swarmDrones','The flagship and drone cloud become a distributed machine gun.',{shots:10,shotDamage:.32,spread:34,micro:6,microDamage:.40,microRate:1.25,range:.30},'A dense machine cloud bends micro-rounds toward targets.'),
 E('sunscar','☀','SUNSCAR','scorch','bomberWing','Bombers paint plasma lanes that Mortar impacts ignite.',{duration:7,dps:.35,radius:1.30,interval:4,bombs:6,bombDamage:.90,laneDuration:6,laneDps:.30,eruption:1.60,maxLanes:3},'Burning support-flight scars erupt like solar fissures.'),
 E('meteorBroadside','☄','METEOR BROADSIDE','clusterCore','gunshipWing','Every Plasma impact becomes a support bombardment command.',{fragments:9,fragDamage:.34,fragRadius:.60,rate:.90,damage:.40,supportShots:2,supportDamage:.70,cooldown:1.5},'Converging support fire turns one hit into a meteor storm.'),
 E('starbreaker','⌁','STARBREAKER','overcharge','siegeWing','Support ships channel into one colossal flagship plasma shot.',{damage:4.5,radius:2.1,cycle:1.10,perSupport:.35,supportCap:1.40,boss:1.25,bossExtra:.40},'The fleet dims while a miniature sun forms at the flagship.'),
 E('stormNet','☾','STORM NET','chainArc','interceptorEscort','Interceptors become moving relay nodes for a fleet-wide Ion lattice.',{jumps:9,retain:.80,range:.40,response:1.3,damage:1.10,tick:.35,tickCd:.7},'Lightning continuously links flagship, escorts and enemies.'),
 E('deadZone','★','DEAD ZONE','blackout','ewFrigate','The fleet projects a moving blackout field.',{duration:6,cooldown:9,fire:.60,accuracy:.60,shield:.80,special:.50,bossFire:.25,bossShield:.35,bossSpecial:.20,extend:.15,extendCap:2},'A dark distortion field makes hostile weapons flicker out.'),
 E('thunderhead','■','THUNDERHEAD','staticCharge','shieldTender','Projected overshields store damage and erupt as chain lightning.',{shield:.32,duration:6.5,cooldown:6,cap:.40,store:.35,mult:1.5,base:2.5,chains:6,retain:.75,stacks:2,storeCap:.40},'Overshields fill with visible electrical storms before exploding.'),
 E('ironSpine','◇','IRON SPINE','penetrator','ablative','The Railgun consumes ablative plates to launch reinforced penetrators.',{pierce:12,retain:1,speed:.60,plates:5,plateHp:.10,overflow:.35,damage:1.25,width:.50,rebuild:8},'Armor physically slides into the Railgun before firing.'),
 E('singularityDriver','⊙','SINGULARITY DRIVER','capacitorShot','capacitorBank','The entire flagship becomes the Railgun capacitor.',{damage:6,pierce:14,retain:1,width:2,armorIgnore:.35,recharge:5,otherRate:.50,recovery:1},'Ship lights shut down section by section before a blinding shot.'),
 E('shrapnelCrown','✧','SHRAPNEL CROWN','shattershot','reactive','Hull impacts build an orbiting crown of fragments for the Railgun.',{fragments:12,fragDamage:.30,cone:80,reactiveCd:.8,shardsPerHit:3,maxShards:18,shardDamage:.22,maxVolley:3.96},'Metal shards orbit visibly, then collapse forward with the shot.'),
 E('hunterConstellation','⊕','HUNTER CONSTELLATION','swarmRack','targetPainter','Target Painter becomes the guidance brain for every missile.',{missiles:12,damage:.34,homing:.50,targets:6,markDamage:.35,duration:8,cooldown:5,retarget:1},'Target lines form constellations while missile groups reroute in flight.'),
 E('eventHorizonTorpedo','♠','EVENT HORIZON TORPEDO','torpedoRack','gravityWell','A torpedo carries its own gravity well through enemy formations.',{damage:5.5,rate:.60,radius:2.3,gravityRadius:1.9,pull:2.5,duration:4.5,perCaptured:.15,captureCap:1.20},'Space bends around the warhead before collapsing inward and exploding.'),
 E('novaBloom','✺','NOVA BLOOM','clusterRack','novaPulse','Submunitions form a ring and detonate as a miniature Nova.',{subs:10,damage:.35,distribution:.60,delay:.35,nova:1.80,radius:2,knock:2.5,directCap:4},'A perfect glowing ring pauses, then erupts into a starburst.' )
];
V.PATH_BY_ID=Object.fromEntries(V.PATHS.map(x=>[x.id,x]));
V.CORE_BY_ID=Object.fromEntries(V.CORES.map(x=>[x.id,x]));
V.EVO_BY_ID=Object.fromEntries(V.EVOLUTIONS.map(x=>[x.id,x]));
V.PATHS_BY_CATEGORY={};for(const p of V.PATHS)(V.PATHS_BY_CATEGORY[p.category]||(V.PATHS_BY_CATEGORY[p.category]=[])).push(p);
V.SOURCE_TO_EVO={};for(const e of V.EVOLUTIONS)for(const p of e.sources)(V.SOURCE_TO_EVO[p]=e.id);
V.BONDS=[['shield','defDrone'],['autocannon','offDrone'],['plasma','offSupport'],['ion','defSupport'],['railgun','ship'],['missile','tactical']];
V.OFF_SUPPORT_IDS=new Set(['support.fighter','support.bomber','support.gunship']);
V.DEF_SUPPORT_IDS=new Set(['support.interceptor','support.ew','support.repair']);
V.FINAL_WEAPON_IDS=new Set(['weapon.autocannon','weapon.railgun','weapon.plasma','weapon.ion','weapon.missile']);
V.WEAPON_MIGRATION={'weapon.pulse':'weapon.autocannon','weapon.beam':'weapon.railgun','weapon.flak':'weapon.autocannon','weapon.torpedo':'weapon.missile'};
V.LEGACY_WEAPON_BY_ID={};for(const w of R.WEAPONS||[])V.LEGACY_WEAPON_BY_ID[w.id]={...w};
for(const [oldId,newId] of Object.entries(V.WEAPON_MIGRATION))if(!V.LEGACY_WEAPON_BY_ID[newId])V.LEGACY_WEAPON_BY_ID[newId]={id:newId,cost:0};
R.WEAPONS=(R.WEAPONS||[]).filter(w=>V.FINAL_WEAPON_IDS.has(w.id));
V.weaponByFamily=f=>(R.WEAPONS||[]).find(w=>w.family===f);
V.rankValue=(arr,rank)=>Array.isArray(arr)&&rank>0?arr[Math.min(7,rank)-1]:0;
V.validate=()=>{
 const errors=[];
 if(Object.keys(V.CATEGORIES).length!==12)errors.push('categories');
 if(V.PATHS.length!==36)errors.push('paths');
 if(V.CORES.length!==10)errors.push('cores');
 if(V.EVOLUTIONS.length!==18)errors.push('evolutions');
 for(const [id,list] of Object.entries(V.PATHS_BY_CATEGORY))if(list.length!==3)errors.push('category:'+id);
 const syms={};for(const p of V.PATHS)syms[p.symbol]=(syms[p.symbol]||0)+1;
 if(Object.keys(syms).length!==18||Object.values(syms).some(n=>n!==2))errors.push('symbols');
 for(const e of V.EVOLUTIONS){const [a,b]=e.sources.map(id=>V.PATH_BY_ID[id]);if(!a||!b||a.symbol!==e.symbol||b.symbol!==e.symbol)errors.push('recipe:'+e.id)}
 if(errors.length)throw new Error('V10 CARD DATA INVALID: '+errors.join(','));
 return true;
};
V.validate();
})();
