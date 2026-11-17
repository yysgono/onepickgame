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
  const variants=Object.values(own).concat(Object.values(original),[source.title]).filter(value=>typeof value==='string'&&value.trim()).flatMap(value=>{const text=value.trim();return [text,text.replace(/구절판(?! 취향표)/g,'구절판 취향표'),text.replace(/구절판 취향표/g,'구절판')];}).sort((a,b)=>b.length-a.length);
  for(const base of variants){
   if(saved===base)return target;
   if(saved.startsWith(base+' - '))return target+saved.slice(base.length);
  }
 }
 return saved;
}
module.exports={localizedBoardTitle};
