const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const home=require('../src/seo/platformHome');
const fixture=require('./platform-home-fixtures.cjs');

test('home shares one in-flight DB snapshot across all 20 languages without changing output',async()=>{
 const client=fixture.client(),cached=home.makeLoader(client),langs=home.LANGUAGES.map(x=>x[0]);
 const expected=[];let baselineCalls=0;
 for(const lang of langs){const c=fixture.client();expected.push(await home.load(c,lang));baselineCalls+=c.calls.length;}
 const results=await Promise.all(langs.map(lang=>cached(lang)));
 assert.deepEqual(results,expected);
 assert.equal(client.calls.length,baselineCalls/langs.length);
 assert.deepEqual(await cached('ko'),expected[langs.indexOf('ko')]);
 assert.equal(client.calls.length,baselineCalls/langs.length);
});
test('home keeps page and kind separate and refreshes partial failures',async()=>{
 const failures=new Set(['quizzes']),client=fixture.client(failures),cached=home.makeLoader(client);
 const first=await cached('ko');assert(first.groups.find(g=>g.kind==='quiz').unavailable);
 const calls=client.calls.length;failures.clear();
 assert((await cached('en')).groups.find(g=>g.kind==='quiz').unavailable);assert.equal(client.calls.length,calls);
 assert.equal((await cached('en',{refresh:true})).groups.find(g=>g.kind==='quiz').unavailable,false);
 const page={kind:'quiz',offset:5};assert.deepEqual(await cached('ja',page),await home.load(fixture.client(),'ja',page));
});
const banner=fs.readFileSync(require('node:path').join(__dirname,'../src/ads/CoupangHeaderBanner.js'),'utf8');
const countrySource=banner.slice(banner.indexOf('const COUNTRY_CACHE_KEY='),banner.indexOf('export function bannerDocument')).replace('export function visitorCountry','function visitorCountry');
function storage(){const values=new Map();return {getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)};}
function documentLoad(store,now,country,ok=true){let calls=0;const ctx={window:{sessionStorage:store},Date:{now:()=>now},fetch:async()=>{calls++;return {ok,json:async()=>({country})};}};vm.createContext(ctx);vm.runInContext(countrySource,ctx);return {load:()=>ctx.visitorCountry(),calls:()=>calls};}
test('country lookup is reused within the tab for five minutes and rechecked after expiration',async()=>{
 const store=storage(),first=documentLoad(store,1000,'KR');assert.deepEqual(await Promise.all([first.load(),first.load()]),['KR','KR']);assert.equal(first.calls(),1);
 const reload=documentLoad(store,2000,'US');assert.equal(await reload.load(),'KR');assert.equal(reload.calls(),0);
 const expired=documentLoad(store,301000,'US');assert.equal(await expired.load(),'US');assert.equal(expired.calls(),1);
});
test('invalid and failed country results are never stored; blocked storage does not break lookup',async()=>{
 const store=storage();assert.equal(await documentLoad(store,1000,'invalid').load(),null);assert.equal(await documentLoad(store,2000,'KR',false).load(),null);
 const next=documentLoad(store,3000,'JP');assert.equal(await next.load(),'JP');assert.equal(next.calls(),1);
 const blocked={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}};assert.equal(await documentLoad(blocked,1000,'US').load(),'US');
});
