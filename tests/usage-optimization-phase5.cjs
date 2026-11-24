const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
const {JSDOM}=require('jsdom');
const React=require('react');
const {act}=React;
const {createRoot}=require('react-dom/client');
const titles=require('../src/components/topNine/localizedTitle.cjs');
const templatePath=require.resolve('../seo-template.cjs');
const shell='<html><head><title>Old</title></head><body><div id="root"></div></body></html>';
require.cache[templatePath]={id:templatePath,filename:templatePath,loaded:true,exports:{loadSeoTemplate:async()=>shell}};
const route=require('../top-nine-board-routes.cjs');
const id='00000000-0000-4000-8000-000000000001',sourceId='00000000-0000-4000-8000-000000000002',origin='https://www.onepickgame.com';
const source={id:sourceId,title:'Source',title_translations:{ko:'원본',en:'Source'}};
const board={id,title:'Source - Nick',title_is_custom:true,slots:[{id:'a',name:'Candidate',src:'https://example.com/image.jpg'}],source_worldcup_ids:[sourceId],guest_nickname:'Nick'};
const fixture=()=>{
 let mode='public',row=board,handler;const calls=[];
 const client={from(table){calls.push(table);return {select(){return this},eq(){return this},in(){return this},is(){return this},maybeSingle:async()=>mode==='error'?{error:Error('offline')}:{data:mode==='public'?{...row}:null},then(resolve,reject){return Promise.resolve({data:table==='worldcups'?[source]:[{source_worldcup_id:sourceId,title_translations:{ko:'템플릿',en:'Source'}}]}).then(resolve,reject);}};},rpc:async()=>{calls.push('link');return {data:mode==='unlisted'?{title:row.title,slots:row.slots,names:true}:null};}};
 route({use:fn=>handler=fn},client,origin);
 return {calls,mode:v=>mode=v,row:v=>row=v,request:async(lang='ko')=>{const res={headers:{},statusCode:200,setHeader(k,v){this.headers[k]=v},status(v){this.statusCode=v;return this},type(){return this},send(v){this.body=v;return this}};await handler({path:`/${lang}/mytop9/${id}`,query:{}},res,()=>assert.fail('route not handled'));return res;}};
};
test('custom titles keep exactly the same HTML across all 20 languages while avoiding two title queries',async()=>{
 const f=fixture();const sources=[{...source,top_nine_title_translations:{ko:'템플릿',en:'Source'}}];
 for(const lang of Object.keys(require('../src/components/topNine/copy.json'))){const res=await f.request(lang);const old={...board,titleSources:sources,title:titles.localizedBoardTitle(board,sources,lang)};assert.equal(res.body,route.renderBoardHtml(shell,origin,lang,old));assert.equal(res.headers['Cache-Control'],'no-store');}
 assert.deepEqual([...new Set(f.calls)],['top_nine_public_boards']);
});
test('automatic titles still localize, and public visibility is rechecked on every request',async()=>{
 const f=fixture();f.row({...board,title_is_custom:false});let res=await f.request();assert.match(res.body,/템플릿 - Nick/);assert.deepEqual(f.calls,['top_nine_public_boards','worldcups','top_nine_templates']);
 f.mode('unlisted');res=await f.request();assert.equal(res.headers['Cache-Control'],'no-store');assert.equal(res.headers['X-Robots-Tag'],'noindex,follow');
 f.mode('deleted');res=await f.request();assert.equal(res.statusCode,404);assert.equal(res.headers['Cache-Control'],'no-store');
 f.mode('error');res=await f.request();assert.equal(res.statusCode,503);assert.equal(res.headers['Cache-Control'],'no-store');
});
test('real React comment hook loads, expands, updates and resets on route change',async()=>{
 const dom=new JSDOM('<div id="root"></div>');const saved={window:global.window,document:global.document,IS_REACT_ACT_ENVIRONMENT:global.IS_REACT_ACT_ENVIRONMENT};Object.assign(global,{window:dom.window,document:dom.window.document,IS_REACT_ACT_ENVIRONMENT:true});
 const code=ts.transpileModule(fs.readFileSync('src/hooks/useCommentWindow.js','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;
 const mod={exports:{}};new Function('require','module','exports',code)(name=>name==='react'?React:require('../src/utils/commentWindow'),mod,mod.exports);const useCommentWindow=mod.exports.default;
 const rows=Array.from({length:120},(_,i)=>({id:i+1}));let view,fail=false;const query=withCount=>({range:async(a,b)=>fail?{error:Error('offline')}:{data:rows.slice(a,b+1),count:withCount?rows.length:null}});const errors=[];
 function Component({scope}){view=useCommentWindow({scope,enabled:true,query,withCount:true,onError:e=>errors.push(e.message)});return React.createElement('output',null,view.rows.length);}
 const root=createRoot(document.getElementById('root'));
 try{await act(async()=>root.render(React.createElement(Component,{scope:'one'})));assert.equal(view.rows.length,50);assert.equal(view.count,120);assert(view.hasMore);
  fail=true;await act(async()=>view.more());assert.equal(view.rows.length,50);assert.deepEqual(errors,['offline']);fail=false;
  await act(async()=>view.more());assert.equal(view.rows.length,100);rows.shift();await act(async()=>view.load());assert.equal(view.rows[0].id,2);assert.equal(view.count,119);
  await act(async()=>root.render(React.createElement(Component,{scope:'two'})));assert.equal(view.rows.length,50);assert.equal(view.count,119);
 }finally{await act(async()=>root.unmount());dom.window.close();Object.assign(global,saved);}
});
