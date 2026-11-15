const fs=require('fs'),assert=require('node:assert/strict'),babel=require('@babel/core'),{JSDOM}=require('jsdom');
function load(file,mocks={}){const m={exports:{}};new Function('require','module','exports',babel.transformSync(fs.readFileSync(file,'utf8'),{presets:[['@babel/preset-env',{targets:{node:'current'}}],'@babel/preset-react'],configFile:false,babelrc:false}).code)(name=>{if(name in mocks)return mocks[name];throw Error('Missing '+name);},m,m.exports);return m.exports;}
const dom=new JSDOM('<div id="root"></div>',{url:'https://www.onepickgame.com/ko/mytop9'});Object.assign(global,{window:dom.window,document:dom.window.document,sessionStorage:dom.window.sessionStorage,IS_REACT_ACT_ENVIRONMENT:true});
Object.defineProperty(global,'navigator',{value:dom.window.navigator,configurable:true});Object.defineProperty(global,'crypto',{value:require('node:crypto').webcrypto,configurable:true});
const React=require('react'),{act}=React,{createRoot}=require('react-dom/client'),{Simulate}=require('react-dom/test-utils');
const links=load('src/components/sharing/shareLinks.js'),copy=require('../src/components/sharing/copy.json');
const Social=load('src/components/sharing/SocialShareButtons.js',{react:React,'./shareLinks':links,'./copy.json':copy,'./socialShare.css':{}}).default;
(async()=>{
 const root=createRoot(document.getElementById('root')),title='최애 & My Top 9 / 🌟',url='https://www.onepickgame.com/ko/mytop9/a?x=1&y=2';let copied;
 navigator.clipboard={writeText:async text=>{copied=text;}};
 for(const lang of Object.keys(require('../src/components/topNine/copy.json'))){
  await act(async()=>root.render(React.createElement(Social,{title,url,lang})));
  const [x,threads]=document.querySelectorAll('.opg-social-share a');
  assert.equal(new URL(x.href).searchParams.get('text'),title);assert.equal(new URL(x.href).searchParams.get('url'),url);
  assert.equal(new URL(threads.href).searchParams.get('text'),title+'\n'+url);assert.equal(x.target,'_blank');assert(x.rel.includes('noopener'));
  assert.equal(document.querySelector('.opg-share-kakao'),null,'Do not show a broken Kakao button without a key');
  await act(async()=>Simulate.click(document.querySelector('.opg-social-share>button:not(.opg-share-instagram)')));assert.equal(copied,url);assert.equal(document.querySelector('[role=status]').textContent,copy[lang].copied);
 }
 navigator.clipboard.writeText=async()=>{throw Error('denied');};document.execCommand=()=>true;assert.equal(await links.copyShareUrl(url),true);assert.equal(document.querySelector('textarea'),null);
 document.execCommand=()=>false;assert.equal(await links.copyShareUrl(url),false);assert.throws(()=>links.shareLinks(title,'javascript:alert(1)'));
 await act(async()=>root.render(React.createElement(Social,{title,url:'data:text/plain,private',lang:'ko'})));assert.equal(document.querySelector('.opg-social-share'),null);
 // One RPC for simultaneous mounts and revisits; resolved database errors must
 // surface, remain retryable, and never mark the board successfully counted.
 const tracker=load('src/components/topNine/viewTracking.js'),id='a1111111-1111-4111-8111-111111111111';let calls=0;
 const client={rpc:async(name,params)=>{calls++;assert.equal(name,'record_top_nine_view_v2');assert.match(params.p_visitor,/^[a-f0-9-]{36}$/);return{};}};
 await Promise.all([tracker.recordBoardView(client,id),tracker.recordBoardView(client,id)]);assert.equal(calls,1);await tracker.recordBoardView(client,id);assert.equal(calls,1);
 const retryId='b2222222-2222-4222-8222-222222222222';await assert.rejects(tracker.recordBoardView({rpc:async()=>({error:Error('permission denied')})},retryId));assert.equal(await tracker.recordBoardView(client,retryId),true);
 const storage=Object.getOwnPropertyDescriptor(global,'sessionStorage');Object.defineProperty(global,'sessionStorage',{configurable:true,get(){throw Error('blocked')}});await tracker.recordBoardView(client,'c3333333-3333-4333-8333-333333333333');Object.defineProperty(global,'sessionStorage',storage);assert.equal(await tracker.recordBoardView(client,'short-unlisted-id'),false);
 // Native sharing uses the system picker; it does not target or auto-post
 // to Instagram. Cancellation never copies or reports a successful post.
 await act(async()=>root.render(React.createElement(Social,{title,url,lang:'ko'})));
 let payload; navigator.share=async value=>{payload=value;};
 await act(async()=>Simulate.click(document.querySelector('.opg-share-instagram')));assert.deepEqual(payload,{title,text:title,url});assert.equal(document.querySelector('[role=status]').textContent,copy.ko.instagramHelp);
 navigator.share=async()=>{throw Object.assign(Error('cancelled'),{name:'AbortError'});};copied='untouched';
 await act(async()=>Simulate.click(document.querySelector('.opg-share-instagram')));assert.equal(document.querySelector('[role=status]'),null);assert.equal(copied,'untouched');
 delete navigator.share;navigator.clipboard.writeText=async text=>{copied=text;};
 await act(async()=>Simulate.click(document.querySelector('.opg-share-instagram')));assert.equal(copied,url);assert.equal(document.querySelector('[role=status]').textContent,copy.ko.instagramCopied);
 navigator.share=async()=>{throw Error('unsupported')};
 await act(async()=>Simulate.click(document.querySelector('.opg-share-instagram')));assert.equal(document.querySelector('[role=status]').textContent,copy.ko.instagramCopied);delete navigator.share;
 let queries=[];const data=Array.from({length:15},(_,i)=>({id:String(i),title:'Board '+i,created_at:15-i,slots:Array(9).fill({id:'p',src:'https://example.com/p.jpg'}),view_count:i===14?100:0}));
 const db={auth:{getUser:async()=>({data:{user:null}})},rpc:async()=>({data:false}),from:()=>{
  const q={orders:[],select(){return q},eq(){return q},order(key,options){q.orders.push([key,options]);return q},range(start,end){queries.push({orders:q.orders,start,end});const rows=[...data].sort((a,b)=>{for(const [key,options]of q.orders){const direction=options?.ascending===false?-1:1;if(a[key]!==b[key])return(a[key]<b[key]?-1:1)*direction;}return 0;});return Promise.resolve({data:rows.slice(start,end+1)});}};return q;
 }};
 const noop=()=>null;
 const Gallery=load('src/components/topNine/PublicBoards.js',{'./gallerySortCopy.json':require('../src/components/topNine/gallerySortCopy.json'),'./collageLayout.js':{layouts:Array(9).fill({style:{}}),boundaryPath:''},'./guestEditSession':{},'./guestOwnership':{ownsGuestBoard:()=>false},'./categoryLabels.json':{en:{all:'All'}},'./localizedTitle':{localizedBoardTitle:row=>row.title,loadBoardTitleSources:async()=>[]},'react-router-dom':{Link:p=>React.createElement('a',{href:p.to,className:p.className},p.children)},'react-dom':require('react-dom'),'./publicTitle':{},'./memberImages':{},'./copy.json':require('../src/components/topNine/copy.json'),'./guestProof':{},react:React,'../../utils/supabaseClient':{supabase:db},'./core':{makeShareHash:slots=>slots,readShared:slots=>({slots}),isShareable:()=>true},'./media':{isVideo:()=>false},'../../badwords-multilang':{hasBadword:()=>false}}).default;
 await act(async()=>root.render(React.createElement(Gallery,{lang:'en'})));assert.equal(document.querySelector('.tn-public-card-link strong').textContent,'Board 0');assert.equal(document.querySelectorAll('.tn-public-card-link').length,12);
 await act(async()=>Simulate.click(document.querySelector('.tn-gallery-more')));assert.equal(document.querySelectorAll('.tn-public-card-link').length,15);
 await act(async()=>Simulate.click(document.querySelector('.tn-sort-filters button')));assert.equal(document.querySelector('.tn-public-card-link strong').textContent,'Board 14');assert.equal(document.querySelectorAll('.tn-public-card-link').length,12);assert.equal(queries.at(-1).start,0);assert.deepEqual(queries.at(-1).orders[0],['view_count',{ascending:false,nullsFirst:false}]);
 assert.equal(document.querySelector('.tn-board-views'),null);assert.equal(document.querySelector('.tn-public-cards article>small'),null);
 await act(async()=>Simulate.click(document.querySelectorAll('.tn-sort-filters button')[1]));assert.equal(document.querySelector('.tn-public-card-link strong').textContent,'Board 0');
 await act(async()=>root.unmount());dom.window.close();console.log('PASS: 20-language direct share links and copy fallback, private URLs blocked, view RPC dedup/error/retry/storage fallback, and gallery latest/popular sorting with pagination reset.');
})().catch(error=>{console.error(error);process.exitCode=1});
