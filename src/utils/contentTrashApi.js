import { supabase } from './supabaseClient';
const revisions=new Map(),listeners=new Set();
export function contentRevision(kind){return revisions.get(kind)||0;}
export function subscribeContentChanges(kind,fn){const entry={kind,fn};listeners.add(entry);return()=>listeners.delete(entry);}
function changed(kind,id){revisions.set(kind,contentRevision(kind)+1);for(const entry of listeners)if(entry.kind===kind){try{entry.fn(id);}catch(error){console.warn("Content cache refresh failed",error?.message);}}}
export async function trashContent(kind,id,password=null){
 const {data,error}=await supabase.rpc('trash_site_content',{p_kind:kind,p_id:id,p_password:password});
 if(error)throw error;if(!data?.id||String(data.id)!==String(id))throw new Error("Invalid trash response");changed(kind,id);return data;
}
export async function listTrash({kind='all',offset=0,search=''}={}){
 const {data,error}=await supabase.rpc('list_site_trash',{p_kind:kind,p_offset:offset,p_search:search});
 if(error)throw error;return data;
}
export async function restoreContent(kind,id){const {error}=await supabase.rpc('restore_site_content',{p_kind:kind,p_id:id});if(error)throw error;changed(kind,id);}
export async function purgeContent(kind,id){const {error}=await supabase.rpc('purge_site_content',{p_kind:kind,p_id:id});if(error)throw error;changed(kind,id);}
