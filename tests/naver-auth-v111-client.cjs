const fs=require('fs'),assert=require('node:assert/strict'),babel=require('@babel/core'),{JSDOM}=require('jsdom');
const dom=new JSDOM('',{url:'https://www.onepickgame.com/ko/login'});
global.window=dom.window;global.sessionStorage=window.sessionStorage;global.localStorage=window.localStorage;
let options,calls=0,profileCalls=0,rpcName, result={data:{session:{user:{id:'example',app_metadata:{provider:'custom:naver'},identities:[{provider:'custom:naver'}]}}}};
const supabase={auth:{async signInWithOAuth(o){options=o;return {}},async getSession(){calls++;return result;}},async rpc(name,args){profileCalls++;rpcName=name;return {data:args.p_nickname||'existing-nickname'};}};
function load(){const m={exports:{}};const code=babel.transformSync(fs.readFileSync('src/utils/googleAuth.js','utf8'),{presets:[['@babel/preset-env',{targets:{node:'current'}}]],configFile:false,babelrc:false}).code;new Function('require','module','exports',code)(()=>({supabase}),m,m.exports);return m.exports;}
(async()=>{
 const mod=load();await mod.startNaverLogin('ko-KR');assert.equal(sessionStorage.getItem('onepick.oauth.language'),'ko');assert.equal(options.provider,'custom:naver');assert.equal(options.options.redirectTo,'https://www.onepickgame.com/auth/callback');assert.equal(options.options.scopes,'openid profile');assert.equal(options.options.queryParams,undefined);
 window.history.replaceState(null,'','/auth/callback#access_token=DO_NOT_RETAIN');
 assert.deepEqual(await Promise.all([mod.completeGoogleLogin(),mod.completeGoogleLogin()]),['existing-nickname','existing-nickname']);assert.equal(calls,1);assert.equal(profileCalls,1);assert.equal(rpcName,'account_naver_profile');assert.equal(window.location.hash,'');
 assert.equal(await mod.saveSocialNickname(' nickname '),'nickname');assert.equal(rpcName,'account_naver_profile');
 await mod.startGoogleLogin('xx');assert.equal(options.provider,'google');assert.equal(options.options.scopes,'openid email profile');assert.equal(sessionStorage.getItem('onepick.oauth.language'),'en');
 result={data:{session:{user:{id:'google',app_metadata:{provider:'google'},identities:[{provider:'google'}]}}}};await load().completeGoogleLogin();assert.equal(rpcName,'account_google_profile');
 window.history.replaceState(null,'','/auth/callback#error=access_denied');await assert.rejects(load().completeGoogleLogin());assert.equal(window.location.hash,'');
 result={data:{session:null}};await assert.rejects(load().completeGoogleLogin());
 sessionStorage.setItem('onepick.oauth.provider','custom:naver');result={data:{session:{user:{id:'email',app_metadata:{provider:'email'},user_metadata:{provider:'custom:naver'},identities:[{provider:'email'}]}}}};await assert.rejects(load().completeGoogleLogin(),/OAUTH_PROVIDER_UNSUPPORTED/);
 await assert.rejects(load().saveSocialNickname('nickname'),/OAUTH_NOT_READY/);
 console.log('PASS: NAVER/Google OAuth, scopes, language, dedup, token cleanup, profile RPC choice, no email/manual-metadata authorization');dom.window.close();
})().catch(e=>{console.error(e);process.exitCode=1});
