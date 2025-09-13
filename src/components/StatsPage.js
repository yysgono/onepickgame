import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import { fetchWinnerStatsFromDB } from "../utils.js";
import { useTranslation } from "react-i18next";
import MediaRenderer from "./MediaRenderer";
import { supabase } from "../utils/supabaseClient";
import CommentBox from "./CommentBox";
import AdSlot from "./AdSlot";   // 배너 컴포넌트

// ---------------------- 공용 유틸 ----------------------
const PERIODS = [
  { labelKey: "all", value: null },
  { labelKey: "month_1", value: 30 },
  { labelKey: "month_3", value: 90 },
  { labelKey: "month_6", value: 180 },
  { labelKey: "year_1", value: 365 },
];

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

// created_at 범위를 항상 명시 (단 All 은 조건 제거 → null 반환)
function getRangeForAllOrPeriod(period) {
  if (period) {
    // 기간 버튼(1/3/6/12개월)은 "created_at >= since"로 필터
    return getSinceDate(period); // ISO string
  }
  // ALL: created_at 조건 자체를 주지 않음(가장 안전)
  return null;
}

// 일부 예전 레코드의 match_count/total_games가 과소 저장된 경우 화면에서 보정
function normalizeStats(arr) {
  return (arr || []).map((r) => {
    // 전체 집계
    const win_count       = Number(r.win_count || 0);
    const match_wins      = Number(r.match_wins || 0);
    const match_count_raw = Number(r.match_count || 0);
    const total_games_raw = Number(r.total_games || 0);

    const match_count = Math.max(match_count_raw, match_wins, win_count);

    // total_games_raw가 0인데 최소한의 기록이 있으면 1로 보정
    const hasAnyRecord = (win_count > 0) || (match_wins > 0) || (match_count_raw > 0);
    const total_games = total_games_raw > 0 ? total_games_raw : (hasAnyRecord ? 1 : 0);

    // 회원 전용 집계(집계 함수가 내려준 값이 있으면 동일 규칙으로 보정)
    const user_win_count       = Number(r.user_win_count || 0);
    const user_match_wins      = Number(r.user_match_wins || 0);
    const user_match_count_raw = Number(r.user_match_count || 0);
    const user_total_games_raw = Number(r.user_total_games || 0);

    const user_match_count = Math.max(user_match_count_raw, user_match_wins, user_win_count);
    const user_hasAnyRecord = (user_win_count > 0) || (user_match_wins > 0) || (user_match_count_raw > 0);
    const user_total_games = user_total_games_raw > 0 ? user_total_games_raw : (user_hasAnyRecord ? 1 : 0);

    return {
      ...r,
      // 전체
      win_count,
      match_wins,
      match_count,
      total_games,
      // 회원 전용
      user_win_count,
      user_match_wins,
      user_match_count,
      user_total_games,
    };
  });
}

// ---------------------- 신고 버튼 ----------------------
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

// ---------------------- 카드 ----------------------
function RankCard(props) {
  const { t } = useTranslation();
  const { rank, name, image, win_count, win_rate, match_wins, match_count, match_win_rate, isMobile } = props;
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
        zIndex: 2,
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
        <MediaRenderer url={image} alt={name} />
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
}

// ---------------------- 스켈레톤 ----------------------
function SkeletonTableRow({ colCount = 7 }) {
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
}

// ---------------------- 메인 컴포넌트 ----------------------
export default function StatsPage({
  selectedCup,
  showCommentBox = false,
  highlightCandidateId,
}) {
  const { t, i18n } = useTranslation();
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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 800);
  const [fetchKey, setFetchKey] = useState(0); // 강제 재조회 키

  // 광고 공급자 (언어/국가 기준)
  const isKR =
    (i18n?.language || "en").startsWith("ko") ||
    (typeof window !== "undefined" && window.APP_COUNTRY === "KR");
  const provider = isKR ? "coupang" : "amazon";

  useEffect(() => {
    function onResize() {
      setIsMobile(window.innerWidth < 800);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // 데이터 로딩
  useEffect(() => {
    async function fetchStats() {
      if (!selectedCup?.id) {
        setStats([]);
        setLoading(false);
        return;
      }
      setLoading(true);

      let statsArr;
      if (customMode && customFrom && customTo) {
        const range = getCustomSinceDate(customFrom, customTo);
        statsArr = await fetchWinnerStatsFromDB(selectedCup.id, range);
      } else {
        const range = getRangeForAllOrPeriod(period);
        statsArr = await fetchWinnerStatsFromDB(selectedCup.id, range);
      }

      setStats(normalizeStats(statsArr)); // 화면 보정 후 반영
      setLoading(false);
    }
    fetchStats();
  }, [selectedCup, period, customMode, customFrom, customTo, fetchKey]);

  // 검색/정렬/멤버필터
  const filteredStats = useMemo(() => {
    let result = [...stats].filter((row) =>
      row.name?.toLowerCase().includes(search.toLowerCase())
    );

    // 회원 전용이면 표시용 필드를 user_* 기준으로 전환
    if (userOnly) {
      result = result.map((row) => ({
        ...row,
        win_count:   row.user_win_count   || 0,
        match_wins:  row.user_match_wins  || 0,
        match_count: row.user_match_count || 0,
        total_games: row.user_total_games || 0,
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
          const av = a.total_games ? a.win_count / a.total_games : 0;
          const bv = b.total_games ? b.win_count / b.total_games : 0;
          if (av < bv) return sortDesc ? 1 : -1;
          if (av > bv) return sortDesc ? -1 : 1;
          return a._originIdx - b._originIdx;
        }
        if (sortKey === "match_win_rate") {
          const av = a.match_count ? a.match_wins / a.match_count : 0;
          const bv = b.match_count ? b.match_wins / b.match_count : 0;
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

    result.forEach((row, i) => {
      row.rank = i + 1;
    });
    return result;
  }, [stats, search, userOnly, sortKey, sortDesc]);

  // 페이지네이션
  const totalStats = filteredStats.length;
  const totalPages = Math.max(1, Math.ceil(totalStats / itemsPerPage));
  const pagedStats = useMemo(
    () => filteredStats.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [filteredStats, currentPage, itemsPerPage]
  );
  useEffect(() => {
    setCurrentPage(1);
  }, [search, itemsPerPage, stats]);

  // 상단 카드(현재 필터 결과 기준 Top3)
  const top3 = useMemo(
    () =>
      [...filteredStats]
        .sort((a, b) => {
          if (a.win_count > b.win_count) return -1;
          if (a.win_count < b.win_count) return 1;
          if (a.match_wins > b.match_wins) return -1;
          if (a.match_wins < b.match_wins) return 1;
          return (a.rank || 0) - (b.rank || 0);
        })
        .slice(0, 3),
    [filteredStats]
  );

  // 스타일
  const ivoryCell = {
    background: "#fcf5cd",
    fontWeight: 800,
    color: "#998314",
    fontSize: isMobile ? 15 : 18,
    border: 0,
  };
  const normalCell = {
    background: "#fff",
    color: "#333",
    padding: "7px 0",
  };

  // 페이지네이션 UI
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

  // 공유/신고 바
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
            navigator.clipboard.writeText(shareUrl);
            window?.toast?.success ? window.toast.success(t("share_link_copied")) : alert(t("share_link_copied"));
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

  // 썸네일 컬럼 제외 테이블 컬럼 정의
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
          title={selectedCup.title}
        >
          {selectedCup.title}
        </div>
      </div>
      <style>
        {`@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&display=swap');`}
      </style>

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
          gap: isMobile ? 0 : 0,
          overflowX: "auto",
        }}
      >
        {top3.map((row, i) =>
          row ? (
            <RankCard
              key={row.candidate_id}
              rank={i + 1}
              name={row.name}
              image={row.image}
              win_count={row.win_count}
              win_rate={row.total_games ? percent(row.win_count, row.total_games) : "-"}
              match_wins={row.match_wins}
              match_count={row.match_count}
              match_win_rate={row.match_count ? percent(row.match_wins, row.match_count) : "-"}
              isMobile={isMobile}
            />
          ) : null
        )}
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
        <button
          style={tabBtnStyle(!userOnly)}
          onClick={() => {
            setUserOnly(false);
            setFetchKey((k) => k + 1); // 탭 전환시 재조회 키 갱신
          }}
        >
          {t("all")}
        </button>
        <button
          style={{ ...tabBtnStyle(userOnly), marginRight: 0 }}
          onClick={() => {
            setUserOnly(true);
            setFetchKey((k) => k + 1);
          }}
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
              setFetchKey((k) => k + 1);
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
            setFetchKey((k) => k + 1);
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
                setFetchKey((k) => k + 1);
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
                setFetchKey((k) => k + 1);
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
      <div style={{ width: "100%", overflowX: "auto", marginBottom: 12 }}>
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
              {sortableCols.map((col) => (
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
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonTableRow key={i} colCount={sortableCols.length} />)
              : pagedStats.length === 0
              ? (
                <tr>
                  <td colSpan={sortableCols.length} style={{ padding: 22, color: "#888" }}>
                    {t("cannot_show_results")}
                  </td>
                </tr>
                )
              : (
                pagedStats.map((row, idx) => {
                  const isHighlighted = highlightCandidateId && row.candidate_id === highlightCandidateId;
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
                      <td style={ivoryCell}>
                        {row.total_games ? percent(row.win_count, row.total_games) : "-"}
                      </td>
                      <td style={normalCell}>{row.match_wins}</td>
                      <td style={normalCell}>{row.match_count}</td>
                      <td style={ivoryCell}>
                        {row.match_count ? percent(row.match_wins, row.match_count) : "-"}
                      </td>
                    </tr>
                  );
                })
                )}
          </tbody>
        </table>
      </div>

      <Pagination />

      {/* 댓글 위 가로 배너 */}
      {showCommentBox && (
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
            margin: "18px 0 10px",
          }}
        >
          <div style={{ width: isMobile ? 320 : 728, height: isMobile ? 100 : 90 }}>
            <AdSlot
              id="ad-stats-above-comments"
              provider={provider}
              width={isMobile ? 320 : 728}
              height={isMobile ? 100 : 90}
            />
          </div>
        </div>
      )}

      {/* 댓글 */}
      {showCommentBox && <CommentBox cupId={selectedCup.id} />}
    </div>
  );
}

// ---------------------- 버튼 스타일 ----------------------
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
