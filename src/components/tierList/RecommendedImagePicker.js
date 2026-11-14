import React,{useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {supabase} from '../../utils/supabaseClient';
import {loadTierSourceCatalogue} from '../../utils/tierSourceCatalogue';
import {worldcupTitle,recommendedCandidates} from '../../utils/tierRecommendedCandidates';
import copy from './recommendedImageCopy.json';
import './recommendedImagePicker.css';
const PAGE_SIZE=30;
export default function RecommendedImagePicker({lang,onAdd,onClose}){
 const t=copy[lang]||copy.en,dialog=useRef(null),search=useRef(null),version=useRef(0),close=useRef(onClose);
 close.current=onClose;
 const [rows,setRows]=useState([]),[query,setQuery]=useState(''),[limit,setLimit]=useState(PAGE_SIZE),[loading,setLoading]=useState(true),[importing,setImporting]=useState(false),[error,setError]=useState(''),[retry,setRetry]=useState(0);
 useEffect(()=>{
  const before=document.activeElement,overflow=document.body.style.overflow;document.body.style.overflow='hidden';search.current?.focus();
  const key=event=>{if(event.key==='Escape'){event.preventDefault();close.current();}if(event.key==='Tab'){
   const nodes=[...dialog.current.querySelectorAll('button:not(:disabled),input:not(:disabled)')],first=nodes[0],last=nodes[nodes.length-1];
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
  }};
  document.addEventListener('keydown',key);return()=>{version.current++;document.body.style.overflow=overflow;document.removeEventListener('keydown',key);before?.focus();};
 },[]);
 useEffect(()=>{
  const request=++version.current;setLoading(true);setError('');
  loadTierSourceCatalogue().then(data=>{if(request===version.current)setRows(data.filter(cup=>!cup.deleted_at));}).catch(()=>{if(request===version.current)setError(t.error);}).finally(()=>{if(request===version.current)setLoading(false);});
  return()=>{version.current++;};
 },[retry,t.error]);
 const term=query.trim().normalize('NFC').toLocaleLowerCase();
 const filtered=rows.filter(cup=>[worldcupTitle(cup,lang),cup.title,...Object.values(typeof cup.title_translations==='object'&&cup.title_translations||{})].some(value=>String(value||'').normalize('NFC').toLocaleLowerCase().includes(term)));
 async function choose(source){
  if(importing)return;const request=++version.current;setImporting(true);setError('');
  try{
   const {data,error:loadError}=await supabase.from('worldcups').select('id,title,title_translations,data').eq('id',source.id).is('deleted_at',null).maybeSingle();
   if(request!==version.current)return;
   if(loadError||!data)throw Error('LOAD');const items=recommendedCandidates(data,lang);
   if(!items.length)throw Error('EMPTY');
   onAdd(items,data);onClose();
  }catch{if(request===version.current)setError(t.error);}finally{if(request===version.current)setImporting(false);}
 }
 return createPortal(<div className="tier-recommended-overlay" onClick={event=>{if(event.target===event.currentTarget)onClose();}}><section className="tier-recommended-dialog" ref={dialog} role="dialog" aria-modal="true" aria-labelledby="tier-recommended-title" dir={lang==='ar'?'rtl':'ltr'}>
  <header><h2 id="tier-recommended-title">{t.title}</h2><button type="button" onClick={onClose} aria-label={t.close}>×</button></header>
  <p>{t.help}</p><input ref={search} type="search" aria-label={t.search} placeholder={t.search} value={query} disabled={importing} onChange={event=>{setQuery(event.target.value);setLimit(PAGE_SIZE);}}/>
  {error&&<p role="alert">{error} <button type="button" disabled={importing} onClick={()=>setRetry(n=>n+1)}>{t.retry}</button></p>}
  {(loading||importing)&&<p role="status">{t.loading}</p>}
  <ul className="tier-recommended-titles">{filtered.slice(0,limit).map(source=><li key={source.id}><button type="button" disabled={importing||loading} onClick={()=>choose(source)}>{worldcupTitle(source,lang)}</button></li>)}</ul>
  {!loading&&!filtered.length&&<p>{t.empty}</p>}
  {filtered.length>limit&&<button type="button" className="tier-recommended-more" disabled={importing} onClick={()=>setLimit(n=>n+PAGE_SIZE)}>{t.more}</button>}
 </section></div>,document.body);
}
