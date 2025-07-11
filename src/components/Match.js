import React, { useState, useEffect, useRef } from "react";
import {
  insertWinnerLog,
  deleteOldWinnerLogAndStats,
  upsertMyWinnerStat,
  calcStatsFromMatchHistory,
} from "../utils";
import MediaRenderer from "./MediaRenderer";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

// 제목 (텍스트만, 박스X)
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

// Spinner (로딩)
function Spinner({ size = 60 }) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: size + 24,
      margin: "48px 0"
    }}>
      <div style={{
        width: size,
        height: size,
        border: `${size / 10}px solid #e3f0fb`,
        borderTop: `${size / 10}px solid #1976ed`,
        borderRadius: "50%",
        animation: "spin-fancy 1s linear infinite"
      }} />
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

// [카드만 변경] 더 크게 + 사이드배너와 겹치지 않게!
function CandidateBox({ c, onClick, disabled, idx }) {
  const [hover, setHover] = useState(false);
  const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
  const isMobile = vw < 1000;

  // 카드 사이드 공간 확보 (좌우 배너 폭 약 200px씩, gap 40px씩 여유!)
  const SIDE_BANNER = vw > 1400 ? 200 : 110;
  const CARD_MAX_WIDTH = 520; // 카드 최대폭 (원하면 더 키워도됨)
  const CARD_WIDTH = isMobile
    ? "97vw"
    : `min(${CARD_MAX_WIDTH}px, calc((100vw - ${SIDE_BANNER * 2 + 80}px)/2))`;
const CARD_HEIGHT = isMobile ? 380 : 560;       // 높이 크게!
const THUMB_HEIGHT = isMobile ? 280 : 480;      // 썸네일도 확장!

  const NEON_FONT = "'Orbitron', 'Pretendard', sans-serif";
  const mainDark = "#171C27";
  const blueLine = "#1976ed";

  return (
    <div
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        maxWidth: CARD_WIDTH,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        background: "rgba(17,27,55,0.82)",
        borderRadius: 22,
        boxShadow: hover && !isMobile
          ? "0 13px 46px 0 #fff5, 0 16px 48px 0 #1976ed22"
          : "0 8px 38px 0 #fff3, 0 2px 12px #1976ed18",
        border: "1.5px solid #223a74",
        transition: "box-shadow 0.22s, transform 0.20s cubic-bezier(.23,1.05,.32,1)",
        margin: isMobile ? "2vw 0" : "32px 0",
        cursor: c ? "pointer" : "default",
        backdropFilter: "blur(11px) brightness(1.06)",
        WebkitBackdropFilter: "blur(11px) brightness(1.06)",
        willChange: "transform",
        position: "relative",
        zIndex: hover && !isMobile ? 8 : 1,
        transform: hover && !isMobile ? "translateY(-10px) scale(1.025)" : "",
        overflow: "hidden"
      }}
      onMouseEnter={() => !isMobile && setHover(true)}
      onMouseLeave={() => !isMobile && setHover(false)}
      onClick={c ? onClick : undefined}
    >
      {/* 은은한 glow */}
      <div style={{
        position: "absolute",
        top: "-35%",
        left: "-14%",
        width: "150%",
        height: "190%",
        zIndex: 0,
        background:
          "radial-gradient(circle at 50% 60%, #fff 0%, #fff0 92%)",
        filter: "blur(38px)",
        opacity: 0.13,
        pointerEvents: "none",
      }} />
      {/* 썸네일 */}
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
          <MediaRenderer url={c.image} alt={c.name} playable />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "#222" }} />
        )}
      </div>
      {/* 이름/버튼 */}
      <div
        style={{
          width: "100%",
          minHeight: isMobile ? 38 : 54,
          maxHeight: isMobile ? 44 : 70,
          padding: isMobile ? "4px 10px 0 10px" : "13px 18px 7px 18px",
          fontWeight: 900,
          fontSize: isMobile ? 18 : 26,
          color: "#fff",
          fontFamily: NEON_FONT,
          textAlign: "center",
          wordBreak: "break-all",
          lineHeight: 1.16,
          letterSpacing: "0.4px",
          boxSizing: "border-box",
          background: mainDark,
          borderBottom: `1.3px solid #1976ed66`
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
          {c ? c.name : "부전승"}
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
            cursor: c ? "pointer" : "default",
            letterSpacing: "0.5px",
            fontFamily: NEON_FONT,
            margin: "0 auto",
            boxShadow: "0 2px 12px #1976ed22",
            transition: "background 0.15s",
            opacity: c ? 1 : 0.3
          }}
          onClick={c ? onClick : undefined}
        >선택</button>
      </div>
    </div>
  );
}

// 아래는 모두 기존과 동일
function getStageLabel(n, isFirst = false) {
  if (isFirst) return `${n}강`;
  if (n === 2) return "결승전";
  if (n === 4) return "4강";
  if (n === 8) return "8강";
  if (n === 16) return "16강";
  if (n === 32) return "32강";
  if (n === 64) return "64강";
  if (n === 128) return "128강";
  return `${n}강`;
}

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
  return candidates.map(c => {
    if (!c?.name) return "?";
    const words = c.name.split(/\s+/);
    if (words.length <= maxWords) return c.name;
    return words.slice(0, maxWords).join(" ") + "…";
  });
}

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
  const navigate = useNavigate();

  useEffect(() => {
    async function init() {
      setLoading(true);
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
      setLoading(false);
    }
    init();
    // eslint-disable-next-line
  }, [cup, selectedCount]);

  useEffect(() => {
    if (idx === bracket.length && bracket.length > 0) {
      const matchWinners = matchHistory
        .slice(-bracket.length)
        .map(m => m.winner)
        .filter(Boolean);
      const nextRoundCandidates =
        roundNum === 1 ? [...pendingWinners, ...matchWinners] : matchWinners;
      if (nextRoundCandidates.length === 1) {
        handleFinish(nextRoundCandidates[0], matchHistory);
        return;
      }
      const nextBracket = makeNextRound(nextRoundCandidates);
      setBracket(nextBracket);
      setPendingWinners([]);
      setIdx(0);
      setRoundNum(r => r + 1);
    }
    // eslint-disable-next-line
  }, [idx, bracket, matchHistory, pendingWinners, cup, roundNum]);

  async function handleFinish(winner, matchHistory) {
    setSaving(true);
    await insertWinnerLog(cup.id, winner.id);
    const statsArr = calcStatsFromMatchHistory(
      cup.data,
      winner,
      matchHistory
    );
    for (const stat of statsArr) {
      await upsertMyWinnerStat({
        cup_id: cup.id,
        candidate_id: stat.candidate_id,
        win_count: stat.win_count,
        match_wins: stat.match_wins,
        match_count: stat.match_count,
        total_games: stat.total_games,
        name: stat.name,
        image: stat.image,
      });
    }
    setSaving(false);
    navigate(`/result/${cup.id}`, { state: { cup, winner } });
  }

  const currentMatch = bracket[idx] || [];
  const [c1, c2] = currentMatch;
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

  function handlePick(winnerIdx) {
    if (autoPlaying) return;
    const winner = winnerIdx === 0 ? c1 : c2;
    setMatchHistory((prev) => [
      ...prev,
      { round: roundNum, c1, c2, winner },
    ]);
    setIdx(idx + 1);
  }

  const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
  const isMobile = vw < 1000;
  const STAGE_SIZE = isMobile ? 15 : 20;
  const nextIdx = idx + 1;
  const nextRoundCandidates =
    bracket && nextIdx < bracket.length
      ? [bracket[nextIdx][0], bracket[nextIdx][1]].filter(Boolean)
      : [];

  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 24 }}>
      <Spinner size={70} />
      <div style={{
        marginTop: 6,
        fontSize: 20,
        color: "#1976ed",
        fontWeight: 700,
        letterSpacing: "-1px"
      }}>
        후보들을 섞는 중...
      </div>
    </div>
  );
  if (saving) return (
    <div style={{
      minHeight: "60vh",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      textAlign: "center"
    }}>
      <Spinner size={70} />
      <div style={{
        marginTop: 18,
        fontSize: 22,
        color: "#1976ed",
        fontWeight: 900,
        letterSpacing: "-1px"
      }}>
        두구두구두구..
      </div>
    </div>
  );
  if (!bracket || bracket.length === 0) return <div>{t("notEnoughCandidates")}</div>;

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
        {getStageLabel(bracket.length * 2 + pendingWinners.length, roundNum === 1)}{" "}
        {bracket.length === 1 ? "" : `${idx + 1} / ${bracket.length}`}
      </div>
      {roundNum === 1 && pendingWinners.length > 0 && (
        <div style={{ color: "#888", margin: "7px 0 15px 0" }}>
          {pendingWinners.length}명은 부전승으로 다음 라운드 자동 진출!
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
          title={`다음 라운드: ${nextRoundCandidates[0]?.name || ""} vs ${nextRoundCandidates[1]?.name || ""}`}
        >
          <b>다음 라운드:</b>{" "}
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
                  vs
                </span>
              )}
            </React.Fragment>
          ))}
        </div>
      )}
      {/* 카드 영역 (gap 조절 필요하면 여기!) */}
      <div
        style={{
          width: "100vw",
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "stretch",
          gap: isMobile ? 11 : 44, // 여백 넉넉히!
          margin: 0,
          padding: 0,
          boxSizing: "border-box",
          position: "relative",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1,
        }}
      >
        <CandidateBox c={c1} onClick={() => handlePick(0)} disabled={autoPlaying} idx={0} />
        <CandidateBox c={c2} onClick={() => handlePick(1)} disabled={autoPlaying} idx={1} />
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
