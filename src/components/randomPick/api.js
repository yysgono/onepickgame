import { supabase } from '../../utils/supabaseClient';
import { importedCupCache } from './importCache';
import { normalizeCandidates } from '../../utils/randomPickCore';
export async function searchCups(search, offset, signal, category = '', recommended = false) {
  const {data,error} = await supabase.rpc('browse_random_pick_worldcups', {p_search:search.trim().slice(0,100),p_offset:offset,p_category:category,p_recommended:recommended}).abortSignal(signal);
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}
export async function importCup(id, signal) {
  if(signal?.aborted)throw new DOMException('Aborted','AbortError');
  const cached=importedCupCache.get(id);
  if(cached)return cached;
  const {data,error} = await supabase.from('worldcups').select('id,title,data').eq('id',id).is('deleted_at',null).abortSignal(signal).single();
  if (error) throw error;
  let raw = data.data;
  if (typeof raw === 'string') { try { raw = JSON.parse(raw); } catch { raw = []; } }
  const result={sourceCupId:data.id,rows:normalizeCandidates(raw, id),truncated:Array.isArray(raw) && raw.length > 200};
  if(signal?.aborted)throw new DOMException('Aborted','AbortError');
  importedCupCache.set(id,result);
  return result;
}
export async function loadTemplates(signal) {
  const {data,error} = await supabase.from('random_pick_templates').select('id,title,mode,created_at').order('created_at',{ascending:false}).limit(24).abortSignal(signal);
  if (error) throw error;
  return data || [];
}
export async function loadTemplate(id, signal) {
  const {data,error} = await supabase.from('random_pick_templates').select('id,title,mode,candidates,settings').eq('id',id).single().abortSignal(signal);
  if (error) throw error;
  return data;
}
export async function checkOperator() {
  const {data,error} = await supabase.rpc('is_random_pick_admin');
  return !error && data === true;
}
export async function saveTemplate(id,title,mode,candidates,settings) {
  const entry = {title:title.trim(),mode,candidates,settings};
  const query = id ? supabase.from('random_pick_templates').update(entry).eq('id',id) : supabase.from('random_pick_templates').insert(entry);
  const {data,error} = await query.select('id').single();
  if (error) throw error;
  return data.id;
}
export async function deleteTemplate(id) {
  const {data,error} = await supabase.from('random_pick_templates').delete().eq('id',id).select('id');
  if (error || !data?.length) throw error || new Error('Not permitted');
}

export async function saveRecommendations(ids) {
 const {error}=await supabase.rpc('save_random_pick_recommendations',{p_ids:ids});
 if(error) throw error;
}
