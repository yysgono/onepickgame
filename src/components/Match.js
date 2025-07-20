import React, { useState, useEffect, useRef } from "react";
import {
  insertWinnerLog,
  deleteOldWinnerLogAndStats,
  upsertMyWinnerStat_parallel,
  calcStatsFromMatchHistory,
} from "../utils";
import MediaRenderer from "./MediaRenderer";
import ResurrectionPage from "./ResurrectionPage";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

// Spinner
function Spinner({ size = 60 }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: size + 24,
        margin: "48px 0",
      }}
    >
      <div
        style={{
          width: size,
          height: size,
          border: `${size / 10}px solid #e3f0fb`,
          borderTop: `${size / 10}px solid #1976ed`,
          borderRadius: "50%",
          animation: "spin-fancy 1s linear infinite",
        }}
      />
      <style>
        {`
          @keyframes spin-fancy {
            0% { transform: rotate(0deg);}
            100% { transform: rotate(360deg);}
          }
        `}
      </style>
    </div>
  );
}

// Utility
function nextPowerOfTwo(n) {
  let k = 1;
  while (k < n) k *= 2;
  return k;
}
function shuffle(arr) {
  let m = arr.length, t, i;
  while (m) {
    i = Math.floor(Math.random() * m--);
    t = arr[m];
    arr[m] = arr[i];
    arr[i] = t;
  }
  return arr;
}
function makeFirstRound(players) {
  const shuffled = shuffle([...players]);
  const pow2 = nextPowerOfTwo(players.length);
  const byesCount = pow2 - players.length;
  const matches = [];
  const byes = [];
  for (let i = 0; i < players.length;) {
    if (byes.length < byesCount) {
      byes.push(shuffled[i]);
      i += 1;
    } else {
      matches.push([shuffled[i], shuffled[i + 1] || null]);
      i += 2;
    }
  }
  return { matches, byes };
}
function makeNextRound(winners) {
  const pairs = [];
  for (let i = 0; i < winners.length; i += 2) {
    pairs.push([winners[i], winners[i + 1] || null]);
  }
  return pairs;
}
function truncateNames(candidates, maxWords = 3) {
  return candidates.map((c) => {
    if (!c?.name) return "?";
    const words = c.name.split(/\s+/);
    if (words.length <= maxWords) return c.name;
    return words.slice(0, maxWords).join(" ") + "…";
  });
}

// i18n 스테이지라벨
function getStageLabel(t, n, isFirst = false) {
  if (isFirst) return t("round_of", { count: n });
  if (n === 2) return t("match.final");
  if (n === 4) return t("match.semiFinal");
  if (n === 8) return t("match.quarterFinal");
  if (n === 16) return t("match.round16");
  if (n === 32) return t("match.round32");
  if (n === 64) return t("match.round64");
  if (n === 128) return t("match.round128");
  return t("round_of", { count: n });
}

// AdaptiveTitle
function AdaptiveTitle({ title, isMobile }) {
  const ref = useRef();
  const [fontSize, setFontSize] = useState(isMobile ? 54 : 100);
  useEffect(() => {
    if (!ref.current) return;
    const boxHeight = isMobile ? 65 : 130;
    let size = isMobile ? 54 : 100;
    ref.current.style.fontSize = size + "px";
    while (ref.current.scrollHeight > boxHeight && size > (isMobile ? 22 : 38)) {
      size -= 2;
      ref.current.style.fontSize = size + "px";
    }
    setFontSize(size);
  }, [title, isMobile]);
  return (
    <div
      ref={ref}
      style={{
        fontWeight: 900,
        color: "#fff",
        letterSpacing: "-1.5px",
        lineHeight: 1.1,
        wordBreak: "break-all",
        textAlign: "center",
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
        fontSize: fontSize,
        maxWidth: isMobile ? "92vw" : 900,
        margin: isMobile ? "5px auto 0" : "13px auto 0",
        userSelect: "text",
      }}
      title={title}
    >
      {title}
    </div>
  );
}

// BackArrowButton
function BackArrowButton({ onClick, disabled, style }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label="Back"
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: 72,
        height: 72,
        borderRadius: "50%",
        border: "none",
        outline: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        background: "linear-gradient(135deg, #1976ed 35%, #5fd4f3 100%)",
        boxShadow: disabled
          ? "0 0 0 transparent"
          : "0 4px 28px 0 #1976ed60, 0 2px 14px #5fd4f340",
        filter: disabled
          ? "grayscale(0.7) brightness(0.75) blur(1px)"
          : "drop-shadow(0 0 8px #1976ed70)",
        transition:
          "background 0.18s, box-shadow 0.20s, transform 0.16s, filter 0.22s",
        opacity: disabled ? 0.38 : 1,
        backdropFilter: "blur(2.5px)",
        position: "relative",
        ...style,
      }}
      tabIndex={disabled ? -1 : 0}
    >
      <svg
        width="48"
        height="38"
        viewBox="0 0 48 38"
        fill="none"
        style={{
          display: "block",
          filter: "drop-shadow(0 0 8px #5fd4f3cc)",
        }}
      >
        <line
          x1="7"
          y1="19"
          x2="41"
          y2="19"
          stroke="#fff"
          strokeWidth="3.8"
          strokeLinecap="round"
        />
        <polyline
          points="18,7 7,19 18,31"
          fill="none"
          stroke="#fff"
          strokeWidth="3.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <style>
        {`
          button:active svg line,
          button:active svg polyline,
          button:hover:not(:disabled) svg line,
          button:hover:not(:disabled) svg polyline {
            stroke: #fff700;
            filter: drop-shadow(0 0 8px #fff7) drop-shadow(0 0 4px #1976ed99);
            transition: stroke 0.16s, filter 0.19s;
          }
        `}
      </style>
    </button>
  );
}

// CandidateBox
function CandidateBox({ c, onClick, disabled, idx, selected, t }) {
  const [hover, setHover] = useState(false);
  const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
  const isMobile = vw < 1000;
  const SIDE_BANNER = vw > 1400 ? 200 : 110;
  const CARD_MAX_WIDTH = 520;
  const CARD_WIDTH = isMobile
    ? "97vw"
    : `min(${CARD_MAX_WIDTH}px, calc((100vw - ${SIDE_BANNER * 2 + 80}px)/2))`;
  const CARD_HEIGHT = isMobile ? 380 : 560;
  const THUMB_HEIGHT = isMobile ? 280 : 480;
  const NEON_FONT = "'Orbitron', 'Pretendard', sans-serif";
  const mainDark = "#171C27";
  const blueLine = "#1976ed";

  return (
    <div
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        maxWidth: CARD_MAX_WIDTH,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        background: "rgba(17,27,55,0.82)",
        borderRadius: 22,
        boxShadow:
          hover && !isMobile
            ? "0 13px 46px 0 #fff5, 0 16px 48px 0 #1976ed22"
            : "0 8px 38px 0 #fff3, 0 2px 12px #1976ed18",
        border: selected ? "3.5px solid #5fd4f3" : "1.5px solid #223a74",
        transform: hover && !isMobile ? "translateY(-10px) scale(1.025)" : "",
        transition: "all 0.3s ease-in-out",
        margin: isMobile ? "2vw 0" : "32px 0",
        cursor: c && !disabled ? "pointer" : "default",
        backdropFilter: "blur(11px) brightness(1.06)",
        WebkitBackdropFilter: "blur(11px) brightness(1.06)",
        willChange: "transform",
        position: "relative",
        zIndex: hover && !isMobile ? 8 : 1,
        overflow: "hidden",
        animation: selected ? "fadeBlink 0.18s ease-in-out 2" : "none",
      }}
      onMouseEnter={() => !isMobile && setHover(true)}
      onMouseLeave={() => !isMobile && setHover(false)}
      onClick={c && !disabled ? onClick : undefined}
    >
      <div
        style={{
          position: "absolute",
          top: "-35%",
          left: "-14%",
          width: "150%",
          height: "190%",
          zIndex: 0,
          background: "radial-gradient(circle at 50% 60%, #fff 0%, #fff0 92%)",
          filter: "blur(38px)",
          opacity: 0.13,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          width: "100%",
          height: THUMB_HEIGHT,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(90deg, #172847 0%, #263b64 100%)",
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          overflow: "hidden",
          zIndex: 2,
        }}
      >
        {c ? (
          <MediaRenderer
            url={c.image}
            alt={c.name}
            playable
            style={{
              objectFit: "contain",
              width: "100%",
              height: "100%",
              background: "#21283a",
              padding: isMobile ? 8 : 20,
              boxSizing: "border-box",
            }}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "#222" }} />
        )}
      </div>
      <div
        style={{
          width: "100%",
          minHeight: isMobile ? 38 : 54,
          maxHeight: isMobile ? 44 : 70,
          padding: isMobile ? "4px 10px 0 10px" : "13px 18px 7px 18px",
          fontWeight: 900,
          fontSize: isMobile ? 19 : 28,
          color: "#fff",
          fontFamily: NEON_FONT,
          textAlign: "center",
          wordBreak: "break-all",
          lineHeight: 1.16,
          letterSpacing: "0.4px",
          boxSizing: "border-box",
          background: mainDark,
          borderBottom: `1.3px solid #1976ed66`,
        }}
        title={c?.name || ""}
      >
        <span
          style={{
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: 2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            textAlign: "center",
            lineHeight: 1.15,
            margin: 0,
            padding: 0,
            whiteSpace: "normal",
            wordBreak: "keep-all",
            fontFamily: NEON_FONT,
            fontWeight: 900,
          }}
        >
          {c ? c.name : t("bye_round")}
        </span>
      </div>
      <div
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: isMobile ? "8px 11px" : "17px 0 18px 0",
          background: mainDark,
          borderTop: "none",
          borderBottom: `2.5px solid ${blueLine}`,
          borderRadius: 0,
          marginTop: "auto",
        }}
      >
        <button
          style={{
            background: blueLine,
            color: "#fff",
            fontWeight: 900,
            border: "none",
            borderRadius: 13,
            fontSize: isMobile ? 15 : 20,
            padding: isMobile ? "8px 21px" : "14px 44px",
            outline: "none",
            cursor: c && !disabled ? "pointer" : "default",
            letterSpacing: "0.5px",
            fontFamily: NEON_FONT,
            margin: "0 auto",
            boxShadow: "0 2px 12px #1976ed22",
            transition: "background 0.15s",
            opacity: c ? 1 : 0.3,
          }}
          onClick={c && !disabled ? onClick : undefined}
        >
          {t("select")}
        </button>
      </div>
      <style>
        {`
          @keyframes fadeBlink {
            0% { opacity: 1; filter: brightness(1); }
            50% { opacity: 0.6; filter: brightness(1.3); }
            100% { opacity: 1; filter: brightness(1); }
          }
        `}
      </style>
    </div>
  );
}

// Main Match Component
function Match({ cup, onResult, selectedCount }) {
  const { t } = useTranslation();

  const [bracket, setBracket] = useState([]);
  const [idx, setIdx] = useState(0);
  const [roundNum, setRoundNum] = useState(1);
  const [pendingWinners, setPendingWinners] = useState([]);
  const [matchHistory, setMatchHistory] = useState([]);
  const [autoPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [historyStack, setHistoryStack] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(null);

  // Resurrection states
  const [showResurrect, setShowResurrect] = useState(false);
  const [resurrectUsed, setResurrectUsed] = useState(false);
  const [eliminatedCandidates, setEliminatedCandidates] = useState([]);
  const [advanceCandidates, setAdvanceCandidates] = useState([]);
  const [selElim, setSelElim] = useState([]);
  const [selAdv, setSelAdv] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    async function init() {
      setLoading(true);
      setError("");
      let players = cup.data;
      if (selectedCount && players.length > selectedCount) {
        players = shuffle([...players]).slice(0, selectedCount);
      }
      await deleteOldWinnerLogAndStats(cup.id);
      const { matches, byes } = makeFirstRound(players);
      setBracket(matches);
      setPendingWinners(byes);
      setIdx(0);
      setRoundNum(1);
      setMatchHistory([]);
      setHistoryStack([]);
      setSelectedIdx(null);
      setShowResurrect(false);
      setResurrectUsed(false);
      setEliminatedCandidates([]);
      setAdvanceCandidates([]);
      setSaving(false);
      setSelElim([]);
      setSelAdv([]);
      setLoading(false);
    }
    init();
    // eslint-disable-next-line
  }, [cup, selectedCount]);

  // 라운드 진행 및 ResurrectionPage 트리거
  useEffect(() => {
    if (idx === bracket.length && bracket.length > 0 && !showResurrect) {
      const matchWinners = matchHistory
        .slice(-bracket.length)
        .map((m) => m.winner)
        .filter(Boolean);

      const nextRoundCandidates =
        roundNum === 1 ? [...pendingWinners, ...matchWinners] : matchWinners;

      // ===[ 패자부활전 정확히 1라운드 종료 후, 16명 남았을 때 ]===
      if (
        !resurrectUsed &&
        cup.data.length >= 32 &&
        nextRoundCandidates.length === 16 &&
        roundNum === 1
      ) {
        const allIds = new Set(nextRoundCandidates.map((c) => c.id));
        const eliminated = cup.data.filter((c) => !allIds.has(c.id));
        setShowResurrect(true);
        setEliminatedCandidates(eliminated);
        setAdvanceCandidates(nextRoundCandidates);
        return;
      }

      // 우승자 확정
      if (nextRoundCandidates.length === 1) {
        handleFinish(nextRoundCandidates[0], matchHistory);
        return;
      }

      const nextBracket = makeNextRound(nextRoundCandidates);
      setBracket(nextBracket);
      setPendingWinners([]);
      setIdx(0);
      setRoundNum((r) => r + 1);
      setHistoryStack([]);
      setSelectedIdx(null);
    }
    // eslint-disable-next-line
  }, [idx, bracket, matchHistory, pendingWinners, cup, roundNum, showResurrect, resurrectUsed]);

  // Resurrection confirm/cancel
  function handleResurrectCancel() {
    setShowResurrect(false);
    setResurrectUsed(true);
    setBracket(makeNextRound(advanceCandidates));
    setPendingWinners([]);
    setIdx(0);
    setRoundNum((r) => r + 1);
    setHistoryStack([]);
    setSelectedIdx(null);
    setAdvanceCandidates([]);
    setEliminatedCandidates([]);
    setSelElim([]);
    setSelAdv([]);
  }
  function handleResurrectConfirm(final16) {
    setShowResurrect(false);
    setResurrectUsed(true);
    setBracket(makeNextRound(final16));
    setPendingWinners([]);
    setIdx(0);
    setRoundNum((r) => r + 1);
    setHistoryStack([]);
    setSelectedIdx(null);
    setAdvanceCandidates([]);
    setEliminatedCandidates([]);
    setSelElim([]);
    setSelAdv([]);
  }

  // 최종 저장 및 결과화면 이동
  async function handleFinish(winner, matchHistory) {
    setSaving(true);
    setError("");
    try {
      const statsArr = calcStatsFromMatchHistory(cup.data, winner, matchHistory);
      await Promise.all([
        insertWinnerLog(cup.id, winner.id),
        upsertMyWinnerStat_parallel(statsArr, cup.id),
      ]);
      setSaving(false);
      setShouldRedirect({ cup, winner });
    } catch (e) {
      setSaving(false);
      setError(t("error_saving_result"));
    }
  }

  useEffect(() => {
    if (shouldRedirect) {
      navigate(`/result/${cup.id}`, { state: shouldRedirect });
    }
    // eslint-disable-next-line
  }, [shouldRedirect]);

  const currentMatch = bracket[idx] || [];
  const [c1, c2] = currentMatch;

  // Bye 자동 진출 처리
  useEffect(() => {
    if (!c1 || !c2) {
      if (c1 || c2) {
        setTimeout(() => {
          handlePick(c1 ? 0 : 1);
        }, 150);
      }
    }
    // eslint-disable-next-line
  }, [idx, bracket]);

  // 승자 선택
  function handlePick(winnerIdx) {
    if (autoPlaying || selectedIdx !== null) return;
    setHistoryStack((prev) => [
      ...prev,
      {
        idx,
        roundNum,
        bracket: JSON.parse(JSON.stringify(bracket)),
        pendingWinners: JSON.parse(JSON.stringify(pendingWinners)),
        matchHistory: JSON.parse(JSON.stringify(matchHistory)),
      },
    ]);
    setSelectedIdx(winnerIdx);
    setTimeout(() => {
      const winner = winnerIdx === 0 ? c1 : c2;
      setMatchHistory((prev) => [...prev, { round: roundNum, c1, c2, winner }]);
      setIdx(idx + 1);
      setSelectedIdx(null);
    }, 180);
  }

  // Undo (이전으로)
  function handleBack() {
    if (showResurrect || (resurrectUsed && roundNum === 3 && idx === 0)) return;
    if (!historyStack.length || selectedIdx !== null) return;
    const prev = historyStack[historyStack.length - 1];
    setIdx(prev.idx);
    setRoundNum(prev.roundNum);
    setBracket(prev.bracket);
    setPendingWinners(prev.pendingWinners);
    setMatchHistory(prev.matchHistory);
    setHistoryStack(historyStack.slice(0, -1));
    setSelectedIdx(null);
  }

  const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
  const isMobile = vw < 1000;
  const STAGE_SIZE = isMobile ? 15 : 20;
  const nextIdx = idx + 1;
  const nextRoundCandidates =
    bracket && nextIdx < bracket.length
      ? [bracket[nextIdx][0], bracket[nextIdx][1]].filter(Boolean)
      : [];

  if (loading)
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginTop: 24,
        }}
      >
        <Spinner size={70} />
        <div
          style={{
            marginTop: 6,
            fontSize: 20,
            color: "#1976ed",
            fontWeight: 700,
            letterSpacing: "-1px",
          }}
        >
          {t("shuffling_candidates")}
        </div>
      </div>
    );

  if (saving)
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <Spinner size={70} />
        <div
          style={{
            marginTop: 18,
            fontSize: 22,
            color: "#1976ed",
            fontWeight: 900,
            letterSpacing: "-1px",
          }}
        >
          {t("saving")}
        </div>
      </div>
    );

  if (!bracket || bracket.length === 0)
    return <div>{t("notEnoughCandidates")}</div>;

  // 패자부활전 페이지
  if (showResurrect)
    return (
      <ResurrectionPage
        eliminated={eliminatedCandidates}
        advanced={advanceCandidates}
        maxElim={4}
        maxAdv={4}
        selElim={selElim}
        setSelElim={setSelElim}
        selAdv={selAdv}
        setSelAdv={setSelAdv}
        onConfirm={handleResurrectConfirm}
        onCancel={handleResurrectCancel}
        isSaving={saving}
        saveInProgressMsg={saving ? t("saving") : ""}
      />
    );

  // 기본 매치 UI
  return (
    <div
      style={{
        textAlign: "center",
        padding: isMobile ? "10px 0 0 0" : "12px 0 0 0",
        minHeight: "75vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        fontFamily:
          "'Noto Sans', 'Apple SD Gothic Neo', 'Malgun Gothic', Arial, sans-serif",
        position: "relative",
      }}
    >
      <AdaptiveTitle title={cup.title} isMobile={isMobile} />
      <div
        style={{
          fontSize: STAGE_SIZE,
          fontWeight: 800,
          marginBottom: isMobile ? 5 : 11,
          color: "#fff",
        }}
      >
        {getStageLabel(t, bracket.length * 2 + pendingWinners.length, roundNum === 1)}{" "}
        {bracket.length === 1 ? "" : `${idx + 1} / ${bracket.length}`}
      </div>
      {error && (
        <div
          style={{ color: "#d33", fontWeight: 700, marginBottom: 15, fontSize: 18 }}
        >
          {error}
        </div>
      )}
      {roundNum === 1 && pendingWinners.length > 0 && (
        <div style={{ color: "#888", margin: "7px 0 15px 0" }}>
          {t("auto_bye_message", { selectedRound: bracket.length * 2, count: pendingWinners.length })}
        </div>
      )}
      {bracket.length > 1 && nextRoundCandidates.length === 2 && (
        <div
          style={{
            background: "linear-gradient(90deg,#fafdff 80%,#e3f0fb 100%)",
            borderRadius: 11,
            boxShadow: "0 1px 6px #1976ed18",
            padding: isMobile ? "3px 6px" : "9px 20px",
            margin: isMobile ? "2px 0 6px 0" : "2px 0 11px 0",
            display: "inline-flex",
            alignItems: "center",
            fontSize: STAGE_SIZE,
            color: "#1976ed",
            gap: 6,
            maxWidth: isMobile ? "90vw" : 600,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            justifyContent: "center",
            userSelect: "text",
          }}
          title={
            t("nextRoundTitle", {
              a: nextRoundCandidates[0]?.name || "",
              b: nextRoundCandidates[1]?.name || ""
            })
          }
        >
          <b>{t("next_round")}</b>{" "}
          {truncateNames(nextRoundCandidates).map((name, i) => (
            <React.Fragment key={i}>
              <span
                style={{
                  fontWeight: 700,
                  margin: "0 4px",
                  maxWidth: 140,
                  display: "inline-block",
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                }}
              >
                {name}
              </span>
              {i === 0 && (
                <span
                  style={{
                    fontWeight: 400,
                    fontSize: STAGE_SIZE * 0.9,
                  }}
                >
                  {t("vs") || "vs"}
                </span>
              )}
            </React.Fragment>
          ))}
        </div>
      )}
      {/* Match cards and Back button */}
      <div
        style={{
          width: "100vw",
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "stretch",
          gap: isMobile ? 11 : 44,
          margin: 0,
          padding: 0,
          boxSizing: "border-box",
          position: "relative",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1,
        }}
      >
        <CandidateBox
          c={c1}
          onClick={() => handlePick(0)}
          disabled={autoPlaying || selectedIdx !== null}
          idx={0}
          selected={selectedIdx === 0}
          t={t}
        />
        <CandidateBox
          c={c2}
          onClick={() => handlePick(1)}
          disabled={autoPlaying || selectedIdx !== null}
          idx={1}
          selected={selectedIdx === 1}
          t={t}
        />
        {/* Back Button */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: isMobile ? "10px" : "22px",
            transform: "translate(-50%, 0)",
            zIndex: 99,
          }}
        >
          <BackArrowButton
            onClick={handleBack}
            disabled={
              showResurrect ||
              (resurrectUsed && roundNum === 3 && idx === 0) ||
              historyStack.length === 0 ||
              selectedIdx !== null
            }
          />
        </div>
      </div>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&display=swap');
        `}
      </style>
    </div>
  );
}

export default Match;
