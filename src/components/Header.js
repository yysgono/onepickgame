import React, { useRef, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabaseClient";

const languages = [
  { code: "ko", label: "한국어" },
  { code: "en", label: "English" },
];

export default function Header({ onLangChange, onBackup, onRestore, onMakeWorldcup, isAdmin }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const inputRef = useRef();
  const [showLogin, setShowLogin] = useState(false);
  const [user, setUser] = useState(null);
  const [nickname, setNickname] = useState("");

  // 로그인 폼
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user || null));
  }, []);
  useEffect(() => {
    if (user) {
      supabase
        .from("profiles")
        .select("nickname")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          setNickname(data?.nickname || "");
        });
    } else {
      setNickname("");
    }
  }, [user]);

  function handleLogout() {
    supabase.auth.signOut().then(() => window.location.reload());
  }

  function openSignup() {
    setShowLogin(false);
    navigate("/signup");
  }
  function openFindId() {
    setShowLogin(false);
    navigate("/find-id");
  }
  function openFindPw() {
    setShowLogin(false);
    navigate("/find-pw");
  }

  // 로그인 핸들러
  async function handleLogin(e) {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });
    setLoginLoading(false);
    if (loginError) {
      setLoginError(loginError.message || "로그인 실패");
      return;
    }
    setShowLogin(false);
    setLoginEmail("");
    setLoginPassword("");
    window.location.reload();
  }

  return (
    <header
      style={{
        width: "100%",
        background: "#fff",
        boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        marginBottom: 24,
        minHeight: 68,
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 1800,
          margin: "0 auto",
          padding: "0 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          minHeight: 64,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div
          style={{
            fontWeight: 900,
            fontSize: 28,
            letterSpacing: 0.2,
            color: "#1976ed",
            cursor: "pointer",
            userSelect: "none",
            flexShrink: 0,
            whiteSpace: "nowrap",
          }}
          onClick={() => (window.location.href = "/")}
        >
          OnePickGame
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
            justifyContent: "flex-end",
            flexGrow: 1,
          }}
        >
          {isAdmin && (
            <>
              <button style={adminButtonStyle("#1976ed")} onClick={() => navigate("/admin")}>대시보드</button>
              <button style={adminButtonStyle("#ffbe3b", "#222")} onClick={() => navigate("/admin-stats")}>통계</button>
              <button style={adminButtonStyle("#222")} onClick={onBackup}>{t("backupAll") || "백업"}</button>
              <button style={adminButtonStyle("#444")} onClick={() => inputRef.current && inputRef.current.click()}>{t("restore") || "복구"}</button>
              <input ref={inputRef} type="file" accept="application/json" style={{ display: "none" }} onChange={onRestore} />
            </>
          )}
          <button style={primaryButtonStyle} onClick={onMakeWorldcup}>{t("makeWorldcup")}</button>
          <select value={i18n.language} onChange={e => { i18n.changeLanguage(e.target.value); if (onLangChange) onLangChange(e.target.value); }} style={selectStyle}>
            {languages.map((lang) => (<option key={lang.code} value={lang.code}>{lang.label}</option>))}
          </select>
          {!user && (
            <>
              <button style={primaryButtonStyle} onClick={() => setShowLogin(true)}>{t("login")}</button>
              {showLogin && (
                <div style={modalOverlayStyle} onClick={() => setShowLogin(false)}>
                  <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
                    <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 14, textAlign: "center" }}>{t("로그인")}</div>
                    <form style={{ width: "100%" }} onSubmit={handleLogin}>
                      <input
                        type="email"
                        value={loginEmail}
                        onChange={e => setLoginEmail(e.target.value)}
                        placeholder="이메일"
                        style={modalInputStyle}
                        autoComplete="username"
                        required
                      />
                      <input
                        type="password"
                        value={loginPassword}
                        onChange={e => setLoginPassword(e.target.value)}
                        placeholder="비밀번호"
                        style={modalInputStyle}
                        autoComplete="current-password"
                        required
                      />
                      <button
                        type="submit"
                        disabled={loginLoading}
                        style={{
                          width: "100%",
                          background: "#1976ed",
                          color: "#fff",
                          fontWeight: 800,
                          border: "none",
                          borderRadius: 8,
                          fontSize: 17,
                          padding: "11px 0",
                          margin: "14px 0 0",
                          cursor: loginLoading ? "not-allowed" : "pointer"
                        }}
                      >
                        {loginLoading ? "로그인 중..." : "로그인"}
                      </button>
                      {loginError && (
                        <div style={{ color: "red", marginTop: 8, fontSize: 15, textAlign: "center" }}>
                          {loginError}
                        </div>
                      )}
                    </form>
                    <div style={{ marginTop: 14 }}>
                      <a href="/signup" style={{ color: "#1976ed", marginBottom: 7, display: "block" }}>회원가입</a>
                      <a href="/find-id" style={{ color: "#555", marginBottom: 5, display: "block" }}>아이디 찾기</a>
                      <a href="/find-pw" style={{ color: "#555", display: "block" }}>비밀번호 찾기</a>
                    </div>
                    <button style={modalCloseButtonStyle} onClick={() => setShowLogin(false)}>
                      close
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
          {user && (
            <>
              <span style={{ fontWeight: 700, color: "#1976ed", marginRight: 10, whiteSpace: "nowrap" }}>
                {nickname || user.email}
              </span>
              <button style={logoutButtonStyle} onClick={handleLogout}>{t("logout")}</button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

const adminButtonStyle = (bgColor, color = "#fff") => ({
  background: bgColor,
  color: color,
  borderRadius: 7,
  fontWeight: 700,
  padding: "7px 14px",
  border: "none",
  cursor: "pointer",
  transition: "background-color 0.2s ease",
  userSelect: "none",
  whiteSpace: "nowrap",
  fontSize: 14,
});
const primaryButtonStyle = {
  background: "#1976ed",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  fontWeight: 700,
  padding: "7px 14px",
  fontSize: 15,
  cursor: "pointer",
  userSelect: "none",
  whiteSpace: "nowrap",
  transition: "background-color 0.2s ease",
};
const selectStyle = {
  padding: "6px 10px",
  borderRadius: 8,
  fontWeight: 600,
  fontSize: 15,
  minWidth: 100,
  background: "#f5f6fa",
  border: "1px solid #e5e5e5",
  cursor: "pointer",
  userSelect: "none",
};
const modalOverlayStyle = {
  position: "fixed",
  left: 0,
  top: 0,
  width: "100vw",
  height: "100vh",
  background: "rgba(0,0,0,0.3)",
  zIndex: 9999,
  display: "flex",
  alignItems: "center",
  justifyContent: "center"
};
const modalContentStyle = {
  background: "#fff",
  borderRadius: 12,
  padding: "32px 28px",
  minWidth: 330,
  maxWidth: 380,
  width: "100%",
  boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
  display: "flex",
  flexDirection: "column",
  gap: 14,
  alignItems: "center",
  boxSizing: "border-box",
};
const modalInputStyle = {
  width: "100%",
  padding: "10px 11px",
  borderRadius: 7,
  border: "1.2px solid #bbb",
  fontSize: 16,
  marginBottom: 9,
  boxSizing: "border-box"
};
const modalCloseButtonStyle = {
  background: "#eee",
  color: "#222",
  border: "none",
  borderRadius: 8,
  padding: "7px 0",
  fontWeight: 600,
  cursor: "pointer",
  width: 180,
  marginTop: 10,
  userSelect: "none",
};
const logoutButtonStyle = {
  fontSize: 13,
  fontWeight: 500,
  background: "#eee",
  border: "none",
  borderRadius: 7,
  padding: "5px 11px",
  cursor: "pointer",
  userSelect: "none",
};
