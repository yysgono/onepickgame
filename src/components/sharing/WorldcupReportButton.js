import React,{useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {useTranslation} from 'react-i18next';
import {supabase} from '../../utils/supabaseClient';
import './worldcupReport.css';
export default function WorldcupReportButton({cupId,cupTitle='',lang='en'}){
 const {t}=useTranslation(),[show,setShow]=useState(false),[reason,setReason]=useState(''),[ok,setOk]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const dialog=useRef(null),textarea=useRef(null),pending=useRef(false);
 useEffect(()=>{
  if(!show)return;
  const previous=document.activeElement,overflow=document.body.style.overflow;document.body.style.overflow='hidden';textarea.current?.focus();
  function keyboard(event){
   if(event.key==='Escape'&&!pending.current){event.preventDefault();setShow(false);}
   if(event.key==='Tab'){
    const nodes=[...dialog.current.querySelectorAll('button:not(:disabled),textarea:not(:disabled),[tabindex="0"]')];
    if(!nodes.length){event.preventDefault();dialog.current.focus();return;}
    const first=nodes[0],last=nodes[nodes.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
   }
  }
  document.addEventListener('keydown',keyboard);
  return()=>{document.body.style.overflow=overflow;document.removeEventListener('keydown',keyboard);previous?.focus?.();};
 },[show]);
 async function submit(event){
  event.preventDefault();if(pending.current||ok)return;
  pending.current=true;setBusy(true);setError('');setOk('');
  try{
   const {data}=await supabase.auth.getUser();if(!data?.user?.id){setError(t('need_login'));return;}
   const reportUrl=`${window.location.origin}/${lang}/select-round/${encodeURIComponent(cupId)}`;
   const {error:failure}=await supabase.from('site_suggestions').insert({author_id:data.user.id,language:lang,title:`[월드컵 신고] ${cupTitle||cupId}`.slice(0,200),body:[`신고 사유: ${String(reason||'(미입력)').trim().slice(0,1000)}`,`월드컵: ${reportUrl}`,`월드컵 ID: ${cupId}`].join('\n\n')});
   if(failure)throw failure;setOk(t('report_submit_success'));
  }catch(failure){setError(failure.message||t('need_login'));}finally{pending.current=false;setBusy(false);}
 }
 return <>
  <button type="button" className="opg-share-report" onClick={()=>{setOk('');setError('');setShow(true);}} aria-haspopup="dialog">⚑ {t('report')}</button>
  {show&&createPortal(<div className="opg-report-backdrop" onClick={event=>{if(event.target===event.currentTarget&&!pending.current)setShow(false);}}>
   <section ref={dialog} tabIndex={-1} className="opg-report-dialog" role="dialog" aria-modal="true" aria-label={t('report')} dir={lang==='ar'?'rtl':'ltr'}>
    <header className="opg-report-header"><div><span className="opg-report-icon" aria-hidden="true">⚑</span><h2>{t('report')}</h2></div><button type="button" className="opg-report-close" disabled={busy} aria-label={t('close')} onClick={()=>setShow(false)}>×</button></header>
    {cupTitle&&<p className="opg-report-content-title">{cupTitle}</p>}
    <form onSubmit={submit}>
     <label className="opg-report-label"><span>{t('report_reason')}</span><textarea ref={textarea} value={reason} onChange={event=>setReason(event.target.value)} maxLength={1000} disabled={busy||!!ok} placeholder={t('report_reason_placeholder')}/></label>
     <p className="opg-report-count">{reason.length} / 1000</p>
     {error&&<p className="opg-report-error" role="alert">{error}</p>}{ok&&<p className="opg-report-success" role="status">{ok}</p>}
     <footer className="opg-report-actions"><button type="button" disabled={busy} onClick={()=>setShow(false)}>{t('close')}</button><button type="submit" className="opg-report-submit" disabled={busy||!!ok} aria-busy={busy}>{busy?'…':t('report_submit')}</button></footer>
    </form>
   </section>
  </div>,document.body)}
 </>;
}
