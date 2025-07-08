import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { fetchWinnerStatsFromDB } from "../utils";
import COLORS from "../styles/theme";
import MediaRenderer from "./MediaRenderer";
import AdBanner from "./AdBanner";
import FixedCupSection from "./FixedCupCarousel";

// 카드 fade-in 효과
const useSlideFadeIn = (length) => {
  const refs = useRef([]);
  useEffect(() => {
    refs.current.forEach((ref, i) => {
      if (ref) {
        ref.style.opacity = "0";
        ref.style.transform = "translateY(20px) scale(0.97)";
        setTimeout(() => {
          ref.style.transition =
            "opacity 0.5s cubic-bezier(.35,1,.4,1), transform 0.48s cubic-bezier(.35,1,.4,1)";
          ref.style.opacity = "1";
          ref.style.transform = "translateY(0) scale(1)";
        }, 60 + 18 * i);
      }
    });
  }, [length]);
  return refs;
};

function SkeletonCard({ cardHeight, cardRadius, thumbHeight }) {
  return (
    <div
      style={{
        width: "100%",
        height: cardHeight,
        background: "#e7f1fb",
        border: "none",
        boxShadow: "0 2px 14px #b2b8c566",
        animation: "skeleton-loading 1.2s infinite linear",
        borderRadius: cardRadius,
        margin: 0,
        padding: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 0,
      }}
    >
      <div
        style={{
          width: "100%",
          height: thumbHeight,
          display: "flex",
          flexDirection: "row",
          borderTopLeftRadius: cardRadius,
          borderTopRightRadius: cardRadius,
          overflow: "hidden",
        }}
      >
        <div style={{ width: "50%", height: "100%", background: "#dbe6f2" }} />
        <div style={{ width: "50%", height: "100%", background: "#dbe6f2" }} />
      </div>
      <div style={{ padding: "30px 0 0 0", width: "80%" }}>
        <div
          style={{
            width: "80%",
            height: 22,
            background: "#dde7f1",
            borderRadius: 7,
            margin: "5px auto",
          }}
        />
        <div
          style={{
            width: "50%",
            height: 14,
            background: "#e8eef8",
            borderRadius: 7,
            margin: "12px auto",
          }}
        />
      </div>
    </div>
  );
}

function Home({
  worldcupList,
  fetchWorldcups,
  onSelect,
  onMakeWorldcup,
  onDelete,
  user,
  nickname,
  isAdmin,
  fixedWorldcups,
  showFixedWorldcups = true,
}) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("popular");
  const [loading, setLoading] = useState(true);
  const [cupsWithWinCount, setCupsWithWinCount] = useState(null);
  const [vw, setVw] = useState(window.innerWidth);

  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const isMobile = vw < 600;
  const SIDE_BANNER_WIDTH = vw < 1000 ? 0 : 20;
  const GRID_MARGIN = vw < 1000 ? 0 : 24;
  const MAX_GRID_WIDTH = 1200;
  const gridMaxWidth = vw < 1000
    ? "100vw"
    : `${Math.min(
        vw - SIDE_BANNER_WIDTH * 2 - GRID_MARGIN * 2,
        MAX_GRID_WIDTH
      )}px`;

  const CARD_RADIUS = isMobile ? 13 : 20;
  const CARD_HEIGHT = isMobile ? 270 : 300;
  const CARD_GAP = isMobile ? 10 : 20;
  const SKELETON_COUNT = isMobile ? 3 : 6;
  const THUMB_HEIGHT = isMobile ? 168 : 168 * 1.2;

  useEffect(() => {
    let mounted = true;
    async function fillWinCounts() {
      setLoading(true);
      if (!worldcupList?.length) {
        setCupsWithWinCount([]);
        setLoading(false);
        return;
      }
      const list = await Promise.all(
        worldcupList.map(async (cup) => {
          const statsArr = await fetchWinnerStatsFromDB(cup.id);
          const winCount = statsArr.reduce(
            (sum, row) => sum + (row.win_count || 0),
            0
          );
          return { ...cup, winCount, winStats: statsArr };
        })
      );
      if (mounted) {
        setCupsWithWinCount(list);
        setLoading(false);
      }
    }
    fillWinCounts();
    return () => {
      mounted = false;
    };
  }, [worldcupList]);

  const filtered = Array.isArray(cupsWithWinCount)
    ? (cupsWithWinCount || [])
        .filter(
          (cup) =>
            cup.title.toLowerCase().includes(search.toLowerCase()) ||
            (cup.description || cup.desc || "")
              .toLowerCase()
              .includes(search.toLowerCase())
        )
        .sort((a, b) => {
          if (sort === "recent") {
            return (b.created_at || b.id) > (a.created_at || a.id) ? 1 : -1;
          } else {
            return (b.winCount || 0) - (a.winCount || 0);
          }
        })
    : [];

  const cardRefs = useSlideFadeIn(filtered.length);

  const currentUserId = user?.id || "";
  const currentUserEmail = user?.email || "";

  function getTop2Winners(winStats, cupData) {
    if (!winStats?.length) return [cupData?.[0] || null, cupData?.[1] || null];
    const sorted = [...winStats].sort(
      (a, b) => (b.win_count || 0) - (a.win_count || 0)
    );
    const first =
      cupData?.find((c) => c.id === sorted[0]?.candidate_id) ||
      cupData?.[0] ||
      null;
    const second =
      cupData?.find((c) => c.id === sorted[1]?.candidate_id) ||
      cupData?.[1] ||
      null;
    return [first, second];
  }

  function isMine(cup) {
    return (
      isAdmin ||
      cup.owner === currentUserId ||
      cup.creator === currentUserId ||
      cup.creator_id === currentUserId ||
      cup.owner === currentUserEmail ||
      cup.creator === currentUserEmail ||
      cup.creator_id === currentUserEmail
    );
  }

  const buttonStyle = {
    background: "#fff",
    color: "#1976ed",
    fontWeight: 700,
    border: "none",
    borderRadius: 999,
    fontSize: isMobile ? 15 : 16,
    padding: isMobile ? "5px 14px" : "7px 17px",
    outline: "none",
    cursor: "pointer",
    boxShadow: "0 2px 6px #1976ed16",
    letterSpacing: "-0.2px",
    fontFamily: "inherit",
    transition: "background .14s, color .14s",
    display: "inline-block",
    lineHeight: 1.15,
  };

  const smallButtonStyle = {
    ...buttonStyle,
    padding: isMobile ? "5px 10px" : "7px 11px",
    fontSize: isMobile ? 14 : 15,
  };

  return (
    <div
      style={{
        width: "100vw",
        minHeight: "70vh",
        background: "none",
        boxSizing: "border-box",
        overflowX: "hidden",
        position: "relative",
      }}
    >
      {showFixedWorldcups !== false && (
        <FixedCupSection worldcupList={fixedWorldcups || []} />
      )}

      <div
        style={{
          width: "100%",
          maxWidth: gridMaxWidth,
          margin: "0 auto",
          padding: 0,
          boxSizing: "border-box",
          position: "relative",
        }}
      >
        {/* 검색/정렬 영역 */}
        <div
          style={{
            margin: "0 0 14px 0",
            display: "flex",
            alignItems: "center",
            width: "100%",
            justifyContent: "center",
            gap: 0,
            flexWrap: "wrap",
            position: "relative",
          }}
        >
          {/* 왼쪽: 정렬 버튼 */}
          <div
            style={{
              display: "flex",
              gap: 9,
              flexShrink: 0,
              minWidth: isMobile ? 130 : 150,
            }}
          >
            <button
              style={{
                background:
                  sort === "popular"
                    ? `linear-gradient(90deg, #68a5f8 70%, #9fd5f9 100%)`
                    : "#f3f6fa",
                color: sort === "popular" ? "#fff" : "#297ACF",
                fontWeight: 700,
                border: "none",
                borderRadius: 999,
                padding: isMobile ? "6px 13px" : "8px 16px",
                fontSize: isMobile ? 13 : 15,
                boxShadow: sort === "popular" ? "0 2px 6px #1976ed16" : "none",
                cursor: "pointer",
                transition: "all 0.14s",
              }}
              onClick={() => setSort("popular")}
            >
              인기순
            </button>
            <button
              style={{
                background:
                  sort === "recent"
                    ? `linear-gradient(90deg, #68a5f8 70%, #9fd5f9 100%)`
                    : "#f3f6fa",
                color: sort === "recent" ? "#fff" : "#297ACF",
                fontWeight: 700,
                border: "none",
                borderRadius: 999,
                padding: isMobile ? "6px 13px" : "8px 16px",
                fontSize: isMobile ? 13 : 15,
                boxShadow: sort === "recent" ? "0 2px 6px #1976ed16" : "none",
                cursor: "pointer",
                transition: "all 0.14s",
              }}
              onClick={() => setSort("recent")}
            >
              최신순
            </button>
          </div>
          {/* 가운데: 검색창 */}
          <div
            style={{
              flex: "1 1 0px",
              display: "flex",
              justifyContent: "center",
              minWidth: 220,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                position: "relative",
                width: isMobile ? "100%" : 430,
                minHeight: isMobile ? 28 : 36,
                maxWidth: "100%",
                background: "#e9f4ff",
                borderRadius: 999,
                border: "1.2px solid #b4c4e4",
                boxShadow: "0 1px 4px #1976ed0c",
                margin: "0 auto",
              }}
            >
              <svg
                width="14"
                height="14"
                style={{
                  position: "absolute",
                  left: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  opacity: 0.4,
                  pointerEvents: "none",
                }}
              >
                <circle
                  cx="7"
                  cy="7"
                  r="6"
                  stroke="#1976ed"
                  strokeWidth="2"
                  fill="none"
                />
                <line
                  x1="11"
                  y1="11"
                  x2="14"
                  y2="14"
                  stroke="#1976ed"
                  strokeWidth="2"
                />
              </svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="검색"
                style={{
                  width: "100%",
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  padding: isMobile ? "6px 6px 6px 22px" : "8px 12px 8px 26px",
                  fontSize: isMobile ? 12 : 13,
                  borderRadius: 999,
                }}
              />
            </div>
          </div>
          {/* 오른쪽(빈 공간, 버튼 높이 맞춤) */}
          <div
            style={{
              minWidth: isMobile ? 130 : 150,
              height: 1,
              flexShrink: 0,
            }}
          />
        </div>

        {/* 카드 그리드 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              vw > 1000
                ? "repeat(3, 1fr)"
                : vw > 600
                ? "repeat(2, 1fr)"
                : "repeat(1, 1fr)",
            gap: CARD_GAP,
            width: "100%",
            margin: 0,
            padding: 0,
            boxSizing: "border-box",
            justifyContent: "start",
            alignItems: "start",
          }}
        >
          {loading &&
            Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <SkeletonCard
                key={i}
                cardHeight={CARD_HEIGHT}
                cardRadius={CARD_RADIUS}
                thumbHeight={THUMB_HEIGHT}
              />
            ))}
          {!loading &&
            filtered.length > 0 &&
            filtered.map((cup, idx) => {
              const [first, second] = getTop2Winners(cup.winStats, cup.data);
              return (
                <div
                  key={cup.id}
                  ref={(el) => (cardRefs.current[idx] = el)}
                  style={{
                    width: "100%",
                    height: CARD_HEIGHT,
                    borderRadius: CARD_RADIUS,
                    background: "#fff",
                    boxShadow: "0 4px 16px #a1c8f826",
                    border: "1.5px solid #e1eafd",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                    overflow: "hidden",
                    transition: "box-shadow 0.18s, transform 0.16s",
                    marginBottom: 0,
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    if (onSelect) onSelect(cup);
                  }}
                >
                  {/* 썸네일 */}
                  <div
                    style={{
                      width: "100%",
                      height: THUMB_HEIGHT,
                      display: "flex",
                      flexDirection: "row",
                      background: "linear-gradient(90deg, #F2F8FF 50%, #EDF7FF 100%)",
                      borderTopLeftRadius: CARD_RADIUS,
                      borderTopRightRadius: CARD_RADIUS,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: "50%",
                        height: "100%",
                        borderTopLeftRadius: CARD_RADIUS,
                        borderTopRightRadius: 0,
                        overflow: "hidden",
                        background: "#eaf3fb",
                      }}
                    >
                      {first?.image ? (
                        <MediaRenderer url={first.image} alt="1위" playable={false} />
                      ) : (
                        <div
                          style={{ width: "100%", height: "100%", background: "#eee" }}
                        />
                      )}
                    </div>
                    <div
                      style={{
                        width: "50%",
                        height: "100%",
                        borderTopLeftRadius: 0,
                        borderTopRightRadius: CARD_RADIUS,
                        overflow: "hidden",
                        background: "#eaf3fb",
                      }}
                    >
                      {second?.image ? (
                        <MediaRenderer
                          url={second.image}
                          alt="2위"
                          playable={false}
                        />
                      ) : (
                        <div
                          style={{ width: "100%", height: "100%", background: "#eee" }}
                        />
                      )}
                    </div>
                    <div
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -55%)",
                        zIndex: 5,
                        pointerEvents: "none",
                        width: 80,
                        height: 80,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <img
                        src="/vs.png"
                        alt="vs"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                        }}
                      />
                    </div>
                  </div>
                  {/* 제목 */}
                  <div
                    style={{
                      width: "100%",
                      maxWidth: "100%",
                      minHeight: 32,
                      maxHeight: 64,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: isMobile
                        ? "8px 11px 6px 11px"
                        : "13px 16px 7px 16px",
                      fontWeight: 900,
                      fontSize: isMobile ? 17 : 20,
                      color: "#1863A3",
                      textAlign: "center",
                      wordBreak: "break-all",
                      lineHeight: 1.16,
                      letterSpacing: "-0.2px",
                      boxSizing: "border-box",
                      margin: 0,
                      marginBottom: 0,
                      whiteSpace: "normal",
                    }}
                    title={cup.title}
                  >
                    <span
                      style={{
                        width: "100%",
                        display: "-webkit-box",
                        WebkitBoxOrient: "vertical",
                        WebkitLineClamp: 2,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        textAlign: "center",
                        lineHeight: 1.18,
                        margin: 0,
                        padding: 0,
                      }}
                    >
                      {cup.title}
                    </span>
                  </div>
                  {/* 하단 버튼 strip */}
                  <div
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: isMobile
                        ? "8px 13px 8px 13px"
                        : "11px 22px 11px 22px",
                      minHeight: 38,
                      background: "#fff",
                      boxSizing: "border-box",
                      marginTop: 0,
                    }}
                  >
                    {/* 시작 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSelect) onSelect(cup);
                      }}
                      style={buttonStyle}
                      className="mainpick-btn"
                    >
                      시작
                    </button>
                    {/* 수정/삭제 */}
                    {isMine(cup) ? (
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `/edit-worldcup/${cup.id}`;
                          }}
                          style={smallButtonStyle}
                          className="mainpick-btn"
                        >
                          수정
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!window.confirm("정말 삭제하시겠습니까?")) return;
                            if (onDelete) onDelete(cup.id);
                            else window.location.reload();
                          }}
                          style={smallButtonStyle}
                          className="mainpick-btn"
                        >
                          삭제
                        </button>
                      </div>
                    ) : (
                      <div style={{ width: isMobile ? 43 : 51 }} />
                    )}
                    {/* 통계/댓글 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = `/stats/${cup.id}`;
                      }}
                      style={buttonStyle}
                      className="mainpick-btn"
                    >
                      통계/댓글
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
        <style>
          {`
            @keyframes skeleton-loading {
              0% { background-color: #e7f1fb; }
              50% { background-color: #e4ebf3; }
              100% { background-color: #e7f1fb; }
            }
            .mainpick-btn:hover {
              background: #f2f8ff;
              color: #1451b8;
            }
            .mainpick-btn:active {
              background: #e4eefb;
              color: #1451b8;
            }
          `}
        </style>
      </div>
    </div>
  );
}

export default Home;
