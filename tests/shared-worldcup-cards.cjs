const assert=require('node:assert/strict'),cards=require('../src/utils/sharedWorldcupCards');
const id='00000000-0000-4000-8000-000000000001';let requests=0,fail=false,images=['https://example.com/winner.jpg','https://example.com/runner-up.jpg'];
const client={from(table){assert.equal(table,'worldcup_card_previews','Source cards must not read or recalculate winner_stats');let ids=[];return{select(fields){assert.equal(fields,'cup_id,candidate_ids,image_urls,updated_at');return this},in(key,values){assert.equal(key,'cup_id');ids=values;assert(ids.length<=100);return this},abortSignal(){return this},then(resolve,reject){requests++;return Promise.resolve(fail?{error:Error('missing table')}:{data:ids.map(cup_id=>({cup_id,image_urls:images,candidate_ids:['4','3']}))}).then(resolve,reject)}}}};
(async()=>{
 const [home,source]=await Promise.all([cards.loadCards(client,[id]),cards.loadSourcePreview(client,{id,data:[{id:1,image:'https://wrong/first.jpg'}]})]);assert.equal(requests,1);assert.deepEqual(home[0].images,source.images);assert.equal(source.status,'stored');
 assert.deepEqual((await cards.loadSourcePreview(client,{id})).images,images);assert.equal(requests,1,'Reuse the homepage metadata cache');
 const realNow=Date.now;try{const future=realNow()+61000;Date.now=()=>future;images=['https://example.com/new-winner.jpg'];assert.deepEqual((await cards.loadSourcePreview(client,{id})).images,images);assert.equal(requests,2);}finally{Date.now=realNow;}
 const many=Array.from({length:170},(_,i)=>'10000000-0000-4000-8000-'+String(i).padStart(12,'0'));assert.equal((await cards.loadCards(client,many)).length,170);
 fail=true;const unavailable=await cards.loadSourcePreview(client,{id:'20000000-0000-4000-8000-000000000001'});assert.equal(unavailable.status,'unavailable');assert.deepEqual(unavailable.images,[]);assert.deepEqual(await cards.loadCards(client,['invalid']),[]);
 console.log('PASS: source uses stored card URLs without stats/candidates, shared homepage/source query and cache, expiry, bounded batches/cache, complete results and missing-table behavior.');
})().catch(error=>{console.error(error);process.exitCode=1});
