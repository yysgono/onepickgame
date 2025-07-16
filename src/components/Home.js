import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { fetchWinnerStatsFromDB } from "../utils";
import COLORS from "../styles/theme";
import MediaRenderer from "./MediaRenderer";
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

function SkeletonCard({ cardHeight, thumbHeight }) {
  return (
    <div
      style={{
        width: "100%",
        height: cardHeight,
        background: "rgba(24,27,34,0.66)",
        border: "none",
        borderRadius: 18,
        margin: 0,
        padding: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 0,
        backdropFilter: "blur(5px)",
        boxShadow: "0 8px 28px 0 #1e254877, 0 1.5px 8px #1976ed22",
      }}
    >
      <div
        style={{
          width: "100%",
          height: thumbHeight,
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
        }}
      />
    </div>
  );
}

const PAGE_SIZE = 15;

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

  // 몇 개까지 보여줄지 상태
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

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

  const CARD_HEIGHT = isMobile ? 240 : 265;
  const CARD_GAP = isMobile ? 14 : 28;
  const SKELETON_COUNT = isMobile ? 3 : 6;
  const THUMB_HEIGHT = isMobile ? 168 : 168 * 1.2;

  // 일반 월드컵 목록
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

  // "추천" 고정 월드컵용 winStats 포함
  const [fixedCupsWithStats, setFixedCupsWithStats] = useState([]);
  useEffect(() => {
    let mounted = true;
    async function fillFixedStats() {
      if (!fixedWorldcups || !fixedWorldcups.length) {
        setFixedCupsWithStats([]);
        return;
      }
      const list = await Promise.all(
        fixedWorldcups.map(async (cup) => {
          // 이미 winStats 있으면 그대로, 아니면 fetch
          if (Array.isArray(cup.winStats) && cup.winStats.length > 0) return cup;
          const statsArr = await fetchWinnerStatsFromDB(cup.id);
          return { ...cup, winStats: statsArr };
        })
      );
      if (mounted) setFixedCupsWithStats(list);
    }
    fillFixedStats();
    return () => { mounted = false; };
  }, [fixedWorldcups]);

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

  // 보여줄 리스트 제한
  const visibleList = filtered.slice(0, visibleCount);

  const cardRefs = useSlideFadeIn(visibleList.length);

  const currentUserId = user?.id || "";
  const currentUserEmail = user?.email || "";

  function getTop2Winners(winStats, cupData) {
    if (!winStats?.length) return [cupData?.[0] || null, cupData?.[1] || null];
    // winStats를 win_count 기준으로 내림차순 정렬
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

  const NEON_FONT = "'Orbitron', 'Pretendard', sans-serif";
  const mainDark = "#171C27";
  const blueLine = "#1976ed";

  const buttonStyle = {
    background: mainDark,
    color: "#fff",
    fontWeight: 900,
    border: "none",
    borderRadius: 8,
    fontSize: isMobile ? 13 : 14,
    padding: isMobile ? "5px 12px" : "7px 17px",
    outline: "none",
    cursor: "pointer",
    letterSpacing: "0.5px",
    fontFamily: NEON_FONT,
    margin: "0 2px",
    boxShadow: "none",
    transition: "background 0.15s",
    marginTop: 0,
    marginBottom: 0,
    display: "inline-block",
  };

  const smallButtonStyle = {
    ...buttonStyle,
    padding: isMobile ? "4px 7px" : "6px 10px",
    fontSize: isMobile ? 12 : 13,
  };

  const sortButton = (label, value) => (
    <button
      type="button"
      style={{
        background: sort === value ? "#1976ed" : "#222c3d",
        color: "#fff",
        fontWeight: 800,
        border: "none",
        borderRadius: 7,
        fontSize: isMobile ? 13 : 14,
        padding: isMobile ? "6px 14px" : "7px 18px",
        marginRight: 6,
        marginLeft: 0,
        cursor: "pointer",
        boxShadow: sort === value ? "0 2px 14px #1976ed55" : "none",
        outline: sort === value ? "2px solid #22c1ff99" : "none",
        transition: "background .15s, box-shadow .13s",
      }}
      onClick={() => setSort(value)}
    >
      {label}
    </button>
  );

  // 더보기 버튼 핸들러
  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + PAGE_SIZE);
  };

  return (
    <div
      style={{
        width: "100vw",
        minHeight: "100vh",
        background: `url('/83243377_1669883362558_1_600x600.jpg') center center / cover no-repeat fixed`,
        position: "relative",
      }}
    >
      <div
        style={{
          position: "fixed",
          inset: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 0,
          pointerEvents: "none",
          background: "rgba(0,0,0,0.0)",
        }}
      />
      {showFixedWorldcups !== false && (
        <FixedCupSection worldcupList={fixedCupsWithStats || []} />
      )}
      <div
        style={{
          width: "100%",
          maxWidth: gridMaxWidth,
          margin: "0 auto",
          padding: 0,
          boxSizing: "border-box",
          position: "relative",
          zIndex: 2,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "space-between",
            alignItems: isMobile ? "stretch" : "center",
            gap: isMobile ? 9 : 0,
            width: "100%",
            margin: isMobile ? "12px 0 8px" : "22px 0 14px",
            padding: isMobile ? "0 8px" : "0 12px",
            boxSizing: "border-box",
            zIndex: 5,
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            {sortButton("인기순", "popular")}
            {sortButton("최신순", "recent")}
          </div>
          <div style={{ display: "flex", alignItems: "center" }}>
            <input
              type="text"
              placeholder="검색어 입력..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                background: "#fff",
                color: "#1b2236",
                border: "2px solid #fff",
                borderRadius: 8,
                padding: isMobile ? "9px 13px" : "13px 20px",
                fontSize: isMobile ? 16 : 17,
                minWidth: isMobile ? 0 : 200,
                outline: "none",
                fontWeight: 700,
                marginLeft: isMobile ? 0 : 10,
                boxShadow: "0 2px 12px #fff5",
                transition: "border .14s, box-shadow .14s",
                letterSpacing: ".1px",
              }}
            />
          </div>
        </div>
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
            zIndex: 2,
          }}
        >
          {loading &&
            Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <SkeletonCard
                key={i}
                cardHeight={CARD_HEIGHT}
                thumbHeight={THUMB_HEIGHT}
              />
            ))}
          {!loading &&
            visibleList.length > 0 &&
            visibleList.map((cup, idx) => {
              const [first, second] = getTop2Winners(cup.winStats, cup.data);
              return (
                <div
                  key={cup.id}
                  ref={(el) => (cardRefs.current[idx] = el)}
                  style={{
                    width: "100%",
                    height: CARD_HEIGHT,
                    borderRadius: 18,
                    background: "rgba(17,27,55,0.77)",
                    boxShadow: "0 8px 38px 0 #1976ed45, 0 2px 12px #1976ed44",
                    border: "1.5px solid #233a74",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                    overflow: "hidden",
                    transition: "box-shadow 0.18s, transform 0.16s",
                    marginBottom: 0,
                    cursor: "pointer",
                    backdropFilter: "blur(13px) brightness(1.04)",
                    WebkitBackdropFilter: "blur(13px) brightness(1.04)",
                    willChange: "transform",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = "translateY(-7px) scale(1.025)";
                    e.currentTarget.style.boxShadow = "0 12px 50px 0 #1976ed88, 0 2.5px 16px #4abfff77";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = "";
                    e.currentTarget.style.boxShadow = "0 8px 38px 0 #1976ed45, 0 2px 12px #1976ed44";
                  }}
                  onClick={() => {
                    if (onSelect) onSelect(cup);
                  }}
                >
                  <div style={{
                    position: "absolute",
                    top: "-33%",
                    left: "-12%",
                    width: "140%",
                    height: "180%",
                    zIndex: 0,
                    background:
                      "radial-gradient(circle at 50% 60%, #2a8fff33 0%, #11264c00 90%)",
                    filter: "blur(22px) brightness(1.1)",
                    opacity: 0.92,
                    pointerEvents: "none",
                  }} />
                  <div
                    style={{
                      width: "100%",
                      height: THUMB_HEIGHT,
                      display: "flex",
                      flexDirection: "row",
                      background: "linear-gradient(90deg, #162d52 0%, #284176 100%)",
                      borderTopLeftRadius: 18,
                      borderTopRightRadius: 18,
                      overflow: "hidden",
                      position: "relative",
                      zIndex: 2,
                    }}
                  >
                    <div
                      style={{
                        width: "50%",
                        height: "100%",
                        background: "#192145",
                        borderTopLeftRadius: 18,
                        overflow: "hidden",
                      }}
                    >
                      {first?.image ? (
                        <MediaRenderer url={first.image} alt="1위" playable={false} />
                      ) : (
                        <div
                          style={{ width: "100%", height: "100%", background: "#222" }}
                        />
                      )}
                    </div>
                    <div
                      style={{
                        width: "50%",
                        height: "100%",
                        background: "#1f2540",
                        borderTopRightRadius: 18,
                        overflow: "hidden",
                      }}
                    >
                      {second?.image ? (
                        <MediaRenderer url={second.image} alt="2위" playable={false} />
                      ) : (
                        <div
                          style={{ width: "100%", height: "100%", background: "#15182b" }}
                        />
                      )}
                    </div>
                    <div
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%,-55%)",
                        zIndex: 5,
                        pointerEvents: "none",
                        width: isMobile ? 55 : 70,
                        height: isMobile ? 55 : 70,
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
                          userSelect: "none",
                          pointerEvents: "none",
                        }}
                        draggable={false}
                      />
                    </div>
                  </div>
                  <div
                    style={{
                      width: "100%",
                      maxWidth: "100%",
                      minHeight: isMobile ? 32 : 38,
                      maxHeight: isMobile ? 38 : 45,
                      overflow: "hidden",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: isMobile
                        ? "4px 10px 0px 10px"
                        : "6px 18px 2px 18px",
                      fontWeight: 900,
                      fontSize: isMobile ? 17 : 20,
                      color: "#fff",
                      fontFamily: NEON_FONT,
                      textAlign: "center",
                      wordBreak: "break-all",
                      lineHeight: 1.17,
                      letterSpacing: "0.4px",
                      boxSizing: "border-box",
                      background: mainDark,
                      margin: 0,
                      marginBottom: 0,
                      whiteSpace: "normal",
                      textShadow: "0 1.5px 8px #191b25cc",
                      borderBottom: `1.5px solid #1976ed66`
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
                        whiteSpace: "normal",
                        wordBreak: "keep-all",
                        fontFamily: NEON_FONT,
                        fontWeight: 900,
                      }}
                    >
                      {cup.title}
                    </span>
                  </div>
                  <div
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: isMobile
                        ? "3px 8px 6px 8px"
                        : "6px 16px 7px 16px",
                      minHeight: isMobile ? 23 : 27,
                      background: mainDark,
                      boxSizing: "border-box",
                      marginTop: "auto",
                      borderTop: "none",
                      borderBottom: `2.6px solid ${blueLine}`,
                      borderRadius: 0,
                      gap: 0,
                    }}
                  >
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        if (onSelect) onSelect(cup);
                      }}
                      style={buttonStyle}
                      onMouseOver={e => (e.currentTarget.style.background = "#1c2232")}
                      onMouseOut={e => (e.currentTarget.style.background = mainDark)}
                    >시작</button>
                    {isMine(cup) ? (
                      <div style={{ display: "flex", gap: 5 }}>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            window.location.href = `/edit-worldcup/${cup.id}`;
                          }}
                          style={smallButtonStyle}
                          onMouseOver={e => (e.currentTarget.style.background = "#1c2232")}
                          onMouseOut={e => (e.currentTarget.style.background = mainDark)}
                        >수정</button>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            if (!window.confirm("정말 삭제하시겠습니까?")) return;
                            if (onDelete) onDelete(cup.id);
                            else window.location.reload();
                          }}
                          style={smallButtonStyle}
                          onMouseOver={e => (e.currentTarget.style.background = "#1c2232")}
                          onMouseOut={e => (e.currentTarget.style.background = mainDark)}
                        >삭제</button>
                      </div>
                    ) : (
                      <div style={{ width: isMobile ? 29 : 40 }} />
                    )}
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        window.location.href = `/stats/${cup.id}`;
                      }}
                      style={buttonStyle}
                      onMouseOver={e => (e.currentTarget.style.background = "#1c2232")}
                      onMouseOut={e => (e.currentTarget.style.background = mainDark)}
                    >통계/댓글</button>
                  </div>
                </div>
              );
            })}
        </div>
        {!loading && visibleCount < filtered.length && (
          <div style={{ textAlign: "center", margin: "38px 0 60px 0" }}>
            <button
              style={{
                padding: "13px 44px",
                background: "#1976ed",
                color: "#fff",
                fontWeight: 900,
                borderRadius: 10,
                border: "none",
                fontSize: 17,
                boxShadow: "0 2px 12px #1976ed33",
                cursor: "pointer",
                letterSpacing: "0.4px",
              }}
              onClick={handleLoadMore}
            >
              더보기
            </button>
          </div>
        )}
        <style>
          {`
            @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&display=swap');
            button:focus, button:active {
              outline: none !important;
              box-shadow: none !important;
            }
          `}
        </style>
      </div>
    </div>
  );
}

export default Home;
