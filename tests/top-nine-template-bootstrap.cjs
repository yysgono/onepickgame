const assert=require('node:assert/strict'),fs=require('fs'),babel=require('@babel/core'),{JSDOM}=require('jsdom');
const {renderTemplateHtml}=require('../top-nine-template-routes.cjs');
const copy=require('../src/components/topNine/copy.json');
const source={id:'b1168231-f7da-4be1-afb9-17db9dfb2fa1',title:'Test </script><script>alert(1)</script>',data:Array.from({length:20},(_,i)=>({name:'Candidate '+i,image:'https://example.com/'+i+'.jpg'}))};
const shell='<html><head></head><body><div id="root"><div class="loading-screen">Loading...</div></div></body></html>';
const moduleShim={exports:{}};
new Function('module','exports',babel.transformSync(fs.readFileSync('src/components/topNine/templateBootstrap.js','utf8'),{presets:[['@babel/preset-env',{targets:{node:'current'}}]],configFile:false,babelrc:false}).code)(moduleShim,moduleShim.exports);
const read=moduleShim.exports.readTemplateBootstrap;
for(const lang of Object.keys(copy)){
 const dom=new JSDOM(renderTemplateHtml(shell,'https://www.onepickgame.com',lang,source));global.document=dom.window.document;
 assert.equal(document.querySelectorAll('article img').length,12);
 assert.equal(document.querySelectorAll('script').length,1);
 assert.equal(document.querySelector('.loading-screen'),null);
 assert.deepEqual(read(source.id),source);assert.equal(read('other-id'),null);
 assert.equal(document.querySelector('meta[name=robots]').content,'index,follow');
 assert(document.querySelector('link[rel=canonical]').href.includes('/'+lang+'/mytop9/templates/'));
 document.querySelector('script').textContent='invalid json';assert.equal(read(source.id),null);dom.window.close();
}
delete global.document;assert.equal(read(source.id),null);
console.log('20-language template HTML, 12 candidate images, safe JSON, matching IDs and malformed/missing bootstrap fallback passed.');
