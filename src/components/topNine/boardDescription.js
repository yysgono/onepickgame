import copy from './descriptionCopy.json';
function boardDescription(board,lang='en'){
 const text=value=>typeof value==='string'?value.replace(/\s+/g,' ').trim():'';
 const title=text(board.title);
 const split=title.lastIndexOf(' - ');
 // Publication already stores the author's nickname as the title suffix.
 const author=text(board.guest_nickname||board.authorNickname)||
  (split<0?'':title.slice(split+3).replace(/ \(\d+\)$/,''));
 const names=(Array.isArray(board.slots)?board.slots:[]).slice(0,9)
  .filter(candidate=>candidate&&candidate.id!=='tn-empty-cell')
  .map(candidate=>text(candidate.name)).filter(Boolean).slice(0,4).join(lang==='ja'?'、':lang==='zh'?'、':', ');
 const forms=copy[lang]||copy.en;
 const pattern=names?(author?forms[0]:forms[1]):(author?forms[2]:forms[3]);
 const description=pattern.replace(/\{(author|names)\}/g,(_,key)=>key==='author'?author:names);
 const map=value=>{if(typeof value==='string'){try{return JSON.parse(value)||{};}catch{return {};}}return value||{};};
 const sourceIds=board.sourceIds||board.source_worldcup_ids||[];
 const templates=(board.titleSources||[]).filter(source=>sourceIds.some(id=>String(id)===String(source.id)))
  .map(source=>{const own=map(source.top_nine_title_translations),original=map(source.title_translations);return text(own[lang]||own.en||original[lang]||original.en||source.title);}).filter(Boolean);
 const template=[...new Set(templates)].join(', ');
 return description+(template?'\n'+forms[4].replace('{template}',()=>template):'');
}
export {boardDescription};
