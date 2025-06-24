import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { hasBadword } from "../badwords-multilang";

function LoginBox() {
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState(() => localStorage.getItem("onepickgame_user") || "");
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("onepickgame_user");
    if (saved !== user) setUser(saved || "");
    // eslint-disable-next-line
  }, []);

  function handleLogin(e) {
    e.preventDefault();
    if (!userId || !password) {
      alert("아이디와 비밀번호를 모두 입력하세요.");
      return;
    }
    const userList = JSON.parse(localStorage.getItem("userList") || "[]");
    const userObj = userList.find(u => u.userId === userId && u.password === password);
    if (!userObj) {
      alert("아이디 또는 비밀번호가 일치하지 않습니다.");
      return;
    }
    if (hasBadword(userObj.nickname, i18n.language)) {
      alert(t("badword_warning") || "비속어/금지어가 포함되어 있습니다.");
      return;
    }
    localStorage.setItem("onepickgame_user", userObj.nickname);
    setUser(userObj.nickname);
    setUserId("");
    setPassword("");
    if (userObj.nickname === "admin") {
      window.location.href = "/manage";
    } else {
      window.location.reload();
    }
  }

  function handleLogout() {
    localStorage.removeItem("onepickgame_user");
    setUser("");
    setUserId("");
    setPassword("");
    window.location.reload();
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        alignItems: "flex-end",
        marginBottom: 20,
        justifyContent: "flex-end"
      }}
    >
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
          <form style={{ display: "flex", gap: 8 }} onSubmit={handleLogin}>
            <input
              type="text"
              value={userId}
              onChange={e => setUserId(e.target.value)}
              placeholder="아이디"
              style={{
                width: 100,
                padding: 8,
                borderRadius: 8,
                border: "1px solid #bbb"
              }}
              autoComplete="username"
            />
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="비밀번호"
              style={{
                width: 100,
                padding: 8,
                borderRadius: 8,
                border: "1px solid #bbb"
              }}
              autoComplete="current-password"
            />
            <button
              type="submit"
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
          </form>
          {/* 회원가입/아이디 찾기/비밀번호 찾기 */}
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
