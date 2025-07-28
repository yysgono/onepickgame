// src/components/BoardView.js
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

function BoardView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/board/${id}`);
        if (!res.ok) throw new Error("게시글을 불러올 수 없습니다.");
        const data = await res.json();
        setPost(data);
      } catch (err) {
        console.error(err);
        setError("데이터 로드 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  if (loading) return <p style={{ textAlign: "center" }}>로딩 중...</p>;
  if (error) return <p style={{ color: "red", textAlign: "center" }}>{error}</p>;
  if (!post) return <p style={{ textAlign: "center" }}>게시글이 없습니다.</p>;

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 20 }}>
      {/* 제목 */}
      <h2 style={{ fontSize: 24, marginBottom: 10 }}>{post.title}</h2>
      <div style={{ color: "#666", fontSize: 14, marginBottom: 20 }}>
        작성일: {new Date(post.created_at).toLocaleString()}
      </div>

      {/* 내용 */}
      <div
        style={{
          padding: 15,
          background: "#f9f9f9",
          border: "1px solid #ddd",
          borderRadius: 6,
          fontSize: 16,
          lineHeight: 1.5,
          whiteSpace: "pre-wrap",
        }}
      >
        {post.content}
      </div>

      {/* 버튼 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 20,
        }}
      >
        <button
          onClick={() => navigate("/board")}
          style={{
            padding: "8px 14px",
            background: "#1976ed",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          목록
        </button>
      </div>
    </div>
  );
}

export default BoardView;
