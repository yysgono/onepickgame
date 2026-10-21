const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');const dom=new JSDOM('<html><head></head><body><div id="root"></div></body></html>',{url:'https://www.onepickgame.com/ko/random-pick/wheel',pretendToBeVisual:true});
Object.assign(global,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,Image:dom.window.Image});
global.IS_REACT_ACT_ENVIRONMENT=true;window.confirm=()=>true;window.matchMedia=()=>({matches:true});
const observers=[];global.ResizeObserver=class{constructor(fn){this.fn=fn;observers.push(this);}observe(){}disconnect(){this.disconnected=true;}};let clock=0;Object.defineProperty(global,'performance',{value:{now:()=>clock},configurable:true});global.requestAnimationFrame=fn=>setTimeout(()=>{clock+=50;fn(clock);},1);global.cancelAnimationFrame=clearTimeout;
const ctx=new Proxy({measureText:t=>({width:String(t).length*8})},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});dom.window.HTMLCanvasElement.prototype.getContext=()=>ctx;
const React=require('react'),{createRoot}=require('react-dom/client'),{act,Simulate}=require('react-dom/test-utils'),{MemoryRouter,Routes,Route}=require('react-router-dom'),{HelmetProvider}=require('react-helmet-async');
const babel=require('@babel/core');const cache={};let searches=0,imports=0,saves=0,allowAdmin=false;
const api={loadTemplates:async()=>[],checkOperator:async()=>allowAdmin,searchCups:async()=>{searches++;return [{id:'cup1',title:'Test Worldcup',title_translations:{ko:'가져오기 테스트'}}];},importCup:async()=>{imports++;return{rows:[{id:'a',name:'Alpha',enabled:true,image:''},{id:'b',name:'Beta',enabled:true,image:''},{id:'c',name:'Gamma',enabled:true,image:''}]};},saveTemplate:async()=>{saves++;return 'saved-id';},deleteTemplate:async()=>{},loadTemplate:async()=>({id:'preset',title:'Preset',mode:'wheel',candidates:[{name:'Preset A'},{name:'Preset B'}],settings:{groups:3,outcomes:'A\nB'}})};
function load(filename){filename=path.resolve(filename);if(cache[filename])return cache[filename].exports;const mod={exports:{}};cache[filename]=mod;const code=babel.transformSync(fs.readFileSync(filename,'utf8'),{filename,presets:[['@babel/preset-env',{targets:{node:'current'}}],['@babel/preset-react',{runtime:'classic'}]],babelrc:false,configFile:false}).code;function req(name){if(name==='./api')return api;if(name==='react-i18next')return{useTranslation:()=>({t:k=>k})};if(name.endsWith('.css'))return {};if(name.includes('NotFoundPage'))return()=>React.createElement('p',null,'404');if(name.startsWith('.')){let target=path.resolve(path.dirname(filename),name);if(target.endsWith('.json'))return require(target);if(!path.extname(target))target+='.js';return load(target);}return require(name);}new Function('require','module','exports',code)(req,mod,mod.exports);return mod.exports;}
const Page=load('src/components/randomPick/RandomPickPage.js').default;
let root;const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function mount(mode,user){root=createRoot(document.getElementById('root'));await act(async()=>{root.render(React.createElement(HelmetProvider,null,React.createElement(MemoryRouter,{initialEntries:[`/ko/random-pick/${mode}`]},React.createElement(Routes,null,React.createElement(Route,{path:'/:lang/random-pick/:mode',element:React.createElement(Page,{user})})))));await wait(5);});}
async function click(el){assert(el,'Missing button');await act(async()=>{Simulate.click(el);await wait(5);});}
function button(text){return [...document.querySelectorAll('button')].find(x=>x.textContent===text);}
async function add(name){const input=document.querySelector('.rp-add input');await act(async()=>{Simulate.change(input,{target:{value:name}});});await act(async()=>{Simulate.submit(document.querySelector('.rp-add'));await wait(1);});}
async function settle(){await act(async()=>{await wait(650);});}
(async()=>{
for(const mode of ['ladder','cards','order']){
 await mount(mode);assert(document.querySelector('.rp-initial-setup'));await act(async()=>{Simulate.change(document.querySelector('.rp-initial-setup input'),{target:{value:'3'}});});await act(async()=>{Simulate.submit(document.querySelector('.rp-initial-setup form'));await wait(5);});
 assert.equal(document.querySelectorAll('.rp-candidate').length,3);assert(!document.querySelector('.rp-initial-setup'));
 await add('Extra');assert.equal(document.querySelectorAll('.rp-candidate').length,4);
 if(mode==='ladder')assert.equal(document.querySelectorAll('.rp-ladder-labels button').length,4);
 if(mode==='cards'){assert.equal(document.querySelectorAll('.rp-carousel-track article strong').length,0);assert(document.querySelector('.rp-picture-text'));}
 if(mode==='order'){await click(button('시작하기'));await act(async()=>{await wait(60);});assert(document.querySelector('.rp-runner').style.left);assert(!document.querySelector('.rp-runner').style.transform);await click(button('결과 바로 보기'));await settle();assert.equal(document.querySelectorAll('.rp-result li').length,4);}
 await act(async()=>root.unmount());
}
await mount('teams');for(const x of ['A','B','C','D'])await add(x);
const pick=document.querySelectorAll('.rp-rule-inputs select');await act(async()=>{Simulate.change(pick[0],{target:{value:'manual:1'}});Simulate.change(pick[1],{target:{value:'manual:2'}});});await click(document.querySelector('.rp-rule-inputs button'));await click(button('팀 나누기'));let teams=[...document.querySelectorAll('.rp-team')].map(el=>el.textContent);assert(teams.some(x=>x.includes('A')&&x.includes('B')));await click(button('다시 설정'));
await act(async()=>{Simulate.change(document.querySelectorAll('.rp-rule-inputs select')[0],{target:{value:'manual:1'}});Simulate.change(document.querySelectorAll('.rp-rule-inputs select')[1],{target:{value:'manual:2'}});Simulate.change(document.querySelectorAll('.rp-rule-inputs select')[2],{target:{value:'apart'}});});await click(document.querySelector('.rp-rule-inputs button'));await click(button('팀 나누기'));assert(!document.querySelector('.rp-result'));assert(document.querySelector('.rp-message').textContent.includes('동시에 만족'));
await act(async()=>root.unmount());
await mount('lotto');await add('A');await add('B');await click(button('시작하기'));await click(button('결과 바로 보기'));await settle();const canvas=document.querySelector('.rp-lottery canvas');const observer=observers.findLast(x=>!x.disconnected);Object.defineProperty(canvas,'clientWidth',{value:450,configurable:true});Object.defineProperty(canvas,'clientHeight',{value:600,configurable:true});await act(async()=>{observer.fn();await wait(20);});assert.equal(canvas.width,450);assert.equal(canvas.height,600);await act(async()=>root.unmount());
// v14: restored image-backed rows must not request images in text-only games.
const remember=load('src/components/randomPick/previousCandidates.js').rememberCandidates;
for(const mode of ['teams','order','ladder','boxes']){
 remember(Array.from({length:20},(_,i)=>({id:'test'+i,name:'Candidate '+i,image:'https://example.com/'+i+'.jpg',enabled:true})));
 await mount(mode);await click(document.querySelector('.rp-restore'));
 if(mode!=='boxes')assert.equal(document.querySelectorAll('.rp-workspace img').length,0);
 if(mode==='ladder'){assert(button('사다리 다시 섞기'));assert.equal(document.querySelectorAll('.rp-ladder-bottom input').length,20);assert(document.querySelector('.rp-ladder-help'));}
 if(mode==='order'){
  const lanes=document.querySelector('.rp-race-lanes');let delta=0;lanes.scrollBy=opts=>delta=opts.top;
  await click(document.querySelectorAll('.rp-race-scroll-controls button')[1]);assert.equal(delta,500);
 }
 if(mode==='teams'){await click(button('팀 나누기'));const labels=[...document.querySelectorAll('.rp-main-actions button')].map(x=>x.textContent);assert(labels.indexOf('다시 설정')<labels.indexOf('다시 뽑기'));assert.equal(document.querySelectorAll('.rp-team img').length,0);}
 if(mode==='boxes'){assert.equal(document.querySelectorAll('.rp-box-grid button').length,20);await click(document.querySelector('.rp-add-blank'));assert.equal(document.querySelectorAll('.rp-box-grid button').length,21);assert(document.querySelector('.rp-box-count small').textContent.endsWith('1'));}
 await act(async()=>root.unmount());
}
console.log('PASS: v14 text-only images, blank boxes, ladder controls, race scrolling and team button order');
console.log('PASS: initial setup in three modes, automatic ladder growth, nonduplicate manual cards, horizontal race, team UI conflicts and completed lottery resize');
})().catch(e=>{console.error(e);process.exit(1)});
