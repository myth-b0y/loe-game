(()=>{
'use strict';
const R=window.SR,V=R?.V10;if(!R?.Game||!V)throw new Error('V1.3 data requires v10 runtime');
const X=R.V130=R.V130||{};
X.VERSION='1.3.0';
X.CONFIG={
  baseUniqueChance:.02,
  luckUniqueRate:.0025,
  maxUniqueChance:.28,
  luckFourthRate:.006,
  maxFourthChance:.55,
  fifthLuckStart:45,
  fifthLuckRate:.0025,
  maxFifthChance:.18,
  rankJumpBase:.11,
  rankJumpLuckRate:.0015,
  rankJumpDecay:.018,
  maxRankJumpStep:.35,
  moduleSlots:3,
  bossModuleBase:.32,
  eliteModuleBase:.03
};

// VII/MAX no longer owns purple. Purple is reserved for one-off Unique cards.
V.RANK_COLORS[7]='#f4f7ff';
X.UNIQUE_COLOR='#b987ff';

// Working color grammar. This is centralized and explicitly unlocked so the
// visual/mechanical associations can be refined without hunting through combat code.
X.COLORS={
 red:{hex:'#ff625f',locked:false,tags:['heat','fire','burn','blast','overcharge']},
 blue:{hex:'#69c8ff',locked:false,tags:['water','flow','movement','shield','pulse']},
 green:{hex:'#71df91',locked:false,tags:['nature','life','earth','growth','repair']},
 orange:{hex:'#ff9b36',locked:false,tags:['ground','gravity','mass','impact','stability']},
 purple:{hex:'#b987ff',locked:false,tags:['mind','magnetism','control','distortion','unique']},
 yellow:{hex:'#f4dc59',locked:false,tags:['energy','time','speed','charge','tempo']},
 white:{hex:'#f5f7ff',locked:false,tags:['air','space','phase','distance','max']}
};
X.color=(id)=>X.COLORS[id]?.hex||'#d9edf7';

const U=(id,name,icon,desc,effects,ai=50,aspect='purple')=>({id,name,icon,desc,effects,ai,aspect});
X.UNIQUES=[
 U('fortuneCircuit','FORTUNE CIRCUIT','✦','Probability bends around the ship. Luck rises sharply.',{luck:24},72,'yellow'),
 U('widebandOracle','WIDEBAND ORACLE','▦','Every level draft opens at least four choices.',{draftFloor:4},74,'purple'),
 U('purgeAuthority','PURGE AUTHORITY','⊘','Gain two additional Banish uses this run.',{banish:2},62,'white'),
 U('phaseMirror','PHASE MIRROR','◇','Incoming hits have a chance to be deflected completely.',{deflect:.12},68,'white'),
 U('bulwarkEcho','BULWARK ECHO','◈','When the main shield collapses, it releases a damaging pulse.',{shieldBreakPulse:.20},58,'blue'),
 U('threatCrown','THREAT CROWN','⌖','Deal more damage to enemies pressing close to the flagship.',{nearDamage:.30,nearRadius:180},66,'red'),
 U('salvageEcho','SALVAGE ECHO','▰','Salvage gained from destroyed enemies is amplified.',{salvage:.25},48,'orange'),
 U('criticalReserve','CRITICAL RESERVE','♥','Below 30% hull, all friendly damage surges.',{criticalDamage:.35,criticalHull:.30},70,'red'),
 U('executionArray','EXECUTION ARRAY','✧','Enemies below 20% hull take increased damage.',{executeDamage:.40,executeHull:.20},63,'red'),
 U('escortMesh','ESCORT MESH','▷','Support craft gain additional hull and shields.',{escortDefense:.25},57,'blue'),
 U('closedLoop','CLOSED LOOP','∞','At full shields, surplus field energy slowly repairs hull.',{fullShieldRepair:.0015},55,'green'),
 U('secondOpinion','SECOND OPINION','↻','The first reroll each wave costs no reroll charge.',{freeReroll:true},60,'yellow')
];
X.UNIQUE_BY_ID=Object.fromEntries(X.UNIQUES.map(x=>[x.id,x]));

const M=(id,name,icon,desc,effects,aspect='white')=>({id,name,icon,desc,effects,aspect});
X.MODULES=[
 M('luckyCoil','LUCKY COIL','⌁','A noisy probability regulator. +10 Luck.',{luck:10},'yellow'),
 M('surveyLens','SURVEY LENS','◉','Improves reward scans and module recovery odds.',{luck:6,moduleDrop:.05},'blue'),
 M('purgeRelay','PURGE RELAY','⊘','Adds one Banish use for this run.',{banish:1},'white'),
 M('nullPlate','NULL PLATE','◇','A small chance for incoming damage to phase away.',{deflect:.05},'white'),
 M('salvageMagnet','SALVAGE MAGNET','▰','Destroyed enemies yield more salvage.',{salvage:.15},'orange'),
 M('escortPlating','ESCORT PLATING','▷','Support craft gain additional hull and shields.',{escortDefense:.12},'green'),
 M('threatLens','THREAT LENS','⌖','Friendly fire hits harder near the flagship.',{nearDamage:.12,nearRadius:180},'red'),
 M('recoveryBus','RECOVERY BUS','∞','At full shields, a trickle of energy repairs hull.',{fullShieldRepair:.0006},'green'),
 M('fluxSink','FLUX SINK','◌','While the main shield is down, incoming hull damage is reduced.',{shieldDownReduction:.10},'blue'),
 M('rerouteNode','REROUTE NODE','↻','The first reroll each wave is free.',{freeReroll:true},'yellow')
];
X.MODULE_BY_ID=Object.fromEntries(X.MODULES.map(x=>[x.id,x]));
})();
