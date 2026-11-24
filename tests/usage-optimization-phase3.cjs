const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const source=fs.readFileSync('seo-template.cjs','utf8');
const shell=version=>`<html><head></head><body><div id="root"></div><script src="/static/js/${version}.js"></script></body></html>`;
function fixture(responses,local){
 let now=0,reads=0;const requests=[];const context={module:{exports:{}},__dirname:'/app',Date:{now:()=>now},AbortSignal,require:name=>name==='node:fs/promises'?{readFile:async()=>{reads++;if(local)return local;throw Object.assign(Error('missing'),{code:'ENOENT'});}}:require(name),fetch:async(url,options)=>{requests.push({url,options});const r=responses.shift();if(!r)throw Error('unexpected fetch');return {status:r.status,ok:r.status===200,headers:{get:key=>key==='etag'?r.etag||null:null},text:async()=>r.html};}};
 vm.runInNewContext(source,context);
 return {load:context.module.exports.loadSeoTemplate,requests,advance:ms=>now+=ms,reads:()=>reads};
}
const origin='https://www.onepickgame.com';
test('template shares concurrent requests and revalidates using ETag; changed builds replace old shell',async()=>{
 const f=fixture([{status:200,etag:'"v1"',html:shell('v1')},{status:304},{status:200,etag:'"v2"',html:shell('v2')}]);
 assert.deepEqual(await Promise.all([f.load(origin),f.load(origin)]),[shell('v1'),shell('v1')]);assert.equal(f.requests.length,1);
 f.advance(60001);assert.equal(await f.load(origin),shell('v1'));assert.equal(f.requests[1].options.headers['If-None-Match'],'"v1"');
 f.advance(60001);assert.equal(await f.load(origin),shell('v2'));assert.equal(f.requests[2].options.headers['If-None-Match'],'"v1"');
});
test('no ETag, HTTP errors and local built files preserve prior behavior',async()=>{
 const f=fixture([{status:200,html:shell('a')},{status:503},{status:200,html:shell('b')}]);
 assert.equal(await f.load(origin),shell('a'));f.advance(60001);await assert.rejects(f.load(origin),/503/);assert.equal(Object.keys(f.requests[1].options.headers).length,0);assert.equal(await f.load(origin),shell('b'));
 const local=fixture([],shell('local'));assert.equal(await local.load(origin),shell('local'));assert.equal(local.requests.length,0);
});
test('comment queries select all rendered fields without changing sort, scope or UI',()=>{
 const world=fs.readFileSync('src/components/CommentBox.js','utf8'),quiz=fs.readFileSync('src/components/QuizCommentBox.js','utf8');
 assert.match(world,/\.select\(kind === "worldcup" \? "id,user_id,nickname,content,created_at,upvotes,downvotes" : "\*"\)/);
 assert.match(quiz,/\.from\("quiz_comments"\)\.select\("id,user_id,nickname,content,created_at"\)\.eq\("quiz_id", quizId\)\.order\("created_at", \{ ascending: false \}\)/);
 for(const [text,name] of [[world,'CommentBox'],[quiz,'QuizCommentBox']])assert.equal(ts.createSourceFile(name+'.jsx',text,ts.ScriptTarget.Latest,true,ts.ScriptKind.JSX).parseDiagnostics.length,0);
});
