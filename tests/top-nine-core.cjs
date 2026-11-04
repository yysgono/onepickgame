const fs=require('fs'),assert=require('assert/strict'),babel=require('@babel/core'),Module=require('module');
const cache={};function load(p){p=require('path').resolve(p);if(cache[p])return cache[p].exports;const m=new Module(p);cache[p]=m;m.filename=p;m.paths=module.paths;m.require=x=>x.endsWith('.json')?JSON.parse(fs.readFileSync(require('path').resolve(require('path').dirname(p),x),'utf8')):x.startsWith('.')?load(require('path').resolve(require('path').dirname(p),x)+'.js'):require(x);m._compile(babel.transformSync(fs.readFileSync(p,'utf8'),{plugins:['@babel/plugin-transform-modules-commonjs']}).code,p);return m.exports;}
const core=load('src/components/topNine/core.js');
const pool=core.normalizeCandidates(Array.from({length:476},(_,i)=>({id:i,name:'후보'+i,image:'https://example.com/'+i+'.jpg'})));
let slots=Array(9).fill(null);for(const c of pool.slice(0,10))slots=core.toggleCandidate(slots,c);assert.equal(slots.filter(Boolean).length,9);slots=core.swapSlots(slots,0,4);assert.equal(slots[4].id,pool[0].id);assert.equal(core.toggleCandidate(slots,pool[0])[4],null);
for(const count of [9,10,27,28,30,53,81,476]){let p=pool.slice(0,count);while(p.length>27){let next=[];for(let offset=0;offset<p.length;offset+=9){const batch=core.gameBatch(p,offset);next.push(...batch.slice(0,core.gameRequired(p,batch)));}assert(next.every(c=>p.includes(c)));assert(next.length<p.length);p=next;}assert(p.length>=9);assert.equal(core.gameRequired(p,p),9);}
const hash=core.makeShareHash(slots,'최애9',true);assert.equal(core.readShared(hash).title,'최애9');assert.equal(core.safeMedia('javascript:alert(1)'), '');assert.equal(core.safeMedia('https://s.supabase.co/storage/v1/render/image/sign/a.jpg?token=x'),'');assert.throws(()=>core.makeShareHash(slots.map(c=>({...c,src:c.src+'?token=secret'})),'',false));assert.equal(core.readShared('#nine=broken'),null);
const titles=load('src/utils/templateTitles.js');assert.equal(titles.templateTitle({title:'Original',tier_preset_title_translations:{ko:'티어표',en:'Tier'}} ,'tier','ko'),'티어표');assert.equal(titles.templateTitle({title:'Original',tier_preset_title_translations:{en:'Tier'}} ,'tier','it'),'Tier');
const copy=JSON.parse(fs.readFileSync('src/components/topNine/copy.json'));assert.equal(Object.keys(copy).length,20);for(const c of Object.values(copy))assert.deepEqual(Object.keys(c),Object.keys(copy.en));console.log('Top 9: selection, elimination, sharing, URL safety, titles and 20 locales passed');

const multilingual=core.normalizeCandidates([{name:'루피',image:'https://example.com/luffy.jpg',name_translations:{en:'Monkey D. Luffy',ja:'ルフィ'},title_zh:'路飞'}])[0];
for(const term of ['루피','LUFFY','Monkey D','ルフィ','路飞'])assert(core.candidateMatches(multilingual,term),term);
assert(!core.candidateMatches(multilingual,'unrelated'));console.log('Multilingual candidate name search passed');

const partial=Array(9).fill(null);partial[4]=pool[0];
const restored=core.readShared(core.makeShareHash(partial,'Partial',true)).slots;
assert.equal(restored.filter(Boolean).length,1);assert.equal(restored[4].id,pool[0].id);
assert.throws(()=>core.makeShareHash(Array(9).fill(null),'',false));
