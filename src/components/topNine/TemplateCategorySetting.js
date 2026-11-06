import React,{useEffect,useState} from 'react';
import {supabase} from '../../utils/supabaseClient';
import labels from './categoryLabels.json';
export default function TemplateCategorySetting({id,disabled}){
 const [value,setValue]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 useEffect(()=>{let live=true;supabase.from('top_nine_template_categories').select('category').eq('source_worldcup_id',id).maybeSingle().then(({data})=>{if(live)setValue(data?.category||'');}).catch(()=>{});return()=>{live=false;};},[id]);
 async function save(){setBusy(true);setMessage('');try{const {error}=await supabase.rpc('save_top_nine_template_category',{p_id:id,p_category:value});if(error)throw error;setMessage('카테고리를 저장했어요.');}catch{setMessage('저장하지 못했어요. SQL 적용과 운영자 권한을 확인해 주세요.');}finally{setBusy(false);}}
 return <div style={{marginTop:12,whiteSpace:'normal'}}><label>구절판 카테고리 <select aria-label="구절판 템플릿 카테고리" disabled={disabled||busy} value={value} onChange={e=>setValue(e.target.value)}><option value="">미지정</option>{Object.entries(labels.ko).filter(([key])=>key!=='all').map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label> <button type="button" disabled={disabled||busy} onClick={save}>카테고리 저장</button>{message&&<p role="status">{message}</p>}</div>;
}
