const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),{JSDOM,ResourceLoader,VirtualConsole}=require('jsdom');
const build=path.resolve(process.argv[2]||'../social-share-ranking-build'),id='a1111111-1111-4111-8111-111111111111';
const board={id,title:'Board old',slots:Array.from({length:9},(_,i)=>({id:String(i),name:'Photo '+i,src:'https://example.com/'+i+'.jpg',zoom:1,x:50,y:50})),show_names:false,show_ranks:false,author_id:null,guest_nickname:'Guest',source_worldcup_ids:[],category:'games',view_count:99,created_at:'2026-11-01T00:00:00Z'};
const recent={...board,id:'b2222222-2222-4222-8222-222222222222',title:'Board newest',view_count:0,created_at:'2026-11-15T00:00:00Z'};
const cup={id,title:'Test worldcup',title_translations:{ko:'테스트 월드컵',en:'Test worldcup'},data:Array.from({length:16},(_,i)=>({id:i+1,name:'Candidate '+i,image:'https://example.com/'+i+'.jpg'}))};
class Local extends ResourceLoader{fetch(url){const pathname=new URL(url).pathname;if(pathname.startsWith('/static/'))return Promise.resolve(fs.readFileSync(path.join(build,pathname)));return null;}}
async function run(lang,route){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',error=>{if(error.type!=='not implemented')errors.push(error.message)});let viewRequests=0;
 const dom=new JSDOM(fs.readFileSync(path.join(build,'index.html'),'utf8'),{url:`https://www.onepickgame.com/${lang}/${route}`,runScripts:'dangerously',resources:new Local(),pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){
  Object.defineProperty(w,'crypto',{value:require('node:crypto').webcrypto,configurable:true});w.fetch=async(input,init)=>{
   const u=new URL(String(input),'https://www.onepickgame.com');let data=[];
   if(u.pathname.endsWith('/top_nine_public_boards'))data=u.searchParams.has('id')?board:u.searchParams.get('order')?.startsWith('view_count')?[board,recent]:[recent,board];
   else if(u.pathname.endsWith('/rpc/record_top_nine_view_v2')){data=true;viewRequests++;}
   else if(u.pathname.endsWith('/worldcups')&&u.searchParams.get('id')==='eq.'+id)data=cup;
   else if(u.pathname.endsWith('/tier_lists')&&u.searchParams.get('id')==='eq.'+id)data={id,title:'My tier result',guest_nickname:'Guest',candidates:cup.data,tiers:{S:[1,2],A:[3]},tier_labels:{S:'S',A:'A'},created_at:'2026-11-15T00:00:00Z'};
   else if(u.pathname.endsWith('/quizzes')&&u.searchParams.get('id')==='eq.'+id)data={id,title:'My quiz',title_translations:{ko:'내 퀴즈',en:'My quiz'},is_published:true,answer_reveal_mode:'both'};
   else if(u.pathname.endsWith('/quiz_questions'))data=[{id:'q1',quiz_id:id,question_type:'multiple_choice',question_text:'Question?',options:['A','B'],correct_index:0,answers:[]}];
   return new Response(JSON.stringify(data),{status:200,headers:{'content-type':'application/json'}});
  };
  w.matchMedia=()=>({matches:false,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});w.scrollTo=()=>{};w.structuredClone=structuredClone;w.TextEncoder=TextEncoder;w.TextDecoder=TextDecoder;w.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}};w.IntersectionObserver=class{constructor(cb){this.cb=cb;}observe(target){if(route.startsWith('result/'))queueMicrotask(()=>this.cb([{isIntersecting:true,target}]))}unobserve(){}disconnect(){}};
 }});
 const d=dom.window.document,wait=async fn=>{for(let n=0;n<300;n++){if(fn())return;await new Promise(r=>setTimeout(r,40));}throw Error(route+' timeout '+d.body.textContent.slice(-1000)+' '+errors.join(' ').slice(0,400))};
 try{
  if(route==='mytop9'){
   await wait(()=>d.querySelectorAll('.tn-public-card-link').length===2);assert.equal(d.querySelector('.tn-public-card-link strong').textContent,'Board newest');d.querySelector('.tn-sort-filters button').click();await wait(()=>d.querySelector('.tn-public-card-link strong').textContent==='Board old');assert.equal(d.querySelector('.tn-board-views'),null);assert.equal(d.querySelector('.tn-public-cards article>small'),null);
  }else if(route.startsWith('select-round/')){
   await wait(()=>d.querySelector('.worldcup-round-selection'));assert.equal(d.querySelector('.opg-social-share'),null);assert.equal(d.querySelector('.worldcup-round-selection').previousElementSibling.tagName,'H1');assert.equal(d.querySelector('.worldcup-selection-thumbnail').previousElementSibling,d.querySelector('.worldcup-round-selection'));
  }else{
   await wait(()=>d.querySelector('.opg-social-share a'));const x=new URL(d.querySelector('.opg-share-x').href),shared=new URL(x.searchParams.get('url'));
   const expected=route.startsWith('result/')?'result/'+id:route;assert.equal(shared.pathname,'/'+lang+'/'+expected);assert(x.searchParams.get('text'));
   if(route.startsWith('mytop9/')){await wait(()=>viewRequests===1);assert.equal(viewRequests,1);}
   assert.equal(d.querySelectorAll('.opg-share-kakao').length,0);assert(d.querySelector('.opg-share-instagram'));
  }
  assert.equal(errors.length,0,errors.join('\n'));console.log('PASS built '+lang+'/'+route);
 }finally{dom.window.close();}
}
(async()=>{for(const lang of ['en','ko'])for(const route of ['mytop9','mytop9/'+id,'quiz/'+id,'tier-list/'+id,'select-round/'+id,'result/'+id])await run(lang,route);})().catch(error=>{console.error(error);process.exitCode=1});
