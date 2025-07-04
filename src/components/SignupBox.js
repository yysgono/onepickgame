// src/components/SignupBox.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signupUser } from "../utils/supabaseUserApi";
import { generateRandomNickname } from "../utils/randomNickname";

function SignupBox() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 이메일/비밀번호 기본 검증 함수
  function validate() {
    if (!email || !password) {
      setError("이메일과 비밀번호를 모두 입력하세요.");
      return false;
    }
    if (!/^[\w.-]+@[a-zA-Z\d.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      setError("올바른 이메일 형식을 입력하세요.");
      return false;
    }
    if (password.length < 6) {
      setError("비밀번호는 최소 6자리 이상이어야 합니다.");
      return false;
    }
    return true;
  }

  async function handleSignup(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validate()) return;
    setLoading(true);

    // 1. 랜덤 닉네임 생성!
    const nickname = generateRandomNickname();

    // 2. 회원가입 + 프로필 row insert
    const { user, error: signupErr } = await signupUser(email, password, nickname);

    if (signupErr) {
      if (
        signupErr.message.includes("User already registered") ||
        signupErr.message.includes("already registered") ||
        signupErr.message.includes("already exists") ||
        signupErr.message.includes("이미 가입")
      ) {
        setError("이미 가입된 이메일입니다.");
      } else {
        setError(signupErr.message || "회원가입 실패");
      }
      setLoading(false);
      return;
    }

    setSuccess("회원가입 성공! 이메일 인증 후 로그인 하세요.");
    setEmail("");
    setPassword("");
    setLoading(false);

    setTimeout(() => {
      navigate("/");
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
        <div style={{ marginBottom: 12 }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일"
            autoCapitalize="none"
            autoComplete="off"
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 7,
              border: "1.2px solid #bbb",
              fontSize: 16,
            }}
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
