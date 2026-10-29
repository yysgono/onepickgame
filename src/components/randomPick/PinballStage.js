import PinballResults from './PinballResults';
import React,{useEffect,useRef,useState} from 'react';
import {makeRace,stepRace,obstacles,startPosition,cameraPosition,WIDTH,FINISH,DT} from './pinballPhysics';
const COLORS=['#6ee7b7','#7dd3fc','#fcd34d','#fda4af','#c4b5fd','#fdba74'];
function text(ctx,value,x,y,size=13,color='#eafff5',max=160){ctx.font=`700 ${size}px system-ui`;ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';const chars=Array.from(String(value));while(chars.length>1&&ctx.measureText(chars.join('')).width>max)chars.pop();ctx.fillText(chars.join(''),x,y);}
function render(ctx,race,rows,width,height,images){
 const scale=width/WIDTH,viewH=height/scale;
 const lead=race?Math.max(80,...race.balls.filter(b=>!b.finished).map(b=>b.y)):80;
 const camera=cameraPosition(race,viewH);
 ctx.fillStyle='#152344';ctx.fillRect(0,0,width,height);ctx.save();ctx.scale(scale,scale);ctx.translate(0,-camera);
 ctx.strokeStyle='#2a3c65';ctx.lineWidth=1;for(let y=0;y<FINISH;y+=45){ctx.beginPath();ctx.moveTo(20,y);ctx.lineTo(580,y);ctx.stroke();}
 ctx.strokeStyle='#8296db';ctx.lineWidth=6;ctx.strokeRect(20,-200,560,FINISH+250);
 const scene=obstacles(race?.time||0,race?.phase||0);
 const circle=(x,y,r,color)=>{ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();ctx.strokeStyle='#ffffff77';ctx.lineWidth=2;ctx.stroke();};
 scene.circles.forEach(o=>{circle(o.x,o.y,o.r,'#69a6e9');circle(o.x-3,o.y-3,3,'#e7eeff');});
 scene.segments.forEach(o=>{ctx.lineWidth=o.r*2;ctx.lineCap='round';ctx.strokeStyle=o.type==='rotor'?'#b9a4f4':'#f8b970';ctx.beginPath();ctx.moveTo(o.ax,o.ay);ctx.lineTo(o.bx,o.by);ctx.stroke();if(o.type==='rotor')circle(o.cx,o.cy,13,'#f8fafc');});
 for(let i=0;i<20;i++){ctx.fillStyle=i%2?'#fff':'#34575b';ctx.fillRect(22+i*28,FINISH,28,14);}
 text(ctx,'ONE PICK GAME',300,FINISH+42,24,'#afffe2',400);
 const balls=race?.balls||rows.map((row,i)=>({row,index:i,...startPosition(i,rows.length),r:9}));
 balls.forEach(b=>{if(b.finished)return;if(b.y<camera-50||b.y>camera+viewH+50)return;circle(b.x,b.y,b.r,COLORS[b.index%6]);const img=images.get(b.row.image);if(img?.complete&&img.naturalWidth){ctx.save();ctx.beginPath();ctx.arc(b.x,b.y,b.r-1,0,Math.PI*2);ctx.clip();const s=Math.max(b.r*2/img.naturalWidth,b.r*2/img.naturalHeight);ctx.drawImage(img,b.x-img.naturalWidth*s/2,b.y-img.naturalHeight*s/2,img.naturalWidth*s,img.naturalHeight*s);ctx.restore();}if(balls.length<=40||b.y>=lead-70){const labelWidth=(!race||race.time<.15)?Math.min(92,500/Math.min(20,balls.length)-4):80;ctx.font='700 11px system-ui';const chars=Array.from(String(b.row.name));while(chars.length>1&&ctx.measureText(chars.join('')).width>labelWidth-4)chars.pop();const boxWidth=Math.min(labelWidth,ctx.measureText(chars.join('')).width+4);ctx.fillStyle='#15213ce6';ctx.fillRect(b.x-boxWidth/2,b.y+12,boxWidth,19);text(ctx,chars.join(''),b.x,b.y+22,11,'#f5fffa',labelWidth-4);}});
 ctx.restore();ctx.fillStyle='#152344ee';ctx.fillRect(0,0,width,48);text(ctx,'ONE PICK GAME',width/2,24,17,'#cbffe9',width-130);text(ctx,race?`${race.time.toFixed(1)}s`:`${rows.length}`,width-40,24,12);
 ctx.fillStyle='#447269';ctx.fillRect(16,height-13,width-32,5);ctx.fillStyle='#6ee7b7';ctx.fillRect(16,height-13,(width-32)*(race?.order?.length?1:Math.min(1,lead/FINISH)),5);
}
export default function PinballStage({rows,draw,done,fast,onFinish,onError,copy,beforeResults}){
 const [arrivals,setArrivals]=useState([]);
 const canvas=useRef(null),raceRef=useRef(null),finished=useRef(false),images=useRef(new Map()),callbacks=useRef({onFinish,onError});callbacks.current={onFinish,onError};
 useEffect(()=>{images.current.clear();const pending=[];rows.forEach(row=>{if(!row.image||images.current.has(row.image))return;const image=new Image();image.referrerPolicy='no-referrer';image.src=row.image;images.current.set(row.image,image);pending.push(image);});return()=>{pending.forEach(i=>{i.onload=null;});images.current.clear();};},[rows]);
 useEffect(()=>{raceRef.current=draw?makeRace(draw.pool,draw.seed):null;finished.current=false;setArrivals([]);},[draw?.token,draw?.seed]);
 useEffect(()=>{
  const el=canvas.current,ctx=el?.getContext('2d');if(!ctx)return;
  let frame,live=true,last=performance.now(),accumulator=0;

  function tick(now){if(!live)return;const race=raceRef.current;
   if(race&&!done&&!finished.current&&document.visibilityState!=='hidden'){
    if(fast){for(let i=0;i<480&&!race.complete&&!race.failed;i++)stepRace(race);}
    else{accumulator+=Math.min(.05,(now-last)/1000);while(accumulator>=DT){stepRace(race);accumulator-=DT;}}
    if(race.order.length!==race.reported){race.reported=race.order.length;setArrivals([...race.order]);}
    if(race.complete){finished.current=true;callbacks.current.onFinish([...race.order],draw.token);}
    else if(race.failed){finished.current=true;callbacks.current.onError();}
   }
   last=now;const width=el.clientWidth||640,height=el.clientHeight||560,dpr=Math.min(window.devicePixelRatio||1,2);
   if(el.width!==Math.round(width*dpr)||el.height!==Math.round(height*dpr)){el.width=Math.round(width*dpr);el.height=Math.round(height*dpr);}
   ctx.setTransform(dpr,0,0,dpr,0,0);render(ctx,race,rows,width,height,images.current);
   if(!finished.current&&!done)frame=requestAnimationFrame(tick);
  }
  frame=requestAnimationFrame(tick);return()=>{live=false;cancelAnimationFrame(frame);};
 },[draw,done,fast,rows]);
 return <><div className="rp-stage rp-pinball-stage"><canvas ref={canvas} role="img" aria-label={`${copy.modes.pinball} — ${copy.participants}: ${rows.length}`}/></div>{beforeResults}<PinballResults key={draw?.token||'ready'} arrivals={arrivals} total={rows.length} copy={copy}/></>;
}

