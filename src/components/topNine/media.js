import collageLayout from './collageLayout.js';
import {sanitizeSvg} from "./svgImport";
import { safeMedia, SLOT_RANKS } from './core';
export function loadMedia(src,video=false) {
 return new Promise((resolve,reject)=>{
  const el=video?document.createElement('video'):new Image();el.crossOrigin='anonymous';
  let done=false;const finish=(error)=>{if(done)return;done=true;clearTimeout(timer);el.onload=null;el.onerror=null;el.onloadeddata=null;el.onseeked=null;
   if(error){if(video){el.pause();el.removeAttribute('src');el.load();}reject(error);}else resolve(el);};
  const timer=setTimeout(()=>finish(new Error('MEDIA_TIMEOUT')),15000);
  el.onerror=()=>finish(new Error('MEDIA_ERROR'));
  if(video){el.muted=true;el.playsInline=true;el.preload='auto';el.onloadeddata=()=>{el.pause();finish();};}else el.onload=()=>finish();
  el.src=src;
 });
}
export const isVideo=src=>/\.(mp4|webm|mov)(?:[?#]|$)/i.test(src);
export async function mediaFrame(src) {
 const el=await loadMedia(src,isVideo(src));
 try {
  const w=el.videoWidth||el.naturalWidth,h=el.videoHeight||el.naturalHeight;
  if(!w||!h)throw new Error('MEDIA_ERROR');
  const scale=Math.min(1,1200/Math.max(w,h));const canvas=document.createElement('canvas');canvas.width=Math.round(w*scale);canvas.height=Math.round(h*scale);
  const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(el,0,0,canvas.width,canvas.height);
  return canvas.toDataURL('image/jpeg',.9);
 }finally{if(el.tagName==='VIDEO'){el.pause();el.removeAttribute('src');el.load();}}
}
export async function importFile(file) {
 if(!/\.(jpe?g|png|webp|gif|mp4|svg)$/i.test(file.name)||file.size>20*1024*1024)throw new Error('FILE_TYPE_SIZE');
 const input=/\.svg$/i.test(file.name)?new Blob([sanitizeSvg(await file.text())],{type:'image/svg+xml'}):file;
 const src=URL.createObjectURL(input);
 try {const frame=await mediaFrame(src+( /\.mp4$/i.test(file.name)?'#.mp4':''));return {id:'upload-'+crypto.randomUUID(),src:frame,name:file.name.replace(/\.[^.]+$/,'').slice(0,150),zoom:1,x:50,y:50};}
 finally{URL.revokeObjectURL(src);}
}
const fit=(ctx,text,max)=>{let chars=Array.from(text);while(chars.length&&ctx.measureText(chars.join('')).width>max)chars.pop();return chars.join('');};
export async function exportPNG(slots,title,names,frameCache={},showRanks=false) {
 if(slots.length!==9||!slots.some(Boolean))throw new Error('NINE_REQUIRED');
 const canvas=document.createElement('canvas'),size=1056,pad=36,top=title?100:36;
 canvas.width=1128;canvas.height=top+size+90;
 const ctx=canvas.getContext('2d');if(!ctx)throw new Error('CANVAS');
 ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.textAlign='center';ctx.fillStyle='#211638';ctx.font='bold 34px sans-serif';
 if(title)ctx.fillText(fit(ctx,title,1056),564,61);
 for(let i=0;i<9;i++) {
  const tile=collageLayout.layouts[i],scale=size/100;
  const x=pad+tile.x*scale,y=top+tile.y*scale,w=tile.width*scale,h=tile.height*scale;
  ctx.save();ctx.beginPath();
  tile.points.forEach(([px,py],index)=>ctx[index?'lineTo':'moveTo'](pad+px*scale,top+py*scale));
  ctx.closePath();ctx.clip();ctx.fillStyle='#eee8f6';ctx.fillRect(x,y,w,h);
  if(slots[i]) {
   const c=slots[i],src=frameCache[c.src]||safeMedia(c.src);if(!src)throw new Error('MEDIA_ERROR');
   const frame=isVideo(src)?await mediaFrame(src):src;
   const img=await loadMedia(frame);
   ctx.drawImage(img,...collageLayout.cropForSlot(img.naturalWidth,img.naturalHeight,i,c.zoom,c.x,c.y),x,y,w,h);
   if(names){
    const cx=pad+tile.caption[0]*scale,cy=top+tile.caption[1]*scale;
    ctx.font='bold 22px sans-serif';const name=fit(ctx,c.name,w*.7),labelWidth=Math.min(w*.75,ctx.measureText(name).width+20);
    ctx.fillStyle='rgba(18,14,26,.72)';ctx.fillRect(cx-labelWidth/2,cy-18,labelWidth,36);
    ctx.fillStyle='#fff';ctx.fillText(name,cx,cy+8);
   }
  }
  if(showRanks){
   ctx.font='bold 40px sans-serif';ctx.fillStyle='#fff';ctx.textAlign='left';
   ctx.fillText(String(SLOT_RANKS[i]),pad+tile.rank[0]*scale,top+tile.rank[1]*scale+35);
   ctx.textAlign='center';
  }
  ctx.restore();
 }
 ctx.beginPath();
 collageLayout.edges.forEach(([from,to])=>{
  ctx.moveTo(pad+from[0]*size/100,top+from[1]*size/100);
  ctx.lineTo(pad+to[0]*size/100,top+to[1]*size/100);
 });
 ctx.strokeStyle=collageLayout.boundaryColor;ctx.lineWidth=2;ctx.lineJoin='round';ctx.stroke();
 ctx.fillStyle='#f2eaff';ctx.fillRect(0,canvas.height-66,canvas.width,66);ctx.fillStyle='#5c229f';ctx.font='bold 32px sans-serif';ctx.fillText('OnePickGame.com',564,canvas.height-24);
 return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('EXPORT_FAILED')),'image/png'));
}
export function downloadBlob(blob) {const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='onepickgame-my-top-9.png';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
