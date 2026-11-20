const {localizedBoardTitle}=require('./localizedBoardTitleCore.js');
const detailCopy=require('../../seo/detailCopy.json');
const copy=require('./descriptionCopy.json');
function boardDescription(board,lang='en'){
 const text=value=>typeof value==='string'?value.replace(/\s+/g,' ').trim():'';
 const title=text(localizedBoardTitle(board,board.titleSources||[],lang));
 const split=title.lastIndexOf(' - ');
 // Publication already stores the author's nickname as the title suffix.
 const author=text(board.guest_nickname||board.authorNickname)||
  (split<0?'':title.slice(split+3).replace(/ \(\d+\)$/,''));
 const names=(Array.isArray(board.slots)?board.slots:[]).slice(0,9)
  .filter(candidate=>candidate&&candidate.id!=='tn-empty-cell')
  .map(candidate=>Array.from(text(candidate.name)).slice(0,48).join('')).filter(Boolean).slice(0,3).join(lang==='ja'?'、':lang==='zh'?'、':', ');
 const forms=copy[lang]||copy.en;
 const pattern=names?(author?forms[0]:forms[1]):(author?forms[2]:forms[3]);
 const description=pattern.replace(/\{(author|names)\}/g,(_,key)=>key==='author'?author:names);
 const base=author&&title.endsWith(' - '+author)?title.slice(0,-author.length-3):title;
 const count=(Array.isArray(board.slots)?board.slots:[]).filter(c=>c&&c.id!=='tn-empty-cell').length;
 const countText=count?(detailCopy[lang]||detailCopy.en)[7].replace('{n}',String(count)):'';
 return [base?Array.from(base).slice(0,100).join('')+'.':'',description,countText].filter(Boolean).join(' ');
}
module.exports={boardDescription};
