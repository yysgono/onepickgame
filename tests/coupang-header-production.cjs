// Exercise the built app, including webpack lazy chunks and real module imports.
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {JSDOM,ResourceLoader,VirtualConsole}=require('jsdom');
const build=path.resolve(process.argv[2]||'../top-nine-octagon-fixed-build');
const language=process.argv[3]||'ko';
const mobile=process.argv[4]==='mobile';
class LocalBuild extends ResourceLoader{
 fetch(url){const pathname=new URL(url).pathname;if(pathname.startsWith('/static/')){const file=path.join(build,pathname);if(fs.existsSync(file))return Promise.resolve(fs.readFileSync(file));}return null;}
}
(async()=>{
 const errors=[];const console=new VirtualConsole();console.on('error',(...args)=>errors.push(args.map(String).join(' ')));console.on('jsdomError',error=>{if(error.type!=='not implemented')errors.push(error.message)});
 const dom=new JSDOM(fs.readFileSync(path.join(build,'index.html'),'utf8'),{
  url:`https://www.onepickgame.com/${language}/mytop9`,runScripts:'dangerously',resources:new LocalBuild(),pretendToBeVisual:true,virtualConsole:console,
  beforeParse(window){
   window.fetch=async(url)=>new Response(JSON.stringify(String(url).includes('/api/visitor-country')?{country:'KR'}:[]),{status:200,headers:{'content-type':'application/json'}});
   window.matchMedia=(query)=>({matches:mobile&&query.includes('767px'),addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});
   window.scrollTo=()=>{};window.structuredClone=structuredClone;window.TextEncoder=TextEncoder;window.TextDecoder=TextDecoder;
   window.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}};
   window.IntersectionObserver=class{observe(){}unobserve(){}disconnect(){}};
  }
 });
 try{
  for(let i=0;i<100;i++){
   if(dom.window.document.querySelector('.onepick-affiliate-slot iframe'))break;
   if(dom.window.document.body.textContent.includes('A temporary error occurred'))break;
   await new Promise(resolve=>setTimeout(resolve,50));
  }
  const document=dom.window.document;
  const nav=document.querySelector('.onepick-community-nav');
  assert(nav,'Supplemental menu must render');
  const slot=nav.nextElementSibling;
  assert(slot.classList.contains('onepick-affiliate-slot'),'Banner must immediately follow supplemental menu');
  assert.equal(slot.querySelectorAll('iframe').length,1);
  assert.equal(slot.querySelector('iframe').width,mobile?'320':'728');
  assert.equal(slot.querySelector('iframe').height,mobile?'100':'90');
  assert(slot.textContent.includes('수수료'));
  process.stdout.write('PASS: built '+language+' page places one '+(mobile?'320x100':'728x90')+' affiliate banner immediately below supplemental menu\n');
 }finally{dom.window.close();}
})().catch(error=>{process.stderr.write(String(error.stack)+'\n');process.exitCode=1});
