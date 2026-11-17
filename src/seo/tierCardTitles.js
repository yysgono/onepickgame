// Shared read-only title rules for browser cards and first HTML.
const detail=require('./tierDetailSeo.js');
const uuid=/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i;
function map(value){if(typeof value==='string'){try{return JSON.parse(value)||{};}catch{return {};}}return value&&typeof value==='object'&&!Array.isArray(value)?value:{};}
function localizedTierCardTitle(row,sources,language){
 const lang=String(language||'en').split(/[-_]/)[0],meta=map(row.tier_labels);
 const explicit=Object.assign({},map(row.title_translations),map(meta._titleTranslations));
 if(explicit[lang]||meta._customPublicTitle)return detail.getTierListTitle(row,lang);
 const source=(sources||[]).find(cup=>String(cup.id)===String(row.source_worldcup_id||meta._sourceWorldcupId));
 if(!source)return detail.getTierListTitle(row,lang);
 const own=map(source.tier_preset_title_translations),original=map(source.title_translations);
 const target=own[lang]||own.en||original[lang]||original.en;
 if(!target)return detail.getTierListTitle(row,lang);
 const saved=String(row.title||'');
 const variants=Object.values(own).concat(Object.values(original),[source.title,meta._sourcePresetName]).filter(value=>typeof value==='string'&&value.trim()).map(value=>value.trim()).sort((a,b)=>b.length-a.length);
 for(const base of variants){
  if(saved===base)return target;
  if(saved.startsWith(base+' - '))return target+saved.slice(base.length);
 }
 return detail.getTierListTitle(row,lang);
}
async function loadTierCardTitleSources(client,rows,signal){
 const ids=Array.from(new Set((rows||[]).map(row=>row.source_worldcup_id||map(row.tier_labels)._sourceWorldcupId).filter(id=>uuid.test(String(id)))));
 if(!ids.length)return [];
 try{let query=client.from('worldcups').select('id,title,title_translations,tier_preset_title_translations').is('deleted_at',null).in('id',ids);if(signal&&query.abortSignal)query=query.abortSignal(signal);const {data,error}=await query;return error?[]:data||[];}catch{return [];}
}
module.exports={localizedTierCardTitle,loadTierCardTitleSources};
