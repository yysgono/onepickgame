function map(value){if(typeof value==='string'){try{value=JSON.parse(value);}catch{return {};}}return value&&typeof value==='object'&&!Array.isArray(value)?{...value}:{};}
// Rebase only a NEW clone. Editing an existing post keeps its original language.
export function localizeTierClone(payload,language,originalLanguage,descriptionFields={}){
 const titles={...map(payload.tier_labels?._titleTranslations),...map(payload.title_translations)};
 const descriptions=map(descriptionFields.description_translations);
 const originalTitle=String(payload.title||'').trim();
 const originalDescription=String(descriptionFields.description||'').trim();
 if(originalTitle&&!String(titles[originalLanguage]||'').trim())titles[originalLanguage]=originalTitle;
 if(originalDescription&&!String(descriptions[originalLanguage]||'').trim())descriptions[originalLanguage]=originalDescription;
 const translatedTitle=typeof titles[language]==='string'?titles[language].trim():'';
 const copyCode=(globalThis.crypto?.randomUUID?.()||`${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`).replace(/-/g,'').slice(0,10);
 for(const code of Object.keys(titles))if(typeof titles[code]==='string'&&titles[code].trim())titles[code]=`${titles[code].trim()} · ${copyCode}`;
 const nextLanguage=translatedTitle?language:originalLanguage;
 const translatedDescription=typeof descriptions[nextLanguage]==='string'?descriptions[nextLanguage].trim():'';
 return {...payload,title:titles[nextLanguage]||`${payload.title} · ${copyCode}`,title_translations:titles,
 description:translatedDescription||(nextLanguage===originalLanguage?originalDescription:''),description_translations:descriptions,
 tier_labels:{...payload.tier_labels,_originalLanguage:nextLanguage,_titleTranslations:titles,
 _descriptionTranslations:descriptions,_description:translatedDescription||(nextLanguage===originalLanguage?originalDescription:'')}};
}
