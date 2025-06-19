import React from "react";

function AdminDashboard() {
  // 예시 통계 (localStorage 등에서 불러오거나 props로 받아도 됨)
  const totalWorldcups = JSON.parse(localStorage.getItem("onepickgame_worldcupList") || "[]").length;
  const totalComments = Object.values(JSON.parse(localStorage.getItem("comments") || "{}")).reduce((a, v) => a + v.length, 0);

  return (
    <div style={{
      maxWidth: 950,
      margin: "40px auto",
      background: "#fff",
      borderRadius: 24,
      boxShadow: "0 4px 24px #e6ecfa",
      padding: 40
    }}>
      <h2 style={{ fontWeight: 900, fontSize: 32, color: "#1976ed", marginBottom: 32, letterSpacing: -1 }}>
        🛡️ 관리자 대시보드
      </h2>
      {/* 통계 위젯 */}
      <div style={{
        display: "flex", gap: 30, flexWrap: "wrap", justifyContent: "center", marginBottom: 40
      }}>
        <div style={{
          background: "#f6f8fc", borderRadius: 18, boxShadow: "0 2px 14px #dde4ef",
          minWidth: 210, padding: "30px 36px", textAlign: "center"
        }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#666" }}>전체 월드컵 수</div>
          <div style={{ fontSize: 38, fontWeight: 900, color: "#1976ed", marginTop: 10 }}>{totalWorldcups}</div>
        </div>
        <div style={{
          background: "#f6f8fc", borderRadius: 18, boxShadow: "0 2px 14px #dde4ef",
          minWidth: 210, padding: "30px 36px", textAlign: "center"
        }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#666" }}>전체 댓글 수</div>
          <div style={{ fontSize: 38, fontWeight: 900, color: "#1976ed", marginTop: 10 }}>{totalComments}</div>
        </div>
      </div>

      {/* 관리 섹션 안내 */}
      <div style={{
        background: "#f5f7fb", borderRadius: 14, padding: 28, boxShadow: "0 1px 8px #dde5ef77", fontSize: 19, color: "#555"
      }}>
        월드컵/유저/댓글 관리 및 통계, 데이터 백업은<br />
        상단 메뉴 또는 사이드바에서 이동하세요.
      </div>
    </div>
  );
}

export default AdminDashboard;
