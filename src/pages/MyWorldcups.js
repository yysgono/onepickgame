import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// 실제 월드컵 리스트는 props, context, 혹은 fetch로 가져와야 함!
function getAllWorldcups() {
  // 예시: localStorage에 worldcupList 저장되어 있다고 가정
  return JSON.parse(localStorage.getItem("onepickgame_worldcupList") || "[]");
}
function getUserId() {
  const user = JSON.parse(localStorage.getItem("supabase.auth.token"))?.currentSession?.user;
  return user?.id;
}

export default function MyWorldcups() {
  const [myList, setMyList] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const userId = getUserId();
    const all = getAllWorldcups();
    if (!userId) {
      setMyList([]);
      return;
    }
    setMyList(all.filter(wc => wc.owner === userId || wc.creator === userId || wc.creator_id === userId));
  }, []);

  return (
    <div style={{ maxWidth: 950, margin: "40px auto", background: "#fff", borderRadius: 18, padding: 32, minHeight: 400 }}>
      <h2 style={{ fontWeight: 900, fontSize: 27, marginBottom: 24, letterSpacing: -1, color: "#1976ed" }}>내가 만든 월드컵</h2>
      {myList.length === 0 ? (
        <div style={{ textAlign: "center", color: "#888", marginTop: 70, fontSize: 19 }}>아직 만든 월드컵이 없습니다.</div>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 22, marginTop: 12 }}>
          {myList.map(wc => (
            <div key={wc.id}
              style={{
                width: 180, minHeight: 188, background: "#f6f8fa", borderRadius: 13, boxShadow: "0 2px 10px #0001",
                display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer",
                transition: "box-shadow .13s", border: "1.2px solid #e6eefb"
              }}
              onClick={() => navigate(`/worldcup/${wc.id}`)}
            >
              <img
                src={wc.data?.[0]?.image || "/default-thumb.png"}
                alt={wc.title}
                style={{ width: 128, height: 128, objectFit: "cover", borderRadius: 8, margin: "13px 0 7px 0", background: "#eceff4" }}
              />
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, textAlign: "center", color: "#1976ed" }}>{wc.title}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
