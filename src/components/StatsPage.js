import React, { useState, useEffect } from "react";
import { fetchWinnerStatsFromDB } from "../utils";
import { useTranslation } from "react-i18next";
import MediaRenderer from "./MediaRenderer";
import CommentBox from "./CommentBox";
import { supabase } from "../utils/supabaseClient";

function StatsSkeleton({ isMobile = false }) {
  const dummyRows = Array(7).fill(0);
  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          background: "#fff",
          borderRadius: "12px",
          textAlign: "center",
          fontSize: isMobile ? 13 : 17,
          tableLayout: "fixed",
        }}
      >
        <thead>
          <tr style={{ background: "#f7f7f7" }}>
            {["순위", "이미지", "이름", "우승", "우승률", "승리", "대결", "승률"].map((h, i) => (
              <th key={i} style={{ padding: "10px 0" }}>
                <div style={{
                  width: 60, height: 18, margin: "0 auto",
                  background: "#e7f1fb", borderRadius: 7, animation: "skeleton-loading 1.2s infinite linear"
                }} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dummyRows.map((_, i) => (
            <tr key={i}>
              {[...Array(8)].map((_, j) => (
                <td key={j} style={{ padding: "13px 0" }}>
                  <div style={{
                    height: 18, width: (j === 1 ? (isMobile ? 30 : 44) : (isMobile ? 38 : 70)),
                    margin: "0 auto",
                    background: "#e7f1fb",
                    borderRadius: 7,
                    animation: "skeleton-loading 1.2s infinite linear"
                  }} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <style>{`
        @keyframes skeleton-loading {
          0% { background-color: #e7f1fb; }
          50% { background-color: #e4ebf3; }
          100% { background-color: #e7f1fb; }
        }
      `}</style>
    </div>
  );
}

function ReportButton({ cupId }) {
  const [show, setShow] = useState(false);
  const [reason, setReason] = useState("");
  const [ok, setOk] = useState("");
  const [error, setError] = useState("");
  async function handleReport() {
    setError(""); setOk("");
    const { data } = await supabase.auth.getUser();
    if (!data?.user?.id) return setError("로그인 필요");
    const { error } = await supabase.from("reports").insert([{
      type: "worldcup",
      target_id: cupId,
      reporter_id: data.user.id,
      reason
    }]);
    if (error) setError(error.message);
    else setOk("신고가 접수되었습니다. 감사합니다.");
  }
  return (
    <>
      <button onClick={() => setShow(true)} style={{
        color: "#d33", background: "#fff4f4", border: "1.5px solid #f6c8c8", borderRadius: 8,
        padding: "5px 15px", marginLeft: 8, fontWeight: 700, cursor: "pointer"
      }}>🚩 신고</button>
      {show && (
        <div style={{
          position: "fixed", left: 0, top: 0, width: "100vw", height: "100vh",
          background: "#0006", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div style={{ background: "#fff", borderRadius: 14, padding: 22, minWidth: 270 }}>
            <b>신고 사유</b>
            <textarea value={reason} onChange={e => setReason(e.target.value)} style={{ width: "95%", minHeight: 60, marginTop: 12 }} placeholder="신고 사유를 입력하세요 (선택)" />
            <div style={{ marginTop: 12 }}>
              <button onClick={handleReport} style={{ marginRight: 10 }}>신고하기</button>
              <button onClick={() => setShow(false)}>닫기</button>
            </div>
            {ok && <div style={{ color: "#1976ed", marginTop: 7 }}>{ok}</div>}
            {error && <div style={{ color: "#d33", marginTop: 7 }}>{error}</div>}
          </div>
        </div>
      )}
    </>
  );
}
function percent(n, d) {
  if (!d) return "-";
  return Math.round((n / d) * 100) + "%";
}
const PERIODS = [
  { label: "전체", value: null },
  { label: "24시간", value: 1 },
  { label: "1주일", value: 7 },
  { label: "1개월", value: 30 },
  { label: "3개월", value: 90 },
  { label: "6개월", value: 180 },
  { label: "1년", value: 365 },
];
function getSinceDate(days) {
  if (!days) return null;
  const date = new Date();
  if (days === 1) {
    date.setDate(date.getDate() - 1);
    return date.toISOString();
  }
  date.setDate(date.getDate() - days);
  return date.toISOString();
}
function getCustomSinceDate(from, to) {
  if (!from || !to) return null;
  const fromIso = new Date(from).toISOString();
  const toIso = new Date(to).toISOString();
  return { from: fromIso, to: toIso };
}

function StatsPage({ selectedCup, showCommentBox = false }) {
  const { t } = useTranslation();
  const [stats, setStats] = useState([]);
  const [sortKey, setSortKey] = useState("win_count");
  const [sortDesc, setSortDesc] = useState(true);
  const [search, setSearch] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 800);
  const [userOnly, setUserOnly] = useState(false);

  const [period, setPeriod] = useState(null);
  const [customMode, setCustomMode] = useState(false);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      if (!selectedCup?.id) {
        setStats([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      if (customMode && customFrom && customTo) {
        const range = getCustomSinceDate(customFrom, customTo);
        const statsArr = await fetchWinnerStatsFromDB(selectedCup.id, range);
        setStats(statsArr);
        setLoading(false);
      } else {
        let since = getSinceDate(period);
        const statsArr = await fetchWinnerStatsFromDB(selectedCup.id, since);
        setStats(statsArr);
        setLoading(false);
      }
    }
    fetchStats();
    // eslint-disable-next-line
  }, [selectedCup, period, customMode, customFrom, customTo]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 800);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  let filteredStats = [...stats]
    .filter(row => row.name?.toLowerCase().includes(search.toLowerCase()));
  if (userOnly) {
    filteredStats = filteredStats.map(row => ({
      ...row,
      win_count: row.user_win_count || 0,
    }));
  }
  filteredStats = filteredStats.sort((a, b) =>
    sortDesc
      ? (b[sortKey] ?? 0) - (a[sortKey] ?? 0)
      : (a[sortKey] ?? 0) - (b[sortKey] ?? 0)
  );

  function getRowStyle(rank) {
    if (rank === 1) return { background: "#fff9dd" };
    if (rank === 2) return { background: "#e9f3ff" };
    if (rank === 3) return { background: "#ffe9ea" };
    return {};
  }
  function getNameTextStyle(rank) {
    if (rank === 1) return { color: "#e0af19", fontWeight: 700 };
    if (rank === 2) return { color: "#4286f4", fontWeight: 700 };
    if (rank === 3) return { color: "#e26464", fontWeight: 700 };
    return {};
  }
  const nameTdStyle = {
    maxWidth: isMobile ? 90 : 120,
    wordBreak: "break-word",
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    whiteSpace: "normal",
    fontWeight: 700,
    fontSize: isMobile ? 13 : 15,
    lineHeight: 1.18,
    textAlign: "left",
    verticalAlign: "middle"
  };
  function tabBtnStyle(selected) {
    return {
      padding: "8px 19px",
      marginRight: 8,
      borderRadius: 8,
      border: selected
        ? "2.5px solid #1976ed"
        : "1.5px solid #ccc",
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
      border: selected
        ? "2.5px solid #1976ed"
        : "1.5px solid #ccc",
      background: selected ? "#e8f2fe" : "#fff",
      color: selected ? "#1976ed" : "#555",
      fontWeight: 700,
      fontSize: 15,
      cursor: "pointer",
      transition: "all 0.15s"
    };
  }

  function handleCustomApply() {
    if (customFrom && customTo) {
      setCustomMode(true);
    }
  }
  function handleCustomCancel() {
    setCustomMode(false);
    setCustomFrom("");
    setCustomTo("");
    setPeriod(null);
  }

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 1200,
        margin: "0 auto",
        padding: isMobile ? "0 0 24px 0" : "0 0 32px 0",
        boxSizing: "border-box"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
        <h2 style={{ fontWeight: 900, color: "#222", margin: 0, fontSize: 24 }}>통계</h2>
        {selectedCup?.id && <ReportButton cupId={selectedCup.id} />}
      </div>
      <div style={{
        display: "flex", justifyContent: "center", gap: 8, marginBottom: 6
      }}>
        <button
          style={tabBtnStyle(!userOnly)}
          onClick={() => setUserOnly(false)}
        >
          전체
        </button>
        <button
          style={{ ...tabBtnStyle(userOnly), marginRight: 0 }}
          onClick={() => setUserOnly(true)}
        >
          회원만
        </button>
      </div>
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 0,
        justifyContent: "center",
        marginBottom: 12
      }}>
        {PERIODS.map((p) => (
          <button
            key={p.value === null ? "all" : p.value}
            onClick={() => {
              setCustomMode(false);
              setPeriod(p.value);
            }}
            style={periodBtnStyle(!customMode && period === p.value)}
          >
            {p.label}
          </button>
        ))}
        <button
          style={{
            ...periodBtnStyle(customMode),
            marginRight: 0,
            background: customMode ? "#e7f7f6" : "#fff"
          }}
          onClick={() => {
            setCustomMode(true);
            setPeriod(undefined);
          }}
        >
          기간설정
        </button>
      </div>
      {customMode && (
        <div style={{
          display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8, marginBottom: 10
        }}>
          <input
            type="date"
            value={customFrom}
            max={customTo}
            onChange={e => setCustomFrom(e.target.value)}
            style={{ padding: "6px 11px", borderRadius: 8, border: "1.3px solid #bbb" }}
          />
          <span style={{ lineHeight: "33px", fontWeight: 700 }}>~</span>
          <input
            type="date"
            value={customTo}
            min={customFrom}
            onChange={e => setCustomTo(e.target.value)}
            style={{ padding: "6px 11px", borderRadius: 8, border: "1.3px solid #bbb" }}
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
              marginRight: 0
            }}
            onClick={handleCustomApply}
            disabled={!customFrom || !customTo}
          >적용</button>
          <button
            style={{
              padding: "7px 13px",
              borderRadius: 8,
              border: "1.5px solid #aaa",
              background: "#fff",
              color: "#666",
              fontWeight: 700,
              fontSize: 15,
              cursor: "pointer"
            }}
            onClick={handleCustomCancel}
          >취소</button>
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t("search")}
          style={{
            width: 140,
            padding: "7px 13px",
            borderRadius: 8,
            border: "1.5px solid #bbb",
            fontSize: 14
          }}
        />
      </div>
      {loading ? (
        <StatsSkeleton isMobile={isMobile} />
      ) : (
        <div style={{ width: "100%", overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              background: "#fff",
              borderRadius: "12px",
              textAlign: "center",
              fontSize: isMobile ? 13 : 17,
              tableLayout: "fixed",
              wordBreak: "break-word",
              overflowWrap: "break-word",
            }}
          >
            <thead>
              <tr style={{ background: "#f7f7f7" }}>
                <th style={{ padding: "10px 0" }}>{t("rank")}</th>
                <th style={{ padding: "10px 0" }}>{t("image")}</th>
                <th style={{ padding: "10px 0" }}>{t("name")}</th>
                <th
                  style={{ padding: "10px 0", cursor: "pointer" }}
                  onClick={() => {
                    setSortKey("win_count");
                    setSortDesc(k => !k);
                  }}
                >
                  {t("win_count")} {sortKey === "win_count" ? (sortDesc ? "▼" : "▲") : ""}
                </th>
                <th style={{ padding: "10px 0" }}>{t("win_rate")}</th>
                <th
                  style={{ padding: "10px 0", cursor: "pointer" }}
                  onClick={() => {
                    setSortKey("match_wins");
                    setSortDesc(k => !k);
                  }}
                >
                  {t("match_wins")} {sortKey === "match_wins" ? (sortDesc ? "▼" : "▲") : ""}
                </th>
                <th
                  style={{ padding: "10px 0", cursor: "pointer" }}
                  onClick={() => {
                    setSortKey("match_count");
                    setSortDesc(k => !k);
                  }}
                >
                  {t("duel_count")} {sortKey === "match_count" ? (sortDesc ? "▼" : "▲") : ""}
                </th>
                <th style={{ padding: "10px 0" }}>{t("match_win_rate")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredStats.map((row, i) => (
                <tr
                  key={row.candidate_id}
                  style={{
                    ...getRowStyle(i + 1),
                    textAlign: "center",
                    fontWeight: i + 1 <= 3 ? 700 : 400
                  }}
                >
                  <td
                    style={{
                      padding: "7px 0",
                      fontSize: isMobile ? 15 : 19,
                      ...getNameTextStyle(i + 1)
                    }}
                  >
                    {i + 1 <= 3 ? (
                      <span>
                        <span style={{ fontSize: 18, verticalAlign: "middle" }}>👑</span>{" "}
                        {i + 1}
                      </span>
                    ) : i + 1}
                  </td>
                  <td style={{ padding: "7px 0" }}>
                    <div style={{
                      width: isMobile ? 30 : 44,
                      height: isMobile ? 30 : 44,
                      borderRadius: 9,
                      overflow: "hidden",
                      margin: "0 auto"
                    }}>
                      <MediaRenderer url={row.image} alt={row.name} />
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "7px 0",
                      ...getNameTextStyle(i + 1),
                      ...nameTdStyle,
                    }}
                  >
                    {row.name}
                  </td>
                  <td style={{ padding: "7px 0", ...getNameTextStyle(i + 1) }}>
                    {row.win_count}
                  </td>
                  <td style={{ padding: "7px 0", ...getNameTextStyle(i + 1) }}>
                    {row.total_games ? percent(row.win_count, row.total_games) : "-"}
                  </td>
                  <td style={{ padding: "7px 0" }}>{row.match_wins}</td>
                  <td style={{ padding: "7px 0" }}>{row.match_count}</td>
                  <td style={{ padding: "7px 0" }}>
                    {row.match_count ? percent(row.match_wins, row.match_count) : "-"}
                  </td>
                </tr>
              ))}
              {filteredStats.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: 24, color: "#888" }}>
                    {t("cannotShowResult")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      {showCommentBox && (
        <div style={{
          marginTop: 36,
          background: "#fff",
          borderRadius: 18,
          boxShadow: "0 2px 18px #1976ed09, 0 1px 8px #1976ed11",
          padding: "8px 0 24px 0"
        }}>
          <CommentBox cupId={selectedCup?.id} />
        </div>
      )}
    </div>
  );
}

export default StatsPage;
