import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import StatsPage from "./StatsPage";

function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 700);
  React.useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 700);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return isMobile;
}

export default function SelectRoundPage({
  cup,
  maxRound,
  candidates,
  onSelect,
  onResult,
}) {
  const { t } = useTranslation();
  const [selectedRound, setSelectedRound] = useState(maxRound);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const { lang: langParam } = useParams();

  // 언어코드 추출
  let lang = langParam;
  if (!lang) {
    const m = location.pathname.match(/^\/([a-z]{2})(\/|$)/);
    lang = m ? m[1] : "ko";
  }

  const maxPossibleRound = Math.min(candidates.length, 10000);
  let possibleRounds = [];
  for (let n = 1; Math.pow(2, n) <= maxPossibleRound; n++) {
    possibleRounds.push(Math.pow(2, n));
  }
  if (
    candidates.length >= 2 &&
    candidates.length <= 10000 &&
    !possibleRounds.includes(candidates.length)
  ) {
    possibleRounds.push(candidates.length);
  }
  possibleRounds = possibleRounds.sort((a, b) => a - b);

  const hasBye = candidates.length < selectedRound;

  // ---- 버튼 스타일 ----
  // 초록색 공유 버튼 스타일(작고, 예전 느낌)
  const shareBtn = {
    display: "block",
    margin: "0 auto",
    background: "#14c943",
    color: "#fff",
    fontWeight: 800,
    border: "none",
    borderRadius: 9,
    fontSize: isMobile ? 15 : 18,
    padding: isMobile ? "6px 16px" : "9px 27px",
    minWidth: isMobile ? 90 : 160,
    cursor: "pointer",
    boxShadow: "0 2px 8px #12b03221",
    outline: "none",
    marginBottom: isMobile ? 12 : 20,
    marginTop: isMobile ? 9 : 17,
    transition: "all 0.13s",
    letterSpacing: "-0.5px",
    height: isMobile ? 38 : 47,
  };
  const mainBtn = {
    background: "linear-gradient(90deg, #1976ed 80%, #45b7fa 100%)",
    color: "#fff",
    fontWeight: 900,
    border: "none",
    borderRadius: 11,
    fontSize: isMobile ? 17 : 19,
    padding: isMobile ? "10px 22px" : "13px 35px",
    minWidth: isMobile ? 87 : 115,
    cursor: "pointer",
    boxShadow: "0 1px 11px #1976ed22",
    marginLeft: 4,
    marginRight: 4,
    outline: "none",
    height: isMobile ? 48 : 60,
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  };
  const selectBtnStyle = {
    fontSize: isMobile ? 19 : 25,
    padding: isMobile ? "10px 17px" : "12px 33px",
    borderRadius: isMobile ? 9 : 12,
    minWidth: isMobile ? 85 : 130,
    fontWeight: 900,
    background: "#16213a",
    color: "#fff",
    border: "2px solid #1976ed",
    height: isMobile ? 48 : 60,
    textAlign: "left",
    boxSizing: "border-box",
    margin: "0 auto",
    display: "block",
    cursor: "pointer",
    direction: "ltr"
  };
  const selectArrowStyle = {
    position: "absolute",
    right: isMobile ? 16 : 25,
    top: "50%",
    transform: "translateY(-50%)",
    pointerEvents: "none",
    color: "#fff",
    fontSize: isMobile ? 19 : 26,
    zIndex: 1
  };
  const candidateCountText = {
    fontSize: isMobile ? 15 : 19,
    fontWeight: 800,
    color: "#fff",
    background: "#243152",
    borderRadius: 8,
    padding: isMobile ? "6px 16px" : "8px 26px",
    marginLeft: isMobile ? 0 : 8,
    height: isMobile ? 48 : 60,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    letterSpacing: "0.07em",
    whiteSpace: "nowrap",
    boxSizing: "border-box",
    border: "1.5px solid #1976ed33"
  };

  const shareUrl = cup?.id
    ? `${window.location.origin}/${lang}/select-round/${cup.id}`
    : window.location.href;
  function handleShare() {
    navigator.clipboard.writeText(shareUrl);
    if (window?.toast?.success) window.toast.success(t("share_link_copied"));
    else alert(t("share_link_copied"));
  }

  function handleStart(selectedRound) {
    if (onSelect) onSelect(selectedRound);
    else if (cup?.id && lang) {
      navigate(`/${lang}/match/${cup.id}/${selectedRound}`);
    }
  }

  return (
    <div
      style={{
        position: "relative",
        textAlign: "center",
        padding: isMobile ? 12 : 28,
        maxWidth: isMobile ? "100%" : 880,
        margin: "0 auto",
        background: "rgba(20, 24, 37, 0.95)",
        borderRadius: isMobile ? 0 : 23,
        boxShadow: isMobile ? "none" : "0 4px 44px #171c2747",
        marginTop: isMobile ? 10 : 26,
        minHeight: isMobile ? 320 : 480,
      }}
    >
      {/* 맨 위 중앙에 월드컵 공유 버튼 (초록/작게) */}
      <button
        style={shareBtn}
        onClick={handleShare}
        aria-label={t("share_worldcup")}
      >
        <span role="img" aria-label="Share" style={{ fontSize: 17, marginRight: 7 }}>📢</span>
        {t("share_worldcup")}
      </button>

      {/* ---- 라운드/시작/후보수 ---- */}
      <div
        style={{
          marginBottom: isMobile ? 10 : 18,
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "center",
          gap: isMobile ? 8 : 16,
          width: "100%",
        }}
      >
        <span style={{ position: "relative", display: "inline-block", minWidth: 130, textAlign: "center" }}>
          <select
            value={selectedRound}
            onChange={(e) => setSelectedRound(Number(e.target.value))}
            style={selectBtnStyle}
            aria-label={t("round_of", { count: selectedRound })}
          >
            {possibleRounds.map((r) => (
              <option key={r} value={r}>
                {t("round_of", { count: r })}
              </option>
            ))}
          </select>
          <span style={selectArrowStyle}>▼</span>
        </span>
        <button
          style={mainBtn}
          onClick={() => handleStart(selectedRound)}
          aria-label={t("start")}
        >
          {t("start")}
        </button>
        <span style={candidateCountText}>
          {t("candidates_count", { count: candidates.length })}
          {hasBye && (
            <span
              style={{
                marginLeft: 7,
                color: "#FFD740",
                fontSize: isMobile ? 12 : 15,
                fontWeight: 700
              }}
            >
              ⚠️ {t("bye_round")}
            </span>
          )}
        </span>
      </div>
      {/* 부전승 안내문구 */}
      {hasBye && (
        <div
          style={{
            margin: "6px auto 8px auto",
            padding: isMobile ? "7px 11px" : "10px 17px",
            color: "#a85c07",
            background: "#fffbe5",
            borderRadius: 7,
            fontSize: isMobile ? 13 : 15,
            fontWeight: 900,
            boxShadow: "0 1px 5px #1976ed09",
            display: "inline-block",
            maxWidth: 400,
            border: "1.1px solid #ffd452",
          }}
        >
          ⚠️ {t("auto_bye_message", { selectedRound })}
        </div>
      )}

      {/* ====== StatsPage ====== */}
      <div style={{ marginTop: isMobile ? 10 : 25 }}>
        <StatsPage
          selectedCup={cup}
          hideImages={true}
          hideTop3={true}
          hideShareAndReportBar={true}
          renderBelowTitle={
            // 파란박스(=표 위 타이틀) 아래에 월드컵 내용 안내문구 렌더링
            cup && (cup.desc || cup.description) ? (
              <div
                style={{
                  fontWeight: 400,
                  fontSize: isMobile ? 16 : 20,
                  color: "#b9d3ff",
                  textAlign: "center",
                  background: "rgba(30,45,70,0.93)",
                  borderRadius: 9,
                  padding: isMobile ? "7px 6px 4px 6px" : "11px 18px 6px 18px",
                  marginBottom: isMobile ? 10 : 18,
                  marginLeft: "auto",
                  marginRight: "auto",
                  maxWidth: isMobile ? "95vw" : 590,
                  lineHeight: 1.45,
                  minHeight: 24,
                  whiteSpace: "pre-line",
                  wordBreak: "break-word",
                }}
              >
                {cup.desc || cup.description}
              </div>
            ) : null
          }
        />
      </div>
    </div>
  );
}
