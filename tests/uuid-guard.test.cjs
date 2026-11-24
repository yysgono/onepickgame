const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../server.js'),'utf8');
const guard=source.slice(source.indexOf('const PUBLIC_DETAIL_UUID'),source.indexOf('const SUPABASE_URL'));
const api=source.slice(source.indexOf('app.get(\n  "/api/worldcup-seo/:id"'),source.indexOf('/*\n * =====================================================\n * 티어표 목록'));
function middleware(type){
 const marker=type==='tier-list'?' * 티어표 상세 페이지 서버 SEO':' * 월드컵 선택 페이지 서버 SEO';
 const start=source.indexOf('app.use(async (req, res, next)',source.indexOf(marker));
 const end=source.indexOf('\n});',start)+4;
 assert.ok(start>=0&&end>start);
 return source.slice(start,end);
}
const routes=[['api',api],['worldcup',middleware('worldcup')],['tier-list',middleware('tier-list')]];
const valid='d3cece18-68d7-4ecf-ad40-b08bd44ca992';
function setup(code,result){
 let handler, calls=[];
 const chain={select(){return this},eq(k,v){calls.push(['eq',k,v]);return this},is(){return this},async maybeSingle(){return result}};
 const app={get(_path,h){handler=h},use(h){handler=h}};
 const db={from(table){calls.push(['from',table]);return chain}};
 vm.runInNewContext(guard+code,{app,supabase:db,SUPPORTED_LANGS:['en','ko'],console:{error(){}}});
 assert.equal(typeof handler,'function');
 const res={code:200,headers:{},setHeader(k,v){this.headers[k]=v;return this},status(c){this.code=c;return this},send(body){this.body=body;return this},json(body){this.body=body;return this}};
 return {handler,calls,res};
}
for(const [name,code] of routes){
 const request=id=>({params:{id},query:{seo:name,lang:'ko',id}});
 test(name+' rejects malformed IDs before DB access',async()=>{
  for(const id of ['', 'invalid', valid+' unexpected input',valid+'/**/invalid',valid+'\nextra',[valid,valid]]){
   const {handler,calls,res}=setup(code,{data:null,error:null});
   await handler(request(id),res,()=>assert.fail('unexpected next'));
   assert.equal(res.code,400);assert.equal(calls.length,0);assert.equal(res.headers['Cache-Control'],'no-store');
  }
 });
 test(name+' preserves valid ID lookup and 404',async()=>{
  for(const id of [valid,valid.toUpperCase()]){
   const {handler,calls,res}=setup(code,{data:null,error:null});
   await handler(request(id),res,()=>assert.fail('unexpected next'));
   assert.equal(res.code,404);assert.equal(calls.length,2);assert.equal(calls[1][2],id);
  }
 });
 test(name+' preserves real database error as 500',async()=>{
  const {handler,calls,res}=setup(code,{data:null,error:new Error('database unavailable')});
  await handler(request(valid),res,()=>assert.fail('unexpected next'));
  assert.equal(res.code,500);assert.equal(calls.length,2);
 });
}
test('API preserves successful response',async()=>{
 const data={id:valid,title:'Test'};const {handler,res,calls}=setup(api,{data,error:null});
 await handler({params:{id:valid}},res);assert.equal(res.code,200);assert.equal(res.body,data);assert.equal(calls.length,2);
});
