import React, { useState, useEffect } from "react";
import { getYoutubeId, saveWinnerStatsWithUser } from "../utils";
import { useTranslation } from "react-i18next";
import MediaRenderer from "./MediaRenderer";

// 1라운드: n명 참가자를 2의 거듭제곱 bracket + 부전승 생성
function makeFirstRound(players) {
  const n = players.length;
  const nextPowerOf2 = 2 ** Math.ceil(Math.log2(n));
  const numByes = nextPowerOf2 - n;

  const shuffled = shuffle([...players]);
  const byes = shuffled.slice(0, numByes);
  const rest = shuffled.slice(numByes);

  const matches = [];
  for (let i = 0; i < rest.length; i += 2) {
    matches.push([rest[i], rest[i + 1] || null]);
  }
  return { matches, byes };
}

// 2라운드 이상: 무조건 2의 제곱 bracket
function makeNextRound(winners) {
  const shuffled = shuffle([...winners]);
  const matches = [];
  for (let i = 0; i < shuffled.length; i += 2) {
    matches.push([shuffled[i], shuffled[i + 1] || null]);
  }
  return matches;
}

// Fisher–Yates shuffle
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

function getStageLabel(n) {
  if (n === 2) return "결승전";
  if (n === 4) return "4강";
  if (n === 8) return "8강";
  if (n === 16) return "16강";
  if (n === 32) return "32강";
  if (n === 64) return "64강";
  if (n === 128) return "128강";
  return `${n}강`;
}

// 후보 이름 3단어로 줄여서 예쁘게
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
  const [autoPlaying, setAutoPlaying] = useState(false);

  // 최초 1라운드 준비
  useEffect(() => {
    let players = cup.data;
    if (selectedCount && players.length > selectedCount) {
      players = shuffle([...players]).slice(0, selectedCount);
    }
    const { matches, byes } = makeFirstRound(players);
    setBracket(matches);
    setPendingWinners(byes);
    setIdx(0);
    setRoundNum(1);
    setMatchHistory([]);
  }, [cup, selectedCount]);

  // 라운드 종료 시 → 다음 라운드 준비 또는 우승자
  useEffect(() => {
    if (idx === bracket.length && bracket.length > 0) {
      const matchWinners = matchHistory
        .slice(-bracket.length)
        .map(m => m.winner)
        .filter(Boolean);

      const nextRoundCandidates =
        roundNum === 1 ? [...pendingWinners, ...matchWinners] : matchWinners;

      // 종료: 1명 남으면 끝!
      if (nextRoundCandidates.length === 1) {
        saveWinnerStatsWithUser(
          cup.id,
          nextRoundCandidates[0],
          matchHistory
        );
        onResult(nextRoundCandidates[0], matchHistory);
        return;
      }
      // 다음 라운드: 2의 제곱 bracket, 부전승 없음
      const nextBracket = makeNextRound(nextRoundCandidates);
      setBracket(nextBracket);
      setPendingWinners([]);
      setIdx(0);
      setRoundNum(r => r + 1);
    }
  }, [idx, bracket, matchHistory, pendingWinners, cup.id, onResult, roundNum]);

  // 현재 경기
  const currentMatch = bracket[idx] || [];
  const [c1, c2] = currentMatch;

  // 부전승 매치 자동 처리
  useEffect(() => {
    if (!c1 || !c2) {
      if (c1 || c2) {
        setTimeout(() => {
          handlePick(c1 ? 0 : 1);
        }, 300);
      }
    }
    // eslint-disable-next-line
  }, [idx, bracket]);

  function handlePick(winnerIdx) {
    if (autoPlaying) return;
    const winner = winnerIdx === 0 ? c1 : c2;
    setMatchHistory([
      ...matchHistory,
      { round: roundNum, c1, c2, winner },
    ]);
    setIdx(idx + 1);
  }

  // --- UI (기존과 동일하게)
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
    const ytid = getYoutubeId(c?.image);
    const isYoutube = !!ytid;
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
          cursor: !isYoutube && c ? "pointer" : "default",
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
            cursor: !isYoutube && c ? onClick : "default",
            boxSizing: "border-box",
            opacity: c ? 1 : 0.25,
          }}
          onClick={!isYoutube && c ? onClick : undefined}
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

  if (!bracket || bracket.length === 0) {
    return <div>{t("notEnoughCandidates")}</div>;
  }

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
        {getStageLabel(bracket.length * 2)}{" "}
        {bracket.length === 1 ? "" : `${idx + 1} / ${bracket.length}`}
      </div>
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
