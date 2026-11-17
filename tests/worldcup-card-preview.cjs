const assert=require('node:assert/strict'),preview=require('../src/utils/worldcupCardPreview'),discovery=require('../src/seo/templateDiscovery');
const id='00000000-0000-4000-8000-000000000001';
const cup={id,title:'Games',category:'game',data:[1,2,3,4].map(n=>({id:n,image:'https://example.com/'+n+'.jpg'}))};
const stats=[{candidate_id:4,win_count:3,match_wins:2},{candidate_id:2,win_count:7,match_wins:4},{candidate_id:4,win_count:5,match_wins:3},{candidate_id:3,win_count:7,match_wins:6}];
const totals=preview.aggregatePreviewStats(stats);assert.deepEqual(preview.getTop2Winners(totals,cup.data).map(c=>c.id),[4,3]);assert.deepEqual(preview.getTop2Winners([],cup.data).map(c=>c.id),[1,2]);assert.deepEqual(preview.getTop2Winners([{candidate_id:'4',win_count:9},{candidate_id:'3',win_count:8}],cup.data).map(c=>c.id),[4,3]);
assert.deepEqual(preview.getTop2Winners([{candidate_id:3,win_count:1,match_wins:1},{candidate_id:4,win_count:1,match_wins:1}],cup.data).map(c=>c.id),[3,4]);
let failed=false,count=0,fields=[];
const client={rpc:async()=>({data:[]}),from(table){return{select(value){fields.push(value);return this},eq(key,value){if(table==='winner_stats'){assert.equal(key,'cup_id');assert.equal(value,id)}return this},contains(){return this},neq(){return this},is(){return this},in(){return this},order(){return this},limit(){return this},abortSignal(){return this},then(resolve,reject){if(table==='winner_stats')count++;return Promise.resolve(table==='winner_stats'?(failed?{error:Error('offline')}:{data:stats}):{data:[]}).then(resolve,reject)}}}};
(async()=>{
 for(const kind of ['nine','tier']){count=0;const groups=await discovery.load(client,cup,kind,'en');assert.deepEqual(groups.source.images,['https://example.com/4.jpg','https://example.com/3.jpg']);assert.equal(count,1);}
 failed=true;const fallback=await discovery.load(client,cup,'nine','en');assert.deepEqual(fallback.source.images,['https://example.com/1.jpg','https://example.com/2.jpg']);assert(fields.includes('candidate_id,win_count,match_wins'));assert(!fields.includes('*'));
 console.log('PASS: shared homepage top-two rules, accumulated daily counts, win/match tie breaks, numeric/string IDs, original URLs, one lightweight stats request per source and unavailable-stat fallback.');
})().catch(error=>{console.error(error);process.exitCode=1});
