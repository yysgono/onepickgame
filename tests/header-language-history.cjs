const assert=require('node:assert/strict'),fs=require('node:fs');
const {JSDOM}=require('jsdom');const dom=new JSDOM('<div id="root"></div>',{url:'https://www.onepickgame.com'});
Object.assign(global,{window:dom.window,document:dom.window.document,IS_REACT_ACT_ENVIRONMENT:true});
const React=require('react'),{createRoot}=require('react-dom/client'),{act}=require('react-dom/test-utils');
const {MemoryRouter,useLocation,useNavigate}=require('react-router-dom');
const babel=require('@babel/core');function load(){const mod={exports:{}};const code=babel.transformSync(fs.readFileSync('src/utils/useHeaderLanguage.js','utf8'),{presets:[['@babel/preset-env',{targets:{node:'current'}}]],babelrc:false,configFile:false}).code;new Function('require','module','exports',code)(require,mod,mod.exports);return mod.exports;}
let hook=load(),navigate,root;const i18n={language:'en',changeLanguage(language){this.language=language;return Promise.resolve();}};
function Probe(){const language=hook.default(i18n);return React.createElement('span',null,language);}
function App(){const loc=useLocation();navigate=useNavigate();return React.createElement(React.Fragment,null,React.createElement('output',null,loc.pathname+loc.search+loc.hash),React.createElement(Probe,{key:loc.key}));}
async function mount(entries){root=createRoot(document.getElementById('root'));await act(async()=>root.render(React.createElement(MemoryRouter,{initialEntries:entries},React.createElement(App))));}
(async()=>{
await mount(['/en/quiz?category=game#list','/en/random-pick/wheel']);assert.equal(i18n.language,'en');
hook.rememberHeaderLanguage('ko');await act(async()=>navigate('/ko/random-pick/wheel',{replace:true}));
await act(async()=>navigate(-1));assert.equal(document.querySelector('output').textContent,'/ko/quiz?category=game#list');assert.equal(document.querySelector('span').textContent,'ko');assert.equal(i18n.language,'ko');
await act(async()=>navigate(1));assert.equal(i18n.language,'ko');
await act(async()=>root.unmount());hook=load();await mount(['/en/quiz']);assert.equal(i18n.language,'ko');assert.equal(document.querySelector('output').textContent,'/ko/quiz');
hook.rememberHeaderLanguage('ja');await act(async()=>navigate('/ja/quiz',{replace:true}));await act(async()=>navigate('/'));assert.equal(i18n.language,'en');
await act(async()=>window.dispatchEvent(new window.Event('pageshow')));
await act(async()=>root.unmount());hook=load();await mount(['/']);assert.equal(i18n.language,'ja');assert.equal(document.querySelector('output').textContent,'/ja');
const proto=Object.getPrototypeOf(window.sessionStorage),old=proto.setItem;proto.setItem=()=>{throw Error('QuotaExceededError');};hook.rememberHeaderLanguage('ko');proto.setItem=old;
await act(async()=>root.unmount());console.log('PASS: selected language survives header remount, back/forward, document reload, root restore and query/hash preservation');
})().catch(e=>{console.error(e);process.exitCode=1});
