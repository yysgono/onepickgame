const fs=require('fs'),assert=require('node:assert/strict'),babel=require('@babel/core');
const calls=[];let fail=false,missing=false;
const events=['2026-10-27T14:59:59.999Z','2026-10-27T15:00:00.000Z','2026-10-28T14:59:59.999Z','2026-10-28T15:00:00.000Z'];
const supabase={from(table){const call={table};calls.push(call);const q={select(fields,options){call.fields=fields;call.options=options;return q;},gte(field,value){call.gte={field,value};return q;},lt(field,value){call.lt={field,value};return q;},then(resolve,reject){if(fail)return Promise.resolve({error:Error('denied')}).then(resolve,reject);const count=events.filter(x=>x>=call.gte.value&&x<call.lt.value).length;return Promise.resolve({count:missing?null:count,error:null}).then(resolve,reject);}};return q;}};
const source=fs.readFileSync('src/utils/adminReadApi.js','utf8');
const code=babel.transformSync(source,{presets:[['@babel/preset-env',{targets:{node:'current'}}]],configFile:false,babelrc:false}).code;
const m={exports:{}};new Function('require','module','exports',code)(name=>name==='./supabaseClient'?{supabase}:{adminDisplayTitle:()=>''},m,m.exports);
(async()=>{
 const api=m.exports;assert.equal(api.getTodayKstDateString(new Date('2026-10-27T15:00:00Z')),'2026-10-28');
 for(const kind of ['quiz','tier-list'])assert.equal(await api.getAdminTodayContentCount(kind,'2026-10-28'),2);
 assert.deepEqual(calls.map(c=>c.table),['quiz_attempts','tier_list_play_logs']);
 for(const call of calls){assert.equal(call.fields,'id');assert.deepEqual(call.options,{count:'exact',head:true});assert.deepEqual(call.gte,{field:'created_at',value:'2026-10-27T15:00:00.000Z'});assert.deepEqual(call.lt,{field:'created_at',value:'2026-10-28T15:00:00.000Z'});}
 fail=true;await assert.rejects(api.getAdminTodayContentCount('quiz','2026-10-28'),/denied/);fail=false;missing=true;await assert.rejects(api.getAdminTodayContentCount('tier-list','2026-10-28'),/Count unavailable/);
 assert.throws(()=>api.getAdminTodayContentCount('unknown'),/Unsupported/);
 const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
 const componentCode=babel.transformSync(fs.readFileSync('src/components/AdminTodayContentStats.js','utf8'),{presets:[['@babel/preset-env',{targets:{node:'current'}}],'@babel/preset-react'],configFile:false,babelrc:false}).code;
 const component={exports:{}};new Function('require','module','exports',componentCode)(()=>React,component,component.exports);
 let html=renderToStaticMarkup(React.createElement(component.exports.default,{loading:false,quizCount:0,tierCount:null}));assert.ok(html.includes('오늘 퀴즈 플레이'));assert.ok(html.includes('오늘 티어표 열람'));assert.ok(html.includes('>0<'));assert.ok(html.includes('집계 실패'));assert.ok(html.includes('결과 저장'));assert.ok(html.includes('결과 페이지 열람'));
 html=renderToStaticMarkup(React.createElement(component.exports.default,{loading:true,quizCount:2,tierCount:3}));assert.equal((html.match(/>\.\.\.</g)||[]).length,2);
 console.log('PASS: KST midnight boundaries, separate count-only queries, no full record downloads, error vs zero distinction, loading and count labels');
})().catch(e=>{console.error(e);process.exitCode=1});
