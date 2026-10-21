// Small STORE-only ZIP writer for browser-generated PNGs (already compressed).
export function zipFiles(files){
 const encode=new TextEncoder(),parts=[],central=[];let offset=0;
 const u16=(view,at,value)=>view.setUint16(at,value,true),u32=(view,at,value)=>view.setUint32(at,value,true);
 for(const file of files){const name=encode.encode(file.name),data=file.data;let crc=0xffffffff;
  for(const byte of data){crc^=byte;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}crc=(crc^0xffffffff)>>>0;
  const local=new Uint8Array(30+name.length),lv=new DataView(local.buffer);u32(lv,0,0x04034b50);u16(lv,4,20);u16(lv,6,0x800);u16(lv,12,33);u32(lv,14,crc);u32(lv,18,data.length);u32(lv,22,data.length);u16(lv,26,name.length);local.set(name,30);parts.push(local,data);
  const entry=new Uint8Array(46+name.length),cv=new DataView(entry.buffer);u32(cv,0,0x02014b50);u16(cv,4,20);u16(cv,6,20);u16(cv,8,0x800);u16(cv,14,33);u32(cv,16,crc);u32(cv,20,data.length);u32(cv,24,data.length);u16(cv,28,name.length);u32(cv,42,offset);entry.set(name,46);central.push(entry);offset+=local.length+data.length;
 }
 const size=central.reduce((sum,x)=>sum+x.length,0),end=new Uint8Array(22),ev=new DataView(end.buffer);u32(ev,0,0x06054b50);u16(ev,8,files.length);u16(ev,10,files.length);u32(ev,12,size);u32(ev,16,offset);
 return new Blob([...parts,...central,end],{type:'application/zip'});
}
export function downloadBlob(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
