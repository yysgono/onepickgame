const MAX_LINK=16000,MAX_DATA=150000;
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
async function boundedBytes(stream){const reader=stream.getReader(),parts=[];let size=0;try{while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>MAX_DATA)throw Error('Invalid share');parts.push(value);}}finally{await reader.cancel();}const all=new Uint8Array(size);let at=0;for(const part of parts){all.set(part,at);at+=part.length;}return all;}
export async function encodeCandidates(rows,sourceCupId){
 if(rows.length>200)throw Error('Invalid share');
 const data={v:1,c:uuid.test(sourceCupId||'')?sourceCupId:null,n:rows.map(row=>[String(row.name).slice(0,120),Boolean(row.image)])};
 let bytes=new TextEncoder().encode(JSON.stringify(data)),format='u';
 if(typeof CompressionStream!=='undefined'){bytes=await boundedBytes(new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip')));format='g';}
 let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);
 const value=format+btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');if(value.length>MAX_LINK)throw Error('SHARE_TOO_LONG');return value;
}
export async function decodeCandidates(value){
 if(!value||value.length>MAX_LINK||! /^[gu][A-Za-z0-9_-]+$/.test(value))throw Error('Invalid share');
 let bytes=Uint8Array.from(atob(value.slice(1).replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
 if(value[0]==='g'){if(typeof DecompressionStream==='undefined')throw Error('Unsupported share');bytes=await boundedBytes(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip')));}
 if(bytes.length>MAX_DATA)throw Error('Invalid share');const data=JSON.parse(new TextDecoder().decode(bytes));
 if(data.v!==1||!Array.isArray(data.n)||data.n.length>200||data.n.some(row=>!Array.isArray(row)||typeof row[0]!=='string'||!row[0].trim()||row[0].length>120||typeof row[1]!=='boolean')||(data.c!==null&&!uuid.test(data.c)))throw Error('Invalid share');
 return {sourceCupId:data.c,rows:data.n.map(([name,wantsImage],i)=>({id:`shared:${i}`,name,image:'',enabled:true,wantsImage}))};
}
export function attachSourceImages(rows,sourceRows){
 const available=new Map();for(const row of sourceRows){const group=available.get(row.name)||[];group.push(row.image);available.set(row.name,group);}
 return rows.map(row=>({...row,image:row.wantsImage?(available.get(row.name)?.shift()||''):''}));
}
