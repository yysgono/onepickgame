const fs=require('node:fs'),assert=require('node:assert/strict'),babel=require('@babel/core'),{JSDOM}=require('jsdom');
const dom=new JSDOM('<div id="root"></div>');Object.assign(global,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,IS_REACT_ACT_ENVIRONMENT:true});
const React=require('react'),{act}=React,{createRoot}=require('react-dom/client'),{Simulate}=require('react-dom/test-utils');
let stored=['Alpha','Beta','Charlie','Delta','Echo','Unused'].map((title,i)=>({id:String(i),title,title_translations:{ko:title},is_tier_preset:i<5,tier_preset_order:i<5?i+1:null,tier_preset_title_translations:{en:title+' tier'}}));
const updates=[];const supabase={from:table=>{assert.equal(table,'worldcups');return {select:()=>({is:()=>({order:async()=>({data:structuredClone(stored)})})}),update:payload=>({eq:async(key,id)=>{assert.equal(key,'id');updates.push({id,payload});stored=stored.map(row=>row.id===id?{...row,...payload}:row);return {};}})};}};
const mod={exports:{}};new Function('require','module','exports',babel.transformSync(fs.readFileSync('src/components/TierPresetAdmin.js','utf8'),{presets:[['@babel/preset-env',{targets:{node:'current'}}],'@babel/preset-react'],babelrc:false,configFile:false}).code)(key=>key==='react'?React:{supabase},mod,mod.exports);
const root=createRoot(document.getElementById('root')),row=id=>document.querySelector(`[data-preset-id="${id}"]`),order=()=>[...document.querySelectorAll('[data-preset-id]')].filter(el=>el.querySelector('[draggable]')).map(el=>el.dataset.presetId);
const transfer={setData(){},setDragImage(){}};
async function drag(source,target,after){await act(async()=>Simulate.dragStart(row(source).querySelector('[draggable]'),{dataTransfer:transfer}));await act(async()=>Simulate.dragOver(row(target),{dataTransfer:transfer,clientY:after?1:-1}));await act(async()=>Simulate.drop(row(target),{dataTransfer:transfer,clientY:after?1:-1}));await act(async()=>Simulate.dragEnd(row(source).querySelector('[draggable]')));}
(async()=>{
 await act(async()=>root.render(React.createElement(mod.exports.default)));
 assert.deepEqual(order(),['0','1','2','3','4']);assert.equal(updates.length,0);
 await act(async()=>Simulate.change(row('2').querySelector('input[type="text"],input[placeholder]'),{target:{value:'차분한 추천 제목'}}));
 await drag('0','2',true);assert.deepEqual(order(),['1','2','0','3','4']);
 assert.equal(row('2').querySelector('input[placeholder]').value,'차분한 추천 제목');
 await drag('4','1',false);assert.deepEqual(order(),['4','1','2','0','3']);
 // Canceled and external drags must not change the order.
 await act(async()=>Simulate.dragStart(row('0').querySelector('[draggable]'),{dataTransfer:transfer}));await act(async()=>Simulate.dragEnd(row('0').querySelector('[draggable]')));
 await act(async()=>Simulate.drop(row('4'),{dataTransfer:transfer,clientY:-1}));assert.deepEqual(order(),['4','1','2','0','3']);
 const more=[...document.querySelectorAll('button')].find(b=>b.textContent.includes('더보기'));await act(async()=>Simulate.click(more));
 await drag('0','5',false);assert.deepEqual(order(),['4','1','2','0','3']);assert.equal(row('5').querySelector('[draggable]'),null);
 const search=document.querySelector('input[placeholder="월드컵 제목 검색"]');await act(async()=>Simulate.change(search,{target:{value:'a'}}));
 await drag('3','1',false);assert.deepEqual(order(),['3','1','2','0']);
 await act(async()=>Simulate.change(search,{target:{value:''}}));assert.deepEqual(order(),['4','3','1','2','0']);
 await act(async()=>Simulate.click(row('4').querySelector('[aria-label="Echo 아래로"]')));assert.deepEqual(order(),['3','4','1','2','0']);
 assert.equal(updates.length,0);
 const save=[...document.querySelectorAll('button')].find(b=>b.textContent.includes('저장')&&!b.getAttribute('aria-label'));assert(save);await act(async()=>Simulate.click(save));
 assert.deepEqual(stored.filter(r=>r.is_tier_preset).sort((a,b)=>a.tier_preset_order-b.tier_preset_order).map(r=>r.id),['3','4','1','2','0']);
 assert.equal(stored[2].tier_preset_title_translations.ko,'차분한 추천 제목');assert.equal(stored[2].tier_preset_title_translations.en,'Charlie tier');assert(!updates.some(u=>u.id==='5'));
 await act(async()=>root.unmount());console.log('Preset drag: upward/downward insertion, cancellation, external/unselected rejection, filtered order, title preservation, arrows and saved persistence passed');
})().catch(e=>{console.error(e);process.exitCode=1;});
