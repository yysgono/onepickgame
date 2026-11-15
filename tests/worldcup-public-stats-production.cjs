const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),{JSDOM,ResourceLoader,VirtualConsole}=require('jsdom');
const {renderWorldcupViewHtml}=require('../worldcup-view-routes.cjs'),build=path.resolve(process.argv[2]||'../instagram-share-build'),id='a1111111-1111-4111-8111-111111111111';
const cup={id,title:'Tournament',title_translations:{ko:'테스트 월드컵',en:'Tournament'},winner_id:'a',data:[{id:'a',name:'Winner',name_translations:{ko:'현재 우승 후보',en:'Winner'},image:'https://example.com/winner.jpg'},{id:'b',name:'Other',image:'https://example.com/other.jpg'}]};
const rows=[{candidate_id:'a',name:'Old winner name',win_count:8,total_games:183,match_wins:16,match_count:20},{candidate_id:'b',name:'Other',win_count:1,total_games:183,match_wins:4,match_count:10}];
class Local extends ResourceLoader{fetch(url){const pathname=new URL(url).pathname;if(pathname.startsWith('/static/'))return Promise.resolve(fs.readFileSync(path.join(build,pathname)));return null;}}
(async()=>{
 for(const lang of ['ko','en']){
  const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(e.type!=='not implemented')errors.push(e.message)});let calls=0;
  const html=renderWorldcupViewHtml(fs.readFileSync(path.join(build,'index.html'),'utf8'),'https://www.onepickgame.com',lang,'result',cup,'',{status:'ready',rows,checkedAt:'2026-11-15T20:00:00Z'});
  const raw=new JSDOM(html);assert(raw.window.document.querySelector('tbody').textContent.includes('4.4%'));assert.equal(raw.window.document.querySelector('tbody th').textContent,lang==='ko'?'현재 우승 후보':'Winner');raw.window.close();
  const dom=new JSDOM(html,{url:`https://www.onepickgame.com/${lang}/result/${id}`,runScripts:'dangerously',resources:new Local(),pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){
   Object.defineProperty(w,'crypto',{value:require('node:crypto').webcrypto,configurable:true});w.fetch=async(input)=>{
    const u=new URL(String(input),'https://www.onepickgame.com');let data=[];
    if(u.pathname.endsWith('/worldcups')&&u.searchParams.get('id')==='eq.'+id)data=cup;
    else if(u.pathname.endsWith('/rpc/get_winner_stats')){data=rows;calls++;}
    return new Response(JSON.stringify(data),{status:200,headers:{'content-type':'application/json'}});
   };
   w.matchMedia=()=>({matches:false,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});w.scrollTo=()=>{};w.structuredClone=structuredClone;w.TextEncoder=TextEncoder;w.TextDecoder=TextDecoder;w.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}};w.IntersectionObserver=class{constructor(cb){this.cb=cb;}observe(target){queueMicrotask(()=>this.cb([{isIntersecting:true,target}]))}unobserve(){}disconnect(){}};
  }});
  try{
   const d=dom.window.document,wait=async(fn)=>{for(let n=0;n<300;n++){if(fn())return;await new Promise(r=>setTimeout(r,40));}throw Error('Timeout '+lang+' '+d.body.textContent.slice(-1200)+' '+errors.join('\n'))};
   await wait(()=>calls>0&&d.body.textContent.includes('4.4%')&&!d.querySelector('#worldcup-public-ranking-title'));
   assert(d.querySelector('img[src="https://example.com/winner.jpg"]'),'Current winner thumbnail still renders');assert(d.body.textContent.includes(lang==='ko'?'현재 우승 후보':'Winner'));assert.equal(d.querySelectorAll('#worldcup-public-ranking-title').length,0,'React replaces the SSR shell, with no duplicate ranking section');assert.equal(errors.length,0,errors.join('\n'));
   console.log('PASS: built '+lang+' result keeps current winner thumbnail and live statistics after replacing the populated first HTML.');
  }finally{dom.window.close();}
 }
})().catch(error=>{console.error(error);process.exitCode=1});
