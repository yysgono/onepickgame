import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../utils/supabaseClient";
import { hasBadword } from "../badwords-multilang";

// New notice labels only; existing translations are left unchanged.
const LABELS = {
 en: ["Pinned notices", "Administrator notice", "Creator notice", "Write a notice", "Edit my notice", "Write a notice for participants (up to 2,000 characters)."],
 ko: ["공지사항", "운영자 공지", "작성자 공지", "공지 작성", "내 공지 수정", "참여자에게 알릴 공지를 입력하세요. (최대 2,000자)"],
 ja: ["固定のお知らせ", "管理者のお知らせ", "作成者のお知らせ", "お知らせを書く", "自分のお知らせを編集", "参加者へのお知らせを入力してください（最大2,000文字）。"],
 zh: ["置顶公告", "管理员公告", "创作者公告", "发布公告", "编辑我的公告", "输入面向参与者的公告（最多2,000个字符）。"],
 es: ["Avisos fijados", "Aviso del administrador", "Aviso del creador", "Escribir un aviso", "Editar mi aviso", "Escribe un aviso para los participantes (máximo 2.000 caracteres)."],
 fr: ["Annonces épinglées", "Annonce de l’administrateur", "Annonce du créateur", "Rédiger une annonce", "Modifier mon annonce", "Rédigez une annonce pour les participants (2 000 caractères maximum)."],
 vi: ["Thông báo được ghim", "Thông báo của quản trị viên", "Thông báo của người tạo", "Viết thông báo", "Sửa thông báo của tôi", "Nhập thông báo cho người tham gia (tối đa 2.000 ký tự)."],
 de: ["Angeheftete Hinweise", "Hinweis des Administrators", "Hinweis des Erstellers", "Hinweis verfassen", "Meinen Hinweis bearbeiten", "Hinweis für Teilnehmende eingeben (höchstens 2.000 Zeichen)."],
 ru: ["Закреплённые объявления", "Объявление администратора", "Объявление автора", "Написать объявление", "Изменить моё объявление", "Введите объявление для участников (до 2 000 символов)."],
 id: ["Pengumuman tersemat", "Pengumuman administrator", "Pengumuman pembuat", "Tulis pengumuman", "Edit pengumuman saya", "Tulis pengumuman untuk peserta (maksimal 2.000 karakter)."],
 pt: ["Avisos fixados", "Aviso do administrador", "Aviso do criador", "Escrever aviso", "Editar meu aviso", "Escreva um aviso para os participantes (até 2.000 caracteres)."],
 hi: ["पिन की गई सूचनाएँ", "व्यवस्थापक की सूचना", "निर्माता की सूचना", "सूचना लिखें", "मेरी सूचना संपादित करें", "प्रतिभागियों के लिए सूचना लिखें (अधिकतम 2,000 अक्षर)।"],
 tr: ["Sabitlenmiş duyurular", "Yönetici duyurusu", "İçerik oluşturucunun duyurusu", "Duyuru yaz", "Duyurumu düzenle", "Katılımcılar için bir duyuru yazın (en fazla 2.000 karakter)."],
 th: ["ประกาศที่ปักหมุด", "ประกาศจากผู้ดูแลระบบ", "ประกาศจากผู้สร้าง", "เขียนประกาศ", "แก้ไขประกาศของฉัน", "เขียนประกาศสำหรับผู้เข้าร่วม (ไม่เกิน 2,000 ตัวอักษร)"],
 ar: ["الإعلانات المثبتة", "إعلان المشرف", "إعلان المنشئ", "كتابة إعلان", "تعديل إعلاني", "اكتب إعلانًا للمشاركين (بحد أقصى 2,000 حرف)."],
 bn: ["পিন করা ঘোষণা", "প্রশাসকের ঘোষণা", "নির্মাতার ঘোষণা", "ঘোষণা লিখুন", "আমার ঘোষণা সম্পাদনা করুন", "অংশগ্রহণকারীদের জন্য ঘোষণা লিখুন (সর্বোচ্চ ২,০০০ অক্ষর)।"],
 it: ["Avvisi in evidenza", "Avviso dell’amministratore", "Avviso dell’autore", "Scrivi un avviso", "Modifica il mio avviso", "Scrivi un avviso per i partecipanti (massimo 2.000 caratteri)."],
 pl: ["Przypięte ogłoszenia", "Ogłoszenie administratora", "Ogłoszenie twórcy", "Napisz ogłoszenie", "Edytuj moje ogłoszenie", "Napisz ogłoszenie dla uczestników (maksymalnie 2000 znaków)."],
 nl: ["Vastgezette mededelingen", "Mededeling van de beheerder", "Mededeling van de maker", "Mededeling schrijven", "Mijn mededeling bewerken", "Schrijf een mededeling voor deelnemers (maximaal 2.000 tekens)."],
 cs: ["Připnutá oznámení", "Oznámení správce", "Oznámení autora", "Napsat oznámení", "Upravit mé oznámení", "Napište oznámení pro účastníky (nejvýše 2 000 znaků)."],
};
const buttonStyle = { border: "1px solid #c4b5fd", borderRadius: 7, padding: "7px 11px", background: "#fff", color: "#5b40bb", font: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer" };

export default function ContentCommentNotices({ kind, targetId }) {
  const { t, i18n } = useTranslation();
  const lang = String(i18n.resolvedLanguage || i18n.language || "en").split("-")[0];
  const labels = LABELS[lang] || LABELS.en;
  const ko = lang === "ko";
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [authVersion, setAuthVersion] = useState(0);
  const revision = useRef(0);
  const actionRevision = useRef(0);
  const key = `${kind}:${targetId}`;
  const view = payload?.key === key ? payload : null;
  const failure = ko ? "공지를 처리하지 못했습니다. 새로고침 후 다시 시도해주세요." : "Could not process the notice. Refresh the page and try again.";

  const reload = useCallback(async () => {
    if (!targetId) return;
    const request = ++revision.current;
    try {
      const { data, error: loadError } = await supabase.rpc("list_content_comment_notices", { p_kind: kind, p_target_id: targetId });
      if (request !== revision.current) return;
      if (loadError) throw loadError;
      setPayload({ key: `${kind}:${targetId}`, can_publish: data?.can_publish === true, items: Array.isArray(data?.items) ? data.items : [] });
      setError("");
    } catch {
      if (request === revision.current) { setPayload(null); setError("load"); }
    }
  }, [kind, targetId]);

  useEffect(() => {
    actionRevision.current++;
    setPayload(null); setError(""); setDraft(""); setEditingId(null); setOpen(false); setBusy(false);
    reload();
    return () => { revision.current++; actionRevision.current++; };
  }, [reload, authVersion]);
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange(() => {
      // Invalidate old permission responses immediately; do not query inside this callback.
      revision.current++; actionRevision.current++; setPayload(null); setAuthVersion(value => value + 1);
    });
    return () => data?.subscription?.unsubscribe();
  }, []);

  async function save(event) {
    event.preventDefault();
    if (!view?.can_publish || busy) return;
    const clean = draft.trim();
    if (!clean || Array.from(clean).length > 2000) {
      setError(ko ? "공지는 1~2,000자로 입력해주세요." : "Notices must contain 1–2,000 characters."); return;
    }
    if (hasBadword(clean, i18n.language)) {
      setError(t("comment.badwordComment", { defaultValue: ko ? "사용할 수 없는 표현이 포함되어 있습니다." : "Please remove prohibited words." })); return;
    }
    setBusy(true); setError("");
    const operation = ++actionRevision.current;
    const request = revision.current;
    try {
      const { error: saveError } = await supabase.rpc("save_content_comment_notice", { p_kind: kind, p_target_id: targetId, p_content: clean, p_notice_id: editingId });
      if (saveError) throw saveError;
      if (request !== revision.current) return;
      setOpen(false); setDraft(""); setEditingId(null); await reload();
    } catch { if (request === revision.current) setError(failure); }
    finally { if (operation === actionRevision.current) setBusy(false); }
  }

  async function remove(notice) {
    if (!notice.can_edit || busy || !window.confirm(t("comment.deleteConfirm", { defaultValue: ko ? "이 공지를 삭제할까요?" : "Delete this notice?" }))) return;
    setBusy(true); setError("");
    const operation = ++actionRevision.current;
    const request = revision.current;
    try {
      const { data, error: deleteError } = await supabase.rpc("delete_content_comment_notice", { p_kind: kind, p_target_id: targetId, p_notice_id: notice.id });
      if (deleteError || data !== true) throw new Error("NOTICE_DELETE_FAILED");
      if (request !== revision.current) return;
      setOpen(false); setEditingId(null); setDraft(""); await reload();
    } catch { if (request === revision.current) setError(failure); }
    finally { if (operation === actionRevision.current) setBusy(false); }
  }
  function edit(notice) { setEditingId(notice?.id || null); setDraft(notice?.content || ""); setOpen(true); setError(""); }

  if (!view?.items.length && !view?.can_publish && !error) return null;
  const mine = view?.items.find(notice => notice.is_own);
  return <section aria-label={labels[0]} className="content-comment-notices" style={{ margin: "0 0 18px", padding: 14, border: "1px solid #d8ccff", borderRadius: 11, background: "#f8f6ff", textAlign: "start" }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
      <strong style={{ color: "#5942b9" }}>📌 {labels[0]}</strong>
      {view?.can_publish && <button type="button" disabled={busy} style={buttonStyle} onClick={() => edit(mine)}>{mine ? labels[4] : labels[3]}</button>}
    </div>
    {view?.items.map(notice => <article key={notice.id} style={{ background: "#fff", padding: 12, borderRadius: 8, marginTop: 8, border: "1px solid #e5ddff" }}>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 7, fontSize: 12, color: "#6650b8" }}>
        <strong>{notice.role === "admin" ? labels[1] : labels[2]}</strong>
        <time dateTime={notice.updated_at}>{new Date(notice.updated_at).toLocaleString(LABELS[lang] ? lang : "en")}</time>
      </div>
      <div style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", lineHeight: 1.6, marginTop: 7 }}>{notice.content}</div>
      {notice.can_edit && <div style={{ display: "flex", gap: 7, marginTop: 8 }}>
        <button type="button" disabled={busy} style={buttonStyle} onClick={() => edit(notice)}>{t("edit", { defaultValue: ko ? "수정" : "Edit" })}</button>
        <button type="button" disabled={busy} style={buttonStyle} onClick={() => remove(notice)}>{t("delete", { defaultValue: ko ? "삭제" : "Delete" })}</button>
      </div>}
    </article>)}
    {open && view?.can_publish && <form onSubmit={save} style={{ marginTop: 12 }}>
      <textarea aria-label={labels[3]} placeholder={labels[5]} value={draft} onChange={event => setDraft(event.target.value)} maxLength={2000} rows={4} disabled={busy} style={{ width: "100%", boxSizing: "border-box", padding: 10, border: "1px solid #c9bae9", borderRadius: 8, font: "inherit", resize: "vertical" }} />
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button type="submit" disabled={busy} style={buttonStyle}>{busy ? "…" : t("save", { defaultValue: ko ? "저장" : "Save" })}</button>
        <button type="button" disabled={busy} style={buttonStyle} onClick={() => { setOpen(false); setDraft(""); setEditingId(null); setError(""); }}>{t("cancel", { defaultValue: ko ? "취소" : "Cancel" })}</button>
      </div>
    </form>}
    {error && <div role="alert" style={{ marginTop: 9, color: "#b42346", fontSize: 13 }}>{error === "load" ? (ko ? "공지를 불러오지 못했습니다." : "Could not load notices.") : error}
      {error === "load" && <button type="button" style={{ ...buttonStyle, marginInlineStart: 8 }} onClick={reload}>{t("retry", { defaultValue: ko ? "다시 시도" : "Retry" })}</button>}
    </div>}
  </section>;
}
