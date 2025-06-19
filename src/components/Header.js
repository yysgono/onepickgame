import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

// 언어 목록
const languages = [
  { code: "ko", label: "한국어" },
  { code: "en", label: "English" },
  // ...생략
];

export default function Header({ onLangChange, onBackup, onRestore, onMakeWorldcup, isAdmin }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const inputRef = useRef();
  const [showLogin, setShowLogin] = useState(false);
  const [inputId, setInputId] = useState("");
  const currentUser = localStorage.getItem("onepickgame_user") || "";

  function doLogin() {
    if (!inputId.trim()) return;
    localStorage.setItem("onepickgame_user", inputId.trim());
    window.location.reload();
  }
  function handleLogout() {
    localStorage.removeItem("onepickgame_user");
    window.location.reload();
  }

  // 회원가입, 아이디찾기, 비번찾기 열기 함수
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
        boxShadow: "0 2px 12px #0001",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        marginBottom: 24,
        minHeight: 68,
      }}
    >
      <div style={{
        maxWidth: 1800,
        margin: "0 auto",
        padding: "0 28px 0 28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        minHeight: 64,
      }}>
        <div
          style={{
            fontWeight: 900,
            fontSize: 28,
            letterSpacing: 0.2,
            color: "#1976ed",
            cursor: "pointer",
            userSelect: "none",
            flexShrink: 0
          }}
          onClick={() => window.location.href = "/"}
        >
          OnePickGame
        </div>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
          justifyContent: "flex-end"
        }}>
          {isAdmin && (
            <>
              <button
                style={{
                  background: "#1976ed",
                  color: "#fff",
                  borderRadius: 7,
                  fontWeight: 700,
                  padding: "7px 14px",
                  border: "none"
                }}
                onClick={() => navigate("/admin")}
              >
                대시보드
              </button>
              <button
                style={{
                  background: "#ffbe3b",
                  color: "#222",
                  borderRadius: 7,
                  fontWeight: 700,
                  padding: "7px 14px",
                  border: "none"
                }}
                onClick={() => navigate("/admin-stats")}
              >
                통계
              </button>
              <button
                style={{
                  background: "#222", color: "#fff", borderRadius: 7, fontWeight: 700, padding: "7px 13px", border: "none"
                }}
                onClick={onBackup}
              >{t("backupAll") || "백업"}</button>
              <button
                style={{
                  background: "#444", color: "#fff", borderRadius: 7, fontWeight: 700, padding: "7px 13px", border: "none"
                }}
                onClick={() => inputRef.current && inputRef.current.click()}
              >{t("restore") || "복구"}</button>
              <input
                ref={inputRef}
                type="file"
                accept="application/json"
                style={{ display: "none" }}
                onChange={onRestore}
              />
            </>
          )}
          <button
            style={{
              background: "#1976ed",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontWeight: 700,
              padding: "7px 14px",
              fontSize: 15,
              cursor: "pointer"
            }}
            onClick={onMakeWorldcup}
          >{t("makeWorldcup")}</button>
          <select
            value={i18n.language}
            onChange={e => {
              i18n.changeLanguage(e.target.value);
              if (onLangChange) onLangChange(e.target.value);
            }}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 15,
              minWidth: 100,
              background: "#f5f6fa",
              border: "1px solid #e5e5e5"
            }}
          >
            {languages.map(lang => (
              <option key={lang.code} value={lang.code}>{lang.label}</option>
            ))}
          </select>
          {/* 로그인/로그아웃 + 유저ID */}
          {!currentUser && (
            <>
              <button
                style={{
                  background: "#1976ed",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontWeight: 700,
                  padding: "7px 14px",
                  fontSize: 15,
                  cursor: "pointer"
                }}
                onClick={() => setShowLogin(true)}
              >{t("login")}</button>
              {/* 로그인 모달 */}
              {showLogin && (
                <div style={{
                  position: "fixed",
                  left: 0, top: 0, width: "100vw", height: "100vh",
                  background: "#0005", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center"
                }}
                  onClick={() => setShowLogin(false)}
                >
                  <div style={{
                    background: "#fff",
                    borderRadius: 12,
                    padding: 32,
                    minWidth: 260,
                    boxShadow: "0 4px 24px #0003",
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                    alignItems: "center"
                  }}
                    onClick={e => e.stopPropagation()}
                  >
                    <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 12 }}>{t("login")}</div>
                    <input
                      value={inputId}
                      onChange={e => setInputId(e.target.value)}
                      placeholder={t("enterId")}
                      style={{
                        padding: 10, borderRadius: 8, border: "1.5px solid #bbb", fontSize: 16, width: 180
                      }}
                      onKeyDown={e => { if (e.key === "Enter") doLogin(); }}
                    />
                    <button
                      style={{
                        background: "#1976ed",
                        color: "#fff",
                        border: "none",
                        borderRadius: 8,
                        fontWeight: 700,
                        padding: "9px 0",
                        fontSize: 16,
                        width: 180,
                        cursor: "pointer"
                      }}
                      onClick={doLogin}
                    >{t("login")}</button>
                    {/* ▼▼▼ 회원가입/아이디찾기/비번찾기 버튼 3개 추가 ▼▼▼ */}
                    <div style={{
                      marginTop: 14,
                      display: "flex",
                      gap: 8,
                      flexDirection: "column",
                      width: "100%"
                    }}>
                      <button
                        onClick={openSignup}
                        style={{
                          background: "#f5f5f5", color: "#1976ed",
                          border: "none", borderRadius: 8, fontWeight: 700,
                          padding: "8px 0", width: "100%", cursor: "pointer"
                        }}
                      >회원가입</button>
                      <button
                        onClick={openFindId}
                        style={{
                          background: "#f5f5f5", color: "#555",
                          border: "none", borderRadius: 8, fontWeight: 700,
                          padding: "8px 0", width: "100%", cursor: "pointer"
                        }}
                      >아이디 찾기</button>
                      <button
                        onClick={openFindPw}
                        style={{
                          background: "#f5f5f5", color: "#555",
                          border: "none", borderRadius: 8, fontWeight: 700,
                          padding: "8px 0", width: "100%", cursor: "pointer"
                        }}
                      >비밀번호 찾기</button>
                    </div>
                    {/* ▲▲▲ ▲▲▲ */}
                    <button
                      style={{
                        background: "#eee", color: "#222", border: "none",
                        borderRadius: 8, padding: "7px 0", fontWeight: 600, cursor: "pointer", width: 180, marginTop: 6
                      }}
                      onClick={() => setShowLogin(false)}
                    >{t("close")}</button>
                  </div>
                </div>
              )}
            </>
          )}
          {currentUser && (
            <>
              <span style={{ fontWeight: 700, color: isAdmin ? "#1976ed" : "#222", marginRight: 3 }}>
                {currentUser}
              </span>
              <button
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  background: "#eee",
                  border: "none",
                  borderRadius: 7,
                  padding: "5px 11px",
                  cursor: "pointer"
                }}
                onClick={handleLogout}
              >
                {t("logout")}
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
