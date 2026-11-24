const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
const paging=require('../src/utils/commentWindow');
const {readCommentWindow,PAGE_SIZE}=paging;
const items=n=>Array.from({length:n},(_,i)=>({id:i+1,content:'comment '+(i+1)}));
function fixture(rows,cap=1000){const calls=[];return {calls,query:count=>({range:async(start,end)=>{calls.push({start,end,count});return {data:rows.slice(start,Math.min(end+1,start+cap)),count:count?rows.length:null};}})};}
test('small and empty lists preserve all rows and do not add more',async()=>{
 for(const n of [0,1,49,50]){const rows=items(n),f=fixture(rows);assert.deepEqual(await readCommentWindow(f.query,PAGE_SIZE,true),{rows,hasMore:false,count:n});assert.equal(f.calls.length,1);}
});
test('initial 50 plus lookahead instead of hundreds; total count stays accurate',async()=>{
 const rows=items(700),f=fixture(rows);const first=await readCommentWindow(f.query,50,true);assert.deepEqual(first.rows,rows.slice(0,50));assert(first.hasMore);assert.equal(first.count,700);assert.deepEqual(f.calls,[{start:0,end:50,count:true}]);
 const expanded=await readCommentWindow(f.query,100,true);assert.deepEqual(expanded.rows,rows.slice(0,100));assert(expanded.hasMore);assert.equal(expanded.count,700);
});
test('large windows request bounded ranges, count once and exhaust all comments',async()=>{
 const rows=items(405),f=fixture(rows);const result=await readCommentWindow(f.query,450,true);assert.deepEqual(result.rows,rows);assert.equal(result.hasMore,false);assert.equal(result.count,405);assert.deepEqual(f.calls.map(c=>c.count),[true,false,false]);assert(f.calls.every(c=>c.end-c.start+1<=200));
 const capped=fixture(rows,60);assert.deepEqual((await readCommentWindow(capped.query,150,true)).rows,rows.slice(0,150));
});
test('expanded window reflects inserts/deletes; errors reject rather than silently truncate',async()=>{
 const rows=items(90),f=fixture(rows);const first=await readCommentWindow(f.query,50);assert(first.hasMore);rows.unshift({id:101});rows.splice(12,1);const next=await readCommentWindow(f.query,100);assert.deepEqual(next.rows,rows);assert.equal(next.hasMore,false);
 await assert.rejects(readCommentWindow(()=>({range:async()=>({error:new Error('DB failed')})}),50),/DB failed/);
});
function harness(){
 let slots=[],cursor=0,effectQueue=[],args,rendered,dirty=false;
 const changed=(a,b)=>!a||a.length!==b.length||a.some((x,i)=>x!==b[i]);
 const react={useState(init){const i=cursor++;if(!slots[i])slots[i]={value:typeof init==='function'?init():init};return [slots[i].value,v=>{slots[i].value=typeof v==='function'?v(slots[i].value):v;dirty=true;}];},useRef(v){const i=cursor++;return slots[i]||(slots[i]={current:v});},useCallback(fn,deps){const i=cursor++;if(!slots[i]||changed(slots[i].deps,deps))slots[i]={fn,deps};return slots[i].fn;},useEffect(fn,deps){const i=cursor++;if(!slots[i]||changed(slots[i].deps,deps)){const old=slots[i];slots[i]={deps};effectQueue.push(()=>{old?.cleanup?.();slots[i].cleanup=fn();});}}};
 const code=ts.transpileModule(fs.readFileSync('src/hooks/useCommentWindow.js','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;
 const mod={exports:{}};new Function('require','module','exports',code)(name=>name==='react'?react:paging,mod,mod.exports);
 const hook=mod.exports.default;
 function render(next=args){args=next;cursor=0;dirty=false;rendered=hook(args);const effects=effectQueue;effectQueue=[];effects.forEach(fn=>fn());return rendered;}
 async function settle(){for(let i=0;i<12;i++){await Promise.resolve();if(dirty)render();}return rendered;}
 return {render,settle,unmount:()=>slots.forEach(s=>s?.cleanup?.())};
}
test('hook keeps expanded window after refresh; failed expansion keeps old rows and can retry',async()=>{
 const h=harness(),rows=items(130),f=fixture(rows),errors=[];let fail=false;
 const query=count=>fail?{range:async()=>({error:Error('offline')})}:f.query(count);
 h.render({scope:'a',enabled:true,query,withCount:true,onError:e=>errors.push(e.message)});let v=await h.settle();assert.equal(v.rows.length,50);assert.equal(v.count,130);
 fail=true;await v.more();v=await h.settle();assert.equal(v.rows.length,50);assert.equal(v.loadingMore,false);assert.deepEqual(errors,['offline']);
 fail=false;await v.more();v=await h.settle();assert.equal(v.rows.length,100);rows.splice(0,1);await v.load();v=await h.settle();assert.equal(v.rows.length,100);assert.equal(v.count,129);assert.equal(v.rows[0].id,2);h.unmount();
});
test('hook ignores old route results, obsolete actions and unmounted requests',async()=>{
 const h=harness();let resolveOld,calls=0;const oldQuery=()=>({range:()=>{calls++;return new Promise(resolve=>{resolveOld=resolve;});}});
 const old=h.render({scope:'old',enabled:true,query:oldQuery});const current=fixture(items(2));h.render({scope:'new',enabled:true,query:current.query});let v=await h.settle();assert.deepEqual(v.rows,items(2));resolveOld({data:[{id:'stale'}]});v=await h.settle();assert.deepEqual(v.rows,items(2));await old.load();assert.equal(calls,1);h.unmount();await v.load();assert.equal(current.calls.length,1);
});
test('all 20 languages have a load-more label or explicit Chinese fallback; components parse',()=>{
 for(const lang of 'en ko ar bn de es fr hi id ja pt ru th tr vi zh it pl nl cs'.split(' ')){const data=require('../src/locales/'+lang+'/translation.json');assert(lang==='zh'||typeof data.load_more==='string');}
 for(const file of ['src/components/CommentBox.js','src/components/QuizCommentBox.js','src/hooks/useCommentWindow.js']){const source=fs.readFileSync(file,'utf8');assert.equal(ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JSX).parseDiagnostics.length,0);if(file.includes('components')){assert.match(source,/useCommentWindow/);assert.match(source,/加载更多/);assert.match(source,/order\("id", \{ ascending: false \}\)/);}}
});
