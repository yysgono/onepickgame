import React,{useEffect,useState} from 'react';
import {supabase} from '../../utils/supabaseClient';
import {safeMedia,isShareable} from './core';
export default function ThumbnailSetting({id,url='',disabled,onSaved}) {
 const [value,setValue]=useState(url),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 useEffect(()=>{setValue(url);},[url]);
 const preview=safeMedia(value.trim(),false);
 async function save(){
  setMessage('');
  if(value.trim()&&(!preview||!isShareable({src:preview})||!preview.startsWith('https://'))){setMessage('공개 HTTPS 이미지 주소를 입력해 주세요.');return;}
  setBusy(true);
  try{const {error}=await supabase.rpc('save_top_nine_thumbnail',{p_id:id,p_url:preview||''});if(error)throw error;onSaved(preview||'');setMessage('썸네일을 저장했어요.');}
  catch{setMessage('저장하지 못했어요. SQL 적용과 운영자 권한을 확인해 주세요.');}
  finally{setBusy(false);}
 }
 return <div style={{marginTop:12}}>
  <label style={{display:'block'}}>구절판 썸네일 이미지 주소
   <input type="url" value={value} disabled={disabled||busy} onChange={e=>{setValue(e.target.value);setMessage('');}} placeholder="https://…" style={{width:'100%',padding:9,boxSizing:'border-box'}}/>
  </label>
  {preview&&<img src={preview} alt="썸네일 미리보기" loading="lazy" style={{width:160,height:100,objectFit:'cover',objectPosition:'center 25%',display:'block',marginTop:8}}/>}
  <p>공개된 이미지 주소를 넣어 주세요. 비우고 저장하면 기존 썸네일을 사용해요.</p>
  <button type="button" disabled={disabled||busy} onClick={save}>{busy?'저장 중…':'썸네일 저장'}</button>
  {message&&<p role="status">{message}</p>}
 </div>;
}
