import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import Seo from "../seo/Seo";

export default function SuggestionsBoard({ user, isAdmin }) {
  const { t, i18n } = useTranslation();
  const { lang: paramLang } = useParams();
  const lang = (paramLang || i18n.language || "en").split("-")[0];

  const storageKey = `onepickgame:suggestions:${lang}`;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [replyContent, setReplyContent] = useState({}); // 운영자 답글 입력 상태

  // localStorage에서 데이터 불러오기 (언어별)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setSuggestions(parsed);
        else setSuggestions([]);
      } else {
        setSuggestions([]);
      }
    } catch {
      setSuggestions([]);
    }
  }, [storageKey]);

  // localStorage 저장 + 상태 반영
  const saveSuggestions = (data) => {
    localStorage.setItem(storageKey, JSON.stringify(data));
    setSuggestions(data);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!user) {
      alert(t("login_required") || "Login required.");
      return;
    }
    const titleTrim = title.trim();
    const contentTrim = content.trim();
    if (!titleTrim || !contentTrim) {
      alert(t("fill_this_field") || "Please fill out all fields.");
      return;
    }
    if (titleTrim.length > 80) {
      alert(t("title_max_length") || "Title can be up to 80 characters.");
      return;
    }
    if (contentTrim.length > 1000) {
      alert(t("content_max_length") || "Content can be up to 1000 characters.");
      return;
    }

    const newSuggestion = {
      id: crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`,
      title: titleTrim,
      content: contentTrim,
      user: user.email || "Anonymous",
      createdAt: new Date().toISOString(),
      reply: null, // reply는 { content, repliedAt, admin } 구조
    };

    const updated = [newSuggestion, ...(Array.isArray(suggestions) ? suggestions : [])];
    saveSuggestions(updated);

    setTitle("");
    setContent("");

    alert(t("submit_success") || "Your suggestion has been submitted!");
  };

  // 운영자 답글 저장
  const handleReply = (id) => {
    const updated = (suggestions || []).map((s) =>
      s.id === id
        ? {
            ...s,
            reply: {
              content: (replyContent[id] || "").trim(),
              repliedAt: new Date().toISOString(),
              admin: user?.email || "admin",
            },
          }
        : s
    );
    saveSuggestions(updated);
    setReplyContent((prev) => ({ ...prev, [id]: "" }));
    alert(t("reply_added") || "Reply added successfully!");
  };

  // 본인 글만 필터링
  const userSuggestions = user
    ? (suggestions || []).filter((s) => s.user === user.email)
    : [];

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString(lang || "en", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <Seo
        lang={lang}
        slug="suggestions-board"  // ✅ 경로 일관성 수정
        title="Suggestions Board"
        description="Submit suggestions and read admin replies."
      />
      <div style={{ maxWidth: 700, margin: "40px auto", color: "#fff" }}>
        <h2 style={{ fontWeight: 900, marginBottom: 16 }}>
          {t("suggestions_board") || "Suggestions Board"}
        </h2>

        <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
          <label htmlFor="suggest-title" style={{ display: "none" }}>
            {t("enter_title") || "Enter title"}
          </label>
          <input
            id="suggest-title"
            type="text"
            placeholder={t("enter_title") || "Enter title"}
            value={title}
            maxLength={80}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              width: "100%",
              marginBottom: 10,
              padding: 10,
              borderRadius: 8,
              border: "1px solid #335",
              color: "#111",
            }}
          />

          <label htmlFor="suggest-content" style={{ display: "none" }}>
            {t("enter_content") || "Enter content"}
          </label>
          <textarea
            id="suggest-content"
            placeholder={t("enter_content") || "Enter content"}
            value={content}
            maxLength={1000}
            onChange={(e) => setContent(e.target.value)}
            style={{
              width: "100%",
              height: 120,
              marginBottom: 10,
              padding: 10,
              borderRadius: 8,
              border: "1px solid #335",
              color: "#111",
            }}
          />
          <button
            type="submit"
            disabled={!user}
            style={{
              padding: "10px 20px",
              fontSize: 16,
              background: user ? "#007bff" : "#446",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: user ? "pointer" : "not-allowed",
              fontWeight: 800,
            }}
          >
            {t("submit") || "Submit"}
          </button>
        </form>

        {!user && (
          <p style={{ color: "#f77", marginTop: 4 }}>
            * {t("only_logged_in_can_submit") || "Only logged-in users can submit suggestions."}
          </p>
        )}

        {/* 본인 작성 글 */}
        {user && userSuggestions.length > 0 && (
          <div style={{ marginTop: 30 }}>
            <h3 style={{ fontWeight: 800 }}>
              {t("your_suggestions") || "Your Suggestions"}
            </h3>
            <ul style={{ listStyle: "none", padding: 0 }}>
              {userSuggestions.map((s) => (
                <li
                  key={s.id}
                  style={{
                    borderBottom: "1px solid #555",
                    marginBottom: 10,
                    paddingBottom: 10,
                  }}
                >
                  <strong style={{ display: "block", marginBottom: 4 }}>{s.title}</strong>
                  <p style={{ margin: "4px 0 8px" }}>{s.content}</p>
                  <div style={{ fontSize: 12, color: "#aaa" }}>
                    {t("from") || "From"}: {s.user} | {formatDate(s.createdAt)}
                  </div>
                  {s.reply && (
                    <div style={{ marginTop: 10, color: "#7dff9c" }}>
                      <strong>{t("admin_reply") || "Admin Reply"}:</strong> {s.reply.content}
                      <div style={{ fontSize: 12, color: "#9f9" }}>
                        {t("from") || "From"}: {s.reply.admin} | {formatDate(s.reply.repliedAt)}
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 관리자 전체 보기 + 답글 */}
        {isAdmin && (suggestions || []).length > 0 && (
          <div style={{ marginTop: 40 }}>
            <h3 style={{ color: "#ffcc00", fontWeight: 900 }}>
              {t("admin_view") || "All Suggestions (Admin View)"}
            </h3>
            <ul style={{ listStyle: "none", padding: 0 }}>
              {(suggestions || []).map((s) => (
                <li
                  key={s.id}
                  style={{
                    borderBottom: "1px solid #555",
                    marginBottom: 20,
                    paddingBottom: 10,
                  }}
                >
                  <strong style={{ display: "block", marginBottom: 4 }}>{s.title}</strong>
                  <p style={{ margin: "4px 0 8px" }}>{s.content}</p>
                  <div style={{ fontSize: 12, color: "#aaa" }}>
                    {t("from") || "From"}: {s.user} | {formatDate(s.createdAt)}
                  </div>

                  {s.reply && (
                    <div style={{ marginTop: 10, color: "#7dff9c" }}>
                      <strong>{t("admin_reply") || "Admin Reply"}:</strong> {s.reply.content}
                      <div style={{ fontSize: 12, color: "#9f9" }}>
                        {t("from") || "From"}: {s.reply.admin} | {formatDate(s.reply.repliedAt)}
                      </div>
                    </div>
                  )}

                  {isAdmin && (
                    <div style={{ marginTop: 10 }}>
                      <label htmlFor={`reply-${s.id}`} style={{ display: "none" }}>
                        {t("write_reply") || "Write a reply"}
                      </label>
                      <textarea
                        id={`reply-${s.id}`}
                        placeholder={t("write_reply") || "Write a reply"}
                        value={replyContent[s.id] || ""}
                        onChange={(e) =>
                          setReplyContent((prev) => ({
                            ...prev,
                            [s.id]: e.target.value,
                          }))
                        }
                        style={{
                          width: "100%",
                          height: 80,
                          marginBottom: 10,
                          padding: 10,
                          borderRadius: 8,
                          border: "1px solid #335",
                          color: "#111",
                        }}
                      />
                      <button
                        onClick={() => handleReply(s.id)}
                        style={{
                          padding: "6px 12px",
                          background: "#28a745",
                          color: "#fff",
                          border: "none",
                          borderRadius: 8,
                          cursor: "pointer",
                          fontWeight: 800,
                        }}
                      >
                        {t("submit_reply") || "Submit Reply"}
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
}
