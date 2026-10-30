const fs=require('fs'),assert=require('node:assert/strict'),babel=require('@babel/core'),{JSDOM}=require('jsdom');
const dom=new JSDOM('<div id="root"></div>',{url:'https://www.onepickgame.com/ko/match/test'});
global.window=dom.window;global.document=window.document;global.navigator=window.navigator;global.IS_REACT_ACT_ENVIRONMENT=true;
const observers=[];global.IntersectionObserver=class{constructor(callback){this.callback=callback;observers.push(this);}observe(){}disconnect(){}};
const React=require('react'),{act}=React,{createRoot}=require('react-dom/client'),{Simulate}=require('react-dom/test-utils');
function load(path,mocks){const m={exports:{}};const code=babel.transformSync(fs.readFileSync(path,'utf8'),{presets:[['@babel/preset-env',{targets:{node:'current'}}],'@babel/preset-react'],configFile:false,babelrc:false}).code;new Function('require','module','exports',code)(name=>{if(!(name in mocks))throw Error(name);return mocks[name];},m,m.exports);return m.exports;}
const recent=load('src/utils/recentLoadedImages.js',{}),originalUrl=load('src/utils/originalStorageImageUrl.js',{}),source=load('src/utils/statsImageSource.js',{'./originalStorageImageUrl':originalUrl});
const Renderer=load('src/components/MediaRenderer.jsx',{react:React,'react-i18next':{useTranslation:()=>({t:key=>key})},'../utils/recentLoadedImages':recent,'../utils/originalStorageImageUrl':originalUrl}).default;
const Name=load('src/components/StatsCandidateName.js',{react:React,'../utils/statsImageSource':source,'../utils/recentLoadedImages':recent}).default;
(async()=>{
 const root=createRoot(document.getElementById('root')),base='https://irfyuvuazhujtlgpkfci.supabase.co/storage/v1/object/public/candidates/';
 const original=base+'seen.jpg';await act(async()=>root.render(React.createElement(Renderer,{url:original,alt:'seen',playable:true})));
 const image=document.querySelector('img');assert.ok(image);Object.defineProperty(image,'naturalWidth',{value:1920});await act(async()=>Simulate.load(image));assert.equal(recent.wasImageRecentlyLoaded(original),true);
 const name='Pirates of the Caribbean The Curse of the Black Pearl';
 await act(async()=>root.render(React.createElement(Name,{key:'seen',image:original,name})));
 assert.equal(document.querySelector('img'),null);await act(async()=>observers.at(-1).callback([{isIntersecting:true}]));
 assert.equal(document.querySelector('img').getAttribute('src'),original);assert.equal(document.querySelector('img').getAttribute('width'),'48');assert.ok(document.body.textContent.includes(name));
 const unseen=base+'unseen.jpg';await act(async()=>root.render(React.createElement(Name,{key:'new',image:unseen,name})));
 assert.equal(document.querySelector('img'),null);await act(async()=>observers.at(-1).callback([{isIntersecting:true}]));
 assert.equal(document.querySelector('img').getAttribute('src'),unseen);
 await act(async()=>Simulate.error(document.querySelector('img')));assert.equal(document.querySelector('img'),null);assert.ok(document.body.textContent.includes(name));
 await act(async()=>root.render(React.createElement(Name,{key:'video',image:'https://example.test/video.mp4',name:'🍎 Apple',isMobile:true})));
 await act(async()=>observers.at(-1).callback([{isIntersecting:true}]));assert.equal(document.querySelector('img'),null);assert.ok(document.body.textContent.includes('🍎'));assert.ok(document.querySelector('[aria-hidden=true]').style.width==='40px');
 // Control only the renderer retry timers: no real network or time delays.
 const nativeSetTimeout=global.setTimeout,nativeClearTimeout=global.clearTimeout;
 const timers=new Map();let timerId=0;
 global.setTimeout=(callback,delay)=>{const id=++timerId;timers.set(id,{callback,delay});return id;};
 global.clearTimeout=id=>timers.delete(id);
 const flushRetry=async()=>{const [id,timer]=timers.entries().next().value;timers.delete(id);await act(async()=>timer.callback());};
 try{
  const publicTransform=base.replace('/object/','/render/image/')+'retry.jpg?width=96&quality=70&v=2';
  await act(async()=>root.render(React.createElement(Renderer,{url:publicTransform,alt:'retry'})));
  assert.equal(document.querySelector('img').getAttribute('src'),base+'retry.jpg?v=2');
  await act(async()=>{Simulate.error(document.querySelector('img'));Simulate.error(document.querySelector('img'));});
  assert.equal(timers.size,1);assert.equal([...timers.values()][0].delay,500);
  const failedImage=document.querySelector('img');await flushRetry();assert.notEqual(document.querySelector('img'),failedImage);
  await act(async()=>Simulate.error(document.querySelector('img')));assert.equal([...timers.values()][0].delay,1000);
  await flushRetry();await act(async()=>Simulate.error(document.querySelector('img')));
  assert.equal(document.querySelector('img'),null);assert.ok(document.querySelector('.media-name-fallback'));assert.equal(timers.size,0);
  const signed=base.replace('/object/public/','/object/sign/')+'private.jpg?token=TEST_ONLY%2B&width=96';
  await act(async()=>root.render(React.createElement(Renderer,{url:signed,alt:'signed'})));
  assert.equal(document.querySelector('img').getAttribute('src'),signed);
  await act(async()=>Simulate.error(document.querySelector('img')));assert.equal(timers.size,1);
  await act(async()=>root.render(React.createElement(Renderer,{url:original,alt:'new'})));
  assert.equal(timers.size,0);assert.equal(document.querySelector('img').getAttribute('src'),original);
  await act(async()=>Simulate.error(document.querySelector('img')));assert.equal(timers.size,1);
  await act(async()=>Simulate.load(document.querySelector('img')));assert.equal(timers.size,0);
  await act(async()=>Simulate.error(document.querySelector('img')));assert.equal(timers.size,1);
  await act(async()=>root.unmount());assert.equal(timers.size,0);
 }finally{global.setTimeout=nativeSetTimeout;global.clearTimeout=nativeClearTimeout;dom.window.close();}
 console.log('PASS: bounded retries, duplicate errors, URL change/load/unmount cancellation, public normalization and signed request query');
 console.log('PASS: game onLoad records URL, no image before visibility, original reuse, unseen original, failure placeholder without loops, full name retained, mobile/video placeholder');
})().catch(e=>{console.error(e);process.exitCode=1});
