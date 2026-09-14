import { Link } from "react-router-dom";
import "../registerHeaderTranslations";
import "./OnePickHeader.css";
import "../registerPresetTranslations";
// src/components/Header.js
import React, { useRef, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../utils/supabaseClient";

function isValidNickname(nickname) {
  if (!nickname) return false;

  const regex = /^[\uAC00-\uD7A3\w-]+$/;

  if (!regex.test(nickname)) return false;

  if (
    nickname.replace(/[\uAC00-\uD7A3]/g, "**").length < 3
  ) {
    return false;
  }

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
  isAdmin,
  user,
  nickname,
  nicknameLoading,
  setUser,
  setNickname,
}) {
  const { t, i18n } = useTranslation();

  const navigate = useNavigate();
  const location = useLocation();
  const inputRef = useRef();

  const [showProfile, setShowProfile] =
    useState(false);

  const [editNickname, setEditNickname] =
    useState(nickname || "");

  const [editError, setEditError] =
    useState("");

  const [editLoading, setEditLoading] =
    useState(false);

  const [profile, setProfile] =
    useState(null);

  const [
    withdrawLoading,
    setWithdrawLoading,
  ] = useState(false);

  const [
    cancelLoading,
    setCancelLoading,
  ] = useState(false);

  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined"
      ? window.innerWidth < 600
      : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 600);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setEditNickname(nickname || "");
  }, [nickname]);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }

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

    const trimName =
      editNickname.trim();

    if (!isValidNickname(trimName)) {
      setEditError(
        t("nickname_rule")
      );

      return;
    }

    setEditLoading(true);

    const { data: exist } =
      await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single();

    let error;

    if (exist) {
      ({ error } =
        await supabase
          .from("profiles")
          .update({
            nickname: trimName,
          })
          .eq("id", user.id));
    } else {
      ({ error } =
        await supabase
          .from("profiles")
          .insert([
            {
              id: user.id,
              nickname: trimName,
            },
          ]));
    }

    setEditLoading(false);

    if (error) {
      setEditError(
        error.message ||
          t("nickname_change_fail")
      );

      return;
    }

    setNickname(trimName);
    setShowProfile(false);

    alert(t("nickname_changed"));
  }

  async function handlePasswordChange() {
    setEditError("");

    if (!user?.email) {
      setEditError(
        t("no_email_info")
      );

      return;
    }

    setEditLoading(true);

    const { error } =
      await supabase.auth
        .resetPasswordForEmail(
          user.email
        );

    setEditLoading(false);

    if (error) {
      setEditError(
        error.message ||
          t("pw_mail_send_fail")
      );

      return;
    }

    alert(t("pw_mail_sent"));
  }

  async function handleWithdrawalRequest() {
    setEditError("");
    setWithdrawLoading(true);

    const { error } =
      await supabase
        .from("profiles")
        .update({
          withdrawal_requested_at:
            new Date().toISOString(),
        })
        .eq("id", user.id);

    setWithdrawLoading(false);

    if (error) {
      setEditError(
        `${t("withdraw_fail")}: ${error.message}`
      );

      return;
    }

    alert(
      `${t("withdraw_requested")}\n${t(
        "withdraw_in_week"
      )}`
    );

    setProfile((prev) => ({
      ...prev,

      withdrawal_requested_at:
        new Date().toISOString(),
    }));

    setShowProfile(false);
  }

  async function handleCancelWithdrawal() {
    setEditError("");
    setCancelLoading(true);

    const { error } =
      await supabase
        .from("profiles")
        .update({
          withdrawal_requested_at:
            null,
        })
        .eq("id", user.id);

    setCancelLoading(false);

    if (error) {
      setEditError(
        `${t("cancel_fail")}: ${error.message}`
      );

      return;
    }

    alert(t("withdraw_canceled"));

    setProfile((prev) => ({
      ...prev,

      withdrawal_requested_at:
        null,
    }));

    setShowProfile(false);
  }

  const currentLang =
    (
      i18n.language ||
      "en"
    ).split("-")[0];

  function handleLogoClick() {
    const homePath =
      `/${currentLang}`;

    if (
      location.pathname ===
      homePath
    ) {
      navigate(
        homePath,
        {
          replace: true,
        }
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } else {
      navigate(homePath);
    }
  }

  function handleBlog() {
    navigate(
      `/${currentLang}/blog`
    );
  }

  function changeLanguageAndKeepPath(
    lng
  ) {
    try {
      i18n.changeLanguage(lng);

      if (
        typeof onLangChange ===
        "function"
      ) {
        onLangChange(lng);
      }

      localStorage.setItem(
        "onepickgame_lang",
        lng
      );

      const {
        pathname,
        search,
        hash,
      } = location;

      const parts =
        pathname
          .split("/")
          .filter(Boolean);

      if (
        parts.length > 0 &&
        /^[a-z]{2}$/.test(
          parts[0]
        )
      ) {
        parts[0] = lng;
      } else {
        parts.unshift(lng);
      }

      const newPath =
        "/" + parts.join("/");

      navigate(
        newPath +
          (search || "") +
          (hash || ""),
        {
          replace: true,
        }
      );
    } catch {
      navigate(
        `/${lng}`,
        {
          replace: true,
        }
      );
    }
  }

  const logoImgUrl =
    "/onepick2.png";

  const blueMain = "#6650d8";

  const modalOverlayStyle = {
    position:
      "fixed",

    left: 0,
    top: 0,

    width:
      "100vw",

    height:
      "100vh",

    background:
      "rgba(0,0,0,0.32)",

    zIndex:
      9999,

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    margin: 0,
    padding: 0,
  };

  const modalContentStyle = {
    background:
      "#ffffff",

    color:
      "#202534",

    borderRadius:
      12,

    padding:
      isMobile ? "22px 18px" : "32px 28px",

    minWidth:
      isMobile ? 0 : 330,

    maxWidth:
      isMobile ? "calc(100vw - 28px)" : 380,

    width:
      "100%",

    boxShadow:
      "0 4px 16px rgba(25,32,52,0.07)",

    display:
      "flex",

    flexDirection:
      "column",

    gap:
      14,

    alignItems:
      "center",

    boxSizing:
      "border-box",

    margin:
      0,

    position:
      "fixed",

    top:
      isMobile ? "72px" : "110px",

    left:
      "50%",

    transform:
      "translateX(-50%)",

    zIndex:
      10001,
  };

  const modalInputStyle = {
    width:
      "100%",

    padding:
      "10px 11px",

    borderRadius:
      7,

    background:
      "#ffffff",

    color:
      "#202534",

    border:
      "1px solid #dde2ea",

    fontSize:
      18,

    marginBottom:
      9,

    boxSizing:
      "border-box",
  };

  const modalProfileButtonStyle = {
    width:
      "100%",

    background:
      blueMain,

    color:
      "#ffffff",

    border:
      "none",

    borderRadius:
      8,

    fontWeight:
      800,

    fontSize:
      18,

    padding:
      "10px 0",

    margin:
      "7px 0 0",

    cursor:
      "pointer",
  };

  const modalGrayButtonStyle = {
    width:
      "100%",

    background:
      "#f1f3f7",

    color:
      "#202534",

    border:
      "none",

    borderRadius:
      8,

    fontWeight:
      700,

    fontSize:
      17,

    padding:
      "8px 0",

    margin:
      "10px 0 0",

    cursor:
      "pointer",
  };

  const modalDeleteButtonStyle = {
    width:
      "100%",

    background:
      "#c83232",

    color:
      "#ffffff",

    border:
      "none",

    borderRadius:
      8,

    fontWeight:
      700,

    fontSize:
      17,

    padding:
      "10px 0",

    margin:
      "14px 0 0",

    cursor:
      "pointer",
  };

  const modalCloseButtonStyle = {
    background:
      "#eee",

    color:
      "#222",

    border:
      "none",

    borderRadius:
      8,

    padding:
      "7px 0",

    fontWeight:
      600,

    cursor:
      "pointer",

    width:
      180,

    marginTop:
      10,

    userSelect:
      "none",
  };

  const pathParts = location.pathname.split('/').filter(Boolean);
  const modePath = pathParts[languages.some(item => item.code === pathParts[0]) ? 1 : 0] || '';
  const personalPage = modePath === 'my-worldcups' || (modePath === 'tier-list' && new URLSearchParams(location.search).get('mine') === '1');
  const activeMode = personalPage ? '' : modePath.startsWith('tier-list') ? 'tier-list' : ['','category','select-round','match','result','worldcup-maker','edit-worldcup','stats'].some(key => modePath === key || (key && modePath.startsWith(key))) ? 'worldcup' : '';
  const headerModes = [
    {key:'worldcup',icon:'trophy',label:t('gameModeNav.worldcup'),path:`/${currentLang}`},
    {key:'tier-list',icon:'chart',label:t('gameModeNav.tierList'),path:`/${currentLang}/tier-list`},
    {key:'quiz',icon:'question',label:t('gameModeNav.quiz'),pending:true},
    {key:'blind-ranking',icon:'crown',label:t('gameModeNav.blindRanking'),pending:true},
  ];
  useEffect(() => {
    document.querySelectorAll('.onepick-header details[open]').forEach(el => el.removeAttribute('open'));
  }, [location.pathname, location.search]);
  useEffect(() => {
    const closeMenus = event => {
      document.querySelectorAll('.onepick-header details[open]').forEach(el => {
        if (event.key === 'Escape' || (event.type === 'pointerdown' && !el.contains(event.target))) el.removeAttribute('open');
      });
    };
    document.addEventListener('pointerdown', closeMenus);
    document.addEventListener('keydown', closeMenus);
    return () => { document.removeEventListener('pointerdown', closeMenus); document.removeEventListener('keydown', closeMenus); };
  }, []);
  return (
    <header className="onepick-header">
      <div className="onepick-header-main">
          <div className="onepick-header-brand-area">
<button
  type="button"
  className="onepick-header-brand"
  onClick={handleLogoClick}
>
  <span className="onepick-logo-frame">
    <img src={logoImgUrl} alt="" width="72" height="72" />
  </span>

<span
  style={{
    color: "#111111",
    fontStyle: "italic",
    fontWeight: 1000,
    letterSpacing: "-0.03em",
    display: "inline-block",
    textShadow: "0 1px 0 rgba(0,0,0,0.08)",
  }}
>
  One Pick Game
</span>
</button>

</div>
<nav className="onepick-header-modes" aria-label={t('lightUi.gameModes', 'Game modes')}>
          {headerModes.map(mode => <div key={mode.key} className={`onepick-header-mode${activeMode === mode.key ? ' is-active' : ''}${mode.pending ? ' is-pending' : ''}`}>
            {mode.pending ? <div className="onepick-header-mode-main" aria-disabled="true">
              <HeaderIcon name={mode.icon} /><span>{mode.label}</span><small>{t('gameModeNav.comingSoon')}</small>
            </div> : <Link className="onepick-header-mode-main" to={mode.path} aria-current={activeMode === mode.key ? 'page' : undefined}>
              <HeaderIcon name={mode.icon} /><span>{mode.label}</span>
            </Link>}
          </div>)}
        </nav>
        <div className="onepick-header-account">
          <div className="onepick-header-tools">
            <label className="header-language-control"><span className="header-language-label">🌐 Language</span><select value={currentLang} onChange={e=>changeLanguageAndKeepPath(e.target.value)} aria-label={t('language_select','Select language')}>
              {languages.map(item=><option key={item.code} value={item.code}>{item.label}</option>)}
            </select></label>
            <button type="button" onClick={handleBlog}>Blog</button>
          </div>
          <div className="onepick-header-user">
            <Link to={`/${currentLang}/my-worldcups`} className={`onepick-header-content-link${personalPage ? ' is-active' : ''}`} aria-current={personalPage ? 'page' : undefined}>
              <HeaderIcon name="folder" /><span>{t('lightUi.myContent','My content')}</span>
            </Link>
            {user ? <details className="onepick-profile-menu">
              <summary><HeaderIcon name="user" /><span>{t('lightUi.profile','Profile')}</span></summary>
              <div className="onepick-profile-dropdown">
                <strong>{nicknameLoading ? t('loading_nickname') : nickname || t('no_nickname')}</strong>
                <button type="button" onClick={()=>setShowProfile(true)}>{t('edit_profile')}</button>
                {isAdmin && <>
                  <button type="button" onClick={()=>navigate(`/${currentLang}/admin`)}>{t('dashboard')}</button>
                  <button type="button" onClick={()=>navigate(`/${currentLang}/admin-stats`)}>{t('stats')}</button>
                  <button type="button" onClick={onBackup}>{t('backupAll')}</button>
                  <button type="button" onClick={()=>inputRef.current?.click()}>{t('restore')}</button>
                </>}
                <button type="button" onClick={handleLogout}>{t('logout')}</button>
              </div>
            </details> : <Link className="onepick-login-link" to={`/${currentLang}/login`}><HeaderIcon name="user" /><span>{t('auth.loginSignup')}</span></Link>}
          </div>
        </div>
      </div>
      {isAdmin && <input ref={inputRef} type="file" accept="application/json" hidden onChange={onRestore} />}

      {/* 프로필 모달 */}
      {showProfile && (
        <div
          style={
            modalOverlayStyle
          }
          onClick={() =>
            setShowProfile(
              false
            )
          }
        >
          <div
            role="dialog" aria-modal="true" aria-label={t("edit_profile")}
            style={
              modalContentStyle
            }
            onClick={(
              e
            ) =>
              e.stopPropagation()
            }
          >
            <div
              style={{
                fontWeight:
                  800,

                fontSize:
                  23,

                marginBottom:
                  18,

                textAlign:
                  "center",
              }}
            >
              {t(
                "edit_profile"
              )}
            </div>

            <div
              style={{
                width:
                  "100%",
              }}
            >
              <div
                style={{
                  marginBottom:
                    10,

                  fontSize:
                    17,
                }}
              >
                <b>
                  {t(
                    "email"
                  )}
                  :
                </b>{" "}
                {user?.email ||
                  ""}
              </div>

              <div
                style={{
                  marginBottom:
                    10,

                  fontSize:
                    17,
                }}
              >
                <b>
                  {t(
                    "nickname"
                  )}
                  :
                </b>

                <input
                  type="text"
                  value={
                    editNickname
                  }
                  onChange={(
                    e
                  ) =>
                    setEditNickname(
                      e.target.value
                    )
                  }
                  style={
                    modalInputStyle
                  }
                  placeholder={t(
                    "nickname"
                  )}
                  maxLength={
                    20
                  }
                  disabled={
                    editLoading
                  }
                />

                <button
                  style={
                    modalProfileButtonStyle
                  }
                  onClick={
                    handleNicknameChange
                  }
                  disabled={
                    editLoading
                  }
                >
                  {editLoading
                    ? t(
                        "changing"
                      )
                    : t(
                        "change_nickname"
                      )}
                </button>
              </div>

              <button
                style={
                  modalGrayButtonStyle
                }
                onClick={
                  handlePasswordChange
                }
                disabled={
                  editLoading
                }
              >
                {t(
                  "send_pw_reset"
                )}
              </button>

              {profile?.withdrawal_requested_at ? (
                <button
                  style={
                    modalGrayButtonStyle
                  }
                  onClick={
                    handleCancelWithdrawal
                  }
                  disabled={
                    cancelLoading
                  }
                >
                  {cancelLoading
                    ? t(
                        "canceling"
                      )
                    : t(
                        "withdraw_cancel"
                      )}
                </button>
              ) : (
                <button
                  style={
                    modalDeleteButtonStyle
                  }
                  onClick={
                    handleWithdrawalRequest
                  }
                  disabled={
                    withdrawLoading
                  }
                >
                  {withdrawLoading
                    ? t(
                        "changing"
                      )
                    : t(
                        "withdraw"
                      )}
                </button>
              )}

              {editError && (
                <div
                  style={{
                    color:
                      "#b42346",

                    marginTop:
                      7,

                    fontSize:
                      16,

                    textAlign:
                      "center",
                  }}
                >
                  {
                    editError
                  }
                </div>
              )}
            </div>

            <button
              style={
                modalCloseButtonStyle
              }
              onClick={() =>
                setShowProfile(
                  false
                )
              }
            >
              {t(
                "close"
              )}
            </button>

            <button
              style={{
                position:
                  "absolute",

                top:
                  10,

                right:
                  10,

                width:
                  32,

                height:
                  32,

                background:
                  "transparent",

                border:
                  "none",

                color:
                  "#555",

                fontSize:
                  30,

                cursor:
                  "pointer",

                zIndex:
                  10,
              }}
              aria-label={t(
                "close"
              )}
              tabIndex={
                0
              }
              onClick={() =>
                setShowProfile(
                  false
                )
              }
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 22 22"
              >
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
    </header>
  );
}
function HeaderIcon({ name }) {
  const paths = {
    trophy: <><path d="M8 3h8v6a4 4 0 0 1-8 0V3Z"/><path d="M8 5H4v2a4 4 0 0 0 4 4m8-6h4v2a4 4 0 0 1-4 4m-4 2v5m-4 3h8m-6-3h4"/></>,
    chart: <><path d="M4 20h16M5 19v-7h3v7m3 0V8h3v11m3 0V3h3v16"/></>,
    question: <><circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 4m0 3h.01"/></>,
    crown: <path d="m3 6 4 4 5-6 5 6 4-4-2 13H5L3 6Zm3 10h12"/>,
    folder: <path d="M3 7V5h6l2 2h10v13H3V7Zm0 3h18"/>,
    user: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="9" r="3"/><path d="M6 19v-1a6 5 0 0 1 12 0v1"/></>,
  };
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
