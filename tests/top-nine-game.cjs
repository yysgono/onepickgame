const assert=require('assert/strict'),fs=require('fs'),babel=require('@babel/core');const mod={exports:{}};new Function('module','exports',babel.transformSync(fs.readFileSync('src/components/topNine/game.js','utf8'),{presets:[['@babel/preset-env',{targets:{node:'current'}}]],babelrc:false,configFile:false}).code)(mod,mod.exports);const g=mod.exports;
const pool=Array.from({length:2048},(_,i)=>({id:String(i),name:'Candidate '+i,src:'https://example.test/'+i+'.jpg'}));
assert.deepEqual(g.candidateCountOptions(100),[9,18,27,36,45,54,75,100]);assert.deepEqual(g.candidateCountOptions(8),[]);
for(const count of [9,18,27,36,45,54,75,100,125,476,2048]){const game=g.createGame(pool,String(count),()=>0.25);assert.equal(game.participants.length,count);assert.equal(game.size,count<=54?9:25);assert.equal(new Set(game.participants.map(c=>c.id)).size,count);assert(game.participants.every(c=>pool.includes(c)));}
assert.equal(g.createGame(pool.slice(0,18),'100').participants.length,18);const original=pool.slice();g.createGame(pool,'54');assert.deepEqual(pool,original);
// Blank pages are valid; a short final batch advances as byes, not a broken page.
let game=g.createGame(pool.slice(0,100),'all',()=>0);for(let i=0;i<4;i++)game=g.advanceGame(game);assert.equal(game.status,'short');assert.equal(game.chosen.length,0);assert.equal(game.remaining.length,100);
let filled=g.fillRemaining(game,()=>0.5);assert.equal(filled.status,'done');assert.equal(filled.chosen.length,9);assert.equal(new Set(filled.chosen.map(c=>c.id)).size,9);
let bye=g.createGame(pool.slice(0,80),'all',()=>0);const byes=bye.byes.map(c=>c.id);assert.equal(byes.length,5);for(let i=0;i<3;i++)bye=g.advanceGame(bye);assert.equal(bye.status,'short');assert.deepEqual(bye.chosen.map(c=>c.id),byes);
const extra=g.fillRemaining(bye,()=>0.4);assert(bye.chosen.every(c=>extra.chosen.includes(c)));assert.equal(extra.chosen.length,9);
// Explicit Choose more keeps the already selected participants and never offers them again.
const more=g.chooseMore(bye);assert.equal(more.locked.length,5);assert.equal(more.pool.length,75);assert(more.pool.every(c=>!byes.includes(c.id)));assert.equal(more.size,25);
// Reduce only survivors; skipped candidates do not silently re-enter a normal round.
let reduce=g.createGame(pool.slice(0,54),'all',()=>0),winners=[];for(let i=0;i<6;i++){const batch=g.currentBatch(reduce);for(const c of batch.slice(0,2)){reduce=g.toggleGameCandidate(reduce,c.id);winners.push(c.id);}reduce=g.advanceGame(reduce);}assert.equal(reduce.pool.length,12);assert(reduce.reduction);assert(reduce.pool.every(c=>winners.includes(c.id)));assert.equal(reduce.byes.length,3);for(const c of g.currentBatch(reduce).slice(0,6))reduce=g.toggleGameCandidate(reduce,c.id);reduce=g.advanceGame(reduce);assert.equal(reduce.status,'done');assert.equal(reduce.chosen.length,9);
// A single-candidate toggle is reversible and an off-page ID cannot be marked.
let toggle=g.createGame(pool,'9',()=>0),id=g.currentBatch(toggle)[0].id;toggle=g.toggleGameCandidate(toggle,id);assert.equal(toggle.marked.length,1);toggle=g.toggleGameCandidate(toggle,id);assert.equal(toggle.marked.length,0);assert.equal(g.toggleGameCandidate(toggle,'off-page'),toggle);
for(const lang of Object.values(require('../src/components/topNine/copy.json')))assert(lang);
const copy=require('../src/components/topNine/gameCopy.json');assert.equal(Object.keys(copy).length,20);for(const [lang,words]of Object.entries(copy))for(const key of Object.keys(copy.en))assert.equal(typeof words[key],'string',lang+':'+key);
console.log('Top 9 game: count options, sampling, 9/25 batches, optional skips, byes, finalist reduction, Choose more, random fill, deduplication and 20 locales passed');
