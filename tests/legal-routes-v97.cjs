const assert=require('node:assert/strict');
const template=require.resolve('../seo-template.cjs');require.cache[template]={exports:{loadSeoTemplate:async()=>'<html lang="en"><head><title>Old</title><link rel="canonical" href="https://www.onepickgame.com/"></head><body><div id="root"><div class="loading-screen">Loading...</div></div></body></html>'}};
const {LANGUAGES,getLegalPolicy}=require('../src/legal/legalPolicy');let handler,queries=0;
require('../category-routes.cjs')({use(fn){handler=fn;}},{from(){queries++;throw Error('No DB allowed');}},'https://www.onepickgame.com');
(async()=>{
 for(const lang of LANGUAGES)for(const page of ['privacy-policy','terms-of-service']){
  let output,status=200;const headers={};
  const res={setHeader(k,v){headers[k]=v;},status(n){status=n;return this;},send(s){output=s;return this;}};
  let next=false;await handler({query:{seo:'spa',path:lang+'/'+page}},res,()=>{next=true;});
  assert.equal(next,false);assert.equal(status,200);assert.equal(headers['Cache-Control'],'no-store');
  assert.ok(output.includes(`lang="${lang}"`));assert.ok(output.includes(getLegalPolicy(lang,page).title));
  assert.ok(!output.includes('Loading...'));assert.equal((output.match(/<title\b/g)||[]).length,1);assert.equal((output.match(/rel="canonical"/g)||[]).length,1);
 }
 assert.equal(queries,0);console.log('PASS: 32 initial HTML route responses, localized bodies, no duplicate metadata, no extra database requests');
})().catch(e=>{console.error(e);process.exitCode=1});
