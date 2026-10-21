const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),babel=require('@babel/core');
let requests=0,fail=false;
const supabase={from(){requests++;return{select(){return this},eq(){return this},is(){return this},abortSignal(){return this},async single(){return fail?{error:new Error('Failed')}:{data:{id:'cup',data:[{name:'Original',image:''}]}}}}}};
const modules={};function load(file){file=path.resolve(file);if(modules[file])return modules[file].exports;const mod={exports:{}};modules[file]=mod;const code=babel.transformSync(fs.readFileSync(file,'utf8'),{presets:[['@babel/preset-env',{targets:{node:'current'}}]],babelrc:false,configFile:false}).code;new Function('require','module','exports',code)(name=>name.includes('supabaseClient')?{supabase}:load(path.resolve(path.dirname(file),name)+'.js'),mod,mod.exports);return mod.exports;}
(async()=>{const {importCup}=load('src/components/randomPick/api.js');const {importedCupCache}=load('src/components/randomPick/importCache.js');
let result=await importCup('cup',new AbortController().signal);result.rows[0].name='Edited';result=await importCup('cup',new AbortController().signal);assert.equal(requests,1);assert.equal(result.rows[0].name,'Original');
const aborted=new AbortController();aborted.abort();await assert.rejects(importCup('cup',aborted.signal),{name:'AbortError'});assert.equal(requests,1);
importedCupCache.clear();fail=true;await assert.rejects(importCup('cup',new AbortController().signal));fail=false;await importCup('cup',new AbortController().signal);assert.equal(requests,3);
console.log('PASS: repeated imports use one request, edits isolated, abort respected and failed fetch retried');})().catch(e=>{console.error(e);process.exitCode=1;});
