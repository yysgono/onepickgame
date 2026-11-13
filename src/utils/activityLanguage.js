export const ACTIVITY_LANGUAGE_LABELS={ko:'한국어',en:'English',ja:'日本語',zh:'中文',es:'Español',fr:'Français',vi:'Tiếng Việt',de:'Deutsch',ru:'Русский',id:'Bahasa Indonesia',pt:'Português',hi:'हिन्दी',tr:'Türkçe',th:'ไทย',ar:'العربية',bn:'বাংলা',it:'Italiano',pl:'Polski',nl:'Nederlands',cs:'Čeština'};
export function normalizeActivityLanguage(value){
 const lang=typeof value==='string'?value.trim().toLowerCase().split(/[-_]/)[0]:'';
 return Object.hasOwn(ACTIVITY_LANGUAGE_LABELS,lang)?lang:null;
}
// The URL is the language the visitor opened. i18n may still hold the
// previous page's language while an asynchronous language change completes.
export function currentActivityLanguage(value){
 if(typeof window!=='undefined'){
  const path=window.location?.pathname||'';
  const routeLanguage=normalizeActivityLanguage(path.match(/^\/([a-z]{2})(?:\/|$)/i)?.[1]);
  if(routeLanguage)return routeLanguage;
  if(path==='/')return 'en';
 }
 return normalizeActivityLanguage(value);
}
export const activityLanguageLabel=value=>ACTIVITY_LANGUAGE_LABELS[normalizeActivityLanguage(value)]||'언어 미기록';
