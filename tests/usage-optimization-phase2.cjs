const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
const {injectInitialTranslations}=require('../initial-translations.cjs');
const metadata=require('../src/seo/worldcupMetadata.js');
const shell='<html><head><title>Keep</title></head><body></body></html>';
const langs='ko ja zh es fr vi de ru id pt hi tr th ar bn it pl nl cs'.split(' ');
test('all initial translations retain byte-identical escaped JSON and do not duplicate',()=>{
 for(const language of langs){
  const messages=require('../src/locales/'+language+'/translation.json');
  const payload=JSON.stringify({language,messages}).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
  const expected=shell.replace('</head>',()=>'<script type="application/json" id="onepick-initial-translations">'+payload+'</script></head>');
  assert.equal(injectInitialTranslations(shell,language),expected);
  assert.equal(injectInitialTranslations(shell,language),expected);
  assert.equal(injectInitialTranslations(expected,language),expected);
 }
 assert.equal(injectInitialTranslations(shell,'en'),shell);
});
function compile(file,requireMock){
 const source=fs.readFileSync(file,'utf8');
 const result=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true},reportDiagnostics:true});
 assert.equal(result.diagnostics.filter(d=>d.category===ts.DiagnosticCategory.Error).length,0);
 const mod={exports:{}};new Function('require','module','exports',result.outputText)(requireMock,mod,mod.exports);return mod.exports;
}
test('fresh tag data requires a full DB read and expires; missing tags still require lookup',async()=>{
 let data={id:'cup',tags:['a']};const chain={select(){return this},eq(){return this},is(){return this},single:async()=>({data,error:null})};
 const api=compile('src/utils/supabaseWorldcupApi.js',id=>id==='./supabaseClient'?{supabase:{from:()=>chain}}:{});
 const now=Date.now;let tick=1000;Date.now=()=>tick;
 try{
  assert.equal(api.hasFreshWorldcupTags(data),false);const cup=await api.getWorldcupGame('cup');assert.equal(api.hasFreshWorldcupTags(cup),true);
  assert.equal(api.hasFreshWorldcupTags({...cup}),false);tick+=30000;assert.equal(api.hasFreshWorldcupTags(cup),false);
  data={id:'cup',tags:null};assert.equal(api.hasFreshWorldcupTags(await api.getWorldcupGame('cup')),false);
  data={id:'cup',tags:[]};assert.equal(api.hasFreshWorldcupTags(await api.getWorldcupGame('cup')),true);
 }finally{Date.now=now;}
});
function seoFixture(documentValue){
 let selected,initialized=false,effect,resolve,calls=0;
 const react={useState(init){if(!initialized){selected=init();initialized=true;}return [selected,v=>{selected=v;}];},useEffect(fn){effect=fn;},createElement(_type,props){return props;}};
 const original=global.document;global.document=documentValue;
 const component=compile('src/seo/WorldcupDetailSeo.js',id=>id==='react'?react:id==='./Seo'?()=>null:id==='./worldcupMetadata'?metadata:{fetchWinnerStatsFromDB:()=>{calls++;return new Promise(r=>{resolve=r;});}}).default;
 return {render:cup=>component({cup}),run:()=>effect(),finish:stats=>resolve(stats),calls:()=>calls,close:()=>{global.document=original;}};
}
const cup={id:'test',data:[{id:'a',image:'https://example.com/a.png'},{id:'b',image:'https://example.com/b.png'}]};
test('SEO keeps server OG image and needs no extra client stats lookup',()=>{
 const f=seoFixture({querySelector:s=>s.includes('canonical')?{href:'https://www.onepickgame.com/ko/select-round/test'}:{content:'https://example.com/server.png'}});
 try{assert.equal(f.render(cup).image,'https://example.com/server.png');f.run();assert.equal(f.calls(),0);}finally{f.close();}
});
test('client SEO uses existing winner stats with immediate fallback and ignores cancelled requests',async()=>{
 const f=seoFixture(undefined);
 try{assert.equal(f.render(cup).image,cup.data[0].image);let cancel=f.run();f.finish([{candidate_id:'b',win_count:5}]);await Promise.resolve();assert.equal(f.render(cup).image,cup.data[1].image);cancel();
  const other={id:'next',data:[{id:'x',image:'https://example.com/x.png'}]};assert.equal(f.render(other).image,other.data[0].image);cancel=f.run();cancel();f.finish([]);await Promise.resolve();assert.equal(f.render(other).image,other.data[0].image);
 }finally{f.close();}
});
test('changed round page parses, and the missing API call is gone',()=>{
 const source=fs.readFileSync('src/components/SelectRoundPage.js','utf8');
 const file=ts.createSourceFile('SelectRoundPage.jsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JSX);
 assert.equal(file.parseDiagnostics.length,0);assert.match(source,/if \(hasFreshWorldcupTags\(cup\)\)/);assert.doesNotMatch(fs.readFileSync('src/seo/WorldcupDetailSeo.js','utf8'),/\/api\/worldcup-seo-image/);
});
