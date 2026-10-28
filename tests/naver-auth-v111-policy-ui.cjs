const fs=require('fs'),assert=require('node:assert/strict'),babel=require('@babel/core'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server'),{JSDOM}=require('jsdom');
const legal=require('../src/legal/legalPolicy');let language='ko',seo;
function load(path){const m={exports:{}};const code=babel.transformSync(fs.readFileSync(path,'utf8'),{presets:[['@babel/preset-env',{targets:{node:'current'}}],'@babel/preset-react'],babelrc:false,configFile:false}).code;new Function('require','module','exports',code)(name=>{
 if(name==='react')return React;
 if(name==='react-router-dom')return {useParams:()=>({lang:language}),Link:({to,children,...props})=>React.createElement('a',{...props,href:to},children)};
 if(name==='react-i18next')return {useTranslation:()=>({i18n:{language}})};
 if(name==='../seo/Seo')return p=>{seo=p;return null;};
 if(name==='../legal/legalPolicy')return legal;
 if(name==='../utils/useHeaderLanguage')return {rememberHeaderLanguage(){}};
 throw Error(name);
},m,m.exports);return m.exports.default;}
const Page=load('src/components/LegalPolicyPage.js'),Notice=load('src/components/AccountPolicyNotice.js');
for(language of legal.LANGUAGES){
 for(const page of ['privacy-policy','terms-of-service']){
  const html=renderToStaticMarkup(React.createElement(Page,{page})),doc=new JSDOM(html).window.document;
  assert.equal(doc.querySelector('main').lang,language);assert.equal(doc.querySelector('h1').textContent,legal.getLegalPolicy(language,page).title);
  assert.equal(doc.querySelectorAll('section').length,page==='privacy-policy'?7:5);assert.ok(doc.body.textContent.includes('윤영석'));
  assert.equal(seo.lang,language);assert.equal(seo.slug,page);assert.equal(seo.hreflangLangs.length,16);
 }
 const html=renderToStaticMarkup(React.createElement(Notice));const doc=new JSDOM(html).window.document;
 assert.ok(doc.querySelector(`a[href="/${language}/privacy-policy"]`));assert.ok(doc.querySelector(`a[href="/${language}/terms-of-service"]`));
 assert.equal(doc.querySelectorAll('small').length,0);assert.equal(doc.querySelectorAll('a[target=_blank]').length,2);
}
console.log('PASS: localized React policies, 16-language signup links, operator identity, language SEO, removal of English-only label');
