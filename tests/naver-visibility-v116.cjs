const fs=require('fs'),assert=require('node:assert/strict'),babel=require('@babel/core'),{JSDOM}=require('jsdom');
const dom=new JSDOM('<div id="root"></div>');global.window=dom.window;global.document=window.document;global.navigator=window.navigator;global.IS_REACT_ACT_ENVIRONMENT=true;
const React=require('react'),{act}=React,{createRoot}=require('react-dom/client');
function load(path,mocks){const m={exports:{}};const code=babel.transformSync(fs.readFileSync(path,'utf8'),{presets:[['@babel/preset-env',{targets:{node:'current'}}],'@babel/preset-react'],babelrc:false,configFile:false}).code;new Function('require','module','exports',code)(key=>{if(!(key in mocks))throw Error(key);return mocks[key];},m,m.exports);return m.exports;}
const rules=load('src/utils/naverLinkVisibility.js',{}),state=rules.naverLinkVisibility;
const member=(email,providers)=>({id:email||'naver-user',email,identities:providers.map(provider=>({provider}))});
const emailNaver=member('a@naver.com',['email']),google=member('a@gmail.com',['google']),naver=member(null,['custom:naver']);
assert.equal(state(emailNaver),'ready');assert.equal(state(member(' A@NAVER.COM ',['email'])),'ready');assert.equal(state(google),'hidden');assert.equal(state(member('a@gmail.com',['email'])),'hidden');assert.equal(state(member('a@naver.com.evil.test',['email'])),'hidden');assert.equal(state(member('a@naver.com',['google'])),'hidden');assert.equal(state(naver),'linked');assert.equal(state(null),'hidden');
let current=google,reads=0;
const View=load('src/components/NaverAccountLink.js',{'../utils/naverLinkVisibility':rules,react:React,'react-i18next':{useTranslation:()=>({i18n:{language:'ko'}})},'../utils/supabaseClient':{supabase:{auth:{getUser:async()=>{reads++;return {data:{user:current}};}}}},'../utils/googleAuth':{authLanguage:x=>x},'../utils/naverAccountLink':{startNaverAccountLink:async()=>({}),naverLinkErrorCode:()=> 'failed'},'./naverLinkCopy.json':require('../src/components/naverLinkCopy.json')}).default;
(async()=>{const root=createRoot(document.getElementById('root'));
 await act(async()=>root.render(React.createElement(View,{user:current})));assert.equal(document.querySelector('button'),null);assert.equal(reads,0);
 current=emailNaver;await act(async()=>root.render(React.createElement(View,{user:current})));assert.ok(document.querySelector('button').textContent.includes('네이버 계정 연결'));assert.equal(document.querySelector('button').disabled,false);
 current=naver;await act(async()=>root.render(React.createElement(View,{user:current})));assert.ok(document.querySelector('button').textContent.includes('네이버 연결됨'));assert.equal(document.querySelector('button').disabled,true);
 current=google;await act(async()=>root.render(React.createElement(View,{user:current})));assert.equal(document.querySelector('button'),null);
 await act(async()=>root.unmount());dom.window.close();console.log('PASS: naver.com email signup only, linked state, other accounts hidden, exact domain, no hidden-user Auth query, account switch UI');})().catch(e=>{console.error(e);process.exitCode=1});
