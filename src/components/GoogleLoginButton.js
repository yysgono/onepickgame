import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { googleAuthCopy } from '../utils/googleAuthCopy';
import { authLanguage, startGoogleLogin } from '../utils/googleAuth';
export default function GoogleLoginButton() {
  const { i18n } = useTranslation();
  const copy = googleAuthCopy(authLanguage(i18n.language));
  const [busy, setBusy] = useState(false), [error, setError] = useState(false);
  return <div style={{marginBottom:24,textAlign:'center'}}>
    <button type="button" disabled={busy} onClick={async () => {
      if (busy) return; setBusy(true); setError(false);
      try { await startGoogleLogin(i18n.language); } catch { setError(true); setBusy(false); }
    }} style={{width:'100%',minHeight:50,border:'2px solid #64748b',borderRadius:10,background:'#fff',color:'#202534',fontSize:18,fontWeight:700,cursor:busy?'wait':'pointer'}}>
      {busy ? copy.connecting : copy.button}
    </button>
    {error && <p role="alert">{copy.startError}</p>}
  </div>;
}
