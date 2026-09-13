import React, { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../utils/supabaseClient";
import { useTranslation } from "react-i18next";


const pageStyle = {
  minHeight: "calc(100vh - 220px)",
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "center",
  padding: "54px 16px 80px",
  boxSizing: "border-box",
};

const cardStyle = {
  width: "100%",
  maxWidth: 430,
  background: "linear-gradient(180deg, rgba(17,30,49,0.98) 0%, rgba(10,21,37,0.98) 100%)",
  border: "1px solid rgba(70,145,235,0.5)",
  borderRadius: 20,
  boxShadow: "0 24px 70px rgba(0,0,0,0.42), 0 0 28px rgba(25,118,237,0.10)",
  padding: "34px 32px 30px",
  boxSizing: "border-box",
  color: "#fff",
  fontFamily: "'Pretendard','Noto Sans KR',Arial,sans-serif",
};

const inputStyle = {
  width: "100%",
  minHeight: 48,
  padding: "0 14px",
  borderRadius: 10,
  border: "1px solid #35577e",
  background: "#0b1728",
  color: "#fff",
  fontSize: 16,
  outline: "none",
  boxSizing: "border-box",
};

const buttonStyle = {
  width: "100%",
  minHeight: 50,
  background: "linear-gradient(90deg,#2999ff,#236de8 100%)",
  color: "#fff",
  fontWeight: 900,
  border: "none",
  borderRadius: 11,
  fontSize: 17,
  padding: "11px 14px",
  boxShadow: "0 8px 24px rgba(35,109,232,0.3)",
  cursor: "pointer",
};

const labelStyle = {
  display: "block",
  marginBottom: 7,
  color: "#c7d8eb",
  fontSize: 14,
  fontWeight: 800,
};


function getByteLength(str) { let len=0; for (let i=0;i<str.length;i++) len += str.charCodeAt(i)>127 ? 2 : 1; return len; }
function sliceByByte(str,maxBytes) { let bytes=0,result=""; for (let i=0;i<str.length;i++) { const c=str[i], n=str.charCodeAt(i)>127?2:1; if(bytes+n>maxBytes) break; result+=c; bytes+=n; } return result; }

function FindPwBox() {
  const { t, i18n } = useTranslation();
  const [userId,setUserId]=useState(""); const [nickname,setNickname]=useState(""); const [successMsg,setSuccessMsg]=useState(""); const [error,setError]=useState(""); const [loading,setLoading]=useState(false);
  const lang=(i18n.language||"en").split("-")[0];

  async function handleFindPw(e) {
    e.preventDefault(); setSuccessMsg(""); setError("");
    if(!userId||!nickname) { setError(t("auth.findPw.inputAll")); return; }
    if(getByteLength(nickname)>12) { setError(t("auth.common.nicknameMax")); return; }
    setLoading(true);
    try {
      const {data:profile,error:pErr}=await supabase.from("profiles").select("email").eq("nickname",nickname.trim()).eq("email",userId.trim()).single();
      if(pErr||!profile?.email) { setError(t("auth.findPw.noMatch")); setLoading(false); return; }
      const {error:resetErr}=await supabase.auth.resetPasswordForEmail(userId.trim(),{redirectTo:`${window.location.origin}/${lang}/reset-password`});
      if(resetErr) setError(t("auth.findPw.sendFail")); else setSuccessMsg(t("auth.findPw.sendSuccess"));
    } catch { setError(t("auth.common.temporaryError")); }
    setLoading(false);
  }

  return <div style={pageStyle}><div style={cardStyle}>
    <div style={{textAlign:"center",marginBottom:26}}><h2 style={{margin:0,fontSize:27,fontWeight:950}}>{t("auth.findPw.title")}</h2><p style={{margin:"9px 0 0",color:"#8fa8c2",fontSize:14,lineHeight:1.55}}>{t("auth.findPw.subtitle")}</p></div>
    <form onSubmit={handleFindPw}>
      <label style={labelStyle}>{t("auth.common.email")}</label><input type="email" value={userId} onChange={e=>setUserId(e.target.value)} placeholder={t("auth.common.emailPlaceholder")} style={{...inputStyle,marginBottom:16}} maxLength={50} disabled={loading} autoComplete="username" />
      <label style={labelStyle}>{t("auth.common.nickname")}</label><input type="text" value={nickname} onChange={e=>setNickname(sliceByByte(e.target.value,12))} placeholder={t("auth.common.nicknamePlaceholder")} style={{...inputStyle,marginBottom:20}} autoComplete="off" spellCheck={false} disabled={loading} />
      <button type="submit" style={{...buttonStyle,opacity:loading?.65:1}} disabled={loading}>{loading?t("auth.findPw.loading"):t("auth.findPw.submit")}</button>
    </form>
    {successMsg&&<div style={{color:"#62e6a7",marginTop:16,textAlign:"center",fontWeight:800,lineHeight:1.5}}>{successMsg}</div>}
    {error&&<div style={{color:"#ff728e",marginTop:16,textAlign:"center",fontWeight:700}}>{error}</div>}
    <div style={{marginTop:22,paddingTop:18,borderTop:"1px solid #233b58",textAlign:"center"}}><Link to={`/${lang}/login`} style={{color:"#64d8ff",fontWeight:900,textDecoration:"none"}}>← {t("auth.common.backToLogin")}</Link></div>
  </div></div>;
}
export default FindPwBox;
