import React, { useState } from "react";
import { supabase } from "../utils/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function NoticeWrite() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title || !content) return alert("제목과 내용을 모두 입력하세요!");
    setLoading(true);
    const { error } = await supabase
      .from("notices")
      .insert({ title, content });
    setLoading(false);
    if (error) return alert("등록 실패: " + error.message);
    alert("공지 등록 완료!");
    navigate("/notice");
  }

  return (
    <div style={{ maxWidth: 600, margin: "70px auto", background: "#fff", padding: 30, borderRadius: 12 }}>
      <h2 style={{ fontWeight: 800, fontSize: 24, marginBottom: 16 }}>공지 작성</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 13 }}>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="제목"
            style={{ width: "100%", fontSize: 17, padding: 10, borderRadius: 8, border: "1px solid #bbb" }}
          />
        </div>
        <div style={{ marginBottom: 17 }}>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="내용"
            rows={8}
            style={{ width: "100%", fontSize: 16, padding: 12, borderRadius: 8, border: "1px solid #bbb" }}
          />
        </div>
        <button type="submit" disabled={loading} style={{ background: "#1676ed", color: "#fff", border: "none", padding: "9px 24px", borderRadius: 7, fontWeight: 700, fontSize: 17 }}>
          {loading ? "등록중..." : "등록"}
        </button>
      </form>
    </div>
  );
}
