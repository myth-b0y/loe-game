(()=>{
'use strict';
const R=window.SR,V=R?.V10,X=R?.V130;if(!R?.Game||!V||!X)throw new Error('V1.3.1 data requires v1.3 runtime');
const P=R.V131=R.V131||{};
P.VERSION='1.3.1';
P.FLEET_ECHO_BASE=.42;
P.STANDARD_LEVELS={1:1,10:5,20:9,30:13,40:17,50:21,60:25,70:29,80:33,90:37,100:41};
P.standardLevelForWave=w=>{
 w=Math.max(1,Math.floor(Number(w)||1));if(w<=1)return 1;
 const cp=Math.max(10,Math.floor(w/10)*10);
 return P.STANDARD_LEVELS[cp]||Math.max(1,1+Math.floor(cp/10)*4);
};
P.nextXpForLevel=(level,wave)=>{
 const lvl=Math.max(1,Number(level)||1),tier=wave<10?0:Math.floor(wave/10);
 return Math.round(Math.max(40+lvl*15,62+Math.pow(lvl,1.28)*24+tier*38));
};
P.normalizeCheckpointValue=v=>{
 v=Math.max(1,Math.floor(Number(v)||1));if(v<=1)return 1;
 const mod=v%10;if(mod===0)return v;if(mod===1)return v-1;if(mod===9)return v+1;
 return null;
};
P.normalizeCheckpoints=s=>{
 if(!s)return s;const out=[1];
 for(const v of s.checkpoints||[]){const q=P.normalizeCheckpointValue(v);if(q&&q>1)out.push(q)}
 s.checkpoints=[...new Set(out)].sort((a,b)=>a-b);return s;
};

P.SUPPORT_WEAPONS={
 'support.interceptor':{primaryFamily:'autocannon'},
 'support.fighter':{primaryFamily:'autocannon'},
 'support.bomber':{primaryFamily:'plasma',hull:{family:'autocannon',damage:14,rate:1.35,range:430}},
 'support.ew':{primaryFamily:'ion',hull:{family:'autocannon',damage:10,rate:1.50,range:420}},
 'support.repair':{primaryFamily:'repair',hull:{family:'autocannon',damage:12,rate:1.25,range:410}},
 'support.gunship':{primaryFamily:'railgun',hull:{family:'autocannon',damage:18,rate:1.45,range:455}}
};
P.DRONE_FAMILY=id=>id==='drone.ion'?'ion':id==='drone.bomber'?'plasma':'autocannon';

const addUnique=u=>{
 if(X.UNIQUE_BY_ID[u.id])return;
 X.UNIQUES.push(u);X.UNIQUE_BY_ID[u.id]=u;
};
addUnique({id:'fleetLink',name:'FLEET LINK',icon:'▷',desc:'Compatible companion weapons inherit a stronger echo of flagship weapon Paths.',effects:{fleetEcho:.14},ai:64,aspect:'blue'});
addUnique({id:'formationLock',name:'FORMATION LOCK',icon:'⬡',desc:'Support craft take less incoming damage while holding formation.',effects:{supportDefense:.15},ai:58,aspect:'green'});
addUnique({id:'rapidRecovery',name:'RAPID RECOVERY',icon:'↻',desc:'Destroyed support craft rebuild and relaunch faster.',effects:{supportRespawn:.30},ai:56,aspect:'yellow'});

for(const d of R.SUPPORTS||[]){
 if((d.crewReq||1)<2||d._v131Desc)return;
 d._v131Desc=true;
 const role=P.SUPPORT_WEAPONS[d.id];if(!role?.hull)continue;
 d.desc=(d.desc||'').replace(/\s+$/,'')+' Independent hull guns fire alongside its specialist turret.';
}
})();