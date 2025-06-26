import React, { useState } from "react";
import { supabase } from "../utils/supabaseClient";
import { useNavigate } from "react-router-dom";

function SignupBox() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSignup(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !password) {
      setError("이메일과 비밀번호를 모두 입력하세요.");
      return;
    }

    setLoading(true);

    // 1. 회원가입 (Supabase Auth)
    const { data, error: authErr } = await supabase.auth.signUp({
      email,
      password,
    });

    // 2. 에러 처리
    if (authErr) {
      if (
        authErr.message.includes("User already registered") ||
        authErr.message.includes("already registered") ||
        authErr.message.includes("already exists") ||
        authErr.message.includes("이미 가입")
      ) {
        setError("이미 가입된 이메일입니다.");
      } else {
        setError(authErr.message);
      }
      setLoading(false);
      return;
    }

    // 3. 회원가입 성공 시 프로필은 DB 트리거에서 자동 생성하므로 별도 처리 없음

    setSuccess("회원가입 성공! 이메일 인증 후 로그인 하세요.");
    setEmail("");
    setPassword("");
    setLoading(false);

    setTimeout(() => {
      navigate("/"); // 성공시 홈으로 이동
    }, 2000);
  }

  return (
    <div
      style={{
        maxWidth: 360,
        margin: "60px auto",
        background: "#fff",
        borderRadius: 14,
        boxShadow: "0 2px 12px #0001",
        padding: 30,
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: 18 }}>회원가입</h2>
      <form onSubmit={handleSignup}>
        {/* 닉네임 입력란 제거 */}
        <div style={{ marginBottom: 12 }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일"
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 7,
              border: "1.2px solid #bbb",
              fontSize: 16,
            }}
            autoComplete="off"
            required
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호"
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 7,
              border: "1.2px solid #bbb",
              fontSize: 16,
            }}
            maxLength={20}
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
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "가입중..." : "가입하기"}
        </button>
      </form>
      {success && (
        <div style={{ color: "green", marginTop: 12, textAlign: "center" }}>
          {success}
        </div>
      )}
      {error && (
        <div style={{ color: "red", marginTop: 12, textAlign: "center" }}>
          {error}
        </div>
      )}
    </div>
  );
}

export default SignupBox;
