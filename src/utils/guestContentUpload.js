// No anonymous sign-in: the normal member/guest session is never changed.
export const GUEST_LOCAL_LIMIT=50;
export const isLocalCandidate=item=>item?._source==='local'||(item?._source!=='imported'&&item?.source==='local');
export function guestPhotoAllowed(file){return !!file&&['image/jpeg','image/png','image/webp','image/avif'].includes(file.type)&&!(/\.(gif|mp4|webm|mov|svg)$/i.test(file.name||''));}
export function checkGuestPhotos(items){if(items.length>50)throw Error('GUEST_IMAGE_LIMIT');for(const item of items)if(item.file&&!guestPhotoAllowed(item.file))throw Error('GUEST_IMAGE_TYPE');}
export async function guestPhotoBlob(source,maxBytes){
 const url=typeof source==='string'?source:URL.createObjectURL(source),image=new Image();
 try{
  await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(Error('GUEST_IMAGE_INVALID'));image.src=url;});
  const canvas=document.createElement('canvas');
  for(const side of [1024,768,512,320]){
   const scale=Math.min(1,side/Math.max(image.naturalWidth,image.naturalHeight));canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);
   for(const quality of [.82,.65,.45]){const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',quality));if(blob?.type==='image/jpeg'&&blob.size<=maxBytes)return blob;}
  }
  throw Error('GUEST_IMAGE_LIMIT');
 }finally{if(typeof source!=='string')URL.revokeObjectURL(url);}
}
async function call(body){
 const response=await fetch('/api/guest-content-upload',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),credentials:'same-origin',signal:AbortSignal.timeout(20000)});let result;try{result=await response.json();}catch{throw Error('GUEST_UPLOAD_FAILED');}if(!response.ok)throw Error(result.error||'GUEST_UPLOAD_FAILED');return result;
}
function base64(blob){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=reject;reader.readAsDataURL(blob);});}
export async function beginGuestImageUpload(kind,blobs){
 if(!blobs.length)return null;
 if(blobs.length>(kind==='nine'?9:50)||blobs.some(blob=>blob.type!=='image/jpeg'||blob.size>(kind==='nine'?524288:1048576)))throw Error('GUEST_IMAGE_LIMIT');
 const files=await Promise.all(blobs.map(async blob=>({bytes:blob.size,sha256:Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer())),n=>n.toString(16).padStart(2,'0')).join('')})));
 const job=await call({action:'begin',kind,files});
 try{const urls=[];for(let index=0;index<blobs.length;index++){const {url}=await call({...job,action:'upload',index,base64:await base64(blobs[index])});urls.push(url);}return {...job,urls};}
 catch(error){await cancelGuestImageUpload(job);throw error;}
}
export async function completeGuestImageUpload(job){if(job)await call({...job,urls:undefined,action:'complete'}).catch(()=>{});}
export async function cancelGuestImageUpload(job){if(job)await call({...job,urls:undefined,action:'cancel'}).catch(()=>{});}
export {default as guestUploadCopy} from './guestUploadCopy.json';
