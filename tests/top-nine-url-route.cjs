const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const copy=require('../src/components/topNine/copy.json');
const shell='<html><head><title>old</title></head><body><div id="root"></div><script src="/static/js/main.js"></script></body></html>';
const sandbox={module:{exports:{}},URLSearchParams,require:p=>p.includes('seo-template')?{loadSeoTemplate:async()=>shell}:copy};
vm.runInNewContext(fs.readFileSync('top-nine-routes.cjs','utf8'),sandbox);
let handler;sandbox.module.exports({use:fn=>handler=fn},'https://www.onepickgame.com');
const routes=JSON.parse(fs.readFileSync('vercel.json')).routes;
async function request(path,query={}){const result={};const res={setHeader(){},type(){return this;},status(code){result.status=code;return this;},send(body){result.body=body;return this;},redirect(status,url){Object.assign(result,{status,url});return this;}};await handler({path,query},res,()=>{result.next=true;});return result;}
(async()=>{
 for(const lang of Object.keys(copy)){
  const current=await request(`/${lang}/mytop9`);assert(current.body.includes(`href="https://www.onepickgame.com/${lang}/mytop9"`));
  const old=await request(`/${lang}/top-nine/`,{board:'saved',tag:['a','b']});assert.equal(old.status,301);assert.equal(old.url,`/${lang}/mytop9?board=saved&tag=a&tag=b`);
  const legacyRule=routes.find(r=>new RegExp('^'+r.src).test(`/${lang}/top-nine`));assert(legacyRule.dest.includes('legacy=1'));
  const currentRule=routes.find(r=>new RegExp('^'+r.src).test(`/${lang}/mytop9`));assert.equal(currentRule.dest,'/server.js?seo=top-nine&lang=$1');
  const rewritten=await request('/server.js',{seo:'top-nine',legacy:'1',lang,board:'saved'});assert.equal(rewritten.url,`/${lang}/mytop9?board=saved`);
  const spa=await request('/server.js',{seo:'spa',path:`${lang}/mytop9`});assert(spa.body.includes(`/${lang}/mytop9`));
 }
 assert((await request('/en/quiz')).next);assert.equal((await request('/xx/mytop9')).status,404);
 console.log('20-locale new routes, old URL 301 redirects, query preservation and Vercel rewrites passed');
})().catch(e=>{console.error(e);process.exitCode=1;});
