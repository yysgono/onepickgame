const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),{JSDOM,ResourceLoader,VirtualConsole}=require('jsdom');
const build=path.resolve(process.argv[2]||'../shared-worldcup-cards-build'),id='a1111111-1111-4111-8111-111111111111';
const cup={id,title:'Stored card test',is_featured:true,featured_order:0,category:'game',play_count:20,data:[1,2,3,4].map(n=>({id:n,name:'Candidate '+n,image:'https://example.com/'+n+'.jpg'}))};
class Local extends ResourceLoader{fetch(url){const p=new URL(url).pathname;if(p.startsWith('/static/'))return Promise.resolve(fs.readFileSync(path.join(build,p)));return null;}}
(async()=>{let previews=0;const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(e.type!=='not implemented')errors.push(e.message)});
 const dom=new JSDOM(fs.readFileSync(path.join(build,'index.html'),'utf8'),{url:'https://www.onepickgame.com/en',runScripts:'dangerously',resources:new Local(),pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){
  Object.defineProperty(w,'crypto',{value:require('node:crypto').webcrypto,configurable:true});w.innerWidth=1900;w.fetch=async(input,init)=>{const u=new URL(String(input),'https://www.onepickgame.com');let data=[];
   if(u.pathname.endsWith('/rpc/get_worldcup_home_rows')){const body=JSON.parse(init.body),rows={};for(const r of body.p_requests)rows[r.key]={offset:r.offset,total:r.key==='featured'?1:0,items:r.key==='featured'&&r.offset===0?[cup]:[]};data={rows,totals:{featured:1},activity:{created:[],played:[]}};}
   else if(u.pathname.endsWith('/worldcup_card_previews')){previews++;data=[{cup_id:id,candidate_ids:['4','3'],image_urls:['https://example.com/4.jpg','https://example.com/3.jpg']}];}
   else if(u.pathname.endsWith('/winner_stats'))data=[{candidate_id:1,win_count:90,match_wins:99},{candidate_id:2,win_count:80,match_wins:88}];
   return new Response(JSON.stringify(data),{headers:{'content-type':'application/json'}});
  };w.matchMedia=()=>({matches:false,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});w.scrollTo=()=>{};w.structuredClone=structuredClone;w.TextEncoder=TextEncoder;w.TextDecoder=TextDecoder;w.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}};w.IntersectionObserver=class{observe(){}unobserve(){}disconnect(){}};
 }});
 try{const d=dom.window.document;let urls=[];for(let i=0;i<350;i++){urls=[...d.querySelectorAll('.worldcup-card img')].map(img=>img.src).filter(src=>src.startsWith('https://example.com/'));if(urls[0]?.endsWith('/4.jpg')&&urls[1]?.endsWith('/3.jpg'))break;await new Promise(r=>setTimeout(r,35));}assert.deepEqual(urls.slice(0,2),['https://example.com/4.jpg','https://example.com/3.jpg']);assert.equal(previews,1);assert.equal(errors.length,0,errors.join('\n'));console.log('PASS built homepage uses stored shared card images, independent of raw-stat display fallback, and makes one batched preview request.');}finally{dom.window.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
