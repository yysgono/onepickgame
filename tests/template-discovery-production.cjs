const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),{JSDOM,ResourceLoader,VirtualConsole}=require('jsdom');
const {renderTemplateHtml}=require('../top-nine-template-routes.cjs');
const build=path.resolve(process.argv[2]||'../template-discovery-build'),id='b1168231-f7da-4be1-afb9-17db9dfb2fa1',other='00000000-0000-4000-8000-000000000002';
const cup={id,title:'Source bracket',category:'game',is_tier_preset:true,tier_preset_title_translations:{en:'My tier preset',ko:'내 티어표 프리셋'},top_nine_title_translations:{en:'My grid template',ko:'내 구절판 템플릿'},data:Array.from({length:20},(_,i)=>({id:i,name:'Candidate '+i,image:'https://example.com/'+i+'.jpg'}))};
class Local extends ResourceLoader{fetch(url){const p=new URL(url).pathname;if(p.startsWith('/static/'))return Promise.resolve(fs.readFileSync(path.join(build,p)));return null;}}
async function run(kind,lang){
 const groups={source:{href:`/${lang}/select-round/${id}`,label:'Source bracket',rankingStatus:'stored',images:['https://example.com/a.jpg','https://example.com/b.jpg']},works:[{href:`/${lang}/${kind==='nine'?'mytop9':'tier-list'}/${other}`,label:'Same template work',image:'https://example.com/work.jpg',slots:kind==='nine'?Array.from({length:9},()=>({src:'https://example.com/slot.jpg'})):undefined}],templates:[{href:`/${lang}/${kind==='nine'?'mytop9/templates':'tier-list/create'}/${other}`,label:'Related template',image:'https://example.com/template.jpg'}]};
 const html=renderTemplateHtml(fs.readFileSync(path.join(build,'index.html'),'utf8'),'https://www.onepickgame.com',lang,cup,kind,groups);
 const first=new JSDOM(html);assert.equal(first.window.document.querySelectorAll('.template-discovery a').length,3);first.window.close();
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(e.type!=='not implemented')errors.push(e.message)});let optionalReads=0;
 const dom=new JSDOM(html,{url:`https://www.onepickgame.com/${lang}/${kind==='nine'?'mytop9/templates':'tier-list/create'}/${id}`,runScripts:'dangerously',resources:new Local(),pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){
  Object.defineProperty(w,'crypto',{value:require('node:crypto').webcrypto,configurable:true});w.fetch=async input=>{const u=new URL(String(input),'https://www.onepickgame.com');let data=[];
   if(u.pathname.endsWith('/worldcups')&&u.searchParams.get('id')==='eq.'+id){assert.equal(kind,'tier','Nine template must reuse server candidates');data=cup;}
   else if(u.pathname.endsWith('/rpc/get_tier_source_catalogue'))data=[cup];
   else if(u.pathname.endsWith('/worldcup_card_previews'))data=[{cup_id:id,image_urls:['https://example.com/4.jpg','https://example.com/3.jpg'],candidate_ids:['4','3']}];
   else if(u.pathname.endsWith('/winner_stats'))assert.fail('Preset source must not request winner_stats');
   else if(u.pathname.endsWith('/worldcups')&&u.searchParams.get('select')==='id,title,title_translations,tier_preset_title_translations,category')optionalReads++;
   else if(u.pathname.endsWith('/top_nine_templates')&&u.searchParams.get('source_worldcup_id'))data={enabled:true,title_translations:cup.top_nine_title_translations};
   else if(u.pathname.endsWith('/top_nine_template_categories'))data={category:'game'};
   else if((u.pathname.endsWith('/tier_lists')||u.pathname.endsWith('/top_nine_public_boards'))&&['id,title,title_translations,view_count','id,title,view_count'].includes(u.searchParams.get('select')))optionalReads++;
   return new Response(JSON.stringify(data),{headers:{'content-type':'application/json'}});
  };
  w.matchMedia=()=>({matches:false,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});w.scrollTo=()=>{};w.structuredClone=structuredClone;w.TextEncoder=TextEncoder;w.TextDecoder=TextDecoder;w.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}};w.IntersectionObserver=class{constructor(cb){this.cb=cb}observe(target){queueMicrotask(()=>this.cb([{isIntersecting:true,target}]))}unobserve(){}disconnect(){}};
 }});
 try{
  const d=dom.window.document;for(let i=0;i<300;i++){if((kind==='nine'?d.querySelector('.tn-candidates'):d.querySelector('.tier-editor-board'))&&d.querySelectorAll('.template-discovery a').length===3)break;await new Promise(r=>setTimeout(r,35));}
  assert(kind==='nine'?d.querySelector('.tn-candidates'):d.querySelector('.tier-editor-board'),d.body.textContent.slice(-700)+' '+errors.join('\n'));
  await new Promise(resolve=>setTimeout(resolve,120));
  assert.equal(d.querySelectorAll('.template-discovery a').length,3);assert.equal(d.querySelectorAll('.td-card').length,3);assert.equal(d.querySelectorAll('.td-source-images img').length,2);assert.deepEqual([...d.querySelectorAll('.td-source-images img')].map(img=>img.src),['https://example.com/4.jpg','https://example.com/3.jpg']);if(kind==='nine')assert.equal(d.querySelectorAll('.td-collage img').length,9);assert.equal(d.querySelector('.template-discovery a').getAttribute('href'),groups.source.href);assert.equal(d.querySelectorAll('.template-discovery h2').length,3);assert.equal(optionalReads,0,'React must reuse server link metadata');assert.equal(d.querySelectorAll('meta[name=robots][content*=noindex]').length,0);assert.equal(errors.length,0,errors.join('\n'));
  console.log('PASS built '+kind+'/'+lang+': source, same-template works and related-template links persist after React; server metadata reused; indexable and editor works.');
 }finally{dom.window.close();}
}
(async()=>{for(const kind of ['nine','tier'])for(const lang of ['ko','en'])await run(kind,lang)})().catch(error=>{console.error(error);process.exitCode=1});
