import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MediaRenderer from "./MediaRenderer";

// 추천 월드컵 썸네일만 보여줌 (썸네일 외 영상/재생 없음)
function FixedCupSection({ worldcupList }) {
  const navigate = useNavigate();
  const [vw, setVw] = useState(window.innerWidth);

  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isMobile = vw < 700;
  const perRow = isMobile ? 6 : 12;
  const maxCount = 24;
  const cups = worldcupList ? worldcupList.slice(0, maxCount) : [];
  const rows = [];
  for (let i = 0; i < cups.length; i += perRow) {
    rows.push(cups.slice(i, i + perRow));
  }
  const thumbSize = isMobile ? 48 : 75;

  if (!cups.length) return null;

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 1200,
        margin: "0 auto 24px auto",
        padding: "8px 0 10px 0",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          fontWeight: 800,
          fontSize: 18,
          marginBottom: isMobile ? 7 : 13,
          marginLeft: 2,
          color: "#1976ed",
          letterSpacing: "-0.5px",
          alignSelf: "flex-start",
        }}
      >
        ⭐️ 추천 월드컵
      </div>
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: isMobile ? 8 : 15,
          alignItems: "center",
        }}
      >
        {rows.map((row, rowIdx) => (
          <div
            key={rowIdx}
            style={{
              display: "flex",
              gap: isMobile ? 8 : 16,
              width: "100%",
              justifyContent: "center",
              marginBottom: 0,
            }}
          >
            {row.map((cup) => (
              <div
                key={cup.id}
                onClick={() => navigate(`/select-round/${cup.id}`)}
                style={{
                  width: thumbSize,
                  height: thumbSize,
                  background: "#f4f7fd",
                  borderRadius: 14,
                  boxShadow: "0 1px 6px #1976ed13",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  overflow: "hidden",
                  position: "relative",
                  border: "2px solid #e2ecfa",
                  transition: "transform .16s, box-shadow .16s",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "translateY(-4px) scale(1.09)";
                  e.currentTarget.style.boxShadow = "0 8px 18px #1976ed44";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "0 1px 6px #1976ed13";
                }}
                title={cup.title}
              >
                <MediaRenderer
                  url={cup.data?.[0]?.image ?? "/default-thumb.png"}
                  alt={cup.title}
                  playable={false} // 홈/추천: 썸네일만!
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default FixedCupSection;
