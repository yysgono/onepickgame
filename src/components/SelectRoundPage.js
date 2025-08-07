import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation, useParams } from "react-router-dom";

function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 700);
  React.useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 700);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return isMobile;
}

export default function SelectRoundPage({ cup, maxRound, candidates, onSelect, onResult }) {
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
  const resultBtn = {
    position: "absolute",
    top: isMobile ? 11 : 23,
    right: isMobile ? 11 : 26,
    zIndex: 10,
    background: "linear-gradient(90deg, #13e67e 80%, #23d6a0 100%)",
    color: "#fff",
    fontWeight: 900,
    border: "none",
    borderRadius: 11,
    fontSize: isMobile ? 15 : 17,
    padding: isMobile ? "8px 19px" : "10px 30px",
    minWidth: isMobile ? 72 : 110,
    cursor: "pointer",
    boxShadow: "0 1px 11px #23e6ad22",
    outline: "none",
    height: isMobile ? 38 : 44,
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  };

  // --- 공유 버튼 스타일 & 함수 ---
  const shareBtn = {
    position: "absolute",
    top: isMobile ? 11 : 23,
    left: isMobile ? 11 : 26,
    zIndex: 10,
    background: "linear-gradient(90deg, #1976ed 80%, #45b7fa 100%)",
    color: "#fff",
    fontWeight: 900,
    border: "none",
    borderRadius: 11,
    fontSize: isMobile ? 15 : 17,
    padding: isMobile ? "8px 19px" : "10px 30px",
    minWidth: isMobile ? 72 : 110,
    cursor: "pointer",
    boxShadow: "0 1px 11px #1976ed22",
    outline: "none",
    height: isMobile ? 38 : 44,
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  };
  const shareUrl = cup?.id ? `${window.location.origin}/${lang}/select-round/${cup.id}` : window.location.href;
  function handleShare() {
    navigator.clipboard.writeText(shareUrl);
    if (window?.toast?.success) window.toast.success(t("share_link_copied"));
    else alert(t("share_link_copied"));
  }

  function handleShowStats() {
    if (cup?.id && lang) {
      navigate(`/${lang}/stats/${cup.id}`);
    }
  }

  function handleStart(selectedRound) {
    if (onSelect) onSelect(selectedRound);
    else if (cup?.id && lang) {
      navigate(`/${lang}/match/${cup.id}/${selectedRound}`);
    }
  }

  // 후보 이름만 unique하게 (혹시 이름이 중복이면 한 번만 보여줌)
  const uniqueNames = Array.from(new Set((candidates || []).map(c => c.name || c.title || c)));

  return (
    <div
      style={{
        position: "relative",
        textAlign: "center",
        padding: isMobile ? 12 : 38,
        maxWidth: isMobile ? "100%" : 880,
        margin: "0 auto",
        background: "rgba(20, 24, 37, 0.95)",
        borderRadius: isMobile ? 0 : 23,
        boxShadow: isMobile ? "none" : "0 4px 44px #171c2747",
        marginTop: 36,
        minHeight: isMobile ? 520 : 580,
      }}
    >
      {/* 왼쪽 상단 월드컵 공유하기 버튼 */}
      {cup && (
        <button
          style={shareBtn}
          onClick={handleShare}
          aria-label={t("share_worldcup")}
        >
          📢 {t("share_worldcup")}
        </button>
      )}

      {/* 오른쪽 상단 결과/통계 보기 버튼 */}
      <button
        style={resultBtn}
        onClick={handleShowStats}
        aria-label={t("show_result")}
      >
        {t("show_result")}
      </button>
      {cup && (
        <>
          <div
            style={{
              fontWeight: 900,
              fontSize: isMobile ? 23 : 31,
              color: "#fff",
              marginBottom: isMobile ? 20 : 27,
              letterSpacing: "-1.2px",
              lineHeight: 1.18,
              textAlign: "center",
              background: "#171C27",
              borderRadius: 14,
              padding: isMobile ? "12px 0 8px 0" : "18px 0 9px 0",
              marginLeft: "auto",
              marginRight: "auto",
              whiteSpace: "pre-line",
              wordBreak: "break-all",
              maxWidth: isMobile ? "98vw" : 710,
              boxShadow: "0 2px 16px #1976ed18",
              marginTop: isMobile ? 35 : 45,
            }}
            title={cup.title}
          >
            {cup.title}
          </div>
          {(cup.desc || cup.description) && (
            <div
              style={{
                fontWeight: 400,
                fontSize: isMobile ? 16 : 20,
                color: "#b9d3ff",
                textAlign: "center",
                background: "rgba(30,45,70,0.93)",
                borderRadius: 9,
                padding: isMobile ? "7px 6px 4px 6px" : "11px 18px 6px 18px",
                marginBottom: isMobile ? 18 : 24,
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
          )}
        </>
      )}

      {/* ---- 라운드/시작/후보수 ---- */}
      <div
        style={{
          marginBottom: isMobile ? 16 : 24,
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

      {/* ==== 후보 이름 나열 ==== */}
      <div
        style={{
          margin: "40px auto 0 auto",
          background: "rgba(32, 37, 59, 0.88)",
          borderRadius: 18,
          padding: isMobile ? "15px 9px 20px 9px" : "23px 26px 27px 26px",
          maxWidth: 670,
          boxShadow: "0 2px 26px #1976ed19",
        }}
      >
        <div style={{
          fontWeight: 700,
          color: "#ffe067",
          fontSize: isMobile ? 17 : 21,
          marginBottom: 10,
          letterSpacing: "-0.5px"
        }}>
          {t("candidates") || "Candidates"}
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: isMobile ? "7px 11px" : "11px 20px",
            justifyContent: "flex-start",
          }}
        >
          {uniqueNames.map((name, idx) => (
            <span
              key={idx}
              style={{
                background: "#181d2c",
                color: "#fff",
                borderRadius: 8,
                padding: isMobile ? "5px 11px" : "7px 17px",
                fontWeight: 600,
                fontSize: isMobile ? 14 : 16,
                marginBottom: "5px",
                boxShadow: "0 2px 8px #11223319"
              }}
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
