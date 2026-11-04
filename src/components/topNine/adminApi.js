import { supabase } from '../../utils/supabaseClient';
export async function loadAdminRows() {
  const [settings,cups]=await Promise.all([
    supabase.from('top_nine_templates').select('source_worldcup_id,title_translations,enabled,sort_order,topic').order('sort_order'),
    (async()=>{const rows=[];for(let offset=0;;offset+=1000){const {data,error}=await supabase.from('worldcups').select('id,title,title_translations,category,created_at').is('deleted_at',null).order('id',{ascending:true}).range(offset,offset+999);if(error)throw error;rows.push(...(data||[]));if(!data||data.length<1000)return rows;}})()
  ]);
  if(settings.error)throw settings.error;
  const map=new Map((settings.data||[]).map(row=>[String(row.source_worldcup_id),row]));
  return cups.map(cup=>{const saved=map.get(String(cup.id));return {...cup,enabled:Boolean(saved?.enabled),sort_order:saved?.sort_order??0,topic:saved?.topic||'games',top_nine_title_translations:saved?.title_translations||{}};});
}
export async function saveAdminRows(payload) {
  const {error}=await supabase.rpc('save_top_nine_templates',{p_templates:payload});
  if(error)throw error;
}
