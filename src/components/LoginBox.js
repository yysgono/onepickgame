import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { hasBadword } from "../badwords-multilang";

function LoginBox() {
  const { t, i18n } = useTranslation();

  const [user, setUser] = useState(() => localStorage.getItem("onepickgame_user") || "");
  const [nickname, setNickname] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("onepickgame_user");
    if (saved !== user) setUser(saved || "");
    // eslint-disable-next-line
  }, []);

  function handleLogin() {
    const nick = nickname.trim();
    if (!nick) return alert(t("comment.inputNickname"));
    if (hasBadword(nick, i18n.language)) {
      return alert(t("badword_warning") || "비속어/금지어가 포함되어 있습니다.");
    }
    localStorage.setItem("onepickgame_user", nick);
    setUser(nick);
    setNickname("");
    if (nick === "admin") {
      window.location.href = "/manage";
    } else {
      window.location.reload();
    }
  }

  function handleLogout() {
    localStorage.removeItem("onepickgame_user");
    setUser("");
    setNickname("");
    window.location.reload();
  }

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: 8,
      alignItems: "flex-end",
      marginBottom: 20,
      justifyContent: "flex-end"
    }}>
      {user ? (
        <>
          <b style={{ fontSize: 16 }}>{user}</b>
          <button
            onClick={handleLogout}
            style={{
              background: "#ddd",
              color: "#333",
              border: "none",
              borderRadius: 7,
              padding: "4px 18px",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            {t("logout")}
          </button>
        </>
      ) : (
        <>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              placeholder={t("comment.nickname")}
              style={{
                width: 110,
                padding: 8,
                borderRadius: 8,
                border: "1px solid #bbb"
              }}
              maxLength={16}
            />
            <button
              onClick={handleLogin}
              style={{
                background: "#1976ed",
                color: "#fff",
                border: "none",
                borderRadius: 7,
                padding: "4px 18px",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              {t("login")}
            </button>
          </div>
          {/* ↓↓↓ 회원가입/ID/PW 찾기 버튼 ↓↓↓ */}
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button
              style={{
                background: "none",
                border: "none",
                color: "#1976ed",
                textDecoration: "underline",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 700,
                padding: 0
              }}
              onClick={() => window.location.href = "/signup"}
              type="button"
            >
              회원가입
            </button>
            <button
              style={{
                background: "none",
                border: "none",
                color: "#1976ed",
                textDecoration: "underline",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 700,
                padding: 0
              }}
              onClick={() => window.location.href = "/find-id"}
              type="button"
            >
              아이디 찾기
            </button>
            <button
              style={{
                background: "none",
                border: "none",
                color: "#1976ed",
                textDecoration: "underline",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 700,
                padding: 0
              }}
              onClick={() => window.location.href = "/find-pw"}
              type="button"
            >
              비밀번호 찾기
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default LoginBox;
