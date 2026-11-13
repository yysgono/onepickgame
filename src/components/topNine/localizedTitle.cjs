// Shared by the browser and server so public titles and search metadata agree.
function translations(value) {
 if(typeof value==='string'){try{return JSON.parse(value)||{};}catch{return {};}}
 return value&&typeof value==='object'?value:{};
}
function localizedBoardTitle(board,sources,lang) {
 const saved=String(board.title||'');
 for(const id of board.source_worldcup_ids||board.sourceIds||[]){
  const source=(sources||[]).find(item=>String(item.id)===String(id));if(!source)continue;
  const own=translations(source.top_nine_title_translations),original=translations(source.title_translations);
  const rawTarget=own[lang]||own.en||original[lang]||original.en||source.title;
  if(!rawTarget)continue;
  const target=lang==='ko'?rawTarget.replace(/구절판(?! 취향표)/g,'구절판 취향표'):rawTarget;
  const variants=[...Object.values(own),...Object.values(original),source.title].filter(value=>typeof value==='string'&&value.trim()).flatMap(value=>{const text=value.trim();return [text,text.replace(/구절판(?! 취향표)/g,'구절판 취향표')];}).sort((a,b)=>b.length-a.length);
  for(const base of variants){
   if(saved===base)return target;
   if(saved.startsWith(base+' - '))return target+saved.slice(base.length);
  }
 }
 return saved;
}
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
