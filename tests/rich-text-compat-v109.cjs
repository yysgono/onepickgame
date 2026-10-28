const assert = require('node:assert/strict');
const Module = require('node:module');
const sanitize = require('../rich-text-server.cjs');
const dirty = '<h2>안내</h2><p style="color:#ff0000;position:fixed;z-index:9999">글 <b>내용</b></p><script>alert(1)</script><img src="https://example.test/a.jpg" onerror="alert(1)"><a href="javascript:alert(1)">링크</a><iframe src="https://evil.test"></iframe><table><tr><td>표</td></tr></table>';
const clean = sanitize(dirty);
for (const bad of ['<script', 'onerror', 'javascript:', '<iframe', 'position:fixed', 'z-index']) assert.ok(!clean.includes(bad), bad);
for (const good of ['<h2>안내</h2>', '<b>내용</b>', 'color:#ff0000', '<table>', 'https://example.test/a.jpg']) assert.ok(clean.includes(good), good);
assert.ok(sanitize('<img src="data:image/svg+xml,evil">').indexOf('data:image') === -1);
assert.ok(sanitize('<a href="https://example.test">링크</a>').includes('noopener noreferrer'));
// Exercise the real SEO middleware with rich HTML, without any network or live DB.
const originalLoad = Module._load;
Module._load = function(request, parent, main) {
  if (parent?.filename.endsWith('/community-seo-routes.cjs')) {
    if (request === './seo-template.cjs') return {loadSeoTemplate: async()=>'<html><head></head><body><div id="root"></div></body></html>'};
    if (request === './home-seo-support.cjs') return {insertRoot:(html,body)=>html.replace('<div id="root"></div>',`<div id="root">${body}</div>`)};
  }
  return originalLoad.apply(this, arguments);
};
let middleware;
try {
  const chain = new Proxy({}, {get:(_target,key)=>key === 'then' ? resolve=>Promise.resolve({data:[{id:1,title:'이용안내',body_html:dirty,author_nickname:'운영자',language:'ko',created_at:'2026-10-28',is_pinned:true}],error:null}).then(resolve) : ()=>chain});
  require('../community-seo-routes.cjs')({use:fn=>{middleware=fn;}},{from:()=>chain},'https://www.onepickgame.com');
} finally {Module._load=originalLoad;}
(async()=>{
 for (const board of ['community','notices']) {
  let html='',status=200;const headers={};
  const res={setHeader:(k,v)=>{headers[k]=v;},status:n=>{status=n;return res;},send:value=>{html=value;return res;}};
  await middleware({query:{seo:'community-list',lang:'ko',board}},res,()=>assert.fail('Unexpected next'));
  assert.equal(status,200);assert.equal(headers['X-Robots-Tag'],'index, follow');
  assert.ok(html.includes('이용안내'));assert.ok(html.includes('<b>내용</b>'));assert.ok(!html.includes('<script'));
 }
 console.log('PASS: sanitization, formatting, and community/notices SEO HTML 200 with require(ESM) disabled');
})().catch(error=>{console.error(error);process.exitCode=1;});
