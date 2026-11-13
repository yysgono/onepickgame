import React,{useEffect,useRef,useState} from 'react';
import {supabase} from '../../utils/supabaseClient';
import {safeMedia,isShareable,normalizeCandidates,candidateMatches} from './core';
import {isVideo} from './media';

export default function ThumbnailSetting({id,url='',disabled,onSaved,kind='nine'}) {
 const [value,setValue]=useState(url),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const [open,setOpen]=useState(false),[candidates,setCandidates]=useState(null),[loading,setLoading]=useState(false),[loadError,setLoadError]=useState(false),[query,setQuery]=useState(''),[limit,setLimit]=useState(36);
 const request=useRef(0);
 useEffect(()=>{setValue(url);},[url]);
 useEffect(()=>()=>{request.current++;},[]);
 const preview=safeMedia(value.trim(),false);
 const visible=(candidates||[]).filter(candidate=>candidateMatches(candidate,query));
 async function loadCandidates(){
  if(loading)return;
  const token=++request.current;
  setLoading(true);setLoadError(false);
  try{
   const {data,error}=await supabase.from('worldcups').select('data').eq('id',id).is('deleted_at',null).maybeSingle();
   if(error||!data)throw Error('SOURCE_NOT_FOUND');
   if(request.current===token)setCandidates(normalizeCandidates(data.data).filter(candidate=>isShareable(candidate)&&candidate.src.startsWith('https://')));
  }catch{if(request.current===token)setLoadError(true);}
  finally{if(request.current===token)setLoading(false);}
 }
 function showCandidates(){
  setOpen(previous=>!previous);
  if(!open&&candidates===null)loadCandidates();
 }
 async function save(){
  setMessage('');
  if(value.trim()&&(!preview||!isShareable({src:preview})||!preview.startsWith('https://'))){setMessage('공개된 후보 사진을 선택해 주세요.');return;}
  setBusy(true);
  try{const {error}=await supabase.rpc(kind==='tier'?'save_tier_preset_thumbnail':'save_top_nine_thumbnail',{p_id:id,p_url:preview||''});if(error)throw error;onSaved(preview||'');setMessage('썸네일을 저장했어요.');}
  catch{setMessage('저장하지 못했어요. SQL 적용과 운영자 권한을 확인해 주세요.');}
  finally{setBusy(false);}
 }
 return <div style={{marginTop:12}}>
  <strong>{kind==='tier'?'티어표 프리셋 썸네일':'구절판 취향표 추천 썸네일'}</strong>
  {preview&&(isVideo(preview)?<video src={preview} muted playsInline preload="metadata" style={{width:160,height:100,objectFit:'cover',display:'block',marginTop:8}}/>:<img src={preview} alt="선택한 썸네일" loading="lazy" style={{width:160,height:100,objectFit:'cover',objectPosition:'center 25%',display:'block',marginTop:8}}/>)}
  <div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:8}}>
   <button type="button" disabled={disabled||busy} aria-expanded={open} onClick={showCandidates}>{open?'후보 접기':'이 월드컵 후보에서 고르기'}</button>
   <button type="button" disabled={disabled||busy||!value} onClick={()=>{setValue('');setMessage('기본 썸네일로 바꾸려면 저장해 주세요.');}}>기본 썸네일 사용</button>
  </div>
  {open&&<div style={{border:'1px solid #c4b5fd',borderRadius:8,padding:12,marginTop:10}}>
   <p>사진을 선택한 뒤 썸네일 저장을 눌러 주세요.</p>
   <input type="search" aria-label="썸네일 후보 검색" placeholder="후보 이름 검색" value={query} disabled={disabled||busy} onChange={e=>{setQuery(e.target.value);setLimit(36);}} style={{width:'100%',boxSizing:'border-box',padding:9,marginBottom:10}}/>
   {loading&&<p role="status">후보를 불러오는 중…</p>}
   {loadError&&<p role="alert">후보를 불러오지 못했어요. <button type="button" onClick={loadCandidates}>다시 시도</button></p>}
   {!loading&&!loadError&&candidates!==null&&!visible.length&&<p>선택할 수 있는 후보가 없어요.</p>}
   <div style={{maxHeight:430,overflowY:'auto'}}>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(100px,1fr))',gap:8}}>
     {visible.slice(0,limit).map(candidate=><button type="button" key={candidate.id} disabled={disabled||busy} aria-pressed={preview===candidate.src} onClick={()=>{setValue(candidate.src);setMessage('선택했어요. 썸네일 저장을 눌러 주세요.');}} style={{minWidth:0,padding:4,border:preview===candidate.src?'3px solid #7c3aed':'1px solid #ddd6fe',borderRadius:8,background:preview===candidate.src?'#f3e8ff':'white',color:'#35204e'}}>
      {isVideo(candidate.src)?<video src={candidate.src} muted playsInline preload="metadata" style={{width:'100%',aspectRatio:'1',objectFit:'cover'}}/>:<img src={candidate.src} alt="" loading="lazy" style={{width:'100%',aspectRatio:'1',objectFit:'cover',objectPosition:'center 25%'}}/>}
      <span style={{display:'block',fontSize:13,overflowWrap:'anywhere'}}>{preview===candidate.src?'✓ ':''}{candidate.name||'이름 없음'}</span>
     </button>)}
    </div>
    {visible.length>limit&&<button type="button" onClick={()=>setLimit(previous=>previous+36)}>더보기</button>}
   </div>
  </div>}
  <button type="button" disabled={disabled||busy} onClick={save} style={{marginTop:10}}>{busy?'저장 중…':'썸네일 저장'}</button>
  {message&&<p role="status">{message}</p>}
 </div>;
}
