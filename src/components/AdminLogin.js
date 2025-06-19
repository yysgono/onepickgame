import React, { useState } from "react";

function AdminLogin({ onLogin, error }) {
  const [pw, setPw] = useState("");

  return (
    <div
      style={{
        minHeight: "50vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(120deg, #fafdff 70%, #e3f0fb 100%)",
      }}
    >
      <form
        onSubmit={e => {
          e.preventDefault();
          onLogin(pw);
        }}
        style={{
          background: "#fff",
          padding: "38px 40px 32px 40px",
          borderRadius: 20,
          boxShadow: "0 4px 32px #1976ed20",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          minWidth: 310,
          gap: 18,
        }}
      >
        <div style={{ fontWeight: 900, fontSize: 24, color: "#1976ed", marginBottom: 4 }}>
          관리자 로그인
        </div>
        <input
          type="password"
          value={pw}
          onChange={e => setPw(e.target.value)}
          placeholder="관리자 비밀번호"
          style={{
            padding: "13px 16px",
            borderRadius: 9,
            border: "1.5px solid #b4c4e4",
            fontSize: 17,
            minWidth: 200,
            marginBottom: 6,
            background: "#f8fbff"
          }}
        />
        <button
          type="submit"
          style={{
            padding: "12px 0",
            borderRadius: 9,
            border: "none",
            background: "linear-gradient(90deg,#1976ed 80%,#45b7fa 100%)",
            color: "#fff",
            fontWeight: 700,
            fontSize: 17,
            width: "100%",
            marginBottom: 5,
            boxShadow: "0 2px 8px #1976ed18",
            cursor: "pointer"
          }}
        >
          로그인
        </button>
        {error && (
          <div style={{ color: "#d33", marginTop: 6, fontWeight: 600 }}>
            {error}
          </div>
        )}
      </form>
    </div>
  );
}

export default AdminLogin;
