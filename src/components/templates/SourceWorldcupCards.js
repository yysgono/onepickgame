import React,{useEffect,useState} from 'react';
import {supabase} from '../../utils/supabaseClient';
import sharedCards from '../../utils/sharedWorldcupCards';
import {getWorldcupTitle} from '../../utils/localization';
import discovery from '../../seo/templateDiscovery';
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
  Promise.all([query,sharedCards.loadCards(supabase,values)]).then(([{data,error},previews])=>{
   if(!live||error)return;
   const byId=new Map(previews.map(row=>[row.cup_id,row.images]));
   const cups=new Map((data||[]).map(row=>[String(row.id),row]));
   setState({key,rows:values.filter(id=>cups.has(id)).map(id=>({href:`/${language}/select-round/${id}`,label:getWorldcupTitle(cups.get(id),language),images:byId.get(id)||[]}))});
  }).catch(()=>{}).finally(()=>clearTimeout(timer));
  return()=>{live=false;clearTimeout(timer);controller.abort();};
 },[key]);
 if(state.key!==key||!state.rows.length)return null;
 const copy=discovery.COPY[lang]||discovery.COPY.en;
 return <section className="template-discovery result-source-worldcups" aria-label={copy.source} dir={lang==='ar'?'rtl':undefined}><div className="td-group td-source-group"><h2>{copy.source}</h2><div className="result-source-worldcup-grid">{state.rows.map(row=><Card key={row.href} row={row} source versusImage/>)}</div></div></section>;
}
