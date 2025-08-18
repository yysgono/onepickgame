import React, { useRef, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabaseClient";

function isValidNickname(nickname) {
  if (!nickname) return false;
  const regex = /^[\uAC00-\uD7A3\w-]+$/;
  if (!regex.test(nickname)) return false;
  if (nickname.replace(/[\uAC00-\uD7A3]/g, "**").length < 3) return false;
  return true;
}

const languages = [
  { code: "en", label: "English" },
  { code: "ko", label: "한국어" },
  { code: "ja", label: "日本語" },
  { code: "zh", label: "简体中文" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "vi", label: "Tiếng Việt" },
  { code: "de", label: "Deutsch" },
  { code: "ru", label: "Русский" },
  { code: "id", label: "Bahasa Indonesia" },
  { code: "pt", label: "Português" },
  { code: "hi", label: "हिन्दी" },
  { code: "tr", label: "Türkçe" },
  { code: "th", label: "ภาษาไทย" },
  { code: "ar", label: "العربية" },
  { code: "bn", label: "বাংলা" },
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

  const [showProfile, setShowProfile] = useState(false);
  const [editNickname, setEditNickname] = useState(nickname || "");
  const [editError, setEditError] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    setEditNickname(nickname || "");
  }, [nickname]);

  useEffect(() => {
    if (!user) return setProfile(null);
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        setProfile(data || null);
      });
  }, [user, showProfile]);

  function handleLogout() {
    supabase.auth.signOut().then(() => {
      setUser(null);
      setNickname("");
      setShowProfile(false);
    });
  }

  async function handleNicknameChange() {
    setEditError("");
    const trimName = editNickname.trim();
    if (!isValidNickname(trimName)) {
      setEditError(t("nickname_rule"));
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
      setEditError(error.message || t("nickname_change_fail"));
      return;
    }
    setNickname(trimName);
    setShowProfile(false);
    alert(t("nickname_changed"));
  }

  async function handlePasswordChange() {
    setEditError("");
    if (!user?.email) {
      setEditError(t("no_email_info"));
      return;
    }
    setEditLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(user.email);
    setEditLoading(false);
    if (error) {
      setEditError(error.message || t("pw_mail_send_fail"));
      return;
    }
    alert(t("pw_mail_sent"));
  }

  async function handleWithdrawalRequest() {
    setEditError("");
    setWithdrawLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ withdrawal_requested_at: new Date().toISOString() })
      .eq("id", user.id);
    setWithdrawLoading(false);
    if (error) return setEditError(`${t("withdraw_fail")}: ${error.message}`);
    alert(`${t("withdraw_requested")}\n${t("withdraw_in_week")}`);
    setProfile((prev) => ({
      ...prev,
      withdrawal_requested_at: new Date().toISOString(),
    }));
    setShowProfile(false);
  }

  async function handleCancelWithdrawal() {
    setEditError("");
    setCancelLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ withdrawal_requested_at: null })
      .eq("id", user.id);
    setCancelLoading(false);
    if (error) return setEditError(`${t("cancel_fail")}: ${error.message}`);
    alert(t("withdraw_canceled"));
    setProfile((prev) => ({ ...prev, withdrawal_requested_at: null }));
    setShowProfile(false);
  }

  // ✅ 기본 언어를 'en'으로 통일 + 변형 코드(en-US 등) 안전 처리
  const currentLang = (i18n.language || "en").split("-")[0];

  // 로고 클릭 시: 전체 새로고침 없이 언어 홈으로 이동 (SPA 내 라우팅)
  function handleLogoClick() {
    navigate(`/${currentLang}`);
  }
  function handleMyWorldcup() {
    navigate(`/${currentLang}/my-worldcups`);
  }
  function handleRecentWorldcup() {
    navigate(`/${currentLang}/recent-worldcups`);
  }

  const logoImgUrl = "/onepick2.png";
  const headerBgUrl = "/onepick3.png";

  const darkBlue = "#171C27";
  const blueMain = "#1976ed";
  const blueGradient = "linear-gradient(90deg,#2999ff,#236de8 100%)";
  const blueNeon = "0 0 16px #2999ff88, 0 2px 12px #1976ed33";
  const gold = "#ffbe3b";

  const adminButtonStyle = (bgColor = darkBlue, color = "#fff") => ({
    background: bgColor,
    color,
    borderRadius: 8,
    fontWeight: 800,
    padding: "7px 17px",
    border: "none",
    cursor: "pointer",
    fontSize: 15,
    whiteSpace: "nowrap",
    transition: "background .15s, box-shadow .15s, color .12s",
    boxShadow: "0 2px 10px #1976ed33",
    letterSpacing: "-0.2px",
    outline: "none",
  });

  const statButtonStyle = {
    background: gold,
    color: "#222",
    border: "none",
    borderRadius: 8,
    fontWeight: 800,
    padding: "7px 17px",
    fontSize: 15,
    boxShadow: "0 0 7px #fffbe34a",
    cursor: "pointer",
    outline: "none",
    letterSpacing: "-0.1px",
  };

  const mainButtonStyle = {
    background: blueGradient,
    color: "#fff",
    border: "none",
    borderRadius: 10,
    fontWeight: 900,
    padding: "8px 22px",
    fontSize: 16,
    boxShadow: blueNeon,
    letterSpacing: "0.03em",
    transition: "background .17s, box-shadow .13s, color .12s",
    cursor: "pointer",
    whiteSpace: "nowrap",
    outline: "none",
  };

  const infoButtonStyle = {
    background: "rgba(30,43,82,0.94)",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontWeight: 700,
    padding: "8px 17px",
    fontSize: 15,
    boxShadow: "0 0 7px #1976ed2d",
    transition: "background .14s, color .13s, box-shadow .12s",
    outline: "none",
    marginRight: 3,
    whiteSpace: "nowrap",
  };

  const logoutButtonStyle = {
    background: "#232c40",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontWeight: 700,
    padding: "7px 15px",
    fontSize: 15,
    boxShadow: "0 0 9px #157be940",
    cursor: "pointer",
    outline: "none",
    transition: "background .12s, color .13s",
  };

  const selectStyle = {
    padding: "7px 13px",
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

  // ---- Modal Styles ----
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
    position: "fixed",
    top: "110px",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 10001,
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
    background: blueMain,
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

  return (
    <header
      style={{
        width: "100%",
        background: `linear-gradient(90deg,rgba(20,23,32,0.92) 80%,rgba(20,26,44,0.82)),url('${headerBgUrl}') center/cover no-repeat`,
        boxShadow: "0 2px 22px #000a, 0 1.5px 6px #1e2242cc",
        borderBottom: "4px solid #1976ed",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        padding: "0 0 12px 0",
        backdropFilter: "blur(2.5px)",
        WebkitBackdropFilter: "blur(2.5px)",
      }}
    >
      {/* 로고/텍스트 영역 */}
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "10px 0 7px 0",
          cursor: "pointer",
          userSelect: "none",
        }}
        onClick={handleLogoClick}
      >
        <img
          src={logoImgUrl}
          alt={t("onepick_logo_alt", "OnePickGame logo")}
          style={{
            width: 42,
            height: 42,
            borderRadius: "50%",
            border: "2.2px solid #1976ed",
            background: "rgba(24,29,42,0.9)",
            marginRight: 8,
            filter: "drop-shadow(0 0 10px #00c8ffbb)",
            verticalAlign: "middle",
          }}
          draggable={false}
        />
        <span
          style={{
            fontWeight: 900,
            fontSize: 23,
            fontFamily: "'Orbitron', 'Pretendard', 'Montserrat', sans-serif",
            color: "#fff",
            textShadow: "0 2px 16px #157be9cc, 0 0.5px 2.5px #fff",
            letterSpacing: "1.2px",
            lineHeight: 1.13,
            marginTop: 2,
          }}
        >
          {t("onepick_brand", "One Pick Game")}
        </span>
      </div>
      {/* 버튼/메뉴 */}
      <div
        style={{
          width: "100%",
          maxWidth: 1800,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: "10px 12px",
          padding: "0 12px",
          minHeight: 48,
        }}
      >
        {isAdmin && (
          <>
            <button
              style={adminButtonStyle("#1976ed")}
              onClick={() => navigate(`/${currentLang}/admin`)}
            >
              {t("dashboard")}
            </button>
            <button
              style={statButtonStyle}
              onClick={() => navigate(`/${currentLang}/admin-stats`)}
            >
              {t("stats")}
            </button>
            <button style={adminButtonStyle()} onClick={onBackup}>
              {t("backupAll")}
            </button>
            <button
              style={adminButtonStyle("#253253")}
              onClick={() => inputRef.current && inputRef.current.click()}
            >
              {t("restore")}
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
        <button style={mainButtonStyle} onClick={onMakeWorldcup}>
          {t("makeWorldcup")}
        </button>
        {user && (
          <button style={infoButtonStyle} onClick={handleMyWorldcup}>
            {t("my_worldcups")}
          </button>
        )}
        <button style={infoButtonStyle} onClick={handleRecentWorldcup}>
          {t("recent_worldcups")}
        </button>
        {/* ----------- 언어 선택 ----------- */}
        <select
          value={(i18n.language || "en").split("-")[0]}
          onChange={(e) => {
            const lng = e.target.value;
            i18n.changeLanguage(lng);
            if (onLangChange) onLangChange(lng);
            localStorage.setItem("onepickgame_lang", lng);
            navigate(`/${lng}`);
          }}
          style={selectStyle}
          aria-label={t("language_select", "Select language")}
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.label}
            </option>
          ))}
        </select>
        {/* ----------- 여기까지 ----------- */}
        {user ? (
          <>
            <span
              style={{
                fontWeight: 700,
                color: "#22dcff",
                margin: "0 6px 0 0",
                whiteSpace: "nowrap",
                userSelect: "none",
                textShadow: "0 0 6px #00e5ff88, 0 0.5px 2.5px #fff",
                fontFamily: "'Pretendard','Orbitron',sans-serif",
                fontSize: 15,
              }}
            >
              {nicknameLoading ? t("loading_nickname") : nickname || t("no_nickname")}
            </span>
            <button style={infoButtonStyle} onClick={() => setShowProfile(true)}>
              {t("edit_profile")}
            </button>
            <button style={logoutButtonStyle} onClick={handleLogout}>
              {t("logout")}
            </button>
            {showProfile && (
              <div style={modalOverlayStyle}>
                <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
                  <div
                    style={{ fontWeight: 800, fontSize: 21, marginBottom: 18, textAlign: "center" }}
                  >
                    {t("edit_profile")}
                  </div>
                  <div style={{ width: "100%" }}>
                    <div style={{ marginBottom: 10, fontSize: 15 }}>
                      <b>{t("email")}:</b> {user.email}
                    </div>
                    <div style={{ marginBottom: 10, fontSize: 15 }}>
                      <b>{t("nickname")}:</b>
                      <input
                        type="text"
                        value={editNickname}
                        onChange={(e) => setEditNickname(e.target.value)}
                        style={modalInputStyle}
                        placeholder={t("nickname")}
                        maxLength={20}
                        disabled={editLoading}
                      />
                      <button
                        style={modalProfileButtonStyle}
                        onClick={handleNicknameChange}
                        disabled={editLoading}
                      >
                        {editLoading ? t("changing") : t("change_nickname")}
                      </button>
                    </div>
                    <button
                      style={modalGrayButtonStyle}
                      onClick={handlePasswordChange}
                      disabled={editLoading}
                    >
                      {t("send_pw_reset")}
                    </button>
                    {profile?.withdrawal_requested_at ? (
                      <button
                        style={modalGrayButtonStyle}
                        onClick={handleCancelWithdrawal}
                        disabled={cancelLoading}
                      >
                        {cancelLoading ? t("canceling") : t("withdraw_cancel")}
                      </button>
                    ) : (
                      <button
                        style={modalDeleteButtonStyle}
                        onClick={handleWithdrawalRequest}
                        disabled={withdrawLoading}
                      >
                        {withdrawLoading ? t("changing") : t("withdraw")}
                      </button>
                    )}
                    {editError && (
                      <div style={{ color: "red", marginTop: 7, fontSize: 14, textAlign: "center" }}>
                        {editError}
                      </div>
                    )}
                  </div>
                  <button style={modalCloseButtonStyle} onClick={() => setShowProfile(false)}>
                    {t("close")}
                  </button>
                  <button
                    style={{
                      position: "absolute",
                      top: 10,
                      right: 10,
                      width: 32,
                      height: 32,
                      background: "transparent",
                      border: "none",
                      color: "#555",
                      fontSize: 28,
                      cursor: "pointer",
                      zIndex: 10,
                    }}
                    aria-label={t("close")}
                    tabIndex={0}
                    onClick={() => setShowProfile(false)}
                  >
                    <svg width="22" height="22" viewBox="0 0 22 22">
                      <line
                        x1="4"
                        y1="4"
                        x2="18"
                        y2="18"
                        stroke="#333"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                      />
                      <line
                        x1="18"
                        y1="4"
                        x2="4"
                        y2="18"
                        stroke="#333"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <button style={mainButtonStyle} onClick={() => navigate(`/${currentLang}/login`)}>
            {t("login")}
          </button>
        )}
      </div>
    </header>
  );
}
