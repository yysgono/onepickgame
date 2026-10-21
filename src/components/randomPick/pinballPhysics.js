// Original fixed-step circle/segment simulation. No third-party game code or assets.
export const WIDTH=600, FINISH=2360, DT=1/120;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function startPosition(index,count){
 const columns=Math.min(20,count),row=Math.floor(index/20),inRow=Math.min(columns,count-row*20);
 return {x:50+(index%20+.5)*500/Math.max(1,inRow),y:90-row*25};
}
export function makeRace(pool,seed){
 let state=seed>>>0;
 const rng=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
 const slots=pool.map((_,i)=>i);
 for(let i=slots.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[slots[i],slots[j]]=[slots[j],slots[i]];}
 const balls=pool.map((row,i)=>({row,...startPosition(slots[i],pool.length),vx:(rng()-.5)*34,vy:0,r:9,index:i}));
 return {balls,time:0,winner:null,order:[],complete:false,failed:false,phase:rng()*Math.PI*2,collisions:0};
}
export function obstacles(time,phase){
 const circles=[],segments=[];
 for(let zone=0;zone<5;zone++){
  const top=280+zone*390;
  for(let line=0;line<2;line++)for(let col=0;col<7;col++)circles.push({x:60+col*76+(line%2?22:0),y:top+line*55,r:12+(col%3)*2});
  const cx=zone%2?370:230,cy=top+145,omega=zone%2?-.75:.75,angle=time*omega+phase+zone;
  segments.push({ax:cx-Math.cos(angle)*100,ay:cy-Math.sin(angle)*100,bx:cx+Math.cos(angle)*100,by:cy+Math.sin(angle)*100,cx,cy,omega,r:7,type:'rotor'});
  const opening=300+Math.sin(time*.8+phase+zone)*150,velocity=Math.cos(time*.8+phase+zone)*120;
  segments.push({ax:18,ay:top+255,bx:opening-65,by:top+285,r:6,type:'gate',vx:velocity});
  segments.push({ax:opening+65,ay:top+285,bx:582,by:top+255,r:6,type:'gate',vx:velocity});
 }
 return {circles,segments};
}
function collide(ball,x,y,r,ovx=0,ovy=0){
 let dx=ball.x-x,dy=ball.y-y,dist=Math.hypot(dx,dy),min=ball.r+r;
 if(dist>=min)return false;
 if(dist<.00001){dx=0;dy=-1;dist=1;}
 const nx=dx/dist,ny=dy/dist;
 ball.x=x+nx*(min+.05);ball.y=y+ny*(min+.05);
 const vn=(ball.vx-ovx)*nx+(ball.vy-ovy)*ny;
 if(vn<0){ball.vx-=1.65*vn*nx;ball.vy-=1.65*vn*ny;}
 return true;
}
export function stepRace(race){
 if(race.complete||race.failed)return;
 race.time+=DT;
 const scene=obstacles(race.time,race.phase),crossings=[];
 for(const b of race.balls){
  if(b.finished)continue;
  const before=b.y;
  b.vy=clamp(b.vy+180*DT,-260,210);b.vx=clamp(b.vx*.999,-240,240);
  b.x+=b.vx*DT;b.y+=b.vy*DT;
  if(b.x<24+b.r){b.x=24+b.r;b.vx=Math.abs(b.vx)*.7;}
  if(b.x>576-b.r){b.x=576-b.r;b.vx=-Math.abs(b.vx)*.7;}
  for(const o of scene.circles)if(Math.abs(b.y-o.y)<35&&collide(b,o.x,o.y,o.r))race.collisions++;
  for(const o of scene.segments){
   if(b.y<Math.min(o.ay,o.by)-25||b.y>Math.max(o.ay,o.by)+25)continue;
   const dx=o.bx-o.ax,dy=o.by-o.ay,l=dx*dx+dy*dy;
   const t=clamp(((b.x-o.ax)*dx+(b.y-o.ay)*dy)/l,0,1),x=o.ax+t*dx,y=o.ay+t*dy;
   const vx=o.omega?-o.omega*(y-o.cy):(o.vx||0)*.5,vy=o.omega?o.omega*(x-o.cx):0;
   if(collide(b,x,y,o.r,vx,vy))race.collisions++;
  }
  if(b.y>=FINISH)crossings.push({ball:b,fraction:(FINISH-before)/Math.max(.0001,b.y-before)});
 }
 // Spatial buckets keep the 200-candidate case bounded.
 const cells=new Map();
 for(const b of race.balls){
  if(b.finished)continue;
  const gx=Math.floor(b.x/22),gy=Math.floor(b.y/22);
  for(let x=gx-1;x<=gx+1;x++)for(let y=gy-1;y<=gy+1;y++)for(const a of cells.get(`${x}:${y}`)||[]){
   const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),min=a.r+b.r;
   if(d>0&&d<min){const nx=dx/d,ny=dy/d,push=(min-d)/2;a.x-=nx*push;a.y-=ny*push;b.x+=nx*push;b.y+=ny*push;const v=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;if(v<0){const j=-.85*v;a.vx-=j*nx;a.vy-=j*ny;b.vx+=j*nx;b.vy+=j*ny;}race.collisions++;}
  }
  const key=`${gx}:${gy}`;if(!cells.has(key))cells.set(key,[]);cells.get(key).push(b);
 }
 if(crossings.length){crossings.sort((a,b)=>a.fraction-b.fraction||a.ball.index-b.ball.index);for(const {ball,fraction} of crossings){ball.finished=true;ball.finishedAt=race.time-DT+DT*Math.max(0,Math.min(1,fraction));race.order.push(ball.row);}race.winner=race.order[0];}
 race.complete=race.order.length===race.balls.length;
 if(!race.complete&&race.time>=240)race.failed=true;
}

// Keep the finish line in view once the first candidate arrives. A new race resets order.
export function cameraPosition(race, viewHeight) {
 const bottom = Math.max(0, FINISH - viewHeight + 100);
 if (race?.order?.length) return bottom;
 const lead = race ? Math.max(80, ...race.balls.filter(ball => !ball.finished).map(ball => ball.y)) : 80;
 return Math.max(0, Math.min(bottom, lead - viewHeight * .62));
}
