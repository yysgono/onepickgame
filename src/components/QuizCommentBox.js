import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../utils/supabaseClient";
import { hasBadword } from "../badwords-multilang";
import useBanCheck from "../hooks/useBanCheck";

export default function QuizCommentBox({ quizId }) {
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState(null);
  const [nickname, setNickname] = useState("");
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const { isBanned } = useBanCheck(user);

  useEffect(()=>{ supabase.auth.getUser().then(async ({data})=>{ const u=data?.user||null; setUser(u); if(u){ const {data:p}=await supabase.from("profiles").select("nickname").eq("id",u.id).single(); setNickname(p?.nickname||""); }}); },[]);
  async function load(){ setLoading(true); const {data}=await supabase.from("quiz_comments").select("*").eq("quiz_id",quizId).order("created_at",{ascending:false}); setComments(data||[]); setLoading(false); }
  useEffect(()=>{ if(quizId) load(); },[quizId]);

  async function submit(e){
    e.preventDefault(); setError(""); const text=content.trim();
    if(!user||!nickname) return setError(t("comment.loginRequired")||"로그인이 필요합니다.");
    if(isBanned) return setError(t("comment.banned")||"이용이 제한되어 있습니다.");
    if(!text) return;
    if(text.length>500) return setError(t("comment.limit500")||"500자 이하로 입력해주세요.");
    if(hasBadword(text,i18n.language)||hasBadword(nickname,i18n.language)) return setError(t("comment.badwordComment")||"사용할 수 없는 표현이 포함되어 있습니다.");
    const {error:insertError}=await supabase.from("quiz_comments").insert({quiz_id:quizId,user_id:user.id,nickname,content:text});
    if(insertError) return setError(insertError.message);
    setContent(""); await load();
  }

  async function remove(id){ if(!window.confirm("댓글을 삭제할까요?")) return; await supabase.from("quiz_comments").delete().eq("id",id).eq("user_id",user?.id||""); await load(); }

  return <div style={{maxWidth:900,margin:"34px auto 50px",border:"1.5px solid #cfd8e6",borderRadius:12,padding:16,background:"#fff"}}>
    <h3 style={{margin:"0 0 14px",fontSize:20}}>💬 {t("comment.comments")||"댓글"} <span style={{fontSize:14,color:"#68758a"}}>{comments.length}</span></h3>
    <form onSubmit={submit} style={{display:"flex",gap:8,alignItems:"stretch"}}><textarea value={content} onChange={e=>setContent(e.target.value)} maxLength={500} rows={2} placeholder={t("comment.placeholder")||"댓글을 입력하세요"} style={{flex:1,resize:"vertical",border:"1.5px solid #bccae0",borderRadius:8,padding:10,font: "inherit"}}/><button style={{minWidth:90,border:"1px solid #6650d8",background:"#6650d8",color:"#fff",borderRadius:8,fontWeight:900,cursor:"pointer"}}>{t("comment.submit")||"등록"}</button></form>
    {error&&<div style={{color:"#b42346",marginTop:8,fontSize:13}}>{error}</div>}
    <div style={{marginTop:16}}>{loading?<div style={{padding:18,color:"#68758a"}}>Loading...</div>:comments.map(c=><div key={c.id} style={{padding:"12px 4px",borderTop:"1px solid #e1e6ee"}}><div style={{display:"flex",justifyContent:"space-between",gap:10}}><strong>{c.nickname||"User"}</strong><span style={{fontSize:12,color:"#7b8798"}}>{new Date(c.created_at).toLocaleString()}</span></div><div style={{whiteSpace:"pre-wrap",marginTop:7,lineHeight:1.5}}>{c.content}</div>{user?.id===c.user_id&&<button type="button" onClick={()=>remove(c.id)} style={{marginTop:7,border:0,background:"transparent",color:"#b42346",padding:0,cursor:"pointer"}}>{t("delete")||"삭제"}</button>}</div>)}</div>
  </div>;
}
