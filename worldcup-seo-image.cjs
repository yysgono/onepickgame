const metadata = require('./src/seo/worldcupMetadata.js');
const cache = new Map();
function dimensions(b) {
  if (b.length >= 24 && b.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return [b.readUInt32BE(16), b.readUInt32BE(20)];
  if (b.length >= 10 && /^GIF8[79]a$/.test(b.toString('ascii', 0, 6))) return [b.readUInt16LE(6), b.readUInt16LE(8)];
  if (b.length >= 30 && b.toString('ascii',0,4)==='RIFF' && b.toString('ascii',8,12)==='WEBP') {
    const kind=b.toString('ascii',12,16);
    if(kind==='VP8X') return [1+b.readUIntLE(24,3),1+b.readUIntLE(27,3)];
    if(kind==='VP8 ' && b[23]===157 && b[24]===1 && b[25]===42) return [b.readUInt16LE(26)&16383,b.readUInt16LE(28)&16383];
    if(kind==='VP8L' && b[20]===47) return [1+((b[21]|b[22]<<8)&16383),1+((b[22]>>6|b[23]<<2|b[24]<<10)&16383)];
  }
  if(b.length>4 && b[0]===255 && b[1]===216) {
    let i=2;
    while(i+4<b.length) {
      if(b[i++]!==255) continue;
      while(b[i]===255)i++;
      const marker=b[i++];
      if(marker===217||marker===218)break;
      if(marker===1||(marker>=208&&marker<=215))continue;
      if(i+2>b.length)break;
      const len=b.readUInt16BE(i);
      if(len<2||i+len>b.length)break;
      if([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker)&&len>=7)return [b.readUInt16BE(i+5),b.readUInt16BE(i+3)];
      i+=len;
    }
  }
  return [0,0];
}
function safeUrl(value, origin, storageOrigin) {
  try {
    const u=new URL(value,origin);
    const hosts=[new URL(origin).host,'i.ytimg.com'];
    if(storageOrigin)hosts.push(new URL(storageOrigin).host);
    if(!['http:','https:'].includes(u.protocol)||u.username||u.password||!hosts.includes(u.host))return '';
    return u.href;
  }catch{return '';}
}
async function eligible(url, signal, fetcher) {
  const hit=cache.get(url);if(hit&&hit.until>Date.now())return hit.ok;
  try {
    const r=await fetcher(url,{signal,redirect:'error',headers:{Range:'bytes=0-65535'}});
    if(!r.ok||!String(r.headers.get('content-type')||'').startsWith('image/'))return false;
    const reader=r.body.getReader();let chunks=[],length=0;
    try {while(length<65536){const {done,value}=await reader.read();if(done)break;chunks.push(Buffer.from(value));length+=value.length;}}finally{await reader.cancel();}
    const b=Buffer.concat(chunks).subarray(0,65536),[w,h]=dimensions(b);
    const total=Number((r.headers.get('content-range')||'').split('/')[1])||Number(r.headers.get('content-length'))||length;
    const ok=w>150&&h>150&&total>=5000&&Math.max(w,h)/Math.min(w,h)<=3;
    if(cache.size>=1000)cache.delete(cache.keys().next().value);
    cache.set(url,{ok,until:Date.now()+3600000});return ok;
  }catch{return false;}
}
async function selectImage(cup, stats, origin, storageOrigin, fetcher=fetch) {
  const candidates=metadata.candidatesOf(cup);
  const counts=new Map((stats||[]).map(s=>[String(s.candidate_id),Number(s.win_count)||0]));
  const ranked=[...candidates].sort((a,b)=>(counts.get(String(b?.id))||0)-(counts.get(String(a?.id))||0));
  const urls=[...new Set([...ranked.map(metadata.imageOf),metadata.imageOf({image:cup.image||cup.thumbnail})]
    .filter(Boolean).map(v=>safeUrl(v,origin,storageOrigin)).filter(Boolean))].slice(0,12);
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),2500);
  try {
    // Bounded parallel probes; preserve winner priority among eligible images.
    for(let i=0;i<urls.length&&!controller.signal.aborted;i+=4){
      const batch=urls.slice(i,i+4),valid=await Promise.all(batch.map(u=>eligible(u,controller.signal,fetcher)));
      const index=valid.findIndex(Boolean);if(index>=0)return batch[index];
    }
    return '';
  }finally{clearTimeout(timer);}
}
module.exports={selectImage,dimensions};
