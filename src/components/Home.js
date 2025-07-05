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

// --------- Skeleton Card 컴포넌트 ---------
function SkeletonCard({ isMobile }) {
  return (
    <div
      style={{
        ...cardBoxStyle,
        width: "100%",
        margin: "0 auto",
        background: "#e7f1fb",
        border: "none",
        boxShadow: "0 2px 14px #b2b8c566",
        minHeight: isMobile ? 116 : 178, // 5% 증가
        animation: "skeleton-loading 1.2s infinite linear",
      }}
    >
      <div
        style={{
          width: "100%",
          aspectRatio: "1 / 1",
          borderTopLeftRadius: isMobile ? 14 : 16.8, // 5% 증가
          borderTopRightRadius: isMobile ? 14 : 16.8,
          overflow: "hidden",
          background: "#dbe6f2",
          marginBottom: 0,
        }}
      />
      <div
        style={{
          padding: isMobile ? "6.3px 8.4px 8.4px 8.4px" : "10.5px 12.6px 8.4px 12.6px",
          flex: 1,
        }}
      >
        <div
          style={{
            width: "89.25%",
            height: 17.85,
            background: "#dde7f1",
            borderRadius: 7.35,
            margin: "4.2px auto 6.3px auto",
          }}
        />
        <div
          style={{
            width: "65.1%",
            height: 10.5,
            background: "#e8eef8",
            borderRadius: 7.35,
            margin: "5.25px auto",
          }}
        />
        <div
          style={{
            width: "36.75%",
            height: 8.4,
            background: "#e8eef8",
            borderRadius: 7.35,
            margin: "4.2px auto",
          }}
        />
        <div
          style={{
            width: "39.9%",
            height: 9.45,
            background: "#e8eef8",
            borderRadius: 7.35,
            margin: "4.2px auto 0 auto",
          }}
        />
      </div>
    </div>
  );
}

// --------- 카드 슬라이드 애니메이션 ---------
const useSlideFadeIn = (length) => {
  const refs = useRef([]);
  useEffect(() => {
    refs.current.forEach((ref, i) => {
      if (ref) {
        ref.style.opacity = "0";
        ref.style.transform = "translateY(18.9px) scale(0.97)";
        setTimeout(() => {
          ref.style.transition =
            "opacity 0.5s cubic-bezier(.35,1,.4,1), transform 0.48s cubic-bezier(.35,1,.4,1)";
          ref.style.opacity = "1";
          ref.style.transform = "translateY(0) scale(1)";
        }, 50 + 36.75 * i);
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
  const vw = typeof window !== "undefined" ? window.innerWidth : 1024;
  const isMobile = vw < 700;
  const SKELETON_COUNT = isMobile ? 6 : 8;

  // 카드 크기 조정
  const CARD_MAX_WIDTH = isMobile ? 168 : 194; // 5% 증가
  const CARD_MIN_HEIGHT = isMobile ? 178 : 220; // 5% 증가
  const CARD_RADIUS = isMobile ? 14 : 17; // 5% 증가

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 1207, // 1150 * 1.05
        margin: "0 auto",
        padding: isMobile ? "4.2px 2.1vw 42px 2.1vw" : "14.7px 21px 44px 21px",
        minHeight: "70vh",
        background: "none",
        overflowX: "hidden",
        boxSizing: "border-box",
      }}
    >
      {/* --- 정렬/검색 --- */}
      <div
        style={{
          margin: "0 0 11.5px 0",
          display: "flex",
          alignItems: "center",
          gap: 9.5,
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
            padding: isMobile ? "5.25px 14.7px" : "7.35px 19.95px",
            fontSize: isMobile ? 13.65 : 14.7,
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
            padding: isMobile ? "5.25px 14.7px" : "7.35px 19.95px",
            fontSize: isMobile ? 13.65 : 14.7,
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
            width: isMobile ? 126 : 231, // 5% 증가
            minHeight: isMobile ? 31.5 : 36.75,
            maxWidth: "100%",
            background: COLORS.lightGray,
            borderRadius: 999,
            border: "1.26px solid #b4c4e4",
            boxShadow: "0 1px 4px #1976ed0c",
          }}
        >
          <svg
            width="15.75"
            height="15.75"
            style={{
              position: "absolute",
              left: 11.55,
              top: "50%",
              transform: "translateY(-50%)",
              opacity: 0.4,
              pointerEvents: "none",
            }}
          >
            <circle
              cx="7.35"
              cy="7.35"
              r="6.3"
              stroke={COLORS.main}
              strokeWidth="2"
              fill="none"
            />
            <line
              x1="11.55"
              y1="11.55"
              x2="15.75"
              y2="15.75"
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
              padding: isMobile ? "6.3px 6.3px 6.3px 31.5px" : "8.4px 12.6px 8.4px 31.5px",
              fontSize: isMobile ? 12.6 : 13.65,
              borderRadius: 999,
            }}
          />
        </div>
      </div>

      {/* --- 월드컵 카드 그리드 or Skeleton --- */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile
            ? "repeat(auto-fit, minmax(141px, 1fr))"
            : "repeat(5, minmax(0, 1fr))",
          // 여기 가로 간격을 PC에서만 32px로 넓힘!
          gap: isMobile ? "12px" : "32px 18px",  // "가로 세로" 순서
          width: "100%",
          maxWidth: "100%",
          margin: "0 auto",
          boxSizing: "border-box",
          justifyContent: "center",
        }}
      >
        {loading &&
          Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <SkeletonCard key={i} isMobile={isMobile} />
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
                style={{
                  ...cardBoxStyle,
                  width: "100%",
                  maxWidth: CARD_MAX_WIDTH,
                  minHeight: CARD_MIN_HEIGHT,
                  margin: "0 auto",
                  cursor: "pointer",
                  borderRadius: CARD_RADIUS,
                  boxShadow: "0 2px 8px #b2b8c522",
                  transition: "all 0.14s cubic-bezier(.35,1,.4,1)",
                  display: "flex",
                  flexDirection: "column",
                  fontSize: isMobile ? 12.6 : 13.65,
                  padding: isMobile ? "0" : "0",
                }}
                onClick={(e) => {
                  if (e.target.tagName !== "BUTTON") onSelect && onSelect(cup);
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 7px 28px #1976ed26, 0 3px 10px #45b7fa18";
                  e.currentTarget.style.transform =
                    "translateY(-6.3px) scale(1.032)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 2px 8px #b2b8c522";
                  e.currentTarget.style.transform = "none";
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
                    marginBottom: 0,
                    flexShrink: 0,
                    boxShadow: "0 1px 7px #e6f4fc30",
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
                        top: 4.2,
                        left: 5.25,
                        background: "#ffd700ee",
                        color: "#333",
                        fontWeight: 800,
                        fontSize: isMobile ? 10.5 : 12.6,
                        padding: "1.05px 5.25px",
                        borderRadius: 10.5,
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
                      ? "8.4px 6.3px 6.3px 6.3px"
                      : "13.65px 13.65px 8.4px 13.65px",
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: isMobile ? 14.7 : 15.75,
                      marginBottom: 4.2,
                      color: COLORS.darkText,
                      textOverflow: "ellipsis",
                      overflow: "hidden",
                      textAlign: "center",
                      wordBreak: "break-all",
                      whiteSpace: "normal",
                      lineHeight: 1.18,
                      minHeight: isMobile ? 17.85 : 24.15,
                    }}
                  >
                    {cup.title}
                  </div>
                  <div
                    style={{
                      color: "#5a6988",
                      fontSize: isMobile ? 11.55 : 12.6,
                      marginBottom: 3.15,
                      minHeight: 15.75,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {cup.description || cup.desc}
                  </div>
                  <div
                    style={{
                      color: "#99b",
                      fontSize: isMobile ? 10.5 : 11.55,
                      marginBottom: 2.1,
                    }}
                  >
                    후보 수: {cup.data?.length || 0}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 7.35,
                      margin: isMobile ? "3.15px 0 2.1px 0" : "7.35px 0 4.2px 0",
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
                        fontSize: isMobile ? 12.6 : 13.65,
                        padding: isMobile ? "6.3px 10.5px" : "7.35px 13.65px",
                        minWidth: 0,
                        borderRadius: 8.4,
                      }}
                    >
                      통계/댓글
                    </button>
                  </div>
                  <div
                    style={{ display: "flex", gap: 5.25, justifyContent: "center" }}
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
      {/* Skeleton 애니메이션용 css */}
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
  );
}

export default Home;
