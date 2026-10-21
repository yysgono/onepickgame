const fs=require('fs'),assert=require('node:assert/strict');
(async()=>{
 const {createImportCache}=await import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync('src/components/randomPick/importCache.js')).toString('base64'));
 let time=0;const cache=createImportCache({ttl:100,maxBytes:400,now:()=>time});
 const sample={sourceCupId:'a',rows:[{id:'a:0',name:'A',image:'https://example.test/a.jpg',enabled:true}],truncated:false};
 cache.set('a',sample);sample.rows[0].name='Changed';assert.equal(cache.get('a').rows[0].name,'A');
 let loaded=cache.get('a');loaded.rows[0].enabled=false;assert.equal(cache.get('a').rows[0].enabled,true);
 time=99;assert(cache.get('a'));time=100;assert.equal(cache.get('a'),null);
 cache.set('a',sample);cache.set('b',{...sample,sourceCupId:'b'});assert.equal(cache.get('a'),null);assert(cache.get('b'));
 cache.set('c',{rows:[{name:'x'.repeat(500)}]});assert.equal(cache.get('b'),null);assert.equal(cache.get('c'),null);
 cache.set('a',sample);cache.clear();assert.equal(cache.get('a'),null);
 console.log('PASS: cache reuse, copy isolation, expiry, one-entry eviction, memory bound and clear');
})().catch(e=>{console.error(e);process.exitCode=1;});
