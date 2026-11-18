const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),{JSDOM,ResourceLoader,VirtualConsole}=require('jsdom'),fixture=require('./platform-home-fixtures.cjs'),home=require('../src/seo/platformHome');
const build=path.resolve(process.argv[2]||'../platform-home-build');
class Local extends ResourceLoader{fetch(url){const p=new URL(url).pathname;if(!p.startsWith('/static/'))return null;const promise=Promise.resolve(fs.readFileSync(path.join(build,p)));promise.abort=()=>{};return promise;}}
async function run(lang,legacy=false){const errors=[],calls=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(e.type!=='not implemented')errors.push(e.message)});const data=await home.load(fixture.client(),lang);if(lang==='ko'&&!legacy){const first=data.groups[0].rows[0];data.groups[0].rows=Array.from({length:8},(_,i)=>Object.assign({},first,{href:first.href+'?card='+i}));}let html=fs.readFileSync(path.join(build,'index.html'),'utf8');if(!legacy)html=html.replace('</body>',()=>'<script type="application/json" id="platform-home-data">'+JSON.stringify(data)+'</script></body>');let commits=0;
 const dom=new JSDOM(html,{url:'https://www.onepickgame.com/'+(lang==='en'?'':lang)+(legacy?'?search=football&focus=search':''),runScripts:'dangerously',resources:new Local(),pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){
 w.__REACT_DEVTOOLS_GLOBAL_HOOK__={supportsFiber:true,inject:()=>1,onCommitFiberRoot:()=>{commits++},onCommitFiberUnmount:()=>{}};
 Object.defineProperty(w,'crypto',{value:require('crypto').webcrypto});w.innerWidth=1900;w.fetch=async(input,init)=>{const u=new URL(String(input),'https://www.onepickgame.com');calls.push({path:u.pathname,query:u.searchParams,body:init?.body});let value=[];
  if(u.pathname==='/api/platform-home')value=await home.load(fixture.client(),u.searchParams.get('lang'));
  else if(u.pathname.endsWith('/rpc/get_worldcup_home_rows')){const body=JSON.parse(init.body),rows={};for(const r of body.p_requests)rows[r.key]={offset:r.offset,total:r.key==='featured'?1:0,items:r.key==='featured'&&r.offset===0?[fixture.cup]:[]};value={rows,totals:{featured:1},activity:{created:[],played:[]}};}
  else if(u.pathname.endsWith('/rpc/get_worldcup_play_counts'))value=[{cup_id:fixture.id,play_count:99}];
  else if(u.pathname.endsWith('/worldcup_card_previews'))value=fixture.tables.worldcup_card_previews;
  else if(u.pathname.endsWith('/worldcups'))value=u.searchParams.has('id')&&u.searchParams.get('id').startsWith('eq.')?fixture.cup:[fixture.cup];
  else if(u.pathname.endsWith('/api/worldcup-seo-image'))value={image:'https://example.com/a.jpg'};
  else if(u.pathname.endsWith('/winner_stats')||u.pathname.endsWith('/rpc/get_winner_stats'))value=[];
  return new Response(JSON.stringify(value),{headers:{'content-type':'application/json'}});
 };w.matchMedia=()=>({matches:false,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.structuredClone=structuredClone;w.TextEncoder=TextEncoder;w.TextDecoder=TextDecoder;w.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}};w.IntersectionObserver=class{constructor(cb){this.cb=cb}observe(target){queueMicrotask(()=>this.cb([{isIntersecting:true,target}]))}unobserve(){}disconnect(){}};
 }});
 const wait=async fn=>{for(let i=0;i<350;i++){if(fn())return;await new Promise(r=>setTimeout(r,30));}throw Error('timeout '+lang+' '+legacy+' '+errors.join(' / ')+' '+dom.window.document.body.textContent.slice(-350));};
 try{const d=dom.window.document,w=dom.window;
  let modeTargets;
  if(!legacy){await wait(()=>d.querySelectorAll('.platform-section').length===5);assert.equal(d.querySelector('.platform-hero h1'),null);assert.equal(d.querySelector('h1').textContent.trim(),'One Pick Game');assert.equal(calls.filter(c=>c.path==='/api/platform-home').length,0,'reuse SSR data');const sections=[...d.querySelectorAll('.platform-section')];for(const s of sections)assert.equal(s.querySelector('h2 a').href,s.querySelector('.platform-section-heading>a').href);assert.equal(d.querySelector('.platform-section-worldcup .platform-card-link').getAttribute('href'),`/${lang}/select-round/${fixture.id}`+(lang==='ko'?'?card=0':''));assert.equal(d.querySelector('.platform-section-tier .platform-card').getAttribute('href'),`/${lang}/tier-list/${fixture.other}`);assert.equal(d.querySelector('.platform-section-nine .platform-card').getAttribute('href'),`/${lang}/mytop9/${fixture.other}`);
   assert(d.querySelector('.onepick-header--platform'));assert.equal(d.querySelector('.onepick-header-modes'),null);assert(d.querySelector('.header-language-control select'));assert.equal(d.querySelector('.platform-language select').value,lang);assert.equal(d.querySelectorAll('.platform-language option').length,20);assert(d.querySelector('.onepick-login-link'));
   assert.deepEqual(sections.map(s=>s.className.split(' ').find(c=>c.startsWith('platform-section-'))),['platform-section-worldcup','platform-section-quiz','platform-section-tier','platform-section-nine','platform-section-random']);
   assert.equal(d.querySelectorAll('.platform-section-tier .tier-card-preview-label').length,4);
   assert.equal(d.querySelector('.platform-section-tier .platform-card>strong').textContent,lang==='ko'?fixture.cup.tier_preset_title_translations.ko:'Football Tier List');
   modeTargets=[...d.querySelectorAll('.platform-modes>a')].map(node=>node.getAttribute('href'));
   if(lang==='ko'){const track=d.querySelector('.platform-section-worldcup .platform-cards'),moves=[];Object.defineProperty(track,'clientWidth',{value:1000});track.scrollBy=options=>moves.push(options.left);const arrows=d.querySelectorAll('.platform-section-worldcup .platform-rail-arrow');assert(!arrows[1].disabled);arrows[1].click();arrows[0].click();assert.deepEqual(moves,[1000,-1000]);assert.equal(w.location.pathname,'/ko');assert.equal(track.querySelectorAll('.platform-card').length,8);}
   d.querySelector('.platform-section-worldcup h2 a').dispatchEvent(new w.MouseEvent('click',{bubbles:true,cancelable:true,button:0}));
  }
  await wait(()=>d.querySelector('.home-page')&&d.querySelector('.worldcup-card'));assert.equal(w.location.pathname,`/${lang}/ideal-type-world-cup`);assert(calls.some(c=>c.path.endsWith('/rpc/get_worldcup_home_rows')));assert.equal(d.querySelector('.onepick-header-mode.mode-worldcup').classList.contains('is-active'),true);
  assert.equal(d.querySelector('.onepick-header--platform'),null);if(modeTargets)assert.deepEqual([...d.querySelectorAll('.onepick-header-mode-main')].map(node=>node.getAttribute('href')),modeTargets);
  if(legacy){assert(w.location.search.includes('search=football'));assert.equal(d.querySelector('.home-search-input').value,'football');}
  for(const width of [450,1900]){w.innerWidth=width;w.dispatchEvent(new w.Event('resize'));await new Promise(r=>setTimeout(r,300));assert(d.querySelector('.worldcup-card'));}
  const before=commits;await new Promise(r=>setTimeout(r,400));assert(commits-before<5,'listing settles after resize');
  if(!legacy){await wait(()=>d.querySelector('link[rel=canonical]')?.href.endsWith('/ideal-type-world-cup'));assert.equal(d.querySelector('link[rel=canonical]').href,`https://www.onepickgame.com/${lang}/ideal-type-world-cup`);
   const selector=d.querySelector('.header-language-control select');selector.value=lang==='en'?'ko':'en';selector.dispatchEvent(new w.Event('change',{bubbles:true}));await wait(()=>w.location.pathname===`/${lang==='en'?'ko':'en'}/ideal-type-world-cup`);assert(d.querySelector('.home-page'));
  }
  assert.equal(errors.length,0,errors.join('\n'));console.log('PASS built '+lang+(legacy?' legacy search':' hub → listing → language switch')+': five sections, preserved detail links, working paged listing/search, canonical, resize and no render loop.');
 }finally{dom.window.close();}
}
(async()=>{for(const lang of ['ko','en','ja','ar'])await run(lang);await run('ko',true)})().catch(e=>{console.error(e);process.exitCode=1});
