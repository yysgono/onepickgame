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

  const headerBgUrl =
    "/onepick3.png";

  const darkBlue =
    "#171C27";

  const blueMain =
    "#1976ed";

  const blueGradient =
    "linear-gradient(90deg,#2999ff,#236de8 100%)";

  const blueNeon =
    "0 0 16px #2999ff88, 0 2px 12px #1976ed33";

  const gold =
    "#ffbe3b";

  const adminButtonStyle = (
    bgColor = darkBlue,
    color = "#fff"
  ) => ({
    background: bgColor,
    color,

    borderRadius: 8,

    fontWeight: 800,

    padding:
      "11px 24px",

    border: "none",

    cursor: "pointer",

    fontSize: 18,

    whiteSpace:
      "nowrap",

    transition:
      "background .15s, box-shadow .15s, color .12s",

    boxShadow:
      "0 2px 10px #1976ed33",

    letterSpacing:
      "0",

    fontFamily:
      "'Pretendard', 'Noto Sans KR', Arial, sans-serif",

    textShadow:
      "none",

    outline:
      "none",
  });

  const statButtonStyle = {
    background: gold,
    color: "#222",

    border: "none",
    borderRadius: 8,

    fontWeight: 800,

    padding:
      "11px 24px",

    fontSize: 18,

    boxShadow:
      "0 0 7px #fffbe34a",

    cursor: "pointer",

    outline: "none",

    letterSpacing:
      "0",

    fontFamily:
      "'Pretendard', 'Noto Sans KR', Arial, sans-serif",

    textShadow:
      "none",
  };

  const mainButtonStyle = {
    background:
      blueGradient,

    color: "#fff",

    border: "none",

    borderRadius: 10,

    fontWeight: 900,

    padding:
      "11px 24px",

    fontSize: 19,

    boxShadow:
      blueNeon,

    letterSpacing:
      "0",

    fontFamily:
      "'Pretendard', 'Noto Sans KR', Arial, sans-serif",

    textShadow:
      "none",

    transition:
      "background .17s, box-shadow .13s, color .12s",

    cursor:
      "pointer",

    whiteSpace:
      "nowrap",

    outline:
      "none",
  };

  const worldcupButtonStyle = {
    ...mainButtonStyle,

    background:
      "linear-gradient(90deg,#d92f55,#b91f46 100%)",

    boxShadow:
      "0 0 16px #d92f5588, 0 2px 12px #b91f4633",
  };

  const guessButtonStyle = {
    ...mainButtonStyle,

    background:
      "linear-gradient(90deg,#18975b,#0f7043 100%)",

    boxShadow:
      "0 0 16px #18975b66, 0 2px 12px #0f704333",
  };

  const blindRankingButtonStyle = {
    ...mainButtonStyle,

    background:
      "linear-gradient(90deg,#7b3fc6,#54258f 100%)",

    boxShadow:
      "0 0 16px #7b3fc666, 0 2px 12px #54258f33",
  };

  const disabledModeButtonStyle = {
    cursor:
      "not-allowed",

    opacity:
      0.55,
  };

  const infoButtonStyle = {
    background:
      "rgba(30,43,82,0.94)",

    color: "#fff",

    border: "none",

    borderRadius: 8,

    fontWeight: 700,

    padding:
      "11px 24px",

    fontSize: 18,

    boxShadow:
      "0 0 7px #1976ed2d",

    transition:
      "background .14s, color .13s, box-shadow .12s",

    outline:
      "none",

    marginRight: 0,

    whiteSpace:
      "nowrap",

    fontFamily:
      "'Pretendard', 'Noto Sans KR', Arial, sans-serif",

    textShadow:
      "none",
  };

  const logoutButtonStyle = {
    background:
      "#232c40",

    color: "#fff",

    border: "none",

    borderRadius: 8,

    fontWeight: 700,

    padding:
      "11px 24px",

    fontSize: 18,

    boxShadow:
      "0 0 9px #157be940",

    cursor:
      "pointer",

    outline:
      "none",

    transition:
      "background .12s, color .13s",

    fontFamily:
      "'Pretendard', 'Noto Sans KR', Arial, sans-serif",

    textShadow:
      "none",
  };

  const selectStyle = {
    padding:
      "10px 16px",

    borderRadius: 8,

    fontWeight: 700,

    fontSize: 18,

    minWidth: 150,

    background:
      "#222f45",

    color: "#fff",

    border:
      "1px solid #1258cc",

    cursor:
      "pointer",

    userSelect:
      "none",

    outline:
      "none",

    boxShadow:
      "0 0 7px #157be94a",

    fontFamily:
      "'Pretendard', 'Noto Sans KR', Arial, sans-serif",

    textShadow:
      "none",
  };

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
      "#1e293b",

    color:
      "#fff",

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
      "0 4px 24px rgba(0,0,0,0.15)",

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
      "#334155",

    color:
      "#fff",

    border:
      "1px solid #475569",

    fontSize:
      16,

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
      "#fff",

    border:
      "none",

    borderRadius:
      8,

    fontWeight:
      800,

    fontSize:
      16,

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
      "#475569",

    color:
      "#fff",

    border:
      "none",

    borderRadius:
      8,

    fontWeight:
      700,

    fontSize:
      15,

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
      "#e14444",

    color:
      "#fff",

    border:
      "none",

    borderRadius:
      8,

    fontWeight:
      700,

    fontSize:
      15,

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

  return (
    <header
      style={{
        width:
          "100%",

        background:
          `linear-gradient(90deg,rgba(20,23,32,0.92) 80%,rgba(20,26,44,0.82)),url('${headerBgUrl}') center/cover no-repeat`,

        boxShadow:
          "0 2px 22px #000a, 0 1.5px 6px #1e2242cc",

        borderBottom:
          "4px solid #1976ed",

        position:
          "relative",

        zIndex:
          1000,

        padding:
          isMobile ? "0 0 12px 0" : "0 0 20px 0",

        backdropFilter:
          "blur(2.5px)",

        WebkitBackdropFilter:
          "blur(2.5px)",
      }}
    >
      {/* 로고 */}
      <div
        style={{
          width:
            "100%",

          display:
            "flex",

          justifyContent:
            "center",

          alignItems:
            "center",

          padding:
            isMobile ? "10px 12px 8px" : "18px 0 14px 0",

          cursor:
            "pointer",

          userSelect:
            "none",
        }}
        onClick={
          handleLogoClick
        }
      >
        <img
          src={
            logoImgUrl
          }
          alt={t(
            "onepick_logo_alt",
            "OnePickGame logo"
          )}
          style={{
            width: isMobile ? 46 : 64,
            height: isMobile ? 46 : 64,

            borderRadius:
              "50%",

            border:
              "2.2px solid #1976ed",

            background:
              "rgba(24,29,42,0.9)",

            marginRight:
              isMobile ? 7 : 8,

            filter:
              "drop-shadow(0 0 10px #00c8ffbb)",

            verticalAlign:
              "middle",
          }}
          draggable={
            false
          }
        />

        <span
          style={{
            fontWeight:
              900,

            fontSize:
              isMobile ? 27 : 34,

            fontFamily:
              "'Pretendard', 'Noto Sans KR', Arial, sans-serif",

            color:
              "#fff",

            textShadow:
              "none",

            letterSpacing:
              "0.3px",

            lineHeight:
              1.13,

            marginTop:
              2,
          }}
        >
          {t(
            "onepick_brand",
            "One Pick Game"
          )}
        </span>
      </div>

      {/* 헤더 메뉴 */}
      <div
        style={{
          width:
            "100%",

          maxWidth:
            1800,

          margin:
            "0 auto",

          padding:
            isMobile ? "4px 12px 0" : "6px 16px 0",

          boxSizing:
            "border-box",

          display:
            "flex",

          flexDirection:
            "column",

          alignItems:
            "center",

          gap:
            isMobile ? 8 : 12,
        }}
      >
        {/* =========================
            1줄
            이상형 월드컵 / 맞히기 / Blog / 언어
        ========================== */}
        <div
          style={{
            width:
              isMobile ? "100%" : "calc(100% - 24px)",

            maxWidth:
              860,

            display:
              isMobile ? "grid" : "flex",

            gridTemplateColumns:
              isMobile ? "repeat(2, minmax(0, 1fr))" : undefined,

            alignItems:
              "center",

            justifyContent:
              isMobile ? "stretch" : "flex-start",

            flexWrap:
              isMobile ? undefined : "wrap",

            gap:
              isMobile ? 8 : "10px 12px",

            boxSizing:
              "border-box",
          }}
        >
          {/* 이상형 월드컵 */}
          <button
            style={{
              ...worldcupButtonStyle,

              width:
                isMobile ? "100%" : 220,

              minHeight:
                isMobile ? 44 : 46,

              padding:
                isMobile ? "9px 10px" : worldcupButtonStyle.padding,

              fontSize:
                isMobile ? 15 : worldcupButtonStyle.fontSize,
            }}
            onClick={() =>
              navigate(
                `/${currentLang}`
              )
            }
          >
            {t("gameModeNav.worldcup")}
          </button>

          {/* 맞히기 */}
          <button
            type="button"
            disabled
            style={{
              ...guessButtonStyle,
              ...disabledModeButtonStyle,

              width:
                isMobile ? "100%" : 190,

              minHeight:
                isMobile ? 44 : 46,

              padding:
                isMobile ? "9px 10px" : guessButtonStyle.padding,

              fontSize:
                isMobile ? 15 : guessButtonStyle.fontSize,
            }}
            title={t("gameModeNav.comingSoon")}
          >
            {t("gameModeNav.quiz")}
          </button>

          {/* Blog */}
          <button
            style={{
              ...infoButtonStyle,

              width:
                isMobile ? "100%" : 96,

              minHeight:
                isMobile ? 42 : 46,

              padding:
                isMobile ? "8px 10px" : infoButtonStyle.padding,

              fontSize:
                isMobile ? 14 : infoButtonStyle.fontSize,
            }}
            onClick={
              handleBlog
            }
          >
            Blog
          </button>

          {/* 언어 */}
          <select
            value={
              (
                i18n.language ||
                "en"
              ).split("-")[0]
            }
            onChange={(
              e
            ) =>
              changeLanguageAndKeepPath(
                e.target.value
              )
            }
            style={{
              ...selectStyle,

              gridColumn:
                isMobile ? "1 / -1" : undefined,

              width:
                isMobile ? "100%" : undefined,

              flex:
                isMobile ? undefined : "1 1 180px",

              minWidth:
                isMobile ? 0 : 180,

              minHeight:
                isMobile ? 42 : 46,

              padding:
                isMobile ? "8px 12px" : selectStyle.padding,

              fontSize:
                isMobile ? 14 : selectStyle.fontSize,

              boxSizing:
                "border-box",
            }}
            aria-label={t(
              "language_select",
              "Select language"
            )}
          >
            {languages.map(
              (lang) => (
                <option
                  key={
                    lang.code
                  }
                  value={
                    lang.code
                  }
                >
                  {
                    lang.label
                  }
                </option>
              )
            )}
          </select>
        </div>

        {/* =========================
            2줄
            티어표 / 블라인드 랭킹 / 계정
        ========================== */}
        <div
          style={{
            width:
              isMobile ? "100%" : "calc(100% - 24px)",

            maxWidth:
              860,

            display:
              isMobile ? "grid" : "flex",

            gridTemplateColumns:
              isMobile ? "repeat(2, minmax(0, 1fr))" : undefined,

            alignItems:
              "center",

            justifyContent:
              isMobile ? "stretch" : "flex-start",

            flexWrap:
              isMobile ? undefined : "wrap",

            gap:
              isMobile ? 8 : "10px 12px",

            boxSizing:
              "border-box",
          }}
        >
          {/* 티어표 */}
          <button
            style={{
              ...mainButtonStyle,

              width:
                isMobile ? "100%" : 220,

              minHeight:
                isMobile ? 44 : 46,

              padding:
                isMobile ? "9px 10px" : mainButtonStyle.padding,

              fontSize:
                isMobile ? 15 : mainButtonStyle.fontSize,
            }}
            onClick={() =>
              navigate(
                `/${currentLang}/tier-list`
              )
            }
          >
            {t("gameModeNav.tierList")}
          </button>

          {/* 블라인드 랭킹 */}
          <button
            type="button"
            disabled
            style={{
              ...blindRankingButtonStyle,
              ...disabledModeButtonStyle,

              width:
                isMobile ? "100%" : 190,

              minHeight:
                isMobile ? 44 : 46,

              padding:
                isMobile ? "9px 10px" : blindRankingButtonStyle.padding,

              fontSize:
                isMobile ? 14 : blindRankingButtonStyle.fontSize,
            }}
            title={t("gameModeNav.comingSoon")}
          >
            {t("gameModeNav.blindRanking")}
          </button>

          {user ? (
            <>
              {/* 닉네임 */}
              <span
                style={{
                  width:
                    isMobile ? "100%" : 96,

                  justifyContent:
                    "center",

                  fontWeight:
                    900,

                  color:
                    "#ffffff",

                  background:
                    "#0f2940",

                  border:
                    "1px solid #2d6f9f",

                  borderRadius:
                    9,

                  padding:
                    isMobile ? "8px 10px" : "10px 16px",

                  margin:
                    0,

                  minHeight:
                    isMobile ? 42 : 46,

                  display:
                    "inline-flex",

                  alignItems:
                    "center",

                  boxSizing:
                    "border-box",

                  whiteSpace:
                    "nowrap",

                  userSelect:
                    "none",

                  textShadow:
                    "none",

                  fontFamily:
                    "'Pretendard', 'Noto Sans KR', Arial, sans-serif",

                  fontSize:
                    isMobile ? 14 : 18,

                  letterSpacing:
                    0,
                }}
              >
                {nicknameLoading
                  ? t(
                      "loading_nickname"
                    )
                  : nickname ||
                    t(
                      "no_nickname"
                    )}
              </span>

              {/* 프로필 */}
              <button
                style={{
                  ...infoButtonStyle,

                  width:
                    isMobile ? "100%" : 150,

                  minHeight:
                    isMobile ? 42 : 46,

                  padding:
                    isMobile ? "8px 10px" : infoButtonStyle.padding,

                  fontSize:
                    isMobile ? 14 : infoButtonStyle.fontSize,
                }}
                onClick={() =>
                  setShowProfile(
                    true
                  )
                }
              >
                {t(
                  "edit_profile"
                )}
              </button>

              {/* 로그아웃 */}
              <button
                style={{
                  ...logoutButtonStyle,

                  flex:
                    isMobile ? undefined : "1 1 100px",

                  width:
                    isMobile ? "100%" : undefined,

                  minWidth:
                    isMobile ? 0 : 100,

                  minHeight:
                    isMobile ? 42 : 46,

                  padding:
                    isMobile ? "8px 10px" : logoutButtonStyle.padding,

                  fontSize:
                    isMobile ? 14 : logoutButtonStyle.fontSize,
                }}
                onClick={
                  handleLogout
                }
              >
                {t(
                  "logout"
                )}
              </button>
            </>
          ) : (
            <button
              style={{
                ...mainButtonStyle,

                gridColumn:
                  isMobile ? "1 / -1" : undefined,

                width:
                  isMobile ? "100%" : undefined,

                flex:
                  isMobile ? undefined : "1 1 190px",

                minWidth:
                  isMobile ? 0 : 190,

                minHeight:
                  isMobile ? 44 : 46,

                padding:
                  isMobile ? "9px 10px" : mainButtonStyle.padding,

                fontSize:
                  isMobile ? 15 : mainButtonStyle.fontSize,
              }}
              onClick={() =>
                navigate(
                  `/${currentLang}/login`
                )
              }
            >
              {t(
                "auth.loginSignup"
              )}
            </button>
          )}
        </div>

        {/* 관리자 전용 */}
        {isAdmin && (
          <div
            style={{
              width:
                "100%",

              display:
                "flex",

              alignItems:
                "center",

              justifyContent:
                "center",

              flexWrap:
                "wrap",

              gap:
                isMobile ? 8 : "10px 12px",

              paddingTop:
                2,

              paddingLeft:
                isMobile ? 12 : 0,

              paddingRight:
                isMobile ? 12 : 0,
            }}
          >
            <button
              style={adminButtonStyle(
                "#1976ed"
              )}
              onClick={() =>
                navigate(
                  `/${currentLang}/admin`
                )
              }
            >
              {t(
                "dashboard"
              )}
            </button>

            <button
              style={
                statButtonStyle
              }
              onClick={() =>
                navigate(
                  `/${currentLang}/admin-stats`
                )
              }
            >
              {t(
                "stats"
              )}
            </button>

            <button
              style={adminButtonStyle()}
              onClick={
                onBackup
              }
            >
              {t(
                "backupAll"
              )}
            </button>

            <button
              style={adminButtonStyle(
                "#253253"
              )}
              onClick={() =>
                inputRef.current &&
                inputRef.current.click()
              }
            >
              {t(
                "restore"
              )}
            </button>

            <input
              ref={
                inputRef
              }
              type="file"
              accept="application/json"
              style={{
                display:
                  "none",
              }}
              onChange={
                onRestore
              }
            />
          </div>
        )}
      </div>

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
                  21,

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
                    15,
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
                    15,
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
                      "red",

                    marginTop:
                      7,

                    fontSize:
                      14,

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
                  28,

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