import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

// 언어 목록
const languages = [
  { code: "ko", label: "한국어" },
  { code: "en", label: "English" },
  // 필요시 더 추가 가능
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
              <button
                style={adminButtonStyle("#1976ed")}
                onClick={() => navigate("/admin")}
              >
                대시보드
              </button>
              <button
                style={adminButtonStyle("#ffbe3b", "#222")}
                onClick={() => navigate("/admin-stats")}
              >
                통계
              </button>
              <button
                style={adminButtonStyle("#222")}
                onClick={onBackup}
              >
                {t("backupAll") || "백업"}
              </button>
              <button
                style={adminButtonStyle("#444")}
                onClick={() => inputRef.current && inputRef.current.click()}
              >
                {t("restore") || "복구"}
              </button>
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
            style={primaryButtonStyle}
            onClick={onMakeWorldcup}
          >
            {t("makeWorldcup")}
          </button>
          <select
            value={i18n.language}
            onChange={(e) => {
              i18n.changeLanguage(e.target.value);
              if (onLangChange) onLangChange(e.target.value);
            }}
            style={selectStyle}
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
              </option>
            ))}
          </select>

          {!currentUser && (
            <>
              <button
                style={primaryButtonStyle}
                onClick={() => setShowLogin(true)}
              >
                {t("login")}
              </button>
              {showLogin && (
                <div
                  style={modalOverlayStyle}
                  onClick={() => setShowLogin(false)}
                >
                  <div
                    style={modalContentStyle}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div
                      style={{ fontWeight: 800, fontSize: 20, marginBottom: 12 }}
                    >
                      {t("login")}
                    </div>
                    <input
                      value={inputId}
                      onChange={(e) => setInputId(e.target.value)}
                      placeholder={t("enterId")}
                      style={modalInputStyle}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") doLogin();
                      }}
                    />
                    <button
                      style={modalLoginButtonStyle}
                      onClick={doLogin}
                    >
                      {t("login")}
                    </button>

                    <div style={{ marginTop: 14, display: "flex", gap: 8, flexDirection: "column", width: "100%" }}>
                      <button
                        onClick={openSignup}
                        style={modalSecondaryButtonStyle("#1976ed")}
                      >
                        회원가입
                      </button>
                      <button
                        onClick={openFindId}
                        style={modalSecondaryButtonStyle("#555")}
                      >
                        아이디 찾기
                      </button>
                      <button
                        onClick={openFindPw}
                        style={modalSecondaryButtonStyle("#555")}
                      >
                        비밀번호 찾기
                      </button>
                    </div>

                    <button
                      style={modalCloseButtonStyle}
                      onClick={() => setShowLogin(false)}
                    >
                      {t("close")}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {currentUser && (
            <>
              <span
                style={{
                  fontWeight: 700,
                  color: isAdmin ? "#1976ed" : "#222",
                  marginRight: 10,
                  whiteSpace: "nowrap",
                }}
              >
                {currentUser}
              </span>
              <button
                style={logoutButtonStyle}
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

// 스타일 함수 및 객체

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
  ":hover": {
    filter: "brightness(90%)",
  },
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

const modalInputStyle = {
  padding: 10,
  borderRadius: 8,
  border: "1.5px solid #bbb",
  fontSize: 16,
  width: 180,
};

const modalLoginButtonStyle = {
  background: "#1976ed",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  fontWeight: 700,
  padding: "9px 0",
  fontSize: 16,
  width: 180,
  cursor: "pointer",
  userSelect: "none",
};

const modalSecondaryButtonStyle = (color) => ({
  background: "#f5f5f5",
  color: color,
  border: "none",
  borderRadius: 8,
  fontWeight: 700,
  padding: "8px 0",
  width: "100%",
  cursor: "pointer",
  userSelect: "none",
});

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
