const languages=['en','ko','ja','zh','es','fr','vi','de','ru','id','pt','hi','tr','th','ar','bn','it','pl','nl','cs'];
export async function tierSearchFilter(client,term){
 const safe=String(term||'').normalize('NFC').replace(/[%_,()"\\]/g,' ').trim();
 if(!safe)return '';
 const match=field=>`${field}.ilike.%${safe}%`;
 const filters=[match('title'),match('candidate_search_text'),match('tier_labels->>_tags'),match('tier_labels->>_sourcePresetName'),
  ...languages.flatMap(lang=>[match('title_translations->>'+lang),match('tier_labels->_titleTranslations->>'+lang)])];
 const legacy=safe.normalize('NFKC');if(legacy!==safe)filters.push(`tier_labels->>_tags.ilike.%${legacy}%`);
 // The visible title is taken from the source preset, not necessarily the saved title.
 try{
  const sourceFilters=[match('title'),...languages.flatMap(lang=>[match('title_translations->>'+lang),match('tier_preset_title_translations->>'+lang)])];
  const {data,error}=await client.from('worldcups').select('id').is('deleted_at',null).or(sourceFilters.join(',')).limit(1000);
  if(!error){const ids=(data||[]).map(row=>String(row.id)).filter(id=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));if(ids.length)filters.push('source_worldcup_id.in.('+ids.join(',')+')');}
 }catch{/* Saved titles, translations, candidates and tags remain searchable. */}
 return filters.join(',');
}
