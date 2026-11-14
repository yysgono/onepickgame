const fs=require('fs'),assert=require('node:assert/strict'),babel=require('@babel/core'),{JSDOM}=require('jsdom');
const dom=new JSDOM('<button id="opener">open</button><div id="root"></div>',{url:'https://example.com/en/tier-list'});
Object.assign(global,{window:dom.window,document:dom.window.document,IS_REACT_ACT_ENVIRONMENT:true});
const React=require('react'),{act}=React,{createRoot}=require('react-dom/client'),{Simulate}=require('react-dom/test-utils');
function load(file,mocks={}){const m={exports:{}};new Function('require','module','exports',babel.transformSync(fs.readFileSync(file,'utf8'),{presets:[['@babel/preset-env',{targets:{node:'current'}}],'@babel/preset-react'],configFile:false,babelrc:false}).code)(key=>{if(key in mocks)return mocks[key];throw Error('Missing mock '+key)},m,m.exports);return m.exports;}
const helpers=load('src/utils/tierRecommendedCandidates.js'),copy=require('../src/components/tierList/recommendedImageCopy.json');
let requests=0,fail=false,waitResolve=null,added=[];const rows=Array.from({length:42},(_,i)=>({id:'source-'+i,title:'Original '+i,title_translations:{en:'Tournament '+i,ko:'월드컵 '+i}}));
const client={from:()=>({select(fields){assert.equal(fields,'id,title,title_translations,data');return this},eq(){return this},is(){return this},maybeSingle(){requests++;if(waitResolve)return new Promise(resolve=>{waitResolve.resolve=resolve;});return Promise.resolve(fail?{error:Error('offline')}:{data:{id:'source-0',data:[...Array.from({length:49},(_,i)=>({id:i,name:'Candidate '+i,image:'https://example.com/'+i+'.jpg'})),{id:100,name:'Bad',image:'javascript:alert(1)'}]}})}})};
const Picker=load('src/components/tierList/RecommendedImagePicker.js',{react:React,'react-dom':require('react-dom'),'../../utils/supabaseClient':{supabase:client},'../../utils/tierSourceCatalogue':{loadTierSourceCatalogue:async()=>rows},'../../utils/tierRecommendedCandidates':helpers,'./recommendedImageCopy.json':copy,'./recommendedImagePicker.css':{}}).default;
const root=createRoot(document.getElementById('root'));let closed=0;
const click=async node=>{assert(node);await act(async()=>Simulate.click(node))};
const render=async key=>act(async()=>root.render(React.createElement(Picker,{key,lang:'en',onAdd:items=>added.push(...items),onClose:()=>closed++})));
(async()=>{
 const existing={id:'local',image:'blob:existing',_tierKey:'local',name:'My image'};
 const incoming=helpers.recommendedCandidates({id:'cup',data:[{id:1,image:'https://example.com/a.jpg',name_translations:{en:'English',ko:'한국어'}},{id:2,image:'javascript:x'},{id:3,image_url:'https://example.com/a.jpg'}]},'ko');
 assert.equal(incoming.length,2);assert.equal(incoming[0].name,'한국어');
 assert.equal(helpers.additionsFromWorldcup([existing],incoming).length,1);assert.equal(existing.image,'blob:existing');
 assert.equal(helpers.additionsFromWorldcup([existing],incoming,1).length,0);
 assert.equal(helpers.worldcupTitle({title_translations:'{"ko":"제목"}'},'ko'),'제목');
 document.getElementById('opener').focus();await render('initial');assert.equal(requests,0);assert.equal(document.querySelectorAll('.tier-recommended-titles button').length,30);assert.equal(document.querySelectorAll('[role=dialog] img,[role=dialog] video').length,0);
 await click(document.querySelector('.tier-recommended-more'));assert.equal(document.querySelectorAll('.tier-recommended-titles button').length,42);
 await act(async()=>Simulate.change(document.querySelector('input'),{target:{value:'월드컵 41'}}));assert.equal(document.querySelectorAll('.tier-recommended-titles button').length,1);assert(document.querySelector('.tier-recommended-titles').textContent.includes('Tournament 41'));
 fail=true;await click(document.querySelector('.tier-recommended-titles button'));assert(document.querySelector('[role=alert]'));assert.equal(added.length,0);assert.equal(closed,0);
 fail=false;await click(document.querySelector('.tier-recommended-titles button'));assert.equal(added.length,0);assert.equal(closed,0);
 assert.equal(document.querySelectorAll('input[type=checkbox]').length,24);assert(document.querySelector('.tier-recommended-import button').disabled);
 const action=text=>[...document.querySelectorAll('button')].find(node=>node.textContent===text);
 await click(action(copy.en.selectAll));assert.equal(document.querySelector('.tier-recommended-import button').textContent,copy.en.importSelected+' (49)');
 await click(document.querySelector('.tier-recommended-more'));assert.equal(document.querySelectorAll('input[type=checkbox]').length,48);assert([...document.querySelectorAll('input[type=checkbox]')].every(node=>node.checked));
 await click(document.querySelector('.tier-recommended-more'));assert.equal(document.querySelectorAll('input[type=checkbox]').length,49);
 await click(action(copy.en.clearAll));assert([...document.querySelectorAll('input[type=checkbox]')].every(node=>!node.checked));
 for(const node of [...document.querySelectorAll('input[type=checkbox]')].slice(0,2))await act(async()=>Simulate.change(node,{target:{checked:true}}));
 await click(document.querySelector('.tier-recommended-import button'));assert.equal(added.length,2);assert.equal(added[0].name,'Candidate 0');assert.equal(added[1].name,'Candidate 1');assert.equal(closed,1);
 await act(async()=>root.render(null));assert.equal(document.activeElement.id,'opener');
 waitResolve={};await render('cancel');await click(document.querySelector('.tier-recommended-titles button'));await act(async()=>root.render(null));await act(async()=>waitResolve.resolve({data:{id:'source-0',data:[{image:'https://example.com/late.jpg'}]}}));assert.equal(added.length,2);
 for(const lang of Object.keys(copy)){for(const field of ['title','help','search','close','retry','loading','empty','more','error','added','unchanged','selectAll','clearAll','importSelected','back','candidateSearch'])assert(copy[lang][field]);}
 await act(async()=>root.unmount());dom.window.close();console.log('PASS: title-only list, multilingual search, pagination in batches of 24, select all including hidden candidates, deselect all, selected-only import, deferred candidate load, failed import recovery, late-response cancellation, source keys, media validation, deduplication, limit, focus restoration and 20 locales.');
})().catch(error=>{console.error(error);process.exitCode=1});
