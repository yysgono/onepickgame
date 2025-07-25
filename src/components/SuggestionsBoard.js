import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

export default function SuggestionsBoard({ user, isAdmin }) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [replyContent, setReplyContent] = useState({}); // ✅ 운영자 답글 입력 상태

  // ✅ localStorage에서 데이터 불러오기
  useEffect(() => {
    const stored = localStorage.getItem("suggestions");
    if (stored) {
      setSuggestions(JSON.parse(stored));
    }
  }, []);

  // ✅ localStorage에 저장
  const saveSuggestions = (data) => {
    localStorage.setItem("suggestions", JSON.stringify(data));
    setSuggestions(data);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!user) {
      alert(t("login_required") || "Login required.");
      return;
    }

    if (!title.trim() || !content.trim()) {
      alert(t("fill_this_field") || "Please fill out all fields.");
      return;
    }

    if (title.length > 80) {
      alert(t("title_max_length") || "Title can be up to 80 characters.");
      return;
    }

    if (content.length > 1000) {
      alert(t("content_max_length") || "Content can be up to 1000 characters.");
      return;
    }

    const newSuggestion = {
      id: Date.now(),
      title,
      content,
      user: user.email || "Anonymous",
      createdAt: new Date().toISOString(),
      reply: null, // ✅ 운영자 답글 초기값
    };

    const updated = [newSuggestion, ...suggestions];
    saveSuggestions(updated);

    setTitle("");
    setContent("");

    alert(t("submit_success") || "Your suggestion has been submitted!");
  };

  // ✅ 운영자 답글 저장
  const handleReply = (id) => {
    const updated = suggestions.map((s) =>
      s.id === id ? { ...s, reply: replyContent[id] || "" } : s
    );
    saveSuggestions(updated);
    setReplyContent((prev) => ({ ...prev, [id]: "" })); // 입력 초기화
    alert(t("reply_added") || "Reply added successfully!");
  };

  // ✅ 본인 글만 필터링
  const userSuggestions = user
    ? suggestions.filter((s) => s.user === user.email)
    : [];

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString(); // ✅ 로컬 시간으로 포맷
  };

  return (
    <div style={{ maxWidth: 700, margin: "40px auto", color: "#fff" }}>
      <h2>{t("suggestions_board") || "Suggestions Board"}</h2>

      <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder={t("enter_title") || "Enter title"}
          value={title}
          maxLength={80}
          onChange={(e) => setTitle(e.target.value)}
          style={{ width: "100%", marginBottom: 10, padding: 10 }}
        />
        <textarea
          placeholder={t("enter_content") || "Enter content"}
          value={content}
          maxLength={1000}
          onChange={(e) => setContent(e.target.value)}
          style={{ width: "100%", height: 120, marginBottom: 10, padding: 10 }}
        />
        <button
          type="submit"
          disabled={!user}
          style={{
            padding: "10px 20px",
            fontSize: 16,
            background: "#007bff",
            color: "#fff",
            border: "none",
            cursor: user ? "pointer" : "not-allowed",
          }}
        >
          {t("submit") || "Submit"}
        </button>
      </form>

      {!user && (
        <p style={{ color: "#f77" }}>
          * {t("only_logged_in_can_submit") || "Only logged-in users can submit suggestions."}
        </p>
      )}

      {/* ✅ 본인 작성 글 표시 */}
      {user && userSuggestions.length > 0 && (
        <div style={{ marginTop: 30 }}>
          <h3>{t("your_suggestions") || "Your Suggestions"}</h3>
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
                <strong>{s.title}</strong>
                <p>{s.content}</p>
                <div style={{ fontSize: 12, color: "#aaa" }}>
                  {t("from") || "From"}: {s.user} | {formatDate(s.createdAt)}
                </div>
                {s.reply && (
                  <div style={{ marginTop: 10, color: "#0f0" }}>
                    <strong>{t("admin_reply") || "Admin Reply"}:</strong> {s.reply}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ✅ 관리자(admin) 전체 글 보기 */}
      {isAdmin && suggestions.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <h3 style={{ color: "#ffcc00" }}>{t("admin_view") || "All Suggestions (Admin View)"}</h3>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {suggestions.map((s) => (
              <li
                key={s.id}
                style={{
                  borderBottom: "1px solid #555",
                  marginBottom: 20,
                  paddingBottom: 10,
                }}
              >
                <strong>{s.title}</strong>
                <p>{s.content}</p>
                <div style={{ fontSize: 12, color: "#aaa" }}>
                  {t("from") || "From"}: {s.user} | {formatDate(s.createdAt)}
                </div>

                {/* ✅ 기존 답글 보여주기 */}
                {s.reply && (
                  <div style={{ marginTop: 10, color: "#0f0" }}>
                    <strong>{t("admin_reply") || "Admin Reply"}:</strong> {s.reply}
                  </div>
                )}

                {/* ✅ 답글 작성 폼 (운영자 전용) */}
                {isAdmin && (
                  <div style={{ marginTop: 10 }}>
                    <textarea
                      placeholder={t("write_reply") || "Write a reply"}
                      value={replyContent[s.id] || ""}
                      onChange={(e) =>
                        setReplyContent((prev) => ({
                          ...prev,
                          [s.id]: e.target.value,
                        }))
                      }
                      style={{ width: "100%", height: 80, marginBottom: 10, padding: 10 }}
                    />
                    <button
                      onClick={() => handleReply(s.id)}
                      style={{
                        padding: "6px 12px",
                        background: "#28a745",
                        color: "#fff",
                        border: "none",
                        cursor: "pointer",
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
  );
}
