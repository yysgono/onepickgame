import {zipFiles,downloadBlob} from './downloadZip';
// Wrap before paginating; even a long team roster is never silently truncated.
export function resultPages(lines,measure,maxWidth=680,maxLines=25){
 const wrapped=[];
 for(const line of lines){let row='';for(const character of line){if(row&&measure(row+character)>maxWidth){wrapped.push(row);row='';}row+=character;}wrapped.push(row);}
 const pages=[];for(let i=0;i<wrapped.length;i+=maxLines)pages.push(wrapped.slice(i,i+maxLines));return pages.length?pages:[[]];
}
export async function downloadResultImage(title,text){
 const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas unavailable');
 ctx.font='600 25px sans-serif';const pages=resultPages(text.split('\n').filter(Boolean).slice(1,-2),value=>ctx.measureText(value).width);
 const files=[];
 for(let page=0;page<pages.length;page++){
  const lines=pages[page];canvas.width=800;canvas.height=Math.max(460,280+lines.length*38);
  ctx.fillStyle='#eff8f4';ctx.fillRect(0,0,800,canvas.height);ctx.fillStyle='#078657';ctx.fillRect(0,0,800,95);
  ctx.fillStyle='#fff';ctx.font='bold 32px sans-serif';ctx.textAlign='center';ctx.fillText('ONE PICK GAME',400,60);
  ctx.fillStyle='#132d25';ctx.font='bold 27px sans-serif';ctx.fillText(title,400,145,700);
  ctx.font='600 25px sans-serif';lines.forEach((line,i)=>ctx.fillText(line,400,205+i*38,700));
  ctx.fillStyle='#526b61';ctx.font='20px sans-serif';ctx.fillText(`${page+1} / ${pages.length}`,400,canvas.height-65);ctx.fillText('www.onepickgame.com',400,canvas.height-30);
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('Image export failed');
  files.push({name:`onepickgame-result-${String(page+1).padStart(2,'0')}.png`,data:new Uint8Array(await blob.arrayBuffer())});
 }
 if(files.length===1)downloadBlob(new Blob([files[0].data],{type:'image/png'}),files[0].name);
 else downloadBlob(zipFiles(files),'onepickgame-results.zip');
}
