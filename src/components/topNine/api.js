import { supabase } from '../../utils/supabaseClient';
export async function sourcePage(term='',offset=0,recommended=false) {
 const {data,error}=await supabase.rpc('search_top_nine_sources',{p_query:term.trim(),p_offset:offset,p_recommended:recommended});
 if(error)throw error;return Array.isArray(data)?data:[];
}
export async function listTemplates(admin=false) {
 if(!admin)return sourcePage('',0,true);
 const {data,error}=await supabase.from('top_nine_templates').select('source_worldcup_id,title_translations,enabled,sort_order,topic').order('sort_order').limit(1000);
 if(error)throw error;if(!data?.length)return [];
 const cups=await supabase.from('worldcups').select('id,title,title_translations,category').is('deleted_at',null).in('id',data.map(t=>t.source_worldcup_id));if(cups.error)throw cups.error;
 const map=new Map(cups.data.map(c=>[c.id,c]));
 return data.filter(t=>map.has(t.source_worldcup_id)).map(t=>({...map.get(t.source_worldcup_id),...t,id:t.source_worldcup_id,top_nine_title_translations:t.title_translations}));
}
export async function searchSources(term,offset=0){return sourcePage(term,offset,false);}
export async function loadSource(id) {
 const {data,error}=await supabase.from('worldcups').select('id,title,title_translations,data').eq('id',id).is('deleted_at',null).maybeSingle();
 if(error)throw error;if(!data)throw new Error('NOT_FOUND');return data;
}
