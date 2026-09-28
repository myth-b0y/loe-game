(async()=>{
  const V='9.4';
  const base='./v5/',v6='./v6/',v7='./v7/',v8='./v8/',v9='./v9/';
  const text=async url=>{const r=await fetch(url+'?v='+V,{cache:'no-store'});if(!r.ok)throw new Error('LOAD '+url);return r.text()};
  const join=async(root,name,count)=>{let out='';for(let i=0;i<count;i++)out+=await text(root+name+'.'+i+'.txt');return out};
  const ungzip=async(root,name,count)=>{let b64='';for(let i=0;i<count;i++)b64+=await text(root+name+'.gz.b64.'+i);const raw=Uint8Array.from(atob(b64),c=>c.charCodeAt(0));const stream=new Blob([raw]).stream().pipeThrough(new DecompressionStream('gzip'));return new Response(stream).text()};
  try{
    const baseStyle=document.createElement('style');baseStyle.textContent=await ungzip(base,'style',1);document.head.append(baseStyle);
    (0,eval)(await join(base,'data',4));
    window.SR.VERSION='0.9.4';
    (0,eval)(await ungzip(base,'combat',3));
    (0,eval)(await ungzip(base,'ui',2));
    const s6=document.createElement('style');s6.textContent=await text(v6+'style.css');document.head.append(s6);
    (0,eval)(await join(v6,'patch',5));
    (0,eval)(await text(v6+'hotfix.0.txt'));
    const s62=document.createElement('style');s62.textContent=await text(v6+'style.2.css');document.head.append(s62);
    (0,eval)(await join(v6,'hotfix.2',5));
    const s63=document.createElement('style');s63.textContent=await text(v6+'style.3.css');document.head.append(s63);
    (0,eval)(await text(v6+'hotfix.3.txt'));
    (0,eval)(await text(v6+'hotfix.4.txt'));
    const s7=document.createElement('style');s7.textContent=await text(v7+'style.css');document.head.append(s7);
    (0,eval)(await text(v7+'patch.js'));
    const s8=document.createElement('style');s8.textContent=await text(v8+'style.css');document.head.append(s8);
    (0,eval)(await join(v8,'patch',5));
    (0,eval)(await text(v8+'hotfix.0.txt'));
    const s81=document.createElement('style');s81.textContent=await text(v8+'style.1.css');document.head.append(s81);
    (0,eval)(await text(v8+'hotfix.1.txt'));
    const s82=document.createElement('style');s82.textContent=await text(v8+'style.2.css');document.head.append(s82);
    (0,eval)(await text(v8+'hotfix.2.txt'));
    (0,eval)(await text(v8+'hotfix.3.txt'));
    const s9=document.createElement('style');s9.textContent=await text(v9+'style.css');document.head.append(s9);
    (0,eval)(await text(v9+'patch.js'));
    const s91=document.createElement('style');s91.textContent=await text(v9+'style.1.css');document.head.append(s91);
    (0,eval)(await text(v9+'hotfix.1.js'));
    (0,eval)(await text(v9+'hotfix.2.js'));
    const s92=document.createElement('style');s92.textContent=await text(v9+'style.2.css');document.head.append(s92);
    (0,eval)(await text(v9+'hotfix.3.js'));
    const s93=document.createElement('style');s93.textContent=await text(v9+'style.3.css');document.head.append(s93);
    (0,eval)(await text(v9+'hotfix.4.js'));
    (0,eval)(await text(v9+'hotfix.5.js'));
    window.SR.VERSION='0.9.4';
    if(window.SR.app?.s){window.SR.app.s=window.SR.migrate(window.SR.app.s);window.SR.app.s.version='0.9.4';try{window.SR.save(window.SR.app.s)}catch{}}
    if(document.readyState!=='loading'&&window.SR?.App&&!window.SR.app)window.SR.app=new window.SR.App();
  }catch(e){console.error(e);document.body.innerHTML='<main style="font-family:system-ui;background:#02050a;color:#eaf5fb;min-height:100vh;padding:40px 20px"><h2>LoE: Starship Survivor</h2><p>v0.9.4 failed to load. Refresh once. If it persists, report LOAD ERROR V9.4.</p><pre style="white-space:pre-wrap;color:#ff9aaa">'+String(e.message||e)+'</pre></main>'}
})();
