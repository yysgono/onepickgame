// Original Canvas artwork and choreography. Draw selection remains in randomPickCore.
export const PINBALL_DURATION = 20000;
const palette=['#5eead4','#93c5fd','#fcd34d','#f9a8d4','#c4b5fd','#fdba74'];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function paintPinball(ctx,rows,draw,p,w,h,seed,label,images){
  const course=1900,travel=course-160,active=Boolean(draw),finished=p>=1;
  const pool=draw?.pool||rows;
  // Keep display order independent of the selected winner.
  const shown=pool.slice(0,32);
  if(draw&&!shown.some(r=>r.id===draw.winner.id))shown[shown.length-1]=draw.winner;
  const time=p*20, camera=active?clamp(p*travel-h*.28,0,course-h+55):0;
  ctx.fillStyle='#102c34';ctx.fillRect(0,0,w,h);
  ctx.save();ctx.translate(0,-camera);
  ctx.strokeStyle='#23505a';ctx.lineWidth=1;
  for(let y=0;y<course;y+=40){ctx.beginPath();ctx.moveTo(18,y);ctx.lineTo(w-18,y);ctx.stroke();}
  ctx.strokeStyle='#48b9a1';ctx.lineWidth=6;ctx.strokeRect(14,16,w-28,course-20);
  const peg=(x,y,r,color)=>{ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();ctx.strokeStyle='#ffffff66';ctx.lineWidth=2;ctx.stroke();};
  for(let section=0;section<4;section++){
    const base=210+section*390;
    label(ctx,`0${section+1}`,38,base-64,36,18,'#7db6b4');
    // Staggered bumpers.
    for(let row=0;row<3;row++)for(let col=0;col<5;col++){
      const x=38+(col+(row%2)*.4)*(w-92)/5;
      peg(x,base+row*43,7+section%2*3,section%2?'#f4b76a':'#52c9b4');
    }
    // Rotating paddles and sliding gates have different phases each run.
    const angle=time*(section%2?-.85:.9)+seed+section;
    ctx.save();ctx.translate(w*(section%2?.66:.34),base+185);ctx.rotate(angle);
    ctx.lineCap='round';ctx.strokeStyle='#c4b5fd';ctx.lineWidth=10;
    ctx.beginPath();ctx.moveTo(-w*.16,0);ctx.lineTo(w*.16,0);ctx.stroke();peg(0,0,13,'#f8fafc');ctx.restore();
    const gate=w*.5+Math.sin(time*1.3+seed+section)*w*.19;
    ctx.strokeStyle='#fb923c';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(24,base+265);ctx.lineTo(gate-38,base+265);ctx.moveTo(gate+38,base+265);ctx.lineTo(w-24,base+265);ctx.stroke();
  }
  // Finish lane.
  for(let i=0;i<12;i++){ctx.fillStyle=i%2?'#fff':'#284752';ctx.fillRect(20+i*(w-40)/12,course-75,(w-40)/12,12);}
  label(ctx,'ONE PICK GAME',w/2,course-40,w-50,17,'#a7f3d0');
  shown.forEach((row,i)=>{
    const phase=seed+i*2.399;
    const winner=draw?.winner.id===row.id;
    const wobble=Math.sin(time*.95+phase)*.022+Math.sin(time*2.1+phase)*.012;
    const progress=active?clamp(p+wobble*Math.sin(p*Math.PI)-(!winner?Math.pow(p,6)*(.045+(i%5)*.012):0),0,1):0;
    const yy=70+progress*travel;
    const band=Math.floor(yy/130),fraction=(yy%130)/130;
    const a=.5+.34*Math.sin(phase+band*1.7),b=.5+.34*Math.sin(phase+(band+1)*1.7);
    const ease=fraction*fraction*(3-2*fraction);
    const x=clamp((a+(b-a)*ease)*w,35,w-35);
    const y=yy-Math.abs(Math.sin(fraction*Math.PI*2))*10;
    if(y-camera < -55 || y-camera > h+55)return;
    const radius=shown.length>16?13:18;
    ctx.shadowColor=palette[i%6];ctx.shadowBlur=8;peg(x,y,radius,palette[i%6]);ctx.shadowBlur=0;
    const image=images.get(row.image);
    if(image?.complete&&image.naturalWidth){ctx.save();ctx.beginPath();ctx.arc(x,y,radius-2,0,Math.PI*2);ctx.clip();const scale=Math.max(radius*2/image.naturalWidth,radius*2/image.naturalHeight);ctx.drawImage(image,x-image.naturalWidth*scale/2,y-image.naturalHeight*scale/2,image.naturalWidth*scale,image.naturalHeight*scale);ctx.restore();}
    else label(ctx,String(i+1),x,y,25,12,'#173535');
    ctx.fillStyle='#102c34dd';ctx.fillRect(x-47,y+radius+3,94,20);
    label(ctx,row.name,x,y+radius+13,88,11,'#f0fdfa');
  });
  ctx.restore();
  ctx.fillStyle='#102c34ee';ctx.fillRect(0,0,w,46);
  label(ctx,finished?(draw?.winner.name||'ONE PICK GAME'):'ONE PICK GAME',w/2,23,w-110,finished?21:16,'#ecfdf5');
  ctx.fillStyle='#244b51';ctx.fillRect(16,h-13,w-32,5);ctx.fillStyle='#5eead4';ctx.fillRect(16,h-13,(w-32)*p,5);
  if(active)label(ctx,`${Math.round(p*100)}%`,w-38,23,50,12,'#99f6e4');
}
