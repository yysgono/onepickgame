import React,{useEffect,useRef,useState,useId} from 'react';
import {useTranslation} from 'react-i18next';
import {supabase} from '../utils/supabaseClient';
import {searchCups} from './randomPick/api';
import {importableCandidates} from '../utils/worldcupCandidateImport';
import COPY from './worldcupCandidateImportCopy.json';
import './WorldcupCandidateImporter.css';

function titleFor(row,lang){let map=row?.title_translations;if(typeof map==='string'){try{map=JSON.parse(map);}catch{map={};}}return map?.[lang]||map?.en||row?.title||'';}
function ImportDialog({lang,copy,onClose,onImport}){
 const [search,setSearch]=useState(''),[offset,setOffset]=useState(0),[games,setGames]=useState([]),[more,setMore]=useState(false);
 const [cup,setCup]=useState(null),[candidates,setCandidates]=useState([]),[selected,setSelected]=useState(new Set()),[shown,setShown]=useState(100);
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[retry,setRetry]=useState(0);
 const request=useRef(null),alive=useRef(true),dialog=useRef(null),searchRef=useRef(null),headingId=useId();
 useEffect(()=>{alive.current=true;const previous=document.activeElement,overflow=document.body.style.overflow;document.body.style.overflow='hidden';searchRef.current?.focus();return()=>{alive.current=false;request.current?.abort();document.body.style.overflow=overflow;previous?.focus?.();};},[]);
 useEffect(()=>{
  if(cup)return;const controller=new AbortController();request.current?.abort();request.current=controller;setBusy(true);setMessage('');
  const timer=setTimeout(()=>{searchCups(search,offset,controller.signal).then(data=>{if(controller.signal.aborted)return;const page=data.slice(0,12);setGames(old=>offset?[...old,...page.filter(row=>!old.some(x=>x.id===row.id))]:page);setMore(data.length>12);}).catch(()=>{if(!controller.signal.aborted)setMessage(copy.error);}).finally(()=>{if(!controller.signal.aborted)setBusy(false);});},300);
  return()=>{clearTimeout(timer);controller.abort();};
 },[search,offset,cup,copy.error,retry]);
 async function openCup(row){
  request.current?.abort();const controller=new AbortController();request.current=controller;
  setCup(row);setCandidates([]);setSelected(new Set());setShown(100);setMessage('');setBusy(true);
  try{
   const {data,error}=await supabase.from('worldcups').select('id,title,title_translations,data').eq('id',row.id).is('deleted_at',null).abortSignal(controller.signal).single();
   if(error)throw error;if(controller.signal.aborted||!alive.current)return;
   const next=importableCandidates(data.data);setCandidates(next);setSelected(new Set(next.map((_,i)=>i)));
  }catch{if(!controller.signal.aborted&&alive.current)setMessage(copy.error);}
  finally{if(!controller.signal.aborted&&alive.current)setBusy(false);}
 }
 function back(){request.current?.abort();setCup(null);setCandidates([]);setSelected(new Set());setMessage('');}
 function add(){if(busy||!selected.size)return;const result=onImport(candidates.filter((_,i)=>selected.has(i)));setMessage(`${copy.added}: ${result.added} · ${copy.duplicates}: ${result.duplicates}${result.overflow?' · '+copy.limit:''}`);}
 function keys(event){if(event.key==='Enter'&&event.target.tagName==='INPUT'&&event.target.type!=='checkbox'){event.preventDefault();event.stopPropagation();}if(event.key==='Escape'){event.stopPropagation();onClose();}if(event.key==='Tab'){
  const elements=[...dialog.current.querySelectorAll('button:not(:disabled),input:not(:disabled),[tabindex="0"]')];const first=elements[0],last=elements[elements.length-1];
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
 }}
 return <div className="wci-overlay" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}><section ref={dialog} className="wci-dialog" role="dialog" aria-modal="true" aria-labelledby={headingId} dir={lang==='ar'?'rtl':'ltr'} onKeyDown={keys}>
 <div className="wci-top"><h2 id={headingId}>{copy.title}</h2><button type="button" onClick={onClose}>{copy.close}</button></div><p>{copy.help}</p>
 {!cup?<><input ref={searchRef} className="wci-search" aria-label={copy.search} placeholder={copy.search} value={search} maxLength={100} onChange={e=>{setSearch(e.target.value);setOffset(0);setGames([]);setMore(false);}}/>
 <ul className="wci-games">{games.map(row=><li key={row.id}><button type="button" onClick={()=>openCup(row)}>{titleFor(row,lang)}</button></li>)}</ul>{!busy&&!games.length&&!message&&<p>{copy.empty}</p>}{more&&<button type="button" disabled={busy} onClick={()=>setOffset(v=>v+12)}>{copy.more}</button>}</>:
 <><button type="button" onClick={back}>← {copy.back}</button><p className="wci-name">{titleFor(cup,lang)}</p>
 {!busy&&<><div className="wci-controls"><span>{copy.selected}: {selected.size} / {candidates.length}</span><button type="button" onClick={()=>setSelected(new Set(candidates.map((_,i)=>i)))}>{copy.all}</button><button type="button" onClick={()=>setSelected(new Set())}>{copy.none}</button></div>
 {candidates.length?<div className="wci-candidates">{candidates.slice(0,shown).map((row,i)=><label key={row.sourceIndex}><input type="checkbox" checked={selected.has(i)} onChange={()=>setSelected(old=>{const next=new Set(old);if(next.has(i))next.delete(i);else next.add(i);return next;})}/><span>{row.name}</span></label>)}{shown<candidates.length&&<button type="button" onClick={()=>setShown(v=>v+100)}>{copy.more}</button>}</div>:!message&&<p>{copy.noCandidates}</p>}
 <footer className="wci-controls"><button type="button" className="wci-add" disabled={!selected.size} onClick={add}>{copy.add} ({selected.size})</button><button type="button" onClick={back}>{copy.back}</button></footer></>}
 </>}
 {busy&&<p role="status">{copy.loading}</p>}{message&&<p role="status" className="wci-status">{message}</p>}{message===copy.error&&<button type="button" disabled={busy} onClick={()=>cup?openCup(cup):setRetry(v=>v+1)}>{copy.search}</button>}
 </section></div>;
}
export default function WorldcupCandidateImporter({disabled,onImport}){
 const {i18n}=useTranslation(),lang=String(i18n.resolvedLanguage||i18n.language||'en').split(/[-_]/)[0],copy=COPY[lang]||COPY.en;
 const [open,setOpen]=useState(false);
 return <><button type="button" className="wci-open" disabled={disabled} onClick={()=>setOpen(true)}>＋ {copy.open}</button>{open&&!disabled&&<ImportDialog lang={lang} copy={copy} onClose={()=>setOpen(false)} onImport={onImport}/>}</>;
}
