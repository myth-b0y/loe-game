(()=>{
  const R=window.SR=window.SR||{};
  const pick=a=>a[Math.random()*a.length|0];
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  R.pick=pick; R.clamp=clamp;

  R.GAME_NAME='LoE: Starship Survivor';
  R.VERSION='0.4.0';

  R.HULLS=[
    ['Starfighter',2,2,1,220,90,0,0,0],
    ['Heavy Fighter',3,3,1,340,130,1,0,900],
    ['Gunship',4,4,2,520,190,2,0,2400],
    ['Corvette',6,5,2,800,280,3,1,5200],
    ['Light Frigate',9,7,3,1250,430,4,2,11000],
    ['Frigate',12,9,4,1900,650,5,3,22000],
    ['Heavy Frigate',16,12,4,2850,930,6,4,42000]
  ].map((x,i)=>({id:'hull.'+i,name:x[0],crew:x[1],weapons:x[2],active:x[3],hp:x[4],shield:x[5],droneCap:x[6],supportCap:x[7],cost:x[8],tier:i}));

  R.WEAPONS=[
    {id:'weapon.autocannon',family:'autocannon',name:'Autocannon',icon:'»',color:'#ffb15f',damage:10,rate:7.2,range:520,cost:0,minHull:0,desc:'Rapid kinetic fire that chews through nearby light craft.',kind:'rapid'},
    {id:'weapon.railgun',family:'railgun',name:'Railgun',icon:'→',color:'#ffffff',damage:96,rate:.58,range:1050,cost:650,minHull:1,desc:'Slow magnetic slugs punch through several ships in a line.',pierce:4,kind:'pierce'},
    {id:'weapon.pulse',family:'pulse',name:'Pulse Laser',icon:'━',color:'#62dcff',damage:15,rate:3.5,range:700,cost:0,minHull:0,desc:'Accurate twin energy bursts with excellent tracking.',burst:2,kind:'burst'},
    {id:'weapon.beam',family:'beam',name:'Beam Lance',icon:'═',color:'#a6f7ff',damage:31,rate:1.3,range:880,cost:950,minHull:2,desc:'A precise cutting lance that favors distant priority targets.',pierce:2,kind:'beam'},
    {id:'weapon.plasma',family:'plasma',name:'Plasma Mortar',icon:'♨',color:'#ff6bd7',damage:62,rate:.82,range:670,cost:1200,minHull:2,desc:'Lobs unstable plasma into clustered enemies for wide splash damage.',aoe:78,slow:true,kind:'mortar'},
    {id:'weapon.ion',family:'ion',name:'Ion Arc',icon:'⚡',color:'#89aaff',damage:20,rate:1.65,range:640,cost:1400,minHull:3,desc:'Strips shields and chains electrical damage into nearby ships.',ion:true,chain:2,kind:'chain'},
    {id:'weapon.missile',family:'missile',name:'Missile Rack',icon:'⌁',color:'#ff9d79',damage:50,rate:.9,range:1050,cost:1800,minHull:3,desc:'Launches homing warheads that seek targets beyond gun range.',homing:true,aoe:60,kind:'homing'},
    {id:'weapon.torpedo',family:'torpedo',name:'Torpedo Tube',icon:'◆',color:'#ff735d',damage:165,rate:.23,range:1250,cost:2800,minHull:4,desc:'A slow hunter-killer warhead built for bosses and heavy hulls.',homing:true,aoe:112,slow:true,kind:'heavy'},
    {id:'weapon.flak',family:'flak',name:'Flak Battery',icon:'✹',color:'#ffe39b',damage:14,rate:2.15,range:400,cost:1100,minHull:2,desc:'Fills close space with fragments and tears apart swarms and missiles.',aoe:32,scatter:5,pointDefense:true,kind:'flak'}
  ];

  const ACTIVE_DATA=[
    ['Ion Bomb','⚡',18,'Disables nearby electronics and strips enemy shields.'],
    ['Energy Nova','✹',20,'Blasts every nearby enemy with a radial energy shockwave.'],
    ['Gravity Well','◎',24,'Drags enemies together and slows them for follow-up fire.'],
    ['Blink Drive','◌',23,'Phases the flagship out of danger for a brief moment.'],
    ['Shield Burst','⬡',22,'Restores a large chunk of shield and grants brief protection.'],
    ['Reactor Vent','♨',25,'Dumps reactor heat outward as a damaging pulse.'],
    ['Missile Barrage','⌁',28,'Launches a sudden swarm of homing missiles.'],
    ['EMP','⌁',26,'Shuts down enemy shields and weapons for a short window.'],
    ['Drone Overdrive','◇',27,'Temporarily pushes all deployed drones beyond normal limits.'],
    ['Escort Assault','▷',29,'Orders support ships into an aggressive strike pattern.'],
    ['Emergency Repair','✚',31,'Repairs a large portion of damaged hull.'],
    ['Target Lock','⊙',24,'Focuses targeting systems for a burst of lethal accuracy.'],
    ['Broadside','≋',25,'Instantly cycles every mounted weapon battery.'],
    ['Reactor Overcharge','⚡',32,'Temporarily boosts ship output at dangerous reactor load.'],
    ['Singularity','●',38,'Compresses nearby enemies into a violent gravity event.'],
    ['Artillery Strike','✦',36,'Calls a heavy delayed strike across the battlespace.']
  ];
  R.ACTIVES=ACTIVE_DATA.map((x,i)=>({id:'active.'+i,name:x[0],icon:x[1],cooldown:x[2],desc:x[3],cost:i<4?0:700+i*130,type:i}));

  R.DRONES=[
    {id:'drone.striker',name:'Striker Drone',icon:'◇',role:'offense',cost:700,minHull:1,damage:11,rate:1.8,desc:'Leaves formation to harass nearby enemies, then returns to the flagship zone.'},
    {id:'drone.ion',name:'Ion Drone',icon:'⚡',role:'offense',cost:1150,minHull:2,damage:8,rate:1.25,ion:true,desc:'Roams near the ship and pressures enemy shields with ion bursts.'},
    {id:'drone.bomber',name:'Bomber Drone',icon:'◆',role:'offense',cost:1700,minHull:3,damage:28,rate:.55,aoe:52,desc:'Makes short attack runs and drops compact explosive payloads.'},
    {id:'drone.guardian',name:'Guardian Drone',icon:'⬡',role:'defense',cost:800,minHull:1,desc:'Orbits close and intercepts hostile projectiles before they reach the hull.',pd:.08},
    {id:'drone.repair',name:'Repair Drone',icon:'✚',role:'defense',cost:1300,minHull:2,desc:'Stays close to the flagship and continuously repairs light hull damage.',repair:.45},
    {id:'drone.shield',name:'Shield Drone',icon:'◌',role:'defense',cost:1600,minHull:3,desc:'Orbits the ship and feeds a small continuous charge into the shield grid.',shield:.008}
  ];

  R.SUPPORTS=[
    {id:'support.interceptor',name:'Interceptor',icon:'▷',cost:3200,minHull:3,crewReq:1,damage:18,rate:1.55,desc:'Fast one-seat fighter that chases light enemies and missiles.'},
    {id:'support.fighter',name:'Heavy Fighter',icon:'▶',cost:4700,minHull:3,crewReq:1,damage:28,rate:1.1,desc:'A durable one-seat strike craft that stays close to the flagship.'},
    {id:'support.bomber',name:'Bomber',icon:'◆',cost:6800,minHull:4,crewReq:2,damage:72,rate:.42,aoe:75,desc:'Two-crew attack craft built to punish carriers and boss subsystems.'},
    {id:'support.ew',name:'EW Craft',icon:'◎',cost:7400,minHull:4,crewReq:2,damage:12,rate:.9,ion:true,desc:'Two-crew support craft that jams and ionizes hostile ships.'},
    {id:'support.repair',name:'Rescue Cutter',icon:'✚',cost:8200,minHull:5,crewReq:2,repair:.9,desc:'Two-crew support ship that circles the flagship and performs heavy repairs.'},
    {id:'support.gunship',name:'Escort Gunship',icon:'▰',cost:11000,minHull:5,crewReq:2,damage:44,rate:1.0,desc:'Two-crew escort with independent guns and enough armor to hold a flank.'}
  ];

  R.PROFS=[
    ['Pilot','Helm',0,'The first assigned Pilot flies the flagship. Additional Pilots can crew support ships.'],
    ['Gunner','Fire Control',0,'Each assigned Gunner crews one additional weapon hardpoint after the first.'],
    ['Engineer','Engineering',1,'Improves system reliability and damage control.'],
    ['Reactor Tech','Reactor',1,'Improves reactor output for advanced ship systems.'],
    ['Shield Specialist','Shield Console',1,'Improves shield recovery and resilience.'],
    ['Drone Operator','Drone Control',1,'Required to equip and operate drone bays.'],
    ['Flight Officer','Hangar',3,'Counts as support-ship flight crew and enables advanced hangar operations.'],
    ['Tactical Officer','Combat Info',2,'Improves target selection and priority response.'],
    ['EW Officer','Sensors',2,'Improves disruption and electronic warfare systems.'],
    ['Damage Control','Repair',2,'Improves hull recovery and emergency repairs.'],
    ['Quartermaster','Logistics',2,'Improves salvage recovery and supply efficiency.'],
    ['Executive Officer','Bridge',4,'Coordinates larger crews and fleet operations.']
  ].map((x,i)=>({id:i,name:x[0],req:x[1],min:x[2],desc:x[3]}));

  R.FACTIONS=[['Swarm','#ff596d'],['Bastion','#d8b367'],['Vector','#59d8ff'],['Marauders','#ff8859'],['Null','#9584ff'],['Forge','#d78c56']].map((x,i)=>({id:i,name:x[0],color:x[1]}));
  R.ROLES=['Scout','Fighter','Interceptor','Bomber','Missile Boat','Support','Gunship','Carrier'];
  R.ENEMIES=[];
  R.FACTIONS.forEach(f=>R.ROLES.forEach((n,i)=>R.ENEMIES.push({id:`e.${f.id}.${i}`,faction:f.id,role:i,name:`${f.name} ${n}`,hp:.7+i*.32+(f.id===1?.25:0),speed:1.45-i*.11+(f.id===0?.35:0),damage:.7+i*.16,color:f.color,shield:f.id===2?.55:f.id===4?.2:0})));

  const archetypes=[
    ['Dreadnought','broadside','Heavy salvos, sweeping lanes, and armored weapon batteries.'],
    ['Carrier Prime','carrier','Fighter launches, pressure waves, and targetable hangar systems.'],
    ['Reaper','reaper','Fast lances, charges, and dangerous pursuit patterns.']
  ];
  R.BOSSES=[];
  R.FACTIONS.forEach(f=>archetypes.forEach((a,i)=>R.BOSSES.push({id:`b.${f.id}.${i}`,faction:f.id,name:`${f.name} ${a[0]}`,hp:18+i*7,damage:2.3+i*.45,color:f.color,role:i,pattern:a[1],desc:a[2]})));

  R.RESEARCH_TRACKS=[
    {name:'Hull Integrity',desc:'Permanently increases flagship hull strength.',stat:'Hull',step:4},
    {name:'Shield Grid',desc:'Permanently increases flagship shield capacity.',stat:'Shield',step:4},
    {name:'Reactor Theory',desc:'Improves active-system cooldowns and power handling.',stat:'Cooldown',step:3},
    {name:'Salvage Ops',desc:'Increases salvage recovered from kills and asteroids.',stat:'Salvage',step:5},
    {name:'Targeting',desc:'Improves weapon tracking and target selection response.',stat:'Tracking',step:4},
    {name:'Run Control',desc:'Improves run utility systems without adding raw damage.',stat:'Utility',step:1}
  ];
  R.RESEARCH=[];R.RESEARCH_TRACKS.forEach((t,ti)=>{for(let r=1;r<=6;r++)R.RESEARCH.push({id:`r.${ti}.${r}`,track:ti,rank:r,name:`${t.name} ${r}`,cost:220*r*r*(1+ti*.08),cores:r>=4?r-3:0})});

  R.SYSTEMS={
    shield:{name:'Shield Generator',icon:'⬡',max:6,cost:l=>350+420*l,desc:'Strengthens the permanent shield generator installed in the flagship.',stat:l=>`${Math.round((1+l*.10)*100)}% shield`},
    armor:{name:'Armor Plating',icon:'▰',max:6,cost:l=>420+480*l,desc:'Adds permanent structural plating that reduces hull damage.',stat:l=>`${Math.round((l*.035)*100)}% reduction`},
    reactor:{name:'Reactor',icon:'⚡',max:6,cost:l=>500+520*l,desc:'Improves permanent power output and slightly shortens active-system cooldowns.',stat:l=>`${Math.round(l*3)}% cooldown bonus`},
    engines:{name:'Engines',icon:'»',max:6,cost:l=>400+460*l,desc:'Improves boss-fight maneuvering speed and responsiveness.',stat:l=>`${Math.round((1+l*.07)*100)}% handling`},
    droneBay:{name:'Drone Bay',icon:'◇',max:6,cost:l=>650+650*l,desc:'Adds permanent capacity for equipped drones. Requires a Drone Operator.',stat:l=>`${l} drone slot${l===1?'':'s'}`},
    hangar:{name:'Hangar',icon:'▷',max:4,cost:l=>1800+1800*l,desc:'Adds permanent capacity for support ships. Larger craft also consume flight crew.',stat:l=>`${l} support slot${l===1?'':'s'}`}
  };

  R.CARDS=[];const add=o=>R.CARDS.push(o),rarity=t=>['common','rare','epic'][t]||'common';
  const statCards=[['Damage','✦','damage',[.12,.20,.32],v=>`All mounted weapons deal ${Math.round(v*100)}% more damage.`],['Fire Rate','»','rate',[.12,.20,.30],v=>`All mounted weapons cycle ${Math.round(v*100)}% faster.`],['Critical','◆','crit',[.05,.08,.12],v=>`Critical hit chance increases by ${Math.round(v*100)}%.`],['Shield','⬡','shield',[.14,.23,.36],v=>`Maximum shield capacity increases by ${Math.round(v*100)}%.`],['Hull','♥','hull',[.14,.23,.36],v=>`Maximum hull strength increases by ${Math.round(v*100)}%.`],['Repair','✚','regen',[.25,.45,.75],v=>`The flagship repairs ${v.toFixed(2)} hull per second.`],['Cooldown','◔','cool',[.08,.13,.20],v=>`Active systems recharge ${Math.round(v*100)}% faster.`],['Extra Shot','•','shots',[1,1,2],v=>`Mounted guns fire ${v} additional projectile${v>1?'s':''} each cycle.`],['Blast Radius','✹','aoe',[.16,.28,.45],v=>`Explosive effects grow ${Math.round(v*100)}% larger.`],['Piercing','→','pierce',[1,2,3],v=>`Projectiles can pass through ${v} additional target${v>1?'s':''}.`],['Salvage','◇','salvage',[.20,.35,.55],v=>`Recovered salvage is worth ${Math.round(v*100)}% more.`],['Experience','△','xp',[.14,.24,.38],v=>`Combat experience is gained ${Math.round(v*100)}% faster.`]];
  for(let tier=0;tier<3;tier++)for(const s of statCards){const v=s[3][tier];add({id:`g.${s[2]}.${tier}`,group:'general',name:s[0]+(tier?` ${tier+1}`:''),icon:s[1],rarity:rarity(tier),desc:s[4](v),effect:{k:s[2],v}})}
  R.WEAPONS.forEach(w=>{[['Tuning','common','damage',.18,`Your ${w.name} deals 18% more damage.`],['Cycle','rare','rate',.22,`Your ${w.name} cycles 22% faster.`],['Payload','rare',w.aoe?'aoe':'damage',w.aoe?.28:.24,w.aoe?`Your ${w.name} explosions are 28% larger.`:`Your ${w.name} deals 24% more damage.`],['Overdrive','epic','weaponSpecial',1,`Your ${w.name} gains an upgraded version of its signature behavior.`]].forEach((o,i)=>add({id:`w.${w.family}.${i}`,group:'weapon',family:w.family,name:`${w.name} ${o[0]}`,icon:w.icon,rarity:o[1],desc:o[4],effect:{k:o[2],v:o[3],family:w.family}}))});
  const defense=[['Barrier','⬡','shield',.16,'Increases maximum shield capacity by 16%.'],['Recharge','◔','shieldRegen',.25,'Shields regenerate 25% faster between impacts.'],['Plating','▰','armor',.04,'Reinforced plating reduces incoming hull damage.'],['Nanites','✚','regen',.35,'Repair nanites slowly restore damaged hull.'],['Point Defense','✺','pd',.14,'Point defense has a better chance to erase hostile shots.'],['Emergency','♥','lowhp',.15,'Systems become stronger while hull integrity is critical.']];for(let tier=0;tier<3;tier++)defense.forEach((d,i)=>{const mult=1+tier*.6;add({id:`d.${i}.${tier}`,group:'defense',name:d[0]+(tier?` ${tier+1}`:''),icon:d[1],rarity:rarity(tier),desc:d[4],effect:{k:d[2],v:d[3]*mult}})});
  const support=[['Drone Damage','◇','droneDmg',.20,'Deployed offensive drones deal 20% more damage.','drone'],['Drone Rate','◇','droneRate',.20,'Offensive drones attack 20% faster.','drone'],['Drone Count','◇','drones',1,'Deploy one temporary extra copy of an equipped drone.','drone'],['Support Damage','▷','escortDmg',.20,'Support ships deal 20% more damage.','escort'],['Support Rate','▷','escortRate',.20,'Support ships attack 20% faster.','escort'],['Support Wing','▷','escorts',1,'Deploy one temporary extra copy of an equipped support ship.','escort']];for(let tier=0;tier<3;tier++)support.forEach((s,i)=>add({id:`s.${i}.${tier}`,group:'support',requires:s[5],name:s[0]+(tier?` ${tier+1}`:''),icon:s[1],rarity:rarity(tier),desc:s[4],effect:{k:s[2],v:(s[2]==='drones'||s[2]==='escorts')?1:s[3]*(1+tier*.55)}}));
  [['Active Cooling','◔','active',.10,'All equipped active systems recharge 10% faster.'],['Overclocked Systems','⚡','active',.17,'All equipped active systems recharge 17% faster.'],['Emergency Routing','◆','active',.24,'All equipped active systems recharge 24% faster.']].forEach((a,i)=>add({id:'a.'+i,group:'active',name:a[0],icon:a[1],rarity:rarity(i),desc:a[4],effect:{k:a[2],v:a[3]}}));
  [['Stormhead','⚡','Ion weapons make missile impacts arc electricity into nearby ships.',['ion','missile']],['Hard Reboot','⬡','Breaking your shield releases a defensive energy pulse.',['shield']],['Plasma Net','♨','Plasma explosions leave a short-lived burning field.',['plasma']],['Thunder Rail','→','Railgun hits discharge ion energy into nearby targets.',['railgun','ion']],['Hive Mind','◇','Drone kills briefly accelerate the rest of the drone wing.',['drone']],['Wolfpack','▷','Support ships focus the same target for escalating damage.',['escort']],['Chain Reaction','✹','Explosions can trigger smaller secondary explosions.',['plasma','missile']],['Blackout','⚡','Ion effects suppress enemy weapons after shields collapse.',['ion']],['Flak Wall','✹','Flak batteries also erase nearby hostile projectiles.',['flak']],['Deadeye','◆','Railgun critical hits mark enemies for follow-up damage.',['railgun']],['Gravity Bombs','◎','Explosions pull nearby enemies toward their center.',['plasma','missile']],['Carrier Doctrine','▷','Drones and support ships gain damage while both are deployed.',['drone','escort']]].forEach((x,i)=>add({id:'y'+i,group:'synergy',name:x[0],icon:x[1],rarity:'epic',desc:x[2],requiresAny:x[3],effect:{k:'synergy',v:i}}));
  [['Bullet Time','◔','Enemy projectiles slow while your weapons continue firing at full speed.'],['Event Horizon','◎','Explosions pull enemies inward before detonating.'],['Storm Crown','⚡','Ion effects chain farther and hit dramatically harder.'],['Living Hull','♥','Hull regeneration accelerates as damage becomes more severe.'],['Missile God','⌁','Missiles split into additional warheads after launch.'],['Fleet Command','▷','Every deployed drone and support craft gains major fire-rate bonuses.']].forEach((x,i)=>add({id:'l'+i,group:'legendary',name:x[0],icon:x[1],rarity:'legendary',desc:x[2],effect:{k:'legendary',v:i}}));
  [['Doomsday','☠','Damage rises massively, but maximum hull is permanently reduced for this run.'],['Unstable Core','☠','Fire rate spikes, but shields recharge much more slowly.'],['Zero Margin','☠','Critical chance rises sharply, but incoming hull damage also rises.']].forEach((x,i)=>add({id:'c'+i,group:'cursed',name:x[0],icon:x[1],rarity:'cursed',desc:x[2],effect:{k:'cursed',v:i}}));

  const N1=['Aria','Kade','Mira','Talon','Rhea','Jax','Nova','Soren','Lyra','Cato','Vera','Orin'],N2=['Vale','Rook','Sol','Voss','Rey','Dane','Kael','Morrow'];R.crew=()=>({id:Date.now()+Math.random(),name:pick(N1)+' '+pick(N2),profession:Math.random()*12|0,level:1,xp:0,skill:+(0.9+Math.random()*.22).toFixed(2),assigned:false});
  const KEY='sr_mobile_v2',legacyWeapon=id=>{if(!id)return null;if(R.WEAPONS.some(w=>w.id===id))return id;if(id.includes('railgun'))return'weapon.railgun';if(id.includes('pulse'))return'weapon.pulse';if(id.includes('beam'))return'weapon.beam';if(id.includes('plasma'))return'weapon.plasma';if(id.includes('ion'))return'weapon.ion';if(id.includes('missile'))return'weapon.missile';if(id.includes('torpedo'))return'weapon.torpedo';if(id.includes('flak'))return'weapon.flak';return'weapon.autocannon'};
  R.migrate=s=>{if(!s)return s;s.hull=Math.max(0,Math.min(6,s.hull||0));s.salvage=Number.isFinite(s.salvage)?s.salvage:800;s.cores=Number.isFinite(s.cores)?s.cores:0;s.quarters=Math.max(2,Math.min(R.HULLS[s.hull].crew,s.quarters||2));s.weapons=[...new Set((s.weapons||[]).map(legacyWeapon).filter(Boolean))].slice(0,R.HULLS[s.hull].weapons);if(!s.weapons.length)s.weapons=['weapon.autocannon','weapon.pulse'];s.unlockedW=[...new Set([...(s.unlockedW||[]).map(legacyWeapon).filter(Boolean),'weapon.autocannon','weapon.pulse'])];s.actives=(s.actives||['active.0']).filter(id=>R.ACTIVES.some(a=>a.id===id)).slice(0,R.HULLS[s.hull].active);if(!s.actives.length)s.actives=['active.0'];s.unlockedA=[...new Set([...(s.unlockedA||[]).filter(id=>R.ACTIVES.some(a=>a.id===id)),'active.0','active.1','active.3','active.4'])];s.crew=Array.isArray(s.crew)&&s.crew.length?s.crew:[R.crew(),R.crew()];s.quarters=Math.max(s.quarters,Math.min(R.HULLS[s.hull].crew,s.crew.length));let assignedSeen=0;for(const c of s.crew){if(c.assigned){assignedSeen++;if(assignedSeen>s.quarters)c.assigned=false}}s.research=s.research||{};s.records=Object.assign({wave:0,kills:0,runs:0,bosses:0},s.records||{});s.packs=Array.isArray(s.packs)?s.packs:[];s.settings=Object.assign({audio:1},s.settings||{});s.systems=Object.assign({shield:0,armor:0,reactor:0,engines:0,droneBay:0,hangar:0},s.systems||{});s.ownedDrones=Array.isArray(s.ownedDrones)?s.ownedDrones:[];s.equippedDrones=Array.isArray(s.equippedDrones)?s.equippedDrones.filter(id=>R.DRONES.some(d=>d.id===id)):[];s.ownedSupports=Array.isArray(s.ownedSupports)?s.ownedSupports:[];s.equippedSupports=Array.isArray(s.equippedSupports)?s.equippedSupports.filter(id=>R.SUPPORTS.some(d=>d.id===id)):[];return s};
  R.loadAll=()=>{try{let a=JSON.parse(localStorage.getItem(KEY))||{slots:{},last:1};for(const k of Object.keys(a.slots||{}))a.slots[k]=R.migrate(a.slots[k]);return a}catch{return{slots:{},last:1}}};R.save=s=>{s=R.migrate(s);let a=R.loadAll();a.slots[s.slot]=s;a.last=s.slot;localStorage.setItem(KEY,JSON.stringify(a))};R.getSlot=n=>{let s=R.loadAll().slots[n]||null;return s?R.migrate(s):null};R.newSave=n=>{let c1=R.crew(),c2=R.crew();c1.profession=0;c2.profession=1;c1.assigned=c2.assigned=true;let s={slot:n,salvage:1000,cores:0,hull:0,quarters:2,weapons:['weapon.autocannon','weapon.pulse'],actives:['active.0'],unlockedW:['weapon.autocannon','weapon.pulse'],unlockedA:['active.0','active.1','active.3','active.4'],crew:[c1,c2],research:{},systems:{shield:0,armor:0,reactor:0,engines:0,droneBay:0,hangar:0},ownedDrones:[],equippedDrones:[],ownedSupports:[],equippedSupports:[],records:{wave:0,kills:0,runs:0,bosses:0},packs:[],settings:{audio:1}};R.save(s);return s};
  R.audio={ctx:null,master:1,play(type,pan=0){if(this.master<=0)return;try{this.ctx=this.ctx||new(window.AudioContext||window.webkitAudioContext)();const c=this.ctx,t=c.currentTime,o=c.createOscillator(),g=c.createGain(),p=c.createStereoPanner?c.createStereoPanner():null,M={ui:[520,.04,'sine',.035],deny:[120,.09,'square',.05],shot:[250,.035,'square',.026],rail:[105,.14,'sawtooth',.07],laser:[720,.065,'sawtooth',.03],ion:[420,.11,'triangle',.05],missile:[160,.10,'sawtooth',.055],flak:[190,.045,'square',.035],shield:[540,.08,'sine',.055],shieldBreak:[180,.24,'sawtooth',.09],hit:[95,.08,'square',.06],boom:[60,.22,'sawtooth',.09],boss:[72,.38,'sawtooth',.12],phase:[330,.28,'triangle',.08],level:[760,.13,'sine',.06],cash:[910,.08,'sine',.045],reroll:[460,.09,'triangle',.045],drone:[680,.035,'square',.022],support:[210,.07,'square',.035]},m=M[type]||M.ui;o.type=m[2];o.frequency.setValueAtTime(m[0],t);if(type==='rail'||type==='boom'||type==='boss')o.frequency.exponentialRampToValueAtTime(Math.max(35,m[0]*.55),t+m[1]);g.gain.setValueAtTime(m[3]*this.master,t);g.gain.exponentialRampToValueAtTime(.0001,t+m[1]);o.connect(g);if(p){p.pan.value=clamp(pan,-1,1);g.connect(p);p.connect(c.destination)}else g.connect(c.destination);o.start();o.stop(t+m[1])}catch{}}};
})();
