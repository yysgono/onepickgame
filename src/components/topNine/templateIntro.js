import tierCopy from './tierTemplateIntroCopy.json';
import copy from './templateIntroCopy.json';
function map(value){if(typeof value==='string'){try{return JSON.parse(value)||{};}catch{return {};}}return value||{};}
export function templatePageTitle(cup,lang,kind='nine'){const own=map(kind==='tier'?cup?.tier_preset_title_translations:cup?.top_nine_title_translations),original=map(cup?.title_translations);const title=[own[lang],own.en,original[lang],original.en,cup?.title].find(value=>typeof value==='string'&&value.trim())?.trim()||(kind==='tier'?'Tier List':'My Top 9');return kind!=='tier'&&lang==='ko'?title.replace(/구절판(?! 취향표)/g,'구절판 취향표'):title;}
export function introCandidates(cup){
 const all=(Array.isArray(cup?.data)?cup.data:[]).map(c=>({name:String(c?.name||c?.title||'').trim(),src:c?.image||c?.image_url||c?.url||''})).filter(c=>c.name&&/^https?:\/\//i.test(c.src));
 const selected=(cup?.intro_sources||[]).map(src=>all.find(c=>c.src===src)).filter(Boolean);
 return (selected.length?selected:all).slice(0,4);
}
export function templatePageIntro(cup,lang,kind='nine'){const words=kind==='tier'?tierCopy:copy;const names=introCandidates(cup).map(c=>c.name).join(lang==='ja'||lang==='zh'?'、':', ')||templatePageTitle(cup,lang,kind);return (words[lang]||words.en).replace('{names}',()=>names);}
