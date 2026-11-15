const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),{JSDOM,ResourceLoader,VirtualConsole}=require('jsdom');
const build=path.resolve(process.argv[2]||'../worldcup-round-progress-build'),lang=process.argv[3]||'en';
const candidateCount=Number(process.argv[4])||16,selectedRound=candidateCount<8?candidateCount:8,total=selectedRound-1;
const id='a1111111-1111-4111-8111-111111111111',cup={id,title:'Test tournament',title_translations:{ko:'테스트 월드컵',en:'Test tournament'},data:Array.from({length:candidateCount},(_,i)=>({id:i+1,name:'Candidate '+i,image:'https://example.com/'+i+'.jpg'}))};
const errors=[],vc=new VirtualConsole();vc.on('error',(...args)=>errors.push(args.map(String).join(' ')));vc.on('jsdomError',error=>{if(error.type!=='not implemented')errors.push(error.message)});
class LocalBuild extends ResourceLoader{fetch(url){const name=new URL(url).pathname;if(name.startsWith('/static/')){const file=path.join(build,name);if(fs.existsSync(file))return Promise.resolve(fs.readFileSync(file));}return null;}}
(async()=>{
 const deletes=[];
 const dom=new JSDOM(fs.readFileSync(path.join(build,'index.html'),'utf8'),{url:`https://www.onepickgame.com/${lang}/select-round/${id}`,runScripts:'dangerously',resources:new LocalBuild(),pretendToBeVisual:true,virtualConsole:vc,beforeParse(window){
  Object.defineProperty(window,'crypto',{value:require('node:crypto').webcrypto,configurable:true});
  window.fetch=async(input,init)=>{const url=new URL(String(input),'https://www.onepickgame.com');if(init?.method==='DELETE')deletes.push(url.pathname);let data=[];
   if(url.pathname.endsWith('/worldcups')&&url.searchParams.get('id')==='eq.'+id)data=cup;
   return new Response(JSON.stringify(data),{status:200,headers:{'content-type':'application/json'}});
  };
  window.matchMedia=()=>({matches:false,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});window.scrollTo=()=>{};window.structuredClone=structuredClone;window.TextEncoder=TextEncoder;window.TextDecoder=TextDecoder;
  window.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}};window.IntersectionObserver=class{observe(){}unobserve(){}disconnect(){}};
  window.sessionStorage.setItem('match-state:'+id+':'+selectedRound,JSON.stringify({old:true,cupId:id,selectedCount:selectedRound,bracket:[[cup.data[0],cup.data[1]],[cup.data[2],cup.data[3]]],idx:1,roundNum:1,pendingWinners:[],matchHistory:[{c1:cup.data[0],c2:cup.data[1],winner:cup.data[0]}],historyStack:[]}));window.sessionStorage.setItem('match-language-switch:'+id+':'+selectedRound,String(Date.now()));
 }});
 const document=dom.window.document,wait=async predicate=>{for(let i=0;i<250;i++){if(predicate())return;await new Promise(resolve=>setTimeout(resolve,40));}throw Error('Timed out '+dom.window.location.pathname+' '+document.body.textContent.slice(-2400)+' '+errors.join('\n').slice(0,1000));};
 try{
  await wait(()=>document.querySelector('[role=radiogroup]'));
  assert.equal(document.querySelectorAll('.worldcup-round-selection select').length,0);
  assert.equal(document.querySelectorAll('.worldcup-round-selection').length,1);
  assert.equal(document.querySelector('.onepick-game-brand-label'),null);
  const picker=document.querySelector('.worldcup-round-selection'),thumbnail=document.querySelector('.worldcup-selection-thumbnail');assert.equal(thumbnail.previousElementSibling.tagName,'H1');assert.equal(picker.previousElementSibling,thumbnail);assert.equal(document.querySelectorAll('.opg-social-share').length,0);
  assert(document.querySelector('h1').compareDocumentPosition(document.querySelector('.worldcup-round-selection'))&dom.window.Node.DOCUMENT_POSITION_FOLLOWING,'Round picker follows the title and introduction');
  const heading=require('../src/seo/detailCopy.json')[lang][0];assert.equal(document.querySelector('nav[aria-label="'+heading+'"]'),null);
  if(candidateCount<8)assert.equal(document.querySelectorAll('[role=radio]').length,1);
  document.querySelector('[role=radiogroup]').querySelectorAll('button')[0].click();
  await wait(()=>document.querySelector('[role=radiogroup]').querySelectorAll('button')[0].getAttribute('aria-checked')==='true');
  document.querySelector('.worldcup-round-start').click();
  await wait(()=>document.querySelector('[role=progressbar]'));
  assert.equal(document.querySelector('[role=progressbar]').getAttribute('aria-valuenow'),'0');assert.equal(document.querySelector('[role=progressbar]').getAttribute('aria-valuemax'),String(total));
  assert.equal(dom.window.sessionStorage.getItem('match-language-switch:'+id+':'+selectedRound),null);assert(!dom.window.sessionStorage.getItem('match-state:'+id+':'+selectedRound)?.includes('"old"'));
  await wait(()=>document.querySelector('img[alt^="Candidate"]'));
  document.querySelector('img[alt^="Candidate"]').dispatchEvent(new dom.window.MouseEvent('click',{bubbles:true}));
  await wait(()=>document.querySelector('[role=progressbar]')?.getAttribute('aria-valuenow')==='1');
  assert.equal(document.querySelector('[role=progressbar]').getAttribute('aria-valuemax'),String(total));assert(deletes.some(value=>value.endsWith('/winner_logs')),'Existing fresh-game record cleanup must still run');
  if(candidateCount>=8){
  const backLabel=require('../src/locales/'+lang+'/translation.json').match_back;
  const back=[...document.querySelectorAll('button')].find(button=>button.getAttribute('aria-label')===backLabel);assert(back&&!back.disabled);back.click();await wait(()=>document.querySelector('[role=progressbar]')?.getAttribute('aria-valuenow')==='0');assert.equal(document.querySelector('[role=progressbar]').getAttribute('aria-valuemax'),String(total));
  }
  process.stdout.write('PASS: built '+lang+' game selects a round, clears stale resume marker, starts at 0/'+total+', advances to 1/'+total+' and keeps existing fresh-game cleanup.\n');
 }finally{dom.window.close();}
})().catch(error=>{process.stderr.write(String(error.stack)+'\n');process.exitCode=1});
