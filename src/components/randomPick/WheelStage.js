import React,{useEffect,useRef} from 'react';
import {randomInt} from '../../utils/randomPickCore';
import {TAU,wheelWinner} from './gameRules';
const COLORS=['#67cba5','#f7c45c','#77bcf0','#e99bb9','#aa9be5','#eea776','#93ce7a'];
export default function WheelStage({values,draw,stop,onFinish,copy}){
 const canvas=useRef(null),state=useRef({angle:0,velocity:12,elapsed:0,stop:null,finished:false}),callback=useRef(onFinish);callback.current=onFinish;
 useEffect(()=>{state.current={angle:0,velocity:10+randomInt(400)/100,elapsed:0,stop:null,finished:false};},[draw?.token]);
 useEffect(()=>{
  const el=canvas.current,ctx=el?.getContext('2d');if(!ctx)return;let frame,live=true,last=performance.now();
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  function tick(now){if(!live)return;const s=state.current,dt=document.visibilityState==='hidden'?0:Math.min(.05,(now-last)/1000);last=now;
   if(draw&&!s.finished){
    s.elapsed+=dt;
    if((stop||s.elapsed>=5)&&!s.stop){const distance=TAU*(3+randomInt(0x100000000)/0x100000000);s.stop={from:s.angle,distance,elapsed:0,duration:3*distance/s.velocity};}
    if(s.stop){s.stop.elapsed+=dt;const t=Math.min(1,s.stop.elapsed/s.stop.duration);s.angle=s.stop.from+s.stop.distance*(1-(1-t)**3);if(t===1){s.finished=true;callback.current(wheelWinner(values,s.angle),draw.token);}}
    else s.angle+=s.velocity*dt;
   }
   const w=el.clientWidth||640,h=el.clientHeight||560,dpr=Math.min(window.devicePixelRatio||1,2);if(el.width!==w*dpr||el.height!==h*dpr){el.width=w*dpr;el.height=h*dpr;}ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);ctx.fillStyle='#fcf8ed';ctx.fillRect(0,0,w,h);
   const cx=w/2,cy=h/2+8,r=Math.min(w*.44,h*.41),angle=reduced&&!s.finished?0:s.angle;let edge=0;
   values.forEach((v,i)=>{const a=edge,b=edge+v.percent/100*TAU;edge=b;if(a===b)return;ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,r,a+angle,b+angle);ctx.closePath();ctx.fillStyle=COLORS[i%COLORS.length];ctx.fill();ctx.strokeStyle='#fff9';ctx.lineWidth=2;ctx.stroke();
    const middle=(a+b)/2+angle;ctx.save();ctx.translate(cx+Math.cos(middle)*r*.66,cy+Math.sin(middle)*r*.66);if(draw&&!reduced){let rotation=middle%TAU;if(rotation>Math.PI/2&&rotation<Math.PI*1.5)rotation+=Math.PI;ctx.rotate(rotation);}ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#203a35';ctx.font=`800 ${values.length>35?10:Math.min(18,Math.max(11,v.percent*1.6))}px system-ui`;let name=Array.from(v.row.name);while(name.length>1&&ctx.measureText(name.join('')).width>r*.55)name.pop();if(v.percent>1.3)ctx.fillText(name.join(''),0,0);ctx.restore();
   });
   ctx.beginPath();ctx.arc(cx,cy,r+5,0,TAU);ctx.lineWidth=8;ctx.strokeStyle='#385d50';ctx.stroke();ctx.beginPath();ctx.arc(cx,cy,30,0,TAU);ctx.fillStyle='#fff';ctx.fill();ctx.fillStyle='#263d35';ctx.beginPath();ctx.moveTo(cx-17,cy-r-25);ctx.lineTo(cx+17,cy-r-25);ctx.lineTo(cx,cy-r+15);ctx.fill();
   if(draw&&!s.finished)frame=requestAnimationFrame(tick);
  }tick(last);const observer=new ResizeObserver(()=>{if(!draw||state.current.finished)tick(performance.now());});observer.observe(el);return()=>{live=false;cancelAnimationFrame(frame);observer.disconnect();};
 },[values,draw,stop]);
 return <div className="rp-stage rp-wheel"><canvas ref={canvas} role="img" aria-label={copy.modes.wheel}/></div>;
}
