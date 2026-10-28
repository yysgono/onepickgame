const assert=require('node:assert/strict'),fs=require('fs'),babel=require('@babel/core'),{JSDOM}=require('jsdom');
const dom=new JSDOM('',{url:'https://www.onepickgame.com/auth/callback'});global.window=dom.window;global.sessionStorage=window.sessionStorage;
const A='old-user',B='other-user',KEY='onepick.oauth.naver-link';let user={id:A,identities:[{provider:'email'}]},linkError=null,linkOptions,reads=0,signedOut=0;
const supabase={auth:{getUser:async()=>{reads++;return {data:{user}};},getSession:async()=>({data:{session:{user}}}),linkIdentity:async options=>{linkOptions=options;return {error:linkError};},signOut:async o=>{assert.equal(o.scope,'local');signedOut++;return {};}}};
function load(){const m={exports:{}};const code=babel.transformSync(fs.readFileSync('src/utils/naverAccountLink.js','utf8'),{presets:[['@babel/preset-env',{targets:{node:'current'}}]],configFile:false,babelrc:false}).code;new Function('require','module','exports',code)(()=>({supabase}),m,m.exports);return m.exports;}
function intent(createdAt=Date.now()){sessionStorage.setItem(KEY,JSON.stringify({userId:A,createdAt}));}
(async()=>{
 let m=load();await m.startNaverAccountLink('ko');assert.equal(linkOptions.provider,'custom:naver');assert.equal(linkOptions.options.redirectTo,'https://www.onepickgame.com/auth/callback');assert.equal(JSON.parse(sessionStorage.getItem(KEY)).userId,A);
 user={id:A,identities:[{provider:'email'},{provider:'custom:naver'}]};window.history.replaceState(null,'','/auth/callback#access_token=secret');const before=reads;
 assert.deepEqual(await Promise.all([m.completeNaverAccountLink(),m.completeNaverAccountLink()]),[true,true]);assert.equal(reads-before,1);assert.equal(window.location.hash,'');assert.equal(sessionStorage.getItem(KEY),null);
 assert.equal((await load().startNaverAccountLink('ko')).alreadyLinked,true);
 user={id:A,identities:[{provider:'email'}]};linkError={code:'manual_linking_disabled'};m=load();await assert.rejects(m.startNaverAccountLink('ko'));assert.equal(sessionStorage.getItem(KEY),null);assert.equal(m.naverLinkErrorCode(linkError),'disabled');linkError=null;
 intent();window.history.replaceState(null,'','/auth/callback#error=server_error&error_code=identity_already_exists');m=load();await assert.rejects(m.completeNaverAccountLink(),/LINK_IDENTITY_EXISTS/);assert.equal(window.location.hash,'');assert.equal(sessionStorage.getItem(KEY),null);
 intent(Date.now()-16*60*1000);await assert.rejects(load().completeNaverAccountLink(),/LINK_EXPIRED/);
 intent();user={id:B,identities:[{provider:'custom:naver'}]};await assert.rejects(load().completeNaverAccountLink(),/LINK_ACCOUNT_CHANGED/);assert.equal(signedOut,1);
 intent();user={id:A,identities:[{provider:'email'}]};await assert.rejects(load().completeNaverAccountLink(),/LINK_NOT_CONFIRMED/);
 await assert.rejects(load().completeNaverAccountLink(),/LINK_EXPIRED/);
 user=null;await assert.rejects(load().startNaverAccountLink('ko'),/LINK_LOGIN_REQUIRED/);
 console.log('PASS: authenticated linking only, exact provider, UID continuity, Auth identity verification, callback dedup, conflict/expiry/cancel safeguards, no merge/delete');dom.window.close();
})().catch(e=>{console.error(e);process.exitCode=1});
