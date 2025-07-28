import React, { useEffect, useState } from "react";

function BoardPreview() {
  const [notice, setNotice] = useState(null);
  const [latestPosts, setLatestPosts] = useState([]);

  useEffect(() => {
    // 공지 1개 가져오기
    fetch("/api/board?type=notice&limit=1")
      .then((res) => res.json())
      .then((data) => setNotice(data[0] || null))
      .catch((err) => console.error(err));

    // 최신글 5개 가져오기
    fetch("/api/board?type=normal&limit=5")
      .then((res) => res.json())
      .then((data) => setLatestPosts(data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 400,
        background: "rgba(17,27,55,0.93)",
        borderRadius: 15,
        padding: "23px 23px 18px 25px",
        color: "#fff",
        boxShadow: "0 4px 18px #1976ed22",
        minHeight: 200,
      }}
    >
      <div
        style={{
          fontWeight: 800,
          fontSize: 20,
          color: "#bcdfff",
          letterSpacing: ".02em",
          marginBottom: 12,
        }}
      >
        Notice & Latest Posts
      </div>
      {/* 공지사항 */}
      {notice && (
        <div style={{ marginBottom: 14 }}>
          <span style={{ fontWeight: "bold", color: "#65b6ff", fontSize: 15 }}>
            [Notice] {notice.title}
          </span>
        </div>
      )}
      {/* 최신글 최대 5개 */}
      <ul style={{ listStyle: "none", padding: 0, margin: 0, marginBottom: 14 }}>
        {latestPosts.slice(0, 5).map((post, idx) => (
          <li
            key={post.id}
            style={{
              marginBottom: 5,
              fontWeight: 400, // 볼드 X
              color: "#fff",
              fontSize: 15,
              display: "flex",
              alignItems: "center",
              gap: 7,
            }}
          >
            {/* 이모지 자동 붙이기 예시 */}
            <span>
              {idx === 0 && "🔥"}
              {idx === 1 && "📢"}
              {idx === 2 && "🎉"}
              {idx > 2 && "📝"}
            </span>
            <a
              href={`/board/view/${post.id}`}
              style={{
                color: "#fff",
                textDecoration: "none",
                fontWeight: 400,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "inline-block",
                maxWidth: 240,
              }}
              title={post.title}
            >
              {post.title}
            </a>
          </li>
        ))}
      </ul>
      <div style={{ textAlign: "right" }}>
        <button
          style={{
            padding: "9px 23px",
            background: "#1976ed",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: 700,
            fontSize: 15,
            marginTop: 7,
            boxShadow: "0 2px 12px #1976ed33",
          }}
          onClick={() => (window.location.href = "/board")}
        >
          More →
        </button>
      </div>
    </div>
  );
}

export default BoardPreview;
