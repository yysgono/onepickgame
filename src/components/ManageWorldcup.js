import React, { useState } from "react";
import { deleteWorldcupGame } from "../utils";

// 파일 다운로드 유틸
function downloadJson(filename, jsonObj) {
  const blob = new Blob([JSON.stringify(jsonObj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function ManageWorldcup({ user, isAdmin, worldcupList, setWorldcupList }) {
  // 운영자면 전체, 아니면 내 월드컵만
  const myWorldcups = isAdmin ? worldcupList : worldcupList.filter(w => w.creator === user);
  const [backupText, setBackupText] = useState("");

  function handleBackup() {
    const stats = localStorage.getItem("winnerStats");
    const comments = localStorage.getItem("comments");
    setBackupText(
      JSON.stringify({
        worldcups: worldcupList,
        stats: stats ? JSON.parse(stats) : {},
        comments: comments ? JSON.parse(comments) : {},
      }, null, 2)
    );
  }

  function handleRestore() {
    if (!window.confirm("복구하면 기존 데이터가 모두 덮어써집니다. 진행할까요?")) return;
    try {
      const parsed = JSON.parse(backupText);
      if (parsed.worldcups) {
        localStorage.setItem("onepickgame_worldcupList", JSON.stringify(parsed.worldcups));
        setWorldcupList(parsed.worldcups);
      }
      if (parsed.stats) localStorage.setItem("winnerStats", JSON.stringify(parsed.stats));
      if (parsed.comments) localStorage.setItem("comments", JSON.stringify(parsed.comments));
      alert("복구 완료! 새로고침 해주세요.");
    } catch (e) {
      alert("복구 실패: 올바른 JSON이 아닙니다.");
    }
  }

  function handleDownload() {
    const stats = localStorage.getItem("winnerStats");
    const comments = localStorage.getItem("comments");
    const backupObj = {
      worldcups: worldcupList,
      stats: stats ? JSON.parse(stats) : {},
      comments: comments ? JSON.parse(comments) : {},
    };
    downloadJson("onepickgame_backup.json", backupObj);
  }

  // 복사 기능 (선택)
  function handleCopyBackup() {
    if (!backupText) return;
    navigator.clipboard.writeText(backupText).then(() => alert("클립보드에 복사됨!"));
  }

  // ✅ 삭제 핸들러 (DB + 상태 동시 삭제)
  async function handleDelete(cup) {
    if (!window.confirm("정말 삭제할까요?")) return;
    try {
      await deleteWorldcupGame(cup.id); // DB 삭제
      const newList = worldcupList.filter(w => w.id !== cup.id);
      setWorldcupList(newList);
      // localStorage는 이제 안 써도 됨 (DB 기준이면)
    } catch (e) {
      alert("삭제 실패! 다시 시도해 주세요.");
    }
  }

  return (
    <div style={{
      maxWidth: 700, margin: "50px auto", background: "#fff",
      borderRadius: 12, padding: 28, boxShadow: "0 2px 12px #0001"
    }}>
      <h2 style={{ fontWeight: 800, fontSize: 28, marginBottom: 22 }}>
        {isAdmin ? "전체 월드컵 관리 (관리자)" : "내가 만든 월드컵 관리"}
      </h2>

      {/* 데이터 백업/복구 UI */}
      <div style={{ marginBottom: 38 }}>
        <h3 style={{ marginBottom: 10 }}>데이터 백업 · 복구</h3>
        <button
          onClick={handleBackup}
          style={{
            background: "#1976ed", color: "#fff", padding: "8px 20px", borderRadius: 8,
            border: "none", marginRight: 8, fontWeight: 700
          }}
        >백업 불러오기</button>
        <button
          onClick={handleDownload}
          style={{
            background: "#2a313f", color: "#fff", padding: "8px 20px", borderRadius: 8,
            border: "none", marginRight: 8, fontWeight: 700
          }}
        >JSON 다운로드</button>
        <button
          onClick={handleRestore}
          style={{
            background: "#d33", color: "#fff", padding: "8px 20px", borderRadius: 8,
            border: "none", fontWeight: 700
          }}
        >복구</button>
        <button
          onClick={handleCopyBackup}
          style={{
            background: "#d1d5db", color: "#222", padding: "8px 18px", borderRadius: 8,
            border: "none", fontWeight: 700, marginLeft: 8
          }}
        >복사</button>
        <textarea
          value={backupText}
          onChange={e => setBackupText(e.target.value)}
          placeholder="여기에 백업 데이터를 붙여넣기 하세요"
          rows={8}
          style={{
            width: "100%", marginTop: 16, fontSize: 15, borderRadius: 7,
            border: "1px solid #ccc", padding: 12, background: "#fafaff"
          }}
        />
      </div>

      {/* 내가 만든/전체 월드컵 관리 */}
      <div>
        <h3 style={{ margin: "18px 0 6px", fontWeight: 700 }}>
          {isAdmin ? "전체 월드컵 목록" : "내가 만든 월드컵"}
        </h3>
        {myWorldcups.length === 0 ? (
          <div style={{ color: "#bbb", margin: "28px 0 14px" }}>
            {isAdmin ? "등록된 월드컵이 없습니다." : "아직 생성한 월드컵이 없습니다."}
          </div>
        ) : (
          <ul style={{ padding: 0, listStyle: "none" }}>
            {myWorldcups.map(cup => (
              <li key={cup.id} style={{
                padding: "13px 0", borderBottom: "1px solid #eee",
                display: "flex", alignItems: "center", gap: 13
              }}>
                <b style={{ fontSize: 17 }}>{cup.title}</b>
                <span style={{ color: "#888", fontSize: 14 }}>{cup.desc}</span>
                <button
                  onClick={() => handleDelete(cup)}
                  style={{
                    background: "#d33", color: "#fff", border: "none",
                    borderRadius: 8, fontWeight: 700, fontSize: 14, padding: "6px 14px"
                  }}
                >삭제</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default ManageWorldcup;
