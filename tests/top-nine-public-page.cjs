const fs=require('fs'),assert=require('assert/strict'),babel=require('@babel/core'),{JSDOM}=require('jsdom');
const dom=new JSDOM('<div id="root"></div>',{url:'https://www.onepickgame.com/ko/mytop9/00000000-0000-4000-8000-000000000001'});
global.window=dom.window;global.document=window.document;global.navigator=window.navigator;global.IS_REACT_ACT_ENVIRONMENT=true;
const React=require('react'),{act}=React,{createRoot}=require('react-dom/client');
function load(file,mocks){const mod={exports:{}};new Function('require','module','exports',babel.transformSync(fs.readFileSync(file,'utf8'),{presets:[['@babel/preset-env',{targets:{node:'current'}}],'@babel/preset-react'],configFile:false,babelrc:false}).code)(name=>mocks[name],mod,mod.exports);return mod.exports;}
const core=load('src/components/topNine/core.js',{'../../utils/originalStorageImageUrl':{originalStorageImageUrl:s=>s}});
const id='00000000-0000-4000-8000-000000000001';
let mode='found',opened,navigated,seo;
const data={id,title:'닉네임 - 영화',show_names:true,slots:Array(9).fill({id:'tn-empty-cell',src:'https://www.onepickgame.com/top-nine-empty.png'})};
data.slots[4]={id:'film',name:'Movie',src:'https://example.com/film.jpg'};
const api={from:()=>({select(){return this},eq(key,value){assert.equal(value,id);return this},async maybeSingle(){return mode==='found'?{data}:mode==='missing'?{data:null}:{error:{message:'offline'}}}})};
const Component=load('src/components/topNine/PublicBoardPage.js',{react:React,'react-router-dom':{useParams:()=>({lang:'ko',id}),useNavigate:()=>url=>navigated=url,Link:props=>React.createElement('a',{href:props.to},props.children)},'../TopNinePage':{default:props=>{opened=props;return React.createElement('h1',null,props.publicBoard.title)},__esModule:true},'../../seo/Seo':{default:props=>{seo=props;return null},__esModule:true},'../../utils/supabaseClient':{supabase:api},'./core':core,'./copy.json':require('../src/components/topNine/copy.json')}).default;
(async()=>{
 const root=createRoot(document.getElementById('root'));
 await act(async()=>root.render(React.createElement(Component)));
 assert.equal(opened.publicId,id);assert.equal(opened.publicBoard.title,data.title);assert.equal(opened.publicBoard.slots.filter(Boolean).length,1);opened.onHome();assert.equal(navigated,'/ko/mytop9');
 mode='missing';await act(async()=>root.render(React.createElement(Component,{key:'missing'})));assert.equal(seo.indexable,false);assert(!document.querySelector('h1'));
 mode='error';await act(async()=>root.render(React.createElement(Component,{key:'error'})));assert(document.querySelector('button'));await act(async()=>root.unmount());
 const route=require('../top-nine-board-routes.cjs');let handler;
 route({use:fn=>handler=fn},api,'https://www.onepickgame.com');
 async function request(boardId){
  const response={statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v},status(v){this.statusCode=v;return this},type(){return this},send(v){this.body=v;return this}};
  await handler({path:'/ko/mytop9/'+boardId,query:{}},response,()=>{throw Error('Unexpected fallback')});return response;
 }
 assert.equal((await request('invalid')).statusCode,404);mode='missing';assert.equal((await request(id)).statusCode,404);mode='error';assert.equal((await request(id)).statusCode,503);
 mode='found';const response=await request(id);assert.equal(response.statusCode,200);assert(response.body.includes('<title data-rh="true">닉네임 - 영화 | One Pick Game</title>'));assert(response.body.includes('/ko/mytop9/'+id));assert.equal(response.headers['Cache-Control'],'no-store');
 console.log('Public board: load, empty cells, home route, missing/error pages, HTTP 404/503 and server title/canonical passed.');
})().catch(error=>{console.error(error);process.exitCode=1});
