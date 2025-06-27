import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabaseClient";

// 닉네임 유효성 검사 함수
function isValidNickname(nickname) {
  if (!nickname) return false;
  const regex = /^[\uAC00-\uD7A3\w-]+$/;
  if (!regex.test(nickname)) return false;
  if (nickname.replace(/[\uAC00-\uD7A3]/g, "**").length < 3) return false;
  return true;
}

const languages = [
  { code: "ko", label: "한국어" },
  { code: "en", label: "English" },
];

export default function Header({
  onLangChange,
  onBackup,
  onRestore,
  onMakeWorldcup,
  isAdmin,
  user,
  nickname,
  nicknameLoading,
  setUser,
  setNickname,
}) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const inputRef = useRef();
  const [showLogin, setShowLogin] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // 로그인 폼 상태
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // 내정보 수정 상태
  const [editNickname, setEditNickname] = useState(nickname || "");
  const [editError, setEditError] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // 회원탈퇴 상태
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePw, setDeletePw] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  React.useEffect(() => {
    setEditNickname(nickname || "");
  }, [nickname]);

  function handleLogout() {
    supabase.auth.signOut().then(() => {
      setUser(null);
      setNickname("");
      setShowProfile(false);
      setShowLogin(false);
    });
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    const { data, error: loginError } = await supabase.auth.signInWithPassword({
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
    setUser(data?.user || null);

    if (data?.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("nickname")
        .eq("id", data.user.id)
        .single();
      setNickname(profile?.nickname || "");
    }
  }

  async function handleNicknameChange() {
    setEditError("");
    const trimName = editNickname.trim();
    if (!isValidNickname(trimName)) {
      setEditError("닉네임은 한글, 영문, 숫자, -, _ 만 사용, 3~12바이트(공백/특수문자 불가)");
      return;
    }
    setEditLoading(true);
    const { data: exist } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();
    let error;
    if (exist) {
      ({ error } = await supabase
        .from("profiles")
        .update({ nickname: trimName })
        .eq("id", user.id));
    } else {
      ({ error } = await supabase
        .from("profiles")
        .insert([{ id: user.id, nickname: trimName }]));
    }
    setEditLoading(false);
    if (error) {
      setEditError(error.message || "닉네임 변경 실패");
      return;
    }
    setNickname(trimName);
    setShowProfile(false);
    alert("닉네임이 변경되었습니다!");
  }

  async function handlePasswordChange() {
    setEditError("");
    if (!user?.email) {
      setEditError("이메일 정보가 없습니다.");
      return;
    }
    setEditLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(user.email);
    setEditLoading(false);
    if (error) {
      setEditError(error.message || "비밀번호 변경 메일 전송 실패");
      return;
    }
    alert("비밀번호 변경 메일을 전송했습니다.");
  }

  // 회원탈퇴: JWT 토큰 포함하여 API 호출
  async function handleDeleteAccount() {
    setEditError("");
    setDeleteLoading(true);

    // 1. 비밀번호 재인증
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: deletePw,
    });
    if (loginError) {
      setDeleteLoading(false);
      setEditError("비밀번호가 올바르지 않습니다.");
      return;
    }

    try {
      // 2. 세션에서 토큰 가져오기
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      // 3. API 호출 시 Authorization 헤더에 토큰 포함
      const res = await fetch("/api/deleteUser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ id: user.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "회원탈퇴 실패");
      }

      alert("탈퇴 완료");
      await supabase.auth.signOut();
      setUser(null);
      setNickname("");
      setShowProfile(false);
      setShowLogin(false);
      setShowDeleteConfirm(false);
      setDeletePw("");
    } catch (err) {
      setEditError(err.message);
    } finally {
      setDeleteLoading(false);
    }
  }

  function handleLogoClick() {
    navigate("/");
  }

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) {
      setShowProfile(false);
      setShowDeleteConfirm(false);
      setDeletePw("");
    }
  }

  function handleWithdrawCancel() {
    setShowDeleteConfirm(false);
    setDeletePw("");
    setShowProfile(false);
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
          onClick={handleLogoClick}
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
          <select
            value={i18n.language}
            onChange={e => {
              i18n.changeLanguage(e.target.value);
              if (onLangChange) onLangChange(e.target.value);
            }}
            style={selectStyle}
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>{lang.label}</option>
            ))}
          </select>
          {user && (
            <>
              <span
                style={{
                  fontWeight: 700,
                  color: "#1976ed",
                  marginRight: 6,
                  whiteSpace: "nowrap",
                  userSelect: "none",
                }}
              >
                {nicknameLoading ? "닉네임 불러오는 중..." : (nickname || "닉네임 없음")}
              </span>
              <button style={myInfoButtonStyle} onClick={() => setShowProfile(true)}>내정보수정</button>
              <button style={logoutButtonStyle} onClick={handleLogout}>{t("logout")}</button>
              {showProfile && (
                <div style={modalOverlayStyle} onClick={handleOverlayClick}>
                  <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
                    <div style={{ fontWeight: 800, fontSize: 21, marginBottom: 18, textAlign: "center" }}>
                      내 정보 수정
                    </div>
                    <input
                      type="text"
                      value={editNickname}
                      onChange={e => setEditNickname(e.target.value)}
                      placeholder="닉네임"
                      style={modalInputStyle}
                      disabled={editLoading}
                    />
                    <button style={modalProfileButtonStyle} onClick={handleNicknameChange} disabled={editLoading}>
                      {editLoading ? "변경 중..." : "닉네임 변경"}
                    </button>
                    <button style={modalGrayButtonStyle} onClick={handlePasswordChange} disabled={editLoading}>
                      비밀번호 변경(메일 전송)
                    </button>
                    <button style={modalDeleteButtonStyle} onClick={() => setShowDeleteConfirm(true)} disabled={editLoading}>
                      회원탈퇴
                    </button>
                    {editError && (
                      <div style={{ color: "red", fontSize: 15, textAlign: "center", marginTop: 7 }}>
                        {editError}
                      </div>
                    )}
                    <button style={modalCloseButtonStyle} onClick={() => setShowProfile(false)} disabled={editLoading}>
                      닫기
                    </button>
                  </div>
                  {showDeleteConfirm && (
                    <div style={deleteModalOverlayStyle} onClick={handleOverlayClick}>
                      <div style={deleteModalContentStyle} onClick={e => e.stopPropagation()}>
                        <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 12 }}>
                          정말로 회원탈퇴 하시겠습니까?<br />비밀번호를 한 번 더 입력하세요.
                        </div>
                        <input
                          type="password"
                          value={deletePw}
                          onChange={e => setDeletePw(e.target.value)}
                          placeholder="비밀번호"
                          style={modalInputStyle}
                          disabled={deleteLoading}
                        />
                        <button
                          style={modalDeleteButtonStyle}
                          onClick={handleDeleteAccount}
                          disabled={deleteLoading || !deletePw}
                        >
                          {deleteLoading ? "탈퇴 중..." : "회원탈퇴"}
                        </button>
                        <button style={modalCloseButtonStyle} onClick={handleWithdrawCancel} disabled={deleteLoading}>
                          취소
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
          {!user && (
            <>
              <button style={primaryButtonStyle} onClick={() => setShowLogin(true)}>{t("login")}</button>
              {showLogin && (
                <div style={modalOverlayStyle} onClick={() => setShowLogin(false)}>
                  <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
                    <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 12, textAlign: "center" }}>{t("로그인")}</div>
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
                    <div style={{ marginTop: 14, width: "100%", textAlign: "center" }}>
                      <a href="/signup" style={{ color: "#1976ed", marginBottom: 7, display: "block" }}>회원가입</a>
                      <a href="/find-id" style={{ color: "#555", marginBottom: 5, display: "block" }}>아이디 찾기</a>
                      <a href="/find-pw" style={{ color: "#555", display: "block" }}>비밀번호 찾기</a>
                    </div>
                    <button style={modalCloseButtonStyle} onClick={() => setShowLogin(false)}>
                      닫기
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}

// 스타일(생략)
const adminButtonStyle = (bgColor, color = "#fff") => ({
  background: bgColor,
  color,
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
const myInfoButtonStyle = {
  background: "#e7eefd",
  color: "#1976ed",
  border: "none",
  borderRadius: 8,
  fontWeight: 700,
  padding: "7px 10px",
  fontSize: 15,
  cursor: "pointer",
  userSelect: "none",
  marginRight: 3,
  whiteSpace: "nowrap",
  transition: "background-color 0.2s ease",
  outline: "none",
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
  margin: 0,
  padding: 0,
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
  margin: 0,
};
const deleteModalOverlayStyle = {
  position: "fixed",
  left: 0,
  top: 0,
  width: "100vw",
  height: "100vh",
  background: "rgba(0,0,0,0.4)",
  zIndex: 10000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
const deleteModalContentStyle = {
  background: "#fff",
  borderRadius: 12,
  padding: "28px 24px",
  minWidth: 320,
  maxWidth: 360,
  width: "100%",
  boxShadow: "0 4px 24px rgba(0,0,0,0.22)",
  display: "flex",
  flexDirection: "column",
  gap: 10,
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
  boxSizing: "border-box",
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
const modalProfileButtonStyle = {
  width: "100%",
  background: "#1976ed",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  fontWeight: 800,
  fontSize: 16,
  padding: "10px 0",
  margin: "7px 0 0",
  cursor: "pointer",
};
const modalGrayButtonStyle = {
  width: "100%",
  background: "#bbb",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  fontWeight: 700,
  fontSize: 15,
  padding: "8px 0",
  margin: "10px 0 0",
  cursor: "pointer",
};
const modalDeleteButtonStyle = {
  width: "100%",
  background: "#e14444",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  fontWeight: 700,
  fontSize: 15,
  padding: "10px 0",
  margin: "14px 0 0",
  cursor: "pointer",
};
