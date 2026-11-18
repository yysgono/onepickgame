const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),{JSDOM,ResourceLoader,VirtualConsole}=require('jsdom');
const build=path.resolve(process.argv[2]||'../tier-card-language-build'),id='a1111111-1111-4111-8111-111111111111',other='b2222222-2222-4222-8222-222222222222';
const slots=Array.from({length:9},(_,i)=>({id:String(i),name:'Photo '+i,src:'https://example.com/'+i+'.jpg',zoom:1,x:50,y:50}));
const cup={id,title:'Original',title_translations:{ko:'저장된 한국어 제목',en:'Saved English title'},category:'game',tier_preset_title_translations:{ko:'원신 캐릭터 티어표 만들기',en:'Genshin Impact Character Tier List'},data:slots.map((s,i)=>({id:i+1,name:s.name,image:s.src}))};
const board={id,title:'My Top 9',slots,author_id:null,source_worldcup_ids:[id],category:'game',show_names:false,show_ranks:false};
const tier={id,source_worldcup_id:id,title:'원신 캐릭터 티어표 만들기 - admin',tier_labels:{S:'S',_sourcePresetName:'원신 캐릭터 티어표 만들기',_originalLanguage:'ko'},tiers:{S:[1]},candidates:cup.data,category:'game',thumbnail_url:slots[0].src,created_at:new Date().toISOString()};
class Local extends ResourceLoader{fetch(url){const p=new URL(url).pathname;if(p.startsWith('/static/'))return Promise.resolve(fs.readFileSync(path.join(build,p)));return null;}}
async function run(lang,route){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(e.type!=='not implemented')errors.push(e.message)});
 const dom=new JSDOM(fs.readFileSync(path.join(build,'index.html'),'utf8'),{url:`https://www.onepickgame.com/${lang}/${route}`,runScripts:'dangerously',resources:new Local(),pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){
  Object.defineProperty(w,'crypto',{value:require('node:crypto').webcrypto,configurable:true});w.innerWidth=1900;w.fetch=async(input,init)=>{
   const u=new URL(String(input),'https://www.onepickgame.com');let data=[];const eq=u.searchParams.get('id')==='eq.'+id;
   if(u.pathname.endsWith('/rpc/get_worldcup_home_rows')){const body=JSON.parse(init.body),rows={};for(const r of body.p_requests)rows[r.key]={offset:r.offset,total:0,items:[]};data={rows,totals:{},activity:{created:[],played:[]}};}
   else if(u.pathname.endsWith('/winner_logs')||u.pathname.endsWith('/quiz_attempts'))data=Array.from({length:4},(_,i)=>({cup_id:route.startsWith('result/')?other:id,quiz_id:id,created_at:new Date(Date.now()-(i+3)*60000).toISOString()}));
   else if(u.pathname.endsWith('/worldcup_card_previews'))data=[{cup_id:id,image_urls:['https://example.com/winner-a.jpg','https://example.com/winner-b.jpg'],candidate_ids:['a','b']}];
   else if(u.pathname.endsWith('/worldcups'))data=eq?cup:[route.startsWith('result/')?{...cup,id:other,preview:{image:slots[0].src}}:cup];
   else if(u.pathname.endsWith('/quizzes'))data=[{...cup,is_published:true}];
   else if(u.pathname.endsWith('/top_nine_public_boards'))data=eq?board:[{...board,id:other,title:'Recommended Top 9',view_count:42}];
   else if(u.pathname.endsWith('/tier_list_home_cards'))data=[{...tier,id:other}];
   else if(u.pathname.endsWith('/tier_lists'))data=eq?tier:[{...tier,id:other,title:'원신 캐릭터 티어표 만들기 - admin',view_count:42}];
   return new Response(JSON.stringify(data),{headers:{'content-type':'application/json'}});
  };
  w.matchMedia=()=>({matches:false,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});w.scrollTo=()=>{};w.structuredClone=structuredClone;w.TextEncoder=TextEncoder;w.TextDecoder=TextDecoder;w.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}};w.IntersectionObserver=class{constructor(cb){this.cb=cb}observe(target){queueMicrotask(()=>this.cb([{isIntersecting:true,target}]))}unobserve(){}disconnect(){}};
 }});
 const d=dom.window.document,wait=async fn=>{for(let i=0;i<350;i++){if(fn())return;await new Promise(r=>setTimeout(r,30));}throw Error(route+' timeout '+d.body.textContent.slice(-1200)+' '+errors.join('\n'))};
 try{
  if(route===''||route==='quiz'){
   await wait(()=>d.querySelectorAll('.home-activity-link').length>=4);const links=[...d.querySelectorAll('.home-activity-panel')].flatMap(panel=>/최근 플레이|Recently Played/.test(panel.querySelector('h2')?.textContent)?[...panel.querySelectorAll('.home-activity-link')]:[]);
   assert.equal(links.length,4);assert.equal(new Set(links.map(link=>link.getAttribute('href'))).size,1);assert(links[0].textContent.includes(lang==='ko'?'3분 전':'3 minutes ago'));assert(links[3].textContent.includes(lang==='ko'?'6분 전':'6 minutes ago'));
  }else if(route==='signup'){
   await wait(()=>[...d.querySelectorAll('aside')].some(el=>el.textContent.includes('NAVER')));const notice=[...d.querySelectorAll('aside')].find(el=>el.textContent.includes('NAVER'));assert(notice.querySelector('p br'));
  }else if(route==='tier-list'){
   await wait(()=>d.querySelector('.tier-cards-grid .tier-card-preview--ranked')&&d.querySelector('.tier-cards-grid .tier-card-preview-candidate img'));assert.equal(d.querySelectorAll('.tier-cards-grid .tier-card-preview-label').length,4);assert(d.querySelector('.tier-cards-grid .tier-card-preview-candidate img'));assert(d.querySelector('.onepick-header-modes'));assert(!d.querySelector('.onepick-header--platform'));
  }else{
   await wait(()=>d.querySelector('.result-recommendation-card'));const cards=d.querySelectorAll('.result-recommendation-card');assert.equal(cards.length,1);assert(cards[0].getAttribute('href').endsWith('/'+other));assert(!cards[0].getAttribute('href').endsWith('/'+id));
   if(route.startsWith('tier-list/')){assert.equal(cards[0].querySelector('strong').textContent,lang==='ko'?'원신 캐릭터 티어표 만들기 - admin':'Genshin Impact Character Tier List - admin');assert.equal(d.querySelector('.result-recommendations h2').textContent,lang==='ko'?'같은 주제의 다른 티어표':'More tier lists on this topic');const comments=d.querySelector('.tier-result-comments');assert(comments);assert(d.querySelector('.result-recommendations').compareDocumentPosition(comments)&4);assert(!d.querySelector('.related-content-links'));}
   await wait(()=>d.querySelectorAll('.result-source-worldcups .td-source-images img:not(.td-versus-badge)').length===2);const source=d.querySelector('.result-source-worldcups');assert.equal(source.querySelectorAll('h2').length,1);assert.equal(source.querySelectorAll('.td-versus-badge').length,1);assert.equal(source.querySelector('.td-versus-badge').getAttribute('src'),'/ui/vs-badge-v78.webp');assert.equal(source.querySelector('.td-card').getAttribute('href'),'/'+lang+'/select-round/'+id);assert.equal(source.querySelectorAll('.td-card-caption strong').length,1);assert(!source.querySelector('.td-card-caption').textContent.includes(lang==='ko'?'이 후보로':'Play a bracket'));assert.deepEqual([...source.querySelectorAll('img:not(.td-versus-badge)')].map(e=>e.src),['https://example.com/winner-a.jpg','https://example.com/winner-b.jpg']);
   if(route.startsWith('mytop9/'))assert.equal(cards[0].querySelectorAll('.result-recommendation-nine img').length,9);
  }
  assert.equal(errors.length,0,errors.join('\n'));console.log('PASS built '+lang+'/'+route+' activity, recommendation or requested layout.');
 }finally{dom.window.close();}
}
(async()=>{for(const lang of ['ko','en'])for(const route of ['tier-list','mytop9/'+id,'tier-list/'+id])await run(lang,route)})().catch(e=>{console.error(e);process.exitCode=1});
