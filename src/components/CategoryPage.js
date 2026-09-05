// src/components/CategoryPage.js

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { fetchWinnerStatsFromDB } from "../utils";
import MediaRenderer from "./MediaRenderer";

const ADSENSE_CLIENT = "ca-pub-2906270915716379";

const AdsenseCategory = () => {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {}
  }, []);

  return (
    <div
      style={{
width: "100%",
flexBasis: "100%",
textAlign: "center",
        margin: "14px 0",
      }}
    >
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

const CATEGORY_MAP = {
  person: {
    key: "person",
    label: "People",
  },
  music: {
    key: "music",
    label: "Music",
  },
  korea: {
  key: "korea",
  label: "K-Celeb",
},
  game: {
    key: "game",
    label: "Games",
  },
  sports: {
    key: "sports",
    label: "Sports",
  },
  "anime-manga": {
    key: "anime_manga",
    label: "Anime / Manga",
  },
  "movie-drama": {
    key: "movie_drama",
    label: "Movies / TV",
  },
  food: {
    key: "food",
    label: "Food",
  },
  etc: {
    key: "etc",
    label: "Other",
  },
};

export default function CategoryPage({
  worldcupList = [],
  onDelete,
  user,
  isAdmin,
}) {
  const { lang = "en", categorySlug } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [sort, setSort] = useState("popular");
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(12);
  const [winStatsMap, setWinStatsMap] = useState({});
  const [vw, setVw] = useState(
    typeof window !== "undefined"
      ? window.innerWidth
      : 1200
  );

const category = CATEGORY_MAP[categorySlug];

const currentUserId = user?.id || "";
const currentUserEmail = user?.email || "";

const isMine = (cup) => {
  return (
    isAdmin ||
    cup.owner === currentUserId ||
    cup.creator === currentUserId ||
    cup.creator_id === currentUserId ||
    cup.owner === currentUserEmail ||
    cup.creator === currentUserEmail ||
    cup.creator_id === currentUserEmail
  );
};

const isMobile = vw < 600;

  // 홈 카드와 동일한 크기
  const CARD_WIDTH = isMobile ? 320 : 420;
  const CARD_HEIGHT = isMobile ? 325 : 350;
  const THUMB_HEIGHT = isMobile ? 148 : 168 * 1.05;

  const mainDark = "#000";

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onResize = () => {
      setVw(window.innerWidth);
    };

    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // 페이지 진입 시 맨 위로
  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });

    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    setVisibleCount(12);
  }, [categorySlug]);

  // 검색 / 정렬 변경 시 다시 처음 12개부터
  useEffect(() => {
    setVisibleCount(12);
  }, [search, sort]);

  // 현재 카테고리의 월드컵만 추출
  const categoryCups = useMemo(() => {
    if (!category) return [];

    return (worldcupList || []).filter(
      (cup) =>
        (cup.category || "etc") ===
        category.key
    );
  }, [worldcupList, category]);

  // 실제 우승 통계 불러오기
  useEffect(() => {
    let mounted = true;

    setWinStatsMap({});

    if (!categoryCups.length) {
      return () => {
        mounted = false;
      };
    }

    categoryCups.forEach((cup) => {
      fetchWinnerStatsFromDB(cup.id)
        .then((statsArr) => {
          if (!mounted) return;

          setWinStatsMap((prev) => ({
            ...prev,
            [cup.id]: Array.isArray(statsArr)
              ? statsArr
              : [],
          }));
        })
        .catch((error) => {
          console.error(
            "카테고리 통계 불러오기 실패:",
            cup.id,
            error
          );

          if (!mounted) return;

          setWinStatsMap((prev) => ({
            ...prev,
            [cup.id]: [],
          }));
        });
    });

    return () => {
      mounted = false;
    };
  }, [categoryCups]);

  // 실제 참여 횟수
  const getTotalPlays = (cupId) => {
    const stats = winStatsMap[cupId] || [];

    return stats.reduce(
      (sum, row) =>
        sum + (row.win_count || 0),
      0
    );
  };

  // 1위 / 2위 후보 계산
  const getTop2Winners = (winStats, cupData) => {
    if (!winStats?.length) {
      return [
        cupData?.[0] || null,
        cupData?.[1] || null,
      ];
    }

    const sorted = [...winStats]
      .map((row, i) => ({
        ...row,
        _originIdx: i,
      }))
      .sort((a, b) => {
        if (
          (b.win_count || 0) !==
          (a.win_count || 0)
        ) {
          return (
            (b.win_count || 0) -
            (a.win_count || 0)
          );
        }

        if (
          (b.match_wins || 0) !==
          (a.match_wins || 0)
        ) {
          return (
            (b.match_wins || 0) -
            (a.match_wins || 0)
          );
        }

        return a._originIdx - b._originIdx;
      });

    const first =
      cupData?.find(
        (candidate) =>
          candidate.id ===
          sorted[0]?.candidate_id
      ) ||
      cupData?.[0] ||
      null;

    const second =
      cupData?.find(
        (candidate) =>
          candidate.id ===
          sorted[1]?.candidate_id
      ) ||
      cupData?.[1] ||
      null;

    return [first, second];
  };

  const getDisplayTitle = (cup) => {
    return (
      cup?.title_translations?.[lang] ||
      cup?.title_translations?.en ||
      cup?.title ||
      ""
    );
  };

  const getDisplayDescription = (cup) => {
    return (
      cup?.description_translations?.[lang] ||
      cup?.description_translations?.en ||
      cup?.description ||
      cup?.desc ||
      ""
    );
  };

  // 인기순 / 최신순
  const cups = useMemo(() => {
    const keyword = search
      .trim()
      .toLowerCase();

    let list = [...categoryCups];

    // 검색
    if (keyword) {
      list = list.filter((cup) => {
        const title =
          getDisplayTitle(cup).toLowerCase();

        const description =
          getDisplayDescription(cup).toLowerCase();

        return (
          title.includes(keyword) ||
          description.includes(keyword)
        );
      });
    }

    // 최신순
    if (sort === "latest") {
      return list.sort((a, b) => {
        return (
          new Date(b.created_at || 0) -
          new Date(a.created_at || 0)
        );
      });
    }
        // 인기순
    return list.sort((a, b) => {
      return (
        getTotalPlays(b.id) -
        getTotalPlays(a.id)
      );
    });
  }, [
    categoryCups,
    sort,
    search,
    winStatsMap,
    lang,
  ]);

  const goto = (url) => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    navigate(url);
  };

  const buttonStyle = {
    background: mainDark,
    color: "#fff",
    fontWeight: 900,
    border: "none",
    borderRadius: 8,

fontSize: isMobile ? 15 : 17,

padding: isMobile
  ? "6px 8px"
  : "7px 11px",

    outline: "none",
    cursor: "pointer",

    letterSpacing: "0.2px",

    fontFamily:
    "'Pretendard', sans-serif",

    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",

    whiteSpace: "nowrap",
    lineHeight: 1.05,
  };
const smallButtonStyle = {
  ...buttonStyle,

  padding: isMobile
    ? "5px 6px"
    : "7px 8px",

  fontSize: isMobile
    ? 15
    : 17,
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

    background:
      "linear-gradient(90deg, #1976ed 45%, #25e5fd 100%)",

    borderRadius: "0 0 18px 18px",

    margin: 0,
    marginTop: "auto",

    boxShadow:
      "0 2px 10px #1976ed44",
  };

  if (!category) {
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",

          color: "#fff",

          fontSize: 20,
          fontWeight: 800,
        }}
      >
        Category not found.
      </div>
    );
  }

  const categoryTitle = t(
    `category_${category.key}`,
    {
      defaultValue: category.label,
    }
  );

  return (
    <div
      style={{
        width: "100vw",
        minHeight: "100vh",

        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)",

        background: "#000",

        padding: isMobile
          ? "24px 12px 70px"
          : "34px 24px 80px",

        boxSizing: "border-box",

        color: "#fff",
      }}
    >
      {/* 카테고리 제목 */}
      <h1
        style={{
          margin: "0 0 22px",

          textAlign: "center",

          color: "#ffd43b",

          fontSize: isMobile
            ? 30
            : 42,

          lineHeight: 1.2,

          fontWeight: 900,

          fontFamily:
            "'Orbitron', 'Pretendard', sans-serif",
        }}
      >
        {categoryTitle}
      </h1>

      {/* 이상형 월드컵 만들기 */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: isMobile ? 16 : 20,
        }}
      >
        <button
          type="button"
          onClick={() =>
            goto(`/${lang}/worldcup-maker`)
          }
          style={{
            height: isMobile ? 42 : 46,

            padding: isMobile
              ? "0 18px"
              : "0 24px",

            border:
              "1px solid rgba(45,145,255,0.65)",

            borderRadius: 9,

            background: "#176fd1",
            color: "#fff",

            fontSize: isMobile ? 14 : 17,
            fontWeight: 900,

            fontFamily:
             "'Pretendard', sans-serif",

            cursor: "pointer",

            boxShadow:
              "0 4px 12px rgba(23,111,209,0.24)",

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
      </div>

      {/* 인기순 / 최신순 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",

          gap: isMobile ? 8 : 10,

          marginBottom: isMobile
            ? 24
            : 32,
        }}
      >
        <button
          type="button"
          onClick={() =>
            setSort("popular")
          }
          style={{
            minWidth: isMobile ? 82 : 96,

            height: isMobile ? 40 : 44,

            padding: "0 16px",

            borderRadius: 8,

            border:
              sort === "popular"
                ? "1px solid #2f8cff"
                : "1px solid rgba(255,255,255,0.12)",

            background:
              sort === "popular"
                ? "#1677d8"
                : "#1b2434",

            color: "#fff",

            fontSize: isMobile
              ? 14
              : 16,

            fontWeight: 900,

            cursor: "pointer",

            boxShadow:
              sort === "popular"
                ? "0 3px 10px rgba(22,119,216,0.25)"
                : "none",
          }}
        >
          {t("popular", {
            defaultValue: "Popular",
          })}
        </button>

        <button
          type="button"
          onClick={() =>
            setSort("latest")
          }
          style={{
            minWidth: isMobile ? 82 : 96,

            height: isMobile ? 40 : 44,

            padding: "0 16px",

            borderRadius: 8,

            border:
              sort === "latest"
                ? "1px solid #2f8cff"
                : "1px solid rgba(255,255,255,0.12)",

            background:
              sort === "latest"
                ? "#1677d8"
                : "#1b2434",

            color: "#fff",

            fontSize: isMobile
              ? 14
              : 16,

            fontWeight: 900,

            cursor: "pointer",

            boxShadow:
              sort === "latest"
                ? "0 3px 10px rgba(22,119,216,0.25)"
                : "none",
          }}
        >
          {t("latest", {
            defaultValue: "Latest",
          })}
        </button>
      </div>

      {/* 검색 */}
      <div
        style={{
          width: "100%",
          maxWidth: 520,

          margin: isMobile
            ? "0 auto 24px"
            : "0 auto 32px",
        }}
      >
        <input
          type="search"
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          placeholder={t("search", {
            defaultValue:
              "Search brackets...",
          })}
          style={{
            width: "100%",
            height: isMobile ? 44 : 50,

            padding: "0 18px",

            boxSizing: "border-box",

            borderRadius: 10,

            border:
              "1.5px solid rgba(47,140,255,0.7)",

            background:
              "rgba(17,28,48,0.92)",

            color: "#fff",

            fontSize: isMobile ? 15 : 17,
            fontWeight: 700,

            outline: "none",

            boxShadow:
              "0 3px 14px rgba(25,118,237,0.18)",
          }}
        />
      </div>

      {/* 월드컵 목록 */}
      {cups.length === 0 ? (
        <div
          style={{
            padding: "80px 20px",

            textAlign: "center",

            color: "#aaa",

            fontSize: 17,
            fontWeight: 700,
          }}
        >
          {t("no_brackets_found", {
            defaultValue:
              "No brackets found.",
          })}
        </div>
      ) : (
        <div
          style={{
            width: "100%",
            maxWidth: "none",

            margin: "0 auto",

display: "flex",
flexWrap: "wrap",

justifyContent: "center",
alignItems: "flex-start",

columnGap: isMobile ? 0 : 18,
rowGap: isMobile ? 18 : 26,
          }}
        >
          {cups
            .slice(0, visibleCount)
            .map((cup, index) => {
              const winStats =
                winStatsMap[cup.id] || [];

              const totalPlays =
                getTotalPlays(cup.id);

              const [first, second] =
                getTop2Winners(
                  winStats,
                  cup.data
                );

              const displayTitle =
                getDisplayTitle(cup);

              const displayDescription =
                getDisplayDescription(cup);

              return (
                <React.Fragment key={cup.id}>
                  <div
                    style={{
                      width: CARD_WIDTH,
                      minWidth: CARD_WIDTH,
                      maxWidth: CARD_WIDTH,

                      height: CARD_HEIGHT,

                      borderRadius: 18,

                      background:
                        "#000",

                      boxShadow:
                        "0 8px 38px 0 #1976ed45, 0 2px 12px #1976ed44",

                      border:
                        "1.5px solid #233a74",

                      display: "flex",
                      flexDirection: "column",

                      position: "relative",

                      overflow: "hidden",

                      transition:
                        "box-shadow 0.18s, transform 0.16s",

                      cursor: "pointer",

                      backdropFilter:
                        "blur(13px) brightness(1.04)",

                      WebkitBackdropFilter:
                        "blur(13px) brightness(1.04)",

                      willChange:
                        "transform",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform =
                        "translateY(-7px) scale(1.025)";

                      e.currentTarget.style.boxShadow =
                        "0 12px 50px 0 #1976ed88, 0 2.5px 16px #4abfff77";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform =
                        "";

                      e.currentTarget.style.boxShadow =
                        "0 8px 38px 0 #1976ed45, 0 2px 12px #1976ed44";
                    }}
                    onClick={() =>
                      goto(
                        `/${lang}/select-round/${cup.id}`
                      )
                    }
                    onMouseDown={(e) => {
                      if (e.button !== 1) return;

                      e.preventDefault();
                      e.stopPropagation();

                      const url =
                        `/${lang}/select-round/${cup.id}`;

                      const newWindow =
                        window.open(
                          url,
                          "_blank"
                        );

                      if (newWindow) {
                        newWindow.opener = null;
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

                    {/* 후보 이미지 */}
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
                      {/* 1위 */}
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
                            alt={t("first_place", {
                              defaultValue:
                                "First place",
                            })}
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

                      {/* 2위 */}
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
                            alt={t("second_place", {
                              defaultValue:
                                "Second place",
                            })}
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

                          width: isMobile
                            ? 55
                            : 70,

                          height: isMobile
                            ? 55
                            : 70,

                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <img
                          src="/vs.png"
                          alt={t("vs", {
                            defaultValue: "VS",
                          })}
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

                        height: isMobile
                          ? 46
                          : 50,

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

                          fontSize: isMobile
                            ? 17
                            : 20,

                          letterSpacing:
                            "0.1px",

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
                      {displayDescription}
                    </div>

                    {/* 참여 횟수 */}
                    <div
                      style={{
                        width: "100%",

                        textAlign: "center",

                        color: "#8fc7ff",

                        fontSize: isMobile
                          ? 13
                          : 14,

                        fontWeight: 700,

                        padding:
                          "2px 0 3px",

                        background: mainDark,

                        boxSizing:
                          "border-box",
                      }}
                    >
                      👥{" "}
                      {t(
                        "participation_count",
                        {
                          count:
                            totalPlays.toLocaleString(),
                        }
                      )}
                    </div>

                    {/* 하단 버튼 */}
                 {/* 하단 버튼 */}
<div
  style={{
    width: "100%",

    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",

    padding: isMobile
      ? "4px 7px 7px 7px"
      : "6px 10px 8px 10px",

    minHeight: isMobile
      ? 32
      : 34,

    background: mainDark,

    boxSizing: "border-box",

    marginTop: "auto",

    borderTop: "none",
    borderBottom: "none",
    borderRadius: 0,

    gap: 0,
  }}
>
  {/* 시작 */}
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();

      goto(
        `/${lang}/select-round/${cup.id}`
      );
    }}
    style={buttonStyle}
    onMouseOver={(e) => {
      e.currentTarget.style.background =
        "#1c2232";
    }}
    onMouseOut={(e) => {
      e.currentTarget.style.background =
        mainDark;
    }}
  >
    {t("start", {
      defaultValue: "Start",
    })}
  </button>

  {/* 내가 만든 월드컵이면 수정 / 삭제 */}
  {isMine(cup) ? (
    <div
      style={{
        display: "flex",
        gap: 5,
      }}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();

          goto(
            `/${lang}/edit-worldcup/${cup.id}`
          );
        }}
        style={smallButtonStyle}
        onMouseOver={(e) => {
          e.currentTarget.style.background =
            "#1c2232";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background =
            mainDark;
        }}
      >
        {t("edit", {
          defaultValue: "Edit",
        })}
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();

          if (
            !window.confirm(
              t("delete_confirm") ||
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
        onMouseOver={(e) => {
          e.currentTarget.style.background =
            "#1c2232";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background =
            mainDark;
        }}
      >
        {t("delete", {
          defaultValue: "Delete",
        })}
      </button>
    </div>
  ) : (
    <div
      style={{
        width: isMobile ? 29 : 40,
      }}
    />
  )}

  {/* 통계 / 댓글 */}
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();

      goto(
        `/${lang}/stats/${cup.id}`
      );
    }}
    style={buttonStyle}
    onMouseOver={(e) => {
      e.currentTarget.style.background =
        "#1c2232";
    }}
    onMouseOut={(e) => {
      e.currentTarget.style.background =
        mainDark;
    }}
  >
    {t("stats_comment", {
      defaultValue: "Stats / Comments",
    })}
  </button>
</div>

                    {/* 파란색 하단 바 */}
                    <div
                      style={
                        cardBottomBarStyle
                      }
                    />
                  </div>

                  {/* 6번째 카드 뒤 광고 */}
                  {index === 5 &&
                    cups.length > 6 && (
                      <AdsenseCategory />
                    )}
                </React.Fragment>
              );
            })}
        </div>
      )}
            {/* 더보기 */}
      {cups.length > visibleCount && (
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "center",

            marginTop: isMobile
              ? 24
              : 34,
          }}
        >
          <button
            type="button"
            onClick={() =>
              setVisibleCount(
                (prev) => prev + 12
              )
            }
            style={{
              border:
                "1px solid #2f8cff",

              borderRadius: 9,

              background: "#176fd1",
              color: "#fff",

              padding: isMobile
                ? "10px 28px"
                : "12px 36px",

              fontSize: isMobile
                ? 14
                : 17,

              fontWeight: 900,

              fontFamily:
               "'Pretendard', sans-serif",

              cursor: "pointer",

              boxShadow:
                "0 4px 12px rgba(23,111,209,0.24)",

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
              e.currentTarget.style.transform =
                "";

              e.currentTarget.style.background =
                "#176fd1";

              e.currentTarget.style.boxShadow =
                "0 4px 12px rgba(23,111,209,0.24)";
            }}
          >
            {lang === "ko"
              ? "더보기"
              : "Load more"}
          </button>
        </div>
      )}

      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&display=swap');

          button:focus,
          button:active {
            outline: none !important;
          }
        `}
      </style>
    </div>
  );
}