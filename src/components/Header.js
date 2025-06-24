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

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user || null));
  }, []);
  useEffect(() => {
    // 닉네임 읽기
    if (user) {
      supabase.from("profiles").select("nickname").eq("id", user.id).single().then(({ data }) => {
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
                    <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 12 }}>{t("login")}</div>
                    {/* AuthBox 등으로 대체 */}
                    <a href="/signup" style={{ display: "block", color: "#1976ed", marginBottom: 10 }}>회원가입</a>
                    <a href="/find-id" style={{ display: "block", color: "#555", marginBottom: 5 }}>아이디 찾기</a>
                    <a href="/find-pw" style={{ display: "block", color: "#555", marginBottom: 5 }}>비밀번호 찾기</a>
                    <button style={modalCloseButtonStyle} onClick={() => setShowLogin(false)}>{t("close")}</button>
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
  justifyContent: "center",
};
const modalContentStyle = {
  background: "#fff",
  borderRadius: 12,
  padding: 32,
  minWidth: 260,
  boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
  display: "flex",
  flexDirection: "column",
  gap: 16,
  alignItems: "center",
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
  marginTop: 6,
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
