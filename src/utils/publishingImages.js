import {supabase} from './supabaseClient';
const TYPES={'image/png':'png','image/jpeg':'jpg','image/webp':'webp','image/gif':'gif'};
export const BOARD_IMAGE_LIMIT=5,BOARD_IMAGE_BYTES=5*1024*1024;
export function checkPublishingImage(file,{blog=false,count=0}={}){
 if(!TYPES[file.type])throw Error('EDITOR_IMAGE_TYPE');
 if(!blog&&file.size>BOARD_IMAGE_BYTES)throw Error('EDITOR_IMAGE_SIZE');
 if(!blog&&count>=BOARD_IMAGE_LIMIT)throw Error('EDITOR_IMAGE_COUNT');
}
export async function uploadPublishingImage(file,{blog=false,count=0}={}){
 checkPublishingImage(file,{blog,count});const {data,error}=await supabase.auth.getUser();if(error||!data?.user)throw Error('EDITOR_IMAGE_LOGIN');
 const bucket=blog?'publishing-blog-images':'publishing-board-images',path=`${data.user.id}/${crypto.randomUUID()}.${TYPES[file.type]}`;
 const result=await supabase.storage.from(bucket).upload(path,file,{upsert:false,cacheControl:'31536000',contentType:file.type});if(result.error)throw result.error;
 return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
