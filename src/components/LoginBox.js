import React, { useState } from "react";
import { supabase } from "../utils/supabaseClient";
import { useNavigate } from "react-router-dom";

function LoginBox() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    // supabase 이메일+비밀번호 로그인
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (loginError) {
      setError(loginError.message || "로그인 실패");
      return;
    }
    setEmail("");
    setPassword("");
    // 로그인 성공시 홈으로 이동 및 새로고침
    navigate("/");
    window.location.reload();
  }

  return (
    <div
      style={{
        maxWidth: 360,
        margin: "60px auto",
        background: "#fff",
        borderRadius: 14,
        boxShadow: "0 2px 12px #0001",
        padding: 30
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: 18 }}>로그인</h2>
      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: 12 }}>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="이메일"
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 7,
              border: "1.2px solid #bbb",
              fontSize: 16
            }}
            autoComplete="username"
            required
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="비밀번호"
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 7,
              border: "1.2px solid #bbb",
              fontSize: 16
            }}
            autoComplete="current-password"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            background: "#1976ed",
            color: "#fff",
            fontWeight: 800,
            border: "none",
            borderRadius: 9,
            fontSize: 19,
            padding: "11px 0",
            marginBottom: 8,
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "로그인 중..." : "로그인"}
        </button>
      </form>
      {error && (
        <div style={{ color: "red", marginTop: 12, textAlign: "center" }}>
          {error}
        </div>
      )}
      <div style={{ marginTop: 18, textAlign: "center" }}>
        <a
          href="/signup"
          style={{
            color: "#1976ed",
            textDecoration: "underline",
            fontWeight: 700,
            marginRight: 15
          }}
        >
          회원가입
        </a>
        <a
          href="/find-id"
          style={{
            color: "#1976ed",
            textDecoration: "underline",
            fontWeight: 700,
            marginRight: 15
          }}
        >
          아이디 찾기
        </a>
        <a
          href="/find-pw"
          style={{
            color: "#1976ed",
            textDecoration: "underline",
            fontWeight: 700
          }}
        >
          비밀번호 찾기
        </a>
      </div>
    </div>
  );
}

export default LoginBox;
