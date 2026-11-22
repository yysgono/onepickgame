import React,{useEffect,useState} from 'react';
import {supabase} from '../../utils/supabaseClient';
import {templateTitle} from '../../utils/templateTitles';
import {Card} from './TemplateDiscovery';
import tierCopy from './sourceTierCopy.json';
import nineCopy from './sourceNineCopy.json';
const media=value=>typeof value==='string'&&/^https?:\/\//i.test(value)?value:'';
export default function WorldcupCreationCards({cup,lang='en'}){
 const id=String(cup?.id||''),[state,setState]=useState(null);
 useEffect(()=>{
  if(!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(id))return;
  let live=true;const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),3500);
  const read=async query=>{try{const {data,error}=await query.abortSignal(controller.signal);return error?[]:(data||[]);}catch{return [];}};
  Promise.all([
   read(supabase.from('worldcup_tier_preset_cards').select('id,tier_preset_title_translations,tier_preset_thumbnail_url').eq('id',id)),
   read(supabase.from('tier_preset_thumbnails').select('image_url').eq('source_worldcup_id',id)),
   read(supabase.from('top_nine_templates').select('title_translations').eq('source_worldcup_id',id)),
   read(supabase.from('top_nine_thumbnails').select('image_url').eq('source_worldcup_id',id)),
  ]).then(([tiers,tierImages,nines,nineImages])=>{if(live)setState({id,tier:tiers[0],tierImage:tierImages[0]?.image_url,nine:nines[0],nineImage:nineImages[0]?.image_url});}).finally(()=>clearTimeout(timer));
  return()=>{live=false;clearTimeout(timer);controller.abort();};
 },[id]);
 if(!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(id))return null;
 const saved=state?.id===id?state:{};
 // The result already has this pool. Reuse it without loading candidates or statistics again.
 const candidates=(Array.isArray(cup?.data)?cup.data:[]).map(c=>({src:media(c?.image||c?.image_url||c?.url),zoom:1,x:50,y:50})).filter(c=>c.src);
 const tierImage=media(saved.tierImage)||media(saved.tier?.tier_preset_thumbnail_url)||candidates[0]?.src;
 const nineImage=media(saved.nineImage);
 const tierTitle=templateTitle({...cup,tier_preset_title_translations:saved.tier?.tier_preset_title_translations},'tier',lang);
 const nineTitle=templateTitle({...cup,top_nine_title_translations:saved.nine?.title_translations},'nine',lang);
 return <section className="template-discovery result-source-worldcups result-source-actions worldcup-creation-actions" dir={lang==='ar'?'rtl':undefined}>
  <div className="td-group td-source-group"><h2>{tierCopy[lang]||tierCopy.en}</h2><div className="result-source-worldcup-grid"><Card kind="tier" row={{href:`/${lang}/tier-list/create/${id}?from=source-candidates`,label:tierTitle,image:tierImage}}/></div></div>
  <div className="td-group td-source-group"><h2>{nineCopy[lang]||nineCopy.en}</h2><div className="result-source-worldcup-grid"><Card kind="nine" row={{href:`/${lang}/mytop9/templates/${id}`,label:nineTitle,image:nineImage,slots:nineImage?undefined:Array.from({length:9},(_,i)=>candidates[i]||null)}}/></div></div>
 </section>;
}
