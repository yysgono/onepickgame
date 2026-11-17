import {loadRecentContentActivity} from './recentContentActivity';
const compact=rows=>[...new Map(rows.filter(row=>row?.id).map(row=>[String(row.id),row])).values()];
export async function loadResultRecommendations(client,{kind,id,category,sourceId,sourceIds=[],presetName,topicOnly=false}){
 if(kind==='worldcup'){
  const events=await loadRecentContentActivity(client,'worldcup',60);
  const recent=compact(events.map(item=>item.cup).filter(row=>String(row.id)!==String(id)));
  const chosen=[...recent.filter(row=>category&&row.category===category),...recent.filter(row=>!category||row.category!==category)].slice(0,4);
  if(chosen.length){
   // Project one candidate for each thumbnail, not the full image pool.
   const {data:previews}=await client.from('worldcups').select('id,preview:data->0').is('deleted_at',null).in('id',chosen.map(row=>row.id));
   const byId=new Map((previews||[]).map(row=>[String(row.id),row.preview]));
   return chosen.map(row=>({...row,thumbnail_url:byId.get(String(row.id))?.image||byId.get(String(row.id))?.image_url||''}));
  }
  return chosen;
 }
 const nine=kind==='nine',table=nine?'top_nine_public_boards':'tier_lists';
 const fields=nine?'id,title,slots,source_worldcup_ids,category,view_count,created_at':'id,title,title_translations,tier_labels,source_worldcup_id,category,thumbnail_url,view_count,created_at';
 const rows=[];
 async function collect(filter){
  if(rows.length>=4)return;
  let query=client.from(table).select(fields).neq('id',id);
  if(!nine)query=query.is('deleted_at',null);
  if(filter)query=filter(query);
  const result=await query.order('view_count',{ascending:false,nullsFirst:false}).order('created_at',{ascending:false}).order('id').limit(8);
  if(result.error)throw result.error;
  for(const row of result.data||[])if(String(row.id)!==String(id)&&!rows.some(saved=>String(saved.id)===String(row.id)))rows.push(row);
 }
 // Source matching precedes category popularity; never fetch full candidate pools.
 if(nine){
  for(const source of sourceIds.slice(0,3)){
   try{await collect(q=>q.contains('source_worldcup_ids',[source]));}
   catch{try{await collect(q=>q.contains('source_worldcup_ids',JSON.stringify([source])));}catch{/* Category fallback if this schema does not expose template matching. */}}
  }
 }else if(sourceId)await collect(q=>q.eq('source_worldcup_id',sourceId));
 else if(presetName)await collect(q=>q.eq('tier_labels->>_sourcePresetName',presetName));
 if(category)await collect(q=>q.eq('category',category));
 if(!topicOnly)await collect();
 return rows.slice(0,4);
}
