export const ACTIVITY_LANGUAGE_LABELS={ko:'한국어',en:'English',ja:'日本語',zh:'中文',es:'Español',fr:'Français',vi:'Tiếng Việt',de:'Deutsch',ru:'Русский',id:'Bahasa Indonesia',pt:'Português',hi:'हिन्दी',tr:'Türkçe',th:'ไทย',ar:'العربية',bn:'বাংলা',it:'Italiano',pl:'Polski',nl:'Nederlands',cs:'Čeština'};
export function normalizeActivityLanguage(value){
 const lang=typeof value==='string'?value.trim().toLowerCase().split(/[-_]/)[0]:'';
 return Object.hasOwn(ACTIVITY_LANGUAGE_LABELS,lang)?lang:null;
}
export function currentActivityLanguage(value){
 if(value!==undefined)return normalizeActivityLanguage(value);
 if(typeof window==='undefined')return null;
 const path=window.location?.pathname||'';
 return normalizeActivityLanguage(path.match(/^\/([a-z]{2})(?:\/|$)/i)?.[1])||(path==='/'?'en':null);
}
export const activityLanguageLabel=value=>ACTIVITY_LANGUAGE_LABELS[normalizeActivityLanguage(value)]||'언어 미기록';
