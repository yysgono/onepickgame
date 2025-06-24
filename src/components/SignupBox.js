// src/components/SignupBox.jsx

import React, { useState } from "react";
import { supabase } from "../utils/supabaseClient"; // 반드시 supabaseClient.js 경로 확인!
import { useNavigate } from "react-router-dom";

function getByteLength(str) {
  let len = 0;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    len += code > 127 ? 2 : 1;
  }
  return len;
}
function sliceByByte(str, maxBytes) {
  let bytes = 0;
  let result = "";
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const code = str.charCodeAt(i);
    const charBytes = code > 127 ? 2 : 1;
    if (bytes + charBytes > maxBytes) break;
    result += char;
    bytes += charBytes;
  }
  return result;
}

function SignupBox() {
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function handleNicknameChange(e) {
    setNickname(sliceByByte(e.target.value, 12));
  }

  async function handleSignup(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!nickname || !email || !password) {
      setError("모든 항목을 입력하세요.");
      return;
    }
    if (getByteLength(nickname) > 12) {
      setError("닉네임은 최대 12바이트까지 가능합니다.");
      return;
    }
    setLoading(true);

    // 1. 회원가입 (Supabase Auth)
    const { data, error: authErr } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authErr) {
      setError(authErr.message);
      setLoading(false);
      return;
    }

    // 2. 닉네임 profiles 테이블에 저장 (이메일 인증 전에도 가능)
    if (data?.user?.id) {
      const { error: profileErr } = await supabase.from("profiles").insert([
        { id: data.user.id, nickname }
      ]);
      if (profileErr) {
        setError("닉네임 저장 실패: " + profileErr.message);
        setLoading(false);
        return;
      }
    }

    setSuccess("회원가입 성공! 이메일 인증 후 로그인 하세요.");
    setEmail("");
    setPassword("");
    setNickname("");
    setLoading(false);

    setTimeout(() => {
      navigate("/"); // 성공시 홈으로 이동
    }, 2000);
  }

  return (
    <div style={{
      maxWidth: 360,
      margin: "60px auto",
      background: "#fff",
      borderRadius: 14,
      boxShadow: "0 2px 12px #0001",
      padding: 30
    }}>
      <h2 style={{ textAlign: "center", marginBottom: 18 }}>회원가입</h2>
      <form onSubmit={handleSignup}>
        <div style={{ marginBottom: 12 }}>
          <input
            type="text"
            value={nickname}
            onChange={handleNicknameChange}
            placeholder="닉네임 (최대 12바이트)"
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 7,
              border: "1.2px solid #bbb",
              fontSize: 16
            }}
            autoComplete="off"
            spellCheck={false}
          />
        </div>
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
            autoComplete="off"
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
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "가입중..." : "가입하기"}
        </button>
      </form>
      {success && <div style={{ color: "green", marginTop: 12, textAlign: "center" }}>{success}</div>}
      {error && <div style={{ color: "red", marginTop: 12, textAlign: "center" }}>{error}</div>}
    </div>
  );
}

export default SignupBox;
