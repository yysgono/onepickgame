import React from "react";

function AdminBar({ onLogout, adminName }) {
  return (
    <div style={{
      background: "#222",
      color: "#fff",
      padding: "9px 18px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      fontSize: 16,
      position: "sticky",
      top: 0,
      zIndex: 1000
    }}>
      <span style={{ fontWeight: 800, letterSpacing: 0.5 }}>
        🛡️ 관리자 모드 {adminName && <span style={{ fontWeight: 400, fontSize: 15, marginLeft: 10, color: "#ffbe3b" }}>{adminName}</span>}
      </span>
      <button
        onClick={() => {
          if (window.confirm("로그아웃 하시겠습니까?")) onLogout();
        }}
        style={{
          background: "#f55",
          color: "#fff",
          border: "none",
          borderRadius: 7,
          padding: "5px 14px",
          fontWeight: "bold",
          fontSize: 15,
          cursor: "pointer"
        }}
      >로그아웃</button>
    </div>
  );
}

export default AdminBar;
