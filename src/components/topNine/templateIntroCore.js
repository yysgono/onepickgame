const detailCopy=require('../../seo/detailCopy.json');
const tierCopy=require('./tierTemplateIntroCopy.json');
const copy=require('./templateIntroCopy.json');
function map(value){if(typeof value==='string'){try{return JSON.parse(value)||{};}catch{return {};}}return value||{};}
function templatePageTitle(cup,lang,kind='nine'){const own=map(kind==='tier'?cup?.tier_preset_title_translations:cup?.top_nine_title_translations),original=map(cup?.title_translations);const title=[own[lang],own.en,original[lang],original.en,cup?.title].find(value=>typeof value==='string'&&value.trim())?.trim()||(kind==='tier'?'Tier List':'My Top 9');return title;}
function introCandidates(cup){
 const all=(Array.isArray(cup?.data)?cup.data:[]).map(c=>({name:String(c?.name||c?.title||'').trim(),src:c?.image||c?.image_url||c?.url||''})).filter(c=>c.name&&/^https?:\/\//i.test(c.src));
 const selected=(cup?.intro_sources||[]).map(src=>all.find(c=>c.src===src)).filter(Boolean);
 return (selected.length?selected:all).slice(0,3).map(c=>Object.assign({},c,{name:Array.from(c.name).slice(0,48).join('')}));
}
function templatePageIntro(cup,lang,kind='nine'){const words=kind==='tier'?tierCopy:copy;const names=introCandidates(cup).map(c=>c.name).join(lang==='ja'||lang==='zh'?'、':', ')||templatePageTitle(cup,lang,kind);const count=Array.isArray(cup?.data)?cup.data.length:0;return [templatePageTitle(cup,lang,kind)+'.',(words[lang]||words.en).replace('{names}',()=>names),count?(detailCopy[lang]||detailCopy.en)[7].replace('{n}',String(count)):''].filter(Boolean).join(' ');}

module.exports={templatePageTitle,introCandidates,templatePageIntro};
