import React,{useEffect,useState} from 'react';
import {supabase} from '../../utils/supabaseClient';
import sharedCards from '../../utils/sharedWorldcupCards';
import {getWorldcupTitle} from '../../utils/localization';
import discovery from '../../seo/templateDiscovery';
import tierCopy from './sourceTierCopy.json';
import {Card} from './TemplateDiscovery';

// Reuse the stored home-card snapshot. Never fetch candidate pools or winner_stats.
export default function SourceWorldcupCards({sourceIds=[],lang='en'}){
 const ids=[...new Set(sourceIds.filter(id=>/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(String(id))))].slice(0,9);
 const key=JSON.stringify([ids,lang]);
 const [state,setState]=useState({key:'',rows:[]});
 useEffect(()=>{
  const [values,language]=JSON.parse(key);
  if(!values.length)return;
  let live=true;
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),3500);
  const query=supabase.from('worldcups').select('id,title,title_translations').is('deleted_at',null).in('id',values).abortSignal(controller.signal);
  const optional=async query=>{try{const {data,error}=await query.abortSignal(controller.signal);return error?[]:(data||[]);}catch{return [];}};
  const presets=optional(supabase.from('worldcup_tier_preset_cards').select('id,title,title_translations,tier_preset_title_translations,tier_preset_thumbnail_url').in('id',values));
  const thumbnails=optional(supabase.from('tier_preset_thumbnails').select('source_worldcup_id,image_url').in('source_worldcup_id',values));
  Promise.all([query,sharedCards.loadCards(supabase,values),presets,thumbnails]).then(([{data,error},previews,tierPresets,tierThumbnails])=>{
   if(!live||error)return;
   const byId=new Map(previews.map(row=>[row.cup_id,row.images]));
   const cups=new Map((data||[]).map(row=>[String(row.id),row]));
   const presetById=new Map(tierPresets.map(row=>[String(row.id),row]));
   const thumbnailById=new Map(tierThumbnails.map(row=>[String(row.source_worldcup_id),row.image_url]));
   setState({key,rows:values.filter(id=>cups.has(id)).map(id=>({id,tier:presetById.get(id),tierImage:thumbnailById.get(id)||presetById.get(id)?.tier_preset_thumbnail_url,href:`/${language}/select-round/${id}`,label:getWorldcupTitle(cups.get(id),language),images:byId.get(id)||[]}))});
  }).catch(()=>{}).finally(()=>clearTimeout(timer));
  return()=>{live=false;clearTimeout(timer);controller.abort();};
 },[key]);
 if(state.key!==key||!state.rows.length)return null;
 const copy=discovery.COPY[lang]||discovery.COPY.en;
 const tierHeading=tierCopy[lang]||tierCopy.en;
 const tierTitle=row=>{let titles=row.tier?.tier_preset_title_translations||{};if(typeof titles==='string'){try{titles=JSON.parse(titles);}catch{titles={};}}return titles[lang]||titles.en||row.label;};
 return <section className="template-discovery result-source-worldcups result-source-actions" aria-label={copy.title} dir={lang==='ar'?'rtl':undefined}>
  <div className="td-group td-source-group"><h2>{copy.source}</h2><div className="result-source-worldcup-grid">{state.rows.map(row=><Card key={row.href} row={row} source versusImage/>)}</div></div>
  <div className="td-group td-source-group td-source-tier-group"><h2>{tierHeading}</h2><div className="result-source-worldcup-grid">{state.rows.map(row=><Card key={row.id} row={{href:`/${lang}/tier-list/create/${row.id}`,label:tierTitle(row),image:/^https?:\/\//i.test(row.tierImage||'')?row.tierImage:row.images[0]}} kind="tier"/>)}</div></div>
 </section>;
}
