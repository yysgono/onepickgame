import React, { useState, useEffect } from "react";
import {
  insertWinnerLog,
  deleteOldWinnerLogAndStats,
  upsertMyWinnerStat,
  calcStatsFromMatchHistory,
} from "../utils";
import MediaRenderer from "./MediaRenderer";
import { useTranslation } from "react-i18next";

// ---- Spinner 컴포넌트 ----
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
  // 두 번째 라운드부터는 셔플 안함 (첫 라운드만 섞고 이후 고정 진행)
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

  // 초기화 (시작/다시하기/홈에서 시작 시)
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

  // 라운드 끝나면 다음 라운드/최종 결과 저장
  useEffect(() => {
    if (idx === bracket.length && bracket.length > 0) {
      const matchWinners = matchHistory
        .slice(-bracket.length)
        .map(m => m.winner)
        .filter(Boolean);
      const nextRoundCandidates =
        roundNum === 1 ? [...pendingWinners, ...matchWinners] : matchWinners;
      if (nextRoundCandidates.length === 1) {
        // 🟢 결과페이지 먼저 이동!
        onResult(nextRoundCandidates[0], matchHistory);

        // 🟡 DB저장은 느긋하게~ (사용자는 기다릴 필요 없음)
        insertWinnerLog(cup.id, nextRoundCandidates[0]?.id).then(async (canSave) => {
          if (canSave) {
            const statsArr = calcStatsFromMatchHistory(
              cup.data,
              nextRoundCandidates[0],
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
          }
        });
        return;
      }
      const nextBracket = makeNextRound(nextRoundCandidates);
      setBracket(nextBracket);
      setPendingWinners([]);
      setIdx(0);
      setRoundNum(r => r + 1);
    }
  }, [idx, bracket, matchHistory, pendingWinners, cup, onResult, roundNum]);

  // 부전승 처리
  const currentMatch = bracket[idx] || [];
  const [c1, c2] = currentMatch;
  useEffect(() => {
    if (!c1 || !c2) {
      if (c1 || c2) {
        setTimeout(() => {
          handlePick(c1 ? 0 : 1);
        }, 150); // 300→150ms로 조정
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

  const vw = typeof window !== "undefined" ? Math.min(window.innerWidth, 900) : 900;
  const isMobile = vw < 700;
  const TITLE_SIZE = isMobile ? 66 : 100;
  const STAGE_SIZE = isMobile ? 15 : 20;
  const NAME_FONT_SIZE = isMobile ? 22 : 46;
  const NAME_HEIGHT = isMobile ? `${1.18 * 22 * 4}px` : `${1.18 * 46 * 4}px`;
  const nextIdx = idx + 1;
  const nextRoundCandidates =
    bracket && nextIdx < bracket.length
      ? [bracket[nextIdx][0], bracket[nextIdx][1]].filter(Boolean)
      : [];

  function CandidateBox({ c, onClick, disabled }) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          margin: isMobile ? "0" : "0 8px 0 8px",
          flex: 1,
          minWidth: isMobile ? "0" : 340,
          maxWidth: isMobile ? "100vw" : 700,
          width: isMobile ? "50vw" : 340,
          boxSizing: "border-box",
          opacity: c ? 1 : 0.25,
          cursor: c ? "pointer" : "default",
        }}
      >
        <button
          onClick={c ? onClick : undefined}
          disabled={!c || disabled}
          style={{
            width: "80%",
            padding: isMobile ? "9px 0" : "14px 0",
            background: "linear-gradient(90deg, #1976ed 65%, #45b7fa 100%)",
            color: "#fff",
            border: "none",
            borderRadius: 15,
            fontWeight: 900,
            fontSize: isMobile ? 15 : 22,
            boxShadow: "0 2px 10px #1976ed13",
            letterSpacing: "-0.5px",
            marginBottom: isMobile ? 5 : 9,
            cursor: c ? "pointer" : "default",
            opacity: c ? 1 : 0.25,
          }}
        >
          {c ? t("select") : t("bye") || "부전승"}
        </button>
        <div
          style={{
            width: "100%",
            aspectRatio: "1/1",
            maxWidth: isMobile ? "100vw" : 700,
            minWidth: isMobile ? "0" : 340,
            borderRadius: 22,
            boxShadow: "0 4px 24px #1976ed22, 0 2px 12px #b4c4e4",
            overflow: "hidden",
            background: "#e7f3fd",
            marginBottom: isMobile ? 3 : 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: c ? "pointer" : "default",
            boxSizing: "border-box",
            opacity: c ? 1 : 0.25,
          }}
          onClick={c ? onClick : undefined}
        >
          {c ? (
            <MediaRenderer url={c.image} alt={c.name} />
          ) : (
            <span style={{ fontSize: isMobile ? 19 : 32, color: "#bbb" }}>
              {t("bye") || "BYE"}
            </span>
          )}
        </div>
        <div
          style={{
            fontWeight: 900,
            fontSize: NAME_FONT_SIZE,
            color: "#194893",
            textAlign: "center",
            wordBreak: "break-all",
            lineHeight: 1.18,
            height: NAME_HEIGHT,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 4,
            WebkitBoxOrient: "vertical",
            textOverflow: "ellipsis",
            whiteSpace: "normal",
          }}
        >
          {c?.name}
        </div>
      </div>
    );
  }

  // 👉 여기에서 Spinner와 문구 적용!
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
      <div
        style={{
          fontSize: TITLE_SIZE,
          fontWeight: 900,
          color: "#1976ed",
          margin: isMobile ? "5px 0 0 0" : "13px 0 0 0",
          letterSpacing: "-1.5px",
          lineHeight: 1.1,
        }}
      >
        {cup.title}
      </div>
      <div
        style={{
          fontSize: STAGE_SIZE,
          fontWeight: 800,
          marginBottom: isMobile ? 5 : 11,
          color: "#194893",
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
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "row",
          alignItems: "stretch",
          justifyContent: "center",
          gap: isMobile ? 0 : 27,
          margin: isMobile ? "2vw 0" : "10px 0 6px 0",
        }}
      >
        <CandidateBox c={c1} onClick={() => handlePick(0)} disabled={autoPlaying} />
        <CandidateBox c={c2} onClick={() => handlePick(1)} disabled={autoPlaying} />
      </div>
    </div>
  );
}

export default Match;
