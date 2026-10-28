import React, {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {googleAuthCopy} from '../utils/googleAuthCopy';
import {authLanguage,startNaverLogin} from '../utils/googleAuth';
export default function NaverLoginButton() {
 const {i18n}=useTranslation(), lang=authLanguage(i18n.language), copy=googleAuthCopy(lang);
 const [busy,setBusy]=useState(false),[error,setError]=useState(false);
 const label=lang==='ko'?'네이버로 계속하기':copy.button.replace(/Google|구글/gi,'NAVER');
 return <div style={{marginTop:-12,marginBottom:24,textAlign:'center'}}>
  <button type="button" disabled={busy} onClick={async()=>{
   if(busy)return;setBusy(true);setError(false);
   try{await startNaverLogin(lang);}catch{setError(true);setBusy(false);}
  }} style={{width:'100%',minHeight:50,border:0,borderRadius:10,background:'#03C75A',color:'#fff',fontSize:18,fontWeight:700,cursor:busy?'wait':'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:12}}>
   <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24"><path fill="currentColor" d="M15.331 12.841 8.434 2.875H2.715v18.25h5.954v-9.966l6.897 9.966h5.719V2.875h-5.954z"/></svg>
   <span>{busy?copy.connecting:label}</span>
  </button>
  {error&&<p role="alert">{copy.startError}</p>}
 </div>;
}
