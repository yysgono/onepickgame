import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../utils/supabaseClient";

function LoginBox({ setUser, setNickname }) {  // props 받기!
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (loginError) {
      setError(loginError.message || "로그인 실패");
      return;
    }
    // 여기 ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓
    if (data?.user) {
      setUser && setUser(data.user);
      // 닉네임 동기화
      const { data: profile } = await supabase
        .from("profiles")
        .select("nickname")
        .eq("id", data.user.id)
        .single();
      setNickname && setNickname(profile?.nickname || "");
    }
    setEmail("");
    setPassword("");
    navigate("/"); // 로그인 성공 시 홈으로 이동
  }

  return (
    <div
      style={{
        maxWidth: 360,
        margin: "80px auto",
        background: "#fff",
        borderRadius: 14,
        boxShadow: "0 2px 12px #0001",
        padding: 30,
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: 20 }}>로그인</h2>
      <form onSubmit={handleLogin}>
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
            fontSize: 16,
            marginBottom: 12,
          }}
          required
        />
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
            fontSize: 16,
            marginBottom: 18,
          }}
          required
        />
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
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "로그인 중..." : "로그인"}
        </button>
        {error && (
          <div style={{ color: "red", marginTop: 10, textAlign: "center" }}>
            {error}
          </div>
        )}
      </form>
      <div style={{ marginTop: 14, width: "100%", textAlign: "center" }}>
        <Link to="/signup" style={{ color: "#1976ed", marginBottom: 7, display: "block" }}>
          회원가입
        </Link>
        <Link to="/find-id" style={{ color: "#555", marginBottom: 5, display: "block" }}>
          아이디 찾기
        </Link>
        <Link to="/find-pw" style={{ color: "#555", display: "block" }}>
          비밀번호 찾기
        </Link>
      </div>
    </div>
  );
}

export default LoginBox;
