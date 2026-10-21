// Text-only result card: no third-party images or CORS-dependent canvas reads.
export async function downloadResultImage(title, text) {
 const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
 if(!ctx)throw new Error('Canvas unavailable');
 const lines=text.split('\n').filter(Boolean).slice(1,-2);
 const visible=lines.slice(0,20),wrapped=[];
 ctx.font='600 25px sans-serif';
 for(const line of visible){let row='';for(const character of line){if(ctx.measureText(row+character).width>680){wrapped.push(row);row='';}row+=character;}if(row)wrapped.push(row);}
 canvas.width=800;canvas.height=Math.max(460,250+wrapped.length*38);
 ctx.fillStyle='#eff8f4';ctx.fillRect(0,0,800,canvas.height);
 ctx.fillStyle='#078657';ctx.fillRect(0,0,800,95);
 ctx.fillStyle='#fff';ctx.font='bold 32px sans-serif';ctx.textAlign='center';ctx.fillText('ONE PICK GAME',400,60);
 ctx.fillStyle='#132d25';ctx.font='bold 27px sans-serif';ctx.fillText(title,400,145,700);
 ctx.font='600 25px sans-serif';wrapped.forEach((line,i)=>ctx.fillText(line,400,205+i*38,700));
 ctx.fillStyle='#526b61';ctx.font='20px sans-serif';if(lines.length>20)ctx.fillText(`+ ${lines.length-20}`,400,canvas.height-75);
 ctx.fillText('www.onepickgame.com',400,canvas.height-35);
 const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw new Error('Image export failed');
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='onepickgame-result.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
