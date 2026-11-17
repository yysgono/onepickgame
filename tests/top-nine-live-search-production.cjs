const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),{JSDOM,ResourceLoader,VirtualConsole}=require('jsdom');
const build=path.resolve(process.argv[2]||'../top-nine-live-search-build'),source='00000000-0000-4000-8000-000000000001';
const slots=Array.from({length:9},(_,i)=>({id:String(i),name:'Photo '+i,src:'https://example.com/'+i+'.jpg',zoom:1,x:50,y:50}));
const initial={id:'10000000-0000-4000-8000-000000000001',title:'Initial public collage',slots,source_worldcup_ids:[],show_names:false,show_ranks:false};
const raw={id:source,title:'로블록스 월드컵',title_translations:{en:'Roblox bracket'},top_nine_title_translations:{ko:'최애 로블록스 구절판 만들기',en:'My Top 9 Roblox Games'},thumbnail:'https://example.com/template.jpg'};
class Local extends ResourceLoader{fetch(url){const p=new URL(url).pathname;if(p.startsWith('/static/'))return Promise.resolve(fs.readFileSync(path.join(build,p)));return null;}}
async function run(lang){const requests=[],errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(e.type!=='not implemented')errors.push(e.message)});
 const dom=new JSDOM(fs.readFileSync(path.join(build,'index.html'),'utf8'),{url:`https://www.onepickgame.com/${lang}/mytop9`,runScripts:'dangerously',resources:new Local(),pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){
  Object.defineProperty(w,'crypto',{value:require('node:crypto').webcrypto,configurable:true});w.fetch=async(input,init)=>{const u=new URL(String(input),'https://www.onepickgame.com');let data=[];
   if(u.pathname.endsWith('/rpc/search_top_nine_sources')){const b=JSON.parse(init.body);requests.push({kind:'preset',...b});data=b.p_query==='missing'?[]:[raw];}
   else if(u.pathname.endsWith('/rpc/search_top_nine_public_boards')){const b=JSON.parse(init.body);requests.push({kind:'board',...b});data=b.p_query==='missing'?[]:Array.from({length:b.p_offset?1:12},(_,i)=>({...initial,id:'20000000-0000-4000-8000-'+String(i+b.p_offset).padStart(12,'0'),title:'최애 로블록스 구절판 만들기 - Guest',source_worldcup_ids:[source],category:'game'}));}
   else if(u.pathname.endsWith('/top_nine_public_boards'))data=[initial];
   else if(u.pathname.endsWith('/worldcups'))data=[raw];
   else if(u.pathname.endsWith('/top_nine_templates'))data=[{source_worldcup_id:source,title_translations:raw.top_nine_title_translations}];
   return new Response(JSON.stringify(data),{headers:{'content-type':'application/json'}});
  };w.matchMedia=()=>({matches:false,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});w.scrollTo=()=>{};w.structuredClone=structuredClone;w.TextEncoder=TextEncoder;w.TextDecoder=TextDecoder;w.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}};w.IntersectionObserver=class{observe(){}unobserve(){}disconnect(){}};
 }});
 const w=dom.window,d=w.document,wait=async fn=>{for(let i=0;i<350;i++){if(fn())return;await new Promise(r=>setTimeout(r,25));}throw Error('Search '+lang+' timeout '+d.body.textContent.slice(-700)+' '+errors.join('\n'))};
 const type=text=>{const input=d.querySelector('.tn-search input');Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype,'value').set.call(input,text);input.dispatchEvent(new w.Event('input',{bubbles:true}));};
 try{
  await wait(()=>d.querySelector('.tn-public-card-link'));type('R');await new Promise(r=>setTimeout(r,25));type('Ro');await new Promise(r=>setTimeout(r,25));type('Roblox');await wait(()=>d.querySelectorAll('.tn-public-card-link').length===12&&requests.some(r=>r.kind==='preset'&&r.p_query==='Roblox'));
  assert(!requests.some(r=>['R','Ro'].includes(r.p_query)));assert.equal(d.querySelectorAll('.tn-template-link').length,1);assert(d.querySelector('.tn-public-card-link strong').textContent.includes(lang==='en'?'My Top 9 Roblox Games':'최애 로블록스'));
  d.querySelector('.tn-gallery-more').click();await wait(()=>d.querySelectorAll('.tn-public-card-link').length===13);assert(requests.some(r=>r.kind==='board'&&r.p_offset===12));
  d.querySelector('.tn-sort-filters button').click();await wait(()=>requests.at(-1)?.p_sort==='popular');assert.equal(requests.at(-1).p_offset,0);assert.equal(requests.at(-1).p_query,'Roblox');
  type('missing');await wait(()=>requests.some(r=>r.kind==='board'&&r.p_query==='missing')&&!d.querySelector('.tn-public-cards[aria-busy=true]'));assert.equal(d.querySelectorAll('.tn-public-card-link').length,0);assert.equal(d.querySelectorAll('.tn-template-link').length,0);
  type('');await wait(()=>d.querySelector('.tn-public-card-link strong')?.textContent==='Initial public collage');assert.equal(d.querySelectorAll('.tn-template-link').length,1);assert.equal(d.querySelector('input').value,'');assert.equal(errors.length,0,errors.join('\n'));
  console.log('PASS built '+lang+': typing searches both presets and public collages, translated titles, debounce, board pagination/sort, no matches and clear restore.');
 }finally{dom.window.close();}
}
(async()=>{for(const lang of ['ko','en'])await run(lang)})().catch(e=>{console.error(e);process.exitCode=1});
