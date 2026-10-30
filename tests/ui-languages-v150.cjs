// Run from the repository root: node tests/ui-languages-v150.cjs
const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),babel=require('@babel/core');
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server'),{JSDOM}=require('jsdom');
const codes=['it','pl','nl','cs'];const english=require('../src/locales/en/translation.json');
const tokens=s=>(String(s).match(/\{\{[^{}]+\}\}|\{[A-Za-z_]+\}|https?:\/\/[^\s<>]+|OnePickGame|One Pick Game|Supabase|NAVER|Vercel|Google|YouTube/g)||[]).sort();
let checked=0;
function compare(en,target,where){if(typeof en==='string'){assert.equal(typeof target,'string',where);assert.ok(target.trim().length||!en.trim(),where);assert.deepEqual(tokens(target),tokens(en),where);assert.ok(!/ZXQ\d/i.test(target),where);checked++;}else if(en&&typeof en==='object'){assert.ok(target&&typeof target==='object',where);for(const k of Object.keys(en))compare(en[k],target[k],where+'.'+k);}}
function compile(file,mocks={}){const mod={exports:{}};const code=babel.transformSync(fs.readFileSync(file,'utf8'),{presets:[['@babel/preset-env',{targets:{node:'current'}}],'@babel/preset-react'],babelrc:false,configFile:false}).code;new Function('require','module','exports',code)(name=>name in mocks?mocks[name]:require(name.startsWith('.')?path.resolve(path.dirname(file),name):name),mod,mod.exports);return mod.exports;}
const bundles=Object.fromEntries(codes.map(c=>[c,require('../src/locales/'+c+'/translation.json')]));
const i18n={language:'en',getResourceBundle:c=>bundles[c]};
const helper=compile('src/utils/newLanguageUi.js',{'../i18n':i18n});
const maker=compile('src/components/quizMakerCopy.js',{'../utils/newLanguageUi':helper});
const content=compile('src/utils/uiContentLanguage.js');
const {getQuizCopy}=compile('src/components/quizCopy.js');
const detailQuiz=compile('src/components/components/quizCopy.js');
const {getCopy,MODES}=compile('src/components/randomPick/copy.js');
const legal=require('../src/legal/legalPolicy'),{renderLegalPolicy}=require('../legal-policy-render.cjs');
const {injectInitialTranslations}=require('../initial-translations.cjs');
for(const c of codes){
 compare(english,bundles[c],c);
 for(const [source,target] of Object.entries(bundles[c].__uiExtras)){compare(source,target,c+'.extra');assert.deepEqual(target.match(/\d+/g)||[],source.match(/\d+/g)||[],c+': numeric limit '+source);}
 assert.equal(content.uiContentLanguage(c),'en');
 assert.notEqual(maker.getQuizMakerCopy(c).title,maker.getQuizMakerCopy('en').title);
 compare(getQuizCopy('en'),getQuizCopy(c),c+'.quiz');compare(detailQuiz.getQuizCopy('en'),detailQuiz.getQuizCopy(c),c+'.detailQuiz');
 const random=getCopy(c);assert.equal(random.lang,c);for(const mode of MODES)assert.ok(random.modes[mode],c+':'+mode);
 for(const page of ['privacy-policy','terms-of-service']){const policy=legal.getLegalPolicy(c,page),html=renderLegalPolicy(c,page,'https://www.onepickgame.com');const dom=new JSDOM('<html><head>'+html.head+'</head><body>'+html.body+'</body></html>');assert.equal(dom.window.document.querySelector('h1').textContent,policy.title);assert.equal(dom.window.document.querySelectorAll('section').length,policy.sections.length);assert.ok(!html.body.includes('undefined'));assert.ok(html.body.includes('윤영석'));}
 const html=injectInitialTranslations('<html><head></head><body><div id="root"></div></body></html>',c);assert.ok(html.includes('onepick-initial-translations'));assert.ok(html.includes('"language":"'+c+'"'));
}
const original={label:'Retry',nested:['Next']};for(const c of ['en','ko','ja','zh','es','fr','vi','de','ru','id','pt','hi','tr','th','ar','bn']){assert.equal(helper.localizeExtraUi(original,c),original);assert.equal(content.uiContentLanguage(c),c);}
let lang='it';const Home=()=>React.createElement('main',null,'Home');const NewHome=compile('src/pages/NewLanguageHome.js',{'react':React,'react-i18next':{useTranslation:()=>({i18n:{language:lang,changeLanguage(){}}})},'react-helmet-async':{Helmet:({children})=>React.createElement(React.Fragment,null,children)},'../components/Home':Home}).default;
for(lang of codes){const html=renderToStaticMarkup(React.createElement(NewHome,{language:lang}));assert.ok(html.includes('/'+lang));assert.ok(html.includes(require('../src/seo/siteHomeCopy.json')[lang].title.replaceAll('&','&amp;')));}
console.log('PASS: four UI languages; '+checked+' translation values/placeholder checks; numeric limits; quiz + maker + 9 random modes; original-language fallback; legal rendering; initial payload and home rendering.');
