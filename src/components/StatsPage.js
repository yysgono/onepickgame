// src/components/StatsPage.jsx
import React, { useState, useEffect } from "react";
import { fetchWinnerStatsFromDB } from "../utils";
import { useTranslation } from "react-i18next";
import MediaRenderer from "./MediaRenderer";
import COLORS from "../styles/theme";
import CommentBox from "./CommentBox";

function percent(n, d) {
  if (!d) return "-";
  return Math.round((n / d) * 100) + "%";
}

function StatsPage({ selectedCup, showCommentBox = true }) {
  const { t } = useTranslation();
  const [stats, setStats] = useState([]);
  const [sortKey, setSortKey] = useState("winCount");
  const [sortDesc, setSortDesc] = useState(true);
  const [search, setSearch] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 800);

  useEffect(() => {
    async function fetchStats() {
      if (!selectedCup?.id) return setStats([]);
      const dbStats = await fetchWinnerStatsFromDB(selectedCup.id);

      // 후보 목록과 통계 조인(매칭)
      const statsArr = (selectedCup.data || []).map(item => {
        const s = dbStats.find(row => String(row.candidate_id) === String(item.id)) || {};
        return {
          id: item.id,
          name: item.name,
          image: item.image,
          winCount: s.win_count || 0,
          matchWins: s.match_wins || 0,
          matchCount: s.match_count || 0,
          totalGames: s.total_games || 0,
          createdAt: item.createdAt || 0,
        };
      });
      setStats(statsArr);
    }
    fetchStats();
  }, [selectedCup]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 800);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const filteredStats = [...stats]
    .filter(row => row.name?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) =>
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
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: "flex-start",
          gap: 32,
          width: "100%",
          justifyContent: isMobile ? "center" : undefined,
        }}
      >
        {/* 통계 표 */}
        <div
          style={{
            flex: 1.2,
            minWidth: 340,
            maxWidth: isMobile ? 700 : 700,
            margin: isMobile ? "0 auto 32px auto" : undefined,
          }}
        >
          {/* 검색창 */}
          <div
            style={{
              marginBottom: 12,
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
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
                      setSortKey("winCount");
                      setSortDesc(k => !k);
                    }}
                  >
                    {t("win_count")} {sortKey === "winCount" ? (sortDesc ? "▼" : "▲") : ""}
                  </th>
                  <th style={{ padding: "10px 0" }}>{t("win_rate")}</th>
                  <th
                    style={{ padding: "10px 0", cursor: "pointer" }}
                    onClick={() => {
                      setSortKey("matchWins");
                      setSortDesc(k => !k);
                    }}
                  >
                    {t("match_wins")} {sortKey === "matchWins" ? (sortDesc ? "▼" : "▲") : ""}
                  </th>
                  <th
                    style={{ padding: "10px 0", cursor: "pointer" }}
                    onClick={() => {
                      setSortKey("matchCount");
                      setSortDesc(k => !k);
                    }}
                  >
                    {t("duel_count")} {sortKey === "matchCount" ? (sortDesc ? "▼" : "▲") : ""}
                  </th>
                  <th style={{ padding: "10px 0" }}>{t("match_win_rate")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredStats.map((row, i) => (
                  <tr
                    key={row.id}
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
                      {row.winCount}
                    </td>
                    <td style={{ padding: "7px 0", ...getNameTextStyle(i + 1) }}>
                      {row.totalGames ? percent(row.winCount, row.totalGames) : "-"}
                    </td>
                    <td style={{ padding: "7px 0" }}>{row.matchWins}</td>
                    <td style={{ padding: "7px 0" }}>{row.matchCount}</td>
                    <td style={{ padding: "7px 0" }}>
                      {row.matchCount ? percent(row.matchWins, row.matchCount) : "-"}
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
        {/* 댓글: showCommentBox가 true일 때만 노출 */}
        {showCommentBox && (
          <div
            style={{
              flex: 1,
              minWidth: 300,
              maxWidth: 480,
              background: "#fff",
              borderRadius: 16,
              boxShadow: "0 2px 12px #0001",
              padding: 24,
              marginTop: 0,
              width: "100%",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            <CommentBox cupId={selectedCup.id} />
          </div>
        )}
      </div>
    </div>
  );
}

export default StatsPage;
