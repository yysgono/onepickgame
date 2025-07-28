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

const PAGE_SIZE = 21;

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
  const { t, i18n } = useTranslation();

  // 영어 기본 세팅
  useEffect(() => {
    if (i18n.language !== "en") {
      i18n.changeLanguage("en");
    }
  }, [i18n]);

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("popular");
  const [loading, setLoading] = useState(true);
  const [cupsWithWinCount, setCupsWithWinCount] = useState(null);
  const [vw, setVw] = useState(window.innerWidth);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const isMobile = vw < 900;
  const CARD_WIDTH = isMobile ? 320 : 420;
  const CARD_HEIGHT = isMobile ? 265 : 295;
  const CARD_GAP = isMobile ? 7 : 9;
  const SKELETON_COUNT = isMobile ? 3 : 6;
  const THUMB_HEIGHT = isMobile ? 148 : 168 * 1.05;

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

  const visibleList = filtered.slice(0, visibleCount);

  const cardRefs = useSlideFadeIn(visibleList.length);

  const currentUserId = user?.id || "";
  const currentUserEmail = user?.email || "";

  function getTop2Winners(winStats, cupData) {
    if (!winStats?.length) return [cupData?.[0] || null, cupData?.[1] || null];
    const sorted = [...winStats]
      .map((row, i) => ({ ...row, _originIdx: i }))
      .sort((a, b) => {
        if ((b.win_count || 0) !== (a.win_count || 0))
          return (b.win_count || 0) - (a.win_count || 0);
        if ((b.match_wins || 0) !== (a.match_wins || 0))
          return (b.match_wins || 0) - (a.match_wins || 0);
        return a._originIdx - b._originIdx;
      });
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
  const CARD_BG = "rgba(17,27,55,0.97)";
  const CARD_SHADOW = "0 8px 38px 0 #1976ed45, 0 2px 12px #1976ed44";
  const BOARD_BG = CARD_BG;

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

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + PAGE_SIZE);
  };

  // 상단 박스 넓이/높이 조정
  const RECOMMEND_WIDTH = isMobile ? "100%" : "64%";
  const BOARD_WIDTH = isMobile ? "100%" : "34%";
  const BOX_HEIGHT = isMobile ? 270 : 270;

  return (
    <div
      style={{
        width: "100vw",
        minHeight: "100vh",
        background: `url('/83243377_1669883362558_1_600x600.avif') center center / cover no-repeat fixed`,
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

      {/* 상단 2박스 (추천 캐러셀 + 공지/게시판) */}
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: isMobile ? 20 : 38,
          width: "100%",
          maxWidth: 1650,
          margin: "40px auto 22px",
          justifyContent: "center",
          alignItems: "stretch",
        }}
      >
        {/* 추천 월드컵 캐러셀 */}
        <div
          style={{
            width: RECOMMEND_WIDTH,
            minWidth: isMobile ? "90vw" : 450,
            maxWidth: isMobile ? "98vw" : 980,
            height: BOX_HEIGHT,
            background: CARD_BG,
            borderRadius: 18,
            boxShadow: CARD_SHADOW,
            padding: isMobile ? "14px 7px 13px 7px" : "24px 18px 13px 18px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            position: "relative",
          }}
        >
          <div
            style={{
              width: "100%",
              textAlign: "center",
              fontSize: isMobile ? 20 : 27,
              fontWeight: 900,
              color: "#fff",
              letterSpacing: ".1px",
              fontFamily: NEON_FONT,
              marginBottom: 6,
              marginTop: 0,
              textShadow: "0 2.5px 18px #11397555",
            }}
          >
            Recommend
          </div>
          <div style={{
            flex: 1,
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: isMobile ? 98 : 110,
            height: "100%",
          }}>
            <FixedCupSection worldcupList={fixedCupsWithStats || []} hideTitle />
          </div>
        </div>

        {/* 공지/게시판 */}
        <div
          style={{
            width: BOARD_WIDTH,
            minWidth: isMobile ? "90vw" : 340,
            maxWidth: isMobile ? "98vw" : 520,
            height: BOX_HEIGHT,
            background: BOARD_BG,
            borderRadius: 18,
            boxShadow: CARD_SHADOW,
            padding: isMobile ? "13px 9px 10px 9px" : "27px 22px 14px 23px",
            color: "#fff",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "flex-start",
            fontFamily: NEON_FONT,
            fontSize: isMobile ? 15 : 17,
            position: "relative",
          }}
        >
          <div style={{ fontWeight: 800, fontSize: isMobile ? 16 : 20, marginBottom: 9, color: "#bcdfff", letterSpacing: ".02em" }}>
            <span style={{ marginRight: 7 }}>
              <img src="/board_icon.png" alt="" width="21" style={{verticalAlign:"middle",marginRight:6}} />
              Notice & Latest Posts
            </span>
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, lineHeight: 1.65 }}>
            <li style={{ fontWeight: 800, marginBottom: 7, color: "#61b3ff" }}>
              [Notice] Server maintenance <b style={{color:"#fff", fontWeight:800}}>(2025-07-27)</b>
            </li>
            <li style={{ marginBottom: 5, color: "#fff", fontWeight: 400 }}>🔥 New: Worldcup 1st place revealed!</li>
            <li style={{ marginBottom: 5, color: "#fff", fontWeight: 400 }}>📢 New feature update</li>
            <li style={{ marginBottom: 5, color: "#fff", fontWeight: 400 }}>🎉 Join the event!</li>
          </ul>
          <button
            style={{
              position: "absolute",
              bottom: isMobile ? 10 : 20,
              right: isMobile ? 13 : 28,
              padding: isMobile ? "7px 14px" : "11px 24px",
              background: "#1976ed",
              color: "#fff",
              borderRadius: 7,
              border: "none",
              fontWeight: 700,
              fontSize: isMobile ? 13 : 16,
              cursor: "pointer",
              letterSpacing: ".02em",
              boxShadow: "0 2px 12px #1976ed33",
            }}
            onClick={() => (window.location.href = "/board")}
          >
            More →
          </button>
        </div>
      </div>

      {/* 검색/정렬 */}
      <div
        style={{
          width: "100vw",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: isMobile ? 10 : 20,
          margin: isMobile ? "10px 0 8px" : "17px 0 13px",
          padding: isMobile ? "0 8px" : "0 12px",
          flexDirection: isMobile ? "column" : "row",
          zIndex: 5,
        }}
      >
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          justifyContent: "center",
        }}>
          {sortButton(t("popular"), "popular")}
          {sortButton(t("latest"), "recent")}
        </div>
        <input
          type="text"
          placeholder={t("search_placeholder")}
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            background: "#fff",
            color: "#1b2236",
            border: "2px solid #fff",
            borderRadius: 8,
            padding: isMobile ? "9px 13px" : "13px 20px",
            fontSize: isMobile ? 16 : 17,
            minWidth: isMobile ? 0 : 220,
            maxWidth: 400,
            outline: "none",
            fontWeight: 700,
            boxShadow: "0 2px 12px #fff5",
            transition: "border .14s, box-shadow .14s",
            letterSpacing: ".1px",
          }}
        />
      </div>

      {/* 카드 그리드 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(auto-fit, minmax(${CARD_WIDTH}px, 1fr))`,
          gap: CARD_GAP,
          width: "100vw",
          maxWidth: "100vw",
          margin: "0 auto",
          padding: 0,
          boxSizing: "border-box",
          justifyItems: "center",
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
                  maxWidth: CARD_WIDTH,
                  minWidth: CARD_WIDTH,
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
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {first?.image ? (
                      <MediaRenderer
                        url={first.image}
                        alt="1위"
                        playable={false}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          objectPosition: "center center",
                          background: "#111"
                        }}
                      />
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
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {second?.image ? (
                      <MediaRenderer
                        url={second.image}
                        alt="2위"
                        playable={false}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          objectPosition: "center center",
                          background: "#111"
                        }}
                      />
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
                {/* 제목 영역 */}
                <div
                  style={{
                    width: "100%",
                    maxWidth: "100%",
                    minHeight: isMobile ? 32 : 38,
                    maxHeight: isMobile ? 90 : 105,
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flex: 1,
                    padding: isMobile
                      ? "4px 10px 0 10px"
                      : "6px 18px 0 18px",
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
                      display: "block",
                      textAlign: "center",
                      lineHeight: 1.18,
                      margin: 0,
                      padding: 0,
                      whiteSpace: "pre-line",
                      wordBreak: "keep-all",
                      fontFamily: NEON_FONT,
                      fontWeight: 900,
                    }}
                  >
                    {(() => {
                      const title = (cup.title || "").slice(0, 70);
                      if (title.length <= 40) return title;
                      const breakpoint = (() => {
                        const idx = title.lastIndexOf(" ", 40);
                        return idx === -1 ? 40 : idx;
                      })();
                      return title.slice(0, breakpoint) + "\n" + title.slice(breakpoint + 1);
                    })()}
                  </span>
                </div>
                {/* 버튼 */}
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
                    marginTop: 0,
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
                  >{t("start")}</button>
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
                      >{t("edit")}</button>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          if (!window.confirm(t("delete_confirm") || "Are you sure you want to delete?")) return;
                          if (onDelete) onDelete(cup.id);
                          else window.location.reload();
                        }}
                        style={smallButtonStyle}
                        onMouseOver={e => (e.currentTarget.style.background = "#1c2232")}
                        onMouseOut={e => (e.currentTarget.style.background = mainDark)}
                      >{t("delete")}</button>
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
                  >{t("stats_comment")}</button>
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
            {t("load_more")}
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
  );
}

export default Home;
