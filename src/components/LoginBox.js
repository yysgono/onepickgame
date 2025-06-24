import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../utils/supabaseClient";

function LoginBox() {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 로그인 유저 체크 (마운트 시)
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user || null);
    });

    // 실시간 로그인/로그아웃 감지
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
      }
    );
    return () => { listener?.subscription.unsubscribe(); }
  }, []);

  // 로그인 핸들러
  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setEmail("");
      setPassword("");
      window.location.reload(); // 또는 라우팅 이동
    }
  }

  // 로그아웃
  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    window.location.reload();
  }

  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 8,
      alignItems: "flex-end", marginBottom: 20, justifyContent: "flex-end"
    }}>
      {user ? (
        <>
          <b style={{ fontSize: 16 }}>{user.email}</b>
          <button
            onClick={handleLogout}
            style={{
              background: "#ddd", color: "#333", border: "none",
              borderRadius: 7, padding: "4px 18px", fontWeight: 700,
              cursor: "pointer"
            }}
          >
            {t("logout")}
          </button>
        </>
      ) : (
        <>
          <form style={{ display: "flex", gap: 8 }} onSubmit={handleLogin}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="이메일"
              style={{
                width: 140, padding: 8, borderRadius: 8, border: "1px solid #bbb"
              }}
              autoComplete="username"
            />
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="비밀번호"
              style={{
                width: 100, padding: 8, borderRadius: 8, border: "1px solid #bbb"
              }}
              autoComplete="current-password"
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                background: "#1976ed", color: "#fff", border: "none",
                borderRadius: 7, padding: "4px 18px", fontWeight: 700,
                cursor: "pointer"
              }}
            >
              {loading ? "로그인 중..." : t("login")}
            </button>
          </form>
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button
              style={{
                background: "none", border: "none", color: "#1976ed",
                textDecoration: "underline", cursor: "pointer",
                fontSize: 14, fontWeight: 700, padding: 0
              }}
              onClick={() => window.location.href = "/signup"}
              type="button"
            >
              회원가입
            </button>
            <button
              style={{
                background: "none", border: "none", color: "#1976ed",
                textDecoration: "underline", cursor: "pointer",
                fontSize: 14, fontWeight: 700, padding: 0
              }}
              onClick={() => window.location.href = "/find-id"}
              type="button"
            >
              아이디 찾기
            </button>
            <button
              style={{
                background: "none", border: "none", color: "#1976ed",
                textDecoration: "underline", cursor: "pointer",
                fontSize: 14, fontWeight: 700, padding: 0
              }}
              onClick={() => window.location.href = "/find-pw"}
              type="button"
            >
              비밀번호 찾기
            </button>
          </div>
          {error && (
            <div style={{ color: "#d33", marginTop: 8 }}>{error}</div>
          )}
        </>
      )}
    </div>
  );
}

export default LoginBox;
