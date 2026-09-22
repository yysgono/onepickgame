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

const WORLDCUP_CARD_META_COPY = {
  ko: { candidates: "후보", plays: "플레이", updated: "수정" },
  en: { candidates: "Candidates", plays: "Plays", updated: "Updated" },
  ja: { candidates: "候補", plays: "プレイ", updated: "更新" },
  zh: { candidates: "候选", plays: "游玩", updated: "更新" },
  es: { candidates: "Candidatos", plays: "Partidas", updated: "Actualizado" },
  fr: { candidates: "Candidats", plays: "Parties", updated: "Mis à jour" },
  vi: { candidates: "Ứng viên", plays: "Lượt chơi", updated: "Cập nhật" },
  de: { candidates: "Kandidaten", plays: "Spiele", updated: "Aktualisiert" },
  ru: { candidates: "Кандидаты", plays: "Игры", updated: "Обновлено" },
  id: { candidates: "Kandidat", plays: "Main", updated: "Diperbarui" },
  pt: { candidates: "Candidatos", plays: "Jogadas", updated: "Atualizado" },
  hi: { candidates: "उम्मीदवार", plays: "खेल", updated: "अपडेट" },
  tr: { candidates: "Aday", plays: "Oynama", updated: "Güncellendi" },
  th: { candidates: "ผู้สมัคร", plays: "เล่น", updated: "อัปเดต" },
  ar: { candidates: "المرشحون", plays: "مرات اللعب", updated: "تحديث" },
  bn: { candidates: "প্রার্থী", plays: "খেলা", updated: "আপডেট" },
};

function formatWorldcupCardDate(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}.${month}.${day}`;
}








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



 const CARD_WIDTH = isMobile
  ? Math.min(360, vw - 32)
  : 504;

  const CARD_HEIGHT = isMobile ? 418 : 452;

  const CARD_GAP = isMobile ? 7 : 13;

  const THUMB_HEIGHT = 202;







  const mainDark = "#ffffff";







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



    color: "#202534",



    fontWeight: 900,



    border: "none",



    borderRadius: 8,







fontSize: isMobile ? 17 : 19,







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



    ? 17



    : 19,



};







  const cardDescStyle = {



    color: "#202534",







    fontSize: isMobile ? 16 : 18,







    lineHeight: 1.35,



    textAlign: "center",







    padding: isMobile



      ? "5px 10px 0 10px"



      : "7px 16px 0 16px",







    height: isMobile ? 54 : 72,







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



      "#6650d8",







    borderRadius: "0 0 18px 18px",







    margin: 0,



    marginTop: "auto",







    boxShadow:



      "0 4px 16px rgba(25,32,52,0.07)",



  };







  if (!category) {



    return (



      <div



        style={{



          minHeight: "60vh",



          display: "flex",



          alignItems: "center",



          justifyContent: "center",







          color: "#202534",







          fontSize: 22,



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







        background: "#ffffff",







        padding: isMobile



          ? "24px 12px 70px"



          : "34px 24px 80px",







        boxSizing: "border-box",







        color: "#202534",



      }}



    >



      {/* 카테고리 제목 */}



      <h1



        style={{



          margin: "0 0 22px",







          textAlign: "center",







          color: "#202534",







          fontSize: isMobile



            ? 32



            : 44,







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



              "1px solid #dde2ea",







            borderRadius: 9,







            background: "#6650d8",



            color: "#ffffff",







            fontSize: isMobile ? 16 : 19,



            fontWeight: 900,







            fontFamily:



             "'Pretendard', sans-serif",







            cursor: "pointer",







            boxShadow:



              "0 4px 16px rgba(25,32,52,0.07)",







            whiteSpace: "nowrap",







            transition:



              "transform .15s, background .15s, box-shadow .15s",



          }}



          onMouseEnter={(e) => {



            e.currentTarget.style.transform =



              "translateY(-1px)";







            e.currentTarget.style.background =



              "#6650d8";







            e.currentTarget.style.boxShadow =



              "0 6px 20px rgba(25,32,52,0.10)";



          }}



          onMouseLeave={(e) => {



            e.currentTarget.style.transform = "";







            e.currentTarget.style.background =



              "#6650d8";







            e.currentTarget.style.boxShadow =



              "0 6px 20px rgba(25,32,52,0.10)";



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



                ? "1px solid #dde2ea"



                : "1px solid rgba(255,255,255,0.12)",







            background:



              sort === "popular"



                ? "#6650d8"



                : "#ffffff",







            color: (sort === "popular") ? "#ffffff" : "#202534",







            fontSize: isMobile



              ? 16



              : 18,







            fontWeight: 900,







            cursor: "pointer",







            boxShadow:



              sort === "popular"



                ? "0 4px 16px rgba(25,32,52,0.07)"



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



                ? "1px solid #dde2ea"



                : "1px solid rgba(255,255,255,0.12)",







            background:



              sort === "latest"



                ? "#6650d8"



                : "#ffffff",







            color: (sort === "latest") ? "#ffffff" : "#202534",







            fontSize: isMobile



              ? 16



              : 18,







            fontWeight: 900,







            cursor: "pointer",







            boxShadow:



              sort === "latest"



                ? "0 4px 16px rgba(25,32,52,0.07)"



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



              "1.5px solid #dde2ea",







            background:



              "#ffffff",







            color: "#202534",







            fontSize: isMobile ? 17 : 19,



            fontWeight: 700,







            outline: "none",







            boxShadow:



              "0 4px 16px rgba(25,32,52,0.07)",



          }}



        />



      </div>







      {/* 월드컵 목록 */}



      {cups.length === 0 ? (



        <div



          style={{



            padding: "80px 20px",







            textAlign: "center",







            color: "#596579",







            fontSize: 19,



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







columnGap: CARD_GAP,



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

              const cardMetaCopy =
                WORLDCUP_CARD_META_COPY[lang] ||
                WORLDCUP_CARD_META_COPY.en;

              const candidateCount =
                Array.isArray(cup?.data)
                  ? cup.data.length
                  : 0;

              const lastUpdatedDate =
                formatWorldcupCardDate(
                  cup?.updated_at ||
                  cup?.modified_at ||
                  cup?.created_at
                );



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



                        "#ffffff",







                      boxShadow:



                        "0 4px 16px rgba(25,32,52,0.07)",







                      border:



                        "1.5px solid #dde2ea",







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



                        "0 6px 20px rgba(25,32,52,0.10)";



                    }}



                    onMouseLeave={(e) => {



                      e.currentTarget.style.transform =



                        "";







                      e.currentTarget.style.boxShadow =



                        "0 6px 20px rgba(25,32,52,0.10)";



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



                          "none",







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



                          "#f5f6fa",







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



                            alt={t("first_place", {



                              defaultValue:



                                "First place",



                            })}



                            playable={false}



                            style={{



                              width: "100%",



                              height: "100%",







                              objectFit: "cover",







                              objectPosition: "center 20%",







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







                      {/* 2위 */}



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



                            alt={t("second_place", {



                              defaultValue:



                                "Second place",



                            })}



                            playable={false}



                            style={{



                              width: "100%",



                              height: "100%",







                              objectFit: "cover",







                              objectPosition: "center 20%",







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



                          ? 60



                          : 66,







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



                            ? 19



                            : 22,







                          letterSpacing:



                            "0.1px",







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



                      {displayDescription}



                    </span></div>







                    {/* 후보 수 / 플레이 수 / 최근 수정일 */}
                    <div
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexWrap: isMobile ? "wrap" : "nowrap",
                        gap: isMobile ? "3px 8px" : "0 10px",
                        color: "#596579",
                        fontSize: isMobile ? 14 : 16,
                        fontWeight: 800,
                        lineHeight: 1.3,
                        padding: isMobile
                          ? "6px 10px 6px"
                          : "8px 12px 7px",
                        background: mainDark,
                        boxSizing: "border-box",
                        whiteSpace: isMobile ? "normal" : "nowrap",
                        marginTop: isMobile ? 2 : 4,
                      }}
                    >
                      <span>
                        👤 {cardMetaCopy.candidates}{" "}
                        <strong style={{ color: "#202534" }}>
                          {candidateCount.toLocaleString()}
                        </strong>
                      </span>

                      <span aria-hidden="true" style={{ color: "#b3bdcb" }}>
                        ·
                      </span>

                      <span>
                        ▶ {cardMetaCopy.plays}{" "}
                        <strong style={{ color: "#5542b8" }}>
                          {totalPlays.toLocaleString()}
                        </strong>
                      </span>

                      <span aria-hidden="true" style={{ color: "#b3bdcb" }}>
                        ·
                      </span>

                      <span>
                        🕒 {cardMetaCopy.updated}{" "}
                        <strong style={{ color: "#202534" }}>
                          {lastUpdatedDate}
                        </strong>
                      </span>
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
      ? "9px 7px 7px 7px"
      : "12px 10px 8px 10px",

    minHeight: isMobile
      ? 38
      : 42,







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



        `/${lang}/stats/${cup.id}`



      );



    }}



    style={buttonStyle}



    onMouseOver={(e) => {



      e.currentTarget.style.background =



        "#ffffff";



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



            "#ffffff";



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



            "#ffffff";



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



        `/${lang}/select-round/${cup.id}`



      );



    }}



    style={buttonStyle}



    onMouseOver={(e) => {



      e.currentTarget.style.background =



        "#ffffff";



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



</div>







                    {/* 파란색 하단 바 */}



                    <div



                      style={



                        cardBottomBarStyle



                      }



                    />



                  </div>



                </React.Fragment>



              );



            })}



        </div>



      )}




      {cups.length > 6 && <AdsenseCategory />}

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



                "1px solid #dde2ea",







              borderRadius: 9,







              background: "#6650d8",



              color: "#ffffff",







              padding: isMobile



                ? "10px 28px"



                : "12px 36px",







              fontSize: isMobile



                ? 16



                : 19,







              fontWeight: 900,







              fontFamily:



               "'Pretendard', sans-serif",







              cursor: "pointer",







              boxShadow:



                "0 4px 16px rgba(25,32,52,0.07)",







              transition:



                "transform .15s, background .15s, box-shadow .15s",



            }}



            onMouseEnter={(e) => {



              e.currentTarget.style.transform =



                "translateY(-1px)";







              e.currentTarget.style.background =



                "#6650d8";







              e.currentTarget.style.boxShadow =



                "0 6px 20px rgba(25,32,52,0.10)";



            }}



            onMouseLeave={(e) => {



              e.currentTarget.style.transform =



                "";







              e.currentTarget.style.background =



                "#6650d8";







              e.currentTarget.style.boxShadow =



                "0 6px 20px rgba(25,32,52,0.10)";



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







          button:focus,



          button:active {



            outline: none !important;



          }



        `}



      </style>



    </div>



  );



}