import React, { useState, useEffect } from "react";
import { fetchWinnerStatsFromDB } from "../utils";
import { useTranslation } from "react-i18next";
import MediaRenderer from "./MediaRenderer";

function percent(n, d) {
  if (!d) return "-";
  return Math.round((n / d) * 100) + "%";
}

function StatsPage({ selectedCup }) {
  const { t } = useTranslation();
  const [stats, setStats] = useState([]);
  const [sortKey, setSortKey] = useState("win_count");
  const [sortDesc, setSortDesc] = useState(true);
  const [search, setSearch] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 800);

  // 전체/회원만
  const [userOnly, setUserOnly] = useState(false);

  useEffect(() => {
    async function fetchStats() {
      if (!selectedCup?.id) return setStats([]);
      const statsArr = await fetchWinnerStatsFromDB(selectedCup.id);
      setStats(statsArr);
    }
    fetchStats();
  }, [selectedCup]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 800);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // **필터링 & 정렬**
  let filteredStats = [...stats]
    .filter(row => row.name?.toLowerCase().includes(search.toLowerCase()));
  if (userOnly) {
    // 회원만 보기 - 회원 데이터가 없는 row는 필터링
    filteredStats = filteredStats
      .filter(row => row.user_win_count > 0)
      .map(row => ({
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

  // **스타일 구분 함수**
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
      boxShadow: selected ? "0 2px 7px #1976ed22" : undefined
    };
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
      <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
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
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t("search")}
          style={{
            marginLeft: 18,
            width: 140,
            padding: "7px 13px",
            borderRadius: 8,
            border: "1.5px solid #bbb",
            fontSize: 14
          }}
        />
      </div>
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
    </div>
  );
}

export default StatsPage;
