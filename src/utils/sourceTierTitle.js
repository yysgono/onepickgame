// Shared title rule for source-candidate invitations; configured titles stay intact.
const suffixes = require('../locales/sourceTierTitleSuffix.json');
function sourceTierTitle(title, language) {
 const lang = String(language || 'en').toLowerCase().split(/[-_]/)[0];
 const suffix = suffixes[lang] || suffixes.en;
 const base = String(title || '').trim();
 if (!base) return suffix;
 return base.toLocaleLowerCase().endsWith(suffix.toLocaleLowerCase()) ? base : base + ' ' + suffix;
}
function map(value){if(typeof value==='string'){try{return JSON.parse(value)||{};}catch{return {};}}return value&&typeof value==='object'?value:{};}
function sourceTierTitleTranslations(cup,preset=false){
 const titles=Object.assign({},map(cup?.title_translations),preset?map(cup?.tier_preset_title_translations):{});
 const original=String(cup?.original_language||'').toLowerCase().split(/[-_]/)[0];
 if(suffixes[original]&&String(cup?.title||'').trim()&&!String(titles[original]||'').trim())titles[original]=cup.title;
 return Object.fromEntries(Object.keys(suffixes).filter(code=>typeof titles[code]==='string'&&titles[code].trim()).map(code=>[code,sourceTierTitle(titles[code],code)]));
}
function mergeSourceTierTitles(current,generated,previous={},protectedLanguage=''){
 const merged=Object.assign({},current);
 for(const [code,title] of Object.entries(generated)){
  if(code!==protectedLanguage&&(!String(merged[code]||'').trim()||merged[code]===previous[code]))merged[code]=title;
 }
 return merged;
}
module.exports = {sourceTierTitle,sourceTierTitleTranslations,mergeSourceTierTitles};
