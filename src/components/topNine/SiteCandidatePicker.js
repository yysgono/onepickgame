import React,{useEffect,useRef,useState} from 'react';
import {sourcePage,loadSource} from './api';
import {normalizeCandidates,candidateMatches,safeMedia} from './core';
import {templateTitle} from '../../utils/templateTitles';
function Thumb({src}){return safeMedia(src)&&! /\.(mp4|webm|mov)(?:[?#]|$)/i.test(src)?<img src={safeMedia(src)} alt="" loading="lazy"/>:<span aria-hidden="true">▧</span>;}
export default function SiteCandidatePicker({lang,onAdd,onClose}) {
 const ko=lang==='ko',dialog=useRef(),input=useRef(),version=useRef(0),closeRef=useRef(onClose);
 const [sources,setSources]=useState([]),[pool,setPool]=useState(null),[sourceTitle,setSourceTitle]=useState(''),[query,setQuery]=useState(''),[term,setTerm]=useState(''),[offset,setOffset]=useState(0),[more,setMore]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[checked,setChecked]=useState([]),[limit,setLimit]=useState(48);
 useEffect(()=>{closeRef.current=onClose;},[onClose]);
 useEffect(()=>{
  const before=document.activeElement,overflow=document.body.style.overflow;document.body.style.overflow='hidden';input.current?.focus();
  const key=e=>{if(e.key==='Escape'){e.preventDefault();closeRef.current();}if(e.key==='Tab'){const nodes=[...dialog.current.querySelectorAll('button:not(:disabled),input:not(:disabled)')];if(!nodes.length)return;const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}};
  document.addEventListener('keydown',key);const request=++version.current;setBusy(true);
  sourcePage('',0,true).then(rows=>{if(request!==version.current)return;setSources(rows);setMore(rows.length===30);}).catch(()=>{if(request===version.current)setError(ko?'추천 프리셋을 불러오지 못했어요. 검색으로 다시 시도해 주세요.':'Unable to load presets. Please try searching.');}).finally(()=>{if(request===version.current)setBusy(false);});
  return()=>{version.current++;document.body.style.overflow=overflow;document.removeEventListener('keydown',key);before?.focus();};
 },[ko]);
 async function search(e,append=false){e?.preventDefault();const request=++version.current;setBusy(true);setError('');try{const start=append?offset+30:0,value=append?term:query;const rows=await sourcePage(value,start,false);if(request!==version.current)return;setSources(old=>append?[...old,...rows]:rows);setTerm(value);setOffset(start);setMore(rows.length===30);}catch{if(request===version.current)setError(ko?'검색하지 못했어요. 다시 시도해 주세요.':'Search failed. Please retry.');}finally{if(request===version.current)setBusy(false);}}
 async function choose(source){const request=++version.current;setBusy(true);setError('');try{const data=await loadSource(source.id);if(request!==version.current)return;const candidates=normalizeCandidates(data.data).map(c=>({...c,id:`site:${source.id}:${c.id}`}));setPool(candidates);setSourceTitle(templateTitle(source,'nine',lang));setQuery('');setChecked([]);setLimit(48);}catch{if(request===version.current)setError(ko?'후보를 불러오지 못했어요.':'Unable to load candidates.');}finally{if(request===version.current)setBusy(false);}}
 function add(items){if(!items.length)return;onAdd(items);onClose();}
 const filtered=pool?.filter(c=>candidateMatches(c,query))||[];
 return <div className="tn-picker-overlay" onClick={e=>{if(e.target===e.currentTarget)onClose();}}><section ref={dialog} className="tn-picker" role="dialog" aria-modal="true" aria-labelledby="tn-picker-title">
 <header><h2 id="tn-picker-title">{pool?sourceTitle:ko?'사이트 내에서 골라오기':'Choose from the site'}</h2><button aria-label={ko?'닫기':'Close'} onClick={onClose}>×</button></header>
 {pool&&<button disabled={busy} onClick={()=>{version.current++;setPool(null);setQuery(term);setError('');}}>{ko?'← 프리셋 목록':'← Presets'}</button>}
 <form className="tn-search" onSubmit={pool?e=>e.preventDefault():search}><input ref={input} type="search" aria-label={pool?(ko?'후보 검색':'Search candidates'):(ko?'프리셋 검색':'Search presets')} placeholder={pool?(ko?'후보 이름 검색':'Search candidates'):(ko?'프리셋·월드컵 제목 검색':'Search presets and tournaments')} value={query} onChange={e=>setQuery(e.target.value)}/>{!pool&&<button disabled={busy}>{ko?'검색':'Search'}</button>}</form>
 {error&&<p role="alert">{error}</p>}{busy&&<p role="status">{ko?'불러오는 중…':'Loading…'}</p>}
 {!pool?<><p>{ko?'추천 프리셋을 선택한 뒤 가져올 후보를 골라주세요.':'Choose a preset, then pick candidates to import.'}</p><div className="tn-picker-sources">{sources.map(source=><button disabled={busy} key={source.id} onClick={()=>choose(source)}><Thumb src={source.thumbnail}/><strong>{templateTitle(source,'nine',lang)}</strong></button>)}</div>{!sources.length&&!busy&&<p>{ko?'결과가 없어요. 다른 제목으로 검색해 주세요.':'No results. Try another title.'}</p>}{more&&<button disabled={busy} onClick={()=>search(null,true)}>{ko?'더보기':'Show more'}</button>}</>:<>
 <div className="tn-picker-candidates">{filtered.slice(0,limit).map(c=><button disabled={busy} key={c.id} aria-pressed={checked.includes(c.id)} className={checked.includes(c.id)?'selected':''} onClick={()=>setChecked(old=>old.includes(c.id)?old.filter(id=>id!==c.id):[...old,c.id])}><Thumb src={c.src}/><span>{checked.includes(c.id)?'✓ ':''}{c.name}</span></button>)}</div>
 {filtered.length>limit&&<button onClick={()=>setLimit(n=>n+48)}>{ko?'더보기':'Show more'}</button>}
 <footer><button disabled={!checked.length||busy} className="tn-primary" onClick={()=>add(pool.filter(c=>checked.includes(c.id)))}>{ko?'선택한 후보 추가':'Add selected'} ({checked.length})</button><button disabled={!filtered.length||busy} onClick={()=>add(filtered)}>{ko?'검색된 후보 모두 추가':'Add all results'} ({filtered.length})</button></footer>
 </>}
 </section></div>;
}
