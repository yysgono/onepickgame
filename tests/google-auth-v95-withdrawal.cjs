const assert=require('node:assert/strict');
const register=require('../account-withdrawal-routes.cjs');
const ACTOR='00000000-0000-0000-0000-000000000001',TARGET='00000000-0000-0000-0000-000000000002',RETAIN='00000000-0000-0000-0000-000000000003';
function make({ordinary=false,prepareFail=false,deleteFail=false,provider='email',missing=false,targetMissing=false,prepared=false}={}){
 const events=[];let handler;
 const admin={
  from(table){let value;if(table==='account_review_admins')value=ordinary?null:{user_id:ACTOR};if(table==='account_withdrawal_config')value={retained_user_id:RETAIN};if(table==='account_withdrawal_jobs')value=null;
    const q={select(){return q},eq(){return q},async maybeSingle(){return {data:value,error:null}}};return q;},
  async rpc(name,args){events.push([name,args]);if(name==='account_begin_withdrawal')return {data:{job_id:'job',lease:'lease',status:prepared?'prepared':'working'}};
    if(name==='account_prepare_withdrawal'&&prepareFail)return {error:{message:'PRIVATE_FILES_REVIEW'}};return {data:null};},
  auth:{async getUser(token){return token==='valid'?{data:{user:{id:ACTOR}}}:{error:{message:'invalid'}}},admin:{
   async getUserById(id){if(id===TARGET&&targetMissing)return {error:{status:404,code:'user_not_found'}};return {data:{user:{id,identities:[{provider}]}}}},
   async updateUserById(id){events.push(['ban',id]);return {}},
   async deleteUser(id){events.push(['deleteAuth',id]);return deleteFail?{error:{message:'failure'}}:{}},
  }}
 };
 register({post(path,fn){assert.equal(path,'/api/admin/account-withdrawal');handler=fn}},missing?null:admin,'https://www.onepickgame.com');
 return {events,async call(overrides={}){const req={headers:{authorization:'Bearer valid',origin:'https://www.onepickgame.com'},body:{target_id:TARGET,confirmation:TARGET,requested_at:'2026-10-27T01:00:00'},...overrides};
  const res={statusCode:200,set(){return res},status(n){res.statusCode=n;return res},json(value){res.body=value;return res}};await handler(req,res);return res}};
}
(async()=>{
 let m=make({missing:true});assert.equal((await m.call()).statusCode,503);
 m=make();assert.equal((await m.call({headers:{}})).statusCode,401);assert.equal(m.events.length,0);
 m=make();assert.equal((await m.call({headers:{authorization:'Bearer valid',origin:'https://evil.test'}})).statusCode,403);assert.equal(m.events.length,0);
 m=make({ordinary:true});assert.equal((await m.call()).statusCode,403);assert.equal(m.events.length,0);
 m=make();assert.equal((await m.call({body:{target_id:ACTOR,confirmation:ACTOR}})).statusCode,400);assert.equal(m.events.length,0);
 m=make({provider:'custom:naver'});assert.equal((await m.call()).body.error,'SOCIAL_PROVIDER_REVIEW');assert.equal(m.events.length,0);
 m=make({provider:'google'});assert.equal((await m.call()).body.ok,true);assert.ok(m.events.some(e=>e[0]==='deleteAuth'));
 m=make({prepareFail:true});assert.equal((await m.call()).body.error,'PRIVATE_FILES_REVIEW');assert.ok(!m.events.some(e=>e[0]==='deleteAuth'));assert.ok(m.events.some(e=>e[0]==='account_release_withdrawal'));
 m=make({deleteFail:true});assert.equal((await m.call()).statusCode,409);assert.ok(!m.events.some(e=>e[0]==='account_finish_withdrawal'));
 m=make({targetMissing:true,prepared:true});assert.equal((await m.call()).body.ok,true);assert.ok(!m.events.some(e=>e[0]==='deleteAuth'));
 m=make();const r=await m.call();assert.equal(r.body.ok,true);const names=m.events.map(e=>e[0]);assert.ok(names.indexOf('account_prepare_withdrawal')<names.indexOf('deleteAuth'));assert.ok(names.indexOf('deleteAuth')<names.indexOf('account_finish_withdrawal'));
 assert.ok(!JSON.stringify(r.body).includes('valid'));
 console.log('PASS: disabled server, verified token, origin, admin/self checks, unsupported provider safeguard, fail-before-delete, no false completion, ordered server pipeline');
})().catch(e=>{console.error(e);process.exitCode=1});
