const fs=require('fs'),assert=require('node:assert/strict'),babel=require('@babel/core'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
let language='ko';const m={exports:{}};
const code=babel.transformSync(fs.readFileSync('src/components/AccountPolicyNotice.js','utf8'),{presets:[['@babel/preset-env',{targets:{node:'current'}}],'@babel/preset-react'],configFile:false,babelrc:false}).code;
new Function('require','module','exports',code)(name=>name==='react'?React:name==='react-i18next'?{useTranslation:()=>({i18n:{language}})}:{Link:({to,children,...rest})=>React.createElement('a',{href:to,...rest},children)},m,m.exports);
for(language of ['ko','en','ja','zh','es','fr','de','vi','ru','id','pt','hi','tr','th','ar','bn']){
 const html=renderToStaticMarkup(React.createElement(m.exports.default));assert.ok(html.includes('href="/terms-of-service"'));assert.ok(html.includes('href="/privacy-policy"'));assert.equal((html.match(/target="_blank"/g)||[]).length,2);assert.ok(!html.includes('type="checkbox"'));assert.ok(!html.includes('undefined'));
}
const privacy=fs.readFileSync('src/components/PrivacyPolicy.js','utf8'),terms=fs.readFileSync('src/components/TermsOfService.js','utf8');
assert.ok(!privacy.includes('deleted immediately upon withdrawal'));assert.ok(!terms.includes('operator is not liable for any resulting damages'));assert.ok(!terms.includes('Anyone can use this service without registration.'));
assert.ok(privacy.includes('do not give OnePickGame your Google password'));assert.ok(privacy.includes('Submitting it')===false);assert.ok(privacy.includes('submitting it does not immediately delete'));
for(const file of ['src/components/LoginBox.js','src/components/SignupBox.js','src/components/GoogleAuthCallback.js'])assert.ok(fs.readFileSync(file,'utf8').includes('<AccountPolicyNotice '));
console.log('PASS: 16-language notices, safe new-tab policy links, no bundled ad consent, both signup surfaces, removal of inaccurate legacy promises');
