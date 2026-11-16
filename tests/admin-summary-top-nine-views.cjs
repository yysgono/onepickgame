const fs=require('fs'),assert=require('node:assert/strict'),babel=require('@babel/core'),{JSDOM}=require('jsdom');
const dom=new JSDOM('<div id="root"></div>');Object.assign(global,{window:dom.window,document:dom.window.document,IS_REACT_ACT_ENVIRONMENT:true});
const React=require('react'),{act}=React,{createRoot}=require('react-dom/client');let mode='success';
const client={rpc:async name=>{
 if(name==='get_admin_content_summary_v149')return {data:{quiz:{existing:109,total:451,today:8},tier:{existing:73,total:3137,today:68}}};
 if(name==='get_admin_top_nine_stats_with_private')return {data:{existing:23,total:69,today:4}};
 assert.equal(name,'get_admin_top_nine_views_v1');
 return mode==='missing'?{error:{code:'PGRST202'}}:mode==='invalid'?{data:{total:null,today:-1}}:{data:{total:mode==='zero'?0:987,today:mode==='zero'?0:32}};
}};
const m={exports:{}};new Function('require','module','exports',babel.transformSync(fs.readFileSync('src/components/AdminContentSummary.js','utf8'),{presets:[['@babel/preset-env',{targets:{node:'current'}}],'@babel/preset-react'],configFile:false,babelrc:false}).code)(key=>({react:React,'react-router-dom':{Link:p=>React.createElement('a',{href:p.to},p.children)},'../utils/supabaseClient':{supabase:client}}[key]),m,m.exports);
const row=()=>[...document.querySelectorAll('tbody tr')].find(r=>r.textContent.includes('My Top 9'));
(async()=>{
 const root=createRoot(document.getElementById('root'));let tick=0;
 const render=async()=>act(async()=>root.render(React.createElement(m.exports.default,{refreshTick:tick++,worldcupStats:{existing:393,total:3315,today:39}})));
 await render();assert.deepEqual([...row().querySelectorAll('td')].map(td=>td.textContent),['23','987','32']);assert(!row().textContent.includes('69'));assert(row().textContent.includes('열람'));assert(document.body.textContent.includes('한국 시간'));
 mode='missing';await render();assert.deepEqual([...row().querySelectorAll('td')].map(td=>td.textContent),['23','—','—']);assert(document.querySelector('[role=alert]').textContent.includes('열람 통계 SQL'));
 mode='invalid';await render();assert.deepEqual([...row().querySelectorAll('td')].map(td=>td.textContent),['23','—','—']);
 mode='zero';await render();assert.deepEqual([...row().querySelectorAll('td')].map(td=>td.textContent),['23','0','0']);
 await act(async()=>root.unmount());dom.window.close();console.log('PASS: summary uses Top 9 views instead of completion counts, preserves existing count, refreshes and distinguishes missing/invalid statistics from real zero.');
})().catch(error=>{console.error(error);process.exitCode=1});
