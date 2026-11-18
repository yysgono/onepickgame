const WORLDCUP_SLUG='ideal-type-world-cup';
const SUPPORTED=require('./categoryLabels.json');
function language(value){const lang=String(value||'en').split(/[-_]/)[0];return SUPPORTED[lang]?lang:'en';}
function worldcupHome(value){return '/'+language(value)+'/'+WORLDCUP_SLUG;}
function siteHome(value){const lang=language(value);return lang==='en'?'/':'/'+lang;}
function isWorldcupHome(path){return /^\/[a-z]{2}\/ideal-type-world-cup\/?$/i.test(path||'');}
function isSiteHome(path){const parts=String(path||'/').split('/').filter(Boolean);return parts.length===0||(parts.length===1&&Object.prototype.hasOwnProperty.call(SUPPORTED,parts[0]));}
module.exports={WORLDCUP_SLUG,worldcupHome,siteHome,isWorldcupHome,isSiteHome,language};
