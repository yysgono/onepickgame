import statsTableLabels from "../locales/statsTableLabels.json";
import { statsPageWithSelected } from "../utils/statsPageWithSelected";
import StatsCandidateName from "./StatsCandidateName";
import {saveCandidateSet} from "./randomPick/savedCandidates";
import savedCandidatesCopy from "./randomPick/savedCandidatesCopy.json";
import {normalizeCandidates} from "../utils/randomPickCore";
import {getCopy as getRandomPickCopy} from "./randomPick/copy";
import { filterCurrentCandidateStats } from "../utils/worldcupCandidateChanges";
import { readStatsCache, writeStatsCache } from "../utils/statsCache";
import React, {

  useState,

  useEffect,

  useCallback,

  useMemo,

  lazy,

  Suspense,

  useRef,

} from "react";

import { useNavigate, useParams } from "react-router-dom";

import { fetchWinnerStatsFromDB } from "../utils";

import { useTranslation } from "react-i18next";

import { supabase } from "../utils/supabaseClient";
import { getWorldcupTitle } from "../utils/localization";



// 무거운 컴포넌트는 지연 로딩

const MediaRenderer = lazy(() => import("./MediaRenderer"));

const CommentBox = lazy(() => import("./CommentBox"));



/* ========================= 상수/유틸 ========================= */

const PERIODS = [

  { labelKey: "all", value: null },

  { labelKey: "month_1", value: 30 },

  { labelKey: "month_3", value: 90 },

  { labelKey: "month_6", value: 180 },

  { labelKey: "year_1", value: 365 },

];







function percent(n, d, digits = 0) {

  if (!d) return "-";

  return ((n / d) * 100).toFixed(digits) + "%";

}



function getSinceDate(days) {

  if (!days) return null;

  const date = new Date();

  date.setDate(date.getDate() - days);

  return date.toISOString();

}



function getCustomSinceDate(from, to) {

  if (!from || !to) return null;

  const fromIso = new Date(from).toISOString();

  const toIso = new Date(to).toISOString();

  return { from: fromIso, to: toIso };

}



function rangeKeyFrom(period, customMode, customFrom, customTo) {

  if (customMode && customFrom && customTo) {

    const r = getCustomSinceDate(customFrom, customTo);

    return `from:${r.from}|to:${r.to}`;

  }

  const since = getRangeForAllOrPeriod(period);

  return since ? `since:${since}` : "all";

}



// created_at 범위를 항상 명시 (단 All 은 조건 제거 → null 반환)

function getRangeForAllOrPeriod(period) {

  if (period) return getSinceDate(period); // ISO string

  return null; // ALL: created_at 조건 자체를 주지 않음

}



// 표시/검색/정렬용 필드 사전 계산 (가볍게)

function normalizeStats(arr) {

  const out = (arr || []).map((r) => {

    const win_count = Number(r.win_count || 0);

    const match_wins = Number(r.match_wins || 0);

    const match_count = Number(r.match_count || 0);

    const total_games = Number(r.total_games || 0);



    return {

      ...r,

      win_count,

      match_wins,

      match_count,

      total_games,

      _name_lc: (r.name || "").toLowerCase(),

      _display: {

        winRateAll: percent(win_count, total_games, 1),

        matchRateAll: percent(match_wins, match_count),

      },

      win_rate_num: total_games ? win_count / total_games : 0,

      match_win_rate_num: match_count ? match_wins / match_count : 0,

    };

  });

  return out;

}



/* ========================= 세션 캐시 ========================= */

const readCache = readStatsCache;
const writeCache = writeStatsCache;

/* ========================= 신고 버튼 ========================= */

function ReportButton({ cupId, size = "md" }) {

  const { t } = useTranslation();

  const [show, setShow] = useState(false);

  const [reason, setReason] = useState("");

  const [ok, setOk] = useState("");

  const [error, setError] = useState("");



  const style =

    size === "sm"

      ? {

          color: "#d33",

          background: "#fff4f4",

          border: "1.2px solid #f6c8c8",

          borderRadius: 8,

          padding: "3px 11px",

          fontSize: 15,

          fontWeight: 700,

          cursor: "pointer",

          minWidth: 50,

        }

      : {

          color: "#d33",

          background: "#fff4f4",

          border: "1.5px solid #f6c8c8",

          borderRadius: 8,

          padding: "6px 18px",

          fontSize: 17,

          fontWeight: 700,

          cursor: "pointer",

          minWidth: 60,

        };



  const handleReport = useCallback(async () => {

    setError("");

    setOk("");

    const { data } = await supabase.auth.getUser();

    if (!data?.user?.id) return setError(t("need_login"));

    const { error } = await supabase.from("reports").insert([

      {

        type: "worldcup",

        target_id: cupId,

        reporter_id: data.user.id,

        reason,

      },

    ]);

    if (error) setError(error.message);

    else setOk(t("report_submit_success") || "신고가 접수되었습니다. 감사합니다.");

  }, [cupId, reason, t]);



  return (

    <>

      <button onClick={() => setShow(true)} style={style} aria-label={t("report")}>

        🚩 {t("report")}

      </button>

      {show && (

        <div

          style={{

            position: "fixed",

            left: 0,

            top: 0,

            width: "100vw",

            height: "100vh",

            background: "#0006",

            zIndex: 9999,

            display: "flex",

            alignItems: "center",

            justifyContent: "center",

          }}

        >

          <div

            style={{

              background: "#fff",

              borderRadius: 14,

              padding: 22,

              minWidth: 270,

            }}

          >

            <b>{t("report_reason")}</b>

            <textarea

              value={reason}

              onChange={(e) => setReason(e.target.value)}

              style={{ width: "95%", minHeight: 60, marginTop: 12 }}

              placeholder={t("report_reason_placeholder")}

            />

            <div style={{ marginTop: 12 }}>

              <button onClick={handleReport} style={{ marginRight: 10 }}>

                {t("report_submit")}

              </button>

              <button onClick={() => setShow(false)}>{t("close")}</button>

            </div>

            {ok && <div style={{ color: "#1976ed", marginTop: 7 }}>{ok}</div>}

            {error && <div style={{ color: "#d33", marginTop: 7 }}>{error}</div>}

          </div>

        </div>

      )}

    </>

  );

}



/* ========================= 카드 ========================= */

const RankCard = React.memo(function RankCard(props) {

  const { t } = useTranslation();

  const {

    rank,

    name,

    image,

    win_count,

    win_rate,

    match_wins,

    match_count,

    match_win_rate,

    isMobile,

  } = props;

  const medals = [

    { emoji: "🥇", color: "#f8c800", shadow: "#ecd95d44", text: "#bb9800" },

    { emoji: "🥈", color: "#ff9700", shadow: "#faad4433", text: "#a9812e" },

    { emoji: "🥉", color: "#ef5b7b", shadow: "#f77e8b19", text: "#e26464" },

  ];

  const medal = medals[rank - 1] || medals[2];

  const bgColors = ["#fcf5cd", "#eef3fa", "#fff3f3"];

  const cardWidth = isMobile ? 285 : 390;

  const cardHeight = isMobile ? 475 : 550;

  const thumbSize = isMobile ? 180 : 240;



  return (

    <div

      style={{

        background: bgColors[rank - 1] || bgColors[2],

        borderRadius: 26,

        boxShadow: "0 8px 36px #1114, 0 2px 12px #eee4",

        padding: isMobile ? 20 : 30,

        width: cardWidth,

        height: cardHeight,

        margin: isMobile ? "32px 15px 18px 15px" : "32px 5px 18px 5px",

        display: "flex",

        flexDirection: "column",

        alignItems: "center",

        position: "relative",

        border: `2.5px solid ${["#d6a400", "#94a3b8", "#c77b49"][rank - 1] || "#c77b49"}`,

        boxSizing: "border-box",

        textAlign: "center",

        justifyContent: "center",

      }}

    >

      <div

        style={{

          position: "absolute",

          left: "50%",

          top: -45,

          transform: "translateX(-50%)",

          fontSize: 56,

          fontWeight: 900,

          textShadow: `0 2px 24px ${medal.shadow}`,

          color: medal.color,

          background: "#fffde8",

          borderRadius: "50%",

          width: 70,

          height: 70,

          border: `5px solid ${medal.color}`,

          display: "flex",

          alignItems: "center",

          justifyContent: "center",

          zIndex: 5,

        }}

      >

        {medal.emoji}

      </div>

      <div

        style={{

          width: thumbSize,

          height: thumbSize,

          borderRadius: "50%",

          overflow: "hidden",

          margin: "60px auto 20px auto",

          boxShadow: "0 2px 16px #8883, 0 0px 0px #fff8",

          background: "#fff",

          flexShrink: 0,

        }}

      >

        <Suspense fallback={<div style={{ width: "100%", height: "100%", background: "#f3f4f9" }} />}>

          <MediaRenderer url={image} alt={name} loading="lazy" decoding="async" previewCrop style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }} />

        </Suspense>

      </div>

      <div

        style={{

          fontWeight: 900,

          fontSize: isMobile ? 20 : 24,

          color: medal.text,

          marginBottom: 8,

          lineHeight: 1.2,

          wordBreak: "break-word",

          whiteSpace: "normal",

          maxWidth: "90%",

        }}

        title={name}

      >

        {name}

      </div>

      <div

        style={{

          fontWeight: 900,

          fontSize: isMobile ? 14 : 16,
            whiteSpace: "nowrap",

          color: "#716500",

          marginBottom: 4,

        }}

      >

        {t("win_count")} {win_count} | {t("win_rate")} {win_rate}

      </div>

      <div

        style={{

          fontSize: isMobile ? 13 : 15,

          color: "#9098a6",

          fontWeight: 600,

          letterSpacing: "-0.2px",

          marginTop: 0,

        }}

      >

        {t("match_wins")} {match_wins} | {t("duel_count")} {match_count} | {t("match_win_rate")} {match_win_rate}

      </div>

    </div>

  );

});



/* ========================= 스켈레톤 ========================= */

const SkeletonTableRow = React.memo(function SkeletonTableRow({ colCount = 7 }) {

  return (

    <tr>

      {Array.from({ length: colCount }).map((_, i) => (

        <td key={i}>

          <div

            style={{

              height: 28,

              background: "#f3f4f9",

              borderRadius: 6,

              margin: "3px 0",

              width: "90%",

              marginLeft: "auto",

              marginRight: "auto",

              animation: "skeleton-blink 1.2s infinite alternate",

            }}

          />

        </td>

      ))}

      <style>

        {`

          @keyframes skeleton-blink {

            0% { opacity: 0.6; }

            100% { opacity: 1; }

          }

        `}

      </style>

    </tr>

  );

});



/* ========================= 메인 컴포넌트 ========================= */

export default function StatsPage({

  selectedCup,

  showCommentBox = false,

  highlightCandidateId,
  onWinnerStatsChange,

}) {

  const { t } = useTranslation();

  const { lang } = useParams();

  const navigate = useNavigate();
  const [randomSaving,setRandomSaving]=useState(false);
  const [randomSaveError,setRandomSaveError]=useState("");



  const normalizedLang = String(lang || "en")

  .toLowerCase()

  .split("-")[0];



const displayCupTitle =
  getWorldcupTitle(selectedCup, normalizedLang) ||
  "";



  const [stats, setStats] = useState([]);

  const [sortKey, setSortKey] = useState("win_count");

  const [sortDesc, setSortDesc] = useState(true);

  const [search, setSearch] = useState("");

  const [userOnly, setUserOnly] = useState(false);

  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [period, setPeriod] = useState(null);

  const [customMode, setCustomMode] = useState(false);

  const [customFrom, setCustomFrom] = useState("");

  const [customTo, setCustomTo] = useState("");

  const [loading, setLoading] = useState(true);
  const [statsLoadError, setStatsLoadError] = useState(false);
  const [statsLoadedCupId, setStatsLoadedCupId] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);

  const [refreshKey, setRefreshKey] = useState(0);

  const [isMobile, setIsMobile] = useState(

    typeof window !== "undefined" ? window.innerWidth < 800 : false

  );



  // 레이아웃 리사이즈

  useEffect(() => {

    if (typeof window === "undefined") return;

    const onResize = () => setIsMobile(window.innerWidth < 800);

    window.addEventListener("resize", onResize);

    return () => window.removeEventListener("resize", onResize);

  }, []);



  // 데이터 로딩 (+캐시)

  const fetchSeqRef = useRef(0);

  useEffect(() => {

    let alive = true;

    const seq = ++fetchSeqRef.current;



    async function run() {

      if (!selectedCup?.id) {

        if (!alive) return;

        setStats([]);

        setLoading(false);

        return;

      }

      setLoading(true);
      setStatsLoadError(false);



      try {

        let rows;

        if (customMode && customFrom && customTo) {

          const range = getCustomSinceDate(customFrom, customTo);

          rows = await fetchWinnerStatsFromDB(selectedCup.id, range);

        } else {

          const since = getRangeForAllOrPeriod(period);

          rows = await fetchWinnerStatsFromDB(selectedCup.id, since);

        }



        if (!alive || seq !== fetchSeqRef.current) return;

const currentCandidates = Array.isArray(selectedCup?.data)

  ? selectedCup.data

  : [];



const rowsWithCurrentNames = (rows || []).map((row) => {

  const currentCandidate = currentCandidates.find(

    (candidate) =>

      String(candidate?.id) ===

      String(row?.candidate_id)

  );



  if (!currentCandidate) {

    return row;

  }



  const currentName =

    currentCandidate?.name_translations?.[normalizedLang] ||

    currentCandidate?.name_translations?.en ||

    currentCandidate?.name ||

    row?.name ||

    "";



  return {

    ...row,

    name: currentName,

    image:

      currentCandidate?.image ||

      row?.image ||

      "",

  };

});



const normalized =

  normalizeStats(filterCurrentCandidateStats(rowsWithCurrentNames, selectedCup?.data));



setStats(normalized);
setStatsLoadedCupId(String(selectedCup.id));

        setLoading(false);

      } catch (e) {

        if (!alive || seq !== fetchSeqRef.current) return;

        console.error("stats fetch error:", e);
        setStatsLoadError(true);

        setLoading(false);

      }

    }



    run();

    return () => {

      alive = false;

    };

}, [

  selectedCup?.id,

  period,

  customMode,

  customFrom,

  customTo,

  refreshKey,

]);



  /* ===== 스타일 메모화 ===== */

  const ivoryCell = useMemo(

    () => ({

      background: "#fff0b3",

      fontWeight: 800,

      color: "#785800",

      fontSize: isMobile ? 15 : 18,

      border: 0,

    }),

    [isMobile]

  );

  const matchCell = useMemo(() => ({
    background: "#dcecff", color: "#174c87", fontWeight: 700,
    padding: "9px 0", border: 0,
  }), []);

  const normalCell = useMemo(

    () => ({

      background: "#fff",

      color: "#333",

      padding: "7px 0",

    }),

    []

  );

const rankedStats = useMemo(() => {

  return stats

    .map((row, i) => ({

      ...row,

      _originIdx: i,

    }))

    .sort((a, b) => {

      if (a.win_count !== b.win_count) {

        return b.win_count - a.win_count;

      }



      if (a.win_rate_num !== b.win_rate_num) {

        return b.win_rate_num - a.win_rate_num;

      }



      if (a.match_wins !== b.match_wins) {

        return b.match_wins - a.match_wins;

      }



      if (a.match_win_rate_num !== b.match_win_rate_num) {

        return b.match_win_rate_num - a.match_win_rate_num;

      }



      return a._originIdx - b._originIdx;

    })

    .map((row, i) => ({

      ...row,

      rank: i + 1,

    }));

}, [stats]);

  /* ===== 검색/정렬/멤버 필터 ===== */

  const filteredStats = useMemo(() => {

    const q = (search || "").toLowerCase();

  let result = q

  ? rankedStats.filter((row) =>

      row._name_lc.includes(q)

    )

  : rankedStats.slice();



    if (userOnly) {

      result = result.map((row) => ({

        ...row,

        win_count: row.user_win_count || 0,

        match_wins: row.user_match_wins || 0,

        match_count: row.user_match_count || 0,

        total_games: row.user_total_games || 0,

        win_rate_num:

          (row.user_total_games || 0)

            ? (row.user_win_count || 0) / (row.user_total_games || 0)

            : 0,

        match_win_rate_num:

          (row.user_match_count || 0)

            ? (row.user_match_wins || 0) / (row.user_match_count || 0)

            : 0,

        _display: {

          winRateAll: percent(row.user_win_count || 0, row.user_total_games || 0, 1),

          matchRateAll: percent(row.user_match_wins || 0, row.user_match_count || 0),

        },

      }));

    }



    result = result

      .map((row, i) => ({ ...row, _originIdx: i }))

      .sort((a, b) => {

if (sortKey === "win_count") {

  if (a.win_count !== b.win_count) {

    return sortDesc

      ? b.win_count - a.win_count

      : a.win_count - b.win_count;

  }



  if (a.win_rate_num !== b.win_rate_num) {

    return sortDesc

      ? b.win_rate_num - a.win_rate_num

      : a.win_rate_num - b.win_rate_num;

  }



  if (a.match_wins !== b.match_wins) {

    return sortDesc

      ? b.match_wins - a.match_wins

      : a.match_wins - b.match_wins;

  }



  if (a.match_win_rate_num !== b.match_win_rate_num) {

    return sortDesc

      ? b.match_win_rate_num - a.match_win_rate_num

      : a.match_win_rate_num - b.match_win_rate_num;

  }



  return a._originIdx - b._originIdx;

}

        if (sortKey === "win_rate") {

          const av = a.win_rate_num || 0;

          const bv = b.win_rate_num || 0;

          if (av < bv) return sortDesc ? 1 : -1;

          if (av > bv) return sortDesc ? -1 : 1;

          return a._originIdx - b._originIdx;

        }

        if (sortKey === "match_win_rate") {

          const av = a.match_win_rate_num || 0;

          const bv = b.match_win_rate_num || 0;

          if (av < bv) return sortDesc ? 1 : -1;

          if (av > bv) return sortDesc ? -1 : 1;

          return a._originIdx - b._originIdx;

        }

        let av = a[sortKey];

        let bv = b[sortKey];

        if (typeof av === "string") av = av.toLowerCase();

        if (typeof bv === "string") bv = bv.toLowerCase();

        if (av < bv) return sortDesc ? 1 : -1;

        if (av > bv) return sortDesc ? -1 : 1;

        return a._originIdx - b._originIdx;

      });



    result.forEach((row, i) => (row.rank = i + 1));

    return result;

}, [

  rankedStats,

  search,

  userOnly,

  sortKey,

  sortDesc,

]);



  /* ===== 페이지네이션 ===== */

  const totalStats = filteredStats.length;

  const totalPages = Math.max(1, Math.ceil(totalStats / itemsPerPage));

  const pagedStats = useMemo(
    () => statsPageWithSelected(filteredStats, currentPage, itemsPerPage, highlightCandidateId),
    [filteredStats, currentPage, itemsPerPage, highlightCandidateId]
  );



  useEffect(() => {

    setCurrentPage(1);

  }, [search, itemsPerPage, stats, userOnly]);



  /* ===== Top3 카드 ===== */

const top3 = useMemo(() => {

  return rankedStats.slice(0, 3).map((r) => ({

    ...r,

    _card: {

      win_count: r.win_count,

      match_wins: r.match_wins,

      match_count: r.match_count,

      win_rate: r._display?.winRateAll ?? "-",

      match_win_rate:

        r._display?.matchRateAll ?? "-",

    },

  }));

}, [rankedStats]);



  const selectedCandidate = highlightCandidateId == null ? null : rankedStats.find(
    (row) => String(row.candidate_id) === String(highlightCandidateId)
  );

  useEffect(() => {
    if (!onWinnerStatsChange) return;
    if (!selectedCup?.id || highlightCandidateId == null) {
      onWinnerStatsChange(null);
      return;
    }
    const identity = { cupId: String(selectedCup.id), candidateId: String(highlightCandidateId) };
    if (loading) onWinnerStatsChange({ ...identity, status: "loading" });
    else if (statsLoadError) onWinnerStatsChange({ ...identity, status: "error" });
    else if (statsLoadedCupId !== String(selectedCup.id)) onWinnerStatsChange({ ...identity, status: "loading" });
    else if (!selectedCandidate) onWinnerStatsChange({ ...identity, status: "empty" });
    else onWinnerStatsChange({ ...identity, status: "ready", rank: selectedCandidate.rank,
      winCount: selectedCandidate.win_count, winRate: selectedCandidate._display.winRateAll,
      matchRate: selectedCandidate._display.matchRateAll });
  }, [onWinnerStatsChange, selectedCup?.id, highlightCandidateId, loading, statsLoadError, statsLoadedCupId, selectedCandidate]);

  /* ===== 페이지네이션 UI ===== */

  function Pagination() {

    if (totalPages <= 1) return null;

    let pages = [];

    let start = Math.max(1, currentPage - 2);

    let end = Math.min(totalPages, currentPage + 2);

    for (let i = start; i <= end; i++) pages.push(i);

    if (start > 2) pages = [1, "...", ...pages];

    else if (start === 2) pages = [1, ...pages];

    if (end < totalPages - 1) pages = [...pages, "...", totalPages];

    else if (end === totalPages - 1) pages = [...pages, totalPages];

    return (

      <div style={{ textAlign: "center", margin: "16px 0 4px 0" }}>

        <button

          disabled={currentPage === 1}

          aria-label={t("prev_page")}

          style={{

            margin: "0 4px",

            padding: "4px 10px",

            borderRadius: 6,

            border: "1.5px solid #bbb",

            background: currentPage === 1 ? "#f7f7f7" : "#fff",

            cursor: currentPage === 1 ? "default" : "pointer",

          }}

          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}

        >

          &lt;

        </button>

        {pages.map((p, i) =>

          p === "..." ? (

            <span key={i} style={{ margin: "0 4px" }}>...</span>

          ) : (

            <button

              key={p}

              aria-label={t("goto_page", { page: p })}

              onClick={() => setCurrentPage(p)}

              style={{

                margin: "0 4px",

                padding: "4px 12px",

                borderRadius: 6,

                border: "1.5px solid #1976ed",

                background: currentPage === p ? "#1976ed" : "#fff",

                color: currentPage === p ? "#fff" : "#1976ed",

                fontWeight: 700,

                cursor: "pointer",

              }}

            >

              {p}

            </button>

          )

        )}

        <button

          disabled={currentPage === totalPages}

          aria-label={t("next_page")}

          style={{

            margin: "0 4px",

            padding: "4px 10px",

            borderRadius: 6,

            border: "1.5px solid #bbb",

            background: currentPage === totalPages ? "#f7f7f7" : "#fff",

            cursor: currentPage === totalPages ? "default" : "pointer",

          }}

          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}

        >

          &gt;

        </button>

      </div>

    );

  }



  /* ===== 공유/신고 바 ===== */

  function ShareAndReportBar() {

    if (!selectedCup?.id) return null;

    const shareUrl = `${window.location.origin}/${lang}/select-round/${selectedCup.id}`;

    return (

      <div

        style={{

          display: "flex",

          justifyContent: "center",

          alignItems: "center",

          flexWrap: "wrap",

          gap: 10,

          marginBottom: 24,

          marginTop: 8,

        }}

      >

        <button

          type="button"

          onClick={() => {

            navigator.clipboard

              .writeText(shareUrl)

              .then(() => {

                if (window?.toast?.success) window.toast.success(t("share_link_copied"));

                else alert(t("share_link_copied"));

              })

              .catch(() => alert(shareUrl));

          }}

          style={{

            color: "#ffffff",

            background: "#2563eb",

            border: "2px solid #1d4ed8",

            borderRadius: 12,

            padding: "13px 26px",

            fontWeight: 900,

            cursor: "pointer",

            fontSize: 18,

            minWidth: 220,

            maxWidth: "100%",

            minHeight: 54,

            boxShadow: "0 5px 16px rgba(37,99,235,.28)",

          }}

        >

          🔗 {t("share_worldcup")}

        </button>

        <ReportButton cupId={selectedCup.id} size="md" />

      </div>

    );

  }



  const tableLabels = statsTableLabels[normalizedLang] || statsTableLabels.en;

  /* ===== 테이블 컬럼 ===== */

  const sortableCols = [

    { key: "rank", label: t("rank"), isIvory: true },

    { key: "name", label: t("name") },

    { key: "win_count", label: tableLabels.win_count },

    { key: "win_rate", label: tableLabels.win_rate, isIvory: true },

    { key: "match_wins", label: tableLabels.match_wins },

    { key: "match_count", label: tableLabels.match_count },

    { key: "match_win_rate", label: tableLabels.match_win_rate, isIvory: true },

  ];



  return (

    <div

      style={{

        width: "100%",

        maxWidth: 1200,

        margin: "0 auto",

        padding: "0 0 32px 0",

        boxSizing: "border-box",

      }}

    >

 {/* 상단 결과 타이틀 - 미니멀 */}

<div

  style={{

    width: "min(760px, 94vw)",

    margin: isMobile ? "8px auto 14px" : "8px auto 16px",

    padding: isMobile ? "18px 18px 20px" : "20px 34px 22px",

    background: "#ffffff",

    border: "1px solid #e5e7eb",

    borderRadius: isMobile ? 14 : 16,

    textAlign: "center",

    boxSizing: "border-box",

    boxShadow: "0 8px 24px rgba(15,23,42,0.06)",

  }}

>

  <div

    title={displayCupTitle}

    style={{

      color: "#171b26",

      fontSize: isMobile ? 24 : 32,

      fontWeight: 950,

      lineHeight: 1.28,

      letterSpacing: "-0.7px",

      wordBreak: "keep-all",

      overflowWrap: "anywhere",

    }}

  >

    {displayCupTitle}

  </div>



  <button

    type="button"

    onClick={() => {

      window.location.href =

        `/${lang}/select-round/${selectedCup.id}`;

    }}

    style={{

      minWidth: isMobile ? 200 : 220,
      minHeight: isMobile ? 54 : 58,

      marginTop: isMobile ? 18 : 21,

      padding: isMobile ? "13px 24px" : "14px 30px",

      border: "1px solid #e85f0d",

      borderRadius: 10,

      background: "#ff6b12",

      color: "#ffffff",

      fontSize: isMobile ? 18 : 19,

      fontWeight: 900,

      cursor: "pointer",

      boxShadow: "0 5px 14px rgba(255,107,18,0.18)",

    }}

  >

    ▶ {t("start")}

  </button>

</div>



<ShareAndReportBar />



      {/* Top3 카드 */}

      <div

        style={{

          display: "flex",

          flexDirection: isMobile ? "column" : "row",

          justifyContent: "center",

          alignItems: "center",

          margin: "0 auto 18px auto",

          width: "100%",

          gap: 0,

          overflowX: "auto",

        }}

      >

        {top3.map((row, i) => (

          <RankCard

            key={row.candidate_id}

            rank={i + 1}

            name={row.name}

            image={row.image}

            win_count={row._card.win_count}

            win_rate={row._card.win_rate}

            match_wins={row._card.match_wins}

            match_count={row._card.match_count}

            match_win_rate={row._card.match_win_rate}

            isMobile={isMobile}

          />

        ))}

      </div>







     {selectedCandidate && (
       <div role="status" style={{ width: "fit-content", maxWidth: "94%", margin: "0 auto 16px", padding: "10px 18px", border: "1.5px solid #86cfa5", borderRadius: 10, background: "#e8f5ee", color: "#166534", fontWeight: 800 }}>
         ✓ {selectedCandidate.name} · #{selectedCandidate.rank}
       </div>
     )}

     <div style={{width:"min(960px, 94vw)",margin:"18px auto",textAlign:"center",display:"grid",gap:14}}>
       <button type="button" disabled={randomSaving} style={{width:"100%",padding:"20px 16px",border:"2px solid #056b45",borderRadius:12,background:"#078657",color:"#fff",fontSize:18,fontWeight:800,cursor:"pointer",opacity:randomSaving?0.7:1}} onClick={async()=>{
         if(randomSaving)return;setRandomSaving(true);setRandomSaveError("");
         try{const candidates=normalizeCandidates(selectedCup?.data,selectedCup?.id);await saveCandidateSet(candidates,selectedCup?.id);navigate(`/${normalizedLang}/random-pick`);}
         catch{setRandomSaveError((savedCandidatesCopy[normalizedLang]||savedCandidatesCopy.en)[5]);}
         finally{setRandomSaving(false);}
       }}>{getRandomPickCopy(normalizedLang).worldcupToRandom}</button>
       <button type="button" onClick={()=>navigate(`/${normalizedLang}/tier-list/create/${selectedCup.id}`)} style={{width:"100%",padding:"20px 16px",border:"2px solid #1d4ed8",borderRadius:12,background:"#2563eb",color:"#fff",fontSize:18,fontWeight:800,cursor:"pointer"}}>{t("result_discovery_tier_title")}</button>
       {randomSaveError&&<p role="alert" style={{color:"#b42346",margin:0}}>{randomSaveError}</p>}
     </div>

      {/* 회원/전체 탭 */}

      <div

        style={{

          display: "flex",

          justifyContent: "center",

          gap: 8,

          marginBottom: 10,

          marginTop: 4,

        }}

      >

        <button style={tabBtnStyle(!userOnly)} onClick={() => setUserOnly(false)}>

          {t("all")}

        </button>

        <button

          style={{ ...tabBtnStyle(userOnly), marginRight: 0 }}

          onClick={() => setUserOnly(true)}

        >

          {t("members_only")}

        </button>

      </div>



      {/* 기간 필터 */}

      <div

        style={{

          display: "flex",

          flexWrap: "wrap",

          gap: 0,

          justifyContent: "center",

          marginBottom: 10,

        }}

      >

        {PERIODS.map((p) => (

          <button

            key={p.value === null ? "all" : p.value}

onClick={() => {

  setCustomMode(false);

  setPeriod(p.value);

  setRefreshKey((value) => value + 1);

}}

            style={periodBtnStyle(!customMode && period === p.value)}

          >

            {t(p.labelKey)}

          </button>

        ))}

        <button

          style={{

            ...periodBtnStyle(customMode),

            marginRight: 0,

            background: customMode ? "#e7f7f6" : "#fff",

          }}

          onClick={() => {

            setCustomMode(true);

            setPeriod(undefined);

          }}

        >

          {t("custom_period")}

        </button>

        {customMode && (

          <>

            <input

              type="date"

              value={customFrom}

              max={customTo}

              onChange={(e) => setCustomFrom(e.target.value)}

              style={{ padding: "6px 11px", borderRadius: 8, border: "1.3px solid #bbb" }}

              aria-label={t("start")}

            />

            <span style={{ lineHeight: "33px", fontWeight: 700 }}>\~</span>

            <input

              type="date"

              value={customTo}

              min={customFrom}

              onChange={(e) => setCustomTo(e.target.value)}

              style={{ padding: "6px 11px", borderRadius: 8, border: "1.3px solid #bbb" }}

              aria-label={t("apply")}

            />

            <button

              style={{

                padding: "7px 13px",

                borderRadius: 8,

                border: "1.8px solid #1976ed",

                background: "#1976ed",

                color: "#fff",

                fontWeight: 700,

                fontSize: 15,

                cursor: "pointer",

                marginRight: 0,

              }}

              onClick={() => {

                if (customFrom && customTo) setCustomMode(true);

              }}

              disabled={!customFrom || !customTo}

            >

              {t("apply")}

            </button>

            <button

              style={{

                padding: "7px 13px",

                borderRadius: 8,

                border: "1.5px solid #aaa",

                background: "#fff",

                color: "#666",

                fontWeight: 700,

                fontSize: 15,

                cursor: "pointer",

              }}

              onClick={() => {

                setCustomMode(false);

                setCustomFrom("");

                setCustomTo("");

                setPeriod(null);

              }}

            >

              {t("cancel")}

            </button>

          </>

        )}

      </div>



      {/* 보기 개수 버튼들 */}

      <div

        style={{

          display: "flex",

          justifyContent: "center",

          marginBottom: 8,

          gap: 8,

        }}

      >

        {[10, 20, 25, 50, 100].map((num) => (

          <button

            key={num}

            style={{

              padding: "7px 13px",

              borderRadius: 8,

              border: itemsPerPage === num ? "2.5px solid #1976ed" : "1.5px solid #ccc",

              background: itemsPerPage === num ? "#e8f2fe" : "#fff",

              color: itemsPerPage === num ? "#1976ed" : "#555",

              fontWeight: 700,

              fontSize: 15,

              cursor: "pointer",

            }}

            onClick={() => setItemsPerPage(num)}

          >

            {t("view_" + num)}

          </button>

        ))}

      </div>



      {/* 검색창 */}

      <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>

        <input

          type="text"

          placeholder={t("search") || "Search"}

          value={search}

          onChange={(e) => setSearch(e.target.value)}

          style={{

            width: isMobile ? 180 : 320,

            fontSize: isMobile ? 14 : 16,

            padding: "7px 15px",

            border: "1.5px solid #bbb",

            borderRadius: 8,

            marginRight: 6,

            outline: "none",

            fontWeight: 500,

            background: "#fafbfc",

            color: "#222",

            transition: "all 0.15s",

            boxShadow: "0 1px 6px #1976ed11",

          }}

          aria-label={t("search") || "Search"}

        />

      </div>



      {/* 통계 테이블 */}

      <div

        style={{

          width: "100%",

          overflowX: "auto",

          marginBottom: 12,

          contentVisibility: "auto",

          containIntrinsicSize: "1000px",

        }}

      >

        <table

          style={{

            width: "100%",
            minWidth: isMobile ? 840 : 1040,

            borderCollapse: "collapse",

            background: "#fff",

            borderRadius: "12px",

            textAlign: "center",

            fontSize: isMobile ? 13 : 16,

            tableLayout: "fixed",

            wordBreak: "break-word",

            overflowWrap: "break-word",

            margin: "0 auto",

            boxShadow: "0 2px 22px #21374a13",

          }}

        >

          <colgroup>
            <col style={{ width: "6%" }} />
            <col style={{ width: "34%" }} />
            {Array.from({ length: 5 }, (_, index) => <col key={index} style={{ width: "12%" }} />)}
          </colgroup>

          <thead>

            <tr>

              {[

                { key: "rank", label: t("rank"), isIvory: true },

                { key: "name", label: t("name") },

                { key: "win_count", label: tableLabels.win_count },

                { key: "win_rate", label: tableLabels.win_rate, isIvory: true },

                { key: "match_wins", label: tableLabels.match_wins },

                { key: "match_count", label: tableLabels.match_count },

                { key: "match_win_rate", label: tableLabels.match_win_rate, isIvory: true },

              ].map((col) => (

                <th

                  key={col.key}

                  style={{

                    padding: "8px 0",

                    cursor: col.key === "rank" ? undefined : "pointer",

                    ...(["win_count", "win_rate"].includes(col.key) ? ivoryCell : ["match_wins", "match_count", "match_win_rate"].includes(col.key) ? matchCell : { background: "#fff", fontWeight: 700, color: "#333" }),

                    borderBottom: "2px solid #bdcce0",
                    userSelect: "none",

                  }}

                  onClick={

                    col.key === "rank"

                      ? undefined

                      : () => {

                          if (sortKey === col.key) setSortDesc((desc) => !desc);

                          else {

                            setSortKey(col.key);

                            setSortDesc(true);

                          }

                        }

                  }

                >

                  <span>

                    {col.label}

                    {sortKey === col.key && col.key !== "rank" && (sortDesc ? " ▼" : " ▲")}

                  </span>

                </th>

              ))}

            </tr>

          </thead>

          <tbody>

            {loading

              ? Array.from({ length: 5 }).map((_, i) => (

                  <SkeletonTableRow key={i} colCount={7} />

                ))

              : pagedStats.length === 0

              ? (

                <tr>

                  <td colSpan={7} style={{ padding: 22, color: "#888" }}>

                    {t("cannot_show_results")}

                  </td>

                </tr>

                )

              : (

                pagedStats.map((row, idx) => {

                  const isHighlighted =

                    highlightCandidateId != null && String(row.candidate_id) === String(highlightCandidateId);

                  const selectedCell = isHighlighted ? { background: "#e8f5ee", color: "#166534", fontWeight: 800, boxShadow: "inset 0 1px #86cfa5, inset 0 -1px #86cfa5" } : {};

                  const highlightStyle = isHighlighted

                    ? {

                        background: "linear-gradient(90deg,#f9e7ff 0%,#f3fbff 80%)",

                        boxShadow: "0 2px 12px #d489ec15",

                        fontWeight: 800,

                        borderLeft: "6px solid #d489ec",

                        color: "#7114b5",

                        fontSize: isMobile ? 15 : 17,

                        transition: "all 0.12s",

                      }

                    : { background: idx % 2 === 0 ? "#fafdff" : "#fff", color: "#333" };



                  const winRateStr = row._display?.winRateAll;

                  const matchWinRateStr = row._display?.matchRateAll;



                  return (

                    <tr key={row.candidate_id} style={highlightStyle}>

                      <td style={{ ...normalCell, background: "#f1f5f9", color: "#475569", fontWeight: 700, borderBottom: "1px solid #e2e8f0", ...selectedCell }}>{row.rank}</td>

                      <td style={{ ...normalCell, ...selectedCell, fontWeight: 700, fontSize: isMobile ? 13 : 15, padding: "8px 10px", borderBottom: "1px solid #e2e8f0", verticalAlign: "middle" }} title={row.name}>
                        <StatsCandidateName key={row.image || row.candidate_id} image={row.image} name={row.name} selected={isHighlighted} isMobile={isMobile} />
                      </td>

                      <td style={{ ...ivoryCell, borderBottom: "1px solid #e8d99e", ...selectedCell }}>{row.win_count}</td>

                      <td style={{ ...ivoryCell, borderBottom: "1px solid #e8d99e", ...selectedCell }}>{winRateStr ?? "-"}</td>

                      <td style={{ ...matchCell, borderBottom: "1px solid #bdd4ef", ...selectedCell }}>{row.match_wins}</td>

                      <td style={{ ...matchCell, borderBottom: "1px solid #bdd4ef", ...selectedCell }}>{row.match_count}</td>

                      <td style={{ ...matchCell, borderBottom: "1px solid #bdd4ef", ...selectedCell }}>{matchWinRateStr ?? "-"}</td>

                    </tr>

                  );

                })

                )}

          </tbody>

        </table>

      </div>



      <Pagination />



      {/* 댓글 */}

      {showCommentBox && (

        <Suspense fallback={<div style={{ padding: 12, color: "#888", textAlign: "center" }}>Loading…</div>}>

          <CommentBox cupId={selectedCup.id} />

        </Suspense>

      )}

    </div>

  );

}



/* ========================= 버튼 스타일 ========================= */

function tabBtnStyle(selected) {

  return {

    padding: "8px 19px",

    marginRight: 8,

    borderRadius: 8,

    border: selected ? "2.5px solid #1976ed" : "1.5px solid #ccc",

    background: selected ? "#e8f2fe" : "#fff",

    color: selected ? "#1976ed" : "#555",

    fontWeight: 700,

    fontSize: 15,

    cursor: "pointer",

    transition: "all 0.15s",

    boxShadow: selected ? "0 2px 7px #1976ed22" : undefined,

    marginBottom: 7,

  };

}

function periodBtnStyle(selected) {

  return {

    padding: "7px 15px",

    marginRight: 7,

    marginBottom: 6,

    borderRadius: 8,

    border: selected ? "2.5px solid #1976ed" : "1.5px solid #ccc",

    background: selected ? "#e8f2fe" : "#fff",

    color: selected ? "#1976ed" : "#555",

    fontWeight: 700,

    fontSize: 15,

    cursor: "pointer",

    transition: "all 0.15s",

  };

}







