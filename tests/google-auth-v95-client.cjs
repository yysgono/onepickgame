const fs=require('fs'),assert=require('node:assert/strict'),babel=require('@babel/core');
const {JSDOM}=require('jsdom');
const dom=new JSDOM('',{url:'https://www.onepickgame.com/ko/login'});
global.window=dom.window;global.sessionStorage=window.sessionStorage;global.localStorage=window.localStorage;
let options,calls=0,profileCalls=0,result={data:{session:{user:{id:'example'}}}};
const supabase={auth:{async signInWithOAuth(o){options=o;return {}},async getSession(){calls++;return result;}},async rpc(name,args){profileCalls++;assert.equal(name,'account_google_profile');assert.equal(args.p_nickname,null);return {data:'existing-nickname'};}};
function load(){const m={exports:{}};const code=babel.transformSync(fs.readFileSync('src/utils/googleAuth.js','utf8'),{presets:[['@babel/preset-env',{targets:{node:'current'}}]],configFile:false,babelrc:false}).code;new Function('require','module','exports',code)(()=>({supabase}),m,m.exports);return m.exports;}
(async()=>{
const mod=load();await mod.startGoogleLogin('ko-KR');assert.equal(sessionStorage.getItem('onepick.oauth.language'),'ko');assert.equal(options.provider,'google');assert.equal(options.options.redirectTo,'https://www.onepickgame.com/auth/callback');assert.ok(!options.options.queryParams.access_type);
window.history.replaceState(null,'','/auth/callback#access_token=DO_NOT_RETAIN');
assert.deepEqual(await Promise.all([mod.completeGoogleLogin(),mod.completeGoogleLogin()]),['existing-nickname','existing-nickname']);assert.equal(calls,1);assert.equal(profileCalls,1);assert.equal(window.location.hash,'');
window.history.replaceState(null,'','/auth/callback#error=access_denied');await assert.rejects(load().completeGoogleLogin());assert.equal(window.location.hash,'');
result={data:{session:null}};await assert.rejects(load().completeGoogleLogin());
console.log('PASS: bounded language, canonical callback, no offline scope, StrictMode dedup, remove tokens, reject denied/missing sessions');dom.window.close();
})().catch(e=>{console.error(e);process.exitCode=1});
