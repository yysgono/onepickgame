// src/pages/TopWinRateWinner.jsx
import React, { useEffect, useState } from "react";
import { getTopWinRateOfCup } from "@/utils/winnerStatsRankApi";

function TopWinRateWinner({ cupId }) {
  const [top, setTop] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTop() {
      setLoading(true);
      try {
        const res = await getTopWinRateOfCup(cupId, 1); // TOP 1명만 가져오기
        setTop(res[0] || null);
      } catch {
        setTop(null);
      }
      setLoading(false);
    }
    fetchTop();
  }, [cupId]);

  if (loading) return <div>로딩중...</div>;
  if (!top) return <div>아직 승률 기록 없음</div>;

  return (
    <div
      style={{
        margin: "24px auto",
        padding: 18,
        maxWidth: 400,
        borderRadius: 20,
        background: "#fff9dd",
        boxShadow: "0 4px 16px #eed47344",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 21, fontWeight: 800, color: "#c7a200", marginBottom: 10 }}>
        👑 승률 1위
      </div>
      <img
        src={top.image}
        alt={top.name}
        width={90}
        height={90}
        style={{ borderRadius: "50%", boxShadow: "0 2px 8px #ffd70033", marginBottom: 12 }}
      />
      <div style={{ fontSize: 23, fontWeight: 700, marginBottom: 6 }}>{top.name}</div>
      <div style={{ color: "#c7a200", fontWeight: 700, fontSize: 19 }}>
        승률: {top.win_rate}%
      </div>
      <div style={{ fontSize: 14, color: "#666", marginTop: 8 }}>
        {top.match_wins}승 / {top.match_count}전
      </div>
    </div>
  );
}

export default TopWinRateWinner;
