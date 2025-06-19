import React, { useState } from "react";

// 색상 정의
const COLORS = {
  main: "#1976ed",
  danger: "#d33",
  gray: "#444",
  light: "#fafaff",
  border: "#e3f0fb",
  sub: "#45b7fa",
};

function DataBackup() {
  const [backupText, setBackupText] = useState("");

  // 백업
  function handleBackup() {
    const worldcups = localStorage.getItem("onepickgame_worldcupList");
    const stats = localStorage.getItem("winnerStats");
    const comments = localStorage.getItem("comments");
    setBackupText(
      JSON.stringify(
        {
          worldcups: worldcups ? JSON.parse(worldcups) : [],
          stats: stats ? JSON.parse(stats) : {},
          comments: comments ? JSON.parse(comments) : {},
        },
        null,
        2
      )
    );
  }

  // 복구
  function handleRestore() {
    if (!backupText) return;
    try {
      const parsed = JSON.parse(backupText);
      if (parsed.worldcups)
        localStorage.setItem(
          "onepickgame_worldcupList",
          JSON.stringify(parsed.worldcups)
        );
      if (parsed.stats)
        localStorage.setItem("winnerStats", JSON.stringify(parsed.stats));
      if (parsed.comments)
        localStorage.setItem("comments", JSON.stringify(parsed.comments));
      alert("복구 완료! 새로고침 해주세요.");
    } catch (e) {
      alert("복구 실패: 잘못된 데이터입니다.");
    }
  }

  return (
    <div
      style={{
        maxWidth: 520,
        margin: "52px auto 0 auto",
        background: "#fff",
        borderRadius: 20,
        padding: "34px 22px 30px 22px",
        boxShadow: "0 2px 18px #1976ed12, 0 1px 6px #45b7fa14",
        border: `1.7px solid ${COLORS.border}`,
      }}
    >
      <h2
        style={{
          fontWeight: 800,
          color: COLORS.main,
          fontSize: 26,
          marginBottom: 14,
          textAlign: "center",
          letterSpacing: -1,
        }}
      >
        데이터 백업 · 복구
      </h2>
      <div
        style={{
          color: "#666",
          fontSize: 15.2,
          textAlign: "center",
          marginBottom: 24,
        }}
      >
        월드컵, 통계, 댓글 데이터 전체를 <b>로컬에 백업/복구</b>합니다.<br />
        <span style={{ color: COLORS.danger }}>
          복구시 기존 데이터가 모두 덮어쓰여집니다!
        </span>
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 12 }}>
        <button
          onClick={handleBackup}
          style={{
            padding: "9px 22px",
            borderRadius: 999,
            border: "none",
            background: `linear-gradient(90deg, ${COLORS.main} 70%, ${COLORS.sub} 100%)`,
            color: "#fff",
            fontWeight: 800,
            fontSize: 16,
            boxShadow: "0 1.5px 6px #1976ed18",
            cursor: "pointer",
            letterSpacing: -0.5,
            transition: "background 0.15s",
          }}
        >
          백업하기
        </button>
        <button
          onClick={handleRestore}
          style={{
            padding: "9px 22px",
            borderRadius: 999,
            border: "none",
            background: COLORS.danger,
            color: "#fff",
            fontWeight: 800,
            fontSize: 16,
            boxShadow: "0 1.5px 6px #d334",
            cursor: "pointer",
            letterSpacing: -0.5,
            transition: "background 0.15s",
          }}
        >
          복구하기
        </button>
      </div>
      <textarea
        value={backupText}
        onChange={(e) => setBackupText(e.target.value)}
        placeholder="여기에 백업 데이터를 붙여넣기 하세요"
        rows={12}
        style={{
          width: "100%",
          marginTop: 14,
          fontSize: 15.4,
          borderRadius: 10,
          border: `1.2px solid ${COLORS.border}`,
          padding: "14px 11px",
          background: COLORS.light,
          fontFamily: "monospace",
          resize: "vertical",
          minHeight: 180,
          boxSizing: "border-box",
          color: "#222",
        }}
      />
      <div style={{ color: "#aaa", fontSize: 13, marginTop: 12 }}>
        <b>Tip:</b> <span style={{ color: COLORS.main }}>백업 후</span> 텍스트를 복사해서 안전한 곳에 저장하세요.<br />
        <b>복구는</b> 백업 내용을 붙여넣고 <b>복구하기</b>를 누르세요.
      </div>
    </div>
  );
}

export default DataBackup;
