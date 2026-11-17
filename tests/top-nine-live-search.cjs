const fs=require('fs'),assert=require('node:assert/strict'),babel=require('@babel/core'),{JSDOM}=require('jsdom');
const dom=new JSDOM('<div id="root"></div>');Object.assign(global,{window:dom.window,document:dom.window.document,IS_REACT_ACT_ENVIRONMENT:true});const React=require('react'),{act}=React,{createRoot}=require('react-dom/client');
const m={exports:{}};new Function('require','module','exports',babel.transformSync(fs.readFileSync('src/hooks/useTopNineLiveSearch.js','utf8'),{presets:[['@babel/preset-env',{targets:{node:'current'}}]],configFile:false,babelrc:false}).code)(()=>React,m,m.exports);
let state,calls=[],slow,append;
const fetchRows=(term,offset,{signal})=>{calls.push({term,offset,signal});if(term==='slow')return new Promise(r=>slow=r);if(term==='many'&&offset===30)return new Promise(r=>append=r);return Promise.resolve(term==='many'?Array.from({length:30},(_,i)=>({id:'many-'+i})):[{id:term}]);};
function Harness(props){state=m.exports.default(props.query,fetchRows,{composing:props.composing,delay:25});return React.createElement('div',null,state.rows.map(row=>row.id).join(','));}
const root=createRoot(document.getElementById('root')),render=(query,composing=false)=>act(async()=>root.render(React.createElement(Harness,{query,composing}))),wait=ms=>act(async()=>new Promise(r=>setTimeout(r,ms)));
(async()=>{
 await render('r');await render('ro');await wait(40);assert.deepEqual(calls.map(c=>c.term),['ro']);assert.equal(state.rows[0].id,'ro');
 await render('slow');await wait(40);assert(slow);await render('fast');await wait(40);await act(async()=>slow([{id:'stale'}]));assert.equal(state.rows[0].id,'fast');assert(calls.find(c=>c.term==='slow').signal.aborted);
 const before=calls.length;await render('로ㅂ',true);await wait(40);assert.equal(calls.length,before);await render('로블록스',true);await wait(40);assert.equal(calls.at(-1).term,'로블록스');const composed=calls.length;await render('로블록스',false);await wait(40);assert.equal(calls.length,composed);
 await render('instant');await act(async()=>state.submit());await wait(8);assert.equal(calls.at(-1).term,'instant');
 await render('many');await wait(40);assert.equal(state.rows.length,30);assert(state.more);await act(async()=>{state.loadMore();});assert(append);await render('new query');await wait(40);await act(async()=>append([{id:'old page'}]));assert.equal(state.rows[0].id,'new query');
 await render('');assert.equal(state.term,'');assert.equal(state.rows.length,0);assert(!state.more);await act(async()=>root.unmount());dom.window.close();console.log('PASS: debounced typing, IME composition, immediate submit, old-result and old-page rejection, request abort and clearing search.');
})().catch(error=>{console.error(error);process.exitCode=1});
