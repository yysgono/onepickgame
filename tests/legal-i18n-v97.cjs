const fs=require('fs'),assert=require('node:assert/strict');
const {COPY,LANGUAGES,getLegalPolicy}=require('../src/legal/legalPolicy');
const {renderLegalPolicy}=require('../legal-policy-render.cjs');
const {JSDOM}=require('jsdom');
assert.equal(LANGUAGES.length,16);
for(const lang of LANGUAGES){
 const c=COPY[lang];assert.equal(c.privacy.length,6);assert.equal(c.terms.length,5);
 for(const page of ['privacy-policy','terms-of-service']){
  const meta=getLegalPolicy(lang,page),{head,body}=renderLegalPolicy(lang,page,'https://www.onepickgame.com');
  const doc=new JSDOM('<!doctype html><html><head>'+head+'</head><body>'+body+'</body></html>').window.document;
  assert.equal(doc.querySelector('h1').textContent,meta.title);assert.equal(doc.querySelectorAll('section').length,page==='privacy-policy'?6:5);
  assert.equal(doc.querySelectorAll('title').length,1);assert.equal(doc.querySelectorAll('link[rel=canonical]').length,1);
  assert.equal(doc.querySelector('link[rel=canonical]').href,`https://www.onepickgame.com/${lang}/${page}`);
  assert.equal(doc.querySelectorAll('link[rel=alternate]').length,17);assert.equal(doc.querySelector('main').dir,lang==='ar'?'rtl':'ltr');
  assert.ok(body.includes('윤영석'));assert.ok(body.includes(c.country));assert.ok(!body.includes('undefined'));
  for(const [heading,text]of meta.sections){assert.ok(heading.trim().length>0&&text.trim().length>0);assert.ok(doc.body.textContent.includes(text));}
 }
}
const v=JSON.parse(fs.readFileSync('vercel.json','utf8'));
assert.ok(!v.redirects.some(r=>r.source.startsWith('/(')&&(r.source.endsWith('/privacy-policy')||r.source.endsWith('/terms-of-service'))));
assert.equal(v.redirects.find(r=>r.source==='/privacy-policy').destination,'/en/privacy-policy');
assert.equal(getLegalPolicy('unsupported','privacy-policy').lang,'en');
console.log('PASS: 32 full policies, consistent section coverage, operator/country, RTL, canonical/hreflang, legacy URLs and removal of forced-English redirects');
