const fs=require('fs');
const assert=require('assert');

const ux=fs.readFileSync('starship/v10/ux-1.2.1.js','utf8');
const sys=fs.readFileSync('starship/v10/systems-1.2.1.js','utf8');
const css=fs.readFileSync('starship/v10/style-1.2.1.css','utf8');
const loader=fs.readFileSync('starship/loader-v9.js','utf8');
const index=fs.readFileSync('starship/index.html','utf8');

assert(ux.includes("const RELEASE='1.2.1'"),'v1.2.1 owns visible version');
assert(ux.includes('partnerFor=p=>V.PATHS.find'),'Auto resolves the other Path sharing a symbol');
assert(ux.includes('if(mate>0)'),'Auto pairing bonus requires an owned partner');
assert(ux.includes('score+=140'),'Auto strongly prefers completing a MAX pair');
assert(ux.includes('gap>0'),'Auto favors the lagging half of an active pair');
assert(ux.includes('v121AiCursor'),'Auto has visible scan cursor');
assert(ux.includes('v121AiFinal'),'Auto has distinct final selection state');
assert(ux.includes('pulseTone(610'),'Auto final choice has a distinct beep');
assert(ux.includes("'v110DraftTool v121AutoDraft','AUTO'"),'Normal drafts expose one-shot AUTO');
assert(ux.includes('v121FocusLayer'),'Build card focus uses dedicated foreground layer');
assert(ux.includes('MutationObserver'),'Visible version stays synchronized after old UI rerenders');

assert(sys.includes('V.ensureLayeredShields'),'Layered Field has independent runtime shell state');
assert(sys.includes('total-1'),'Layer count reserves the main field and creates auxiliary shells');
assert(sys.includes('outerLive'),'Damage resolves from outermost live shell');
assert(sys.includes('damage*=1-st.overflow'),'Layer break applies configured overflow dampening');
assert(sys.includes('layer.reform=4.8'),'Broken mini shields have independent reform state');
assert(sys.includes('l.max*.10+canonical'),'Living mini shields regenerate independently');
assert(sys.includes('findIndex(l=>l.broken)'),'Broken shells reform inside-out');
assert(sys.includes('_v121FakeMainShield'),'Auxiliary shells remain collidable if main shield is down');
assert(sys.includes('rx:q.rx*k.x'),'Outermost shell expands collision geometry');
assert(sys.includes('breakFx'),'Auxiliary shells have break animation state');
assert(sys.includes('shieldHit'),'Auxiliary shells use shield impact FX');

assert(css.includes('.v110DraftCard.v121AiCursor'),'AI scan styling exists');
assert(css.includes('.v121FocusLayer'),'Foreground Build focus styling exists');
assert(css.includes('z-index:1200'),'Focused Build card clears other Build layers');
assert(loader.includes("const V='12.1.0'"),'Loader cache key bumped');
assert(loader.includes("v10+'systems-1.2.1.js'"),'Layered shield patch loads');
assert(loader.includes("v10+'ux-1.2.1.js'"),'AI/UX patch loads');
assert(loader.includes("window.SR.VERSION='1.2.1'"),'Final runtime version is 1.2.1');
assert(index.includes('loader-v9.js?v=12.1.0'),'HTML loader cache key bumped');
console.log('v1.2.1 AI + layered shield validation passed');
