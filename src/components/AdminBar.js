import React from "react";

function AdminBar({ onLogout, adminName }) {
  return (
    <div style={{
      background: "#ffffff",
      color: "#202534",
      padding: "9px 18px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      fontSize: 18,
      position: "sticky",
      top: 0,
      zIndex: 1000
    }}>
      <span style={{ fontWeight: 800, letterSpacing: 0.5 }}>
        🛡️ 관리자 모드 {adminName && <span style={{ fontWeight: 400, fontSize: 17, marginLeft: 10, color: "#596579" }}>{adminName}</span>}
      </span>
      <button
        onClick={() => {
          if (window.confirm("로그아웃 하시겠습니까?")) onLogout();
        }}
        style={{
          background: "#f55",
          color: "#202534",
          border: "none",
          borderRadius: 7,
          padding: "5px 14px",
          fontWeight: "bold",
          fontSize: 17,
          cursor: "pointer"
        }}
      >로그아웃</button>
    </div>
  );
}

export default AdminBar;
