// Only public images on this project's Storage are rewritten. Signed URLs stay intact.
export function originalStorageImageUrl(value) {
 if(typeof value!=='string')return value;
 try{
  const url=new URL(value);
  const origins=new Set(['https://irfyuvuazhujtlgpkfci.supabase.co']);
  try{if(process.env.REACT_APP_SUPABASE_URL)origins.add(new URL(process.env.REACT_APP_SUPABASE_URL).origin);}catch{}
  const prefix='/storage/v1/render/image/public/';
  if(!origins.has(url.origin)||!url.pathname.startsWith(prefix))return value;
  url.pathname=url.pathname.replace(prefix,'/storage/v1/object/public/');
  for(const key of ['width','height','resize','quality','format'])url.searchParams.delete(key);
  return url.href;
 }catch{return value;}
}

