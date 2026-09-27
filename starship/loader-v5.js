(async()=>{
  const V='5';
  const root='./v5/';
  const text=async url=>{const r=await fetch(url+'?v='+V,{cache:'no-store'});if(!r.ok)throw new Error('LOAD '+url);return r.text()};
  const ungzip=async(name,count)=>{let b64='';for(let i=0;i<count;i++)b64+=await text(root+name+'.gz.b64.'+i);const raw=Uint8Array.from(atob(b64),c=>c.charCodeAt(0));const stream=new Blob([raw]).stream().pipeThrough(new DecompressionStream('gzip'));return new Response(stream).text()};
  try{
    const style=document.createElement('style');style.textContent=await ungzip('style',1);document.head.append(style);
    (0,eval)(await ungzip('data',2));
    (0,eval)(await ungzip('combat',3));
    (0,eval)(await ungzip('ui',2));
    if(document.readyState!=='loading'&&window.SR?.App&&!window.SR.app)window.SR.app=new window.SR.App();
  }catch(e){console.error(e);document.body.innerHTML='<main style="font-family:system-ui;background:#02050a;color:#eaf5fb;min-height:100vh;padding:40px 20px"><h2>LoE: Starship Survivor</h2><p>v0.5 failed to load. Refresh the page once. If it persists, report LOAD ERROR V5.</p></main>'}
})();
