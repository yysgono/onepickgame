import React,{useEffect,useRef,useState} from 'react';
import {makeLottery,stepLottery} from './lotteryPhysics';
const colors=['#ef6e87','#f9c453','#8b9ff3','#51c2d6','#b784db','#f7a56d'];
export default function LotteryStage({rows,draw,done,onDone,copy}){
 const canvas=useRef(null),sceneRef=useRef(null),callback=useRef(onDone),[released,setReleased]=useState([]);callback.current=onDone;
 useEffect(()=>{sceneRef.current=makeLottery(rows,draw?.winners||[],draw?.token||1);setReleased([]);},[rows,draw?.token]);
 useEffect(()=>{const el=canvas.current,ctx=el?.getContext('2d');if(!ctx)return;let frame,live=true,last=performance.now(),accumulator=0;function tick(now){if(!live)return;const scene=sceneRef.current;if(!scene)return;const dt=document.visibilityState==='hidden'?0:Math.min(.05,(now-last)/1000);last=now;accumulator+=dt;
 while(accumulator>=1/120&&!scene.done){stepLottery(scene,1/120,Boolean(draw));accumulator-=1/120;}
 if(done){scene.balls.forEach(b=>{if(draw?.winners.some(w=>w.id===b.row.id))b.removed=true;});scene.exit=null;}
 const shown=done?draw?.winners||[]:scene.released;if(scene.reported!==shown.length){scene.reported=shown.length;setReleased([...shown]);}
 const w=el.clientWidth||640,h=el.clientHeight||600,dpr=Math.min(window.devicePixelRatio||1,2);if(el.width!==w*dpr||el.height!==h*dpr){el.width=w*dpr;el.height=h*dpr;}ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#f8f4fe';ctx.fillRect(0,0,w,h);const scale=Math.min(w/440,h/510),cx=w/2,cy=h*.37;
 ctx.save();ctx.translate(cx,cy);ctx.scale(scale,scale);
 // Stand, glass, and a visible outlet tube leading to the catch tray.
 ctx.fillStyle='#7061bb';ctx.beginPath();ctx.roundRect(-175,150,350,148,30);ctx.fill();ctx.fillStyle='#d8d2f2';ctx.beginPath();ctx.roundRect(-30,138,60,115,16);ctx.fill();ctx.strokeStyle='#4e428d';ctx.lineWidth=4;ctx.stroke();ctx.fillStyle='#302950';ctx.beginPath();ctx.roundRect(-96,245,192,34,15);ctx.fill();
 ctx.fillStyle='#fffef8';ctx.beginPath();ctx.arc(0,0,166,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#8a81b6';ctx.lineWidth=9;ctx.stroke();
 ctx.save();ctx.beginPath();ctx.arc(0,0,156,0,Math.PI*2);ctx.clip();
 function ball(b){ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fillStyle=colors[b.index%colors.length];ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#ffffff80';ctx.beginPath();ctx.arc(b.x-b.r*.25,b.y-b.r*.25,b.r*.25,0,Math.PI*2);ctx.fill();if(rows.length<=50){ctx.fillStyle='#20233e';ctx.textAlign='center';ctx.font=`800 ${Math.max(8,Math.min(12,b.r*.65))}px system-ui`;ctx.fillText(b.row.name.slice(0,7),b.x,b.y+4);}}
 scene.balls.filter(b=>!b.removed&&b!==scene.exit?.ball).forEach(ball);if(scene.exit&&scene.exit.ball.y<145)ball(scene.exit.ball);ctx.restore();
 ctx.strokeStyle='#ffffffaa';ctx.lineWidth=7;ctx.beginPath();ctx.arc(0,0,154,Math.PI*1.06,Math.PI*1.5);ctx.stroke();ctx.fillStyle='#292143';ctx.beginPath();ctx.ellipse(0,153,27,9,0,0,Math.PI*2);ctx.fill();if(scene.exit&&scene.exit.ball.y>=145)ball(scene.exit.ball);
 ctx.textAlign='center';ctx.fillStyle='#fff';ctx.font='800 14px system-ui';ctx.fillText('ONE PICK GAME',0,287);ctx.restore();
 if(scene.done&&!done){callback.current();return;}if(!done&&(draw||scene.time<3))frame=requestAnimationFrame(tick);
 }frame=requestAnimationFrame(tick);return()=>{live=false;cancelAnimationFrame(frame);};},[rows,draw?.token,done]);
 return <><div className="rp-stage rp-lottery"><canvas ref={canvas} role="img" aria-label={copy.modes.lotto}/></div><div className="rp-lottery-names" aria-live="polite">{released.map((row,i)=><span key={row.id}><b>{i+1}</b> {row.name}</span>)}</div></>;
}
