const fs=require('fs'),assert=require('assert/strict'),babel=require('@babel/core'),{JSDOM}=require('jsdom');
const dom=new JSDOM('<div id="root"></div>');global.window=dom.window;global.document=window.document;global.IS_REACT_ACT_ENVIRONMENT=true;window.confirm=()=>true;
const React=require('react'),{act}=React,{createRoot}=require('react-dom/client'),{Simulate}=require('react-dom/test-utils');
function load(file,mocks){const m={exports:{}};new Function('require','module','exports',babel.transformSync(fs.readFileSync(file,'utf8'),{presets:[['@babel/preset-env',{targets:{node:'current'}}],'@babel/preset-react'],configFile:false,babelrc:false}).code)(name=>mocks[name],m,m.exports);return m.exports;}
const core=load('src/components/topNine/core.js',{'../../utils/originalStorageImageUrl':{originalStorageImageUrl:x=>x}}),copy=require('../src/components/topNine/copy.json');
const rows=[{id:'own',author_id:'owner',title:'Own'},{id:'other',author_id:'other',title:'Other'},{id:'guest',author_id:null,title:'Guest'}].map(row=>({...row,slots:Array(9).fill({id:'photo',src:'https://example.com/a.jpg'}),show_names:false}));
let deleteArgs;
const supabase={auth:{getUser:async()=>({data:{user:{id:'owner'}}})},from:()=>({select(){return this},order(){return this},async range(){return {data:rows}}}),rpc:async(name,args)=>{if(name==='get_top_nine_guest_salt')return {data:'salt'};if(name==='delete_top_nine_guest_board'){deleteArgs=args;return {data:true}};throw Error(name)}};
const Component=load('src/components/topNine/PublicBoards.js',{react:React,'react-dom':require('react-dom'),'react-router-dom':{Link:props=>React.createElement('a',{href:props.to,className:props.className},props.children)},'./publicTitle':{},'./memberImages':{},'./copy.json':copy,'./guestProof':{guestProof:async()=> 'proof'},'../../utils/supabaseClient':{supabase},'./core':core,'./media':{isVideo:()=>false},'../../badwords-multilang':{hasBadword:()=>false}}).default;
(async()=>{const root=createRoot(document.getElementById('root'));await act(async()=>root.render(React.createElement(Component,{lang:'ko'})));
const edits=[...document.querySelectorAll('.tn-public-edit-link')];assert.equal(edits.length,2);assert(edits.some(link=>link.getAttribute('href')==='/ko/mytop9/own?edit=1'));assert(!edits.some(link=>link.getAttribute('href').includes('/other')));
const guest=[...document.querySelectorAll('article')].find(article=>article.textContent.includes('Guest'));
await act(async()=>Simulate.click(guest.querySelector('button')));await act(async()=>Simulate.change(document.querySelector('input[type=password]'),{target:{value:'password123'}}));await act(async()=>Simulate.submit(document.querySelector('form')));
assert.deepEqual(deleteArgs,{p_id:'guest',p_proof:'proof'});assert.equal(document.querySelectorAll('article').length,2);
await act(async()=>root.unmount());console.log('Gallery: owner/guest edit links, other-author exclusion and guest deletion arguments passed.');
})().catch(error=>{console.error(error);process.exitCode=1});
