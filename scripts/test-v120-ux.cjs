const fs=require('fs');
const assert=require('assert');

const ux=fs.readFileSync('starship/v10/ux-1.2.js','utf8');
const css=fs.readFileSync('starship/v10/style-1.2.css','utf8');
const loader=fs.readFileSync('starship/loader-v9.js','utf8');
const index=fs.readFileSync('starship/index.html','utf8');

assert(ux.includes("d.symbol=''"),'Core choices remove pairing symbols');
assert(ux.includes("d.icon=''"),'Core choices remove icon-as-symbol fallback');
assert(ux.includes("color='#7f8992'"),'Core cards use neutral grey');
assert(ux.includes('v120AiPick'),'v1.2 retains visible Auto selection state');
assert(ux.includes('delay=offer.opt?.prep?280:760'),'v1.2 visible Auto delay remains in base UX');
assert(ux.includes('v120BuildStats'),'Build menu renders player stats');
assert(ux.includes('v120BuildSymbols'),'Build menu renders accumulated symbols');
assert(ux.includes("x.evolved?'🌈':''"),'Evolved symbols are visually distinguished');
assert(ux.includes("R.VERSION='1.2.0'"),'v1.2 base module still owns its historical stamp before later patch overrides');
assert(css.includes('.card.v110Core,.card.v120CoreCard'),'Core grey styling exists');
assert(css.includes('.v110DraftCard.v120AiPick'),'v1.2 Auto choice highlight styling exists');
assert(css.includes('.v120BuildStats'),'Build stats styling exists');
assert(css.includes('.v120BuildSymbol.paired'),'Paired-symbol glow styling exists');
assert(loader.includes("v10+'style-1.2.css'"),'Loader still includes v1.2 CSS');
assert(loader.includes("v10+'ux-1.2.js'"),'Loader still includes v1.2 UX module');
assert(loader.indexOf("v10+'card-ui.js'")<loader.indexOf("v10+'ux-1.2.js'"),'v1.2 UX loads after base card UI');
assert(/const V='12\.[01]\.0'/.test(loader),'Loader cache key is v1.2 or a compatible v1.2.x patch');
assert(/window\.SR\.VERSION='1\.2\.[01]'/.test(loader),'Final runtime version remains in the v1.2 line');
assert(/version='1\.2\.[01]'/.test(loader),'Save display version remains in the v1.2 line');
assert(/loader-v9\.js\?v=12\.[01]\.0/.test(index),'HTML loader cache key remains in the v1.2 line');
console.log('v1.2 card UX regression validation passed');
