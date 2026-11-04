const fs=require('node:fs'),assert=require('node:assert/strict'),babel=require('@babel/core'),parser=require('@babel/parser'),traverse=require('@babel/traverse').default,{JSDOM}=require('jsdom');
const dom=new JSDOM('<div id="root"></div>',{url:'https://www.onepickgame.com/ko/tier-list/create/cup-1'});
Object.assign(global,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,IS_REACT_ACT_ENVIRONMENT:true});
const observers=[];global.IntersectionObserver=window.IntersectionObserver=class{constructor(callback){this.callback=callback;observers.push(this);}observe(){}disconnect(){}};
const React=require('react'),{act}=React,{createRoot}=require('react-dom/client');
function load(path,mocks){const mod={exports:{}};const code=babel.transformSync(fs.readFileSync(path,'utf8'),{presets:[['@babel/preset-env',{targets:{node:'current'}}],'@babel/preset-react'],configFile:false,babelrc:false}).code;new Function('require','module','exports',code)(name=>{assert(name in mocks,name);return mocks[name];},mod,mod.exports);return mod.exports;}
const {worldcupRouteData}=load('src/utils/worldcupRouteData.js',{});
let path='/ko/tier-list/create/cup-1',allCalls=0,oneCalls=0;
const Loader=load('src/components/WorldcupRouteDataLoader.js',{react:React,'react-router-dom':{useLocation:()=>({pathname:path})},'react-i18next':{useTranslation:()=>({t:(_,o)=>o.defaultValue,i18n:{language:'ko'}})},'../utils/worldcupRouteData':{worldcupRouteData},'../utils/newLanguageUi':{localizeExtraUi:x=>x},'../ads/AdGuard':{default:()=>null,__esModule:true}}).default;
const maker=fs.readFileSync('src/components/TierListMaker.js','utf8');let cardSource,effect,sourceEffect;
traverse(parser.parse(maker,{sourceType:'module',plugins:['jsx']}),{VariableDeclarator(p){if(p.node.id.name==='CandidateCard')cardSource=maker.slice(p.node.init.start,p.node.init.end);},CallExpression(p){if(p.node.callee.name==='useEffect'&&p.node.arguments[1]?.elements?.some(e=>e?.name==='selectedCupFromList'))effect=maker.slice(p.node.arguments[0].start,p.node.arguments[0].end);if(p.node.callee.name==='useEffect'&&p.node.arguments[1]?.elements?.some(e=>e?.name==='sourceWorldcupId')&&p.node.arguments[1]?.elements?.some(e=>e?.name==='selectedCup'))sourceEffect=maker.slice(p.node.arguments[0].start,p.node.arguments[0].end);}});
assert(cardSource&&effect);
const recent=load('src/utils/recentLoadedImages.js',{}),urls=load('src/utils/originalStorageImageUrl.js',{}),Mp4=load('src/components/Mp4Media.jsx',{react:React});
const Renderer=load('src/components/MediaRenderer.jsx',{react:React,'react-i18next':{useTranslation:()=>({t:x=>x})},'./Mp4Media':Mp4,'../utils/originalStorageImageUrl':urls,'../utils/recentLoadedImages':recent}).default;
const cardCode=babel.transformSync(`module.exports=${cardSource}`,{presets:[['@babel/preset-react',{runtime:'classic'}]],configFile:false,babelrc:false}).code;
const m={exports:{}};new Function('module','React','memo','MediaRenderer','isMp4File',cardCode)(m,React,React.memo,Renderer,()=>false);const Card=m.exports;
(async()=>{
 const root=createRoot(document.getElementById('root')),props={worldcupList:[],allLoaded:false,loadAll:()=>{allCalls++;return new Promise(()=>{});},loadOne:()=>{oneCalls++;return new Promise(()=>{});}};
 for(const route of ['/ko/tier-list/create/cup-1','/en/tier-list/create','/ja/tier-list/create?clone=x']){path=route.split('?')[0];await act(async()=>root.render(React.createElement(Loader,props,React.createElement('p',{'data-maker':true},'Editor'))));assert(document.querySelector('[data-maker]'));}
 assert.equal(allCalls,0);assert.equal(oneCalls,0);
 // The maker still fetches the selected game's candidates itself.
 let selected=null,resolved=false,loading=false,calls=0;const request=[];
 const supabase={from(table){calls++;assert.equal(table,'worldcups');const q={select(){return q;},is(key,value){request.push([key,value]);return q;},eq(key,value){request.push([key,value]);return q;},maybeSingle:async()=>({data:{id:'cup-1',data:[{id:'a',image:'https://example.test/a.png'}]}})};return q;}};
 function fetchSelected(cached){const fn=new Function('id','selectedCupFromList','supabase','t','setSelectedCupFromDb','setSelectedCupLoading','setSelectedCupResolved','setSelectedCupError',`return (${effect});`)('cup-1',cached,supabase,x=>x,v=>selected=v,v=>loading=v,v=>resolved=v,e=>assert.equal(e,''));return fn();}
 fetchSelected(null);await new Promise(resolve=>setImmediate(resolve));assert.equal(calls,1);assert.equal(selected.data.length,1);assert(resolved&&!loading);assert(request.some(([k,v])=>k==='id'&&v==='cup-1'));assert(request.some(([k,v])=>k==='deleted_at'&&v===null));
 fetchSelected(selected);assert.equal(calls,1);
 assert(sourceEffect);const sourceFn=new Function('id','sourceWorldcupId','selectedCup','supabase','setSourcePresetCupFromDb',`return (${sourceEffect});`)('cup-1','cup-1',null,supabase,()=>{});sourceFn();assert.equal(calls,1,'matching source ID must not duplicate the in-flight selected preset request');
 for(const source of ['worldcup','local']){
  const before=observers.length;await act(async()=>root.render(React.createElement(Card,{key:source,item:{id:'a',name:'Candidate',image:'https://example.test/a.png',_source:source},isMobile:false,text:{},onDragStartItem(){},onDragEndItem(){}})));
  assert.equal(document.querySelector('img'),null,'offscreen media must not request images');assert(observers.length>before);
  await act(async()=>observers.at(-1).callback([{isIntersecting:true,intersectionRatio:1}]));
  const image=document.querySelector('img');assert(image);assert.equal(image.getAttribute('src'),'https://example.test/a.png');assert.equal(image.getAttribute('loading'),'lazy');
 }
 await act(async()=>root.unmount());console.log('Tier builder: no full-catalogue gate, selected-only fetch, existing-data reuse and viewport-deferred candidate images passed');
})().catch(e=>{console.error(e);process.exitCode=1;});
