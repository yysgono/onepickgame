// src/components/Home.js
import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { fetchWinnerStatsFromDB } from "../utils";
import MediaRenderer from "./MediaRenderer";
import FixedCupSection from "./FixedCupCarousel";

const PAGE_SIZE = 24;

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
  const [vw, setVw] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const [winStatsMap, setWinStatsMap] = useState({});

  useEffect(() => {
    setWinStatsMap({});
    if (Array.isArray(worldcupList) && worldcupList.length > 0) {
      worldcupList.forEach((cup) => {
        fetchWinnerStatsFromDB(cup.id).then((statsArr) => {
          setWinStatsMap((prev) => ({
            ...prev,
            [cup.id]: statsArr,
          }));
        });
      });
    }
  }, [worldcupList]);

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
  padding: isMobile ? "6px 8px" : "7px 11px",

  outline: "none",
  cursor: "pointer",
  letterSpacing: "0.2px",
  fontFamily: "'Orbitron', 'Pretendard', sans-serif",
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
  fontSize: isMobile ? 12 : 13,
};


  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + PAGE_SIZE);
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

return (
  <div
    style={{
      width: "100vw",
      minHeight: "100vh",
      background: "#000",
      position: "relative",
    }}
  >


    {showFixedWorldcups !== false && (
      <FixedCupSection worldcupList={fixedCupsWithStats || []} />
    )}
  {/* 만들기 / 언어 / 검색 / 정렬 */}
<div
  style={{
    width: "100%",
    display: "flex",
    justifyContent: "center",
    padding: isMobile ? "0 10px" : "0 16px",
    margin: isMobile ? "16px 0 14px" : "26px 0 22px",
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

      background: "rgba(14, 20, 34, 0.78)",

      border:
        "1px solid rgba(65, 125, 210, 0.22)",

      borderRadius: 14,

      boxShadow:
        "0 10px 28px rgba(0,0,0,0.35)",

      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",

      boxSizing: "border-box",
    }}
  >

    {/* =========================
        1줄 : 만들기 + 언어
    ========================== */}
    <div
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: isMobile ? 7 : 9,
      }}
    >
      {/* 이상형 월드컵 만들기 */}
      <button
        type="button"
        onClick={() => {
          if (onMakeWorldcup) {
            onMakeWorldcup();
          } else {
            goto(`/${lang}/create`);
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
            "'Orbitron', 'Pretendard', sans-serif",

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

          border:
            sort === "popular"
              ? "1px solid #2f8cff"
              : "1px solid rgba(255,255,255,0.08)",

          borderRadius: 7,

          background:
            sort === "popular"
              ? "#1677d8"
              : "#1b2434",

          color: "#fff",

          fontSize: isMobile ? 14 : 16,
          fontWeight: 800,

          cursor: "pointer",

          boxShadow:
            sort === "popular"
              ? "0 3px 10px rgba(22,119,216,0.25)"
              : "none",

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

          border:
            sort === "recent"
              ? "1px solid #2f8cff"
              : "1px solid rgba(255,255,255,0.08)",

          borderRadius: 7,

          background:
            sort === "recent"
              ? "#1677d8"
              : "#1b2434",

          color: "#fff",

          fontSize: isMobile ? 14 : 16,
          fontWeight: 800,

          cursor: "pointer",

          boxShadow:
            sort === "recent"
              ? "0 3px 10px rgba(22,119,216,0.25)"
              : "none",

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
          type="text"
          placeholder={t("search_placeholder")}
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          style={{
            width: "100%",

            height: isMobile ? 38 : 40,

            background: "#fff",
            color: "#172033",

            border: "none",
            borderRadius: 7,

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

  // 후보들의 누적 우승 횟수 합계 = 총 참여 횟수
  const totalPlays = winStats.reduce(
    (sum, row) => sum + (row.win_count || 0),
    0
  );

  const [first, second] = getTop2Winners(winStats, cup.data);
  const displayTitle = getDisplayTitle(cup);

  return (
    <React.Fragment key={cup.id}>

      {/* ⭐ 광고 (여기!!) */}
{idx === 3 && <AdsenseMid />}
{idx === 6 && <AdsenseMid />}
{idx === 11 && <AdsenseMid />}
{idx === 19 && <AdsenseMid />}
{idx === 25 && <AdsenseMid />}
{idx === 28 && <AdsenseMid />}
{idx === 34 && <AdsenseMid />}
{idx === 38 && <AdsenseMid />}
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

onMouseDown={(e) => {
  // 가운데 휠 클릭
  if (e.button === 1) {
    e.preventDefault();
    e.stopPropagation();

    const url = getRoute(
      "/select-round",
      cup.id
    );

    const newWindow = window.open(
      url,
      "_blank"
    );

    if (newWindow) {
      newWindow.opener = null;
    }
  }
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
      WebkitBoxOrient: "vertical",
      WebkitLineClamp: 2,

      overflow: "hidden",
      textOverflow: "ellipsis",

      whiteSpace: "normal",
      wordBreak: "keep-all",
      overflowWrap: "break-word",

      textAlign: "center",
      lineHeight: 1.14,

      fontSize: isMobile ? 17 : 20,
      letterSpacing: "0.1px",

      color: "#fff",

      fontFamily:
        "'Orbitron', 'Pretendard', sans-serif",

      fontWeight: 900,

      textShadow: "0 1.5px 8px #191b25cc",

      margin: 0,
      padding: 0,
    }}
  >
    {displayTitle}
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

                  {/* 참여 횟수 */}
<div
  style={{
    width: "100%",
    textAlign: "center",
    color: "#8fc7ff",
    fontSize: isMobile ? 13 : 14,
    fontWeight: 700,
    padding: "2px 0 3px",
    background: mainDark,
    boxSizing: "border-box",
  }}
>
  👥{" "}
{t("participation_count", {
  count: totalPlays.toLocaleString(),
})}
</div>

                  {/* 버튼 영역 */}
                  <div
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
padding: isMobile ? "4px 7px 7px 7px" : "6px 10px 8px 10px",
minHeight: isMobile ? 32 : 34,
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