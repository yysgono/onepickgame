// src/components/Match.js

import React, {

  useEffect,

  useRef,

  useState,

} from "react";



import {

  calcStatsFromMatchHistory,

  deleteOldWinnerLogAndStats,

  fetchWinnerStatsFromDB,

  fetchHeadToHead,

  insertWinnerLog,

  saveHeadToHeadStats,

  upsertMyWinnerStat_parallel,

} from "../utils";



import MediaRenderer from "./MediaRenderer";

import ResurrectionPage from "./ResurrectionPage";



import {

  useLocation,

  useNavigate,

} from "react-router-dom";



import {

  useTranslation,

} from "react-i18next";



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

          border:

            `${size / 10}px solid #e3f0fb`,

          borderTop:

            `${size / 10}px solid #1976ed`,

          borderRadius: "50%",

          animation:

            "spin-fancy 1s linear infinite",

        }}

      />



      <style>

        {`

          @keyframes spin-fancy {

            0% {

              transform: rotate(0deg);

            }



            100% {

              transform: rotate(360deg);

            }

          }

        `}

      </style>

    </div>

  );

}



// Utility

function nextPowerOfTwo(n) {

  let k = 1;



  while (k < n) {

    k *= 2;

  }



  return k;

}



function shuffle(arr) {

  let m = arr.length;

  let t;

  let i;



  while (m) {

    i = Math.floor(

      Math.random() * m--

    );



    t = arr[m];

    arr[m] = arr[i];

    arr[i] = t;

  }



  return arr;

}



function makeFirstRound(players) {

  const shuffled = shuffle([

    ...players,

  ]);



  const pow2 = nextPowerOfTwo(

    players.length

  );



  const byesCount =

    pow2 - players.length;



  const matches = [];

  const byes = [];



  for (

    let i = 0;

    i < players.length;



  ) {

    if (

      byes.length < byesCount

    ) {

      byes.push(shuffled[i]);

      i += 1;

    } else {

      matches.push([

        shuffled[i],

        shuffled[i + 1] || null,

      ]);



      i += 2;

    }

  }



  return {

    matches,

    byes,

  };

}



function makeNextRound(winners) {

  const pairs = [];



  for (

    let i = 0;

    i < winners.length;

    i += 2

  ) {

    pairs.push([

      winners[i],

      winners[i + 1] || null,

    ]);

  }



  return pairs;

}



function truncateNames(

  candidates,

  maxWords = 3

) {

  return candidates.map(

    (candidate) => {

      if (!candidate?.name) {

        return "?";

      }



      const words =

        candidate.name.split(/\s+/);



      if (

        words.length <= maxWords

      ) {

        return candidate.name;

      }



      return (

        words

          .slice(0, maxWords)

          .join(" ") + "…"

      );

    }

  );

}



// i18n 스테이지 라벨

function getStageLabel(

  t,

  n,

  isFirst = false

) {

  if (isFirst) {

    return t("round_of", {

      count: n,

    });

  }



  if (n === 2) {

    return t("match.final");

  }



  if (n === 4) {

    return t(

      "match.semiFinal"

    );

  }



  if (n === 8) {

    return t(

      "match.quarterFinal"

    );

  }



  if (n === 16) {

    return t("match.round16");

  }



  if (n === 32) {

    return t("match.round32");

  }



  if (n === 64) {

    return t("match.round64");

  }



  if (n === 128) {

    return t(

      "match.round128"

    );

  }



  return t("round_of", {

    count: n,

  });

}



// AdaptiveTitle

function AdaptiveTitle({

  title,

  isMobile,

}) {

  const ref = useRef();



  const [

    fontSize,

    setFontSize,

  ] = useState(

    isMobile ? 38 : 54

  );



  useEffect(() => {

    if (!ref.current) {

      return;

    }



    // 제목은 최대 2줄까지만 허용

    const boxHeight =

      isMobile ? 72 : 112;



    // 너무 크게 시작하지 않도록 조정

    let size =

      isMobile ? 38 : 54;



    const minSize =

      isMobile ? 22 : 32;



    ref.current.style.fontSize =

      `${size}px`;



    while (

      ref.current.scrollHeight >

        boxHeight &&

      size > minSize

    ) {

      size -= 1;



      ref.current.style.fontSize =

        `${size}px`;

    }



    setFontSize(size);

  }, [

    title,

    isMobile,

  ]);



  return (

    <div

      ref={ref}

      style={{

        fontWeight: 900,

        color: "#202534",



        fontSize,



        // 제목 가독성

        letterSpacing: isMobile

          ? "-0.5px"

          : "-1px",

        lineHeight: 1.15,



        // ★ 영어 단어 중간 잘림 방지

        wordBreak: "keep-all",

        overflowWrap: "normal",

        whiteSpace: "normal",



        textAlign: "center",



        // 최대 2줄

        display: "-webkit-box",

        WebkitLineClamp: 2,

        WebkitBoxOrient: "vertical",

        overflow: "hidden",



        // ★ 기존 900보다 넓게

        width: "100%",

        maxWidth: isMobile

          ? "92vw"

          : 1100,



        boxSizing: "border-box",

        padding: isMobile

          ? "0 10px"

          : "0 20px",



        margin: isMobile

          ? "8px auto 4px"

          : "18px auto 6px",



        userSelect: "text",

      }}

      title={title}

    >

      {title}

    </div>

  );

}



// BackArrowButton

function BackArrowButton({
  onClick,
  disabled,
  style,
}) {
  const { t } =
    useTranslation();

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={t("match_back", {
        defaultValue: "Back",
      })}
      style={{
        display: "inline-flex",
        justifyContent: "center",
        alignItems: "center",
        minWidth: 156,
        minHeight: 46,
        padding: "0 22px",
        borderRadius: 11,
        border: disabled
          ? "1px solid #d1d5db"
          : "1.5px solid #6650d8",
        outline: "none",
        cursor: disabled
          ? "not-allowed"
          : "pointer",
        background: disabled
          ? "#f3f4f6"
          : "#ffffff",
        color: disabled
          ? "#9ca3af"
          : "#5542b8",
        fontSize: 16,
        fontWeight: 900,
        lineHeight: 1,
        boxShadow: disabled
          ? "none"
          : "0 4px 16px rgba(102,80,216,0.14)",
        transition:
          "transform 0.15s ease, " +
          "background 0.15s ease, " +
          "box-shadow 0.15s ease",
        opacity: disabled ? 0.6 : 1,
        ...style,
      }}
      tabIndex={disabled ? -1 : 0}
    >
      ←{" "}
      {t("match_back", {
        defaultValue: "Back",
      })}
    </button>
  );
}


// 유튜브 링크 여부 체크

function isYoutubeUrl(url) {
  if (!url) {
    return false;
  }

  return (
    /youtu\.be\/([^/?&]+)/.test(url) ||
    /youtube\.com.*[?&]v=([^&]+)/.test(
      url
    ) ||
    /youtube\.com\/embed\/([^/?&]+)/.test(
      url
    )
  );
}

// CandidateBox

function CandidateBox({

  c,

  stat,

  statsLoading,

  onClick,

  disabled,

  selected,

  t,

  mediaActive = true,

  onMediaPlay,

}) {

  const [hover, setHover] =

    useState(false);



  const vw =

    typeof window !== "undefined"

      ? window.innerWidth

      : 1200;



  const isMobile = vw < 1000;



  const SIDE_BANNER =

    vw > 1400 ? 200 : 110;



  const CARD_MAX_WIDTH = 520;



  const CARD_WIDTH = isMobile

    ? "calc(50vw - 14px)"

    : `min(

        ${CARD_MAX_WIDTH}px,

        calc(

          (100vw - ${

            SIDE_BANNER * 2 + 80

          }px) / 2

        )

      )`;



  const CARD_HEIGHT = isMobile

    ? 560

    : 735;



  const THUMB_HEIGHT = isMobile

    ? 275

    : 480;



  const NEON_FONT =

    "'Orbitron', " +

    "'Pretendard', " +

    "sans-serif";



  const mainDark = "#ffffff";



  const isYoutube =

    c?.image &&

    isYoutubeUrl(c.image);



  const matchWins = Number(

    stat?.match_wins || 0

  );



  const matchCount = Number(

    stat?.match_count || 0

  );



  const winCount = Number(

    stat?.win_count || 0

  );



  const winRate =

    matchCount > 0

      ? (

          matchWins /

          matchCount

        ) * 100

      : 0;



  const safeWinRate = Math.min(

    100,

    Math.max(0, winRate)

  );



  const formattedWinRate =

    safeWinRate.toFixed(1);



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

        background:

          "#ffffff",

        borderRadius: 22,

        boxShadow:

          hover && !isMobile

            ? (

                "0 13px 46px 0 " +

                "#fff5, " +

                "0 16px 48px 0 " +

                "#1976ed22"

              )

            : (

                "0 8px 38px 0 " +

                "#fff3, " +

                "0 2px 12px " +

                "#1976ed18"

              ),

        border: selected

          ? "4px solid #6650d8"

          : "2px solid #9aa8bf",

        transform:

          hover && !isMobile

            ? (

                "translateY(-10px) " +

                "scale(1.025)"

              )

            : "",

        transition:

          "all 0.3s ease-in-out",

        margin: isMobile

          ? "12px 0"

          : "20px 0",

        cursor:

          c &&

          !disabled &&

          !isYoutube

            ? "pointer"

            : "default",

        backdropFilter:

          "blur(11px) " +

          "brightness(1.06)",

        WebkitBackdropFilter:

          "blur(11px) " +

          "brightness(1.06)",

        willChange: "transform",

        position: "relative",

        zIndex:

          hover && !isMobile

            ? 8

            : 1,

        overflow: "hidden",

        animation: selected

          ? (

              "fadeBlink " +

              "0.18s ease-in-out 2"

            )

          : "none",

      }}

      onMouseEnter={() => {

        if (!isMobile) {

          setHover(true);

        }

      }}

      onMouseLeave={() => {

        if (!isMobile) {

          setHover(false);

        }

      }}

      onClick={

        c &&

        !disabled &&

        !isYoutube

          ? onClick

          : undefined

      }

    >

      <div

        style={{

          position: "absolute",

          top: "-35%",

          left: "-14%",

          width: "150%",

          height: "190%",

          zIndex: 0,

          background:

            "radial-gradient(" +

            "circle at 50% 60%, " +

            "#fff 0%, " +

            "#fff0 92%" +

            ")",

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

          background:

            "linear-gradient(" +

            "90deg, " +

            "#172847 0%, " +

            "#263b64 100%" +

            ")",

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

  active={mediaActive}

  onPlay={onMediaPlay}

  style={{

    objectFit: "contain",

    width: "100%",

    height: "100%",

    background: "#ffffff",

  }}

/>

        ) : (

          <div

            style={{

              width: "100%",

              height: "100%",

              background: "#ffffff",

            }}

          />

        )}

      </div>



      <div

        style={{

          width: "100%",

          minHeight: isMobile

            ? 84

            : 104,

          maxHeight: isMobile

            ? 108

            : 126,

          padding: isMobile

            ? "7px 8px 6px"

            : "13px 18px 7px",

          fontWeight: 900,

          fontSize: isMobile

            ? "clamp(15px, 4.2vw, 20px)"

            : 28,

          color: "#202534",

          fontFamily: NEON_FONT,

          textAlign: "center",

          wordBreak: "normal",

          overflowWrap: "anywhere",

          lineHeight: 1.12,

          flexShrink: 0,

          letterSpacing: "0.4px",

          boxSizing: "border-box",

          background: mainDark,

          borderBottom:

            "1.3px solid " +

            "#1976ed66",

        }}

        title={c?.name || ""}

      >

        <span

          style={{

            display: "-webkit-box",

            WebkitBoxOrient:

              "vertical",

            WebkitLineClamp: 3,

            overflow: "visible",

            textOverflow:

              "clip",

            textAlign: "center",

            lineHeight: 1.12,

            margin: 0,

            padding: 0,

            whiteSpace: "normal",

            wordBreak: "keep-all",

            overflowWrap: "anywhere",

            fontFamily: NEON_FONT,

            fontWeight: 900,

          }}

        >

          {c

            ? c.name

            : t("bye_round")}

        </span>

      </div>



      <div

        style={{

          width: "100%",

          padding: isMobile

            ? "8px 12px 9px"

            : "11px 18px 12px",

          boxSizing: "border-box",

          background: mainDark,

          borderBottom:

            "1px solid " +

            "rgba(95, 212, 243, 0.22)",

          fontFamily: NEON_FONT,

        }}

      >

        <div

          style={{

            display: "flex",

            justifyContent:

              "space-between",

            alignItems: "center",

            gap: 8,

            marginBottom: 6,

          }}

        >

          <span

            style={{

              color: "#202534",

              fontSize: isMobile

                ? 14

                : 17,

              fontWeight: 900,

            }}

          >

            {statsLoading

              ? t("loading")

              : t("win_rate_value", {

                  rate:

                    formattedWinRate,

                  defaultValue:

                    "Win rate " +

                    "{{rate}}%",

                })}

          </span>



          {!statsLoading && (

            <span

              style={{

                color: "#5542b8",

                fontSize: isMobile

                  ? 12

                  : 14,

                fontWeight: 700,

                whiteSpace: "nowrap",

              }}

            >

              {t("match_record", {

                wins:

                  matchWins

                    .toLocaleString(),

                matches:

                  matchCount

                    .toLocaleString(),

                defaultValue:

                  "{{wins}} wins / " +

                  "{{matches}} matches",

              })}

            </span>

          )}

        </div>



        <div

          aria-label={t(

            "win_rate_value",

            {

              rate:

                formattedWinRate,

              defaultValue:

                "Win rate {{rate}}%",

            }

          )}

          style={{

            width: "100%",

            height: isMobile

              ? 7

              : 9,

            overflow: "hidden",

            borderRadius: 999,

            background: "#ffffff",

            boxShadow:

              "inset 0 1px 3px " +

              "rgba(0, 0, 0, 0.45)",

          }}

        >

          <div

            style={{

              width: statsLoading

                ? "0%"

                : `${safeWinRate}%`,

              height: "100%",

              borderRadius: 999,

              background:

                "linear-gradient(" +

                "90deg, " +

                "#1976ed 0%, " +

                "#5fd4f3 100%" +

                ")",

              boxShadow:

                safeWinRate > 0

                  ? (

                      "0 0 10px " +

                      "rgba(" +

                      "95, 212, 243, " +

                      "0.58" +

                      ")"

                    )

                  : "none",

              transition:

                "width 0.45s ease",

            }}

          />

        </div>



        {!statsLoading && (

          <div

            style={{

              marginTop: 5,

              color: "#5542b8",

              fontSize: isMobile

                ? 12

                : 14,

              fontWeight: 700,

              textAlign: "right",

            }}

          >

            {t(

              "championship_wins_count",

              {

                count: winCount,

                formattedCount:

                  winCount

                    .toLocaleString(),

                defaultValue:

                  "{{formattedCount}} " +

                  "tournament wins",

              }

            )}

          </div>

        )}

      </div>



      <div

        style={{

          width: "100%",

          display: "flex",

          alignItems: "center",

          justifyContent: "center",

          padding: isMobile

            ? "8px 11px"

            : "17px 0 18px",

          background: mainDark,

          borderTop: "none",

          borderBottom:

            "2.5px solid #dde2ea",

          borderRadius: 0,

          marginTop: "auto",

        }}

      >

        <button

          type="button"

          style={{

            background: "#6650d8",

            color: "#ffffff",

            fontWeight: 900,

            border: "none",

            borderRadius: 13,

            fontSize: isMobile

              ? 17

              : 22,

            padding: isMobile

              ? "8px 21px"

              : "14px 44px",

            outline: "none",

            cursor:

              c && !disabled

                ? "pointer"

                : "default",

            letterSpacing: "0.5px",

            fontFamily: NEON_FONT,

            margin: "0 auto",

            boxShadow:

              "0 2px 12px " +

              "#1976ed22",

            transition:

              "background 0.15s",

            opacity: c ? 1 : 0.3,

          }}

          onClick={

            c && !disabled

              ? onClick

              : undefined

          }

        >

          {t("select")}

        </button>

      </div>



      <style>

        {`

          @keyframes fadeBlink {

            0% {

              opacity: 1;

              filter: brightness(1);

            }



            50% {

              opacity: 0.6;

              filter: brightness(1.3);

            }



            100% {

              opacity: 1;

              filter: brightness(1);

            }

          }

        `}

      </style>

    </div>

  );

}

// Main Match Component

function Match({

  cup,

  onResult,

  selectedCount,

}) {

  const { t } =

    useTranslation();



  const navigate =

    useNavigate();



  const location =

    useLocation();



  const [

    bracket,

    setBracket,

  ] = useState([]);



  const [

    idx,

    setIdx,

  ] = useState(0);



  const [

    roundNum,

    setRoundNum,

  ] = useState(1);



  const [

    pendingWinners,

    setPendingWinners,

  ] = useState([]);



  const [

    matchHistory,

    setMatchHistory,

  ] = useState([]);



  const [autoPlaying] =

    useState(false);



  const [

    loading,

    setLoading,

  ] = useState(true);



  const [

    saving,

    setSaving,

  ] = useState(false);



  const [

    error,

    setError,

  ] = useState("");



  const [

    shouldRedirect,

    setShouldRedirect,

  ] = useState(false);



  const [

    historyStack,

    setHistoryStack,

  ] = useState([]);



  const [

    selectedIdx,

    setSelectedIdx,

  ] = useState(null);



  const [

  activeMediaId,

  setActiveMediaId,

] = useState(null);



useEffect(() => {

  setActiveMediaId(null);

}, [idx, roundNum]);



  const [

    statsMap,

    setStatsMap,

  ] = useState({});



  const [

    statsLoading,

    setStatsLoading,

  ] = useState(true);



  const [

    headToHead,

    setHeadToHead,

  ] = useState({

    loading: false,

    leftWins: 0,

    rightWins: 0,

    totalMatches: 0,

  });



  const headToHeadCacheRef =

    useRef(new Map());



  // Resurrection states

  const [

    showResurrect,

    setShowResurrect,

  ] = useState(false);



  const [

    resurrectUsed,

    setResurrectUsed,

  ] = useState(false);



  const [

    eliminatedCandidates,

    setEliminatedCandidates,

  ] = useState([]);



  const [

    advanceCandidates,

    setAdvanceCandidates,

  ] = useState([]);



  const [

    selElim,

    setSelElim,

  ] = useState([]);



  const [

    selAdv,

    setSelAdv,

  ] = useState([]);



  const vw =

    typeof window !== "undefined"

      ? window.innerWidth

      : 1200;



  const isMobile =

    vw < 1000;



  const autoByeIdxRef =

    useRef(-1);



  const pickingGuardRef =

    useRef({

      idx: -1,

      running: false,

    });

  const matchStateKey =
    cup?.id
      ? `match-state:${cup.id}:${selectedCount || "all"}`
      : "";

  const matchLanguageSwitchKey =
    cup?.id
      ? `match-language-switch:${cup.id}:${selectedCount || "all"}`
      : "";



  useEffect(() => {

    let mounted = true;



    async function init() {

      if (!cup?.id) {

        if (mounted) {

          setLoading(false);

          setStatsLoading(false);

        }



        return;

      }



      setLoading(true);

      setError("");

      const languageSwitchAt = Number(
        sessionStorage.getItem(
          matchLanguageSwitchKey
        ) || 0
      );

      const shouldRestoreAfterLanguageSwitch =
        languageSwitchAt &&
        Date.now() - languageSwitchAt < 30000;

      if (shouldRestoreAfterLanguageSwitch) {
        try {
          const savedState = JSON.parse(
            sessionStorage.getItem(
              matchStateKey
            ) || "null"
          );

          if (
            savedState &&
            String(savedState.cupId) ===
              String(cup.id) &&
            Number(savedState.selectedCount) ===
              Number(selectedCount) &&
            Array.isArray(savedState.bracket)
          ) {
            setBracket(savedState.bracket || []);
            setPendingWinners(savedState.pendingWinners || []);
            setIdx(Number(savedState.idx) || 0);
            setRoundNum(Number(savedState.roundNum) || 1);
            setMatchHistory(savedState.matchHistory || []);
            setHistoryStack(savedState.historyStack || []);
            setSelectedIdx(null);
            setShowResurrect(Boolean(savedState.showResurrect));
            setResurrectUsed(Boolean(savedState.resurrectUsed));
            setEliminatedCandidates(savedState.eliminatedCandidates || []);
            setAdvanceCandidates(savedState.advanceCandidates || []);
            setSaving(false);
            setStatsLoading(false);
            setSelElim(savedState.selElim || []);
            setSelAdv(savedState.selAdv || []);

            autoByeIdxRef.current = -1;
            pickingGuardRef.current = {
              idx: -1,
              running: false,
            };

            sessionStorage.removeItem(
              matchLanguageSwitchKey
            );
            setLoading(false);

            return;
          }
        } catch {
          sessionStorage.removeItem(
            matchStateKey
          );
        }
      }



      const seen =

        new Set();



      let players = (

        cup?.data || []

      )

        .filter(Boolean)

        .filter(

          (candidate) => {

            if (

              candidate?.id ===

                null ||

              candidate?.id ===

                undefined

            ) {

              return false;

            }



            const candidateId =

              String(

                candidate.id

              );



            if (

              seen.has(

                candidateId

              )

            ) {

              return false;

            }



            seen.add(

              candidateId

            );



            return true;

          }

        );



      if (

        selectedCount &&

        players.length >

          selectedCount

      ) {

        players = shuffle([

          ...players,

        ]).slice(

          0,

          selectedCount

        );

      }



      try {

        await (

          deleteOldWinnerLogAndStats(

            cup.id

          )

        );



        if (!mounted) {

          return;

        }



        setStatsLoading(true);



        try {

          const stats =

            await (

              fetchWinnerStatsFromDB(

                cup.id

              )

            );



          const nextStatsMap =

            {};



          (stats || []).forEach(

            (stat) => {

              if (

                stat?.candidate_id ===

                  null ||

                stat?.candidate_id ===

                  undefined

              ) {

                return;

              }



              nextStatsMap[

                String(

                  stat.candidate_id

                )

              ] = stat;

            }

          );



          if (mounted) {

            setStatsMap(

              nextStatsMap

            );

          }

        } catch (

          statsError

        ) {

          console.error(

            "Match stats load error:",

            statsError

          );



          if (mounted) {

            setStatsMap({});

          }

        } finally {

          if (mounted) {

            setStatsLoading(

              false

            );

          }

        }



        const {

          matches,

          byes,

        } = makeFirstRound(

          players

        );



        if (!mounted) {

          return;

        }



        setBracket(matches);

        setPendingWinners(

          byes

        );

        setIdx(0);

        setRoundNum(1);

        setMatchHistory([]);

        setHistoryStack([]);

        setSelectedIdx(null);

        setShowResurrect(false);

        setResurrectUsed(false);

        setEliminatedCandidates(

          []

        );

        setAdvanceCandidates(

          []

        );

        setSaving(false);

        setSelElim([]);

        setSelAdv([]);



        autoByeIdxRef.current =

          -1;



        pickingGuardRef.current =

          {

            idx: -1,

            running: false,

          };

      } catch (

        initError

      ) {

        console.error(

          "Match initialization error:",

          initError

        );



        if (mounted) {

          setError(

            t(

              "error_loading_game",

              {

                defaultValue:

                  "게임을 불러오는 중 오류가 발생했습니다.",

              }

            )

          );



          setStatsLoading(

            false

          );

        }

      } finally {

        if (mounted) {

          setLoading(false);

        }

      }

    }



    init();



    return () => {

      mounted = false;

    };

  }, [

    cup?.id,

    selectedCount,

    matchLanguageSwitchKey,

    matchStateKey,

  ]);

  useEffect(() => {
    if (
      loading ||
      !matchStateKey ||
      !cup?.id ||
      !Array.isArray(bracket) ||
      bracket.length === 0
    ) {
      return;
    }

    try {
      sessionStorage.setItem(
        matchStateKey,
        JSON.stringify({
          cupId: cup.id,
          selectedCount,
          bracket,
          idx,
          roundNum,
          pendingWinners,
          matchHistory,
          historyStack,
          showResurrect,
          resurrectUsed,
          eliminatedCandidates,
          advanceCandidates,
          selElim,
          selAdv,
        })
      );
    } catch {
      // Session storage can be unavailable in private modes; the game still works.
    }
  }, [
    loading,
    matchStateKey,
    cup?.id,
    selectedCount,
    bracket,
    idx,
    roundNum,
    pendingWinners,
    matchHistory,
    historyStack,
    showResurrect,
    resurrectUsed,
    eliminatedCandidates,
    advanceCandidates,
    selElim,
    selAdv,
  ]);



  useEffect(() => {

    if (

      idx !==

        bracket.length ||

      bracket.length === 0 ||

      showResurrect

    ) {

      return;

    }



    const matchWinners =

      matchHistory

        .slice(

          -bracket.length

        )

        .map(

          (match) =>

            match.winner

        )

        .filter(Boolean);



    const nextRoundCandidates =

      roundNum === 1

        ? [

            ...pendingWinners,

            ...matchWinners,

          ]

        : matchWinners;



    if (

      !resurrectUsed &&

      cup?.data?.length >=

        32 &&

      nextRoundCandidates

        .length === 16

    ) {

      const allIds =

        new Set(

          nextRoundCandidates.map(

            (candidate) =>

              String(

                candidate.id

              )

          )

        );



      const eliminated =

        cup.data.filter(

          (candidate) =>

            !allIds.has(

              String(

                candidate.id

              )

            )

        );



      setShowResurrect(

        true

      );



      setEliminatedCandidates(

        eliminated

      );



      setAdvanceCandidates(

        nextRoundCandidates

      );



      return;

    }



    if (

      nextRoundCandidates

        .length === 1

    ) {

      handleFinish(

        nextRoundCandidates[0],

        matchHistory

      );



      return;

    }



    const nextBracket =

      makeNextRound(

        nextRoundCandidates

      );



    setBracket(

      nextBracket

    );



    setPendingWinners([]);

    setIdx(0);



    setRoundNum(

      (round) =>

        round + 1

    );



    setHistoryStack([]);

    setSelectedIdx(null);



    autoByeIdxRef.current =

      -1;



    pickingGuardRef.current =

      {

        idx: -1,

        running: false,

      };

  }, [

    idx,

    bracket,

    matchHistory,

    pendingWinners,

    cup?.id,

    cup?.data,

    roundNum,

    showResurrect,

    resurrectUsed,

  ]);



  function handleResurrectCancel() {

    setShowResurrect(false);

    setResurrectUsed(true);



    setBracket(

      makeNextRound(

        advanceCandidates

      )

    );



    setPendingWinners([]);

    setIdx(0);



    setRoundNum(

      (round) =>

        round + 1

    );



    setHistoryStack([]);

    setSelectedIdx(null);



    setAdvanceCandidates(

      []

    );



    setEliminatedCandidates(

      []

    );



    setSelElim([]);

    setSelAdv([]);



    autoByeIdxRef.current =

      -1;



    pickingGuardRef.current =

      {

        idx: -1,

        running: false,

      };

  }



  function handleResurrectConfirm(

    final16

  ) {

    setShowResurrect(false);

    setResurrectUsed(true);



    const shuffled =

      shuffle([

        ...final16,

      ]);



    setBracket(

      makeNextRound(

        shuffled

      )

    );



    setPendingWinners([]);

    setIdx(0);



    setRoundNum(

      (round) =>

        round + 1

    );



    setHistoryStack([]);

    setSelectedIdx(null);



    setAdvanceCandidates(

      []

    );



    setEliminatedCandidates(

      []

    );



    setSelElim([]);

    setSelAdv([]);



    autoByeIdxRef.current =

      -1;



    pickingGuardRef.current =

      {

        idx: -1,

        running: false,

      };

  }



  async function handleFinish(

    winner,

    finalMatchHistory

  ) {

    if (!winner) {

      return;

    }



    setSaving(true);

    setError("");



    try {

      const statsArr =

        calcStatsFromMatchHistory(

          cup.data,

          winner,

          finalMatchHistory

        );



      await Promise.all([

        insertWinnerLog(

          cup.id,

          winner.id

        ),



        upsertMyWinnerStat_parallel(

          statsArr,

          cup.id

        ),

      ]);



      try {

        await saveHeadToHeadStats(

          cup.id,

          finalMatchHistory

        );

      } catch (

        headToHeadSaveError

      ) {

        // 상대전적 저장 실패가 월드컵 결과 저장/이동을 막지 않도록 합니다.

        console.warn(

          "Head-to-head save error:",

          headToHeadSaveError

        );

      }



      setSaving(false);

      if (matchStateKey) {
        sessionStorage.removeItem(matchStateKey);
      }

      if (matchLanguageSwitchKey) {
        sessionStorage.removeItem(matchLanguageSwitchKey);
      }

      setShouldRedirect({

        cup,

        winner,

      });



      if (

        typeof onResult ===

        "function"

      ) {

        onResult({

          cup,

          winner,

        });

      }

    } catch (

      finishError

    ) {

      console.error(

        "Result save error:",

        finishError

      );



      setSaving(false);



      setError(

        t(

          "error_saving_result",

          {

            defaultValue:

              "결과 저장 중 오류가 발생했습니다.",

          }

        )

      );

    }

  }



  useEffect(() => {

    if (!shouldRedirect) {

      return;

    }



    const langMatch =

      location.pathname.match(

        /^\/([a-z]{2})(\/|$)/

      );



    const lang =

      langMatch

        ? langMatch[1]

        : "ko";



    navigate(

      `/${lang}/result/${cup.id}`,

      {

        state:

          shouldRedirect,

      }

    );

  }, [

    shouldRedirect,

    navigate,

    location.pathname,

    cup.id,

  ]);



  const currentMatch =

    bracket[idx] || [];



  const [

    c1,

    c2,

  ] = currentMatch;



  useEffect(() => {

    if (

      !cup?.id ||

      c1?.id === null ||

      c1?.id === undefined ||

      c2?.id === null ||

      c2?.id === undefined

    ) {

      setHeadToHead({

        loading: false,

        leftWins: 0,

        rightWins: 0,

        totalMatches: 0,

      });

      return undefined;

    }



    const leftId = String(c1.id);

    const rightId = String(c2.id);

    const cacheKey = [

      String(cup.id),

      leftId,

      rightId,

    ].join("|");



    const cached =

      headToHeadCacheRef.current.get(

        cacheKey

      );



    if (cached) {

      setHeadToHead(cached);

      return undefined;

    }



    let active = true;



    setHeadToHead((previous) => ({

      ...previous,

      loading: true,

    }));



    fetchHeadToHead(

      cup.id,

      leftId,

      rightId

    )

      .then((record) => {

        if (!active) return;



        const next = {

          loading: false,

          leftWins: Number(

            record?.candidate1_wins || 0

          ),

          rightWins: Number(

            record?.candidate2_wins || 0

          ),

          totalMatches: Number(

            record?.total_matches || 0

          ),

        };



        headToHeadCacheRef.current.set(

          cacheKey,

          next

        );



        setHeadToHead(next);

      })

      .catch((headToHeadError) => {

        console.warn(

          "Head-to-head load error:",

          headToHeadError

        );



        if (active) {

          setHeadToHead({

            loading: false,

            leftWins: 0,

            rightWins: 0,

            totalMatches: 0,

          });

        }

      });



    return () => {

      active = false;

    };

  }, [

    cup?.id,

    c1?.id,

    c2?.id,

  ]);



  useEffect(() => {

    if (

      selectedIdx !== null

    ) {

      return undefined;

    }



    const isByeMatch =

      (!c1 || !c2) &&

      (c1 || c2);



    if (

      isByeMatch &&

      autoByeIdxRef.current !==

        idx

    ) {

      autoByeIdxRef.current =

        idx;



      const timer =

        setTimeout(

          () => {

            if (

              pickingGuardRef

                .current

                .running

            ) {

              return;

            }



            handlePick(

              c1 ? 0 : 1

            );

          },

          150

        );



      return () => {

        clearTimeout(

          timer

        );

      };

    }



    if (c1 && c2) {

      autoByeIdxRef.current =

        -1;

    }



    return undefined;

  }, [

    idx,

    c1,

    c2,

    selectedIdx,

  ]);



  function handlePick(

    winnerIdx

  ) {

    if (

      autoPlaying ||

      selectedIdx !== null

    ) {

      return;

    }



    if (

      pickingGuardRef

        .current.running &&

      pickingGuardRef

        .current.idx === idx

    ) {

      return;

    }



    pickingGuardRef.current =

      {

        idx,

        running: true,

      };



    setHistoryStack(

      (previous) => [

        ...previous,

        {

          idx,

          roundNum,

          bracket:

            JSON.parse(

              JSON.stringify(

                bracket

              )

            ),

          pendingWinners:

            JSON.parse(

              JSON.stringify(

                pendingWinners

              )

            ),

          matchHistory:

            JSON.parse(

              JSON.stringify(

                matchHistory

              )

            ),

        },

      ]

    );



    setSelectedIdx(

      winnerIdx

    );



    const localIdx =

      idx;



    const localC1 =

      c1;



    const localC2 =

      c2;



    const localRoundNum =

      roundNum;



    setTimeout(() => {

      const winner =

        winnerIdx === 0

          ? localC1

          : localC2;



      if (!winner) {

        pickingGuardRef.current =

          {

            idx: -1,

            running: false,

          };



        setSelectedIdx(

          null

        );



        return;

      }



      setMatchHistory(

        (previous) => [

          ...previous,

          {

            round:

              localRoundNum,

            c1: localC1,

            c2: localC2,

            winner,

          },

        ]

      );



      setIdx(

        (currentIdx) => {

          if (

            currentIdx !==

            localIdx

          ) {

            return currentIdx;

          }



          return (

            currentIdx + 1

          );

        }

      );



      setSelectedIdx(

        null

      );



      pickingGuardRef.current =

        {

          idx: -1,

          running: false,

        };

    }, 180);

  }

  function handleRandomPick() {
    if (
      autoPlaying ||
      selectedIdx !== null ||
      !c1 ||
      !c2 ||
      showResurrect
    ) {
      return;
    }

    handlePick(Math.random() < 0.5 ? 0 : 1);
  }



  function handleBack() {

    if (

      showResurrect ||

      (

        resurrectUsed &&

        roundNum === 3 &&

        idx === 0

      )

    ) {

      return;

    }



    if (

      historyStack.length ===

        0 ||

      selectedIdx !== null

    ) {

      return;

    }



    const previous =

      historyStack[

        historyStack.length -

          1

      ];



    setIdx(

      previous.idx

    );



    setRoundNum(

      previous.roundNum

    );



    setBracket(

      previous.bracket

    );



    setPendingWinners(

      previous.pendingWinners

    );



    setMatchHistory(

      previous.matchHistory

    );



    setHistoryStack(

      historyStack.slice(

        0,

        -1

      )

    );



    setSelectedIdx(null);



    autoByeIdxRef.current =

      -1;



    pickingGuardRef.current =

      {

        idx: -1,

        running: false,

      };

  }



  const STAGE_SIZE =

    isMobile

      ? 15

      : 20;



  const nextIdx =

    idx + 1;



  const nextRoundCandidates =

    bracket &&

    nextIdx <

      bracket.length

      ? [

          bracket[

            nextIdx

          ][0],

          bracket[

            nextIdx

          ][1],

        ].filter(Boolean)

      : [];



  const c1Stat =

    c1?.id !== null &&

    c1?.id !== undefined

      ? statsMap[

          String(c1.id)

        ]

      : null;



  const c2Stat =

    c2?.id !== null &&

    c2?.id !== undefined

      ? statsMap[

          String(c2.id)

        ]

      : null;

        if (loading) {

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

            fontSize: 22,

            color: "#5542b8",

            fontWeight: 700,

            letterSpacing: "-1px",

          }}

        >

          {t("shuffling_candidates")}

        </div>

      </div>

    );

  }



  if (saving) {

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

            fontSize: 24,

            color: "#5542b8",

            fontWeight: 900,

            letterSpacing: "-1px",

          }}

        >

          {t("saving")}

        </div>

      </div>

    );

  }



  if (!bracket || bracket.length === 0) {

    return (

      <div>

        {t("notEnoughCandidates")}

      </div>

    );

  }



  if (showResurrect) {

    return (

      <ResurrectionPage

        eliminated={

          eliminatedCandidates

        }

        advanced={

          advanceCandidates

        }

        maxElim={4}

        maxAdv={4}

        selElim={selElim}

        setSelElim={setSelElim}

        selAdv={selAdv}

        setSelAdv={setSelAdv}

        onConfirm={

          handleResurrectConfirm

        }

        onCancel={

          handleResurrectCancel

        }

        isSaving={saving}

        saveInProgressMsg={

          saving

            ? t("saving")

            : ""

        }

      />

    );

  }



  return (

    <div

      style={{

        textAlign: "center",

        padding: isMobile

          ? "10px 0 0"

          : "12px 0 0",

        display: "flex",

        flexDirection: "column",

        alignItems: "center",

        fontFamily:

          "'Noto Sans', " +

          "'Apple SD Gothic Neo', " +

          "'Malgun Gothic', " +

          "Arial, sans-serif",

        position: "relative",

      }}

    >

      <AdaptiveTitle

        title={cup.title}

        isMobile={isMobile}

      />



      <div

        style={{

          fontSize: STAGE_SIZE,

          fontWeight: 800,

          marginBottom: isMobile

            ? 5

            : 11,

          color: "#202534",

        }}

      >

        {getStageLabel(

          t,

          bracket.length * 2 +

            pendingWinners.length,

          roundNum === 1

        )}{" "}



        {bracket.length === 1

          ? ""

          : `${idx + 1} / ${

              bracket.length

            }`}

      </div>



      {error && (

        <div

          style={{

            color: "#b42346",

            fontWeight: 700,

            marginBottom: 15,

            fontSize: 20,

          }}

        >

          {error}

        </div>

      )}



      {roundNum === 1 &&

        pendingWinners.length >

          0 && (

          <div

            style={{

              color: "#596579",

              margin:

                "7px 0 15px",

            }}

          >

            {t(

              "auto_bye_message",

              {

                selectedRound:

                  bracket.length *

                  2,

                count:

                  pendingWinners

                    .length,

              }

            )}

          </div>

        )}



      {bracket.length > 1 &&

        nextRoundCandidates

          .length === 2 && (

          <div

            style={{

              background:

                "linear-gradient(" +

                "90deg, " +

                "#fafdff 80%, " +

                "#e3f0fb 100%" +

                ")",

              borderRadius: 11,

              boxShadow:

                "0 1px 6px " +

                "#1976ed18",

              padding: isMobile

                ? "3px 6px"

                : "9px 20px",

              margin: isMobile

                ? "2px 0 6px"

                : "2px 0 11px",

              display:

                "inline-flex",

              alignItems:

                "center",

              fontSize:

                STAGE_SIZE,

              color: "#5542b8",

              gap: 6,

              maxWidth: isMobile

                ? "90vw"

                : 600,

              whiteSpace:

                "nowrap",

              overflow: "hidden",

              textOverflow:

                "ellipsis",

              justifyContent:

                "center",

              userSelect: "text",

            }}

            title={t(

              "nextRoundTitle",

              {

                a:

                  nextRoundCandidates[

                    0

                  ]?.name || "",

                b:

                  nextRoundCandidates[

                    1

                  ]?.name || "",

              }

            )}

          >

            <b>

              {t("next_round")}

            </b>{" "}



            {truncateNames(

              nextRoundCandidates

            ).map(

              (

                name,

                index

              ) => (

                <React.Fragment

                  key={index}

                >

                  <span

                    style={{

                      fontWeight:

                        700,

                      margin:

                        "0 4px",

                      maxWidth:

                        140,

                      display:

                        "inline-block",

                      textOverflow:

                        "ellipsis",

                      overflow:

                        "hidden",

                      whiteSpace:

                        "nowrap",

                    }}

                  >

                    {name}

                  </span>



                  {index === 0 && (

                    <span

                      style={{

                        fontWeight:

                          400,

                        fontSize:

                          STAGE_SIZE *

                          0.9,

                      }}

                    >

                      {t("vs") ||

                        "vs"}

                    </span>

                  )}

                </React.Fragment>

              )

            )}

          </div>

        )}



      <div

        style={{

          width: "100%",

          maxWidth: 1600,

          display: "flex",

          justifyContent: "center",

          alignItems:

            "flex-start",

          gap: isMobile

            ? 8

            : 16,

          marginTop: 6,

          padding: "0 8px",

          boxSizing:

            "border-box",

        }}

      >

        <div

          style={{

            flex: 1,

            minWidth: 0,

          }}

        >

          <div

            style={{

              width: "100vw",

              display: "flex",

              flexDirection:

                "row",

              justifyContent:

                "center",

              alignItems:

                "stretch",

              gap: isMobile

                ? 11

                : 44,

              margin: 0,

              padding: 0,

              boxSizing:

                "border-box",

              position:

                "relative",

              left: "50%",

              transform:

                "translateX(-50%)",

              zIndex: 1,

            }}

          >

<CandidateBox

  key={

    c1?.id ||

    "c1"

  }

  c={c1}

  stat={c1Stat}

  statsLoading={

    statsLoading

  }

  onClick={() =>

    handlePick(0)

  }

  disabled={

    autoPlaying ||

    selectedIdx !==

      null

  }

  selected={

    selectedIdx ===

    0

  }

  mediaActive={

    activeMediaId === c1?.id

  }

  onMediaPlay={() =>

    setActiveMediaId(c1?.id)

  }

  t={t}

/>

<CandidateBox

  key={

    c2?.id ||

    "c2"

  }

  c={c2}

  stat={c2Stat}

  statsLoading={

    statsLoading

  }

  onClick={() =>

    handlePick(1)

  }

  disabled={

    autoPlaying ||

    selectedIdx !==

      null

  }

  selected={

    selectedIdx ===

    1

  }

  mediaActive={

    activeMediaId === c2?.id

  }

  onMediaPlay={() =>

    setActiveMediaId(c2?.id)

  }

  t={t}

/>

          </div>



          {c1 && c2 && (

            <div

              style={{

                width: "100%",

                maxWidth: 720,

                margin: isMobile

                  ? "10px auto 0"

                  : "14px auto 0",

                display: "flex",

                justifyContent: "center",

                alignItems: "center",

                gap: 10,

                flexWrap: "wrap",

              }}

            >

              <BackArrowButton

                onClick={handleBack}

                disabled={

                  showResurrect ||

                  (

                    resurrectUsed &&

                    roundNum === 3 &&

                    idx === 0

                  ) ||

                  historyStack.length === 0 ||

                  selectedIdx !== null

                }

                style={{

                  minWidth: isMobile ? 132 : 150,

                }}

              />

              <button

                type="button"

                onClick={handleRandomPick}

                disabled={

                  autoPlaying ||

                  selectedIdx !== null ||

                  !c1 ||

                  !c2 ||

                  showResurrect

                }

                style={{

                  display: "inline-flex",

                  justifyContent: "center",

                  alignItems: "center",

                  minWidth: isMobile ? 132 : 150,

                  minHeight: 46,

                  padding: "0 22px",

                  borderRadius: 11,

                  border:

                    selectedIdx !== null || showResurrect

                      ? "1px solid #d1d5db"

                      : "1.5px solid #6650d8",

                  background:

                    selectedIdx !== null || showResurrect

                      ? "#f3f4f6"

                      : "#6650d8",

                  color:

                    selectedIdx !== null || showResurrect

                      ? "#9ca3af"

                      : "#ffffff",

                  fontSize: 16,

                  fontWeight: 900,

                  lineHeight: 1,

                  cursor:

                    selectedIdx !== null || showResurrect

                      ? "not-allowed"

                      : "pointer",

                  boxShadow:

                    selectedIdx !== null || showResurrect

                      ? "none"

                      : "0 4px 16px rgba(102,80,216,0.20)",

                }}

              >

                {t("match_random_select", {

                  defaultValue: "랜덤 선택",

                })}

              </button>

            </div>

          )}



          {c1 && c2 && (

            <div

              style={{

                width: "100%",

                maxWidth: 720,

                margin: isMobile

                  ? "8px auto 0"

                  : "12px auto 0",

                padding: isMobile

                  ? "12px 14px"

                  : "14px 18px",

                boxSizing: "border-box",

                border: "1px solid #d9d5f4",

                borderRadius: 12,

                background: "#faf9ff",

                textAlign: "center",

              }}

            >

              <div

                style={{

                  color: "#5542b8",

                  fontSize: isMobile

                    ? 15

                    : 17,

                  fontWeight: 900,

                  marginBottom: 6,

                }}

              >

                {t(

                  "head_to_head",

                  {

                    defaultValue:

                      "Head-to-head",

                  }

                )}

              </div>



              <div

                style={{

                  display: "flex",

                  alignItems: "center",

                  justifyContent: "center",

                  gap: isMobile ? 8 : 14,

                  color: "#202534",

                  fontSize: isMobile

                    ? 16

                    : 19,

                  fontWeight: 900,

                  flexWrap: "wrap",

                }}

              >

                <span

                  style={{

                    maxWidth: isMobile

                      ? "38%"

                      : "42%",

                    overflow: "hidden",

                    textOverflow: "ellipsis",

                    whiteSpace: "nowrap",

                  }}

                  title={c1?.name || ""}

                >

                  {c1?.name || "-"}

                </span>



                <span

                  style={{

                    color: "#6650d8",

                    whiteSpace: "nowrap",

                  }}

                >

                  {headToHead.loading

                    ? "…"

                    : t(

                        "head_to_head_record",

                        {

                          leftWins:

                            headToHead.leftWins

                              .toLocaleString(),

                          rightWins:

                            headToHead.rightWins

                              .toLocaleString(),

                          defaultValue:

                            "{{leftWins}} wins : {{rightWins}} wins",

                        }

                      )}

                </span>



                <span

                  style={{

                    maxWidth: isMobile

                      ? "38%"

                      : "42%",

                    overflow: "hidden",

                    textOverflow: "ellipsis",

                    whiteSpace: "nowrap",

                  }}

                  title={c2?.name || ""}

                >

                  {c2?.name || "-"}

                </span>

              </div>



              <div

                style={{

                  marginTop: 5,

                  color: "#6b7280",

                  fontSize: isMobile

                    ? 12

                    : 14,

                  fontWeight: 700,

                }}

              >

                {headToHead.loading

                  ? t(

                      "head_to_head_loading",

                      {

                        defaultValue:

                          "Loading head-to-head record…",

                      }

                    )

                  : t(

                      "head_to_head_total",

                      {

                        count:

                          headToHead.totalMatches,

                        formattedCount:

                          headToHead.totalMatches

                            .toLocaleString(),

                        defaultValue:

                          "{{formattedCount}} meetings",

                      }

                    )}

              </div>

            </div>

          )}



        </div>

      </div>



      <button

        type="button"

        onClick={() => {

          const langMatch =

            location.pathname.match(

              /^\/([a-z]{2})(\/|$)/

            );



          const lang = langMatch

            ? langMatch[1]

            : "en";



          navigate(

            `/${lang}/result/${cup.id}`,

            {

              state: { cup },

            }

          );

        }}

        disabled={saving}

        style={{

          margin: isMobile

            ? "10px 12px 18px"

            : "16px 0 24px",

          width: isMobile

            ? "calc(100% - 24px)"

            : "min(520px, 92%)",

          minHeight: 46,

          padding: isMobile

            ? "11px 14px"

            : "13px 18px",

          borderRadius: 12,

          border: "1.5px solid #6650d8",

          background: "#ffffff",

          color: "#5542b8",

          fontSize: isMobile

            ? 15

            : 17,

          fontWeight: 800,

          cursor: saving

            ? "default"

            : "pointer",

          opacity: saving ? 0.55 : 1,

          boxShadow:

            "0 2px 10px rgba(102,80,216,0.10)",

        }}

      >

        {t(

          "stop_and_view_stats",

          {

            defaultValue:

              "Stop and view statistics",

          }

        )}

      </button>



      <style>

        {`

          @import url(

            'https://fonts.googleapis.com/css2?family=Orbitron:wght\@700;900&display=swap'

          );

        `}

      </style>

    </div>

  );

}



export default Match;
