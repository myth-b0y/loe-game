(()=>{
'use strict';
const R=window.SR;if(!R?.App||!R?.Game)return;
R.VERSION='0.9.4';
const AP=R.App.prototype,GP=R.Game.prototype,$=s=>document.querySelector(s);

// Version migration.
const migrate94=R.migrate;
R.migrate=s=>{s=migrate94(s);if(!s)return s;s.version='0.9.4';return s};

// ---------------------------------------------------------------------------
// ONE FLAGSHIP RENDERER.
// Combat, main menu, Ship screen, launch/equipment previews all use the exact
// same hull geometry and hardpoint layout. Only camera/state/scale may differ.
// ---------------------------------------------------------------------------
const canonicalDisplay=R.drawFlagshipDisplay;
if(typeof canonicalDisplay==='function'){
  R.drawShip=function(ctx,cx,cy,scale=1,weapons=[],tier=0,preview=false,state={}){
    const save={
      hull:Number.isFinite(+tier)?+tier:0,
      weaponMounts:[...(weapons||[])],
      equippedDrones:preview?[...(state.drones||[])]:[],
      equippedSupports:preview?[...(state.supports||[])]:[]
    };
    const shieldOn=preview?true:((Number(state.shield)||0)>0);
    return canonicalDisplay(ctx,cx,cy,scale,save,{
      t:performance.now()/1000,
      shield:shieldOn,
      hp:state.hp,
      hit:state.hit,
      weaponTargets:state.weaponTargets||[]
    });
  };
  // Keep every preview path pointed at the same source too.
  R.drawFlagshipDisplay=canonicalDisplay;
}

// ---------------------------------------------------------------------------
// EXPLICIT DRAFT STATE.
// A hidden card DOM is not an open draft. State follows the actual choice UI.
// ---------------------------------------------------------------------------
GP.v94DraftBlocked=function(){
  const c=$('#cards');
  if(c?.classList.contains('show')){this._v94DraftState='choosing';return true}
  return this._v94DraftState==='choosing'||this._v94DraftState==='resolving';
};
GP.v93CardsOpen=function(){return this.v94DraftBlocked()};
GP.v94FlushAfterDraft=function(){
  if(this.v94DraftBlocked())return;
  this._v94DraftState='closed';
  const cb=this._v94AfterDraft;this._v94AfterDraft=null;
  if(cb)queueMicrotask(()=>cb.call(this));
};
GP.v93WaitForDraft=function(cb){
  if(!this.v94DraftBlocked()){cb?.call(this);return}
  this._v94AfterDraft=cb;
};
GP.v94BindDraftState=function(){
  this._v94DraftObserver?.disconnect?.();
  const c=$('#cards');if(!c)return;
  this._v94DraftState=c.classList.contains('show')?'choosing':'closed';
  const sync=()=>{
    if(c.classList.contains('show')){this._v94DraftState='choosing';return}
    if(this._v94DraftState==='choosing'||this._v94DraftState==='resolving'||this._v94DraftState==='resolved'){
      this._v94DraftState='resolved';
      queueMicrotask(()=>this.v94FlushAfterDraft());
    }
  };
  this._v94DraftObserver=new MutationObserver(sync);
  this._v94DraftObserver.observe(c,{attributes:true,attributeFilter:['class'],childList:true,subtree:false});
  c.addEventListener('click',ev=>{
    if(!ev.target?.closest?.('.card'))return;
    this._v94DraftState='resolving';
    setTimeout(sync,0);
  });
};

// ---------------------------------------------------------------------------
// BOSS DEATH TRANSACTION.
// Boss dies -> freeze battlefield -> clear hostile effects -> finish draft ->
// victory screen exactly once -> optional Engineers -> release encounter.
// ---------------------------------------------------------------------------
GP.v94ClearDeadBossField=function(){
  this.bad=[];this.tele=[];this.shots=[];
  if(this.mines)this.mines=[];
  this.boss=null;this.bossPreview=null;this.bossState=null;
  const bh=$('#boss');if(bh)bh.innerHTML='';
  const bi=$('#bossIntro');if(bi)bi.innerHTML='';
};
GP.v94TryBossResolution=function(){
  const enc=this._v8Encounter;
  if(!enc||enc.type!=='boss'||enc.victoryResolved||this.dead)return;
  if((this.en||[]).some(e=>e?.boss))return;
  this.v94ClearDeadBossField();
  this.paused=true;this.active=true;this.count=999;
  this._v94BossPending=true;
  if(this.v94DraftBlocked()){
    this._v94AfterDraft=()=>this.v94TryBossResolution();
    return;
  }
  if($('#bossVictory'))return;
  this._v94BossPending=false;
  this.showBossVictory();
};

const showVictory94=GP.showBossVictory;
GP.showBossVictory=function(){
  const enc=this._v8Encounter;
  if(!enc||enc.type!=='boss'||enc.victoryResolved||this.dead)return;
  if((this.en||[]).some(e=>e?.boss))return;
  this.v94ClearDeadBossField();
  if(this.v94DraftBlocked()){
    this._v94BossPending=true;
    this._v94AfterDraft=()=>this.v94TryBossResolution();
    return;
  }
  if($('#bossVictory'))return;
  this._v94BossPending=false;
  return showVictory94.call(this);
};

const build94=GP.build;
GP.build=function(...args){
  const out=build94.apply(this,args);
  this._v94BossPending=false;this._v94AfterDraft=null;this._v94DraftState='closed';
  requestAnimationFrame(()=>this.v94BindDraftState());
  return out;
};

const update94=GP.update;
GP.update=function(dt){
  update94.call(this,dt);
  if(this.dead)return;
  const enc=this._v8Encounter;
  if(enc?.type==='boss'&&!enc.victoryResolved&&this._v91LastBossName&&!(this.en||[]).some(e=>e?.boss)){
    this.v94ClearDeadBossField();
    this.paused=true;this.active=true;this.count=999;
    this._v94BossSettle=(this._v94BossSettle||0)+dt;
    if(this._v94BossSettle>=.18){this._v94BossSettle=0;this.v94TryBossResolution()}
  }else this._v94BossSettle=0;
};

// Ensure Engineer completion releases the boss encounter cleanly.
const trader94=GP.v93ShowEngineerTrader;
if(trader94)GP.v93ShowEngineerTrader=function(){
  const out=trader94.call(this);
  const o=$('#engineerTrader');
  if(o&&!o._v94Bound){
    o._v94Bound=true;
    const finishCheck=()=>setTimeout(()=>{
      if(!document.body.contains(o)&&this._v8Encounter?.type==='boss'){
        this._v8Encounter.traderResolved=true;
        this.paused=false;
      }
    },0);
    o.addEventListener('click',ev=>{if(ev.target.closest('button'))finishCheck()});
  }
  return out;
};
GP.showEngineerTrader=function(){return this.v93ShowEngineerTrader?.()};

// Visible build number follows runtime after every major screen transition.
const sync94=()=>{
  R.VERSION='0.9.4';
  if(R.app?.s){R.app.s.version='0.9.4';try{R.save?.(R.app.s)}catch{}}
  if(!document.body)return;
  const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;
  while((n=w.nextNode()))if(n.nodeValue&&/0\.9\.[0-3]/.test(n.nodeValue))n.nodeValue=n.nodeValue.replace(/0\.9\.[0-3]/g,'0.9.4');
};
const main94=AP.main;if(main94)AP.main=function(...args){R.VERSION='0.9.4';const out=main94.apply(this,args);requestAnimationFrame(sync94);return out};
const station94=AP.station;if(station94)AP.station=function(...args){R.VERSION='0.9.4';const out=station94.apply(this,args);requestAnimationFrame(sync94);return out};
requestAnimationFrame(sync94);setTimeout(sync94,150);
})();
