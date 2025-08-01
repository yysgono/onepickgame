import React, { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";
import { Link } from "react-router-dom";

export default function NoticeList() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNotices() {
      setLoading(true);
      const { data, error } = await supabase
        .from("notices")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error) setNotices(data);
      setLoading(false);
    }
    fetchNotices();
  }, []);

  return (
    <div style={{ maxWidth: 750, margin: "70px auto", color: "#222", background: "#fff", borderRadius: 13, padding: 30 }}>
      <h2 style={{ fontWeight: 900, fontSize: 27, marginBottom: 17, color: "#1676ed" }}>공지사항</h2>
      <Link to="/notice-write" style={{ marginBottom: 15, display: "inline-block", fontWeight: 700, color: "#fff", background: "#1676ed", padding: "6px 16px", borderRadius: 8, textDecoration: "none" }}>
        + 새 공지 쓰기
      </Link>
      {loading ? (
        <div>로딩중...</div>
      ) : notices.length === 0 ? (
        <div style={{ color: "#888" }}>등록된 공지 없음</div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {notices.map(n => (
            <li key={n.id} style={{ padding: "13px 0", borderBottom: "1px solid #ddd" }}>
              <b style={{ fontSize: 18, color: "#195" }}>{n.title}</b>
              <span style={{ color: "#aaa", fontSize: 13, marginLeft: 12 }}>{(n.created_at || "").slice(0, 10)}</span>
              <br />
              <Link to={`/notice/${n.id}`} style={{ color: "#1676ed", fontSize: 15, textDecoration: "underline" }}>상세보기</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
