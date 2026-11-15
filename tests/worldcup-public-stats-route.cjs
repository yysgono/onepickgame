const assert=require('node:assert/strict'),express=require('express'),{JSDOM}=require('jsdom');
const shell='<html><head><title>Shell</title><link rel="stylesheet" href="/static/css/app.css"></head><body><div id="root"><p>Loading...</p></div><script src="/static/js/app.js"></script></body></html>';
require.cache[require.resolve('../seo-template.cjs')]={exports:{loadSeoTemplate:async()=>shell}};
const register=require('../worldcup-view-routes.cjs'),copy=require('../src/seo/worldcupPublicStatsCopy.json');
const id='a1111111-1111-4111-8111-111111111111',cup={id,title:'Worldcup',data:[{id:'a',name:'Winner',name_translations:{ko:'실제 우승 후보'},image:'https://example.com/winner.jpg'},{id:'b',name:'Other'}]},stats=[{candidate_id:'b',win_count:1,total_games:183,match_wins:4,match_count:10},{candidate_id:'a',win_count:8,total_games:183,match_wins:16,match_count:20}];
let mode='ready',calls=0,missing=false;
const client={from:()=>({select(){return this},eq(){return this},is(){return this},maybeSingle:async()=>({data:missing?null:cup})}),rpc:(name,args)=>{calls++;assert.equal(name,'get_winner_stats');assert.deepEqual(args,{p_cup_id:id,p_from:null,p_to:null});return{abortSignal(signal){assert(signal instanceof AbortSignal);if(mode==='reject')return Promise.reject(Error('network'));return Promise.resolve(mode==='error'?{error:{code:'DB_DOWN'}}:{data:mode==='empty'?[]:mode==='invalid'?null:stats});}}}};
const app=express();register(app,client,'https://www.onepickgame.com');app.use((req,res)=>res.status(404).send('Not found'));
const server=app.listen(0,'127.0.0.1',async()=>{
 const base='http://127.0.0.1:'+server.address().port;
 try{
  for(const lang of Object.keys(copy))for(const kind of ['result','stats']){
   const response=await fetch(`${base}/${lang}/${kind}/${id}`),doc=new JSDOM(await response.text()).window.document;
   assert.equal(response.status,200);assert.equal(doc.querySelectorAll('tbody tr').length,2);assert.equal(doc.querySelector('tbody th').textContent,lang==='ko'?'실제 우승 후보':'Winner');assert.equal(doc.querySelectorAll('tbody tr')[0].querySelectorAll('td')[2].textContent,'4.4%');assert.equal(doc.querySelector('link[rel=canonical]').href,`https://www.onepickgame.com/${lang}/${kind}/${id}`);assert(response.headers.get('cache-control').includes('s-maxage=300'));assert.equal(doc.querySelector('script[src]').getAttribute('src'),'/static/js/app.js');assert.equal(doc.querySelectorAll('meta[name=robots]').length,1);
  }
  const before=calls,match=await fetch(`${base}/ko/match/${id}/16`),matchHtml=await match.text();assert.equal(calls,before);assert(!matchHtml.includes('<table'));assert.equal(match.headers.get('x-robots-tag'),'noindex,follow');assert.equal(match.headers.get('cache-control'),'no-store');
  const rewrite=await fetch(`${base}/?seo=worldcup-view&lang=ko&view=result&id=${id}`);assert.equal(rewrite.status,200);assert((await rewrite.text()).includes('실제 우승 후보'));
  for(mode of ['error','reject','invalid']){
   const response=await fetch(`${base}/ko/result/${id}`),html=await response.text();assert.equal(response.status,200);assert(html.includes(copy.ko.unavailable));assert(!html.includes('<table'));assert(html.includes('Worldcup'));assert(html.includes('/static/js/app.js'));assert.equal(response.headers.get('cache-control'),'no-store');
  }
  mode='empty';const empty=await fetch(`${base}/ko/result/${id}`);assert((await empty.text()).includes(copy.ko.empty));
  missing=true;const count=calls,notFound=await fetch(`${base}/ko/result/${id}`);assert.equal(notFound.status,404);assert.equal(calls,count);
  missing=false;const invalid=await fetch(`${base}/ko/result/not-a-uuid`);assert.equal(invalid.status,404);assert.equal(calls,count);
  console.log('PASS: actual Express routes for 20 languages, result/stats/rewrite, existing canonical/cache/scripts, no match RPC, graceful unavailable/empty states and missing/invalid IDs.');
 }catch(error){console.error(error);process.exitCode=1;}finally{server.close();}
});
