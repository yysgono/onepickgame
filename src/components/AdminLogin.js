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
        background: "#f5f6fa",
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
          boxShadow: "0 4px 16px rgba(25,32,52,0.07)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          minWidth: 310,
          gap: 18,
        }}
      >
        <div style={{ fontWeight: 900, fontSize: 26, color: "#5542b8", marginBottom: 4 }}>
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
            fontSize: 19,
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
            background: "#6650d8",
            color: "#ffffff",
            fontWeight: 700,
            fontSize: 19,
            width: "100%",
            marginBottom: 5,
            boxShadow: "0 4px 16px rgba(25,32,52,0.07)",
            cursor: "pointer"
          }}
        >
          로그인
        </button>
        {error && (
          <div style={{ color: "#b42346", marginTop: 6, fontWeight: 600 }}>
            {error}
          </div>
        )}
      </form>
    </div>
  );
}

export default AdminLogin;
