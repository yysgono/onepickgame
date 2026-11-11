import React,{useState} from 'react';
import {createPortal} from 'react-dom';
import {supabase} from '../../utils/supabaseClient';
import {guestProof,normalizeGuestSalt} from './guestProof';
import {rememberGuestEditSession} from './guestEditSession';
import copy from './copy.json';
export default function GuestEditPrompt({id,nickname,lang,onVerified,onClose}){
 const t=copy[lang]||copy.en;
 const [password,setPassword]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 async function verify(event){event.preventDefault();if(busy)return;setBusy(true);setError('');try{
  const saltResult=await supabase.rpc('get_top_nine_guest_salt',{p_id:id});
  if(saltResult.error)throw saltResult.error;
  const salt=normalizeGuestSalt(saltResult.data);
  const proof=await guestProof(password,salt);
  const verified=await supabase.rpc('verify_top_nine_guest_edit',{p_id:id,p_proof:proof});
  if(verified.error)throw verified.error;
  if(verified.data!==true)throw Error('GUEST_PASSWORD_MISMATCH');
  rememberGuestEditSession(id,{salt,proof,nickname});setPassword('');onVerified();
 }catch(error){setError(error?.message==='GUEST_PASSWORD_MISMATCH'?t.editPasswordError:/GUEST_EDIT_LOCKED/.test(error?.message||'')?t.editLocked:['PGRST202','42883','42P01'].includes(error?.code)?t.editSetupRequired:t.editVerifyUnavailable);}finally{setBusy(false);}}
 return createPortal(<div className="top-nine tn-picker-overlay tn-public-overlay" dir={lang==='ar'?'rtl':'ltr'}><section className="tn-publish-dialog" role="dialog" aria-modal="true" aria-label={t.unlockEdit}><h2>{t.unlockEdit}</h2><p>{t.unlockEditHelp}</p><form onSubmit={verify}><label>{t.password}<input autoFocus type="password" autoComplete="current-password" required minLength={4} maxLength={100} value={password} disabled={busy} onChange={e=>setPassword(e.target.value)}/></label>{error&&<p role="alert">{error}</p>}<div className="tn-actions"><button className="tn-primary" disabled={busy}>{busy?t.loading:t.edit}</button><button type="button" disabled={busy} onClick={onClose}>{t.close}</button></div></form></section></div>,document.body);
}
