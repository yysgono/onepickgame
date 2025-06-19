import React, { useState, useEffect } from "react";
import { getYoutubeId, saveWinnerStatsWithUser } from "../utils";
import { useTranslation } from "react-i18next";

// --------- bracket 생성 함수 ---------
// candidates 배열에서 원하는 크기로 bracket 만들어줌 (부전승 자리 null로)
// 12명으로 16강 할 때: shuffle 12 + [null, null, null, null] 총 16개 → 다시 shuffle
function makeInitialBracket(roundSize, players) {
  const byes = roundSize - players.length;
  const arr = shuffle(players).concat(Array(byes).fill(null));
  return shuffle(arr);
}

// 배열 셔플 함수
function shuffle(arr) {
  return arr
    .map((a) => [Math.random(), a])
    .sort((a, b) => a[0] - b[0])
    .map((a) => a[1]);
}

// 라운드 라벨
function getStageLabel(n) {
  if (n === 2) return "결승전";
  let power = 2;
  while (power < n) power *= 2;
  return `${power}강`;
}

// 남은 매치 수 계산
function getTotalRemainMatchCount(currentCandidates, idx) {
  let remain = Math.floor(currentCandidates.length / 2) - idx;
  let total = remain;
  let next = Math.floor(currentCandidates.length / 2);
  while (next > 1) {
    next = Math.floor(next / 2);
    total += next;
  }
  return total;
}

// 다음 라운드 텍스트 줄임 함수 (단어 수 제한, "a b c ..." 등으로 처리)
function truncateNames(candidates, maxWords = 3) {
  return candidates.map(c => {
    if (!c?.name) return "?";
    const words = c.name.split(/\s+/);
    if (words.length <= maxWords) return c.name;
    return words.slice(0, maxWords).join(" ") + "…";
  });
}

// ---- 메인 컴포넌트 ----
function Match({ cup, round, onResult }) {
  const { t } = useTranslation();

  // 1. 각 라운드별 brackets 상태로 관리 (최초 1개)
  const [brackets, setBrackets] = useState(() => [
    makeInitialBracket(round, cup.data)
  ]);
  const [idx, setIdx] = useState(0); // 현재 라운드에서 몇 번째 경기 중인지
  const [winners, setWinners] = useState([]); // 현재 라운드에서 이긴 후보들
  const [matchHistory, setMatchHistory] = useState([]); // 전체 대진 기록
  const [autoPlaying, setAutoPlaying] = useState(false); // 부전승 자동 진행 중인지
  const currentUser = localStorage.getItem("onepickgame_user") || "guest";

  // 항상 brackets에서 현재 라운드의 후보를 꺼내서 사용
  const candidates = brackets[brackets.length - 1];

  // =============== useEffect (훅) ===============

  // 1. "라운드 종료시" 자동 다음 라운드 진행
  useEffect(() => {
    if (!candidates || candidates.length < 2) return;

    // 현재 라운드 경기 다 돌았으면 (idx가 끝에 도달)
    if (idx >= Math.floor(candidates.length / 2) && winners.length > 0) {
      if (winners.length === 1) {
        // 최종 1명만 남았을 때 결과로!
        const realMatches = matchHistory.filter(x => x.c1 && x.c2 && x.winnerId);
        saveWinnerStatsWithUser(currentUser, cup.id, winners[0], realMatches);
        onResult(winners[0], realMatches);
        return;
      }
      // 다음 라운드 bracket 생성 (부전승 생기면 null 자동 추가)
      const nextRoundSize = Math.pow(2, Math.ceil(Math.log2(winners.length)));
      setBrackets(prev => [...prev, makeInitialBracket(nextRoundSize, winners)]);
      setWinners([]);
      setIdx(0);
    }
    // eslint-disable-next-line
  }, [idx, candidates, winners]);

  // 2. "부전승" 자동 진행
  useEffect(() => {
    if (!candidates || candidates.length < 2) return;
    if (idx >= Math.floor(candidates.length / 2)) return;
    const c1 = candidates[idx * 2];
    const c2 = candidates[idx * 2 + 1];
    if (c1 && c2) {
      setAutoPlaying(false);
      return;
    }
    setAutoPlaying(true);
    setTimeout(() => {
      if (c1 && !c2) handleAutoPick(0);
      else if (!c1 && c2) handleAutoPick(1);
      else if (!c1 && !c2) handleAutoPick(null); // 둘 다 없음: 다음 경기로
    }, 250); // UX상 살짝 delay
    // eslint-disable-next-line
  }, [idx, candidates]);

  // =============== 주요 함수 ===============

  function handlePick(winnerIdx) {
    if (autoPlaying) return; // 자동진행 중 클릭 막기
    const c1 = candidates[idx * 2];
    const c2 = candidates[idx * 2 + 1];
    if (!c1 || !c2) return;

    const winner = winnerIdx === 0 ? c1 : c2;
    const newHistory = [...matchHistory, { c1, c2, winnerId: winner.id }];
    const newWinners = [...winners, winner];

    setMatchHistory(newHistory);
    setWinners(newWinners);
    setIdx(idx + 1);
  }

  // 부전승/둘 다 없음 등 자동 처리
  function handleAutoPick(winnerIdx) {
    const c1 = candidates[idx * 2];
    const c2 = candidates[idx * 2 + 1];
    let winner = null;
    if (winnerIdx === 0) winner = c1;
    else if (winnerIdx === 1) winner = c2;

    // 부전승 혹은 둘 다 없음 처리
    let newHistory = matchHistory;
    let newWinners = winners;
    if (winner) {
      newHistory = [...matchHistory, { c1, c2, winnerId: winner.id }];
      newWinners = [...winners, winner];
    }
    setMatchHistory(newHistory);
    setWinners(newWinners);
    setIdx(idx + 1);
    setAutoPlaying(false);
  }

  // 진행중 매치
  const c1 = candidates ? candidates[idx * 2] : null;
  const c2 = candidates ? candidates[idx * 2 + 1] : null;
  const isFinal = candidates && Math.floor(candidates.length / 2) === 1;
  const totalRemainMatches = candidates
    ? getTotalRemainMatchCount(candidates, idx)
    : 0;

  const nextIdx = idx + 1;
  const nextRoundCandidates =
    candidates && nextIdx < Math.floor(candidates.length / 2)
      ? [candidates[nextIdx * 2], candidates[nextIdx * 2 + 1]].filter(Boolean)
      : [];

  // 반응형
  const vw = typeof window !== "undefined" ? Math.min(window.innerWidth, 900) : 900;
  const isMobile = vw < 700;

  const TITLE_SIZE = isMobile ? 66 : 100;
  const STAGE_SIZE = isMobile ? 15 : 20;
  const NAME_FONT_SIZE = isMobile ? 22 : 46;
  const NAME_HEIGHT = isMobile ? `${1.18 * 22 * 4}px` : `${1.18 * 46 * 4}px`;

  // 후보자 UI
  function CandidateBox({ c, onClick, disabled }) {
    const ytid = getYoutubeId(c?.image);
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
            ytid ? (
              <iframe
                width="100%"
                height="100%"
                style={{ border: "none", pointerEvents: "none" }}
                src={`https://www.youtube.com/embed/${ytid}?autoplay=0&mute=1`}
                title="YouTube video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            ) : (
              <img
                src={c?.image}
                alt={c?.name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                  pointerEvents: "none",
                }}
              />
            )
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

  // 렌더
  if (!candidates || candidates.length < 2) {
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
        {getStageLabel(candidates.length)}{" "}
        {isFinal ? "" : `${idx + 1} / ${Math.floor(candidates.length / 2)}`}
        <span
          style={{
            fontSize: STAGE_SIZE - 2,
            fontWeight: 700,
            color: "#194893",
            marginLeft: 11,
            verticalAlign: "middle",
          }}
        >
          (남은 대결 {totalRemainMatches}개)
        </span>
      </div>
      {!isFinal && nextRoundCandidates.length === 2 && (
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
