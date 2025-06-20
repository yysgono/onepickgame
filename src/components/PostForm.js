import React, { useState } from "react";
import { savePost } from "../firebase-utils"; // Firestore 저장 함수, 나중에 만들 예정

export default function PostForm() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      alert("제목과 내용을 모두 입력해주세요.");
      return;
    }

    try {
      await savePost({ title, content, createdAt: new Date() });
      alert("게시글이 저장되었습니다!");
      setTitle("");
      setContent("");
    } catch (error) {
      alert("게시글 저장 중 오류가 발생했습니다.");
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: "20px auto" }}>
      <input
        type="text"
        placeholder="제목"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{ width: "100%", padding: 8, marginBottom: 10, fontSize: 16 }}
      />
      <textarea
        placeholder="내용"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={6}
        style={{ width: "100%", padding: 8, marginBottom: 10, fontSize: 16 }}
      />
      <button type="submit" style={{ padding: "10px 20px", fontSize: 16 }}>
        작성하기
      </button>
    </form>
  );
}

