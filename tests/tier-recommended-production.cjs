const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),{JSDOM,ResourceLoader,VirtualConsole}=require('jsdom');
const build=path.resolve(process.argv[2]||'../tier-recommended-build'),lang=process.argv[3]||'en';
const copy=require('../src/components/tierList/recommendedImageCopy.json')[lang];
const id='a1111111-1111-4111-8111-111111111111',id2='b2222222-2222-4222-8222-222222222222';
const rows=[{id,title:'Source one',title_translations:{en:'Tournament One',ko:'월드컵 하나'},candidate_count:1},{id:id2,title:'Source two',title_translations:{en:'Tournament Two',ko:'월드컵 둘'},candidate_count:1}];
const errors=[],console=new VirtualConsole();console.on('jsdomError',error=>{if(error.type!=='not implemented')errors.push(error.message)});
class LocalBuild extends ResourceLoader{fetch(url){const pathname=new URL(url).pathname;if(pathname.startsWith('/static/')){const file=path.join(build,pathname);if(fs.existsSync(file))return Promise.resolve(fs.readFileSync(file));}return null;}}
const delay=()=>new Promise(resolve=>setTimeout(resolve,40));
(async()=>{
 let detailLoads=0;
 const dom=new JSDOM(fs.readFileSync(path.join(build,'index.html'),'utf8'),{url:`https://www.onepickgame.com/${lang}/tier-list`,runScripts:'dangerously',resources:new LocalBuild(),pretendToBeVisual:true,virtualConsole:console,beforeParse(window){
  window.fetch=async(input)=>{
   const url=new URL(String(input),'https://www.onepickgame.com');let data=[];
   if(url.pathname.endsWith('/rpc/get_tier_source_catalogue'))data=rows;
   else if(url.pathname.endsWith('/worldcups')&&url.searchParams.get('select')==='id,title,title_translations,data'){
    detailLoads++;const second=url.searchParams.get('id')==='eq.'+id2;data={id:second?id2:id,title:second?'Source two':'Source one',data:[{id:1,name:second?'Second candidate':'First candidate',image:second?'https://example.com/second.jpg':'https://example.com/first.jpg'}]};
   }
   return new Response(JSON.stringify(data),{status:200,headers:{'content-type':'application/json'}});
  };
  window.matchMedia=()=>({matches:false,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});window.scrollTo=()=>{};window.structuredClone=structuredClone;window.TextEncoder=TextEncoder;window.TextDecoder=TextDecoder;
  window.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}};window.IntersectionObserver=class{observe(){}unobserve(){}disconnect(){}};
 }});
 try{
  const document=dom.window.document;
  const wait=async predicate=>{for(let i=0;i<250;i++){if(predicate())return;await delay();}throw Error('Timed out: '+errors.join('\n').slice(0,1000));};
  await wait(()=>document.querySelector('.tier-editor-recommended:not(:disabled)'));
  const button=document.querySelector('.tier-editor-recommended');assert.equal(button.previousElementSibling.className,'tier-editor-upload-button');
  const title=document.querySelector('#tier-original-title');const setValue=Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype,'value').set;setValue.call(title,'My saved title');title.dispatchEvent(new dom.window.Event('input',{bubbles:true}));
  button.click();await wait(()=>document.querySelector('.tier-recommended-titles button'));
  assert.equal(detailLoads,0);assert.equal(document.querySelectorAll('.tier-recommended-dialog img,.tier-recommended-dialog video').length,0);
  document.querySelector('.tier-recommended-titles button').click();await wait(()=>!document.querySelector('.tier-recommended-dialog')&&document.querySelector('.tier-editor-candidate-pool').textContent.includes('First candidate'));
  assert.equal(document.querySelector('#tier-original-title').value,'My saved title');
  document.querySelector('.tier-editor-recommended').click();await wait(()=>document.querySelectorAll('.tier-recommended-titles button').length===2);
  document.querySelectorAll('.tier-recommended-titles button')[1].click();await wait(()=>!document.querySelector('.tier-recommended-dialog')&&document.querySelector('.tier-editor-candidate-pool').textContent.includes('Second candidate'));
  const pool=document.querySelector('.tier-editor-candidate-pool');assert(pool.textContent.includes('First candidate'));assert.equal(document.querySelector('#tier-original-title').value,'My saved title');assert.equal(detailLoads,2);
  process.stdout.write('PASS: built '+lang+' tier home opens title-only worldcup list next to upload, defers image loading, imports two sources without losing previous candidates or title.\n');
 }finally{dom.window.close();}
})().catch(error=>{process.stderr.write(String(error.stack)+'\n');process.exitCode=1});
