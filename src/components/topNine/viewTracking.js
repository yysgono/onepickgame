const completed=new Set(),pending=new Map();
let fallbackVisitor;
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function visitorId(){
 let visitor;try{visitor=sessionStorage.getItem('top-nine-viewer');}catch{}
 if(uuid.test(visitor||''))return visitor;
 if(!fallbackVisitor){
  const bytes=new Uint8Array(16);crypto.getRandomValues(bytes);bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
  const hex=Array.from(bytes,n=>n.toString(16).padStart(2,'0')).join('');fallbackVisitor=`${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
 }
 try{sessionStorage.setItem('top-nine-viewer',fallbackVisitor);}catch{}
 return fallbackVisitor;
}
export function recordBoardView(client,id){
 if(!uuid.test(id||''))return Promise.resolve(false);
 if(completed.has(id))return Promise.resolve(false);
 if(pending.has(id))return pending.get(id);
 const request=Promise.resolve().then(async()=>{
  const {error}=await client.rpc('record_top_nine_view_v2',{p_id:id,p_visitor:visitorId()});
  // Supabase returns database failures as resolved {error}, not rejections.
  if(error)throw error;
  completed.add(id);return true;
 }).finally(()=>pending.delete(id));
 pending.set(id,request);return request;
}
