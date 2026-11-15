const assert=require('node:assert/strict'),fs=require('node:fs'),{JSDOM}=require('jsdom');
const {rankPublicStats,renderPublicStats,loadPublicStats}=require('../worldcup-public-stats.cjs');
const {renderWorldcupViewHtml}=require('../worldcup-view-routes.cjs');
const languages=Object.keys(require('../src/seo/worldcupViewSeoCopy.json')),copy=require('../src/seo/worldcupPublicStatsCopy.json'),tableLabels=require('../src/locales/statsTableLabels.json');
const cup={id:'a1111111-1111-4111-8111-111111111111',title:'A < B & C',description:'Description',data:Array.from({length:15},(_,i)=>({id:String(i+1),name:'Candidate '+(i+1),name_translations:{ko:'후보 '+(i+1),en:'Candidate '+(i+1)},image:'https://example.com/'+i+'.jpg'}))};
const rows=cup.data.map((c,i)=>({candidate_id:c.id,name:'Old name',win_count:String(i<5?8:i%7),total_games:String(i<2?183:80),match_wins:i<4?21:0,match_count:i===2?30:40,user_id:'private-actor',user_win_count:99999}));rows.push({candidate_id:'deleted',name:'Deleted champion',win_count:99999,total_games:99999,match_wins:99999,match_count:99999});
const source=fs.readFileSync('src/components/StatsPage.js','utf8');
const percent=source.match(/function percent\(n, d, digits = 0\) \{[\s\S]*?\n\}/)[0],normalize=source.match(/function normalizeStats\(arr\) \{[\s\S]*?\n\}/)[0];
const start=source.indexOf('const rankedStats = useMemo(() => {')+'const rankedStats = useMemo(() => {'.length,end=source.indexOf('}, [stats]);',start);
const expected=new Function('rows',percent+'\n'+normalize+'\nconst stats=normalizeStats(rows);'+source.slice(start,end))(rows.filter(row=>row.candidate_id!=='deleted'));
assert.deepEqual(rankPublicStats(cup,rows,'ko').map(row=>row.id),expected.map(row=>row.candidate_id),'SSR must match actual UI default ordering, including all tie breakers');
assert.equal(rankPublicStats(cup,rows,'ko').find(row=>row.id==='1').name,'후보 1');
const snapshot={status:'ready',rows,checkedAt:'2026-11-15T20:00:00.000Z'},shell='<html><head><title>Before</title><meta property="og:image" content="https://example.com/previous.jpg"><link rel="stylesheet" href="/static/css/main.css"></head><body><div id="root"></div><script src="/static/js/main.js"></script></body></html>';
for(const lang of languages){
 assert(copy[lang]);const html=renderWorldcupViewHtml(shell,'https://www.onepickgame.com',lang,'result',cup,'',snapshot),doc=new JSDOM(html).window.document;
 assert.equal(doc.querySelectorAll('tbody tr').length,10);assert.equal(doc.querySelectorAll('thead th[scope=col]').length,7);assert.equal(doc.querySelector('h2').textContent,copy[lang].heading);assert(doc.querySelector('thead').textContent.includes(tableLabels[lang].win_rate));assert(doc.querySelector('caption').textContent.includes(copy[lang].basis));
 assert(!html.includes('private-actor'));assert(!html.includes('99999'));assert(!html.includes('Deleted champion'));assert.equal(doc.querySelector('time').dateTime,snapshot.checkedAt);
 const old=renderWorldcupViewHtml(shell,'https://www.onepickgame.com',lang,'result',cup),oldDoc=new JSDOM(old).window.document;
 assert.equal(doc.head.innerHTML,oldDoc.head.innerHTML,'Adding the table must not alter OG/canonical metadata');assert.equal(doc.querySelector('script[src]').src,oldDoc.querySelector('script[src]').src);assert.equal(doc.querySelectorAll('article img').length,oldDoc.querySelectorAll('article img').length);
 const match=renderWorldcupViewHtml(shell,'https://www.onepickgame.com',lang,'match',cup,'16',snapshot);assert(!match.includes('<table'));assert(match.includes('noindex,follow'));
}
const decimals=renderPublicStats({data:[{id:'1',name:'A'}]},'ko',{...snapshot,rows:[{candidate_id:'1',win_count:8,total_games:183,match_wins:0,match_count:0}]});assert(decimals.includes('4.4%'));assert(decimals.includes('>-</td>'));
const zero=renderPublicStats({data:[{id:'1',name:'A'}]},'ko',{...snapshot,rows:[{candidate_id:'1',win_count:0,total_games:183,match_wins:0,match_count:4}]});assert(zero.includes('0.0%'));assert(zero.includes('>0%</td>'));
const malicious={data:[{id:'x',name:'<script>alert(1)</script>&"'}]};const escaped=renderPublicStats(malicious,'ko',{...snapshot,rows:[{candidate_id:'x',win_count:1,total_games:1,match_wins:1,match_count:1}]});assert(escaped.includes('&lt;script&gt;'));assert.equal(new JSDOM(escaped).window.document.querySelector('script'),null);
const empty=renderPublicStats(cup,'ko',{...snapshot,rows:[]});assert(empty.includes(copy.ko.empty));assert(!empty.includes('<table'));
const unavailable=renderPublicStats(cup,'ko',{status:'unavailable'});assert(unavailable.includes(copy.ko.unavailable));assert(!unavailable.includes('0%'));assert(!unavailable.includes('<time'));
assert.throws(()=>rankPublicStats(cup,null,'ko'));assert.throws(()=>rankPublicStats(cup,[{...rows[0],win_count:-1}],'ko'));assert.throws(()=>rankPublicStats(cup,[{...rows[0],total_games:'bad'}],'ko'));assert.throws(()=>rankPublicStats(cup,[rows[0],rows[0]],'ko'));
(async()=>{
 let args,signal;const client={rpc:(...a)=>{args=a;return{abortSignal:s=>{signal=s;return Promise.resolve({data:rows})}}}};
 const result=await loadPublicStats(client,cup,{now:()=>new Date(snapshot.checkedAt)});assert.equal(result.status,'ready');assert.equal(result.checkedAt,snapshot.checkedAt);assert.deepEqual(args,['get_winner_stats',{p_cup_id:cup.id,p_from:null,p_to:null}]);assert(signal instanceof AbortSignal);
 for(const response of [{error:Error('DB unavailable')},{data:null},{data:[{...rows[0],match_count:NaN}]}])assert.equal((await loadPublicStats({rpc:()=>({abortSignal:async()=>response})},cup)).status,'unavailable');
 assert.equal((await loadPublicStats({rpc:()=>{throw Error('Network')}},cup)).status,'unavailable');
 const hold=setTimeout(()=>{},100);try{const aborted=await loadPublicStats({rpc:()=>({abortSignal:s=>new Promise((_,reject)=>s.addEventListener('abort',()=>reject(s.reason),{once:true}))})},cup,{timeoutMs:5});assert.equal(aborted.status,'unavailable');}finally{clearTimeout(hold);}
 console.log('PASS: actual UI ordering/percent parity, current candidates, localized top 10 in 20 languages, escaped public-only data, empty/error/timeout states and unchanged metadata/app scripts.');
})().catch(error=>{console.error(error);process.exitCode=1});
