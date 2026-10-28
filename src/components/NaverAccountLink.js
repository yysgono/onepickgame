import React,{useEffect,useState} from 'react';
import {useTranslation} from 'react-i18next';
import {supabase} from '../utils/supabaseClient';
import {authLanguage} from '../utils/googleAuth';
import {startNaverAccountLink,naverLinkErrorCode} from '../utils/naverAccountLink';
import COPY from './naverLinkCopy.json';
export default function NaverAccountLink({user}){
 const {i18n}=useTranslation(),copy=COPY[authLanguage(i18n.language)]||COPY.en;
 const [state,setState]=useState('checking'),[error,setError]=useState('');
 useEffect(()=>{let active=true;setState('checking');setError('');
  supabase.auth.getUser().then(({data,error})=>{if(active)setState(error||!data?.user?'error':data.user.identities?.some(x=>x.provider==='custom:naver')?'linked':'ready');}).catch(()=>{if(active)setState('error');});
  return()=>{active=false;};
 },[user?.id]);
 return <div style={{borderTop:'1px solid #e2e8f0',paddingTop:10,marginTop:8,whiteSpace:'normal'}}>
  <button type="button" disabled={state==='checking'||state==='busy'||state==='linked'} onClick={async()=>{
   if(state==='busy')return;setState('busy');setError('');
   try{const result=await startNaverAccountLink(authLanguage(i18n.language));if(result.alreadyLinked)setState('linked');}
   catch(err){setError(naverLinkErrorCode(err));setState('ready');}
  }} style={{width:'100%',background:'#03C75A',color:'#fff',border:0,borderRadius:7,padding:'10px 12px',fontWeight:700,cursor:state==='linked'?'default':'pointer'}}>
   {state==='linked'?copy.connected:state==='busy'?copy.connecting:state==='checking'?'…':copy.connect}
  </button>
  {state!=='linked'&&<p style={{fontSize:12,lineHeight:1.5,margin:'7px 0'}}>{copy.help}</p>}
  {(error||state==='error')&&<p role="alert" style={{fontSize:12,lineHeight:1.5,color:'#b91c1c'}}>{copy[error]||copy.failed}</p>}
 </div>;
}
export function NaverExistingAccountNotice({language}){
 const copy=COPY[authLanguage(language)]||COPY.en;
 return <p style={{padding:12,border:'1px solid #b8e2ca',borderRadius:8,background:'#f1fbf5',color:'#23533b',fontSize:14,lineHeight:1.6}}>{copy.notice}</p>;
}
