(()=>{
const R=window.SR;if(!R?.App||!R?.Game)return;
const AP=R.App.prototype,GP=R.Game.prototype,$=s=>document.querySelector(s);
const prevStation=AP.station;
AP.station=function(t=this.tab){const out=prevStation.call(this,t);requestAnimationFrame(()=>{const scr=$('.screen');if(scr)scr.classList.toggle('commandScreen',t==='ship')});return out};
const prevTac=GP.useTactical;
if(prevTac)GP.useTactical=function(i){const a=R.TACTICAL?.find(q=>q.id===(this.s.tactical||this.s.actives||[])[i]),name=(a?.name||'').toLowerCase();const out=prevTac.call(this,i);if(/shield|repair|barrier/.test(name)){this.shield=Math.min(this.maxShield,this.shield+this.maxShield*.22);this.hp=Math.min(this.maxHp,this.hp+this.maxHp*.06)}else if(/ion|emp/.test(name)){for(const e of this.en||[]){if(e.shield!=null)e.shield*=.5;e.hp-=Math.max(.2,(e.max||e.hp||1)*.04)}}else if(/missile|barrage|strike|nova|bomb/.test(name)){for(const e of this.en||[])e.hp-=Math.max(.3,(e.max||e.hp||1)*(e.boss?.03:.08))}return out};
})();
