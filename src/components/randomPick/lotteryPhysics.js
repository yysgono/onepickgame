// Original air-mix simulation. Draw results are supplied separately; no duplicate winners.
export function makeLottery(rows,winners=[],seed=1){
 let value=seed>>>0;const random=()=>{value=(Math.imul(value,1664525)+1013904223)>>>0;return value/4294967296;};
 const radius=Math.min(21,110/Math.sqrt(Math.max(1,rows.length)));
 return {time:0,winners,released:[],exit:null,done:false,balls:rows.map((row,i)=>{const angle=random()*Math.PI*2,r=Math.sqrt(random())*105;return {row,index:i,x:Math.cos(angle)*r,y:Math.sin(angle)*r,vx:(random()-.5)*520,vy:(random()-.5)*520,r:radius,removed:false};})};
}
export function stepLottery(scene,dt,mixing=true){
 scene.time+=dt;
 if(mixing&&!scene.exit&&scene.time>=5&&scene.released.length<scene.winners.length){const row=scene.winners[scene.released.length],ball=scene.balls.find(b=>b.row.id===row.id);if(ball)scene.exit={ball,fromX:ball.x,fromY:ball.y,elapsed:0};}
 const active=scene.balls.filter(b=>!b.removed&&b!==scene.exit?.ball);
 for(const b of active){
  if(mixing){b.vx+=(Math.sin(scene.time*4+b.index*2.7)*1300-b.y*3)*dt;b.vy+=(Math.cos(scene.time*5+b.index*1.9)*1100+b.x*3-80)*dt;const speed=Math.hypot(b.vx,b.vy);if(speed>440){b.vx*=440/speed;b.vy*=440/speed;}}
  else {b.vy+=450*dt;b.vx*=.99;}
  b.x+=b.vx*dt;b.y+=b.vy*dt;
 }
 for(let i=0;i<active.length;i++)for(let j=i+1;j<active.length;j++){
  const a=active[i],b=active[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),min=a.r+b.r;
  if(d<min){const nx=d>0?dx/d:1,ny=d>0?dy/d:0,p=(min-d)/2;a.x-=nx*p;a.y-=ny*p;b.x+=nx*p;b.y+=ny*p;const speed=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;if(speed<0){const impulse=-(mixing?.95:.6)*speed;a.vx-=impulse*nx;a.vy-=impulse*ny;b.vx+=impulse*nx;b.vy+=impulse*ny;}}
 }
 for(const b of active){const d=Math.hypot(b.x,b.y),bound=153-b.r;if(d>bound){const nx=b.x/d,ny=b.y/d;b.x=nx*bound;b.y=ny*bound;const speed=b.vx*nx+b.vy*ny;if(speed>0){b.vx-=1.88*speed*nx;b.vy-=1.88*speed*ny;}}}
 if(scene.exit){const e=scene.exit;e.elapsed+=dt;const t=Math.min(1,e.elapsed/1.6);if(t<.45){const p=t/.45;e.ball.x=e.fromX*(1-p);e.ball.y=e.fromY+(148-e.fromY)*p;}else{const p=(t-.45)/.55;e.ball.x=Math.sin(p*Math.PI)*45;e.ball.y=148+100*p;}if(t===1){e.ball.removed=true;scene.released.push(e.ball.row);scene.exit=null;}}
 scene.done=mixing&&scene.winners.length>0&&scene.released.length===scene.winners.length;
}
