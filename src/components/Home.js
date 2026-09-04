// src/components/Home.js
import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { fetchWinnerStatsFromDB } from "../utils";
import { supabase } from "../utils/supabaseClient";
import MediaRenderer from "./MediaRenderer";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ko", label: "한국어" },
  { code: "ja", label: "日本語" },
  { code: "zh", label: "简体中文" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "vi", label: "Tiếng Việt" },
  { code: "de", label: "Deutsch" },
  { code: "ru", label: "Русский" },
  { code: "id", label: "Bahasa Indonesia" },
  { code: "pt", label: "Português" },
  { code: "hi", label: "हिन्दी" },
  { code: "tr", label: "Türkçe" },
  { code: "th", label: "ภาษาไทย" },
  { code: "ar", label: "العربية" },
  { code: "bn", label: "বাংলা" },
];

const HOME_CATEGORIES = [
  { key: "person", slug: "person", label: "People" },
  { key: "anime_manga", slug: "anime-manga", label: "Anime / Manga" },
  { key: "sports", slug: "sports", label: "Sports" },

  { key: "game", slug: "game", label: "Games" },
  { key: "music", slug: "music", label: "Music" },
  { key: "movie_drama", slug: "movie-drama", label: "Movies / TV" },

  { key: "food", slug: "food", label: "Food" },
  { key: "etc", slug: "etc", label: "Other" },
];

let playCountsPromise = null;
let playCountsCache = null;

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
   data-ad-client={ADSENSE_CLIENT}
        data-ad-slot="3294216783"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
};



function Home({
  worldcupList,
  onMakeWorldcup,
  onDelete,
  user,
  isAdmin,
  fixedWorldcups,
  showFixedWorldcups = true,
}) {
const { t, i18n } = useTranslation();
const navigate = useNavigate();

const lang = (i18n.language || "en").split("-")[0];

const getRoute = (base, cupId) =>
  `/${lang}${base}/${cupId}`;

// 홈 화면 아래쪽 언어 선택기
const changeHomeLanguage = async (newLang) => {
  try {
    // i18next 언어 변경
    await i18n.changeLanguage(newLang);

    // 선택 언어 저장
    localStorage.setItem("onepickgame_lang", newLang);

    // 현재 주소 유지하면서 언어 부분만 변경
    const parts = window.location.pathname
      .split("/")
      .filter(Boolean);

    if (
      parts.length > 0 &&
      LANGUAGES.some((item) => item.code === parts[0])
    ) {
      parts[0] = newLang;
    } else {
      parts.unshift(newLang);
    }

    const newPath = "/" + parts.join("/");

    navigate(
      newPath +
        window.location.search +
        window.location.hash,
      { replace: true }
    );
  } catch (error) {
    console.error("언어 변경 실패:", error);
  }
};

const getDisplayTitle = (cup) => {
  return (
    cup?.title_translations?.[lang] ||
    cup?.title_translations?.en ||
    cup?.title ||
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
  const [otherVisibleCount, setOtherVisibleCount] = useState(8);
  const [rowVisibleCounts, setRowVisibleCounts] = useState({});
  const [vw, setVw] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );

const [winStatsMap, setWinStatsMap] = useState({});
const [playCountMap, setPlayCountMap] = useState({});

const requestedStatsRef = useRef(new Set());

useEffect(() => {
  let mounted = true;

  async function fetchPlayCounts() {
    try {
let data;

if (playCountsCache) {
  data = playCountsCache;
} else {
  if (!playCountsPromise) {
    playCountsPromise = supabase
      .rpc("get_worldcup_play_counts")
      .then(({ data, error }) => {
        if (error) {
          throw error;
        }

        playCountsCache = data || [];
        return playCountsCache;
      })
      .finally(() => {
        playCountsPromise = null;
      });
  }

  data = await playCountsPromise;
}


      if (!mounted) return;

      const nextMap = {};

      (data || []).forEach((row) => {
        nextMap[String(row.cup_id)] =
          Number(row.play_count || 0);
      });

      setPlayCountMap(nextMap);
    } catch (error) {
      console.error(
        "참여 횟수 조회 오류:",
        error
      );
    }
  }

  fetchPlayCounts();

  return () => {
    mounted = false;
  };
}, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const isMobile = vw < 600;
const CARD_WIDTH = isMobile ? 340 : 460;
const CARD_HEIGHT = isMobile ? 330 : 365;
const CARD_GAP = isMobile ? 7 : 13;
const THUMB_HEIGHT = isMobile ? 165 : 195;

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
    return () => {
      mounted = false;
    };
  }, [fixedWorldcups]);

const filtered = Array.isArray(worldcupList)
  ? (worldcupList || [])
    .filter((cup) => {
  const keyword = search.trim().toLowerCase();

  if (!keyword) return true;

  const displayTitle =
    getDisplayTitle(cup).toLowerCase();

  const displayDescription = (
    cup.description_translations?.[lang] ||
    cup.description_translations?.en ||
    cup.description ||
    cup.desc ||
    ""
  ).toLowerCase();

  // 후보 이름 검색
  const hasMatchingCandidate =
    Array.isArray(cup.data) &&
    cup.data.some((candidate) => {
      const candidateName = (
        candidate?.name_translations?.[lang] ||
        candidate?.name_translations?.en ||
        candidate?.name ||
        candidate?.title ||
        ""
      )
        .toString()
        .toLowerCase();

      return candidateName.includes(keyword);
    });

  return (
    displayTitle.includes(keyword) ||
    displayDescription.includes(keyword) ||
    hasMatchingCandidate
  );
})
      .sort((a, b) => {
        if (sort === "recent") {
          return (b.created_at || b.id) > (a.created_at || a.id)
            ? 1
            : -1;
} else {
  const aw =
    playCountMap[String(a.id)] || 0;

  const bw =
    playCountMap[String(b.id)] || 0;

  return bw - aw;
}
      })
  : [];


  const categoryRowRefs = useRef({});
  const [categoryScrollState, setCategoryScrollState] = useState({});
const ROW_INITIAL_COUNT = 6;
const ROW_LOAD_MORE_COUNT = 6;

const getInitialRowCount = () => {
  const cardsForScreen = Math.ceil(
    vw / (CARD_WIDTH + CARD_GAP)
  );

  return Math.max(
    ROW_INITIAL_COUNT,
    cardsForScreen + 2
  );
};

const getRowVisibleCount = (rowKey) => {
  return (
    rowVisibleCounts[rowKey] ||
    getInitialRowCount()
  );
};

const loadMoreRow = (rowKey, totalCount) => {
  setRowVisibleCounts((prev) => {
    const current =
      prev[rowKey] || ROW_INITIAL_COUNT;

    if (current >= totalCount) {
      return prev;
    }

    return {
      ...prev,
      [rowKey]: Math.min(
        current + ROW_LOAD_MORE_COUNT,
        totalCount
      ),
    };
  });
};

const updateCategoryScrollState = (rowKey) => {
  const el = categoryRowRefs.current[rowKey];
  if (!el) return;

  const maxScrollLeft =
    el.scrollWidth - el.clientWidth;

  const canScrollLeft =
    el.scrollLeft > 5;

  const canScrollRight =
    el.scrollLeft < maxScrollLeft - 5;

  setCategoryScrollState((prev) => {
    const current = prev[rowKey];

    if (
      current?.canScrollLeft === canScrollLeft &&
      current?.canScrollRight === canScrollRight
    ) {
      return prev;
    }

    return {
      ...prev,
      [rowKey]: {
        canScrollLeft,
        canScrollRight,
      },
    };
  });
};

const scrollCategoryRow = (rowKey, direction) => {
  const el = categoryRowRefs.current[rowKey];
  if (!el) return;

  const amount = isMobile
    ? CARD_WIDTH + CARD_GAP
    : (CARD_WIDTH + CARD_GAP) * 2;

  el.scrollBy({
    left: direction * amount,
    behavior: "smooth",
  });
};

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

  const mainDark =  "#000";
const buttonStyle = {
  background: mainDark,
  color: "#fff",
  fontWeight: 900,
  border: "none",
  borderRadius: 8,

fontSize: isMobile ? 15 : 17,
  padding: isMobile ? "6px 8px" : "7px 11px",

  outline: "none",
  cursor: "pointer",
  letterSpacing: "0.2px",
fontFamily: "'Pretendard', sans-serif",
  margin: "0 1px",
  boxShadow: "none",
  transition: "background 0.15s",
  marginTop: 0,
  marginBottom: 0,

  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",

  whiteSpace: "nowrap",
  lineHeight: 1.05,
};

const smallButtonStyle = {
  ...buttonStyle,
  padding: isMobile ? "5px 6px" : "7px 8px",
fontSize: isMobile ? 15 : 17,
};


const cardDescStyle = {
  color: "#b9dafb",
  fontSize: isMobile ? 14 : 16,
  lineHeight: 1.35,
  textAlign: "center",

  padding: isMobile
    ? "5px 10px 0 10px"
    : "7px 16px 0 16px",

  height: isMobile ? 42 : 46,
  boxSizing: "border-box",

  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",

  overflow: "hidden",
  textOverflow: "ellipsis",

  wordBreak: "keep-all",
  overflowWrap: "break-word",
  whiteSpace: "normal",

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
  

const renderWorldcupCard = (cup) => {
  const winStats = winStatsMap[cup.id] || [];

  // 후보들의 누적 우승 횟수 합계 = 총 참여 횟수
const totalPlays =
  playCountMap[String(cup.id)] ??
  winStats.reduce(
    (sum, row) =>
      sum + (row.win_count || 0),
    0
  );

  
  const [first, second] = getTop2Winners(
    winStats,
    cup.data
  );

  const displayTitle = getDisplayTitle(cup);

  return (
    <div
      key={cup.id}
       style={{
        width: "100%",
        height: CARD_HEIGHT,
        borderRadius: 18,
        background: "#000",
        boxShadow:
          "0 8px 38px 0 #1976ed45, 0 2px 12px #1976ed44",
        border: "1.5px solid #233a74",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
        transition:
          "box-shadow 0.18s, transform 0.16s",
        marginBottom: 0,
        cursor: "pointer",
        backdropFilter:
          "blur(13px) brightness(1.04)",
        WebkitBackdropFilter:
          "blur(13px) brightness(1.04)",
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
        goto(
          getRoute(
            "/select-round",
            cup.id
          )
        );
      }}
      onMouseDown={(e) => {
        if (e.button === 1) {
          e.preventDefault();
          e.stopPropagation();

          const url = getRoute(
            "/select-round",
            cup.id
          );

          const newWindow =
            window.open(
              url,
              "_blank"
            );

          if (newWindow) {
            newWindow.opener = null;
          }
        }
      }}
    >
      {/* 배경 효과 */}
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
          filter:
            "blur(22px) brightness(1.1)",
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
                objectPosition:
                  "center center",
                background: "#111",
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                background: "#222",
              }}
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
                objectPosition:
                  "center center",
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

        {/* VS */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform:
              "translate(-50%,-55%)",
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
          height: isMobile ? 46 : 50,
          boxSizing: "border-box",
          padding: isMobile
            ? "5px 10px 2px 10px"
            : "6px 14px 2px 14px",
          background: mainDark,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          margin: 0,
        }}
        title={displayTitle}
      >
        <span
          style={{
            width: "100%",
            display: "-webkit-box",
            WebkitBoxOrient:
              "vertical",
            WebkitLineClamp: 2,
            overflow: "hidden",
            textOverflow:
              "ellipsis",
            whiteSpace: "normal",
            wordBreak: "keep-all",
            overflowWrap:
              "break-word",
            textAlign: "center",
            lineHeight: 1.14,
            fontSize:
              isMobile ? 17 : 20,
            letterSpacing: "0.1px",
            color: "#fff",
fontFamily:
  "'Pretendard', sans-serif",

fontWeight: 800,
            textShadow:
              "0 1.5px 8px #191b25cc",
            margin: 0,
            padding: 0,
          }}
        >
          {displayTitle}
        </span>
      </div>

      {/* 설명 */}
      <div style={cardDescStyle}>
        {cup.description_translations?.[
          lang
        ] ||
          cup.description_translations
            ?.en ||
          cup.description ||
          cup.desc ||
          ""}
      </div>

      {/* 참여 횟수 */}
      <div
        style={{
          width: "100%",
          textAlign: "center",
          color: "#8fc7ff",
          fontSize:
            isMobile ? 13 : 14,
          fontWeight: 700,
          padding: "2px 0 3px",
          background: mainDark,
          boxSizing: "border-box",
        }}
      >
        👥{" "}
        {t("participation_count", {
          count:
            totalPlays.toLocaleString(),
        })}
      </div>

      {/* 버튼 */}
      <div
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent:
            "space-between",
          padding: isMobile
            ? "4px 7px 7px 7px"
            : "6px 10px 8px 10px",
          minHeight:
            isMobile ? 32 : 34,
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

            goto(
              getRoute(
                "/select-round",
                cup.id
              )
            );
          }}
          style={buttonStyle}
          onMouseOver={(e) =>
            (e.currentTarget.style.background =
              "#1c2232")
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.background =
              mainDark)
          }
        >
          {t("start")}
        </button>

        {isMine(cup) ? (
          <div
            style={{
              display: "flex",
              gap: 5,
            }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();

                goto(
                  getRoute(
                    "/edit-worldcup",
                    cup.id
                  )
                );
              }}
              style={smallButtonStyle}
              onMouseOver={(e) =>
                (e.currentTarget.style.background =
                  "#1c2232")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.background =
                  mainDark)
              }
            >
              {t("edit")}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();

                if (
                  !window.confirm(
                    t(
                      "delete_confirm"
                    ) ||
                      "Are you sure you want to delete?"
                  )
                ) {
                  return;
                }

                if (onDelete) {
                  onDelete(cup.id);
                } else {
                  window.location.reload();
                }
              }}
              style={smallButtonStyle}
              onMouseOver={(e) =>
                (e.currentTarget.style.background =
                  "#1c2232")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.background =
                  mainDark)
              }
            >
              {t("delete")}
            </button>
          </div>
        ) : (
          <div
            style={{
              width:
                isMobile ? 29 : 40,
            }}
          />
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();

            goto(
              getRoute(
                "/stats",
                cup.id
              )
            );
          }}
          style={buttonStyle}
          onMouseOver={(e) =>
            (e.currentTarget.style.background =
              "#1c2232")
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.background =
              mainDark)
          }
        >
          {t("stats_comment")}
        </button>
      </div>

      <div
        style={cardBottomBarStyle}
      />
    </div>
  );
};


const renderCategorySection = ({
  rowKey,
  title,
  cups,
  slug = null,
  featured = false,
}) => {
  if (!Array.isArray(cups) || cups.length === 0) {
    return null;
  }

  return (
    <section
      key={rowKey}
      style={{
        width: "100%",
margin: isMobile
  ? "14px 0 16px"
  : "18px 0 20px",
      }}
    >
      {/* 카테고리 제목 */}
      <div
        style={{
          width: "100%",
          maxWidth: 1400,
          margin: "0 auto",
 padding: isMobile
  ? "0 14px 6px"
  : "0 24px 8px",
          boxSizing: "border-box",
display: "flex",
alignItems: "center",
justifyContent: "center",
gap: isMobile ? 8 : 11,
        }}
      >
        <h2
          style={{
            margin: 0,
color: "#ffd43b",
fontSize: isMobile ? 27 : 36,
fontWeight: 900,
            lineHeight: 1.2,
            fontFamily:
              "'Orbitron', 'Pretendard', sans-serif",
          }}
        >
          {title}
        </h2>

        {!featured && slug && (
          <button
            type="button"
            onClick={() =>
              goto(`/${lang}/category/${slug}`)
            }
            style={{
              padding: 0,
              border: "none",
              background: "transparent",
              color: "#75b9ff",
              fontSize: isMobile ? 14 : 17,
              fontWeight: 800,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color =
                "#b9ddff";
              e.currentTarget.style.textDecoration =
                "underline";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color =
                "#75b9ff";
              e.currentTarget.style.textDecoration =
                "none";
            }}
          >
            {t("view_all", {
              defaultValue: "View all",
            })}{" "}
            ›
          </button>
        )}
      </div>

{/* 가로 슬라이드 */}
<div
  style={{
    width: "100%",
    position: "relative",
  }}
>
        
{/* 왼쪽 화살표 */}
{rowKey !== "etc" && categoryScrollState[rowKey]?.canScrollLeft && (
  <button
    type="button"
    aria-label="Scroll left"
    onClick={() =>
      scrollCategoryRow(rowKey, -1)
    }
    style={{
      position: "absolute",
      left: isMobile ? 3 : 10,
      top: "50%",
      transform: "translateY(-50%)",
      zIndex: 20,

      width: isMobile ? 44 : 72,
      height: isMobile ? 130 : 240,

      border: "none",
      borderRadius: 9,

      background: "rgba(10, 17, 29, 0.88)",
      color: "#fff",

      fontSize: isMobile ? 32 : 48,
      fontWeight: 900,

      cursor: "pointer",

      display: "flex",
      alignItems: "center",
      justifyContent: "center",

      boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
    }}
  >
    ‹
  </button>
)}

{/* 카드들 */}
<div
  ref={(el) => {
    categoryRowRefs.current[rowKey] = el;

    if (el && rowKey !== "etc") {
      requestAnimationFrame(() => {
        updateCategoryScrollState(rowKey);
      });
    }
  }}
onScroll={(e) => {
  if (rowKey === "etc") {
    return;
  }

  updateCategoryScrollState(rowKey);

  const el = e.currentTarget;

  const remaining =
    el.scrollWidth -
    el.scrollLeft -
    el.clientWidth;

  if (remaining < CARD_WIDTH * 2) {
    loadMoreRow(
      rowKey,
      cups.length
    );
  }
}}
  className="home-category-scroll"
  style={{
    width: "100%",
    display: "flex",

    flexWrap: rowKey === "etc" ? "wrap" : "nowrap",

justifyContent:
  rowKey === "etc"
    ? "center"
    : Math.min(
        cups.length,
        getRowVisibleCount(rowKey)
      ) *
        (CARD_WIDTH + CARD_GAP) <
      vw
    ? "center"
    : "flex-start",
    gap: CARD_GAP,

    overflowX: rowKey === "etc" ? "hidden" : "auto",
    overflowY: "hidden",

    scrollBehavior: "smooth",
    WebkitOverflowScrolling: "touch",

    padding: isMobile
      ? "8px 42px 12px"
      : "10px 76px 16px",

    boxSizing: "border-box",
  }}
>
{(rowKey === "etc"
  ? cups.slice(0, otherVisibleCount)
  : cups.slice(
      0,
      getRowVisibleCount(rowKey)
    )
).map((cup) => (
    <React.Fragment key={`${rowKey}-${cup.id}`}>
      <div
        style={{
          flex: `0 0 ${CARD_WIDTH}px`,
          width: CARD_WIDTH,
          minWidth: CARD_WIDTH,
        }}
      >
        {renderWorldcupCard(cup)}
      </div>
    </React.Fragment>
  ))}

{rowKey === "etc" && otherVisibleCount < cups.length && (
  <div
    style={{
      width: "100%",
      display: "flex",
      justifyContent: "center",
      marginTop: isMobile ? 10 : 14,
    }}
  >
    <button
      type="button"
      onClick={() =>
        setOtherVisibleCount((prev) => prev + 8)
      }
      style={{
        border: "1px solid #2f8cff",
        borderRadius: 8,
        background: "#176fd1",
        color: "#fff",
        padding: isMobile
          ? "9px 22px"
          : "11px 30px",
        fontSize: isMobile ? 14 : 16,
        fontWeight: 900,
        cursor: "pointer",
      }}
    >
      {t("load_more")}
    </button>
  </div>
)}

</div>

     {/* 오른쪽 화살표 */}
{categoryScrollState[rowKey]?.canScrollRight && (
  <button
    type="button"
    aria-label="Scroll right"
    onClick={() =>
      scrollCategoryRow(rowKey, 1)
    }
    style={{
      position: "absolute",
      right: isMobile ? 3 : 10,
      top: "50%",
      transform: "translateY(-50%)",
      zIndex: 20,

      width: isMobile ? 44 : 72,
      height: isMobile ? 130 : 240,

      border: "none",
      borderRadius: 9,

      background: "rgba(10, 17, 29, 0.88)",
      color: "#fff",

      fontSize: isMobile ? 32 : 48,
      fontWeight: 900,

      cursor: "pointer",

      display: "flex",
      alignItems: "center",
      justifyContent: "center",

      boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
    }}
  >
    ›
  </button>
)}
      </div>
    </section>
  );
};


const featuredCups = Array.isArray(worldcupList)
  ? [...worldcupList]
     .filter((cup) => {
  if (cup.is_featured !== true) {
    return false;
  }

  const keyword = search.trim().toLowerCase();

  if (!keyword) {
    return true;
  }

  const title = getDisplayTitle(cup)
    .toString()
    .toLowerCase();

  const description = (
    cup.description_translations?.[lang] ||
    cup.description_translations?.en ||
    cup.description ||
    cup.desc ||
    ""
  )
    .toString()
    .toLowerCase();

  const hasMatchingCandidate =
    Array.isArray(cup.data) &&
    cup.data.some((candidate) => {
      const candidateName = (
        candidate?.name_translations?.[lang] ||
        candidate?.name_translations?.en ||
        candidate?.name ||
        candidate?.title ||
        ""
      )
        .toString()
        .toLowerCase();

      return candidateName.includes(keyword);
    });

  return (
    title.includes(keyword) ||
    description.includes(keyword) ||
    hasMatchingCandidate
  );
})
.sort((a, b) => {
  const aOrder = a.featured_order ?? 999999;
  const bOrder = b.featured_order ?? 999999;

  return aOrder - bOrder;
})
  : [];

const categorySections = HOME_CATEGORIES.map(
  (category) => ({
    ...category,

    cups: filtered.filter(
      (cup) =>
        (cup.category || "etc") ===
        category.key
    ),
  })
);

const visibleCategorySections = categorySections.filter(
  (section) => section.cups.length > 0
);
useEffect(() => {
  const visibleCups = [];

  featuredCups
    .slice(
      0,
      getRowVisibleCount("featured")
    )
    .forEach((cup) => {
      visibleCups.push(cup);
    });

  visibleCategorySections.forEach(
    (section) => {
      const visible =
        section.key === "etc"
          ? section.cups.slice(
              0,
              otherVisibleCount
            )
          : section.cups.slice(
              0,
              getRowVisibleCount(
                section.key
              )
            );

      visible.forEach((cup) => {
        visibleCups.push(cup);
      });
    }
  );

  const uniqueCups = [
    ...new Map(
      visibleCups.map((cup) => [
        String(cup.id),
        cup,
      ])
    ).values(),
  ];

  uniqueCups.forEach((cup) => {
    const key = String(cup.id);

    if (
      requestedStatsRef.current.has(key)
    ) {
      return;
    }

    requestedStatsRef.current.add(key);

    fetchWinnerStatsFromDB(cup.id)
      .then((statsArr) => {
        setWinStatsMap((prev) => ({
          ...prev,
          [cup.id]:
            Array.isArray(statsArr)
              ? statsArr
              : [],
        }));
      })
      .catch((error) => {
        console.error(
          "카드 상세 통계 조회 실패:",
          cup.id,
          error
        );

        requestedStatsRef.current.delete(
          key
        );
      });
  });
}, [
  rowVisibleCounts,
  otherVisibleCount,
  search,
  sort,
  playCountMap,
  worldcupList,
]);
return (
  <div
    style={{
      width: "100vw",
      minHeight: "100vh",
      background: "#000",
      position: "relative",
    }}
  >


  {/* 만들기 / 언어 / 검색 / 정렬 */}
<div
  style={{
    width: "100%",
    display: "flex",
    justifyContent: "center",
    padding: isMobile ? "0 10px" : "0 16px",
    margin: isMobile ? "10px 0 14px" : "10px 0 22px",
    boxSizing: "border-box",
    zIndex: 5,
  }}
>
  <div
    style={{
      width: "100%",
      maxWidth: isMobile ? 430 : 700,

      display: "flex",
      flexDirection: "column",

      gap: isMobile ? 8 : 10,

      padding: isMobile
        ? "11px 10px"
        : "13px 16px",

background: "rgba(10, 16, 28, 0.72)",

border:
  "1px solid rgba(255,255,255,0.08)",

borderRadius: 12,

boxShadow:
  "0 8px 24px rgba(0,0,0,0.28)",

      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",

      boxSizing: "border-box",
    }}
  >
{/* One Pick Game 소개 */}
<div
  style={{
    width: "100%",
    textAlign: "center",
    padding: isMobile ? "4px 4px 7px" : "6px 10px 9px",
    boxSizing: "border-box",
color: "#e9eef7",
fontSize: isMobile ? 14 : 15,
fontWeight: 700,
lineHeight: 1.5,
    wordBreak: "keep-all",
  }}
>
{t("home_intro_line1")}
<br />
{t("home_intro_line2")}
</div>
    {/* =========================
        1줄 : 만들기 + 언어
    ========================== */}
    <div
      style={{
        width: "100%",
display: "flex",
alignItems: "center",
justifyContent: "center",
gap: isMobile ? 8 : 11,
      }}
    >
      {/* 이상형 월드컵 만들기 */}
      <button
        type="button"
        onClick={() => {
          if (onMakeWorldcup) {
            onMakeWorldcup();
          } else {
        goto(`/${lang}/worldcup-maker`);
          }
        }}
        style={{
          flex: 1,
          height: isMobile ? 41 : 44,

          border:
            "1px solid rgba(45,145,255,0.65)",

          borderRadius: 8,

          background: "#176fd1",

          color: "#fff",

          fontSize: isMobile ? 13 : 16,
          fontWeight: 900,

fontFamily:
  "'Pretendard', sans-serif",

          cursor: "pointer",

          boxShadow:
            "0 4px 12px rgba(23,111,209,0.24)",

          letterSpacing: "0.1px",

          whiteSpace: "nowrap",

          transition:
            "transform .15s, background .15s, box-shadow .15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform =
            "translateY(-1px)";

          e.currentTarget.style.background =
            "#1d7be3";

          e.currentTarget.style.boxShadow =
            "0 6px 16px rgba(23,111,209,0.32)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "";

          e.currentTarget.style.background =
            "#176fd1";

          e.currentTarget.style.boxShadow =
            "0 4px 12px rgba(23,111,209,0.24)";
        }}
      >
        ＋{" "}
        {t("create_worldcup", {
          defaultValue:
            lang === "ko"
              ? "이상형 월드컵 만들기"
              : "Create Bracket",
        })}
      </button>

      {/* 언어 선택 */}
      <select
        value={lang}
        onChange={(e) =>
          changeHomeLanguage(e.target.value)
        }
        aria-label="Select language"
        style={{
          width: isMobile ? 100 : 120,
          flexShrink: 0,

          height: isMobile ? 41 : 44,

          background: "#171f2d",
          color: "#dfe9f8",

          border:
            "1px solid rgba(68,126,205,0.45)",

          borderRadius: 8,

          padding: isMobile
            ? "0 7px"
            : "0 10px",

          boxSizing: "border-box",

          fontSize: isMobile ? 12 : 14,
          fontWeight: 700,

          cursor: "pointer",
          outline: "none",
        }}
      >
        {LANGUAGES.map((item) => (
          <option
            key={item.code}
            value={item.code}
          >
            {item.label}
          </option>
        ))}
      </select>
    </div>

    {/* =========================
        2줄 : 인기 + 최신 + 검색
    ========================== */}
    <div
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: isMobile ? 6 : 8,
      }}
    >
      {/* 인기 */}
      <button
        type="button"
        onClick={() => setSort("popular")}
        style={{
          height: isMobile ? 38 : 40,

          padding: isMobile
            ? "0 11px"
            : "0 15px",

            width: isMobile ? 62 : 72,
display: "inline-flex",
alignItems: "center",
justifyContent: "center",

          flexShrink: 0,

border: "none",
borderBottom:
  sort === "popular"
    ? "2px solid #2f8cff"
    : "2px solid transparent",

borderRadius: 0,

background: "transparent",

color:
  sort === "popular"
    ? "#ffffff"
    : "#8290a5",

          fontSize: isMobile ? 14 : 16,
          fontWeight: 800,

          cursor: "pointer",

boxShadow: "none",

          whiteSpace: "nowrap",

          transition:
            "background .15s, border .15s",
        }}
      >
        {t("popular")}
      </button>

      {/* 최신 */}
      <button
        type="button"
        onClick={() => setSort("recent")}
        style={{
          height: isMobile ? 38 : 40,

          padding: isMobile
            ? "0 11px"
            : "0 15px",

            width: isMobile ? 62 : 72,
display: "inline-flex",
alignItems: "center",
justifyContent: "center",

          flexShrink: 0,

border: "none",
borderBottom:
  sort === "recent"
    ? "2px solid #2f8cff"
    : "2px solid transparent",

borderRadius: 0,

background: "transparent",

color:
  sort === "recent"
    ? "#ffffff"
    : "#8290a5",

          fontSize: isMobile ? 14 : 16,
          fontWeight: 800,

          cursor: "pointer",

boxShadow: "none",

          whiteSpace: "nowrap",

          transition:
            "background .15s, border .15s",
        }}
      >
        {t("latest")}
      </button>

{/* 검색 */}
<div
  style={{
    flex: 1,
    minWidth: 0,
    position: "relative",
  }}
>
  <input
    className="home-search-input"
    type="text"
    placeholder={t("search_placeholder")}
    value={search}
    onChange={(e) =>
      setSearch(e.target.value)
    }
    style={{
      width: "100%",

      height: isMobile ? 38 : 40,

      background: "rgba(255,255,255,0.07)",
      color: "#fff",

      border: "1px solid rgba(255,255,255,0.10)",
      borderRadius: 8,

      padding: isMobile
        ? "0 32px 0 11px"
        : "0 38px 0 14px",

      boxSizing: "border-box",

      fontSize: isMobile ? 13 : 16,
      fontWeight: 700,

      outline: "none",

      boxShadow:
        "0 2px 8px rgba(0,0,0,0.18)",
    }}
  />

  <style>
    {`
      .home-search-input::placeholder {
        color: #c4ccda;
        opacity: 1;
      }
    `}
  </style>
        <span
          style={{
            position: "absolute",

            right: isMobile ? 9 : 12,
            top: "50%",

            transform: "translateY(-50%)",

            color: "#6c778c",

            fontSize: isMobile ? 13 : 15,

            pointerEvents: "none",
          }}
        >
          🔍
        </span>
      </div>
    </div>
  </div>
</div>
{/* 검색 결과 없음 */}
{search.trim() && filtered.length === 0 && (
  <div
    style={{
      width: "100%",
      maxWidth: 700,
      margin: isMobile
        ? "30px auto 50px"
        : "46px auto 70px",
      padding: "0 20px",
      boxSizing: "border-box",
      textAlign: "center",
      color: "#9eb3cc",
      fontSize: isMobile ? 15 : 18,
      fontWeight: 700,
      lineHeight: 1.6,
    }}
  >
    {t("no_search_results", {
      defaultValue:
        lang === "ko"
          ? "검색 결과가 없습니다."
          : "No results found.",
    })}
  </div>
)}
{/* 추천 */}
{renderCategorySection({
  rowKey: "featured",
  title: t("category_featured", {
    defaultValue: "Featured",
  }),
  cups: featuredCups,
  featured: true,
})}



{/* 카테고리 */}
{visibleCategorySections.map((section, index) => (
  <React.Fragment key={section.key}>
    {renderCategorySection({
      rowKey: section.key,

      title: t(`category_${section.key}`, {
        defaultValue: section.label,
      }),

      cups: section.cups,
      slug: section.slug,
    })}

{(index === 1 ||
  index === 3 ||
  index === 5 ||
  index === 7) && (
  <AdsenseMid />
)}

  </React.Fragment>
))}



      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&display=swap');
          button:focus, button:active {
            outline: none !important;
            box-shadow: none !important;
          }
            .home-category-scroll {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.home-category-scroll::-webkit-scrollbar {
  display: none;
}
        `}
      </style>
    </div>
  );
}

export default Home;