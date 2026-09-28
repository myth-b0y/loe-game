(async()=>{
  const V='6.5.1';
  const base='./v5/',patch='./v6/';
  const text=async url=>{const r=await fetch(url+'?v='+V,{cache:'no-store'});if(!r.ok)throw new Error('LOAD '+url);return r.text()};
  const join=async(root,name,count)=>{let out='';for(let i=0;i<count;i++)out+=await text(root+name+'.'+i+'.txt');return out};
  const ungzip=async(root,name,count)=>{let b64='';for(let i=0;i<count;i++)b64+=await text(root+name+'.gz.b64.'+i);const raw=Uint8Array.from(atob(b64),c=>c.charCodeAt(0));const stream=new Blob([raw]).stream().pipeThrough(new DecompressionStream('gzip'));return new Response(stream).text()};
  try{
    const baseStyle=document.createElement('style');baseStyle.textContent=await ungzip(base,'style',1);document.head.append(baseStyle);
    (0,eval)(await join(base,'data',4));
    // Set the release version BEFORE combat/UI evaluate so any eager app startup renders the correct version.
    window.SR.VERSION='0.6.5';
    (0,eval)(await ungzip(base,'combat',3));
    (0,eval)(await ungzip(base,'ui',2));
    const v6Style=document.createElement('style');v6Style.textContent=await text(patch+'style.css');document.head.append(v6Style);
    (0,eval)(await join(patch,'patch',5));
    (0,eval)(await text(patch+'hotfix.0.txt'));
    const v62Style=document.createElement('style');v62Style.textContent=await text(patch+'style.2.css');document.head.append(v62Style);
    (0,eval)(await join(patch,'hotfix.2',5));
    const v63Style=document.createElement('style');v63Style.textContent=await text(patch+'style.3.css');document.head.append(v63Style);
    (0,eval)(await text(patch+'hotfix.3.txt'));
    (0,eval)(await text(patch+'hotfix.4.txt'));
    window.SR.VERSION='0.6.5';
    if(window.SR.app?.s){window.SR.app.s.version='0.6.5';try{window.SR.save(window.SR.app.s)}catch{}}
    if(document.readyState!=='loading'&&window.SR?.App&&!window.SR.app)window.SR.app=new window.SR.App();
  }catch(e){console.error(e);document.body.innerHTML='<main style="font-family:system-ui;background:#02050a;color:#eaf5fb;min-height:100vh;padding:40px 20px"><h2>LoE: Starship Survivor</h2><p>v0.6.5 failed to load. Refresh once. If it persists, report LOAD ERROR V6.5.</p><pre style="white-space:pre-wrap;color:#ff9aaa">'+String(e.message||e)+'</pre></main>'}
})();
