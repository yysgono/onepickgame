const assert=require('node:assert/strict'),fs=require('fs'),babel=require('@babel/core'),{JSDOM}=require('jsdom');
const {visitorCountry:handler}=require('../affiliate-country.cjs');
for(const [header,expected] of [['KR','KR'],['US','US'],['JP','JP'],[undefined,null],['korea',null],[['KR','US'],null]]){
 const headers={};let data;handler({headers:{'x-vercel-ip-country':header}},{setHeader:(k,v)=>headers[k]=v,json:value=>data=value});assert.equal(data.country,expected);assert.equal(headers['Cache-Control'],'private, no-store');
}
const routing=JSON.parse(fs.readFileSync('vercel.json'));assert.equal(routing.routes[0].src,'/api/visitor-country/?$');assert.equal(routing.routes[0].dest,'/server.js');
const dom=new JSDOM('<div id="root"></div>',{url:'https://www.onepickgame.com/en/mytop9'});
Object.assign(global,{window:dom.window,document:dom.window.document,IS_REACT_ACT_ENVIRONMENT:true});
const React=require('react'),{act}=React,{createRoot}=require('react-dom/client');let listener,mobile=false,fetches=0;
window.matchMedia=()=>({get matches(){return mobile},addEventListener:(_event,fn)=>listener=fn,removeEventListener(){}});
function load(country){
 const code=babel.transformSync(fs.readFileSync('src/ads/CoupangHeaderBanner.js','utf8'),{presets:[['@babel/preset-env',{targets:{node:'current'}}],'@babel/preset-react'],configFile:false,babelrc:false}).code;
 const m={exports:{}};new Function('require','module','exports',code)(key=>key==='react'?React:key==='./amazonBannerCopy.json'?require('../src/ads/amazonBannerCopy.json'):{},m,m.exports);global.fetch=async()=>{fetches++;return{ok:true,json:async()=>({country})}};return m.exports;
}
(async()=>{
 const root=createRoot(document.getElementById('root'));
 for(const country of ['US',null,'KR']){
  const mod=load(country);await act(async()=>root.render(React.createElement(mod.default,{key:String(country)})));
  const frame=document.querySelector('iframe');assert.equal(!!frame,country==='KR');
  if(country==='US'){const link=document.querySelector('.onepick-amazon-banner');assert(link);assert.equal(new URL(link.href).searchParams.get('tag'),'onepickgamegl-20');assert.equal(link.rel,'sponsored nofollow noopener noreferrer');assert(document.body.textContent.includes('As an Amazon Associate I earn from qualifying purchases.'));}
  if(!country)assert.equal(document.querySelector('.onepick-amazon-banner'),null);
  if(frame){assert.equal(frame.width,'728');assert.equal(frame.height,'90');assert.equal(document.querySelectorAll('iframe').length,1);assert(frame.srcdoc.includes('"trackingCode":"AF6207831"'));assert.equal((frame.srcdoc.match(/new PartnersCoupang.G/g)||[]).length,1);assert(document.querySelector('.onepick-affiliate-disclosure').textContent.includes('수수료'));
   mobile=true;await act(async()=>listener());assert.equal(document.querySelector('iframe').width,'320');assert.equal(document.querySelector('iframe').height,'100');assert.equal(document.querySelectorAll('iframe').length,1);
   const before=fetches;await mod.visitorCountry();await mod.visitorCountry();assert.equal(fetches,before);
  }
 }
 assert.equal(document.querySelectorAll('script[src*=coupang]').length,0,'script is isolated from parent DOM');
 for(const lang of Object.keys(require('../src/ads/amazonBannerCopy.json'))){const mod=load('JP');await act(async()=>root.render(React.createElement(mod.default,{lang,key:'locale-'+lang})));assert(document.querySelector('.onepick-amazon-banner'));assert.equal(document.querySelectorAll('iframe').length,0);assert(document.body.textContent.includes(require('../src/ads/amazonBannerCopy.json')[lang].cta));assert.equal(document.querySelector('.onepick-amazon-ad').dir,lang==='ar'?'rtl':'ltr');}
 await act(async()=>root.unmount());dom.window.close();console.log('PASS: Vercel country/no-store routing, KR-only ads regardless of language, unknown exclusion, overseas Amazon link and 20 localized banners, single responsive frame, disclosure and shared country request.');
})().catch(error=>{console.error(error);process.exitCode=1});
