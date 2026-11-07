import React,{useState} from 'react';
import {supabase} from '../../utils/supabaseClient';
import {normalizeCandidates,candidateMatches} from './core';
export default function TemplateIntroSetting({id,disabled}){
 const [open,setOpen]=useState(false),[pool,setPool]=useState([]),[picked,setPicked]=useState([]),[query,setQuery]=useState(''),[limit,setLimit]=useState(36),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 async function show(){if(open){setOpen(false);return;}setBusy(true);setMessage('');try{
  const [cup,settings]=await Promise.all([supabase.from('worldcups').select('data').eq('id',id).is('deleted_at',null).maybeSingle(),supabase.from('top_nine_template_intros').select('candidate_sources').eq('source_worldcup_id',id).maybeSingle()]);
  if(cup.error||settings.error||!cup.data)throw Error();setPool((Array.isArray(cup.data.data)?cup.data.data:[]).slice(0,2048).flatMap((raw,index)=>normalizeCandidates([raw]).map(c=>({...c,id:String(index),reference:raw.image||raw.image_url||raw.url}))));setPicked(settings.data?.candidate_sources||[]);setOpen(true);
 }catch{setMessage('불러오지 못했어요. SQL 적용과 접근 권한을 확인해 주세요.');}finally{setBusy(false);}}
 async function save(){setBusy(true);setMessage('');try{const {error}=await supabase.rpc('save_top_nine_template_intro',{p_id:id,p_sources:picked});if(error)throw error;setMessage('대표 후보를 저장했어요. 비워두면 후보 목록의 고정 순서를 사용합니다.');}catch{setMessage('저장하지 못했어요. 다시 시도해 주세요.');}finally{setBusy(false);}}
 const visible=pool.filter(c=>candidateMatches(c,query));
 return <div style={{marginTop:12,whiteSpace:'normal'}}><button type="button" disabled={disabled||busy} onClick={show}>{open?'대표 후보 접기':'소개문 대표 후보 설정 (최대 4개)'}</button>{open&&<div style={{padding:12,border:'1px solid #ddd6fe',marginTop:8,borderRadius:8}}>
 <p>선택한 순서대로 소개문에 표시합니다. 미지정 시 후보 목록 앞의 4개를 사용합니다.</p><p>{picked.map(src=>pool.find(c=>c.reference===src)?.name).filter(Boolean).join(' → ')||'대표 후보 미지정'}</p>
 <input aria-label="대표 후보 검색" placeholder="후보 검색" value={query} onChange={e=>{setQuery(e.target.value);setLimit(36);}}/>
 <div style={{maxHeight:400,overflowY:'auto',display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(100px,1fr))',gap:8,marginTop:8}}>{visible.slice(0,limit).map(c=><button key={c.id} type="button" disabled={disabled||busy||(!picked.includes(c.reference)&&picked.length>=4)} aria-pressed={picked.includes(c.reference)} onClick={()=>setPicked(old=>old.includes(c.reference)?old.filter(src=>src!==c.reference):[...old,c.reference])} style={{padding:5,border:picked.includes(c.reference)?'3px solid #7139ce':'1px solid #ddd6fe',background:'white',minWidth:0}}><img src={c.src} alt="" loading="lazy" style={{width:'100%',aspectRatio:'1',objectFit:'cover'}}/><span style={{display:'block',overflowWrap:'anywhere'}}>{c.name}</span></button>)}</div>
 {visible.length>limit&&<button type="button" onClick={()=>setLimit(n=>n+36)}>더보기</button>}<div style={{marginTop:10}}><button type="button" disabled={disabled||busy} onClick={()=>setPicked([])}>선택 초기화</button> <button type="button" disabled={disabled||busy} onClick={save}>대표 후보 저장</button></div></div>}{message&&<p role="status">{message}</p>}</div>;
}
