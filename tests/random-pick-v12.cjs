const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),babel=require('@babel/core');
const cache={};function load(file){file=path.resolve(file);if(cache[file])return cache[file].exports;const module={exports:{}};cache[file]=module;const code=babel.transformSync(fs.readFileSync(file,'utf8'),{filename:file,presets:[['@babel/preset-env',{targets:{node:'current'}}]],babelrc:false,configFile:false}).code;new Function('require','module','exports',code)(name=>name.startsWith('.')?load(path.resolve(path.dirname(file),name)+'.js'):require(name),module,module.exports);return module.exports;}
const {constrainedTeams}=load('src/components/randomPick/teamRules.js');
const rows=Array.from({length:12},(_,i)=>({id:String(i),name:'Name '+i}));
for(let seed=1;seed<=60;seed++){let state=seed;const next=n=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state%n;};const rules=[{a:'0',b:'1',type:'together'},{a:'1',b:'2',type:'together'},{a:'0',b:'3',type:'apart'},{a:'4',b:'5',type:'apart'}];const result=constrainedTeams(rows,3,rules,next),team=id=>result.findIndex(g=>g.some(r=>r.id===id));assert.deepEqual(result.map(r=>r.length),[4,4,4]);assert.equal(new Set(result.flat().map(r=>r.id)).size,12);assert.equal(team('0'),team('2'));assert.notEqual(team('0'),team('3'));assert.notEqual(team('4'),team('5'));}
assert.throws(()=>constrainedTeams(rows,3,[{a:'0',b:'1',type:'together'},{a:'0',b:'1',type:'apart'}]),/TEAM_CONFLICT/);
assert.throws(()=>constrainedTeams(rows.slice(0,3),2,[{a:'0',b:'1',type:'apart'},{a:'0',b:'2',type:'apart'},{a:'1',b:'2',type:'apart'}]),/TEAM_CONFLICT/);
assert.equal(constrainedTeams(rows.slice(0,5),2,[]).flat().length,5);
assert.equal(constrainedTeams(rows,3,[{a:'deleted',b:'0',type:'apart'}]).flat().length,12);
assert.equal(constrainedTeams(Array.from({length:200},(_,i)=>({id:String(i)})),20,[]).flat().length,200);
const copy=JSON.parse(fs.readFileSync('src/components/randomPick/randomPickCopy.json'));for(const c of Object.values(copy))for(const k of ['setupTitle','setupHelp','prepare','teamRules','together','apart','teamConflict','teamLimit','teamRulesHelp'])assert(c[k]);
console.log('PASS: constrained balanced teams, transitive groups, conflicting rules, stale candidates, 200 candidates and 16-language UI copy');
