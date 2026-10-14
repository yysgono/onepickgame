// Run with: node scripts/test-home-paging.cjs (Node 18+; no additional dependencies).
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const loadModule=relative=>import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(path.join(__dirname,'..',relative),'utf8')).toString('base64'));
(async()=>{
 const {createWorldcupHomePager,PRIMARY_HOME_ROWS,HOME_ROW_KEYS}=await loadModule("src/utils/worldcupHomePager.js");
 const calls=[];let fail=false;let emitCount=0;
 const pager=createWorldcupHomePager({pageSize:2,onChange:()=>emitCount++,fetchRows:async request=>{
  calls.push(request);if(fail)throw Error('Temporary failure');
  return {totals:Object.fromEntries(HOME_ROW_KEYS.map(k=>[k,20])),rows:Object.fromEntries(request.requests.map(r=>[r.key,{offset:r.offset,total:20,items:Array.from({length:r.limit},(_,i)=>({id:r.key+'-'+(r.offset+i)}))}]))};
 }});
 assert.equal(calls.length,0);await pager.ensureRows(PRIMARY_HOME_ROWS);assert.equal(calls.length,1);assert.equal(calls[0].requests.length,4);assert(calls[0].requests.every(r=>r.offset===0&&r.limit===2));
 await Promise.resolve();assert.equal(calls.length,1); // no automatic next-page fetch
 await Promise.all([pager.loadMore('korea',4),pager.loadMore('korea',4)]);assert.equal(calls.length,2);assert.equal(calls[1].requests[0].offset,2);assert.equal(calls[1].requests[0].limit,2);assert.equal(pager.snapshot().rows.korea.items.length,4);
 await pager.ensureRows(HOME_ROW_KEYS);assert.equal(calls.length,3);assert.equal(calls[2].requests.length,6);assert(calls[2].requests.every(r=>!PRIMARY_HOME_ROWS.includes(r.key)));assert.equal(calls[2].requests.find(r=>r.key==='etc').limit,8);
 fail=true;assert.equal(await pager.loadMore('korea',6),false);assert.equal(pager.snapshot().rows.korea.items.length,4);assert(pager.snapshot().error);
 fail=false;await pager.loadMore('korea',6);assert.equal(pager.snapshot().rows.korea.items.length,6);assert.equal(pager.snapshot().error,null);
 const eventsBefore=emitCount;pager.dispose();assert.equal(await pager.loadMore('person',4),false);assert.equal(emitCount,eventsBefore);
 const {worldcupRouteData:route}=await loadModule('src/utils/worldcupRouteData.js');
 assert.equal(route('/ko').kind,'none');assert.equal(route('/').kind,'none');assert.equal(route('/ja/quiz').kind,'none');assert.equal(route('/ko/select-round/abc').kind,'one');assert.equal(route('/ko/select-round/abc').id,'abc');assert.equal(route('/en/match/abc/16').kind,'one');assert.equal(route('/ko/category/game').kind,'all');assert.equal(route('/ko/my-worldcups').kind,'all');assert.equal(route('/en/manage').kind,'all');
 console.log('PASS: no hidden page fetch, next-page ranges, deferred categories, concurrent click deduplication, retry preservation, disposed requests, home vs single-game vs catalogue routing');
})().catch(error=>{console.error(error);process.exitCode=1});
