const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),babel=require('@babel/core');
const {JSDOM}=require('jsdom');const dom=new JSDOM('<div id="root"></div>',{url:'https://www.onepickgame.com/ko/worldcup-maker',pretendToBeVisual:true});
Object.assign(global,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement});global.IS_REACT_ACT_ENVIRONMENT=true;
const React=require('react'),{createRoot}=require('react-dom/client'),{act,Simulate}=require('react-dom/test-utils');
const cups={a:[{id:'old1',name:'Alpha',image:'https://images.example/a.webp'},{id:'old2',name:'Beta',image:'https://images.example/b.webp'}],b:[{name:'Beta',image:'https://images.example/b.webp'},{name:'Gamma',image:'https://images.example/c.webp'}],c:[{name:'Delta',image:'https://images.example/d.webp'}]};
let detailCalls=0,deleted=[],deny=false;
const client={from(table){let id,operation='select';const q={select(){return q},eq(k,v){if(k==='id')id=v;return q},is(){return q},not(){return q},abortSignal(){return q},delete(){operation='delete';return q},async single(){if(cups[id]){detailCalls++;return{data:{id,data:cups[id]}};}return{data:{id,data:cups.a,deleted_at:'2026-10-01'}};},then(resolve,reject){if(operation==='delete'){if(deny)return Promise.resolve({error:Error('permission denied')}).then(resolve,reject);deleted.push({table,id});}return Promise.resolve({data:null,error:null}).then(resolve,reject);}};return q},get storage(){throw Error('Image storage must not be touched');}};
const cache={};function load(file){file=path.resolve(file);if(cache[file])return cache[file].exports;const mod={exports:{}};cache[file]=mod;const code=babel.transformSync(fs.readFileSync(file,'utf8'),{filename:file,presets:[['@babel/preset-env',{targets:{node:'current'}}],['@babel/preset-react',{runtime:'classic'}]],babelrc:false,configFile:false}).code;new Function('require','module','exports',code)(name=>{
 if(name.endsWith('.css'))return{};
 if(name==='react-i18next')return{useTranslation:()=>({i18n:{resolvedLanguage:'ko'}})};
 if(name.endsWith('/supabaseClient')||name==='./supabaseClient')return{supabase:client};
 if(name==='./statsCache')return{invalidateStatsCache:()=>{}};
 if(name==='./randomPick/api')return{searchCups:async search=>Object.keys(cups).filter(id=>!search||id===search).map(id=>({id,title:'Cup '+id,title_translations:{ko:'월드컵 '+id}}))};
 if(name.startsWith('.')){let target=path.resolve(path.dirname(file),name);if(target.endsWith('.json'))return require(target);if(!path.extname(target))target+='.js';return load(target);}return require(name);
},mod,mod.exports);return mod.exports;}
const {mergeImportedCandidates,importableCandidates}=load('src/utils/worldcupCandidateImport.js');let serial=0;const nextId=()=>`new-${++serial}`;
(async()=>{
 assert.deepEqual(importableCandidates('{bad'),[]);assert.equal(importableCandidates([{name:'A',image:'javascript:alert(1)'},{name:'B',image:'blob:test'},...cups.a]).length,2);
 const draft={id:'draft',name:'Keep typed title',image:'',file:null};let result=mergeImportedCandidates([draft,{name:'',image:'',file:null}],cups.a,nextId);assert.equal(result.rows[0],draft);assert.equal(result.added,2);assert(result.rows.every(row=>!row.file));assert(!result.rows.some(row=>row.id==='old1'));
 result=mergeImportedCandidates(result.rows,cups.b,nextId);assert.equal(result.added,1);assert.equal(result.duplicates,1);assert.equal(result.rows.length,4);
 const limited=mergeImportedCandidates(result.rows,cups.c,nextId,4);assert.equal(limited.overflow,1);assert.equal(limited.rows.length,4);
 let combined=[],last;const Page=load('src/components/WorldcupCandidateImporter.js').default;const root=createRoot(document.getElementById('root'));
 const wait=ms=>new Promise(r=>setTimeout(r,ms));const click=async node=>{assert(node);await act(async()=>{Simulate.click(node);await wait(5);});};const button=text=>[...document.querySelectorAll('button')].find(n=>n.textContent===text);
 await act(async()=>{root.render(React.createElement(Page,{onImport:rows=>{last=mergeImportedCandidates(combined,rows,nextId);combined=last.rows;return last;}}));});
 await click(document.querySelector('.wci-open'));await act(async()=>{await wait(330);});assert.equal(document.querySelectorAll('.wci-games button').length,3);
 for(const id of ['a','b','c']){
  await click(button('월드컵 '+id));assert.equal(document.querySelectorAll('input[type=checkbox]').length,cups[id].length);assert.equal(document.querySelectorAll('.wci-dialog img').length,0);
  await click(document.querySelector('.wci-add'));if(id==='b')assert.equal(last.duplicates,1);
  await click([...document.querySelectorAll('button')].find(n=>n.textContent==='← 월드컵 목록으로'));await act(async()=>{await wait(330);});
 }
 assert.deepEqual(combined.map(row=>row.name),['Alpha','Beta','Gamma','Delta']);assert.equal(detailCalls,3);
 await click(button('월드컵 a'));await click(button('전체 제외'));assert(document.querySelector('.wci-add').disabled);await click(button('전체 선택'));assert(!document.querySelector('.wci-add').disabled);await click(document.querySelector('.wci-add'));assert.equal(last.added,0);assert.equal(last.duplicates,2);
 await click(button('닫기'));assert.equal(document.body.style.overflow,'');assert(!document.querySelector('[role=dialog]'));
 await act(async()=>root.unmount());
 console.log('PASS: combine A+B+C, preserve drafts, fresh IDs, deduplicate/retry, limit, URL-only import, selection controls, close cleanup');
})().catch(error=>{console.error(error);process.exitCode=1});
