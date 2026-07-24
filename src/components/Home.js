// src/components/Home.js
import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { fetchWinnerStatsFromDB } from "../utils";
import MediaRenderer from "./MediaRenderer";
import FixedCupSection from "./FixedCupCarousel";

const PAGE_SIZE = 28;
const STATS_CACHE_TTL = 30 * 60 * 1000; // 30분
const STATS_FETCH_CONCURRENCY = 6;
const STATS_CACHE_PREFIX = "onepickgame:home-stats:";

// 애드센스 클라이언트 ID
const ADSENSE_CLIENT = "ca-pub-2906270915716379";

const AdsenseMid = () => {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {}
  }, []);

  return (
    <div style={{ width: "100%", textAlign: "center", margin: "20px 0" }}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-2906270915716379"
        data-ad-slot="3294216783"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
};

const useSlideFadeIn = (length) => {
  const refs = useRef([]);

  useEffect(() => {
    const timers = [];

    refs.current.slice(0, length).forEach((ref, i) => {
      if (!ref) return;

      ref.style.opacity = "0";
      ref.style.transform = "translateY(20px) scale(0.97)";

      const timer = window.setTimeout(() => {
        if (!ref) return;

        ref.style.transition =
          "opacity 0.5s cubic-bezier(.35,1,.4,1), " +
          "transform 0.48s cubic-bezier(.35,1,.4,1)";

        ref.style.opacity = "1";
        ref.style.transform = "translateY(0) scale(1)";
      }, 60 + 18 * i);

      timers.push(timer);
    });

    return () => {
      timers.forEach((timer) => {
        window.clearTimeout(timer);
      });
    };
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
  const navigate = useNavigate();

  const lang = (i18n.language || "en").split("-")[0];
  const getRoute = (base, cupId) => `/${lang}${base}/${cupId}`;

const getDisplayTitle = (cup) => {
  if (lang === "en") return cup.title || "";

  return (
    cup?.title_translations?.[lang] ||
    cup.title ||
    ""
  );
};

  // 최상단 이동
  useEffect(() => {
    try {
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "manual";
      }
    } catch {}
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);


  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("popular");
  const [vw, setVw] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const [winStatsMap, setWinStatsMap] = useState({});

// 메모리 캐시
const statsCacheRef = useRef(new Map());

// 동일한 월드컵에 대한 중복 요청 방지
const statsPromiseRef = useRef(new Map());

const getCachedStats = useCallback((cupId) => {
  if (!cupId) return null;

  // 먼저 메모리 캐시 확인
  if (statsCacheRef.current.has(cupId)) {
    return statsCacheRef.current.get(cupId);
  }

  if (typeof window === "undefined") {
    return null;
  }

  try {
    const cacheKey = `${STATS_CACHE_PREFIX}${String(cupId)}`;
    const raw = window.sessionStorage.getItem(cacheKey);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);

    const isFresh =
      parsed &&
      Array.isArray(parsed.stats) &&
      Number.isFinite(parsed.cachedAt) &&
      Date.now() - parsed.cachedAt < STATS_CACHE_TTL;

    if (!isFresh) {
      window.sessionStorage.removeItem(cacheKey);
      return null;
    }

    statsCacheRef.current.set(cupId, parsed.stats);

    return parsed.stats;
  } catch (error) {
    console.warn("홈 통계 캐시 읽기 실패:", error);
    return null;
  }
}, []);

const saveCachedStats = useCallback((cupId, stats) => {
  const safeStats = Array.isArray(stats) ? stats : [];

  statsCacheRef.current.set(cupId, safeStats);

  if (typeof window === "undefined") {
    return safeStats;
  }

  try {
    const cacheKey = `${STATS_CACHE_PREFIX}${String(cupId)}`;

    window.sessionStorage.setItem(
      cacheKey,
      JSON.stringify({
        cachedAt: Date.now(),
        stats: safeStats,
      })
    );
  } catch (error) {
    console.warn("홈 통계 캐시 저장 실패:", error);
  }

  return safeStats;
}, []);

const loadCupStats = useCallback(
  async (cupId) => {
    if (!cupId) {
      return [];
    }

    const cached = getCachedStats(cupId);

    if (cached) {
      return cached;
    }

    // 이미 같은 통계를 불러오는 중이면 기존 Promise 재사용
    if (statsPromiseRef.current.has(cupId)) {
      return statsPromiseRef.current.get(cupId);
    }

    const request = Promise.resolve()
      .then(() => fetchWinnerStatsFromDB(cupId))
      .then((stats) => {
        return saveCachedStats(cupId, stats);
      })
      .catch((error) => {
        console.error(`월드컵 통계 조회 실패 (${cupId}):`, error);
        return [];
      })
      .finally(() => {
        statsPromiseRef.current.delete(cupId);
      });

    statsPromiseRef.current.set(cupId, request);

    return request;
  },
  [getCachedStats, saveCachedStats]
);

useEffect(() => {
  let cancelled = false;

  const cupIds = Array.isArray(worldcupList)
    ? [
        ...new Set(
          worldcupList
            .map((cup) => cup?.id)
            .filter(Boolean)
        ),
      ]
    : [];

  if (cupIds.length === 0) {
    setWinStatsMap({});

    return () => {
      cancelled = true;
    };
  }

  // 기존 통계 및 캐시된 데이터 즉시 재사용
  setWinStatsMap((prev) => {
    const next = {};

    cupIds.forEach((cupId) => {
      const cached = getCachedStats(cupId);

      if (cached) {
        next[cupId] = cached;
      } else if (Array.isArray(prev[cupId])) {
        next[cupId] = prev[cupId];
      }
    });

    return next;
  });

  async function loadAllStats() {
    const results = {};
    let nextIndex = 0;

    async function worker() {
      while (!cancelled) {
        const currentIndex = nextIndex;
        nextIndex += 1;

        if (currentIndex >= cupIds.length) {
          return;
        }

        const cupId = cupIds[currentIndex];
        const stats = await loadCupStats(cupId);

        results[cupId] = Array.isArray(stats) ? stats : [];
      }
    }

    const workerCount = Math.min(
      STATS_FETCH_CONCURRENCY,
      cupIds.length
    );

    await Promise.all(
      Array.from(
        { length: workerCount },
        () => worker()
      )
    );

    if (cancelled) {
      return;
    }

    setWinStatsMap((prev) => ({
      ...prev,
      ...results,
    }));
  }

  loadAllStats();

  return () => {
    cancelled = true;
  };
}, [
  worldcupList,
  getCachedStats,
  loadCupStats,
]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const isMobile = vw < 600;
  const CARD_WIDTH = isMobile ? 320 : 420;
  const CARD_HEIGHT = isMobile ? 325 : 350;
  const CARD_GAP = isMobile ? 7 : 13;
  const SKELETON_COUNT = isMobile ? 3 : 6;
  const THUMB_HEIGHT = isMobile ? 148 : 168 * 1.05;

  const [fixedCupsWithStats, setFixedCupsWithStats] = useState([]);

useEffect(() => {
  let cancelled = false;

  async function fillFixedStats() {
    if (
      !Array.isArray(fixedWorldcups) ||
      fixedWorldcups.length === 0
    ) {
      if (!cancelled) {
        setFixedCupsWithStats([]);
      }

      return;
    }

    const list = await Promise.all(
      fixedWorldcups.map(async (cup) => {
        if (
          Array.isArray(cup.winStats) &&
          cup.winStats.length > 0
        ) {
          return cup;
        }

        // 홈에서 이미 조회한 통계 우선 사용
        let stats = winStatsMap[cup.id];

        // 세션 캐시 확인
        if (!Array.isArray(stats)) {
          stats = getCachedStats(cup.id);
        }

        // 캐시에도 없을 때만 실제 요청
        if (!Array.isArray(stats)) {
          stats = await loadCupStats(cup.id);
        }

        return {
          ...cup,
          winStats: Array.isArray(stats) ? stats : [],
        };
      })
    );

    if (!cancelled) {
      setFixedCupsWithStats(list);
    }
  }

  fillFixedStats();

  return () => {
    cancelled = true;
  };
}, [
  fixedWorldcups,
  winStatsMap,
  getCachedStats,
  loadCupStats,
]);

  const filtered = Array.isArray(worldcupList)
    ? (worldcupList || [])
        .filter(
          (cup) =>
getDisplayTitle(cup).toLowerCase().includes(search.toLowerCase()) ||
            ((cup.description || cup.desc || "") || "")
              .toLowerCase()
              .includes(search.toLowerCase())
        )
        .sort((a, b) => {
          if (sort === "recent") {
            return (b.created_at || b.id) > (a.created_at || a.id) ? 1 : -1;
          } else {
            const aw =
              winStatsMap[a.id]?.reduce(
                (sum, row) => sum + (row.win_count || 0),
                0
              ) || 0;
            const bw =
              winStatsMap[b.id]?.reduce(
                (sum, row) => sum + (row.win_count || 0),
                0
              ) || 0;
            return bw - aw;
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

  const mainDark = "#171C27";
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
    fontFamily: "'Orbitron', 'Pretendard', sans-serif",
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

  const cardDescStyle = {
    color: "#b9dafb",
    fontSize: isMobile ? 14 : 16,
    lineHeight: 1.33,
    textAlign: "center",
    padding: isMobile ? "4px 10px 0 10px" : "8px 18px 0 18px",
    minHeight: isMobile ? 24 : 33,
    maxHeight: isMobile ? 36 : 42,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    textOverflow: "ellipsis",
    wordBreak: "keep-all",
    margin: 0,
    marginBottom: 3,
    background: "none",
  };

  const cardBottomBarStyle = {
    width: "100%",
    height: 4,
    background: "linear-gradient(90deg, #1976ed 45%, #25e5fd 100%)",
    borderRadius: "0 0 18px 18px",
    margin: 0,
    marginTop: "auto",
    boxShadow: "0 2px 10px #1976ed44",
  };


  const goto = (url) => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    navigate(url);
  };

return (
  <div
    style={{
      width: "100vw",
      minHeight: "100vh",
      background: "#000",
      position: "relative",
    }}
  >
    <h1
      style={{
        position: "absolute",
        left: "-9999px",
        width: "1px",
        height: "1px",
        overflow: "hidden",
      }}
    >
      OnePickGame - Ultimate Tournament World Cup Platform
    </h1>

    {showFixedWorldcups !== false && (
      <FixedCupSection worldcupList={fixedCupsWithStats || []} />
    )}

      {/* 검색/정렬 바 */}
      <div
        style={{
          width: "100vw",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: isMobile ? 10 : 20,
          margin: isMobile ? "12px 0 8px" : "22px 0 14px",
          padding: isMobile ? "0 8px" : "0 12px",
          flexDirection: isMobile ? "column" : "row",
          zIndex: 5,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            justifyContent: "center",
          }}
        >
          {sortButton(t("popular"), "popular")}
          {sortButton(t("latest"), "recent")}
        </div>
        <input
          type="text"
          placeholder={t("search_placeholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
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
        {visibleList.length > 0 &&
visibleList.map((cup, idx) => {
  const winStats = winStatsMap[cup.id] || [];
  const [first, second] = getTop2Winners(winStats, cup.data);
  const displayTitle = getDisplayTitle(cup);

  return (
    <React.Fragment key={cup.id}>

      {/* ⭐ 광고 (여기!!) */}
{idx === 6 && <AdsenseMid />}
{idx === 13 && <AdsenseMid />}
{idx === 20 && <AdsenseMid />}
{idx === 27 && <AdsenseMid />}
{idx === 34 && <AdsenseMid />}
{idx === 41 && <AdsenseMid />}
{idx === 48 && <AdsenseMid />}
{idx === 55 && <AdsenseMid />}
{idx === 62 && <AdsenseMid />}
      <div
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
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform =
                      "translateY(-7px) scale(1.025)";
                    e.currentTarget.style.boxShadow =
                      "0 12px 50px 0 #1976ed88, 0 2.5px 16px #4abfff77";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "";
                    e.currentTarget.style.boxShadow =
                      "0 8px 38px 0 #1976ed45, 0 2px 12px #1976ed44";
                  }}
                  onClick={() => {
                    goto(getRoute("/select-round", cup.id));
                  }}
                >
                  <div
                    style={{
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
                    }}
                  />

                  {/* 썸네일 */}
                  <div
                    style={{
                      width: "100%",
                      height: THUMB_HEIGHT,
                      display: "flex",
                      flexDirection: "row",
                      background:
                        "linear-gradient(90deg, #162d52 0%, #284176 100%)",
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
                          alt={t("first_place")}
                          playable={false}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            objectPosition: "center center",
                            background: "#111",
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
                          alt={t("second_place")}
                          playable={false}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            objectPosition: "center center",
                            background: "#111",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            background: "#15182b",
                          }}
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
                        alt={t("vs")}
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
                      maxHeight: isMobile ? 90 : 105,
                      overflow: "hidden",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flex: 1,
                      padding: isMobile ? "4px 10px 0 10px" : "6px 18px 0 18px",
                      fontWeight: 900,
                      fontSize: isMobile ? 17 : 20,
                      color: "#fff",
                      fontFamily: "'Orbitron', 'Pretendard', sans-serif",
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
                    title={displayTitle}
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
                        fontFamily: "'Orbitron', 'Pretendard', sans-serif",
                        fontWeight: 900,
                      }}
                    >
                      {(() => {
                        const title = displayTitle.slice(0, 70);
                        if (title.length <= 40) return title;
                        const breakpoint = (() => {
                          const i = title.lastIndexOf(" ", 40);
                          return i === -1 ? 40 : i;
                        })();
                        return (
                          title.slice(0, breakpoint) +
                          "\n" +
                          title.slice(breakpoint + 1)
                        );
                      })()}
                    </span>
                  </div>

                  {/* 설명 */}
                  <div style={cardDescStyle}>
{cup.description_translations?.[lang] ||
  cup.description_translations?.en ||
  cup.description ||
  cup.desc ||
  ""}
                  </div>

                  {/* 버튼 영역 */}
                  <div
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: isMobile ? "3px 8px 6px 8px" : "6px 16px 7px 16px",
                      minHeight: isMobile ? 23 : 27,
                      background: mainDark,
                      boxSizing: "border-box",
                      marginTop: "auto",
                      borderTop: "none",
                      borderBottom: "none",
                      borderRadius: 0,
                      gap: 0,
                    }}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        goto(getRoute("/select-round", cup.id));
                      }}
                      style={buttonStyle}
                      onMouseOver={(e) =>
                        (e.currentTarget.style.background = "#1c2232")
                      }
                      onMouseOut={(e) =>
                        (e.currentTarget.style.background = mainDark)
                      }
                    >
                      {t("start")}
                    </button>

                    {isMine(cup) ? (
                      <div style={{ display: "flex", gap: 5 }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            goto(getRoute("/edit-worldcup", cup.id));
                          }}
                          style={smallButtonStyle}
                          onMouseOver={(e) =>
                            (e.currentTarget.style.background = "#1c2232")
                          }
                          onMouseOut={(e) =>
                            (e.currentTarget.style.background = mainDark)
                          }
                        >
                          {t("edit")}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (
                              !window.confirm(
                                t("delete_confirm") ||
                                  "Are you sure you want to delete?"
                              )
                            )
                              return;
                            if (onDelete) onDelete(cup.id);
                            else window.location.reload();
                          }}
                          style={smallButtonStyle}
                          onMouseOver={(e) =>
                            (e.currentTarget.style.background = "#1c2232")
                          }
                          onMouseOut={(e) =>
                            (e.currentTarget.style.background = mainDark)
                          }
                        >
                          {t("delete")}
                        </button>
                      </div>
                    ) : (
                      <div style={{ width: isMobile ? 29 : 40 }} />
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        goto(getRoute("/stats", cup.id));
                      }}
                      style={buttonStyle}
                      onMouseOver={(e) =>
                        (e.currentTarget.style.background = "#1c2232")
                      }
                      onMouseOut={(e) =>
                        (e.currentTarget.style.background = mainDark)
                      }
                    >
                      {t("stats_comment")}
                    </button>
                  </div>

                  <div style={cardBottomBarStyle}></div>
                </div>
              </React.Fragment>
            );
          })}

        {visibleList.length === 0 &&
          Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <SkeletonCard
              key={i}
              cardHeight={CARD_HEIGHT}
              thumbHeight={THUMB_HEIGHT}
            />
          ))}
      </div>

      {/* ✅✅✅ 더보기 버튼 */}
      {visibleCount < filtered.length && (
        <div style={{ textAlign: "center", margin: "18px 0 26px 0" }}>
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