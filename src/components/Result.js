import React from "react";
import { useTranslation } from "react-i18next";
import StatsPage from "./StatsPage";
import MediaRenderer from "./MediaRenderer";

function Result({ winner, cup, onRestart, onStats }) {
  const { t } = useTranslation();

  return (
    <div style={{ textAlign: "center", padding: 50 }}>
      <h2 style={{ fontWeight: 700, fontSize: 32, marginBottom: 10 }}>
        🥇 {t("winner")}
      </h2>
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: 14,
          marginBottom: 12,
          background: "#eee",
          border: "3px solid #1976ed",
          overflow: "hidden",
        }}
      >
        <MediaRenderer url={winner.image} />
      </div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 600,
          marginBottom: 26,
          maxWidth: 380,
          margin: "0 auto 26px auto",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "normal",
          lineHeight: 1.24,
          wordBreak: "break-all",
        }}
        title={winner.name}
      >
        {winner.name}
      </div>
      <button
        style={{
          padding: "10px 32px",
          borderRadius: 10,
          background: "#1976ed",
          color: "#fff",
          fontWeight: 700,
          border: "none",
          fontSize: 20,
          marginTop: 8,
        }}
        onClick={onRestart}
      >
        {t("retry")}
      </button>
      <button
        style={{
          padding: "10px 28px",
          borderRadius: 10,
          background: "#ddd",
          color: "#333",
          fontWeight: 700,
          border: "none",
          fontSize: 19,
          marginLeft: 20,
          marginTop: 8,
        }}
        onClick={onStats}
      >
        {t("stats")}
      </button>
      <div style={{ margin: "60px auto 0", maxWidth: 840 }}>
        <StatsPage selectedCup={cup} showOnlyWinner={true} />
      </div>
    </div>
  );
}

export default Result;
