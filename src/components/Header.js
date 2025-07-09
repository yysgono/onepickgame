import React, { useRef, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabaseClient";

// 닉네임 유효성 검사
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
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [editNickname, setEditNickname] = useState(nickname || "");
  const [editError, setEditError] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => { setEditNickname(nickname || ""); }, [nickname]);
  useEffect(() => {
    if (!user) return setProfile(null);
    setProfileLoading(true);
    supabase.from("profiles").select("*").eq("id", user.id).single().then(({ data }) => {
      setProfile(data || null);
      setProfileLoading(false);
    });
  }, [user, showProfile]);

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
  async function handleWithdrawalRequest() {
    setEditError(""); setWithdrawLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ withdrawal_requested_at: new Date().toISOString() })
      .eq("id", user.id);
    setWithdrawLoading(false);
    if (error) return setEditError("탈퇴 신청 실패: " + error.message);
    alert("탈퇴 신청이 접수되었습니다!\n일주일 이내 처리 예정입니다.");
    setProfile((prev) => ({ ...prev, withdrawal_requested_at: new Date().toISOString() }));
    setShowProfile(false);
  }
  async function handleCancelWithdrawal() {
    setEditError(""); setCancelLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ withdrawal_requested_at: null })
      .eq("id", user.id);
    setCancelLoading(false);
    if (error) return setEditError("취소 실패: " + error.message);
    alert("탈퇴 신청이 취소되었습니다!");
    setProfile((prev) => ({ ...prev, withdrawal_requested_at: null }));
    setShowProfile(false);
  }
  function handleLogoClick() { navigate("/"); }
  function handleWithdrawCancel() { setShowProfile(false); }
  function handleMyWorldcup() { navigate("/my-worldcups"); }
  function handleRecentWorldcup() { navigate("/recent-worldcups"); }

  // 이미지 경로
  const logoImgUrl = "/onepick2.png"; // 반드시 public 폴더에
  const headerBgUrl = "/onepick3.png"; // public 폴더에

  return (
    <header
      style={{
        width: "100%",
        minHeight: 78,
        position: "sticky",
        top: 0,
        zIndex: 1000,
        padding: 0,
        margin: 0,
        background: `linear-gradient(90deg,rgba(20,23,32,0.92) 80%,rgba(20,26,44,0.82)),url('${headerBgUrl}') center/cover no-repeat`,
        boxShadow: "0 2px 22px #000a, 0 1.5px 6px #1e2242cc",
        backdropFilter: "blur(2.5px)",
        WebkitBackdropFilter: "blur(2.5px)",
        borderBottom: "4px solid #1976ed",
      }}
    >
      <div
        style={{
          maxWidth: 1800,
          margin: "0 auto",
          padding: "0 26px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          minHeight: 78,
          gap: 14,
        }}
      >
        {/* ----- 로고+텍스트 ----- */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 13,
            cursor: "pointer",
            userSelect: "none",
            minWidth: 150,
          }}
          onClick={handleLogoClick}
        >
          <img
            src={logoImgUrl}
            alt="OnePick Logo"
            style={{
              width: 49,
              height: 49,
              filter: "drop-shadow(0 0 10px #00c8ffbb) drop-shadow(0 0 2.5px #fff)",
              borderRadius: "50%",
              background: "rgba(24,29,42,0.9)",
              border: "2.4px solid #1976ed",
              marginRight: 5,
              transition: "box-shadow .18s",
            }}
            draggable={false}
          />
          <span
            style={{
              fontWeight: 900,
              fontSize: 29,
              fontFamily: "'Orbitron', 'Pretendard', 'Montserrat', sans-serif",
              letterSpacing: "1.3px",
              color: "#fff",
              textShadow: "0 2px 16px #157be9cc, 0 0.5px 2.5px #fff",
              marginTop: 2,
              transition: "color .16s",
              whiteSpace: "nowrap",
              lineHeight: 1.13,
            }}
          >
            OnePickGame
          </span>
        </div>
        {/* ----- 우측 메뉴/버튼 ----- */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 11,
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
          {user && (
            <button style={myInfoButtonStyle} onClick={handleMyWorldcup}>내가 만든 월드컵</button>
          )}
          <button style={myInfoButtonStyle} onClick={handleRecentWorldcup}>최근에 본 월드컵</button>
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
                  color: "#22dcff",
                  marginRight: 6,
                  whiteSpace: "nowrap",
                  userSelect: "none",
                  textShadow: "0 0 6px #00e5ff88, 0 0.5px 2.5px #fff",
                  fontFamily: "'Pretendard','Orbitron',sans-serif"
                }}
              >
                {nicknameLoading ? "닉네임 불러오는 중..." : (nickname || "닉네임 없음")}
              </span>
              <button style={myInfoButtonStyle} onClick={() => setShowProfile(true)}>내정보수정</button>
              <button style={logoutButtonStyle} onClick={handleLogout}>{t("logout")}</button>
              {showProfile && (
                <div style={modalOverlayStyle}>
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
                    {/* --- 탈퇴신청 & 취소 --- */}
                    {profile?.withdrawal_requested_at ? (
                      <div style={{ width: "100%" }}>
                        <div style={{ color: "#e14444", fontSize: 15, textAlign: "center", margin: "8px 0" }}>
                          탈퇴 신청 상태입니다.<br />
                          신청일: {profile.withdrawal_requested_at && new Date(profile.withdrawal_requested_at).toLocaleString()}<br />
                          탈퇴 신청을 취소하려면 아래 버튼을 눌러주세요.
                        </div>
                        <button
                          style={modalDeleteButtonStyle}
                          onClick={handleCancelWithdrawal}
                          disabled={cancelLoading}
                        >
                          {cancelLoading ? "취소 중..." : "탈퇴 신청 취소"}
                        </button>
                        <div style={{ color: "#888", fontSize: 13, textAlign: "center", marginTop: 10 }}>
                          탈퇴는 일주일 이내 처리됩니다.<br />언제든 취소 가능합니다.
                        </div>
                      </div>
                    ) : (
                      <div style={{ width: "100%" }}>
                        <button
                          style={modalDeleteButtonStyle}
                          onClick={handleWithdrawalRequest}
                          disabled={withdrawLoading}
                        >
                          {withdrawLoading ? "신청 중..." : "회원탈퇴 신청"}
                        </button>
                        <div style={{ color: "#888", fontSize: 13, textAlign: "center", marginTop: 10 }}>
                          탈퇴 신청 후 7일 이내 처리됩니다.<br />
                          그동안 언제든 취소할 수 있습니다.
                        </div>
                      </div>
                    )}
                    {editError && (
                      <div style={{ color: "red", fontSize: 15, textAlign: "center", marginTop: 7 }}>
                        {editError}
                      </div>
                    )}
                    <button style={modalCloseButtonStyle} onClick={handleWithdrawCancel}>
                      닫기
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
          {!user && (
            <>
              <button style={primaryButtonStyle} onClick={() => setShowLogin(true)}>{t("login")}</button>
              {showLogin && (
                <div style={modalOverlayStyle}>
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
      {/* 네온 효과, 폰트, 애니 추가 */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&display=swap');
          header {
            animation: headerNeonIn 1.1s cubic-bezier(.35,1,.4,1) 0s 1;
          }
          @keyframes headerNeonIn {
            from { opacity: 0; filter: blur(9px); }
            to { opacity: 1; filter: blur(0); }
          }
        `}
      </style>
    </header>
  );
}

// ------ 스타일
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
  background: "linear-gradient(90deg,#2999ff,#236de8 100%)",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  fontWeight: 700,
  padding: "7px 14px",
  fontSize: 15,
  cursor: "pointer",
  userSelect: "none",
  whiteSpace: "nowrap",
  boxShadow: "0 0 18px #2999ff12, 0 1.5px 6px #1976ed30",
  transition: "background-color 0.2s,box-shadow .14s",
};
const myInfoButtonStyle = {
  background: "rgba(22, 34, 69, 0.92)",
  color: "#22dcff",
  border: "none",
  borderRadius: 8,
  fontWeight: 700,
  padding: "7px 10px",
  fontSize: 15,
  cursor: "pointer",
  userSelect: "none",
  marginRight: 3,
  whiteSpace: "nowrap",
  boxShadow: "0 0 8px #15d1ff1a",
  transition: "background-color 0.18s,box-shadow .14s",
  outline: "none",
};
const selectStyle = {
  padding: "6px 10px",
  borderRadius: 8,
  fontWeight: 600,
  fontSize: 15,
  minWidth: 100,
  background: "#222f45",
  color: "#fff",
  border: "1px solid #1258cc",
  cursor: "pointer",
  userSelect: "none",
  outline: "none",
  boxShadow: "0 0 7px #157be94a",
};
const logoutButtonStyle = {
  fontSize: 13,
  fontWeight: 600,
  background: "#232c40",
  color: "#18ffff",
  border: "none",
  borderRadius: 8,
  padding: "6px 12px",
  cursor: "pointer",
  userSelect: "none",
  boxShadow: "0 0 10px #11ccff22",
  transition: "background .15s",
  outline: "none",
};
const modalOverlayStyle = {
  position: "fixed",
  left: 0,
  top: 0,
  width: "100vw",
  height: "100vh",
  background: "rgba(0,0,0,0.32)",
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
const modalInputStyle = {
  width: "100%",
  padding: "10px 11px",
  borderRadius: 7,
  border: "1.2px solid #bbb",
  fontSize: 16,
  marginBottom: 9,
  boxSizing: "border-box",
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
