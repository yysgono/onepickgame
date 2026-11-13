// Exercise the built app, including webpack lazy chunks and real module imports.
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {JSDOM,ResourceLoader,VirtualConsole}=require('jsdom');
const build=path.resolve(process.argv[2]||'../top-nine-octagon-fixed-build');
const language=process.argv[3]||'en';
const source={id:'b1168231-f7da-4be1-afb9-17db9dfb2fa1',title:'Template',data:Array.from({length:20},(_,i)=>({name:'Candidate '+i,image:'https://example.com/'+i+'.jpg'}))};
const {renderTemplateHtml}=require('../top-nine-template-routes.cjs');
class LocalBuild extends ResourceLoader{
 fetch(url){const pathname=new URL(url).pathname;if(pathname.startsWith('/static/')){const file=path.join(build,pathname);if(fs.existsSync(file))return Promise.resolve(fs.readFileSync(file));}return null;}
}
(async()=>{
 const errors=[];const console=new VirtualConsole();console.on('error',(...args)=>errors.push(args.map(String).join(' ')));console.on('jsdomError',error=>{if(error.type!=='not implemented')errors.push(error.message)});
 const dom=new JSDOM(renderTemplateHtml(fs.readFileSync(path.join(build,'index.html'),'utf8'),'https://www.onepickgame.com',language,source),{
  url:`https://www.onepickgame.com/${language}/mytop9/templates/${source.id}`,runScripts:'dangerously',resources:new LocalBuild(),pretendToBeVisual:true,virtualConsole:console,
  beforeParse(window){
   window.fetch=async(url)=>{if(String(url).includes('/rest/v1/worldcups'))throw Error('Template data must not be fetched again');return new Response(JSON.stringify([]),{status:200,headers:{'content-type':'application/json'}});};
   window.matchMedia=()=>({matches:false,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});
   window.scrollTo=()=>{};window.structuredClone=structuredClone;window.TextEncoder=TextEncoder;window.TextDecoder=TextDecoder;
   window.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}};
   window.IntersectionObserver=class{observe(){}unobserve(){}disconnect(){}};
  }
 });
 try{
  for(let i=0;i<100;i++){
   if(dom.window.document.querySelector('.tn-candidates'))break;
   if(dom.window.document.body.textContent.includes('A temporary error occurred'))break;
   await new Promise(resolve=>setTimeout(resolve,50));
  }
  const grid=dom.window.document.querySelector('.tn-candidates');
  assert.ok(grid,`Production home did not render: ${errors.join('\n').slice(0,2000)}`);
  assert.equal(grid.querySelectorAll('button[data-candidate-id]').length,12);
  assert.equal(dom.window.document.querySelectorAll('meta[name=robots][content*=noindex]').length,0);
  assert(dom.window.document.querySelector('link[rel=canonical]').href.endsWith('/'+language+'/mytop9/templates/'+source.id));

  assert.ok(!errors.some(e=>e.includes('Page could not be loaded')),errors.join('\n'));
  process.stdout.write('PASS: actual production /'+language+'/mytop9 template renders 12 candidates from server data with indexable metadata and no second template request\n');
 }finally{dom.window.close();}
})().catch(error=>{process.stderr.write(String(error.stack)+'\n');process.exitCode=1});
