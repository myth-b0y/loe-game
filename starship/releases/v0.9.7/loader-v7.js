(async()=>{
  const V='7.0.1';
  const base='./v5/',v6='./v6/',v7='./v7/';
  const text=async url=>{const r=await fetch(url+'?v='+V,{cache:'no-store'});if(!r.ok)throw new Error('LOAD '+url);return r.text()};
  const join=async(root,name,count)=>{let out='';for(let i=0;i<count;i++)out+=await text(root+name+'.'+i+'.txt');return out};
  const ungzip=async(root,name,count)=>{let b64='';for(let i=0;i<count;i++)b64+=await text(root+name+'.gz.b64.'+i);const raw=Uint8Array.from(atob(b64),c=>c.charCodeAt(0));const stream=new Blob([raw]).stream().pipeThrough(new DecompressionStream('gzip'));return new Response(stream).text()};
  try{
    const baseStyle=document.createElement('style');baseStyle.textContent=await ungzip(base,'style',1);document.head.append(baseStyle);
    (0,eval)(await join(base,'data',4));
    window.SR.VERSION='0.7.0';
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
    const s71=document.createElement('style');s71.textContent=await text(v7+'style.1.css');document.head.append(s71);
    (0,eval)(await text(v7+'hotfix.1.js'));
    window.SR.VERSION='0.7.0';
    if(window.SR.app?.s){window.SR.app.s=window.SR.migrate(window.SR.app.s);try{window.SR.save(window.SR.app.s)}catch{}}
    if(document.readyState!=='loading'&&window.SR?.App&&!window.SR.app)window.SR.app=new window.SR.App();
  }catch(e){console.error(e);document.body.innerHTML='<main style="font-family:system-ui;background:#02050a;color:#eaf5fb;min-height:100vh;padding:40px 20px"><h2>LoE: Starship Survivor</h2><p>v0.7 failed to load. Refresh once. If it persists, report LOAD ERROR V7.</p><pre style="white-space:pre-wrap;color:#ff9aaa">'+String(e.message||e)+'</pre></main>'}
})();
