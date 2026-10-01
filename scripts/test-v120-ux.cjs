const fs=require('fs');
const assert=require('assert');

const ux=fs.readFileSync('starship/v10/ux-1.2.js','utf8');
const css=fs.readFileSync('starship/v10/style-1.2.css','utf8');
const loader=fs.readFileSync('starship/loader-v9.js','utf8');
const index=fs.readFileSync('starship/index.html','utf8');

assert(ux.includes("d.symbol=''"),'Core choices remove pairing symbols');
assert(ux.includes("d.icon=''"),'Core choices remove icon-as-symbol fallback');
assert(ux.includes("color='#7f8992'"),'Core cards use neutral grey');
assert(ux.includes('v120AiPick'),'Auto selection has visible picked-card state');
assert(ux.includes('delay=offer.opt?.prep?280:760'),'Auto selection pauses visibly before choosing');
assert(ux.includes('v120BuildStats'),'Build menu renders player stats');
assert(ux.includes('v120BuildSymbols'),'Build menu renders accumulated symbols');
assert(ux.includes("x.evolved?'🌈':''"),'Evolved symbols are visually distinguished');
assert(ux.includes("R.VERSION='1.2.0'"),'Runtime visible version sync is v1.2.0');
assert(css.includes('.card.v110Core,.card.v120CoreCard'),'Core grey styling exists');
assert(css.includes('.v110DraftCard.v120AiPick'),'Auto choice highlight styling exists');
assert(css.includes('.v120BuildStats'),'Build stats styling exists');
assert(css.includes('.v120BuildSymbol.paired'),'Paired-symbol glow styling exists');
assert(loader.includes("const V='12.0.0'"),'Loader cache key bumped for v1.2');
assert(loader.includes("v10+'style-1.2.css'"),'Loader includes v1.2 CSS');
assert(loader.includes("v10+'ux-1.2.js'"),'Loader includes v1.2 UX module');
assert(loader.indexOf("v10+'card-ui.js'")<loader.indexOf("v10+'ux-1.2.js'"),'v1.2 UX loads after base card UI');
assert(loader.includes("window.SR.VERSION='1.2.0'"),'Final runtime version is v1.2.0');
assert(loader.includes("version='1.2.0'"),'Save display version updates to v1.2.0');
assert(index.includes('loader-v9.js?v=12.0.0'),'HTML loader cache key is v1.2');
console.log('v1.2 card UX validation passed');
