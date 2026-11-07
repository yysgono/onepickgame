import copy from './templateIntroCopy.json';
function map(value){if(typeof value==='string'){try{return JSON.parse(value)||{};}catch{return {};}}return value||{};}
export function templatePageTitle(cup,lang){const own=map(cup?.top_nine_title_translations),original=map(cup?.title_translations);return own[lang]||own.en||original[lang]||original.en||cup?.title||'My Top 9';}
export function introCandidates(cup){
 const all=(Array.isArray(cup?.data)?cup.data:[]).map(c=>({name:String(c?.name||c?.title||'').trim(),src:c?.image||c?.image_url||c?.url||''})).filter(c=>c.name&&/^https?:\/\//i.test(c.src));
 const selected=(cup?.intro_sources||[]).map(src=>all.find(c=>c.src===src)).filter(Boolean);
 return (selected.length?selected:all).slice(0,4);
}
export function templatePageIntro(cup,lang){const names=introCandidates(cup).map(c=>c.name).join(lang==='ja'||lang==='zh'?'、':', ')||templatePageTitle(cup,lang);return (copy[lang]||copy.en).replace('{names}',()=>names);}
