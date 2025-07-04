import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { fetchWinnerStatsFromDB, getMostWinnerFromDB } from "../utils";
import COLORS from "../styles/theme";
import {
  cardBoxStyle,
  mainButtonStyle,
  subButtonStyle,
  grayButtonStyle,
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
        boxShadow: "0 2px 24px #b2b8c5aa",
        minHeight: isMobile ? 190 : 270,
        animation: "skeleton-loading 1.2s infinite linear",
      }}
    >
      <div
        style={{
          width: "100%",
          aspectRatio: "1 / 1",
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          overflow: "hidden",
          background: "#dbe6f2",
          marginBottom: 0,
        }}
      />
      <div
        style={{
          padding: isMobile
            ? "13px 12px 12px 12px"
            : "20px 20px 14px 20px",
          flex: 1,
        }}
      >
        <div
          style={{
            width: "85%",
            height: 24,
            background: "#dde7f1",
            borderRadius: 8,
            margin: "7px auto 9px auto",
          }}
        />
        <div
          style={{
            width: "62%",
            height: 14,
            background: "#e8eef8",
            borderRadius: 8,
            margin: "8px auto",
          }}
        />
        <div
          style={{
            width: "35%",
            height: 12,
            background: "#e8eef8",
            borderRadius: 8,
            margin: "6px auto",
          }}
        />
        <div
          style={{
            width: "38%",
            height: 13,
            background: "#e8eef8",
            borderRadius: 8,
            margin: "6px auto 0 auto",
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
        ref.style.transform = "translateY(24px) scale(0.98)";
        setTimeout(() => {
          ref.style.transition =
            "opacity 0.5s cubic-bezier(.35,1,.4,1), transform 0.48s cubic-bezier(.35,1,.4,1)";
          ref.style.opacity = "1";
          ref.style.transform = "translateY(0) scale(1)";
        }, 50 + 50 * i);
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
  const [loading, setLoading] = useState(true); // <<<<<<<<
  const [cupsWithWinCount, setCupsWithWinCount] = useState(null); // <<<< null로!

  // 1. 월드컵별 우승횟수 카운트 가져오기
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
    return () => { mounted = false; };
  }, [worldcupList]);

  // 2. 필터/정렬
  const filtered = Array.isArray(cupsWithWinCount)
    ? (cupsWithWinCount || [])
        .filter(
          (cup) =>
            cup.title.toLowerCase().includes(search.toLowerCase()) ||
            (cup.description || cup.desc || "").toLowerCase().includes(search.toLowerCase())
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

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 2200,
        margin: "0 auto",
        padding: isMobile
          ? "24px 4vw 80px 4vw"
          : "38px 60px 90px 60px",
        minHeight: "70vh",
        background: `linear-gradient(150deg, #fafdff 80%, #e3f0fb 100%)`,
        overflowX: "hidden",
        boxSizing: "border-box",
      }}
    >
      {/* --- 정렬/검색 --- */}
      <div
        style={{
          margin: "0 0 24px 0",
          display: "flex",
          alignItems: "center",
          gap: 14,
          flexWrap: "wrap",
        }}
      >
        <button
          style={{
            background:
              sort === "popular"
                ? `linear-gradient(90deg, ${COLORS.main} 60%, ${COLORS.sub} 100%)`
                : "#f3f6fa",
            color: sort === "popular" ? "#fff" : COLORS.main,
            fontWeight: 700,
            border: "none",
            borderRadius: 999,
            padding: isMobile ? "9px 20px" : "12px 30px",
            fontSize: isMobile ? 15 : 16,
            boxShadow: sort === "popular" ? "0 2px 8px #1976ed22" : "none",
            cursor: "pointer",
            transition: "all 0.16s",
          }}
          onClick={() => setSort("popular")}
        >
          인기순
        </button>
        <button
          style={{
            background:
              sort === "recent"
                ? `linear-gradient(90deg, ${COLORS.main} 60%, ${COLORS.sub} 100%)`
                : "#f3f6fa",
            color: sort === "recent" ? "#fff" : COLORS.main,
            fontWeight: 700,
            border: "none",
            borderRadius: 999,
            padding: isMobile ? "9px 20px" : "12px 30px",
            fontSize: isMobile ? 15 : 16,
            boxShadow: sort === "recent" ? "0 2px 8px #1976ed22" : "none",
            cursor: "pointer",
            transition: "all 0.16s",
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
            width: isMobile ? 180 : 340,
            minHeight: isMobile ? 40 : 48,
            maxWidth: "100%",
            background: COLORS.lightGray,
            borderRadius: 999,
            border: "1.5px solid #b4c4e4",
            boxShadow: "0 1px 8px #1976ed11",
          }}
        >
          <svg
            width="20"
            height="20"
            style={{
              position: "absolute",
              left: 16,
              top: "50%",
              transform: "translateY(-50%)",
              opacity: 0.43,
              pointerEvents: "none",
            }}
          >
            <circle
              cx="8"
              cy="8"
              r="7"
              stroke={COLORS.main}
              strokeWidth="2"
              fill="none"
            />
            <line
              x1="13"
              y1="13"
              x2="19"
              y2="19"
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
              padding: isMobile
                ? "11px 12px 11px 42px"
                : "13px 17px 13px 46px",
              fontSize: isMobile ? 15 : 17,
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
            ? "repeat(auto-fit, minmax(160px, 1fr))"
            : "repeat(5, minmax(0, 1fr))",
          gap: isMobile ? 17 : 36,
          width: "100%",
          maxWidth: "100%",
          margin: "0 auto",
          boxSizing: "border-box",
          justifyContent: "center",
        }}
      >
        {/* 로딩 중엔 Skeleton */}
        {loading &&
          Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <SkeletonCard key={i} isMobile={isMobile} />
          ))}

        {/* 로딩 끝, 데이터도 없음: "등록된 월드컵이 없습니다" */}
        {!loading && filtered.length === 0 && (
          <div
            style={{
              gridColumn: "1 / -1",
              color: "#aaa",
              fontSize: 22,
              textAlign: "center",
              marginTop: 64,
            }}
          >
            등록된 월드컵이 없습니다.
          </div>
        )}

        {/* 데이터 있으면 카드 */}
        {!loading && filtered.length > 0 &&
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
                  margin: "0 auto",
                  cursor: "pointer",
                  transition: "all 0.18s cubic-bezier(.35,1,.4,1)",
                  display: "flex",
                  flexDirection: "column",
                }}
                onClick={(e) => {
                  if (e.target.tagName !== "BUTTON") onSelect && onSelect(cup);
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 10px 40px #1976ed38, 0 6px 18px #45b7fa23";
                  e.currentTarget.style.transform =
                    "translateY(-10px) scale(1.045)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 4px 24px #1976ed22, 0 2px 12px #b4c4e4";
                  e.currentTarget.style.transform = "none";
                }}
              >
                {/* 썸네일 */}
                <div
                  style={{
                    width: "100%",
                    aspectRatio: "1 / 1",
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                    overflow: "hidden",
                    background: "#e7f3fd",
                    marginBottom: 0,
                    flexShrink: 0,
                    boxShadow: "0 2px 16px #e6f4fc70",
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
                        top: 6,
                        left: 8,
                        background: "#ffd700ee",
                        color: "#333",
                        fontWeight: 800,
                        fontSize: isMobile ? 12 : 15,
                        padding: "2px 8px",
                        borderRadius: 14,
                        boxShadow: "0 1px 4px #0001",
                      }}
                    >
                      🥇 최다우승
                    </div>
                  )}
                </div>
                <div
                  style={{
                    padding: isMobile
                      ? "13px 12px 12px 12px"
                      : "20px 20px 14px 20px",
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 900,
                      fontSize: isMobile ? 17 : 21,
                      marginBottom: 8,
                      color: COLORS.darkText,
                      textOverflow: "ellipsis",
                      overflow: "hidden",
                      textAlign: "center",
                      wordBreak: "break-all",
                      whiteSpace: "normal",
                      lineHeight: 1.25,
                      minHeight: isMobile ? 24 : 30,
                    }}
                  >
                    {cup.title}
                  </div>
                  <div
                    style={{
                      color: "#5a6988",
                      fontSize: isMobile ? 13 : 15,
                      marginBottom: 7,
                      minHeight: 20,
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
                      fontSize: isMobile ? 12 : 13,
                      marginBottom: 3,
                    }}
                  >
                    후보 수: {cup.data?.length || 0}
                  </div>
                  <div
                    style={{
                      color: "#888",
                      fontSize: 13,
                      marginBottom: 3,
                    }}
                  >
                    우승횟수: {cup.winCount || 0}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      margin: isMobile ? "13px 0 8px 0" : "16px 0 8px 0",
                      justifyContent: "center",
                    }}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect && onSelect(cup);
                      }}
                      style={mainButtonStyle(isMobile)}
                    >
                      시작
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = `/stats/${cup.id}`;
                      }}
                      style={subButtonStyle(isMobile)}
                    >
                      통계
                    </button>
                  </div>
                  <div
                    style={{ display: "flex", gap: 8, justifyContent: "center" }}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const url = `${window.location.origin}/select-round/${cup.id}`;
                        navigator.clipboard.writeText(url);
                        window?.toast?.success
                          ? window.toast.success("링크가 복사되었습니다!")
                          : alert("링크가 복사되었습니다!");
                      }}
                      style={grayButtonStyle(isMobile)}
                    >
                      공유
                    </button>
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
