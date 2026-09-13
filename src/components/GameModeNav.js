import "../registerPresetTranslations";
import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

function GameModeNav({
  activeMode = "worldcup",
  isMobile = false,
}) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const lang = (i18n.language || "en").split("-")[0];

  const modes = [
    {
      key: "worldcup",
      icon: "🏆",
      label: t("gameModeNav.worldcup"),
      description: t("gameModeNav.worldcupDesc"),
      border: "#ff3d68",
      background:
        "linear-gradient(145deg, #431326 0%, #180b13 100%)",
      shadow: "rgba(255,61,104,0.22)",
      statusColor: "#ff7593",
    },
    {
      key: "tier-list",
      icon: "📊",
      label: t("gameModeNav.tierList"),
      description: t("gameModeNav.tierListDesc"),
      border: "#19bfff",
      background:
        "linear-gradient(145deg, #073653 0%, #071a2b 100%)",
      shadow: "rgba(25,191,255,0.20)",
      statusColor: "#64d8ff",
    },
    {
      key: "quiz",
      icon: "❓",
      label: t("gameModeNav.quiz"),
      description: t("gameModeNav.quizDesc"),
      border: "#27df82",
      background:
        "linear-gradient(145deg, #0b432b 0%, #071c15 100%)",
      shadow: "rgba(39,223,130,0.20)",
      statusColor: "#69efa7",
    },
    {
      key: "blind-ranking",
      icon: "👑",
      label: t("gameModeNav.blindRanking"),
      description: t("gameModeNav.blindRankingDesc"),
      border: "#a855f7",
      background:
        "linear-gradient(145deg, #35135a 0%, #160b27 100%)",
      shadow: "rgba(168,85,247,0.22)",
      statusColor: "#c68cff",
    },
  ];

  const handleClick = (mode) => {
    if (mode.key === "worldcup") {
      navigate(`/${lang}`);
      return;
    }

    if (mode.key === "tier-list") {
      navigate(`/${lang}/tier-list`);
      return;
    }
  };

  return (
    <div style={{ width: "100%" }}>
      {/* 소개 문구 */}
      <div
        style={{
          width: "fit-content",
          maxWidth: "100%",
          margin: `0 auto ${isMobile ? 14 : 20}px`,
          padding: isMobile ? "8px 12px" : "10px 16px",
          boxSizing: "border-box",
          border: "1px solid rgba(49,90,143,0.58)",
          borderRadius: 10,
          background: "rgba(7,17,31,0.66)",
          backdropFilter: "blur(3px)",
          textAlign: "center",
          color: "#f4f7fb",
          fontFamily: "'Pretendard', sans-serif",
        }}
      >
        <div
          style={{
            fontSize: isMobile ? 12 : 15,
            fontWeight: 900,
            lineHeight: 1.35,
          }}
        >
          {t("gameModeNav.introLine1")}
        </div>

        <div
          style={{
            marginTop: 2,
            fontSize: isMobile ? 11 : 15,
            fontWeight: 800,
            lineHeight: 1.45,
            color: "#d7dfeb",
          }}
        >
          {t("gameModeNav.introLine2")}
        </div>
      </div>

      {/* 4개 게임 모드 카드 */}
      <div
        style={{
          width: "100%",
          display: "grid",
          gridTemplateColumns: isMobile
            ? "repeat(2, minmax(0, 1fr))"
            : "repeat(4, 210px)",
          justifyContent: "center",
          gap: isMobile ? 8 : 16,
        }}
      >
        {modes.map((mode) => {
          const active = activeMode === mode.key;

          const live =
            mode.key === "worldcup" ||
            mode.key === "tier-list";

          return (
            <button
              key={mode.key}
              type="button"

              disabled={!live}

              onClick={() => handleClick(mode)}

              onMouseEnter={(e) => {
                if (isMobile || !live) return;

                e.currentTarget.style.transform =
                  "translateY(-4px)";

                e.currentTarget.style.boxShadow =
                  `0 0 42px ${mode.shadow}`;
              }}

              onMouseLeave={(e) => {
                if (isMobile || !live) return;

                e.currentTarget.style.transform = "";

                e.currentTarget.style.boxShadow =
                  active
                    ? `0 0 36px ${mode.shadow}`
                    : `0 0 28px ${mode.shadow}`;
              }}

              style={{
                minHeight: isMobile ? 88 : 210,

                padding: isMobile
                  ? "12px 8px"
                  : "14px 10px",

                borderRadius: 12,

                border: `2px solid ${mode.border}`,

                background: mode.background,

                boxShadow: active
                  ? `0 0 36px ${mode.shadow}`
                  : `0 0 28px ${mode.shadow}`,

                color: "#fff",

                cursor: live
                  ? "pointer"
                  : "not-allowed",

                display: "flex",
                flexDirection: "column",

                alignItems: "center",
                justifyContent: "center",

                gap: isMobile ? 5 : 8,

                fontFamily:
                  "'Pretendard', sans-serif",

                transition:
                  "transform 0.16s ease, box-shadow 0.16s ease",

                opacity: live ? 1 : 0.8,

                filter: live
                  ? "none"
                  : "saturate(0.72)",
              }}
            >
              {/* 아이콘 */}
              <span
                style={{
                  fontSize: isMobile ? 25 : 72,
                  lineHeight: 1,
                }}
              >
                {mode.icon}
              </span>

              {/* 제목 */}
              <span
                style={{
                  fontSize: isMobile ? 14 : 32,
                  fontWeight: 900,
                  lineHeight: 1.15,

                  minHeight: isMobile ? 30 : 48,

                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",

                  textAlign: "center",
                }}
              >
                {mode.label}
              </span>

              {/* 설명 */}
              <span
                style={{
                  minHeight: isMobile ? 26 : 34,

                  padding: isMobile
                    ? "0 4px"
                    : "0 8px",

                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",

                  textAlign: "center",

                  color: live
                    ? "#c8d6e8"
                    : "#8d9bae",

                  fontSize: isMobile ? 10 : 15,

                  fontWeight: 700,

                  lineHeight: 1.35,
                }}
              >
                {mode.description}
              </span>

              {/* 상태 */}
              <span
                style={{
                  marginTop: isMobile ? 0 : 4,

                  minWidth: isMobile ? 0 : 130,

                  padding: isMobile
                    ? "0"
                    : "7px 18px",

                  borderRadius: 999,

                  background: isMobile
                    ? "transparent"
                    : active
                      ? `${mode.border}22`
                      : "rgba(0,0,0,0.28)",

                  border: isMobile
                    ? "none"
                    : `1px solid ${mode.border}66`,

                  color: active
                    ? mode.statusColor
                    : "#b7c4d5",

                  fontSize: isMobile ? 10 : 15,

                  fontWeight: 900,

                  lineHeight: 1,
                }}
              >
                {active
                  ? t("gameModeNav.current")
                  : live
                    ? t("gameModeNav.playNow")
                    : t("gameModeNav.comingSoon")}
              </span>
            </button>
          );
        })}
      </div>

      {/* 내 콘텐츠 버튼 */}
     {/* 각 게임 모드 하단 버튼 */}
<div
  style={{
    width: "100%",
    display: "grid",

    gridTemplateColumns: isMobile
      ? "repeat(2, minmax(0, 1fr))"
      : "repeat(4, 210px)",

    justifyContent: "center",

    gap: isMobile ? 8 : 16,

    marginTop: isMobile ? 10 : 14,
  }}
>
  {/* 내 이상형 월드컵 */}
  <button
    type="button"
    onClick={() =>
      navigate(`/${lang}/my-worldcups`)
    }
    style={{
      width: "100%",
      minHeight: isMobile ? 42 : 46,

      border: "1px solid rgba(255,61,104,0.75)",
      borderRadius: 9,

      background:
        "linear-gradient(145deg, #431326 0%, #180b13 100%)",

      color: "#fff",

      fontSize: isMobile ? 12 : 16,
      fontWeight: 900,

      fontFamily: "'Pretendard', sans-serif",

      cursor: "pointer",

      boxShadow:
        "0 0 14px rgba(255,61,104,0.20)",
    }}
  >
    {t("presetNavigation.myBrackets")}
  </button>

  {/* 내가 만든 티어표 */}
  <button
    type="button"
    onClick={() =>
      navigate(`/${lang}/tier-list?mine=1`)
    }
    style={{
      width: "100%",
      minHeight: isMobile ? 42 : 46,

      border: "1px solid rgba(25,191,255,0.75)",
      borderRadius: 9,

      background:
        "linear-gradient(145deg, #073653 0%, #071a2b 100%)",

      color: "#fff",

      fontSize: isMobile ? 12 : 16,
      fontWeight: 900,

      fontFamily: "'Pretendard', sans-serif",

      cursor: "pointer",

      boxShadow:
        "0 0 14px rgba(25,191,255,0.20)",
    }}
  >
    {t("presetNavigation.myTierLists")}
  </button>

  {/* 맞히기 - 준비 중 */}
  <button
    type="button"
    disabled
    style={{
      width: "100%",
      minHeight: isMobile ? 42 : 46,

      border: "1px solid rgba(39,223,130,0.55)",
      borderRadius: 9,

      background:
        "linear-gradient(145deg, #0b432b 0%, #071c15 100%)",

      color: "#a3b5aa",

      fontSize: isMobile ? 12 : 16,
      fontWeight: 900,

      fontFamily: "'Pretendard', sans-serif",

      cursor: "not-allowed",

      opacity: 0.65,

      boxShadow:
        "0 0 14px rgba(39,223,130,0.12)",
    }}
  >
    {t("gameModeNav.quiz")}
  </button>

  {/* 블라인드 랭킹 - 준비 중 */}
  <button
    type="button"
    disabled
    style={{
      width: "100%",
      minHeight: isMobile ? 42 : 46,

      border: "1px solid rgba(168,85,247,0.55)",
      borderRadius: 9,

      background:
        "linear-gradient(145deg, #35135a 0%, #160b27 100%)",

      color: "#b8a7c8",

      fontSize: isMobile ? 12 : 16,
      fontWeight: 900,

      fontFamily: "'Pretendard', sans-serif",

      cursor: "not-allowed",

      opacity: 0.65,

      boxShadow:
        "0 0 14px rgba(168,85,247,0.12)",
    }}
  >
    {t("gameModeNav.blindRanking")}
  </button>
</div>
    </div>
  );
}

export default GameModeNav;