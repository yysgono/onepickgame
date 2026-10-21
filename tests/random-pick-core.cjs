const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
const core=await import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync('src/utils/randomPickCore.js')).toString('base64'));
const rows=Array.from({length:17},(_,i)=>({id:String(i),name:`Candidate ${i}`,enabled:i!==3,image:''}));
const original=JSON.stringify(rows);const rand=n=>Math.floor(n/2);
for(const mode of core.MODES){const draw=core.createDraw(mode,rows,3,rand);assert.equal(draw.pool.length,16);if(mode==='pinball'){assert.equal(draw.winner,null);assert(Number.isInteger(draw.seed));continue;}assert(!draw.ordered.some(x=>x.id==='3'));assert.equal(new Set(draw.ordered.map(x=>x.id)).size,16);if(mode==='teams'){assert.deepEqual(draw.groups.map(g=>g.length),[6,5,5]);}if(mode==='ladder'){assert.equal(new Set(draw.destinations).size,16);assert(draw.rungs.every(r=>r.left>=0&&r.left<15));}}
assert.equal(JSON.stringify(rows),original);assert.throws(()=>core.createDraw('wheel',[],2));assert.throws(()=>core.createDraw('bad',rows));
assert.equal(core.safeImage('javascript:alert(1)'), '');assert.equal(core.safeImage('https://x.test/a.mp4'),'');assert.equal(core.normalizeCandidates([{name:'Text'}])[0].image,'');assert.equal(core.normalizeCandidates('invalid').length,0);assert.equal(core.normalizeCandidates(Array(300).fill({name:'x'})).length,200);
let reads=0;assert.equal(core.randomInt(3,{getRandomValues(a){a[0]=reads++?4:0xffffffff;}}),1);assert.equal(reads,2);assert.throws(()=>core.randomInt(0));
const copy=require('../src/components/randomPick/randomPickCopy.json');assert.equal(Object.keys(copy).length,16);for(const c of Object.values(copy)){assert.equal(Object.keys(c.modes).length,9);assert(Object.values(c).every(v=>v!==undefined&&v!==''));}
console.log('PASS: 9 modes, excluded candidates, balanced teams, ladder bijection, input immutability, limits, URL safety, random rejection sampling, 16 locales');
})().catch(e=>{console.error(e);process.exitCode=1;});
