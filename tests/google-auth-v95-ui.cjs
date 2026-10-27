const fs=require('fs'),assert=require('node:assert/strict'),babel=require('@babel/core'),{JSDOM}=require('jsdom');
const dom=new JSDOM('<div id="root"></div>',{url:'https://www.onepickgame.com/auth/callback'});
global.window=dom.window;global.document=window.document;global.navigator=window.navigator;global.sessionStorage=window.sessionStorage;global.IS_REACT_ACT_ENVIRONMENT=true;
const React=require('react'),{act}=React,{createRoot}=require('react-dom/client'),{Simulate}=require('react-dom/test-utils');
let destination, saved,existing=null,deny=false;
const moduleObject={exports:{}};
const code=babel.transformSync(fs.readFileSync('src/components/GoogleAuthCallback.js','utf8'),{presets:[['@babel/preset-env',{targets:{node:'current'}}],'@babel/preset-react'],babelrc:false,configFile:false}).code;
const mocks={react:React,'react-router-dom':{useNavigate:()=>navigate,Link:({children,to})=>React.createElement('a',{href:to},children)},'react-helmet-async':{Helmet:()=>null},'../utils/supabaseClient':{supabase:{async rpc(name,args){assert.equal(name,'account_google_profile');assert.equal(args.p_nickname,'chosen nickname');return {data:'chosen nickname'};}}},'../utils/googleAuth':{authLanguage:x=>x||'en',completeGoogleLogin:async()=>{if(deny)throw Error('denied');return existing;}},'../utils/googleAuthCopy':{googleAuthCopy:()=>({title:'Google',hint:'choose nickname',label:'nickname',save:'save',failed:'failed',back:'back',nicknameError:'save failed'})}};
function navigate(to){destination=to;}
new Function('require','module','exports',code)(name=>mocks[name],moduleObject,moduleObject.exports);
(async()=>{
 sessionStorage.setItem('onepick.oauth.language','ko');const root=createRoot(document.getElementById('root'));
 const render=async key=>act(async()=>root.render(React.createElement(moduleObject.exports.default,{key,setNickname:name=>saved=name})));
 await render('new');const input=document.querySelector('input');assert.ok(input);
 await act(async()=>Simulate.change(input,{target:{value:'chosen nickname'}}));
 await act(async()=>Simulate.submit(document.querySelector('form')));assert.equal(saved,'chosen nickname');assert.equal(destination,'/ko');
 existing='original nickname';await render('existing');assert.equal(saved,'original nickname');assert.equal(document.querySelector('input'),null);
 deny=true;await render('denied');assert.equal(document.querySelector('[role=alert]').textContent,'failed');
 await act(async()=>root.unmount());dom.window.close();console.log('PASS: first-login nickname form/save, existing nickname preservation, language return, denied login error');
})().catch(e=>{console.error(e);process.exitCode=1});
