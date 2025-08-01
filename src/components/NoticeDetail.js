import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabaseClient";

// 공지사항 배열: board에서 쓰는 것과 완전히 똑같이!
const notices = [
  {
    id: "notice-1",
    title: "What is One Pick Game?",
    content: `
One Pick Game is a tournament-style platform where you can find your personal “One Pick” among various candidates across different topics—such as food, celebrities, movies, music, and more.

Simply select a tournament that interests you, then choose your favorite from two options in each round. Keep picking until only one candidate—the one you like best—remains.
At the end, you’ll see not only your own “winner,” but also which choices are the most popular among other users.

You can also create your own custom tournaments, share them with friends, and enjoy a fun way to discover everyone’s favorites together!
    `.trim()
  },
  {
    id: "notice-2",
    title: "How to Create Your Own World Cup",
    content: `
Want to make your own World Cup tournament? It's easy!

1. Click the “Create World Cup” button on the main page.
2. Enter a title, a description, and add images (or text) for each candidate.
3. You can upload images directly, or use links. Make sure to add at least 4 candidates for a fun tournament.
4. When you’re done, click “Save.” Your World Cup will appear on the main page and can be played by anyone.
5. Share the link with your friends and see who becomes the top pick!

Tip: You can always edit or delete your tournaments later.  
Have fun making and sharing your own unique One Pick World Cups!
    `.trim()
  }
];

export default function NoticeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNotice() {
      setLoading(true);
      let found = null;

      // 1. 우선 DB에서 찾기
      if (!id.startsWith("notice-")) {
        const { data } = await supabase
          .from("notice")
          .select("*")
          .eq("id", id)
          .single();
        if (data) found = data;
      }
      // 2. DB에 없으면 더미 notices 배열에서 찾기
      if (!found) {
        found = notices.find(n => n.id === id);
      }
      setNotice(found);
      setLoading(false);
    }
    fetchNotice();
  }, [id]);

  if (loading) return (
    <div style={{ maxWidth: 700, margin: "80px auto", color: "#222" }}>
      <h2>Loading...</h2>
    </div>
  );

  if (!notice) return (
    <div style={{ maxWidth: 700, margin: "80px auto", color: "#222" }}>
      <h2>Notice not found</h2>
      <button onClick={() => navigate(-1)}>Back</button>
    </div>
  );

  return (
    <div style={{
      maxWidth: 700, margin: "60px auto",
      background: "#f7fbff", borderRadius: 16, boxShadow: "0 2px 16px #1976ed22",
      color: "#1c2335", padding: 38,
    }}>
      <h2 style={{
        color: "#1976ed", fontWeight: 900, fontSize: 26, marginBottom: 16
      }}>{notice.title}</h2>
      <div style={{ color: "#888", marginBottom: 14, fontSize: 14 }}>
        {notice.created_at
          ? new Date(notice.created_at).toLocaleString()
          : " "}
      </div>
      <div style={{
        fontSize: 18, marginTop: 18, lineHeight: 1.88, whiteSpace: "pre-line"
      }}>
        {notice.content}
      </div>
      {/* ← Back to Notices 버튼 제거 */}
    </div>
  );
}
