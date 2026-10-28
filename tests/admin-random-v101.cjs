const fs=require('fs'),assert=require('node:assert/strict'),babel=require('@babel/core'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
let response={data:{count:12,partial:true}};const supabase={async rpc(name){assert.equal(name,'get_admin_random_pick_today_v101');return response;}};
function load(path,requireMock){const m={exports:{}};const code=babel.transformSync(fs.readFileSync(path,'utf8'),{presets:[['@babel/preset-env',{targets:{node:'current'}}],'@babel/preset-react'],configFile:false,babelrc:false}).code;new Function('require','module','exports',code)(requireMock,m,m.exports);return m.exports;}
(async()=>{
 const api=load('src/utils/adminReadApi.js',name=>name==='./supabaseClient'?{supabase}:{adminDisplayTitle(){}});
 assert.deepEqual(await api.getAdminTodayRandomPickCount(),{count:12,partial:true});
 response={error:{code:'PGRST202'}};assert.deepEqual(await api.getAdminTodayRandomPickCount(),{pending:true});
 response={error:Error('denied')};await assert.rejects(api.getAdminTodayRandomPickCount(),/denied/);
 response={data:{count:null,partial:false}};await assert.rejects(api.getAdminTodayRandomPickCount(),/Count unavailable/);
 const Component=load('src/components/AdminTodayContentStats.js',()=>React).default;
 let html=renderToStaticMarkup(React.createElement(Component,{quizCount:1,tierCount:2,randomCount:{count:12,partial:true}}));assert.ok(html.includes('오늘 랜덤 뽑기'));assert.ok(html.includes('>12<'));assert.ok(html.includes('오늘 집계 시작 이후'));
 html=renderToStaticMarkup(React.createElement(Component,{randomCount:{pending:true}}));assert.ok(html.includes('집계 준비'));
 const page=fs.readFileSync('src/components/AdminStatsPage.js','utf8');assert.ok(page.includes('className="admin-today-content-row"'));assert.ok(/<\/div>\s*<div className="admin-today-content-row"/.test(page));
 console.log('PASS: separate second row, three content cards, random pending/error/partial counts, no false zero');
})().catch(e=>{console.error(e);process.exitCode=1});
