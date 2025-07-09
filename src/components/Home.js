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
        borderRadius: 0,
        margin: 0,
        padding: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 0,
        backdropFilter: "blur(2.5px)",
      }}
    >
      <div
        style={{
          width: "100%",
          height: thumbHeight,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
        }}
      />
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

  // 카드 높이/간격 등 (하단 버튼이 더 아래에 붙게끔)
  const CARD_HEIGHT = isMobile ? 240 : 265;
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

  const NEON_FONT = "'Orbitron', 'Pretendard', sans-serif";
  const mainDark = "#171C27";
  const blueLine = "#1976ed";

  // 버튼, 제목 배경 동일하게!
  const buttonStyle = {
    background: mainDark,
    color: "#fff",
    fontWeight: 900,
    border: "none",
    borderRadius: 8,
    fontSize: isMobile ? 14 : 15,
    padding: isMobile ? "8px 22px" : "10px 28px",
    outline: "none",
    cursor: "pointer",
    letterSpacing: "0.6px",
    fontFamily: NEON_FONT,
    margin: "0 3px",
    boxShadow: "none",
    transition: "background 0.15s",
    marginTop: 0,
    marginBottom: 0,
    display: "inline-block",
  };

  const smallButtonStyle = {
    ...buttonStyle,
    padding: isMobile ? "7px 13px" : "8px 16px",
    fontSize: isMobile ? 13 : 14,
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
          zIndex: 2,
        }}
      >
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
                    borderRadius: 0,
                    background: "#16234a",
                    boxShadow: "none",
                    border: "none",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                    overflow: "hidden",
                    transition: "box-shadow 0.18s, transform 0.16s",
                    marginBottom: 0,
                    cursor: "pointer",
                    backdropFilter: "blur(3px)",
                    willChange: "transform",
                  }}
                  // 카드 붕뜨는 효과
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = "translateY(-7px) scale(1.018)";
                    e.currentTarget.style.boxShadow = "0 8px 24px 0 #1976ed55, 0 1.5px 6px #1976ed66";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = "";
                    e.currentTarget.style.boxShadow = "";
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
                      background: "linear-gradient(90deg, #14224a 0%, #283a65 100%)",
                      borderTopLeftRadius: 0,
                      borderTopRightRadius: 0,
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        width: "50%",
                        height: "100%",
                        background: "#192145",
                        borderTopLeftRadius: 0,
                        borderTopRightRadius: 0,
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
                        borderTopLeftRadius: 0,
                        borderTopRightRadius: 0,
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
                        width: isMobile ? 63.58 : 84.15,
                        height: isMobile ? 63.58 : 84.15,
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
                  {/* 제목 */}
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
                  {/* 하단 버튼 (파란선 바로 위에!) */}
                  <div
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: isMobile
                        ? "7px 10px 10px 10px"
                        : "11px 18px 13px 18px",
                      minHeight: 36,
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
                      <div style={{ width: isMobile ? 39 : 49 }} />
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
        {/* 폰트 import */}
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
