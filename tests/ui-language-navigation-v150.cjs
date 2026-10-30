const assert=require('node:assert/strict'),fs=require('fs'),babel=require('@babel/core');
const {JSDOM}=require('jsdom');const dom=new JSDOM('<div id="root"></div>',{url:'https://www.onepickgame.com/en/quiz'});
Object.assign(global,{window:dom.window,document:dom.window.document,IS_REACT_ACT_ENVIRONMENT:true});
const React=require('react'),{act}=React,{createRoot}=require('react-dom/client');
const {MemoryRouter,useLocation,useNavigate}=require('react-router-dom');
function compile(file,mocks={}){const m={exports:{}};const code=babel.transformSync(fs.readFileSync(file,'utf8'),{presets:[['@babel/preset-env',{targets:{node:'current'}}]],configFile:false,babelrc:false}).code;new Function('require','module','exports',code)(n=>n in mocks?mocks[n]:require(n),m,m.exports);return m.exports;}
const hook=compile('src/utils/useHeaderLanguage.js');const lazy=compile('src/utils/lazyTranslations.js');
const i18n=require('i18next').createInstance(),codes=['it','pl','nl','cs'],requests=[];let navigate;
function Probe(){const loc=useLocation();navigate=useNavigate();const [,refresh]=React.useState(0);React.useEffect(()=>{const fn=()=>refresh(n=>n+1);i18n.on('languageChanged',fn);return()=>i18n.off('languageChanged',fn);},[]);const lang=hook.default(i18n);return React.createElement('output',null,JSON.stringify({path:loc.pathname+loc.search+loc.hash,lang,login:i18n.t('login')}));}
(async()=>{
 await i18n.init({lng:'en',fallbackLng:'en',resources:{en:{translation:require('../src/locales/en/translation.json')}}});
 lazy.installLazyTranslations(i18n,{loadedLanguages:['en'],loaders:Object.fromEntries(codes.map(c=>[c,async()=>{requests.push(c);return require('../src/locales/'+c+'/translation.json');}]))});
 const root=createRoot(document.getElementById('root'));await act(async()=>root.render(React.createElement(MemoryRouter,{initialEntries:['/en/quiz?category=game#list']},React.createElement(Probe))));
 for(const c of codes){
  hook.rememberHeaderLanguage(c);await act(async()=>navigate('/'+c+'/quiz?category=game#list',{replace:true}));
  const read=()=>JSON.parse(document.querySelector('output').textContent);
  assert.equal(read().lang,c);assert.equal(read().login,require('../src/locales/'+c+'/translation.json').login);
  await act(async()=>navigate('/'+c+'/random-pick/wheel'));await act(async()=>navigate(-1));
  assert.equal(read().path,'/'+c+'/quiz?category=game#list');assert.equal(i18n.language,c);
 }
 assert.deepEqual(requests,codes);await act(async()=>root.unmount());dom.window.close();console.log('PASS: all four new languages load once, render translated text, preserve selected language and query/hash through navigation/back.');
})().catch(e=>{console.error(e);process.exitCode=1;});
