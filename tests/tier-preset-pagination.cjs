const fs=require('node:fs'),assert=require('node:assert/strict');
const source=fs.readFileSync('src/components/TierListPage.js','utf8');
const helpers=source.slice(source.indexOf('const PAGE_SIZE ='),source.indexOf('const CATEGORY_VALUES ='));
const start=source.indexOf('  useEffect(() => {\n    if (mineOnly) return undefined;');assert(start>=0);
const effect=source.slice(start,source.indexOf('  const recommendedPresets =',start));
const makeRunner=new Function('contentRevision',helpers+`return env=>{const {mineOnly,category,presetPage,presetSearchFilter,supabase,useEffect,setTierPresetLoaded,setPresetError,setManagedTierPresets,setPresetHasMore}=env;${effect}};`);
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function scenario(count){
 const rows=Array.from({length:count},(_,i)=>({id:String(i),category:'game'})),calls=[];let cards=[],more=false;
 const run=makeRunner(()=>0);
 const supabase={from:name=>{if(name==='tier_preset_thumbnails')return {select(){return this},async in(){return {data:[]}}};assert.equal(name,'worldcup_tier_preset_cards');const call={};calls.push(call);const query={select(fields){call.fields=fields;return this;},in(key,values){call.category={key,values};return this;},or(filter){call.filter=filter;return this;},order(){return this;},async range(from,to){Object.assign(call,{from,to});return {data:rows.slice(from,to+1)};}};return query;}};
 const env={mineOnly:false,category:'all',presetPage:0,presetSearchFilter:'',supabase,useEffect:fn=>fn(),setTierPresetLoaded(){},setPresetError(message){assert.equal(message,'');},setManagedTierPresets:update=>{cards=typeof update==='function'?update(cards):update;},setPresetHasMore:value=>more=value};
 run(env);await tick();assert.equal(cards.length,Math.min(28,count));assert.equal(more,count>28);assert.deepEqual([calls[0].from,calls[0].to],[0,28]);
 // Reopening the same page uses the existing one-minute cache.
 run(env);await tick();assert.equal(calls.length,1);
 let page=0;while(more){run({...env,presetPage:++page});await tick();assert.equal(calls.at(-1).from,page*28);assert.equal(calls.at(-1).to,(page+1)*28);}
 assert.equal(cards.length,count);assert.equal(new Set(cards.map(c=>c.id)).size,count);
 assert(calls.every(c=>!/(^|,)(data|upvotes|downvotes|play_count|view_count)(,|$)/.test(c.fields)));
 const filter='tier_preset_title_translations->>ko.ilike.%음료수%';
 run({...env,presetSearchFilter:filter});await tick();
 assert.equal(calls.at(-1).filter,filter);
 assert.deepEqual([calls.at(-1).from,calls.at(-1).to],[0,28]);
 const before=calls.length;run({...env,mineOnly:true});await tick();assert.equal(calls.length,before);
}
(async()=>{for(const count of [0,27,28,29,56,57])await scenario(count);assert(source.includes('loading="lazy" deferUntilVisible viewportMargin="0px"'));console.log('Tier presets: 28-card pages, exact-boundary More visibility, no duplicates, cached requests and deferred media passed');})().catch(e=>{console.error(e);process.exitCode=1;});
