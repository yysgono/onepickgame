import React, { useEffect, useState } from "react";

function BoardPage() {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetch(`/api/board?page=${page}&limit=20`)
      .then((res) => res.json())
      .then((data) => setPosts(data))
      .catch((err) => console.error(err));
  }, [page]);

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 20 }}>
      <h2>게시판</h2>
      <button
        style={{
          marginBottom: 12,
          padding: "8px 14px",
          background: "#1976ed",
          color: "#fff",
          borderRadius: 6,
          border: "none",
          cursor: "pointer",
        }}
        onClick={() => (window.location.href = "/board/write")}
      >
        글쓰기
      </button>
      <ul>
        {posts.map((post) => (
          <li key={post.id} style={{ marginBottom: 8 }}>
            <a href={`/board/view/${post.id}`}>{post.title}</a> &nbsp;
            <span style={{ fontSize: 12, color: "#666" }}>
              {new Date(post.created_at).toLocaleDateString()}
            </span>
          </li>
        ))}
      </ul>
      <div style={{ marginTop: 20 }}>
        <button disabled={page === 1} onClick={() => setPage(page - 1)}>
          이전
        </button>
        <span style={{ margin: "0 10px" }}>{page}</span>
        <button onClick={() => setPage(page + 1)}>다음</button>
      </div>
    </div>
  );
}

export default BoardPage;
