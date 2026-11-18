const assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const discovery=require('../src/seo/templateDiscovery');
const id='00000000-0000-4000-8000-000000000001',related='00000000-0000-4000-8000-000000000002',work='00000000-0000-4000-8000-000000000003';
const cup={id,title:'Source',title_translations:{ko:'원본 월드컵',en:'Source bracket'},category:'game',is_tier_preset:true,tier_preset_title_translations:{en:'Source tier'},data:[{name:'Photo',image:'https://example.com/p.jpg'}]};
let calls=[],failOptional=false,failPresets=false,privateReads=0;
const client={rpc:async name=>{assert.equal(name,'search_top_nine_sources');return {data:[{...cup,id:related,title:'Other',top_nine_title_translations:{en:'Other grid'}}]}},from(table){
 const q={table,fields:'',filters:[],single:false,cap:99},api={select(v){q.fields=v;return this},is(k,v){q.filters.push(r=>r[k]==v);return this},eq(k,v){q.filters.push(r=>r[k]===v);return this},in(k,v){q.filters.push(r=>v.includes(r[k]));return this},neq(k,v){q.filters.push(r=>r[k]!==v);return this},order(){return this},contains(k,v){assert.equal(k,'source_worldcup_ids');assert.deepEqual(typeof v==='string'?JSON.parse(v):v,[id]);return this},limit(n){q.cap=n;return this},abortSignal(){return this},maybeSingle(){q.single=true;return this},then(resolve,reject){
  calls.push(q);let data=[];
  if(table==='worldcups')data=q.single?[cup]:[{...cup,preview:cup.data[0]},{...cup,id:related,title:'Other',tier_preset_title_translations:{en:'Other tier'},preview:cup.data[0]},{...cup,id:'not-a-uuid'}];
  else if(table==='worldcup_card_previews')data=[{cup_id:id,image_urls:['https://example.com/p.jpg','https://example.com/q.jpg']}];
  else if(table==='worldcup_tier_preset_cards')data=[{...cup,id:related,title:'Other',tier_preset_title_translations:{en:'Other tier'},tier_preset_thumbnail_url:'https://example.com/tier.jpg'}];
  else if(table.endsWith('_thumbnails'))data=[{source_worldcup_id:related,image_url:'https://example.com/custom.jpg'}];
  else if(table==='top_nine_templates')data=[{title_translations:{en:'Source grid'},enabled:true}];
  else if(table.endsWith('_intros'))data=[{candidate_sources:[]}];
  else if(table==='tier_lists'||table==='top_nine_public_boards'){privateReads++;data=[{id:work,title:'<script>alert(1)</script> Public work',source_worldcup_id:id,view_count:12,thumbnail_url:'https://example.com/work.jpg',slots:Array(9).fill({src:'https://example.com/slot.jpg'})}];}
  data=data.filter(r=>q.filters.every(f=>f(r))).slice(0,q.cap);
  return Promise.resolve((failOptional&&!q.single||failPresets&&table==='worldcups'&&!q.single)?{error:Error('Optional unavailable')}:{data:q.single?data[0]||null:data}).then(resolve,reject);
 }};return api;
}};
const shell='<html><head><title>Old</title></head><body><div id="root"></div></body></html>';
const templatePath=require.resolve('../seo-template.cjs');require.cache[templatePath]={id:templatePath,filename:templatePath,loaded:true,exports:{loadSeoTemplate:async()=>shell}};
const templateRoute=require('../top-nine-template-routes.cjs'),tierListRoute=require('../tier-list-seo.cjs');
const response=()=>({statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v},status(v){this.statusCode=v;return this},type(){return this},send(v){this.body=v;return this}});
(async()=>{
 for(const kind of ['nine','tier']){
  const groups=await discovery.load(client,cup,kind,'en');assert.equal(groups.source.href,'/en/select-round/'+id);assert.equal(groups.works[0].href,'/en/'+(kind==='nine'?'mytop9':'tier-list')+'/'+work);assert.equal(groups.templates.length,1);assert.equal(groups.templates[0].image,'https://example.com/custom.jpg');assert(groups.source.images.length);assert(kind==='nine'?groups.works[0].slots.length===9:!!groups.works[0].image);assert(groups.templates[0].href.endsWith('/'+related));
  for(const lang of Object.keys(discovery.COPY)){
   const html=templateRoute.renderTemplateHtml(shell,'https://www.onepickgame.com',lang,cup,kind,groups),dom=new JSDOM(html),d=dom.window.document;
   assert.equal(d.querySelectorAll('h1').length,1);assert.equal(d.querySelector('meta[name=robots]').content,'index,follow');assert(d.querySelector('.template-discovery a[href*="select-round"]'));assert(d.querySelector('.template-discovery a[href$="'+work+'"]'));assert.equal(d.querySelectorAll('script:not([type="application/json"])').length,0);assert.equal(JSON.parse(d.getElementById('template-discovery-data').textContent).id,id);dom.window.close();
  }
 }
 assert(calls.every(q=>!q.fields.includes('candidates'))); // link queries never load private edit fields or candidate pools.
 let handler;templateRoute({use:fn=>handler=fn},client,'https://www.onepickgame.com');let res=response();await handler({path:'/en/mytop9/templates/'+id,query:{}},res,()=>assert.fail());assert.equal(res.statusCode,200);assert(res.body.includes('template-discovery-data'));
 const before=privateReads;res=response();await handler({path:'/en/tier-list/create/'+id,query:{edit:work}},res,()=>assert.fail());assert(res.body.includes('noindex,follow'));assert.equal(privateReads,before,'Edit views must not fetch public discovery works');
 tierListRoute({use:fn=>handler=fn},client,'https://www.onepickgame.com');res=response();await handler({query:{seo:'tier-list-list',lang:'en'}},res,()=>assert.fail());assert.equal(res.statusCode,200);assert(res.body.includes('/en/tier-list/create/'+related));assert(res.body.includes('Other tier'));assert(!res.body.includes('/create/not-a-uuid'));
 const count=calls.length;res=response();await handler({query:{seo:'tier-list-list',lang:'en',mine:'1'}},res,()=>assert.fail());assert(res.body.includes('noindex'));assert.equal(calls.length,count,'Personal lists must not request public preset metadata');
 failPresets=true;res=response();await handler({query:{seo:'tier-list-list',lang:'en'}},res,()=>assert.fail());assert.equal(res.statusCode,200);assert.equal(res.headers['Cache-Control'],'no-store');assert(!res.body.includes('/en/tier-list/create/'+related));failPresets=false;
 failOptional=true;res=response();await handler({query:{seo:'tier-list-list',lang:'en'}},res,()=>assert.fail());assert.equal(res.statusCode,503); // main list also failed, preserve existing error behavior.
 console.log('PASS: server preset links, original/works/related relationships, 20 languages, JSON/HTML escaping, valid IDs, edit/private exclusion and list failure semantics.');
})().catch(error=>{console.error(error);process.exitCode=1});
