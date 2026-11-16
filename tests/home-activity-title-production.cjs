const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),{JSDOM,ResourceLoader,VirtualConsole}=require('jsdom');
const build=path.resolve(process.argv[2]||'../worldcup-language-fix-build');
class Local extends ResourceLoader{fetch(url){const pathname=new URL(url).pathname;if(pathname.startsWith('/static/'))return Promise.resolve(fs.readFileSync(path.join(build,pathname)));return null;}}
(async()=>{for(const lang of ['en','ko']){
 const vc=new VirtualConsole(),errors=[];vc.on('jsdomError',e=>{if(e.type!=='not implemented')errors.push(e.message)});
 const raw={id:'a1111111-1111-4111-8111-111111111111',title:'저장된 한국어 제목',title_translations:{en:'Saved English title',ko:'저장된 한국어 제목'}};
 const dom=new JSDOM(fs.readFileSync(path.join(build,'index.html'),'utf8'),{url:`https://www.onepickgame.com/${lang}`,runScripts:'dangerously',resources:new Local(),pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){
  Object.defineProperty(w,'crypto',{value:require('node:crypto').webcrypto,configurable:true});w.innerWidth=1900;w.fetch=async(input,init)=>{const u=new URL(String(input),'https://www.onepickgame.com');let data=[];
   if(u.pathname.endsWith('/rpc/get_worldcup_home_rows')){
    const body=JSON.parse(init.body),rows={};for(const r of body.p_requests)rows[r.key]={offset:r.offset,total:0,items:[]};data={rows,totals:{},activity:{created:[{cup:raw,time:'2026-11-15T12:00:00Z'}],played:[{cup:{...raw,title_translations:JSON.stringify(raw.title_translations)},time:'2026-11-15T12:00:00Z'}]}};
   }
   if(u.pathname.endsWith('/winner_logs'))data=[{cup_id:raw.id,created_at:'2026-11-15T12:00:00Z'}];
   else if(u.pathname.endsWith('/worldcups'))data=[{...raw,title_translations:JSON.stringify(raw.title_translations)}];
   return new Response(JSON.stringify(data),{status:200,headers:{'content-type':'application/json'}});
  };
  w.matchMedia=()=>({matches:false,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});w.scrollTo=()=>{};w.structuredClone=structuredClone;w.TextEncoder=TextEncoder;w.TextDecoder=TextDecoder;w.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}};w.IntersectionObserver=class{observe(){}unobserve(){}disconnect(){}};
 }});
 try{const d=dom.window.document;for(let n=0;n<250&&d.querySelectorAll('.home-activity-link').length<2;n++)await new Promise(r=>setTimeout(r,40));const links=d.querySelectorAll('.home-activity-link');assert.equal(links.length,2,d.body.textContent.slice(-700)+' '+errors.join('\n'));for(const link of links)assert.equal(link.title,lang==='en'?'Saved English title':'저장된 한국어 제목');assert.equal(errors.length,0,errors.join('\n'));console.log('PASS: built '+lang+' recently created/played lists use saved translations without original_language, including JSON translation maps.');}finally{dom.window.close();}
}})().catch(error=>{console.error(error);process.exitCode=1});
