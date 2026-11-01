import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../utils/supabaseClient";
import { hasBadword } from "../badwords-multilang";
import useBanCheck from "../hooks/useBanCheck";
import { addGuestComment, manageGuestComment } from "../utils/guestComments";

export default function QuizCommentBox({ quizId }) {
  const { t, i18n } = useTranslation();
  const ko = String(i18n.language || "en").startsWith("ko");
  const [user, setUser] = useState(null);
  const [nickname, setNickname] = useState("");
  const [guestNickname, setGuestNickname] = useState("");
  const [guestPassword, setGuestPassword] = useState("");
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const { isBanned } = useBanCheck(user);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const current = data?.user || null;
      setUser(current);
      if (current) {
        const { data: profile } = await supabase.from("public_member_names").select("nickname").eq("id", current.id).single();
        setNickname(profile?.nickname || "");
      }
    });
  }, []);

  async function load() {
    if (!quizId) return;
    setLoading(true);
    const { data, error: loadError } = await supabase.from("quiz_comments").select("*").eq("quiz_id", quizId).order("created_at", { ascending: false });
    if (loadError) setError(loadError.message);
    setComments(data || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, [quizId]);

  async function submit(event) {
    event.preventDefault();
    setError("");
    const text = content.trim();
    const author = user ? nickname : guestNickname.trim();
    if (isBanned) return setError(t("comment.banned") || (ko ? "이용이 제한되어 있습니다." : "Commenting is unavailable."));
    if (!text) return;
    if (text.length > 500) return setError(t("comment.limit500") || (ko ? "댓글은 500자 이하로 입력해주세요." : "Comments must be 500 characters or fewer."));
    if (!author || (!user && !guestPassword)) return setError(ko ? "닉네임과 비밀번호를 입력해주세요." : "Enter a nickname and password.");
    if (hasBadword(text, i18n.language) || hasBadword(author, i18n.language)) return setError(t("comment.badwordComment") || (ko ? "사용할 수 없는 표현이 포함되어 있습니다." : "Please remove prohibited words."));
    try {
      if (user) {
        const { error: insertError } = await supabase.from("quiz_comments").insert({ quiz_id: quizId, user_id: user.id, nickname: author, content: text });
        if (insertError) throw insertError;
      } else {
        await addGuestComment({ kind: "quiz", targetId: quizId, nickname: author, password: guestPassword, content: text });
        setGuestPassword("");
      }
      setContent("");
      await load();
    } catch (submitError) { setError(submitError.message || (ko ? "댓글을 등록하지 못했습니다." : "Could not post comment.")); }
  }

  async function remove(comment) {
    try {
      if (comment.user_id) {
        if (!window.confirm(t("comment.deleteConfirm", { defaultValue: ko ? "이 댓글을 삭제할까요?" : "Delete this comment?" }))) return;
        if (comment.user_id !== user?.id) throw new Error(ko ? "본인이 작성한 댓글만 삭제할 수 있습니다." : "You can only delete your own comment.");
        const { error: deleteError } = await supabase.from("quiz_comments").delete().eq("id", comment.id).eq("user_id", user.id);
        if (deleteError) throw deleteError;
      } else {
        const password = window.prompt(ko ? "댓글 작성 때 입력한 비밀번호를 입력하세요." : "Enter the password used for this comment.");
        if (password === null) return;
        await manageGuestComment({ kind: "quiz", commentId: comment.id, password, action: "delete" });
      }
      await load();
    } catch (deleteError) { setError(deleteError.message || (ko ? "댓글을 삭제하지 못했습니다." : "Could not delete comment.")); }
  }

  async function edit(comment) {
    const password = window.prompt(ko ? "댓글 작성 때 입력한 비밀번호를 입력하세요." : "Enter the password used for this comment.");
    if (password === null) return;
    const next = window.prompt(ko ? "수정할 댓글 내용을 입력하세요." : "Enter the edited comment.", comment.content);
    if (next === null) return;
    const clean = next.trim();
    if (!clean || clean.length > 500 || hasBadword(clean, i18n.language)) return setError(ko ? "댓글 내용을 확인해주세요. (500자 이하, 비속어 금지)" : "Check the comment (up to 500 characters; prohibited words are not allowed).");
    try {
      if (comment.user_id) throw new Error(ko ? "회원 댓글 수정 기능은 아직 지원하지 않습니다." : "Editing member comments is not available yet.");
      await manageGuestComment({ kind: "quiz", commentId: comment.id, password, action: "edit", content: clean });
      await load();
    } catch (editError) { setError(editError.message || (ko ? "댓글을 수정하지 못했습니다." : "Could not edit comment.")); }
  }

  return <div style={{ maxWidth: 900, margin: "34px auto 50px", border: "1.5px solid #cfd8e6", borderRadius: 12, padding: 16, background: "#fff" }}>
    <h3 style={{ margin: "0 0 14px", fontSize: 20 }}>💬 {t("comment.comments") || (ko ? "댓글" : "Comments")} <span style={{ fontSize: 14, color: "#68758a" }}>{comments.length}</span></h3>
    <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: user ? "1fr" : "minmax(0,1fr) minmax(0,1fr)", gap: 8 }}>
      {!user && <><input value={guestNickname} onChange={e => setGuestNickname(e.target.value)} maxLength={20} autoComplete="nickname" placeholder={ko ? "임시 닉네임 (최대 20자)" : "Guest nickname (up to 20 characters)"} style={{ minWidth: 0, border: "1.5px solid #bccae0", borderRadius: 8, padding: 10, font: "inherit" }} /><input type="password" value={guestPassword} onChange={e => setGuestPassword(e.target.value)} minLength={4} maxLength={50} autoComplete="new-password" placeholder={ko ? "수정·삭제용 비밀번호 (4~50자)" : "Password for editing/deleting (4–50 characters)"} style={{ minWidth: 0, border: "1.5px solid #bccae0", borderRadius: 8, padding: 10, font: "inherit" }} /></>}
      <textarea value={content} onChange={e => setContent(e.target.value)} maxLength={500} rows={2} placeholder={t("comment.placeholder") || (ko ? "댓글을 입력하세요" : "Write a comment")} style={{ gridColumn: "1 / -1", resize: "vertical", border: "1.5px solid #bccae0", borderRadius: 8, padding: 10, font: "inherit" }} />
      <button style={{ gridColumn: "1 / -1", minHeight: 42, border: "1px solid #6650d8", background: "#6650d8", color: "#fff", borderRadius: 8, fontWeight: 900, cursor: "pointer" }}>{t("comment.submit") || (ko ? "등록" : "Post")}</button>
    </form>
    {!user && <div style={{ marginTop: 6, color: "#64748b", fontSize: 12 }}>{ko ? "비밀번호를 잊으면 댓글을 수정하거나 삭제할 수 없습니다." : "Keep your password; it cannot be recovered."}</div>}
    {error && <div role="alert" style={{ color: "#b42346", marginTop: 8, fontSize: 13 }}>{error}</div>}
    <div style={{ marginTop: 16 }}>{loading ? <div style={{ padding: 18, color: "#68758a" }}>{t("comment.loading", { defaultValue: "Loading..." })}</div> : comments.map(comment => <div key={comment.id} style={{ padding: "12px 4px", borderTop: "1px solid #e1e6ee" }}><div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}><strong>{comment.nickname || "User"}</strong><span style={{ fontSize: 12, color: "#7b8798" }}>{new Date(comment.created_at).toLocaleString()}</span></div><div style={{ whiteSpace: "pre-wrap", marginTop: 7, lineHeight: 1.5 }}>{comment.content}</div><div style={{ display: "flex", gap: 12, marginTop: 7 }}>{!comment.user_id && <><button type="button" onClick={() => edit(comment)} style={{ border: 0, background: "transparent", color: "#6650d8", padding: 0, cursor: "pointer" }}>{ko ? "수정" : "Edit"}</button><button type="button" onClick={() => remove(comment)} style={{ border: 0, background: "transparent", color: "#b42346", padding: 0, cursor: "pointer" }}>{t("delete") || (ko ? "삭제" : "Delete")}</button></>}{user?.id === comment.user_id && <button type="button" onClick={() => remove(comment)} style={{ border: 0, background: "transparent", color: "#b42346", padding: 0, cursor: "pointer" }}>{t("delete") || (ko ? "삭제" : "Delete")}</button>}</div></div>)}</div>
  </div>;
}
