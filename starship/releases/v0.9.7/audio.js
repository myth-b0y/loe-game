(function(){
  const G=window.SR=window.SR||{};
  class AudioEngine{
    constructor(){this.ctx=null;this.master=null;this.gains={};this.settings={master:.8,music:.35,weapons:.55,impacts:.7,explosions:.7,engines:.25,abilities:.7,enemies:.55,ui:.5};this.external={...(G.defaultAudio||{})};this.buffers={};this.loading={};this.last={};}
    init(){if(this.ctx)return; const AC=window.AudioContext||window.webkitAudioContext; if(!AC)return; this.ctx=new AC();this.master=this.ctx.createGain();this.master.connect(this.ctx.destination);this.master.gain.value=this.settings.master;['music','weapons','impacts','explosions','engines','abilities','enemies','ui'].forEach(k=>{let g=this.ctx.createGain();g.gain.value=this.settings[k];g.connect(this.master);this.gains[k]=g;});}
    resume(){this.init();if(this.ctx&&this.ctx.state==='suspended')this.ctx.resume();}
    set(k,v){this.settings[k]=v;if(k==='master'&&this.master)this.master.gain.value=v;else if(this.gains[k])this.gains[k].gain.value=v;}
    registerExternal(id,url){this.external[id]=url;}
    tone(freq=440,dur=.08,type='sine',cat='ui',vol=.15,slide=0,pan=0){this.resume();if(!this.ctx)return; const now=this.ctx.currentTime; const o=this.ctx.createOscillator(), g=this.ctx.createGain(); let p=this.ctx.createStereoPanner?this.ctx.createStereoPanner():null; o.type=type;o.frequency.setValueAtTime(freq,now);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,freq+slide),now+dur);g.gain.setValueAtTime(0.0001,now);g.gain.exponentialRampToValueAtTime(Math.max(.001,vol),now+.005);g.gain.exponentialRampToValueAtTime(.0001,now+dur);o.connect(g);if(p){p.pan.value=Math.max(-1,Math.min(1,pan));g.connect(p);p.connect(this.gains[cat]||this.master);}else g.connect(this.gains[cat]||this.master);o.start(now);o.stop(now+dur+.02);}
    noise(dur=.1,cat='impacts',vol=.12,filter=1200,pan=0){this.resume();if(!this.ctx)return; const sr=this.ctx.sampleRate,len=Math.floor(sr*dur),buf=this.ctx.createBuffer(1,len,sr),data=buf.getChannelData(0);for(let i=0;i<len;i++)data[i]=(Math.random()*2-1)*(1-i/len); const src=this.ctx.createBufferSource(),f=this.ctx.createBiquadFilter(),g=this.ctx.createGain();src.buffer=buf;f.type='lowpass';f.frequency.value=filter;g.gain.value=vol;let p=this.ctx.createStereoPanner?this.ctx.createStereoPanner():null;src.connect(f);f.connect(g);if(p){p.pan.value=pan;g.connect(p);p.connect(this.gains[cat]||this.master)}else g.connect(this.gains[cat]||this.master);src.start();}
    playBuffer(id,url,cat='ui',vol=.72,pan=0){this.resume();if(!this.ctx)return false;if(this.buffers[id]){const src=this.ctx.createBufferSource(),g=this.ctx.createGain();src.buffer=this.buffers[id];g.gain.value=vol;let p=this.ctx.createStereoPanner?this.ctx.createStereoPanner():null;src.connect(g);if(p){p.pan.value=Math.max(-1,Math.min(1,pan));g.connect(p);p.connect(this.gains[cat]||this.master)}else g.connect(this.gains[cat]||this.master);src.start();return true}if(!this.loading[id]){this.loading[id]=true;fetch(url).then(r=>r.arrayBuffer()).then(b=>this.ctx.decodeAudioData(b)).then(buf=>{this.buffers[id]=buf;delete this.loading[id]}).catch(()=>{delete this.loading[id]})}return false;}
    category(id){if(id.includes('weapon'))return 'weapons';if(id.includes('shield')||id.includes('hull'))return 'impacts';if(id.includes('explosion'))return 'explosions';if(id.includes('ability'))return 'abilities';if(id.includes('boss'))return 'enemies';return 'ui';}
    play(id,opts={}){
      this.resume(); const pan=opts.pan||0;
      if(this.external[id]&&this.playBuffer(id,this.external[id],this.category(id),opts.vol||.72,pan))return;
      switch(id){
        case 'audio.weapon.kinetic': this.tone(110,.05,'square','weapons',.07,-30,pan);break;
        case 'audio.weapon.laser': this.tone(620,.07,'sawtooth','weapons',.055,280,pan);break;
        case 'audio.weapon.rail': this.tone(90,.12,'sawtooth','weapons',.12,420,pan);this.noise(.05,'weapons',.05,2400,pan);break;
        case 'audio.weapon.missile': this.tone(150,.08,'triangle','weapons',.055,-50,pan);break;
        case 'audio.shield.hit': this.tone(480,.08,'sine','impacts',.08,-220,pan);break;
        case 'audio.shield.break': this.tone(720,.22,'sawtooth','impacts',.12,-650,pan);this.noise(.18,'impacts',.09,3500,pan);break;
        case 'audio.hull.hit': this.tone(95,.07,'square','impacts',.09,-25,pan);this.noise(.08,'impacts',.07,900,pan);break;
        case 'audio.explosion.small': this.tone(75,.14,'sine','explosions',.07,-30,pan);this.noise(.12,'explosions',.09,800,pan);break;
        case 'audio.explosion.big': this.tone(52,.32,'sine','explosions',.15,-20,pan);this.noise(.28,'explosions',.16,650,pan);break;
        case 'audio.ui.select': this.tone(520,.045,'sine','ui',.035,90);break;
        case 'audio.ui.back': this.tone(340,.055,'triangle','ui',.035,-80);break;
        case 'audio.card.rare': this.tone(460,.13,'sine','ui',.07,260);break;
        case 'audio.card.legendary': this.tone(120,.22,'sine','ui',.13,-15);setTimeout(()=>this.tone(720,.22,'sine','ui',.08,240),50);break;
        case 'audio.wave': this.tone(330,.09,'triangle','ui',.06,130);break;
        case 'audio.boss': this.tone(72,.38,'sawtooth','enemies',.16,-8);setTimeout(()=>this.tone(58,.42,'sawtooth','enemies',.15,-6),180);break;
        case 'audio.ability': this.tone(240,.13,'sawtooth','abilities',.10,360);break;
        case 'audio.level': this.tone(440,.08,'sine','ui',.06,220);setTimeout(()=>this.tone(660,.1,'sine','ui',.05,190),70);break;
      }
    }
  }
  G.audio=new AudioEngine();
})();
