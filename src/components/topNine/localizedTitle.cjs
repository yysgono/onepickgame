const {localizedBoardTitle}=require('./localizedBoardTitleCore.js');
async function loadBoardTitleSources(client,boards){
 const ids=[...new Set(boards.flatMap(board=>board.source_worldcup_ids||board.sourceIds||[]))];
 if(!ids.length)return [];
 // Only title metadata, never the candidate image pool. Batch all visible boards.
 try{
  const [cups,templates]=await Promise.all([
   client.from('worldcups').select('id,title,title_translations').in('id',ids).is('deleted_at',null),
   client.from('top_nine_templates').select('source_worldcup_id,title_translations').in('source_worldcup_id',ids)
  ]);
  if(cups.error)return [];
  return (cups.data||[]).map(cup=>({...cup,top_nine_title_translations:(templates.data||[]).find(item=>String(item.source_worldcup_id)===String(cup.id))?.title_translations}));
 }catch{return [];}
}
module.exports={localizedBoardTitle,loadBoardTitleSources};
