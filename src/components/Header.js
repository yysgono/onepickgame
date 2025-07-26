import React, { useRef, useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabaseClient";
import "./header.css";

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

  useEffect(() => setEditNickname(nickname || ""), [nickname]);

  useEffect(() => {
    if (!user) return setProfile(null);
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()
      .then(({ data }) => setProfile(data || null));
  }, [user, showProfile]);

  const handleLogout = useCallback(() => {
    supabase.auth.signOut().then(() => {
      setUser(null);
      setNickname("");
      setShowProfile(false);
    });
  }, [setUser, setNickname]);

  const handleNicknameChange = async () => {
    setEditError("");
    const trimName = editNickname.trim();
    if (!isValidNickname(trimName)) {
      setEditError(t("nickname_rule"));
      return;
    }
    setEditLoading(true);
    const { data: exist } = await supabase.from("profiles").select("id").eq("id", user.id).single();
    let error;
    if (exist) {
      ({ error } = await supabase.from("profiles").update({ nickname: trimName }).eq("id", user.id));
    } else {
      ({ error } = await supabase.from("profiles").insert([{ id: user.id, nickname: trimName }]));
    }
    setEditLoading(false);
    if (error) {
      setEditError(error.message || t("nickname_change_fail"));
      return;
    }
    setNickname(trimName);
    setShowProfile(false);
    alert(t("nickname_changed"));
  };

  const handlePasswordChange = async () => {
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
  };

  const handleWithdrawalRequest = async () => {
    setEditError("");
    setWithdrawLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ withdrawal_requested_at: new Date().toISOString() })
      .eq("id", user.id);
    setWithdrawLoading(false);
    if (error) return setEditError(`${t("withdraw_fail")}: ${error.message}`);
    alert(`${t("withdraw_requested")}\n${t("withdraw_in_week")}`);
    setProfile((prev) => ({ ...prev, withdrawal_requested_at: new Date().toISOString() }));
    setShowProfile(false);
  };

  const handleCancelWithdrawal = async () => {
    setEditError("");
    setCancelLoading(true);
    const { error } = await supabase.from("profiles").update({ withdrawal_requested_at: null }).eq("id", user.id);
    setCancelLoading(false);
    if (error) return setEditError(`${t("cancel_fail")}: ${error.message}`);
    alert(t("withdraw_canceled"));
    setProfile((prev) => ({ ...prev, withdrawal_requested_at: null }));
    setShowProfile(false);
  };

  return (
    <header
      className="header-container"
      style={{
        backgroundImage:
          "linear-gradient(90deg, rgba(20,23,32,0.92) 80%, rgba(20,26,44,0.82)), url('/onepick3.png')",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
      }}
    >
      {/* 로고 */}
      <div className="header-logo" onClick={() => navigate("/")}>
        <img src="/onepick2.png" alt="OnePick Logo" draggable={false} />
        <span>One Pick Game</span>
      </div>

      {/* 메뉴 */}
      <div className="header-buttons">
        {isAdmin && (
          <>
            <button className="header-admin-btn" onClick={() => navigate("/admin")}>
              {t("dashboard")}
            </button>
            <button className="header-stat-btn" onClick={() => navigate("/admin-stats")}>
              {t("stats")}
            </button>
            <button className="header-admin-btn" onClick={onBackup}>
              {t("backupAll")}
            </button>
            <button
              className="header-admin-btn"
              style={{ background: "#253253" }}
              onClick={() => inputRef.current.click()}
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
        <button className="header-main-btn" onClick={onMakeWorldcup}>
          {t("makeWorldcup")}
        </button>
        {user && (
          <button className="header-info-btn" onClick={() => navigate("/my-worldcups")}>
            {t("my_worldcups")}
          </button>
        )}
        <button className="header-info-btn" onClick={() => navigate("/recent-worldcups")}>
          {t("recent_worldcups")}
        </button>

        {/* 언어 선택 */}
        <select
          className="header-lang-select"
          value={i18n.language}
          onChange={(e) => {
            const lng = e.target.value;
            i18n.changeLanguage(lng);
            if (onLangChange) onLangChange(lng);
            localStorage.setItem("onepickgame_lang", lng);
            window.location.href = "/";
          }}
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.label}
            </option>
          ))}
        </select>

        {/* 로그인/유저 */}
        {user ? (
          <>
            <span className="header-nickname">
              {nicknameLoading ? t("loading_nickname") : nickname || t("no_nickname")}
            </span>
            <button className="header-info-btn" onClick={() => setShowProfile(true)}>
              {t("edit_profile")}
            </button>
            <button className="header-logout-btn" onClick={handleLogout}>
              {t("logout")}
            </button>
          </>
        ) : (
          <button className="header-main-btn" onClick={() => navigate("/login")}>
            {t("login")}
          </button>
        )}
      </div>

      {/* 프로필 모달 */}
      {showProfile && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{t("edit_profile")}</h2>
            <div>
              <b>{t("email")}:</b> {user.email}
            </div>
            <input
              type="text"
              value={editNickname}
              onChange={(e) => setEditNickname(e.target.value)}
              placeholder={t("nickname")}
              maxLength={20}
              disabled={editLoading}
            />
            <button onClick={handleNicknameChange} disabled={editLoading}>
              {editLoading ? t("changing") : t("change_nickname")}
            </button>
            <button onClick={handlePasswordChange}>{t("send_pw_reset")}</button>
            {profile?.withdrawal_requested_at ? (
              <button onClick={handleCancelWithdrawal} disabled={cancelLoading}>
                {cancelLoading ? t("canceling") : t("withdraw_cancel")}
              </button>
            ) : (
              <button onClick={handleWithdrawalRequest} disabled={withdrawLoading}>
                {withdrawLoading ? t("changing") : t("withdraw")}
              </button>
            )}
            {editError && <p style={{ color: "red" }}>{editError}</p>}
            <button onClick={() => setShowProfile(false)}>{t("close")}</button>
          </div>
        </div>
      )}
    </header>
  );
}
