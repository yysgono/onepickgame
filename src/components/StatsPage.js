import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  lazy,
  Suspense,
  useRef,
} from "react";
import { useParams } from "react-router-dom";
import { fetchWinnerStatsFromDB } from "../utils";
import { useTranslation } from "react-i18next";
import { supabase } from "../utils/supabaseClient";

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

const CACHE_TTL_MS = 5 * 60 * 1000; // 5분 캐시

function percent(n, d) {
  if (!d) return "-";
  return Math.round((n / d) * 100) + "%";
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
        winRateAll: percent(win_count, total_games),
        matchRateAll: percent(match_wins, match_count),
      },
      win_rate_num: total_games ? win_count / total_games : 0,
      match_win_rate_num: match_count ? match_wins / match_count : 0,
    };
  });
  return out;
}

/* ========================= 세션 캐시 ========================= */
function readCache(key) {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    if (Date.now() - parsed.savedAt > CACHE_TTL_MS) return null;
    return parsed.data || null;
  } catch {
    return null;
  }
}
function writeCache(key, data) {
  try {
    const payload = JSON.stringify({ savedAt: Date.now(), data });
    sessionStorage.setItem(key, payload);
  } catch {}
}

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
  const cardWidth = isMobile ? 270 : 320;
  const cardHeight = isMobile ? 420 : 480;
  const thumbSize = isMobile ? 140 : 180;

  return (
    <div
      style={{
        background: bgColors[rank - 1] || bgColors[2],
        borderRadius: 26,
        boxShadow: "0 8px 36px #1114, 0 2px 12px #eee4",
        padding: isMobile ? 20 : 30,
        width: cardWidth,
        height: cardHeight,
        margin: "32px 15px 18px 15px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
        border: "2.2px solid #faf7ee",
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
          <MediaRenderer url={image} alt={name} loading="lazy" decoding="async" />
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
}) {
  const { t } = useTranslation();
  const { lang } = useParams();
  const [stats, setStats] = useState([]);
  const [sortKey, setSortKey] = useState("win_count");
  const [sortDesc, setSortDesc] = useState(true);
  const [search, setSearch] = useState("");
  const [userOnly, setUserOnly] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [period, setPeriod] = useState(null);
  const [customMode, setCustomMode] = useState(false);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
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

      const rk = rangeKeyFrom(period, customMode, customFrom, customTo);
      const cacheKey = `stats:${selectedCup.id}:${rk}:fast`;

      // 캐시 즉시 페인트
      const cached = readCache(cacheKey);
      if (cached && alive && seq === fetchSeqRef.current) {
        setStats(cached);
        setLoading(false);
        return;
      }

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
        const normalized = normalizeStats(rows || []);
        setStats(normalized);
        setLoading(false);
        writeCache(cacheKey, normalized);
      } catch (e) {
        if (!alive || seq !== fetchSeqRef.current) return;
        console.error("stats fetch error:", e);
        setLoading(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [selectedCup, period, customMode, customFrom, customTo]);

  /* ===== 스타일 메모화 ===== */
  const ivoryCell = useMemo(
    () => ({
      background: "#fcf5cd",
      fontWeight: 800,
      color: "#998314",
      fontSize: isMobile ? 15 : 18,
      border: 0,
    }),
    [isMobile]
  );
  const normalCell = useMemo(
    () => ({
      background: "#fff",
      color: "#333",
      padding: "7px 0",
    }),
    []
  );

  /* ===== 검색/정렬/멤버 필터 ===== */
  const filteredStats = useMemo(() => {
    const q = (search || "").toLowerCase();
    let result = q ? stats.filter((row) => row._name_lc.includes(q)) : stats.slice();

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
          winRateAll: percent(row.user_win_count || 0, row.user_total_games || 0),
          matchRateAll: percent(row.user_match_wins || 0, row.user_match_count || 0),
        },
      }));
    }

    result = result
      .map((row, i) => ({ ...row, _originIdx: i }))
      .sort((a, b) => {
        if (sortKey === "win_count") {
          if (a.win_count !== b.win_count) {
            return sortDesc ? b.win_count - a.win_count : a.win_count - b.win_count;
          }
          if (a.match_wins !== b.match_wins) {
            return sortDesc ? b.match_wins - a.match_wins : a.match_wins - b.match_wins;
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
  }, [stats, search, userOnly, sortKey, sortDesc]);

  /* ===== 페이지네이션 ===== */
  const totalStats = filteredStats.length;
  const totalPages = Math.max(1, Math.ceil(totalStats / itemsPerPage));
  const pagedStats = useMemo(
    () =>
      filteredStats.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      ),
    [filteredStats, currentPage, itemsPerPage]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, itemsPerPage, stats, userOnly]);

  /* ===== Top3 카드 ===== */
  const top3 = useMemo(() => {
    const arr = stats;
    let A = null, B = null, C = null;
    for (const r of arr) {
      const key = r.win_count ?? 0;
      const rate = r.win_rate_num ?? 0;
      const better = (X) => (!X || key > X.key || (key === X.key && rate > X.rate));
      const wrap = { row: r, key, rate };
      if (better(A)) { C = B; B = A; A = wrap; }
      else if (better(B)) { C = B; B = wrap; }
      else if (better(C)) { C = wrap; }
    }
    const pick = [A?.row, B?.row, C?.row].filter(Boolean);
    return pick.map((r) => ({
      ...r,
      _card: {
        win_count: r.win_count,
        match_wins: r.match_wins,
        match_count: r.match_count,
        win_rate: r._display?.winRateAll ?? "-",
        match_win_rate: r._display?.matchRateAll ?? "-",
      },
    }));
  }, [stats]);

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
          gap: 8,
          marginBottom: 18,
          marginTop: 0,
        }}
      >
        <ReportButton cupId={selectedCup.id} size="sm" />
        <button
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
            color: "#1976ed",
            background: "#e8f2fe",
            border: "1.2px solid #b8dafe",
            borderRadius: 8,
            padding: "4px 14px",
            fontWeight: 700,
            cursor: "pointer",
            fontSize: 15,
            minWidth: 60,
          }}
        >
          📢 {t("share_worldcup")}
        </button>
      </div>
    );
  }

  /* ===== 테이블 컬럼 ===== */
  const sortableCols = [
    { key: "rank", label: t("rank"), isIvory: true },
    { key: "name", label: t("name") },
    { key: "win_count", label: t("win_count") },
    { key: "win_rate", label: t("win_rate"), isIvory: true },
    { key: "match_wins", label: t("match_wins") },
    { key: "match_count", label: t("duel_count") },
    { key: "match_win_rate", label: t("match_win_rate"), isIvory: true },
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
      {/* 상단 타이틀 */}
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          margin: "34px 0 19px 0",
        }}
      >
        <div
          style={{
            fontWeight: 900,
            fontSize: isMobile ? 22 : 36,
            color: "#fff",
            background: "linear-gradient(135deg, #1947e5 22%, #0e1e36 92%)",
            boxShadow: "0 4px 24px 0 #1976ed26, 0 1px 12px #18317899, 0 0px 0px #111b2522",
            borderRadius: 18,
            padding: isMobile ? "11px 14px" : "22px 54px",
            border: "2px solid #1976ed66",
            textShadow: "0 2px 12px #1976ed44, 0 1px 8px #111b2599",
            fontFamily: "'Orbitron', 'Pretendard', sans-serif",
            letterSpacing: "-1.5px",
            lineHeight: 1.15,
            maxWidth: isMobile ? "96vw" : 940,
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            display: "block",
            wordBreak: "break-all",
            textAlign: "center",
            margin: "0 auto",
            userSelect: "text",
          }}
          title={selectedCup?.title}
        >
          {selectedCup?.title}
        </div>
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
            <span style={{ lineHeight: "33px", fontWeight: 700 }}>~</span>
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
        {[10, 25, 50, 100].map((num) => (
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
          <thead>
            <tr>
              {[
                { key: "rank", label: t("rank"), isIvory: true },
                { key: "name", label: t("name") },
                { key: "win_count", label: t("win_count") },
                { key: "win_rate", label: t("win_rate"), isIvory: true },
                { key: "match_wins", label: t("match_wins") },
                { key: "match_count", label: t("duel_count") },
                { key: "match_win_rate", label: t("match_win_rate"), isIvory: true },
              ].map((col) => (
                <th
                  key={col.key}
                  style={{
                    padding: "8px 0",
                    cursor: col.key === "rank" ? undefined : "pointer",
                    ...(col.isIvory ? ivoryCell : { background: "#fff", fontWeight: 700, color: "#333" }),
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
                    highlightCandidateId && row.candidate_id === highlightCandidateId;
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
                      <td style={ivoryCell}>{row.rank}</td>
                      <td
                        style={{
                          ...normalCell,
                          fontWeight: 700,
                          fontSize: isMobile ? 13 : 15,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: isMobile ? 90 : 120,
                        }}
                        title={row.name}
                      >
                        {row.name}
                      </td>
                      <td style={normalCell}>{row.win_count}</td>
                      <td style={ivoryCell}>{winRateStr ?? "-"}</td>
                      <td style={normalCell}>{row.match_wins}</td>
                      <td style={normalCell}>{row.match_count}</td>
                      <td style={ivoryCell}>{matchWinRateStr ?? "-"}</td>
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
