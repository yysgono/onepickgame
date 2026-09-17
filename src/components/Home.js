import PageIntro from "./PageIntro";
import "../registerHeaderTranslations";
// src/components/Home.js
import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  useNavigate,
  useLocation,
} from "react-router-dom";
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
  { key: "korea", slug: "korea", label: "K-Celeb" },
  { key: "person", slug: "person", label: "People" },
  { key: "anime_manga", slug: "anime-manga", label: "Anime / Manga" },
  { key: "game", slug: "game", label: "Games" },
  { key: "sports", slug: "sports", label: "Sports" },
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
  personalView = false,
}) {
const { t, i18n } = useTranslation();
const navigate = useNavigate();
const location = useLocation();

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
const searchInputRef = useRef(null);

useEffect(() => {
  const params =
    new URLSearchParams(location.search);

  const searchParam = params.get("search");
  const sortParam = params.get("sort");
  const focusParam = params.get("focus");

  if (searchParam) {
    setSearch(searchParam);
  }

  if (sortParam === "popular" || sortParam === "latest") {
    setSort(sortParam);
  }

  if (focusParam === "search") {
    window.setTimeout(() => {
      searchInputRef.current?.focus();
      searchInputRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 80);
  }
}, [location.search]);


  const [otherVisibleCount, setOtherVisibleCount] = useState(8);
  const [rowVisibleCounts, setRowVisibleCounts] = useState({});
  const [vw, setVw] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );

  const SEARCH_COOLDOWN =
  30 * 60 * 1000;

const normalizeSearchQuery = (value) =>
  String(value || "")
    .trim()
    .replace(/^#+/, "")
    .toLowerCase()
    .slice(0, 50);

const loadPopularSearches = async () => {
  try {
    const { data, error } = await supabase.rpc(
      "get_popular_searches",
      {
        p_language: lang,
        p_limit: 4,
      }
    );

    if (error) {
      throw error;
    }

    setPopularSearches(
      Array.isArray(data) ? data : []
    );
  } catch (error) {
    console.error(
      "인기 검색어 조회 실패:",
      error
    );
  }
};

const recordSearch = async (value) => {
  const query =
    normalizeSearchQuery(value);

  if (!query) return;

  try {
    const storageKey =
      `onepick_search_${lang}_${encodeURIComponent(query)}`;

    const lastRecorded =
      Number(
        localStorage.getItem(storageKey) || 0
      );

    const now = Date.now();

    if (
      now - lastRecorded <
      SEARCH_COOLDOWN
    ) {
      return;
    }

    const { error } = await supabase.rpc(
      "record_search",
      {
        p_query: query,
        p_language: lang,
      }
    );

    if (error) {
      throw error;
    }

    localStorage.setItem(
      storageKey,
      String(now)
    );

      } catch (error) {
    console.error(
      "검색 통계 기록 실패:",
      error
    );
  }
};


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
const CARD_WIDTH = isMobile
  ? Math.min(360, window.innerWidth - 32)
  : 504;
const CARD_HEIGHT = 410;
const CARD_GAP = isMobile ? 7 : 13;
const THUMB_HEIGHT = 202;

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

const creatorFilter =
  new URLSearchParams(
    location.search
  ).get("creator");

const filtered = Array.isArray(worldcupList)
  ? (worldcupList || [])
    .filter((cup) => {

      if (creatorFilter) {
        const cupCreator =
          cup?.owner || cup?.creator;

        if (
          String(cupCreator || "") !==
          String(creatorFilter)
        ) {
          return false;
        }
      }
const keyword =
  normalizeSearchQuery(search);

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
const hasMatchingTag =
  Array.isArray(cup.tags) &&
  cup.tags.some((tag) =>
    normalizeSearchQuery(tag).includes(
      keyword
    )
  );
return (
  displayTitle.includes(keyword) ||
  displayDescription.includes(keyword) ||
  hasMatchingCandidate ||
  hasMatchingTag
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
  prev[rowKey] || getInitialRowCount();

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

  const mainDark =  "#ffffff";
const buttonStyle = {
  background: mainDark,
  color: "#202534",
  fontWeight: 900,
  border: "none",
  borderRadius: 8,

fontSize: isMobile ? 17 : 19,
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
fontSize: isMobile ? 17 : 19,
};


const cardDescStyle = {
  color: "#202534",
  fontSize: isMobile ? 16 : 18,
  lineHeight: 1.35,
  textAlign: "center",

  padding: isMobile
    ? "5px 10px 0 10px"
    : "7px 16px 0 16px",

  height: isMobile ? 54 : 60,
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
    height: 0,
    background: "#F97316",
    borderRadius: "0 0 18px 18px",
    margin: 0,
    marginTop: "auto",
    boxShadow: "0 4px 16px rgba(25,32,52,0.07)",
  };

const goto = (url) => {
  navigate(url);

  requestAnimationFrame(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant",
    });

    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  });
};
  

const renderWorldcupCard = (cup) => {
  const categoryAccent = ({korea:"#F97316",person:"#de5276",anime_manga:"#db8a20",game:"#1687e8",sports:"#24945d",music:"#9a55cd",movie_drama:"#db6544",food:"#c38b17"})[cup.category] || "#F97316";
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
      className="worldcup-card"
       style={{
        width: "100%",
        height: CARD_HEIGHT,
        borderRadius: 18,
        background: "#ffffff",
        boxShadow:
          "0 4px 16px rgba(25,32,52,0.07)",
        border: "1.5px solid #dde2ea",
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
          "0 6px 20px rgba(25,32,52,0.10)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "";

        e.currentTarget.style.boxShadow =
          "0 6px 20px rgba(25,32,52,0.10)";
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
            "none",
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
            "#f5f6fa",
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
            background: "#ffffff",
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
                background: "#ffffff",
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                background: "#ffffff",
              }}
            />
          )}
        </div>

        <div
          style={{
            width: "50%",
            height: "100%",
            background: "#ffffff",
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
                background: "#ffffff",
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                background: "#ffffff",
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
          height: isMobile ? 60 : 66,
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
          className="worldcup-card-title"
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
              isMobile ? 19 : 22,
            letterSpacing: "0.1px",
            color: "#202534",
fontFamily:
  "'Pretendard', sans-serif",

fontWeight: 800,
            textShadow:
              "none",
            margin: 0,
            padding: 0,
          }}
        >
          {displayTitle}
        </span>
      </div>

      {/* 설명 */}
      <div className="worldcup-card-description" style={cardDescStyle}><span className="card-description-text">
        {cup.description_translations?.[
          lang
        ] ||
          cup.description_translations
            ?.en ||
          cup.description ||
          cup.desc ||
          ""}
      </span></div>

      {/* 참여 횟수 */}
      <div
        style={{
          width: "100%",
          textAlign: "center",
          color: "#C2410C",
          fontSize:
            isMobile ? 15 : 16,
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
              "#ffffff")
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
                  "#ffffff")
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
                  "#ffffff")
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
              "#ffffff")
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
        className="worldcup-card-accent" style={{...cardBottomBarStyle, background: categoryAccent}}
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
      className={`home-category-section${featured ? " is-featured" : ""}`}
style={{
  width: "100%",
  margin: featured ? "2px 0 12px" : (isMobile ? "10px 0 14px" : "14px 0 18px"),
}}
    >
      {/* 카테고리 제목 */}
      <div className="home-category-heading"
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
color: "#202534",
fontSize: isMobile ? 29 : 38,
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
              color: "#C2410C",
              fontSize: isMobile ? 16 : 19,
              fontWeight: 800,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color =
                "#C2410C";
              e.currentTarget.style.textDecoration =
                "underline";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color =
                "#C2410C";
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
      left: isMobile ? 6 : 14,
      top: "50%",
      transform: "translateY(-50%)",
      zIndex: 20,

      width: isMobile ? 52 : 68,
      height: isMobile ? 96 : 140,

      border: "2px solid rgba(255,255,255,0.96)",
      borderRadius: 16,

      background:
        "linear-gradient(180deg, rgba(112,88,232,0.98) 0%, rgba(72,49,181,0.98) 100%)",
      color: "#ffffff",

      fontSize: isMobile ? 42 : 58,
      fontWeight: 900,
      lineHeight: 1,

      cursor: "pointer",

      display: "flex",
      alignItems: "center",
      justifyContent: "center",

      boxShadow:
        "0 10px 28px rgba(65,45,170,0.42), 0 0 0 4px rgba(102,80,216,0.16)",
      textShadow: "0 2px 8px rgba(0,0,0,0.35)",
      transition: "transform .16s ease, box-shadow .16s ease",
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
        border: "1px solid #dde2ea",
        borderRadius: 8,
        background: "#F97316",
        color: "#ffffff",
        padding: isMobile
          ? "9px 22px"
          : "11px 30px",
        fontSize: isMobile ? 16 : 18,
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
      right: isMobile ? 6 : 14,
      top: "50%",
      transform: "translateY(-50%)",
      zIndex: 20,

      width: isMobile ? 52 : 68,
      height: isMobile ? 96 : 140,

      border: "2px solid rgba(255,255,255,0.96)",
      borderRadius: 16,

      background:
        "linear-gradient(180deg, rgba(112,88,232,0.98) 0%, rgba(72,49,181,0.98) 100%)",
      color: "#ffffff",

      fontSize: isMobile ? 42 : 58,
      fontWeight: 900,
      lineHeight: 1,

      cursor: "pointer",

      display: "flex",
      alignItems: "center",
      justifyContent: "center",

      boxShadow:
        "0 10px 28px rgba(65,45,170,0.42), 0 0 0 4px rgba(102,80,216,0.16)",
      textShadow: "0 2px 8px rgba(0,0,0,0.35)",
      transition: "transform .16s ease, box-shadow .16s ease",
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

  const hasMatchingTag =
    Array.isArray(cup.tags) &&
    cup.tags.some((tag) =>
      normalizeSearchQuery(tag).includes(
        normalizeSearchQuery(keyword)
      )
    );

  return (
    title.includes(keyword) ||
    description.includes(keyword) ||
    hasMatchingCandidate ||
    hasMatchingTag
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
  <div className={`home-page${personalView ? " is-personal" : ""}`}
    style={{
      width: "100%",
      minHeight: "100vh",
      background: "#ffffff",
      position: "relative",
    }}
  >


  <PageIntro icon="🏆" title={t('gameModeNav.worldcup')} description={t('headerPersonal.worldcupDescription')} buttonLabel={t('create_worldcup')} onCreate={() => onMakeWorldcup ? onMakeWorldcup() : goto(`/${lang}/worldcup-maker`)} personal={personalView} accentColor="#F97316" />
  {/* 만들기 / 언어 / 검색 / 정렬 */}
<div
  style={{
    width: "100%",
    display: "flex",
    justifyContent: "center",
    padding: isMobile ? "0 10px" : "0 16px",
    margin: isMobile ? "10px 0 8px" : "10px 0 10px",
    boxSizing: "border-box",
    zIndex: 5,
  }}
>
  <div
    style={{
      width: "100%",
maxWidth: isMobile ? 430 : 1180,

      display: "flex",
      flexDirection: "column",

gap: isMobile ? 9 : 13,

padding: isMobile
  ? "13px 11px"
  : "10px 22px",

background: "transparent",

border: "none",

borderRadius: 0,

boxShadow: "none",

backdropFilter: "none",
WebkitBackdropFilter: "none",

      boxSizing: "border-box",
    }}
  >

{/* 게임 모드 선택 */}

<div
  className="home-search-panel"
  style={{
    width: "100%",
    maxWidth: isMobile ? 430 : 980,
    margin: "0 auto",

    padding: isMobile ? "15px 13px" : "20px 24px",

    background: "#ffffff",
    border: "2px solid #cfd9e8",
    borderRadius: 16,
    boxShadow: "0 8px 24px rgba(31,50,84,0.10)",
    backdropFilter: "none",
    WebkitBackdropFilter: "none",

    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    gap: isMobile ? 10 : 14,
  }}
>
    {/* =========================
        1줄 : 만들기 + 언어
    ========================== */}
    

    {/* =========================
        검색
    ========================== */}
    <div
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
      }}
    >
      <div
        style={{
          flex: 1,
          minWidth: 0,
          position: "relative",
        }}
      >
        <input
          ref={searchInputRef}
          className="home-search-input"
          type="text"
          placeholder={t("search_placeholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              recordSearch(search);
            }
          }}
          style={{
            width: "100%",
            height: isMobile ? 44 : 50,
            background: "#ffffff",
            color: "#202534",
            border: "2px solid #bccae0",
            borderRadius: 12,
            padding: isMobile
              ? "0 38px 0 12px"
              : "0 46px 0 16px",
            boxSizing: "border-box",
            fontSize: isMobile ? 16 : 20,
            fontWeight: 700,
            outline: "none",
            boxShadow: "inset 0 1px 2px rgba(31,50,84,0.05)",
          }}
        />

        <style>
          {`
            .home-search-input::placeholder {
              color: #8b98ad;
              opacity: 1;
              font-weight: 600;
            }
          `}
        </style>

        <span
          style={{
            position: "absolute",
            right: isMobile ? 9 : 12,
            top: "50%",
            transform: "translateY(-50%)",
            color: "#C2410C",
            fontSize: isMobile ? 15 : 17,
            pointerEvents: "none",
          }}
        >
          🔍
        </span>
      </div>
    </div>

</div> {/* 만들기/검색 작은 패널 닫기 */}

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
      color: "#C2410C",
      fontSize: isMobile ? 17 : 20,
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

{/* 추천 아래 필터 */}
<div
  style={{
    width: "100%",
    maxWidth: 980,
    margin: isMobile
      ? "8px auto 18px"
      : "12px auto 24px",
    padding: isMobile ? "0 12px" : "0 16px",
    boxSizing: "border-box",
  }}
>
  {/* 언어 */}
  <div
    style={{
      display: "flex",
      flexWrap: "wrap",
      gap: isMobile ? 6 : 8,
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    {LANGUAGES.map((item) => {
      const active = item.code === lang;

      return (
        <button
          key={item.code}
          type="button"
          onClick={() => changeHomeLanguage(item.code)}
          aria-pressed={active}
          style={{
            border: active
              ? "1.5px solid #F97316"
              : "1px solid #d6deea",
            background: active
              ? "#F97316"
              : "#ffffff",
            color: active
              ? "#ffffff"
              : "#3f4a5a",
            borderRadius: 8,
            padding: isMobile
              ? "5px 9px"
              : "6px 11px",
            fontSize: isMobile ? 13 : 14,
            fontWeight: active ? 800 : 700,
            cursor: "pointer",
            lineHeight: 1.2,
            boxShadow: "none",
          }}
        >
          {item.label}
        </button>
      );
    })}
  </div>

  {/* 인기 / 최신 */}
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      gap: 8,
      marginTop: 12,
    }}
  >
    <button
      type="button"
      onClick={() => setSort("popular")}
      aria-pressed={sort === "popular"}
      style={{
        border:
          sort === "popular"
            ? "1.5px solid #F97316"
            : "1px solid #dde2ea",
        background:
          sort === "popular"
            ? "#F97316"
            : "#ffffff",
        color:
          sort === "popular"
            ? "#ffffff"
            : "#C2410C",
        borderRadius: 8,
        padding: "7px 14px",
        fontWeight: 900,
        cursor: "pointer",
      }}
    >
      {t("popular")}
    </button>

    <button
      type="button"
      onClick={() => setSort("recent")}
      aria-pressed={sort === "recent"}
      style={{
        border:
          sort === "recent"
            ? "1.5px solid #F97316"
            : "1px solid #dde2ea",
        background:
          sort === "recent"
            ? "#F97316"
            : "#ffffff",
        color:
          sort === "recent"
            ? "#ffffff"
            : "#C2410C",
        borderRadius: 8,
        padding: "7px 14px",
        fontWeight: 900,
        cursor: "pointer",
      }}
    >
      {t("latest")}
    </button>
  </div>
</div>



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
