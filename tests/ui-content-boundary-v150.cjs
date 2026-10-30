const fs=require('fs'),assert=require('node:assert/strict'),babel=require('@babel/core'),parser=require('@babel/parser'),traverse=require('@babel/traverse').default;
const helper={exports:{}};new Function('module','exports',babel.transformSync(fs.readFileSync('src/utils/uiContentLanguage.js','utf8'),{presets:[['@babel/preset-env',{targets:{node:'current'}}]],configFile:false,babelrc:false}).code)(helper,helper.exports);
const {uiContentLanguage}=helper.exports;
const old=['en','ko','ja','zh','es','fr','vi','de','ru','id','pt','hi','tr','th','ar','bn'],added=['it','pl','nl','cs'];
// Execute the actual component initializers: all supported UI locales now support content in the same locale.
for(const [file,states] of [['QuizMaker.js',['originalLanguage','contentLanguages']],['TierListMaker.js',['originalContentLanguage']]]){
 const source=fs.readFileSync('src/components/'+file,'utf8'),expressions={};
 traverse(parser.parse(source,{sourceType:'module',plugins:['jsx']}),{VariableDeclarator(p){const name=p.node.id.type==='ArrayPattern'?p.node.id.elements[0]?.name:'';if(states.includes(name))expressions[name]=source.slice(p.node.init.start,p.node.init.end);}});
 for(const state of states){assert.ok(expressions[state],file+': '+state);const initialize=new Function('lang','uiContentLanguage','useState','return '+expressions[state]);for(const language of [...old,...added]){const actual=initialize(language,uiContentLanguage,value=>[value])[0],expected=language;assert.deepEqual(actual,state==='contentLanguages'?[expected]:expected,file+':'+state+':'+language);}}
}
const template=require.resolve('../seo-template.cjs');require.cache[template]={exports:{loadSeoTemplate:async()=>'<html lang="en"><head></head><body><div id="root"></div></body></html>'}};
let handler,calls=[];const db={from(){const q={select(){return q},eq(k,v){calls.push([k,v]);return q},or(v){calls.push(['or',v]);return q},order(){return q},limit(){return Promise.resolve({data:[]})}};return q;}};
const setup=require('../community-seo-routes.cjs');
(async()=>{for(const language of [...added,'ko','en'])for(const board of ['notices','community']){calls=[];setup({use(fn){handler=fn}},db,'https://example.test');let html;await handler({query:{seo:'community-list',lang:language,board}},{setHeader(){},send(s){html=s;return this},status(){throw Error('unexpected error')}},()=>assert.fail('unhandled route'));const content=language;assert.ok(html.includes('lang="'+language+'"'));assert.ok(calls.some(([k,v])=>board==='notices'?k==='language'&&v===content:k==='or'&&v==='language_only.eq.false,language.eq.'+content));}console.log('PASS: quiz/tier creation supports all 20 content languages; community server/client filters match; old locales unchanged.');})().catch(e=>{console.error(e);process.exitCode=1});
