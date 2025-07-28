import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function BoardWrite() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const newPost = {
      title,
      content,
      author_id: 1 // TODO: 로그인 연동 시 유저 ID로 변경
    };

    try {
      const res = await fetch("/api/board", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPost)
      });

      if (!res.ok) throw new Error("등록 실패");
      alert("글이 등록되었습니다!");
      navigate("/board");
    } catch (err) {
      console.error(err);
      setError("등록 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h2>글쓰기</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="제목을 입력하세요"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            width: "100%",
            padding: 10,
            marginBottom: 12,
            fontSize: 16,
            border: "1px solid #ccc",
            borderRadius: 6
          }}
          required
        />
        <textarea
          placeholder="내용을 입력하세요"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{
            width: "100%",
            padding: 10,
            height: 220,
            fontSize: 15,
            border: "1px solid #ccc",
            borderRadius: 6
          }}
          required
        />

        {error && <p style={{ color: "red", marginTop: 8 }}>{error}</p>}

        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: 14,
            padding: "12px 18px",
            background: loading ? "#ccc" : "#1976ed",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontSize: 16,
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "등록 중..." : "등록"}
        </button>
      </form>
    </div>
  );
}

export default BoardWrite;
