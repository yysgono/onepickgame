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
  .map(candidate=>text(candidate.name)).filter(Boolean).join(lang==='ja'?'、':lang==='zh'?'、':', ');
 const forms=copy[lang]||copy.en;
 const pattern=names?(author?forms[0]:forms[1]):(author?forms[2]:forms[3]);
 return pattern.replace(/\{(author|names)\}/g,(_,key)=>key==='author'?author:names);
}
export {boardDescription};
