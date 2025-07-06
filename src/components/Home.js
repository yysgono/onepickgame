import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { fetchWinnerStatsFromDB, getMostWinnerFromDB } from "../utils";
import COLORS from "../styles/theme";
import {
  cardBoxStyle,
  subButtonStyle,
  editButtonStyle,
  delButtonStyle,
} from "../styles/common";
import MediaRenderer from "./MediaRenderer";
import AdBanner from "./AdBanner";

// Skeleton Card
function SkeletonCard({ cardMinWidth, cardMaxWidth, cardMinHeight, cardRadius }) {
  return (
    <div
      style={{
        ...cardBoxStyle,
        width: "100%",
        minWidth: cardMinWidth,
        maxWidth: cardMaxWidth,
        minHeight: cardMinHeight,
        background: "#e7f1fb",
        border: "none",
        boxShadow: "0 2px 14px #b2b8c566",
        animation: "skeleton-loading 1.2s infinite linear",
        borderRadius: cardRadius,
        margin: 0,
        padding: 0,
      }}
    >
      <div
        style={{
          width: "100%",
          aspectRatio: "1 / 1",
          borderTopLeftRadius: cardRadius,
          borderTopRightRadius: cardRadius,
          overflow: "hidden",
          background: "#dbe6f2",
        }}
      />
      <div style={{ padding: "10px 9px 8px 9px", flex: 1 }}>
        <div style={{ width: "85%", height: 15, background: "#dde7f1", borderRadius: 7, margin: "5px auto" }} />
        <div style={{ width: "65%", height: 10, background: "#e8eef8", borderRadius: 7, margin: "7px auto" }} />
        <div style={{ width: "38%", height: 7, background: "#e8eef8", borderRadius: 7, margin: "5px auto" }} />
      </div>
    </div>
  );
}

const useSlideFadeIn = (length) => {
  const refs = useRef([]);
  useEffect(() => {
    refs.current.forEach((ref, i) => {
      if (ref) {
        ref.style.opacity = "0";
        ref.style.transform = "translateY(20px) scale(0.97)";
        setTimeout(() => {
          ref.style.transition = "opacity 0.5s cubic-bezier(.35,1,.4,1), transform 0.48s cubic-bezier(.35,1,.4,1)";
          ref.style.opacity = "1";
          ref.style.transform = "translateY(0) scale(1)";
        }, 60 + 18 * i);
      }
    });
  }, [length]);
  return refs;
};

function Home({
  worldcupList,
  onSelect,
  onMakeWorldcup,
  onDelete,
  user,
  nickname,
  isAdmin,
}) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("popular");
  const [loading, setLoading] = useState(true);
  const [cupsWithWinCount, setCupsWithWinCount] = useState(null);

  // 브라우저 width에 따라 자동계산 (반응형/배너 제외)
  const [vw, setVw] = useState(window.innerWidth);
  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const isMobile = vw < 700;

  // ==== 사이드 배너/카드 그리드 width 세팅 ====
  // 배너 실제 크기와 반드시 일치시켜야함
  const SIDE_BANNER_WIDTH = isMobile ? 0 : 280; // ← 280으로 변경
  const GRID_MARGIN = isMobile ? 0 : 24;
  const MAX_GRID_WIDTH = 1200; // 카드 그리드 최대폭(px)
  // "브라우저 전체폭 - 배너2개 - margin" vs 최대폭 중 작은 것
  const gridMaxWidth = isMobile
    ? "100vw"
    : `${Math.min(vw - SIDE_BANNER_WIDTH * 2 - GRID_MARGIN * 2, MAX_GRID_WIDTH)}px`;

  // 카드 세팅
  const CARD_MIN_WIDTH = isMobile ? 110 : 160;
  const CARD_MAX_WIDTH = isMobile ? 170 : 200;
  const CARD_RADIUS = isMobile ? 12 : 14;
  const CARD_GAP = 0; // 딱 붙게
  const CARD_MIN_HEIGHT = isMobile ? 86 : 126;
  const SKELETON_COUNT = isMobile ? 6 : 10;

  // 데이터 로딩
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
    return () => { mounted = false; }
  }, [worldcupList]);

  // 필터/정렬
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

  return (
    <div style={{
      width: "100vw",
      minHeight: "70vh",
      background: "none",
      boxSizing: "border-box",
      overflowX: "hidden",
      position: "relative",
    }}>
      {/* ---- 배너는 fixed, 겹침 완전 방지 ---- */}
      {!isMobile && (
        <>
          <AdBanner
            position="left"
            img="ad1.png"
            width={SIDE_BANNER_WIDTH}
            height={600}
            style={{
              position: "fixed",
              left: 24,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 1000,
              width: SIDE_BANNER_WIDTH,
              height: 600,
              pointerEvents: "none", // 반드시 필요!
            }}
          />
          <AdBanner
            position="right"
            img="ad1.png"
            width={SIDE_BANNER_WIDTH}
            height={600}
            style={{
              position: "fixed",
              right: 24,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 1000,
              width: SIDE_BANNER_WIDTH,
              height: 600,
              pointerEvents: "none", // 반드시 필요!
            }}
          />
        </>
      )}

      {/* ---- 카드 그리드 영역 (항상 중앙, 배너 안 겹침) ---- */}
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
        {/* 정렬/검색 */}
        <div
          style={{
            margin: "0 0 14px 0",
            display: "flex",
            alignItems: "center",
            gap: 11,
            flexWrap: "wrap",
          }}
        >
          <button
            style={{
              background:
                sort === "popular"
                  ? `linear-gradient(90deg, ${COLORS.main} 70%, ${COLORS.sub} 100%)`
                  : "#f3f6fa",
              color: sort === "popular" ? "#fff" : COLORS.main,
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
                  ? `linear-gradient(90deg, ${COLORS.main} 70%, ${COLORS.sub} 100%)`
                  : "#f3f6fa",
              color: sort === "recent" ? "#fff" : COLORS.main,
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
          <div style={{ flex: 1 }} />
          {/* 검색창 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              position: "relative",
              width: isMobile ? 110 : 200,
              minHeight: isMobile ? 28 : 36,
              maxWidth: "100%",
              background: COLORS.lightGray,
              borderRadius: 999,
              border: "1.2px solid #b4c4e4",
              boxShadow: "0 1px 4px #1976ed0c",
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
                stroke={COLORS.main}
                strokeWidth="2"
                fill="none"
              />
              <line
                x1="11"
                y1="11"
                x2="14"
                y2="14"
                stroke={COLORS.main}
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
        {/* 카드 그리드 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? `repeat(2, 1fr)` : `repeat(6, 1fr)`,
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
                cardMinWidth={CARD_MIN_WIDTH}
                cardMaxWidth={CARD_MAX_WIDTH}
                cardMinHeight={CARD_MIN_HEIGHT}
                cardRadius={CARD_RADIUS}
              />
            ))}

          {!loading &&
            filtered.length > 0 &&
            filtered.map((cup, idx) => {
              const topCandidate = getMostWinnerFromDB(cup.winStats || [], cup.data);
              const thumbnail = topCandidate
                ? topCandidate.image
                : cup.data[0]?.image || "";

              const isMine =
                isAdmin ||
                cup.owner === currentUserId ||
                cup.creator === currentUserId ||
                cup.creator_id === currentUserId ||
                cup.owner === currentUserEmail ||
                cup.creator === currentUserEmail ||
                cup.creator_id === currentUserEmail;

              return (
                <div
                  key={cup.id}
                  ref={(el) => (cardRefs.current[idx] = el)}
                  onClick={(e) => {
                    // ★ 반드시 필요: 버튼이 아닌 부분만 클릭시 onSelect 호출
                    if (e.target.tagName !== "BUTTON") onSelect && onSelect(cup);
                  }}
                  style={{
                    ...cardBoxStyle,
                    width: "100%",
                    minWidth: CARD_MIN_WIDTH,
                    maxWidth: CARD_MAX_WIDTH,
                    minHeight: CARD_MIN_HEIGHT,
                    borderRadius: CARD_RADIUS,
                    boxShadow: "0 2px 12px #b2b8c533",
                    border: "1.2px solid #e7f3fd",
                    background: "#fff",
                    display: "flex",
                    flexDirection: "column",
                    fontSize: isMobile ? 11 : 12,
                    padding: 0,
                    margin: 0,
                    boxSizing: "border-box",
                    position: "relative",
                    cursor: "pointer", // UX 개선
                  }}
                >
                  {/* 썸네일 */}
                  <div
                    style={{
                      width: "100%",
                      aspectRatio: "1 / 1",
                      borderTopLeftRadius: CARD_RADIUS,
                      borderTopRightRadius: CARD_RADIUS,
                      overflow: "hidden",
                      background: "#e7f3fd",
                      flexShrink: 0,
                      boxShadow: "0 1px 5px #e6f4fc18",
                      position: "relative",
                    }}
                  >
                    {thumbnail ? (
                      <MediaRenderer url={thumbnail} alt={cup.title} />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          background: "#e7f3fd",
                        }}
                      />
                    )}
                    {topCandidate && (
                      <div
                        style={{
                          position: "absolute",
                          top: 5,
                          left: 5,
                          background: "#ffd700ee",
                          color: "#333",
                          fontWeight: 800,
                          fontSize: isMobile ? 9 : 11,
                          padding: "2px 6px",
                          borderRadius: 9,
                          boxShadow: "0 1px 3px #0001",
                        }}
                      >
                        🥇 최다우승
                      </div>
                    )}
                  </div>
                  <div
                    style={{
                      padding: isMobile
                        ? "7px 6px 6px 6px"
                        : "10px 10px 8px 10px",
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-end",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 800,
                        fontSize: isMobile ? 11 : 12,
                        marginBottom: 3,
                        color: COLORS.darkText,
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                        textAlign: "center",
                        wordBreak: "break-all",
                        whiteSpace: "normal",
                        lineHeight: 1.15,
                        minHeight: isMobile ? 11 : 16,
                      }}
                    >
                      {cup.title}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 5,
                        margin: isMobile ? "3px 0 1px 0" : "7px 0 4px 0",
                        justifyContent: "center",
                      }}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `/stats/${cup.id}`;
                        }}
                        style={{
                          ...subButtonStyle(isMobile),
                          fontSize: isMobile ? 10 : 12,
                          padding: isMobile ? "5px 8px" : "6px 11px",
                          minWidth: 0,
                          borderRadius: 8,
                        }}
                      >
                        통계/댓글
                      </button>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 4,
                        justifyContent: "center",
                      }}
                    >
                      {isMine && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = `/edit-worldcup/${cup.id}`;
                            }}
                            style={editButtonStyle(isMobile)}
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
                            style={delButtonStyle(isMobile)}
                          >
                            삭제
                          </button>
                        </>
                      )}
                    </div>
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
          `}
        </style>
      </div>
    </div>
  );
}

export default Home;
