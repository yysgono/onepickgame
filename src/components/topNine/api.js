import { supabase } from '../../utils/supabaseClient';
export async function sourcePage(term='',offset=0,recommended=false) {
 const {data,error}=await supabase.rpc('search_top_nine_sources',{p_query:term.trim(),p_offset:offset,p_recommended:recommended});
 if(error)throw error;
 const rows=Array.isArray(data)?data:[];
 if(!rows.length)return rows;
 const thumbs=await supabase.from('top_nine_thumbnails').select('source_worldcup_id,image_url').in('source_worldcup_id',rows.map(row=>row.id));
 const map=new Map((thumbs.data||[]).map(row=>[String(row.source_worldcup_id),row.image_url]));
 return rows.map(row=>({...row,thumbnail:map.get(String(row.id))||row.thumbnail}));
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
export async function loadTemplatePage(id){
 const raw=await loadSource(id);
 const [settings,intro]=await Promise.all([
  supabase.from('top_nine_templates').select('title_translations,enabled').eq('source_worldcup_id',id).maybeSingle(),
  supabase.from('top_nine_template_intros').select('candidate_sources').eq('source_worldcup_id',id).maybeSingle()
 ]);
 if(settings.error||intro.error)throw settings.error||intro.error;
 if(!Array.isArray(raw.data)||!raw.data.some(c=>c?.image||c?.image_url||c?.url))throw new Error('NOT_FOUND');
 return {...raw,top_nine_title_translations:settings.data?.title_translations||{},intro_sources:intro.data?.candidate_sources||[]};
}
