import React, { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";

function RecentComments() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  // 댓글 길이 자르기용 함수
  function truncate(str, n = 40) {
    if (!str) return "";
    return str.length > n ? str.slice(0, n) + "..." : str;
  }

  useEffect(() => {
    async function fetchComments() {
      setLoading(true);
      const { data, error } = await supabase
        .from("comments")
        .select(`
          id,
          cup_id,
          nickname,
          content,
          created_at,
          worldcups (
            title
          )
        `)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) {
        setComments([]);
      } else {
        setComments(data);
      }
      setLoading(false);
    }
    fetchComments();
  }, []);

  if (loading) {
    return <div style={{ color: "#596579", padding: 14 }}>Loading...</div>;
  }

  return (
    <div
      style={{
        borderRadius: 22,
        background: "#f5f6fa",
        boxShadow: "0 4px 16px rgba(25,32,52,0.07)",
        padding: "20px 20px",
        minHeight: 160,
      }}
    >
      <div style={{
        fontWeight: 900, fontSize: 23, color: "#5542b8", marginBottom: 10
      }}>
        Recent Comments
      </div>
      {comments.length === 0 && (
        <div style={{ color: "#596579" }}>No comments found.</div>
      )}
      <div>
        {comments.map((cmt) => (
          <div
            key={cmt.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "#ffffff",
              borderRadius: 7,
              padding: "6px 10px",
              marginBottom: 4,
              overflow: "hidden",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
              fontSize: 17.5,
              fontWeight: 800,
              cursor: "pointer"
            }}
            title={`${cmt.content} / ${cmt.nickname} / ${cmt.worldcups?.title || "(No title)"} / ${cmt.created_at?.slice(0,16)}`}
            onClick={() =>
              window.location.href = `/en/stats/${cmt.cup_id}`
            }
          >
            <span
              style={{
                color: "#202534",
                fontWeight: 900,
                marginRight: 5,
                maxWidth: 220,
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "inline-block"
              }}
            >
              {truncate(cmt.content, 24)}
            </span>
            <span style={{ color: "#202534", fontWeight: 700, marginLeft: 3 }}>
              {truncate(cmt.nickname, 10)}
            </span>
            <span style={{ color: "#5542b8", fontWeight: 500, marginLeft: 6, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", display: "inline-block" }}>
              {truncate(cmt.worldcups?.title || "(No title)", 17)}
            </span>
            <span style={{ color: "#5542b8", fontWeight: 400, marginLeft: 10 }}>
              {cmt.created_at?.replace("T", " ").slice(0, 16)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RecentComments;
