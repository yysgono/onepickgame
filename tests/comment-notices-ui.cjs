const assert=require('node:assert/strict'),fs=require('fs'),babel=require('@babel/core'),{JSDOM}=require('jsdom');
const dom=new JSDOM('<div id="root"></div>',{url:'https://www.onepickgame.com/ko/stats/test'});global.window=dom.window;global.document=dom.window.document;global.IS_REACT_ACT_ENVIRONMENT=true;
const React=require('react'),{act}=React,{createRoot}=require('react-dom/client'),{Simulate}=require('react-dom/test-utils');
const pending=new Map(),calls=[],listeners=new Set();let failLoad=false,failedSave=false;let state={can_publish:false,items:[{id:'one',role:'admin',content:'<img src=x onerror=alert(1)> Notice',updated_at:'2026-11-03T00:00:00Z',can_edit:false,is_own:false}]};
const supabase={auth:{onAuthStateChange:fn=>{listeners.add(fn);return {data:{subscription:{unsubscribe:()=>listeners.delete(fn)}}}}},rpc:async(name,args)=>{
 calls.push({name,args});
 if(name==='list_content_comment_notices'){
  if(pending.has(args.p_target_id))return pending.get(args.p_target_id).promise;
  return failLoad?{error:{message:'missing migration'}}:{data:JSON.parse(JSON.stringify(state))};
 }
 if(name==='save_content_comment_notice'){
  if(failedSave)return {error:{message:'NOTICE_PERMISSION'}};
  state.items=[{id:args.p_notice_id||'own',role:'author',content:args.p_content,updated_at:'2026-11-03T00:00:00Z',can_edit:true,is_own:true}];return {data:'own'};
 }
 if(name==='delete_content_comment_notice'){state.items=state.items.filter(n=>n.id!==args.p_notice_id);return {data:true};}
 throw new Error(name);
}};
const t=(key,options)=>options?.defaultValue||key;
let lang='ko';const mod={exports:{}};const source=fs.readFileSync('src/components/ContentCommentNotices.js','utf8');const code=babel.transformSync(source,{presets:[['@babel/preset-env',{targets:{node:'current'}}],'@babel/preset-react'],configFile:false,babelrc:false}).code;
new Function('require','module','exports',code)(name=>({react:React,'react-i18next':{useTranslation:()=>({t,i18n:{language:lang,resolvedLanguage:lang}})},'../utils/supabaseClient':{supabase},'../badwords-multilang':{hasBadword:text=>text.includes('blockedword')}}[name]),mod,mod.exports);
const Component=mod.exports.default;const root=createRoot(document.getElementById('root'));let current='target';
const render=async target=>{current=target;await act(async()=>root.render(React.createElement('div',null,React.createElement(Component,{kind:'worldcup',targetId:target}),React.createElement('div',{id:'ordinary-comments'},'Existing ordinary comments'))))};
const click=async button=>act(async()=>Simulate.click(button));const button=text=>[...document.querySelectorAll('button')].find(b=>b.textContent===text);
const change=async text=>act(async()=>Simulate.change(document.querySelector('textarea'),{target:{value:text}}));const submit=async()=>act(async()=>Simulate.submit(document.querySelector('form')));
const authenticate=async()=>act(async()=>{for(const fn of listeners)fn('SIGNED_IN',{user:{id:'test'}})});
const saveCount=()=>calls.filter(c=>c.name==='save_content_comment_notice').length;
function deferred(){let resolve;const promise=new Promise(r=>{resolve=r});return {promise,resolve}}
(async()=>{
 await render('target');assert.ok(document.body.textContent.includes('운영자 공지'));assert.ok(document.body.textContent.includes('<img src=x'));assert.equal(document.querySelector('img'),null);assert.equal(document.querySelector('button'),null);
 state.can_publish=true;await authenticate();await click(button('공지 작성'));assert.ok(document.querySelector('textarea'));
 const count=saveCount();await change('blockedword');await submit();assert.equal(saveCount(),count);assert.ok(document.querySelector('[role=alert]'));
 await change('a'.repeat(2001));await submit();assert.equal(saveCount(),count);
 await change('참여자 안내입니다.');await submit();assert.equal(saveCount(),count+1);assert.equal(calls.findLast(c=>c.name==='save_content_comment_notice').args.p_kind,'worldcup');assert.equal(document.querySelector('textarea'),null);assert.ok(document.body.textContent.includes('작성자 공지'));assert.ok(document.body.textContent.includes('참여자 안내입니다.'));
 await click(button('내 공지 수정'));assert.equal(document.querySelector('textarea').value,'참여자 안내입니다.');await change('수정된 공지');await submit();assert.equal(calls.findLast(c=>c.name==='save_content_comment_notice').args.p_notice_id,'own');assert.ok(document.body.textContent.includes('수정된 공지'));
 failedSave=true;await click(button('내 공지 수정'));await change('이것은 저장되지 않음');await submit();assert.ok(document.querySelector('[role=alert]'));assert.equal(document.querySelector('button[type=submit]').disabled,false);failedSave=false;
 window.confirm=()=>true;await click(button('취소'));await click(button('삭제'));assert.equal(state.items.length,0);
 // Auth changes invalidate stale editor authority without touching normal comments.
 await click(button('공지 작성'));state.can_publish=false;await authenticate();assert.equal(document.querySelector('textarea'),null);assert.equal(button('공지 작성'),undefined);assert.ok(document.getElementById('ordinary-comments'));
 failLoad=true;await authenticate();assert.ok(document.querySelector('[role=alert]'));assert.ok(document.getElementById('ordinary-comments'));failLoad=false;await click(button('다시 시도'));assert.equal(document.querySelector('[role=alert]'),null);
 // Slow previous targets must not overwrite the next target or its permissions.
 const old=deferred(),fresh=deferred();pending.set('old',old);pending.set('new',fresh);await render('old');await render('new');
 await act(async()=>fresh.resolve({data:{can_publish:false,items:[{id:'new',role:'author',content:'NEW TARGET',updated_at:'2026-11-03T00:00:00Z'}]}}));
 await act(async()=>old.resolve({data:{can_publish:true,items:[{id:'old',role:'admin',content:'OLD TARGET',updated_at:'2026-11-03T00:00:00Z'}]}}));assert.ok(document.body.textContent.includes('NEW TARGET'));assert.ok(!document.body.textContent.includes('OLD TARGET'));assert.equal(button('공지 작성'),undefined);
 // All supported locales render without an Intl exception.
 for(const locale of ['en','ko','ja','zh','es','fr','vi','de','ru','id','pt','hi','tr','th','ar','bn','it','pl','nl','cs']){lang=locale;await render('new');assert.ok(document.querySelector('.content-comment-notices'));}
 // Integration points precede each ordinary comment composer.
 for(const [file,kind,form] of [['CommentBox.js','worldcup','{user && <form'],['QuizCommentBox.js','quiz','<form onSubmit={submit}'],['TierListResultPage.js','tier-list','{/* 댓글 작성 */}']]){const text=fs.readFileSync('src/components/'+file,'utf8');const pos=text.indexOf('<ContentCommentNotices');assert.ok(pos>0);assert.ok(text.slice(pos,pos+150).includes('kind="'+kind+'"'));assert.ok(pos<text.indexOf(form));}
 await act(async()=>root.unmount());assert.equal(listeners.size,0);dom.window.close();console.log('PASS UI: public pinned notice/escaped content; verified permission controls; badword/length checks; create/edit/delete; save/read failures; auth reset; stale-target response suppression; 20 locales; all 3 comment panels; existing comment area preserved.');
})().catch(error=>{console.error(error);process.exitCode=1});
