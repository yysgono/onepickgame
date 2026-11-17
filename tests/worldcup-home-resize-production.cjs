const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),{JSDOM,ResourceLoader,VirtualConsole}=require('jsdom');
const build=path.resolve(process.argv[2]||'../worldcup-home-resize-build'),id='a1111111-1111-4111-8111-111111111111';
const cup={id,title:'Stored card test',is_featured:true,featured_order:0,category:'game',play_count:20,data:[1,2,3,4].map(n=>({id:n,name:'Candidate '+n,image:'https://example.com/'+n+'.jpg'}))};
class Local extends ResourceLoader{fetch(url){const p=new URL(url).pathname;if(p.startsWith('/static/'))return Promise.resolve(fs.readFileSync(path.join(build,p)));return null;}}
(async()=>{let previews=0;const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(e.type!=='not implemented')errors.push(e.message)});
 const homeRequests=[];const dom=new JSDOM(fs.readFileSync(path.join(build,'index.html'),'utf8'),{url:'https://www.onepickgame.com/en',runScripts:'dangerously',resources:new Local(),pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){
  Object.defineProperty(w,'crypto',{value:require('node:crypto').webcrypto,configurable:true});w.innerWidth=1900;w.fetch=async(input,init)=>{const u=new URL(String(input),'https://www.onepickgame.com');let data=[];
   if(u.pathname.endsWith('/rpc/get_worldcup_home_rows')){const body=JSON.parse(init.body),rows={};homeRequests.push(body);for(const r of body.p_requests)rows[r.key]={offset:r.offset,total:r.key==='featured'?1:0,items:r.key==='featured'&&r.offset===0?[cup]:[]};data={rows,totals:{featured:1},activity:{created:[],played:[]}};}
   else if(u.pathname.endsWith('/worldcup_card_previews')){previews++;data=[{cup_id:id,candidate_ids:['4','3'],image_urls:['https://example.com/4.jpg','https://example.com/3.jpg']}];}
   else if(u.pathname.endsWith('/winner_stats'))data=[{candidate_id:1,win_count:90,match_wins:99},{candidate_id:2,win_count:80,match_wins:88}];
   return new Response(JSON.stringify(data),{headers:{'content-type':'application/json'}});
  };w.matchMedia=()=>({matches:false,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});w.scrollTo=()=>{};w.structuredClone=structuredClone;w.TextEncoder=TextEncoder;w.TextDecoder=TextDecoder;w.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}};w.IntersectionObserver=class{observe(){}unobserve(){}disconnect(){}};
 }});
 try{const d=dom.window.document;let urls=[];for(let i=0;i<350;i++){urls=[...d.querySelectorAll('.worldcup-card img')].map(img=>img.src).filter(src=>src.startsWith('https://example.com/'));if(urls[0]?.endsWith('/4.jpg')&&urls[1]?.endsWith('/3.jpg'))break;await new Promise(r=>setTimeout(r,35));}assert.deepEqual(urls.slice(0,2),['https://example.com/4.jpg','https://example.com/3.jpg']);assert.equal(previews,1);const card=d.querySelector('.worldcup-card');
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 const initialRequests=homeRequests.length;
 for(const widths of [[1800,1500,1100],[900,700,500],[1100,1500,1900]]) {
  for(const width of widths){dom.window.innerWidth=width;dom.window.dispatchEvent(new dom.window.Event('resize'));}
  await wait(400);
  assert.equal(d.querySelector('.worldcup-card'),card,'resize preserves the loaded first card');
  assert.equal(d.querySelectorAll('.home-top-layout').length,1);
  const mobile=widths.at(-1)<600;
  assert.equal(d.querySelector('.home-top-layout').classList.contains('has-activity-panels'),!mobile);
  assert.equal(card.style.maxWidth,mobile?'360px':'504px');
 }
 assert.equal(previews,1,'resize reuses stored thumbnail metadata');
 assert.equal(homeRequests.filter(b=>b.p_include_activity).length,1,'resize does not restart the initial home/activity query');
 assert(homeRequests.length<=initialRequests+1,'resize avoids duplicate home fetches for already loaded rows');
 assert.equal(errors.length,0,errors.join('\n'));
 // Inspect actual emitted CSS too: jsdom does not perform grid layout or evaluate media rules.
 const css=fs.readdirSync(path.join(build,'static/css')).map(f=>fs.readFileSync(path.join(build,'static/css',f),'utf8')).join('');
 assert(css.includes('contain:inline-size'));
 assert(css.includes('max-width:1439px'));
 assert(css.includes('max-width:799px'));
 assert(!css.includes('minmax(280px,1fr) minmax(660px,860px)'));
 console.log('PASS built home: rapid desktop/mobile resize preserves cards and stored previews, changes responsive mode, does not restart home queries, and includes the shrinkable responsive grid CSS.');}finally{dom.window.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
