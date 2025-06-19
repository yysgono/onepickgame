import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { mainButtonStyle, grayButtonStyle } from "../styles/common"; // 공통 버튼 스타일 import

function WorldcupDetail({ worldcupList }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const cup = worldcupList.find(c => String(c.id) === id);
  if (!cup) return <div style={{ padding: 40 }}>월드컵을 찾을 수 없습니다.</div>;

  const shareUrl = `${window.location.origin}/worldcup/${cup.id}`;
  const isMobile = typeof window !== "undefined" && window.innerWidth < 700;

  function handleCopy() {
    navigator.clipboard.writeText(shareUrl);
    alert("공유 링크가 복사되었습니다!");
  }

  return (
    <div
      style={{
        maxWidth: 600,
        margin: isMobile ? "18px auto" : "40px auto",
        background: "#fff",
        borderRadius: 16,
        boxShadow: "0 2px 24px #0001",
        padding: isMobile ? 18 : 32
      }}
    >
      <h2 style={{ marginBottom: 10, fontWeight: 800, fontSize: isMobile ? 22 : 30 }}>{cup.title}</h2>
      <div style={{ color: "#555", marginBottom: 20, fontSize: isMobile ? 15 : 18 }}>{cup.desc}</div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: isMobile ? 8 : 18,
          marginBottom: 24,
          justifyContent: "flex-start"
        }}
      >
        {cup.data.map(item => (
          <div key={item.id} style={{ width: isMobile ? 74 : 120, textAlign: "center" }}>
            <img
              src={item.image}
              alt={item.name}
              style={{
                width: isMobile ? 74 : 120,
                height: isMobile ? 56 : 90,
                objectFit: "cover",
                borderRadius: 10,
                marginBottom: 6
              }}
            />
            <div style={{ fontSize: isMobile ? 12 : 16 }}>{item.name}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 9, marginBottom: 16 }}>
        <button
          onClick={() => navigate("/")}
          style={{
            ...grayButtonStyle(isMobile),
            padding: isMobile ? "7px 0" : "8px 22px",
            fontWeight: 700,
            minWidth: 80
          }}
        >
          홈으로
        </button>
        <button
          onClick={handleCopy}
          style={{
            ...mainButtonStyle(isMobile),
            padding: isMobile ? "7px 0" : "8px 22px",
            fontWeight: 700,
            minWidth: 110
          }}
        >
          공유링크 복사
        </button>
      </div>
      <div style={{ marginTop: 20, color: "#888", fontSize: isMobile ? 11 : 13 }}>
        <b>공유링크: </b>
        <input
          value={shareUrl}
          readOnly
          style={{
            width: isMobile ? 180 : 320,
            border: "1px solid #eee",
            borderRadius: 5,
            padding: "4px 8px",
            fontSize: isMobile ? 11 : 14
          }}
        />
      </div>
    </div>
  );
}

export default WorldcupDetail;
