import {sanitizeSvg} from "./svgImport";
import { cropRect, safeMedia, SLOT_RANKS } from './core';
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
 const canvas=document.createElement('canvas'),cell=344,gap=12,pad=36,top=title?100:36;
 const nameHeight=names?44:0;canvas.width=1128;canvas.height=top+3*(cell+nameHeight)+2*gap+96;
 const ctx=canvas.getContext('2d');if(!ctx)throw new Error('CANVAS');
 ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.textAlign='center';ctx.fillStyle='#211638';ctx.font='bold 34px sans-serif';
 if(title)ctx.fillText(fit(ctx,title,1056),564,61);
 for(let i=0;i<9;i++) {
  const x=pad+(i%3)*(cell+gap),y=top+Math.floor(i/3)*(cell+nameHeight+gap);
  if(slots[i]) {
  const c=slots[i],src=frameCache[c.src]||safeMedia(c.src);if(!src)throw new Error('MEDIA_ERROR');
  const frame=isVideo(src)?await mediaFrame(src):src;
  const img=await loadMedia(frame);
  ctx.drawImage(img,...cropRect(img.naturalWidth,img.naturalHeight,c.zoom,c.x,c.y),x,y,cell,cell);
  if(i===4){ctx.strokeStyle='#7c3aed';ctx.lineWidth=5;ctx.strokeRect(x-5,y-5,cell+10,cell+10);ctx.lineWidth=1;ctx.strokeRect(x-9,y-9,cell+18,cell+18);}
  if(names){ctx.fillStyle='#211638';ctx.font='22px sans-serif';ctx.fillText(fit(ctx,c.name,cell-12),x+cell/2,y+cell+29);}
  }
  if(showRanks){
   ctx.fillStyle=i===4?'#7139ce':'rgba(255,255,255,.96)';ctx.fillRect(x+8,y+8,34,34);
   ctx.strokeStyle='#7139ce';ctx.lineWidth=1;ctx.strokeRect(x+8,y+8,34,34);
   ctx.fillStyle=i===4?'#fff':'#50248d';ctx.font='bold 22px sans-serif';
   ctx.fillText(String(SLOT_RANKS[i]),x+25,y+33);
  }
 }
 ctx.fillStyle='#f2eaff';ctx.fillRect(0,canvas.height-66,canvas.width,66);ctx.fillStyle='#5c229f';ctx.font='bold 32px sans-serif';ctx.fillText('OnePickGame.com',564,canvas.height-24);
 return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('EXPORT_FAILED')),'image/png'));
}
export function downloadBlob(blob) {const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='onepickgame-my-top-9.png';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
