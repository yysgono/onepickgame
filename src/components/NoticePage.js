import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabaseClient";

export default function NoticePage() {
  const { lang = "en" } = useParams();
  const navigate = useNavigate();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNotices() {
      setLoading(true);
      const { data, error } = await supabase
        .from("notice")
        .select("*")
        .order("created_at", { ascending: false });
      setNotices(data || []);
      setLoading(false);
    }
    fetchNotices();
  }, []);

  return (
    <div style={{
      maxWidth: 800, margin: "60px auto", padding: 28,
      background: "#fff", borderRadius: 14, boxShadow: "0 2px 14px #2222",
      minHeight: 420, color: "#1c2335"
    }}>
      <h2 style={{ color: "#1976ed", fontWeight: 900, marginBottom: 18 }}>
        📢 Notice
      </h2>
      {loading && <div style={{ color: "#888" }}>Loading...</div>}
      {!loading && notices.length === 0 && (
        <div style={{ color: "#888" }}>No notices yet.</div>
      )}
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {notices.map(n => (
          <li key={n.id} style={{
            padding: "15px 0 13px 0", borderBottom: "1px solid #dde5f7"
          }}>
            <b style={{ fontSize: 19, color: "#23366b" }}>{n.title}</b>
            <span style={{ color: "#aaa", fontSize: 13, marginLeft: 10 }}>
              {new Date(n.created_at).toLocaleDateString()}
            </span>
            <br />
            <Link
              to={`/${lang}/notice/${n.id}`}
              style={{
                color: "#1676ed", fontSize: 15, textDecoration: "underline",
                cursor: "pointer"
              }}
            >View Detail</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
