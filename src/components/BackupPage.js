import React, { useState, useRef } from "react";

function BackupPage() {
  const [backupData, setBackupData] = useState("");
  const [restoreData, setRestoreData] = useState("");
  const fileInputRef = useRef();

  // 백업 - 파일로 다운로드
  function handleBackup() {
    const obj = {
      worldcupList: localStorage.getItem("onepickgame_worldcupList"),
      winnerStats: localStorage.getItem("winnerStats"),
      comments: localStorage.getItem("comments")
    };
    const jsonStr = JSON.stringify(obj, null, 2);
    setBackupData(jsonStr);

    // 파일 다운로드 트리거
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "onepickgame_backup.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // 복구 - 파일 읽기
  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setRestoreData(evt.target.result);
    };
    reader.readAsText(file);
  }

  // 복구 - 실제 복구
  function handleRestore() {
    if (!window.confirm("복구하면 기존 데이터가 모두 덮어써집니다. 진행할까요?")) return;
    try {
      const obj = JSON.parse(restoreData);
      if (obj.worldcupList) localStorage.setItem("onepickgame_worldcupList", obj.worldcupList);
      if (obj.winnerStats) localStorage.setItem("winnerStats", obj.winnerStats);
      if (obj.comments) localStorage.setItem("comments", obj.comments);
      alert("복구 완료! 새로고침하세요.");
    } catch (e) {
      alert("복구 실패: 올바른 데이터가 아닙니다.");
    }
  }

  // 반응형 체크
  const isMobile = window.innerWidth < 700;

  return (
    <div
      style={{
        maxWidth: 480,
        margin: isMobile ? "26px auto" : "64px auto",
        background: "#fff",
        borderRadius: 18,
        padding: isMobile ? 18 : 38,
        boxShadow: "0 3px 24px #1976ed16",
        fontFamily: "'Noto Sans','Malgun Gothic',sans-serif"
      }}
    >
      <h2 style={{
        fontWeight: 900,
        fontSize: isMobile ? 21 : 27,
        marginBottom: 24,
        color: "#1976ed",
        textAlign: "center",
        letterSpacing: -0.5
      }}>
        데이터 백업 / 복구
      </h2>
      {/* 백업 */}
      <div style={{
        marginBottom: 30,
        background: "#fafdff",
        borderRadius: 13,
        padding: "16px 18px",
        boxShadow: "0 1px 8px #1976ed10"
      }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
          <button
            onClick={handleBackup}
            style={{
              background: "linear-gradient(90deg,#1976ed 70%,#45b7fa 100%)",
              color: "#fff",
              padding: "10px 26px",
              borderRadius: 9,
              border: "none",
              fontWeight: 800,
              fontSize: 15,
              boxShadow: "0 2px 10px #1976ed13",
              cursor: "pointer",
              transition: "background 0.16s"
            }}
            onMouseOver={e => e.currentTarget.style.background = "#45b7fa"}
            onMouseOut={e => e.currentTarget.style.background = "linear-gradient(90deg,#1976ed 70%,#45b7fa 100%)"}
          >백업 (파일저장)</button>
        </div>
        <textarea
          value={backupData}
          readOnly
          style={{
            width: "100%",
            marginTop: 9,
            minHeight: 70,
            borderRadius: 8,
            border: "1.5px solid #b4c4e4",
            fontSize: 14,
            background: "#fafdff",
            color: "#2a313f",
            fontFamily: "monospace",
            resize: "vertical"
          }}
        />
      </div>
      {/* 복구 */}
      <div style={{
        background: "#fafdff",
        borderRadius: 13,
        padding: "16px 18px",
        boxShadow: "0 1px 8px #d33a"
      }}>
        <label style={{ fontWeight: 700, fontSize: 15, marginBottom: 7, display: "block" }}>복구 파일 업로드</label>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          style={{ display: "block", marginBottom: 10 }}
        />
        <textarea
          value={restoreData}
          onChange={e => setRestoreData(e.target.value)}
          placeholder="복구할 백업 데이터를 여기에 붙여넣으세요 (또는 파일 선택)"
          style={{
            width: "100%",
            minHeight: 70,
            borderRadius: 8,
            border: "1.5px solid #ccc",
            fontSize: 14,
            marginBottom: 10,
            background: "#fff8f8",
            fontFamily: "monospace",
            resize: "vertical"
          }}
        />
        <button
          onClick={handleRestore}
          style={{
            background: "linear-gradient(90deg,#d33 60%,#fa6464 100%)",
            color: "#fff",
            padding: "10px 32px",
            borderRadius: 9,
            border: "none",
            fontWeight: 800,
            fontSize: 15,
            boxShadow: "0 2px 10px #d33a",
            cursor: "pointer",
            transition: "background 0.18s"
          }}
          onMouseOver={e => e.currentTarget.style.background = "#d33"}
          onMouseOut={e => e.currentTarget.style.background = "linear-gradient(90deg,#d33 60%,#fa6464 100%)"}
        >복구</button>
      </div>
    </div>
  );
}

export default BackupPage;
