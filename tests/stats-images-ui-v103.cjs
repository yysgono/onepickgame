const fs=require('fs'),assert=require('node:assert/strict'),babel=require('@babel/core'),{JSDOM}=require('jsdom');
const dom=new JSDOM('<div id="root"></div>',{url:'https://www.onepickgame.com/ko/match/test'});
global.window=dom.window;global.document=window.document;global.navigator=window.navigator;global.IS_REACT_ACT_ENVIRONMENT=true;
const observers=[];global.IntersectionObserver=class{constructor(callback){this.callback=callback;observers.push(this);}observe(){}disconnect(){}};
const React=require('react'),{act}=React,{createRoot}=require('react-dom/client'),{Simulate}=require('react-dom/test-utils');
function load(path,mocks){const m={exports:{}};const code=babel.transformSync(fs.readFileSync(path,'utf8'),{presets:[['@babel/preset-env',{targets:{node:'current'}}],'@babel/preset-react'],configFile:false,babelrc:false}).code;new Function('require','module','exports',code)(name=>{if(!(name in mocks))throw Error(name);return mocks[name];},m,m.exports);return m.exports;}
const recent=load('src/utils/recentLoadedImages.js',{}),source=load('src/utils/statsImageSource.js',{'./recentLoadedImages':recent});
const Renderer=load('src/components/MediaRenderer.jsx',{react:React,'react-i18next':{useTranslation:()=>({t:key=>key})},'../utils/recentLoadedImages':recent}).default;
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
 assert.ok(document.querySelector('img').getAttribute('src').includes('/render/image/public/'));
 await act(async()=>Simulate.error(document.querySelector('img')));assert.equal(document.querySelector('img').getAttribute('src'),unseen);
 await act(async()=>Simulate.error(document.querySelector('img')));assert.equal(document.querySelector('img'),null);assert.ok(document.body.textContent.includes(name));
 await act(async()=>root.render(React.createElement(Name,{key:'video',image:'https://example.test/video.mp4',name:'🍎 Apple',isMobile:true})));
 await act(async()=>observers.at(-1).callback([{isIntersecting:true}]));assert.equal(document.querySelector('img'),null);assert.ok(document.body.textContent.includes('🍎'));assert.ok(document.querySelector('[aria-hidden=true]').style.width==='40px');
 await act(async()=>root.unmount());dom.window.close();
 console.log('PASS: game onLoad records URL, no image before visibility, original reuse, unseen thumbnail, original fallback without loops, full name retained, mobile/video placeholder');
})().catch(e=>{console.error(e);process.exitCode=1});
