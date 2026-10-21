import React, { useEffect, useRef, useState } from 'react';
import {paintPinball,PINBALL_DURATION} from './pinballScene';
const colors = ['#10b981','#60a5fa','#fbbf24','#f472b6','#a78bfa','#34d399'];
function label(ctx,text,x,y,max=150,size=16,color='#183c32') {
  ctx.fillStyle=color;ctx.font=`700 ${size}px system-ui, sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';
  const chars=Array.from(String(text)); while(chars.length>1 && ctx.measureText(chars.join('')).width>max) chars.pop();
  ctx.fillText(chars.join('')+(chars.length<Array.from(String(text)).length?'…':''),x,y);
}
function ball(ctx,x,y,r,color,text) {
  ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();
  ctx.strokeStyle='#ffffffbb';ctx.lineWidth=2;ctx.stroke();
  if(text) label(ctx,text,x,y,r*1.7,Math.min(14,r*.48));
}
function paint(ctx,mode,rows,draw,p,w,h,images,seed) {
  ctx.clearRect(0,0,w,h);ctx.fillStyle='#f0faf5';ctx.fillRect(0,0,w,h);
  const cx=w/2,cy=h/2, finish=p>=1, winner=draw?.winner || rows[0];
  const sample=draw ? [winner,...draw.pool.filter(x=>x.id!==winner.id)].slice(0,32) : rows.slice(0,32);
  const name=winner?.name || 'One Pick Game';
  const card=(row,x,y,cw,ch)=>{ctx.fillStyle='#fff';ctx.fillRect(x-cw/2,y-ch/2,cw,ch);ctx.strokeStyle='#b5e4ce';ctx.lineWidth=3;ctx.strokeRect(x-cw/2,y-ch/2,cw,ch);const img=images.get(row?.image);if(img?.complete&&img.naturalWidth){const scale=Math.min((cw-12)/img.naturalWidth,(ch-48)/img.naturalHeight);ctx.drawImage(img,x-img.naturalWidth*scale/2,y-ch/2+6,img.naturalWidth*scale,img.naturalHeight*scale);}else{label(ctx,row?.name||'?',x,y-12,cw-16,24);}label(ctx,row?.name||'?',x,y+ch/2-22,cw-12,16);};
  if(mode==='wheel') {
    const pool=draw?.pool || rows;const n=Math.max(1,pool.length);const r=Math.min(w*.37,h*.4);
    const index=draw?pool.findIndex(x=>x.id===winner.id):0;
    const target=-Math.PI/2-(index+.5)*Math.PI*2/n + Math.PI*12;
    const angle=draw?target*(1-Math.pow(1-p,4)):0;
    ctx.save();ctx.translate(cx,cy);ctx.rotate(angle);
    for(let i=0;i<n;i++){const a=i*Math.PI*2/n,b=(i+1)*Math.PI*2/n;ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,r,a,b);ctx.fillStyle=colors[i%colors.length];ctx.fill();ctx.strokeStyle='#fff';ctx.stroke(); if(n<=40){ctx.save();ctx.rotate((a+b)/2);label(ctx,pool[i]?.name||'?',r*.63,0,r*.58,Math.max(8,Math.min(15,100/n)));ctx.restore();}}
    ctx.restore();ball(ctx,cx,cy,22,'#fff','');ctx.fillStyle='#173e30';ctx.beginPath();ctx.moveTo(cx-13,cy-r-16);ctx.lineTo(cx+13,cy-r-16);ctx.lineTo(cx,cy-r+15);ctx.fill();
    if(finish) label(ctx,name,cx,h-22,w-24,24);
  } else if(mode==='pinball') {
    paintPinball(ctx,rows,draw,p,w,h,seed,label,images);
  } else if(mode==='lotto') {
    const r=Math.min(w*.34,h*.34);ctx.beginPath();ctx.arc(cx,cy-22,r+20,0,Math.PI*2);ctx.fillStyle='#ffffff99';ctx.fill();ctx.strokeStyle='#91b7a5';ctx.lineWidth=7;ctx.stroke();
    sample.forEach((item,i)=>{const t=draw?p*24:0;const a=i*2.399+t*(i%2?1:-1);const rad=r*Math.sqrt((i+1)/(sample.length+1));ball(ctx,cx+Math.cos(a)*rad,cy-22+Math.sin(a)*rad,Math.min(25,r*.2),colors[i%6],item.name);});
    ctx.fillStyle='#c3dfd0';ctx.fillRect(cx-35,cy+r-5,70,h-(cy+r));
    if(finish){ball(ctx,cx,h-38,31,'#fbbf24','');label(ctx,name,cx,28,w-24,25);}
  } else if(mode==='slots') {
    const cw=Math.min(155,w/3-20),ch=220;
    for(let i=0;i<3;i++){const index=finish?0:Math.floor(p*60+i*3)%Math.max(1,sample.length);card(finish?winner:sample[index],w*(i+1)/4,cy,cw,ch);}
    ctx.strokeStyle='#10b981';ctx.lineWidth=5;ctx.strokeRect(8,cy-120,w-16,240);
  } else if(mode==='cards') {
    if(finish) card(winner,cx,cy,Math.min(220,w*.6),290);
    else for(let i=0;i<3;i++){ctx.save();ctx.translate(cx+(i-1)*75,cy);ctx.rotate((i-1)*.18+Math.sin(p*25+i)*.04);ctx.fillStyle=colors[(i+4)%6];ctx.fillRect(-60,-95,120,190);label(ctx,'?',0,0,90,50,'#fff');ctx.restore();}
  } else if(mode==='pirate') {
    const jump=draw?Math.sin(Math.min(1,p)*Math.PI)*100:0;
    label(ctx,'☠',cx,cy-85-jump,130,78);ctx.fillStyle='#b48148';ctx.fillRect(cx-95,cy-50,190,150);
    ctx.strokeStyle='#67472b';ctx.lineWidth=12;ctx.strokeRect(cx-95,cy-50,190,150);
    for(let i=0;i<12;i++) ball(ctx,cx-65+(i%4)*43,cy-20+Math.floor(i/4)*40,9,'#473226','');
    if(finish) label(ctx,name,cx,h-30,w-24,25);
  } else if(mode==='ladder') {
    const n=rows.length;const x=i=>30+i*(w-60)/Math.max(1,n-1);const y=i=>65+i*(h-125)/Math.max(1,(draw?.rungs.length||16));
    ctx.lineWidth=3;ctx.strokeStyle='#8da99c';for(let i=0;i<n;i++){ctx.beginPath();ctx.moveTo(x(i),45);ctx.lineTo(x(i),h-45);ctx.stroke();label(ctx,rows[i]?.name||'?',x(i),20,(w-40)/n,12);label(ctx,String(i+1),x(i),h-20,40,14);}
    (draw?.rungs||Array.from({length:16},(_,i)=>({left:i%Math.max(1,n-1),y:i}))).forEach(r=>{if(r.left<n-1){ctx.beginPath();ctx.moveTo(x(r.left),y(r.y));ctx.lineTo(x(r.left+1),y(r.y));ctx.stroke();}});
    if(draw){let col=0;ctx.strokeStyle='#059669';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(x(0),45);draw.rungs.slice(0,Math.floor(p*draw.rungs.length)).forEach(r=>{ctx.lineTo(x(col),y(r.y));if(col===r.left)col++;else if(col===r.left+1)col--;ctx.lineTo(x(col),y(r.y));});ctx.lineTo(x(col),finish?h-45:45+p*(h-90));ctx.stroke();}
  } else {
    const list=draw?.ordered||rows;
    list.slice(0,8).forEach((row,i)=>{const yy=55+i*40;ctx.fillStyle=colors[i%6];ctx.fillRect(30,yy-15,Math.max(0,(w-60)*(draw?Math.min(1,p*2-i*.12):.8)),31);label(ctx,`${i+1}. ${row.name}`,cx,yy,w-80,16);});
  }
}
export default function Stage({mode,rows,draw,done,onDone,copy}) {
  const canvas=useRef(null),callback=useRef(onDone),images=useRef(new Map());const [imageVersion,setImageVersion]=useState(0);
  callback.current=onDone;
  useEffect(()=>{let live=true;const pending=[];for(const row of (draw?.pool||rows).slice(0,32)){if(row.image&&!images.current.has(row.image)){const image=new Image();image.referrerPolicy='no-referrer';image.onload=()=>{if(live)setImageVersion(v=>v+1);};image.src=row.image;images.current.set(row.image,image);pending.push(image);}}return()=>{live=false;pending.forEach(i=>i.onload=null);};},[rows,draw]);
  const startTime=useRef(0),sceneSeed=useRef(0);
  useEffect(()=>{startTime.current=performance.now();sceneSeed.current=(performance.now()%10000)/1000;},[draw]);
  useEffect(()=>{
    const el=canvas.current;if(!el)return;const ctx=el.getContext('2d');if(!ctx)return;
    let frame=0,live=true;
    const reduce=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    function render(){if(!live)return;cancelAnimationFrame(frame);const width=el.clientWidth||640,height=mode==='pinball'?560:380,dpr=mode==='ladder'&&rows.length>20?1:Math.min(window.devicePixelRatio||1,2);if(el.width!==Math.round(width*dpr)||el.height!==height*dpr){el.width=Math.round(width*dpr);el.height=height*dpr;}ctx.setTransform(dpr,0,0,dpr,0,0);
      const p=done?1:draw?(reduce?1:Math.min(1,(performance.now()-startTime.current)/(mode==='pinball'?PINBALL_DURATION:5500))):0;
      paint(ctx,mode,rows,draw,p,width,height,images.current,sceneSeed.current);
      if(draw&&!done&&p>=1){callback.current();return;}if(draw&&!done)frame=requestAnimationFrame(render);
    }
    render();const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(render):null;observer?.observe(el);
    return()=>{live=false;cancelAnimationFrame(frame);observer?.disconnect();};
  },[mode,rows,draw,done,imageVersion]);
  return <div className={`rp-stage${mode==='pinball'?' rp-pinball-stage':''}`}><canvas style={mode==='ladder'?{width:`max(100%, ${rows.length*64}px)`}:undefined} ref={canvas} role="img" aria-label={`${copy.modes[mode]} — ${copy.participants}: ${rows.length}`} /><div className="rp-stage-brand">One Pick Game</div></div>;
}
