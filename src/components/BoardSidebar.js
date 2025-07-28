import React, { useEffect, useState } from "react";

function BoardSidebar() {
  const [notice, setNotice] = useState(null);
  const [latestPosts, setLatestPosts] = useState([]);

  useEffect(() => {
    fetch("/api/board/latest")
      .then((res) => res.json())
      .then((data) => {
        setNotice(data.notice);
        setLatestPosts(data.latestPosts);
      })
      .catch((err) => console.error(err));
  }, []);

  return (
    <div style={{ background: "#fff", padding: 16, borderRadius: 12 }}>
      <h3>공지사항</h3>
      {notice ? (
        <a href={`/board/view/${notice.id}`} style={{ color: "red", fontWeight: 700 }}>
          {notice.title}
        </a>
      ) : (
        <p>공지사항 없음</p>
      )}

      <h4 style={{ marginTop: 12 }}>최신 글</h4>
      <ul>
        {latestPosts.map((post) => (
          <li key={post.id}>
            <a href={`/board/view/${post.id}`}>{post.title}</a>
          </li>
        ))}
      </ul>
      <button
        style={{
          display: "block",
          marginTop: 12,
          padding: "8px 14px",
          background: "#1976ed",
          color: "#fff",
          borderRadius: 6,
          border: "none",
          cursor: "pointer",
        }}
        onClick={() => (window.location.href = "/board")}
      >
        더보기
      </button>
    </div>
  );
}

export default BoardSidebar;
