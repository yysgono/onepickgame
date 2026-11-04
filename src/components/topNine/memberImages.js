import {supabase} from '../../utils/supabaseClient';
import {isShareable} from './core';
import {loadMedia} from './media';
export const MEMBER_IMAGE_MAX=512*1024;
const uploaded=new Map();
export async function compressMemberImage(src){
 if(!/^data:image\/(jpeg|png|webp);base64,/i.test(src))throw Error('LOCAL_IMAGE_INVALID');
 const image=await loadMedia(src);const canvas=document.createElement('canvas');
 for(const side of [1024,768,512,320]){const scale=Math.min(1,side/Math.max(image.naturalWidth,image.naturalHeight));canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);
 for(const quality of [.82,.65,.45]){const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',quality));if(blob&&blob.size<=MEMBER_IMAGE_MAX)return blob;}}
 throw Error('IMAGE_TOO_LARGE');
}
export async function prepareMemberSlots(slots){
 if(slots.length!==9||!slots.some(Boolean))throw Error('NINE_REQUIRED');
 const locals=slots.filter(c=>c&&!isShareable(c));if(!locals.length)return slots;
 if(locals.some(c=>!/^data:image\/(jpeg|png|webp);base64,/i.test(c.src)))throw Error('PRIVATE_IMAGE');
 const {data,error}=await supabase.auth.getUser();if(error||!data?.user||data.user.is_anonymous)throw Error('MEMBER_REQUIRED');
 const result=[];
 for(const c of slots){if(!c||isShareable(c)){result.push(c);continue;}const key=data.user.id+':'+c.src;
 let url=uploaded.get(key);if(!url){const blob=await compressMemberImage(c.src);const extension=blob.type==='image/webp'?'webp':blob.type==='image/png'?'png':'jpg';const path=`${data.user.id}/${crypto.randomUUID()}.${extension}`;
 const bucket=supabase.storage.from('top-nine-images');const response=await bucket.upload(path,blob,{contentType:blob.type,cacheControl:'31536000',upsert:false});if(response.error)throw response.error;
 url=bucket.getPublicUrl(path).data.publicUrl;uploaded.set(key,url);}
 result.push({...c,src:url});}
 return result;
}
