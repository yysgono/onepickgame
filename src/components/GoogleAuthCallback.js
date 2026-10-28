import {hasNaverLinkIntent,completeNaverAccountLink,naverLinkErrorCode} from "../utils/naverAccountLink";
import NAVER_LINK_COPY from "./naverLinkCopy.json";
import AccountPolicyNotice from "./AccountPolicyNotice";
import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { googleAuthCopy } from '../utils/googleAuthCopy';

import { authLanguage, completeGoogleLogin, oauthProvider, saveSocialNickname } from '../utils/googleAuth';
export default function GoogleAuthCallback({ setNickname }) {
  const navigate = useNavigate();
  const [linking] = useState(hasNaverLinkIntent);
  const [linkError,setLinkError] = useState("failed");
  const [lang] = useState(() => { try { return authLanguage(sessionStorage.getItem('onepick.oauth.language')); } catch { return 'en'; } });
  const baseCopy = googleAuthCopy(lang);
  const linkCopy = NAVER_LINK_COPY[lang] || NAVER_LINK_COPY.en;
  const copy = oauthProvider() === 'custom:naver' ? {...baseCopy,title:lang==='ko'?'네이버 로그인':baseCopy.title.replace(/Google|구글/gi,'NAVER')} : baseCopy;
  const [status,setStatus] = useState('loading'), [nickname,setName] = useState(''), [busy,setBusy] = useState(false), [error,setError] = useState(false);
  useEffect(() => {
    let active=true;
    if(linking){
      completeNaverAccountLink().then(()=>{if(active)setStatus("linked");}).catch(err=>{if(active){setLinkError(naverLinkErrorCode(err));setStatus("error");}});
      return ()=>{active=false;};
    }
    completeGoogleLogin().then(name => {
      if (!active) return;
      if (name) { setNickname?.(name); navigate(`/${lang}`,{replace:true}); }
      else setStatus('nickname');
    }).catch(() => { if(active) setStatus('error'); });
    return () => {active=false;};
  },[lang,navigate,setNickname,linking]);
  async function save(event) {
    event.preventDefault(); if(busy) return; setBusy(true); setError(false);
    try {
      const data=await saveSocialNickname(nickname);
      setNickname?.(data); navigate(`/${lang}`,{replace:true});
    } catch {setError(true);} finally {setBusy(false);}
  }
  return <main style={{maxWidth:480,margin:'50px auto',padding:24,textAlign:'center'}}>
    <Helmet><title>Sign in | OnePickGame</title><meta name="robots" content="noindex, nofollow" /></Helmet>
    <h1>{copy.title}</h1>
    {status==='loading' && <p role="status">{copy.loading}</p>}
    {status==='error' && <><p role="alert">{linking?linkCopy[linkError]:copy.failed}</p><Link to={`/${lang}/login`}>{copy.back}</Link></>}
    {status==='linked' && <><p role="status">{linkCopy.success}</p><Link to={`/${lang}`}>{linkCopy.home}</Link></>}
    {status==='nickname' && <form onSubmit={save}>
      <AccountPolicyNotice language={lang} />
      <p>{copy.hint}</p>
      <label htmlFor="google-nickname">{copy.label}</label>
      <input id="google-nickname" value={nickname} onChange={e=>setName(e.target.value)} minLength={2} maxLength={24} required autoComplete="nickname" style={{display:'block',width:'100%',boxSizing:'border-box',padding:12,margin:'12px 0',border:'2px solid #64748b',borderRadius:8,fontSize:18}} />
      <button disabled={busy} style={{padding:'12px 24px',background:'#6650d8',color:'white',border:0,borderRadius:8,fontSize:18}}>{copy.save}</button>
      {error && <p role="alert">{copy.nicknameError}</p>}
    </form>}
  </main>;
}



