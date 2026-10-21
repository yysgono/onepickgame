const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const {cameraPosition,FINISH}=await import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync('src/components/randomPick/pinballPhysics.js')).toString('base64'));
 assert.equal(cameraPosition(null,600),0);
 const race={order:[],balls:[{y:2300},{y:200}]};
 assert(cameraPosition(race,600)>0);
 race.order.push({id:'winner'});race.balls[0].finished=true;
 assert.equal(cameraPosition(race,600),FINISH-600+100);
 race.balls[1].finished=true;
 assert.equal(cameraPosition(race,600),FINISH-600+100);
 assert.equal(cameraPosition(race,800),FINISH-800+100);
 assert.equal(cameraPosition({order:[],balls:[{y:90}]},600),0);
 console.log('PASS: finish camera remains locked after first/all arrivals, resize and restart');
})().catch(e=>{console.error(e);process.exitCode=1});
