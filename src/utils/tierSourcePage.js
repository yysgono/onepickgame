const sharedCards=require('./sharedWorldcupCards.js');
const categoryGroups={
 game:['game'],animation:['anime_manga','animation'],entertainment:['person','korea','music','entertainment'],
 food:['food'],sports:['sports'],other:['etc','movie_drama','travel','brands','brand','product','animals_plants','other']
};
async function loadTierSourcePage(client,{filter='',category='all',offset=0,pageSize=30}={}){
 // Empty searches retain the curated presets; typing searches every public World Cup.
 let query=filter
  ?client.from('worldcups').select('id,title,title_translations,category,tier_preset_title_translations').is('deleted_at',null)
  :client.from('worldcup_tier_preset_cards').select('id,title,title_translations,category,tier_preset_order,tier_preset_title_translations,tier_preset_thumbnail_url');
 if(category!=='all')query=query.in('category',categoryGroups[category]||[category]);
 if(filter)query=query.or(filter);
 else query=query.order('tier_preset_order',{ascending:true,nullsFirst:false});
 const {data,error}=await query.order('id',{ascending:true}).range(offset,offset+pageSize);
 if(error)throw error;
 const rows=data||[];if(!rows.length)return [];
 const ids=rows.map(row=>row.id);
 const [thumbs,previews]=await Promise.all([
  client.from('tier_preset_thumbnails').select('source_worldcup_id,image_url').in('source_worldcup_id',ids),
  filter?sharedCards.loadCards(client,ids):Promise.resolve([])
 ]);
 const images=new Map((thumbs.data||[]).map(row=>[String(row.source_worldcup_id),row.image_url]));
 const fallback=new Map(previews.map(row=>[String(row.cup_id),row.images[0]]));
 return rows.map(row=>Object.assign({},row,{tier_preset_thumbnail_url:images.get(String(row.id))||row.tier_preset_thumbnail_url||fallback.get(String(row.id))}));
}
module.exports={loadTierSourcePage};
