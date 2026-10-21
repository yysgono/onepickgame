const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 const {paintPinball,PINBALL_DURATION}=await import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync('src/components/randomPick/pinballScene.js','utf8')).toString('base64'));
 assert.equal(PINBALL_DURATION,20000);
 let calls=0;const ctx=new Proxy({},{get:()=> (...args)=>{for(const x of args)if(typeof x==='number')assert(Number.isFinite(x));calls++;},set:()=>true});
 const pool=Array.from({length:200},(_,i)=>({id:String(i),name:'Candidate '+i,image:''}));
 const draw={pool,winner:pool[199]};
 for(const width of [280,640,1200])for(const p of [0,.1,.25,.5,.75,.95,1])paintPinball(ctx,pool,draw,p,width,560,2.5,()=>{},new Map());
 assert(calls>1000);assert.equal(pool.length,200);assert.equal(pool[31].id,'31');
 console.log('PASS: pinball intermediate frames, 3 widths, 200 candidates, finite coordinates, immutable pool');
})().catch(e=>{console.error(e);process.exitCode=1});
