import React, {



  useEffect,



  useMemo,



  useState,



} from "react";







import {

  Link,

  useLocation,

  useNavigate,

  useParams,

} from "react-router-dom";







import {



  useTranslation,



} from "react-i18next";







import PageIntro from "./PageIntro";
import ContentNav from "./ContentNav";



import Seo from "../seo/Seo";



import { getQuizSeo } from "../seo/quizSeo";







import {



  getQuizCopy,



} from "./components/quizCopy";







import MediaRenderer from "./MediaRenderer";







import {



  getQuizzes,



  getFeaturedQuizzes,



  QUIZ_LANGUAGES,



} from "../utils/supabaseQuizApi";

import { supabase } from "../utils/supabaseClient";











const CATEGORIES = [



  "all",



  "game",



  "entertainment",



  "animation",



  "food",



  "sports",



  "knowledge",



  "other",



];

const SORTS = [
  "popular",
  "latest",
];

function getAllowedParam(search, key, allowed, fallback) {
  const value = new URLSearchParams(search || "").get(key);
  return allowed.includes(value) ? value : fallback;
}

function buildFilterSlug(base, filters) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });

  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

function formatActivityDate(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 10).replace(/-/g, ".");
}











function localized(



  map,



  fallback,



  lang



) {



  if (



    map &&



    typeof map === "object"



  ) {



    return (



      map[lang] ||



      map.en ||



      fallback ||



      ""



    );



  }







  return fallback || "";



}











export default function QuizPage({ user = null }) {



  const {



    lang: routeLang,



  } = useParams();







  const {



    i18n,



  } = useTranslation();







  const navigate =



    useNavigate();



    const location = useLocation();







  const lang =



    routeLang ||



    (



      i18n.language ||



      "en"



    ).split("-")[0];



    const changeQuizLanguage = async (newLang) => {

  try {

    await i18n.changeLanguage(newLang);



    localStorage.setItem(

      "onepickgame_lang",

      newLang

    );



    const parts = location.pathname

      .split("/")

      .filter(Boolean);



    if (

      parts.length > 0 &&

      QUIZ_LANGUAGES.some(

        (item) => item.code === parts[0]

      )

    ) {

      parts[0] = newLang;

    } else {

      parts.unshift(newLang);

    }



    const newPath =

      "/" + parts.join("/");



    navigate(

      newPath +

        (location.search || "") +

        (location.hash || ""),

      {

        replace: true,

      }

    );

  } catch (error) {

    console.error(

      "퀴즈 언어 변경 실패:",

      error

    );

  }

};







  const c =



    getQuizCopy(lang);



  const seo = getQuizSeo(lang);
  const mineOnly = new URLSearchParams(location.search || "").get("mine") === "1";

  const initialCategory = getAllowedParam(
    location.search,
    "category",
    CATEGORIES,
    "all"
  );

  const initialSort = getAllowedParam(
    location.search,
    "sort",
    SORTS,
    "popular"
  );











  const [



    rows,



    setRows,



  ] = useState([]);







  const [



    search,



    setSearch,



  ] = useState("");







  const [



    debounced,



    setDebounced,



  ] = useState("");







  const [



    category,



    setCategory,



  ] = useState(initialCategory);







  const [



    sort,



    setSort,



  ] = useState(initialSort);







  const [



    contentLanguage,



    setContentLanguage,



  ] = useState(



    QUIZ_LANGUAGES.some(



      (x) =>



        x.code === lang



    )



      ? lang



      : "en"



  );







  const [



    loading,



    setLoading,



  ] = useState(true);







  const [



    recommended,



    setRecommended,



  ] = useState([]);







  const [



    visibleCount,



    setVisibleCount,



  ] = useState(10);







  const [



    error,



    setError,



  ] = useState("");







  const [



    mobile,



    setMobile,



  ] = useState(



    typeof window !==



      "undefined"



      ? window.innerWidth <



          650



      : false



  );

  const [



    viewportWidth,



    setViewportWidth,



  ] = useState(



    typeof window !==



      "undefined"



      ? window.innerWidth



      : 1440



  );











  const [



    twoColumn,



    setTwoColumn,



  ] = useState(



    typeof window !==



      "undefined"



      ? window.innerWidth >= 1100



      : true



  );

  const updateQuizFilterUrl = (nextCategory, nextSort) => {
    const params = new URLSearchParams(location.search || "");

    if (nextCategory && nextCategory !== "all") {
      params.set("category", nextCategory);
    } else {
      params.delete("category");
    }

    if (nextSort && nextSort !== "popular") {
      params.set("sort", nextSort);
    } else {
      params.delete("sort");
    }

    const query = params.toString();

    navigate(
      `${location.pathname}${query ? `?${query}` : ""}${location.hash || ""}`,
      { replace: false }
    );
  };

  const changeCategory = (nextCategory) => {
    setCategory(nextCategory);
    updateQuizFilterUrl(nextCategory, sort);
  };

  const changeSort = (nextSort) => {
    setSort(nextSort);
    updateQuizFilterUrl(category, nextSort);
  };

  useEffect(() => {
    const nextCategory = getAllowedParam(
      location.search,
      "category",
      CATEGORIES,
      "all"
    );
    const nextSort = getAllowedParam(
      location.search,
      "sort",
      SORTS,
      "popular"
    );

    if (nextCategory !== category) {
      setCategory(nextCategory);
    }

    if (nextSort !== sort) {
      setSort(nextSort);
    }
  }, [location.search]);

  const activeCategoryLabel = c[category] || c.all;
  const isFilteredQuizPage =
    category !== "all" || sort !== "popular";

  const quizSeoSlug = buildFilterSlug("quiz", {
    mine: mineOnly ? "1" : "",
    category: category !== "all" ? category : "",
    sort: sort !== "popular" ? sort : "",
  });

  const quizSeoTitle = isFilteredQuizPage
    ? lang === "ko"
      ? `${activeCategoryLabel} 퀴즈 맞히기 | 원픽게임`
      : `${activeCategoryLabel} Quizzes | OnePickGame`
    : seo.title;

  const quizSeoIndexable = !mineOnly;

  const quizSeoDescription = isFilteredQuizPage
    ? lang === "ko"
      ? `${activeCategoryLabel} 카테고리의 인기 퀴즈와 최신 퀴즈를 원픽게임에서 무료로 풀어보세요.`
      : `Play popular and latest ${activeCategoryLabel} quizzes for free on OnePickGame.`
    : seo.description;











  useEffect(() => {



    const fn = () => {



      setMobile(



        window.innerWidth <



          650



      );







      setTwoColumn(



        window.innerWidth >= 1100



      );

      setViewportWidth(



        window.innerWidth



      );



    };







    fn();







    window.addEventListener(



      "resize",



      fn



    );



    return () =>



      window.removeEventListener(



        "resize",



        fn



      );



  }, []);











  useEffect(() => {



    const timer =



      setTimeout(



        () =>



          setDebounced(



            search.trim()



          ),



        250



      );







    return () =>



      clearTimeout(timer);



  }, [search]);











  useEffect(() => {



    if (



      QUIZ_LANGUAGES.some(



        (x) =>



          x.code === lang



      )



    ) {



      setContentLanguage(



        lang



      );



    }



  }, [lang]);











  useEffect(() => {



    let alive = true;







    getFeaturedQuizzes({



      contentLanguage,

      limit: 4,



    })



      .then((data) => {



        if (alive) {



          setRecommended(



            data || []



          );



        }



      })



      .catch(() => {



        if (alive) {



          setRecommended([]);



        }



      });







    return () => {



      alive = false;



    };



  }, [contentLanguage]);











  useEffect(() => {



    let alive = true;







    setLoading(true);



    setError("");

    if (mineOnly && !user?.id) {
      setRows([]);
      setLoading(false);
      return () => {
        alive = false;
      };
    }







    getQuizzes({



      search:



        debounced,







      category,







      sort,







      contentLanguage,

      ownerId: mineOnly ? user?.id || "" : "",



    })



      .then((data) => {



        if (alive) {



          setRows(



            data || []



          );



        }



      })



      .catch((e) => {



        if (alive) {



          setError(



            e?.message ||



              String(e)



          );



        }



      })



      .finally(() => {



        if (alive) {



          setLoading(false);



        }



      });







    return () => {



      alive = false;



    };



  }, [



    debounced,



    category,



    sort,



    contentLanguage,

    mineOnly,

    user?.id,



  ]);











  useEffect(() => {



    setVisibleCount(10);



  }, [



    debounced,



    category,



    sort,



    contentLanguage,



  ]);











  const cards =



    useMemo(



      () =>



        rows.map((q) => ({



          ...q,







          displayTitle:



            localized(



              q.title_translations,



              q.title,



              lang



            ),







          displayDescription:



            localized(



              q.description_translations,



              q.description,



              lang



            ),



        })),



      [



        rows,



        lang,



      ]



    );











  /*



   * 한국어에서는 기존



   * "추천 퀴즈 맞히기"



   * 대신 "추천 퀴즈"로 표시



   *



   * 다른 언어는 기존 번역 유지



   */



  const quizActivityCopy =
    lang === "ko"
      ? {
          recentCreated: "최근 등록된 퀴즈",
          recentPlayed: "최근 플레이된 퀴즈",
          empty: "표시할 퀴즈가 없습니다.",
        }
      : {
          recentCreated: "Recently Added Quizzes",
          recentPlayed: "Recently Played Quizzes",
          empty: "No quizzes to show.",
        };

  const recentCreatedQuizItems = useMemo(
    () =>
      [...cards]
        .sort(
          (a, b) =>
            new Date(b?.created_at || 0).getTime() -
            new Date(a?.created_at || 0).getTime()
        )
        .slice(0, 6),
    [cards]
  );

  const [recentPlayedQuizItems, setRecentPlayedQuizItems] = useState([]);

  useEffect(() => {
    let alive = true;

    async function loadRecentPlayedQuizzes() {
      if (mineOnly) {
        setRecentPlayedQuizItems([]);
        return;
      }

      const { data: attempts, error: attemptError } = await supabase
        .from("quiz_attempts")
        .select("quiz_id, created_at")
        .order("created_at", { ascending: false })
        .limit(200);

      if (attemptError) {
        console.warn("Failed to load recent quiz plays", attemptError);
        if (alive) setRecentPlayedQuizItems([]);
        return;
      }

      const seen = new Set();
      const recentIds = [];
      const playedAtById = new Map();

      (attempts || []).forEach((attempt) => {
        const quizId = String(attempt?.quiz_id || "");
        if (!quizId || seen.has(quizId)) return;
        seen.add(quizId);
        recentIds.push(quizId);
        playedAtById.set(quizId, attempt?.created_at);
      });

      if (!recentIds.length) {
        if (alive) setRecentPlayedQuizItems([]);
        return;
      }

      const { data: quizzes, error: quizError } = await supabase
        .from("quizzes")
        .select(
          "id,user_id,guest_nickname,title,title_translations,description,description_translations,original_language,content_languages,category,thumbnail_url,question_count,play_count,like_count,comment_count,answer_reveal_mode,is_featured,featured_order,created_at,is_published"
        )
        .in("id", recentIds)
        .eq("is_published", true);

      if (quizError) {
        console.warn("Failed to load recent played quizzes", quizError);
        if (alive) setRecentPlayedQuizItems([]);
        return;
      }

      const quizById = new Map(
        (quizzes || []).map((quiz) => [String(quiz.id), quiz])
      );

      const ordered = recentIds
        .map((quizId) => {
          const quiz = quizById.get(quizId);
          if (!quiz) return null;

          return {
            ...quiz,
            lastPlayedAt: playedAtById.get(quizId),
            displayTitle: localized(
              quiz.title_translations,
              quiz.title,
              lang
            ),
            displayDescription: localized(
              quiz.description_translations,
              quiz.description,
              lang
            ),
          };
        })
        .filter(Boolean)
        .slice(0, 6);

      if (alive) setRecentPlayedQuizItems(ordered);
    }

    loadRecentPlayedQuizzes();

    return () => {
      alive = false;
    };
  }, [lang, mineOnly]);

  const showQuizActivityPanels =
    !mineOnly &&
    !mobile &&
    !search.trim();

  const useSideQuizActivityPanels =
    showQuizActivityPanels &&
    twoColumn &&
    viewportWidth >= 1680;

  const renderQuizActivityPanel = ({
    title,
    items,
    accentColor = "#E53935",
    metric = "date",
  }) => (
    <aside
      style={{
        minWidth: 0,
        background: "#ffffff",
        border: "1px solid #fecaca",
        borderRadius: 10,
        padding: "17px 17px 15px",
        boxSizing: "border-box",
        minHeight: 292,
        boxShadow: "0 12px 28px rgba(239,68,68,0.12)",
      }}
    >
      <h2
        style={{
          margin: "0 0 11px",
          color: accentColor,
          fontSize: 20,
          lineHeight: 1.25,
          fontWeight: 950,
          textAlign: "left",
          borderLeft: `4px solid ${accentColor}`,
          paddingLeft: 8,
        }}
      >
        {title}
      </h2>
      {items.length ? (
        <ul
          style={{
            listStyle: "none",
            margin: 0,
            padding: 0,
            display: "flex",
            flexDirection: "column",
            gap: 9,
          }}
        >
          {items.map((item) => (
            <li key={`${title}-${item.id}`}>
              <button
                type="button"
                onClick={() => navigate(`/${lang}/quiz/${item.id}`)}
                title={item.displayTitle || ""}
                style={{
                  width: "100%",
                  border: "1px solid #fee2e2",
                  borderRadius: 8,
                  background: "#fffafa",
                  color: "#202534",
                  padding: "11px 11px",
                  cursor: "pointer",
                  textAlign: "left",
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: 10,
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    minWidth: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontSize: 15,
                    fontWeight: 900,
                  }}
                >
                  {item.displayTitle}
                </span>
                <span
                  style={{
                    color: accentColor,
                    fontSize: 13,
                    fontWeight: 850,
                    whiteSpace: "nowrap",
                  }}
                >
                  {metric === "playedAt"
                    ? formatActivityDate(item.lastPlayedAt || item.created_at)
                    : formatActivityDate(item.created_at)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ margin: 0, color: "#64748b", fontSize: 13, fontWeight: 750 }}>
          {quizActivityCopy.empty}
        </p>
      )}
    </aside>
  );

  const featuredTitle =



    lang === "ko"



      ? "추천 퀴즈"



      : c.featured;











  return (



    <div



      style={{



        minHeight:



          "100vh",







        background:



          "transparent",







        color:



          "#202534",



      }}



    >



      <Seo



        lang={lang}



        slug={quizSeoSlug}



        title={quizSeoTitle}



        description={quizSeoDescription}



        image={seo.image}



        hreflangLangs={seo.languages}

        indexable={quizSeoIndexable}



      />

      {mineOnly && (
        <ContentNav active="quiz" user={user} />
      )}



      <div



        className="tier-page-container"



        style={{



          width:



            "100%",







          maxWidth:



            mobile



              ? 430



              : 1780,







          margin:



            "0 auto",







          padding:



            mobile



              ? "20px 10px"



              : "22px 22px",







          boxSizing:



            "border-box",

          position:



            "relative",



        }}



      >
{useSideQuizActivityPanels && (
  <>
    <div
      style={{
        position: "absolute",
        left: "max(24px, calc((100% - 1120px) / 2 - 364px))",
        top: 34,
        width: 340,
        zIndex: 1,
      }}
    >
      {renderQuizActivityPanel({
        title: quizActivityCopy.recentCreated,
        items: recentCreatedQuizItems,
        accentColor: "#E53935",
        metric: "date",
      })}
    </div>
    <div
      style={{
        position: "absolute",
        right: "max(24px, calc((100% - 1120px) / 2 - 364px))",
        top: 34,
        width: 340,
        zIndex: 1,
      }}
    >
      {renderQuizActivityPanel({
        title: quizActivityCopy.recentPlayed,
        items: recentPlayedQuizItems,
        accentColor: "#7C3AED",
        metric: "playedAt",
      })}
    </div>
  </>
)}



        {/* =========================



            상단 소개



        ========================== */}



        <PageIntro createTo={`/${lang}/quiz/create`}



          icon="❓"







          title={



            seo.heading



          }







          description={



            seo.description



          }







          buttonLabel={



            c.create



          }







          onCreate={() =>



            navigate(



              `/${lang}/quiz/create`



            )



          }







          accentColor="#E53935"



        />











     {/* 언어 선택 */}







          <div



            style={{



              display:



                "flex",







              gap:



                mobile



                  ? 6



                  : 8,







              flexWrap:



                "wrap",







              justifyContent:



                "center",







              marginTop:



                0,



            }}



          >



            {QUIZ_LANGUAGES.map(



              (item) => (



                <React.Fragment



                  key={



                    item.code



                  }



                >



                  {item.code ===



                    "id" && (



                    <span



                      aria-hidden="true"



                      style={{



                        flexBasis:



                          "100%",







                        height:



                          0,



                      }}



                    />



                  )}







                  <button



                    type="button"







           onClick={() =>

  changeQuizLanguage(

    item.code

  )

}







         aria-pressed={

  lang === item.code

}







          style={languageButton(

  lang === item.code,

  mobile

)}



                  >



                    {



                      item.label



                    }



                  </button>



                </React.Fragment>



              )



            )}



          </div>











        {/* =========================



            검색



        ========================== */}







<div

  style={{

    width: "100%",

    maxWidth: 760,

    margin: mobile ? "8px auto 10px" : "8px auto 12px",

    padding: mobile ? "0 12px" : 0,

    boxSizing: "border-box",

  }}

>

  <div

    style={{

      width: "100%",

      position: "relative",

    }}

  >

    <input

      value={search}

      onChange={(e) =>

        setSearch(e.target.value)

      }

      placeholder={c.search}

      style={{

        width: "100%",

	        height: mobile ? 50 : 52,

        boxSizing: "border-box",

        padding: "0 44px 0 13px",

        borderRadius: 14,

        border: "1.5px solid #ef4444",

        background: "#ffffff",

        color: "#202534",

        outline: "none",

        fontWeight: 800,

	        fontSize: mobile ? 17 : 19,

        boxShadow: "0 12px 30px rgba(239,68,68,0.14)",

      }}

    />



    <span

      aria-hidden="true"

      style={{

        position: "absolute",

        right: 12,

        top: "50%",

        transform: "translateY(-50%)",

        color: "#E53935",

        fontSize: 18,

        pointerEvents: "none",

      }}

    >

      🔍

    </span>

  </div>

</div>

{showQuizActivityPanels && !useSideQuizActivityPanels && (
  <div
    style={{
      width: "100%",
      maxWidth: 760,
      margin: "14px auto 16px",
      display: "grid",
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      gap: 14,
    }}
  >
    {renderQuizActivityPanel({
      title: quizActivityCopy.recentCreated,
      items: recentCreatedQuizItems,
      accentColor: "#E53935",
      metric: "date",
    })}
    {renderQuizActivityPanel({
      title: quizActivityCopy.recentPlayed,
      items: recentPlayedQuizItems,
      accentColor: "#7C3AED",
      metric: "playedAt",
    })}
  </div>
)}







        {/* =========================



            추천 퀴즈



        ========================== */}







        {!mineOnly && recommended.length >



          0 && (



          <section



            style={{



              width:



                "100%",







              maxWidth:



                1420,







              margin:



                mobile ? "0 auto 12px" : "0 auto 10px",







              boxSizing:



                "border-box",



            }}



          >



            <h2



              style={{



                margin:



                  "0 0 14px",







                fontSize:



                  mobile



                    ? 21



                    : 27,







                textAlign:



                  "center",







                fontWeight:



                  900,







                color:



                  "#202534",







                letterSpacing:



                  "-0.4px",



              }}



            >



              {



                featuredTitle



              }



            </h2>











            <div



              style={{



                display:



                  "grid",







                gridTemplateColumns:



                  mobile



                    ? "1fr"



                    : "repeat(4, minmax(260px, 1fr))",







                justifyContent:



                  "center",







                alignItems:



                  "stretch",







                gap:



                  mobile



                    ? 12



                    : 18,







                width:



                  "100%",



              }}



            >



              {recommended



                .slice(



                  0,



                  4



                )



                .map(



                  (q) => (



                    <Link



                      key={



                        q.id



                      }







                      to={`/${lang}/quiz/${q.id}`}







                      style={{



                        textDecoration: "none",



                        width:



                          "100%",







                        minWidth:



                          0,







                        padding:



                          0,







                        border:



                          "1px solid #fecaca",







                        borderBottom:



                          "4px solid #E53935",







                        borderRadius:



                          14,







                        overflow:



                          "hidden",







                        background:



                          "#ffffff",







                        textAlign:



                          "left",







                        cursor:



                          "pointer",







                        color:



                          "#202534",







                        boxSizing:



                          "border-box",







                        display:



                          "flex",







                        flexDirection:



                          "column",







                        height:



                          "100%",

                        boxShadow:
                          "0 16px 34px rgba(15,23,42,0.11)",

                        transition:
                          "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",



                      }}



                    >



                      {/* 이미지 */}







                      <div



                        style={{



                          width:



                            "100%",







                          aspectRatio:



                            "16/10",







                          background:



                            "linear-gradient(135deg, #fef2f2 0%, #eef6ff 100%)",







                          overflow:



                            "hidden",







                          flexShrink:



                            0,



                        }}



                      >



                        {q.thumbnail_url ? (



                          <MediaRenderer



                            url={



                              q.thumbnail_url



                            }







                            alt={localized(q.title_translations, q.title, lang) || q.title || "Quiz"}







                            playable={



                              false



                            }







                            style={{



                              display:



                                "block",







                              width:



                                "100%",







                              height:



                                "100%",







                              objectFit:



                                "cover",

                              objectPosition:
                                "center 20%",



                            }}



                          />



                        ) : (



                          <div



                            style={{



                              display:



                                "grid",







                              placeItems:



                                "center",







                              height:



                                "100%",







                              fontSize:



                                42,







                              color:



                                "#8994a6",



                            }}



                          >



                            ?



                          </div>



                        )}



                      </div>











                      {/* 카드 정보 */}







                      <div



                        style={{



                          padding:



                            mobile



                              ? 14



	                              : "16px 17px 17px",







                          width:



                            "100%",







                          boxSizing:



                            "border-box",







                          display:



                            "flex",







                          flexDirection:



                            "column",







                          flex:



                            1,



                        }}



                      >



                        <div



                          style={{



                            fontSize:



                              mobile



                                ? 20



	                                : 20,







                            fontWeight:



                              950,







                            lineHeight:



                              1.35,







                            minHeight:



                              mobile



                                ? 54



	                                : 52,







                            overflow:



                              "hidden",







                            display:



                              "-webkit-box",







                            WebkitBoxOrient:



                              "vertical",







                            WebkitLineClamp:



                              2,







                            wordBreak:



                              "break-word",



                          }}



                        >



                          {localized(



                            q.title_translations,



                            q.title,



                            lang



                          )}



                        </div>











                        <div



                          style={{



                            marginTop:



                              "auto",







                            paddingTop:



                              7,







                            color:



                              "#667085",







                            fontSize:



                              mobile



                                ? 15



                                : 14,







                            fontWeight:



                              700,



                          }}



                        >



                          ▶{" "}



                          {q.play_count ||



                            0}



                          {" · "}



                          {q.question_count ||



                            0}{" "}



                          {



                            c.questions



                          }



                        </div>



                      </div>



                    </Link>



                  )



                )}



            </div>



          </section>



        )}











        {/* =========================



            필터



        ========================== */}







        <div



          style={{



            width:



              "100%",







            maxWidth:



              980,







            margin:



              "0 auto",







            boxSizing:



              "border-box",







            border:



              "none",







            borderRadius:



              0,







            padding:



              mobile



                ? 6



                : 8,







            background:



              "transparent",



          }}



        >











          {/* 카테고리 */}







          <div



            style={{



              display:



                "flex",







              gap:



                6,







              flexWrap:



                "wrap",







              justifyContent:



                "center",







              marginTop:



                4,







              paddingTop:



                4,







              borderTop:



                "none",



            }}



          >



            {CATEGORIES.map(



              (v) => (



                <button



                  key={



                    v



                  }







                  type="button"







                  onClick={() =>



                    changeCategory(



                      v



                    )



                  }







                  style={{



                    ...toggleButton(



                      category ===



                        v



                    ),







                    height:



                      "auto",







                    padding:



                      "6px 11px",



                  }}



                >



                  {



                    c[v]



                  }



                </button>



              )



            )}



          </div>











          {/* 인기 / 최신 */}







          <div



            style={{



              display:



                "flex",







              justifyContent:



                "center",







              gap:



                8,







              marginTop:



                6,



            }}



          >



            {[



              "popular",



              "latest",



            ].map(



              (v) => (



                <button



                  key={



                    v



                  }







                  type="button"







                  onClick={() =>



                    changeSort(



                      v



                    )



                  }







                  style={toggleButton(



                    sort === v



                  )}



                >



                  {



                    c[v]



                  }



                </button>



              )



            )}



          </div>



        </div>











        {/* =========================



            전체 퀴즈 제목



        ========================== */}







        <h2



          style={{



            maxWidth:



              1440,







            margin:



              mobile ? "14px auto 12px" : "16px auto 14px",







            fontSize:



              mobile



                ? 22



                : 27,







            textAlign:



              "center",



          }}



        >



          {



            c.allQuizzes



          }



        </h2>











        {/* 오류 */}







        {error && (



          <div



            style={{



              textAlign:



                "center",







              color:



                "#b42346",







              padding:



                20,



            }}



          >



            {



              error



            }



          </div>



        )}











        {/* =========================



            전체 퀴즈 목록



        ========================== */}







        {loading ? (



          <div



            style={{



              textAlign:



                "center",







              padding:



                50,







              color:



                "#596579",







              fontWeight:



                800,



            }}



          >



            {



              c.loading



            }



          </div>



        ) : cards.length ===



          0 ? (



          <div



            style={{



              textAlign:



                "center",







              padding:



                50,







              color:



                "#596579",







              fontWeight:



                800,



            }}



          >



            {



              c.empty



            }



          </div>



        ) : (



          <div



            style={{



              width:



                "100%",







              maxWidth:



                1740,







              margin:



                "0 auto",







              display:



                "grid",







              gridTemplateColumns:



                twoColumn



                  ? "repeat(2, minmax(0, 1fr))"



                  : "minmax(0, 1fr)",







              gap:



                16,



            }}



          >



            {cards



              .slice(



                0,



                visibleCount



              )



              .map(



                (q) => (



                  <Link



                    key={



                      q.id



                    }







                    to={`/${lang}/quiz/${q.id}`}







                    style={{



                      textDecoration: "none",



                      width:



                        "100%",







                      boxSizing:



                        "border-box",







                      padding:



                        0,







                      border:



                        "1px solid #dde2ea",







                      borderRadius:



                        12,







                      overflow:



                        "hidden",







                      background:



                        "#fff",







                      textAlign:



                        "left",







                      cursor:



                        "pointer",







                      color:



                        "#202534",







                      display:



                        "grid",







                      gridTemplateColumns:



                        mobile



                          ? "118px minmax(0,1fr)"



                          : twoColumn



                            ? "230px minmax(0,1fr)"



                            : "360px minmax(0,1fr) 190px 160px",







                      gap:



                        0,







                      alignItems:



                        "stretch",







                      minHeight:



                        mobile



                          ? 126



                          : twoColumn



                            ? 196



                            : 240,

                      boxShadow:
                        "0 14px 32px rgba(15,23,42,0.10)",

                      transition:
                        "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",







                      height:



                        mobile



                          ? 126



                          : twoColumn



                            ? 196



                            : 240,



                    }}



                  >



                    {/* 썸네일 */}







                    <div



                      style={{



                        minHeight:



                          mobile



                            ? 126



                            : twoColumn



                              ? 196



                              : 240,







                        height:



                          mobile



                            ? 126



                            : twoColumn



                              ? 196



                              : 240,







                        maxHeight:



                          mobile



                            ? 126



                            : twoColumn



                              ? 180



                              : 220,







                        background:



                          "linear-gradient(135deg, #fef2f2 0%, #eef6ff 100%)",







                        border:



                          "1px solid #e0e6ef",







                        borderRadius:



                          0,







                        display:



                          "flex",







                        alignItems:



                          "center",







                        justifyContent:



                          "center",







                        overflow:



                          "hidden",



                      }}



                    >



                      {q.thumbnail_url ? (



                        <MediaRenderer



                          url={



                            q.thumbnail_url



                          }







                          alt={localized(q.title_translations, q.title, lang) || q.title || "Quiz"}







                          playable={



                            false



                          }







                          style={{



                            width:



                              "100%",







                            height:



                              "100%",







                            objectFit:



                              "cover",

                            objectPosition:
                              "center 20%",







                            display:



                              "block",



                          }}



                        />



                      ) : (



                        <span



                          style={{



                            fontSize:



                              54,



                          }}



                        >



                          ?



                        </span>



                      )}



                    </div>











                    {/* 제목 / 설명 */}







                    <div



                      style={{



                        minWidth:



                          0,







                        padding:



                          mobile



                            ? "14px 12px"



                            : twoColumn



                              ? "16px 16px"



                              : "24px 22px",







                        alignSelf:



                          "center",



                      }}



                    >



                      <div



                        style={{



                          fontSize:



                            mobile



                              ? 18



                              : 22,







                          fontWeight:



                            900,







                          lineHeight:



                            1.35,







                          minHeight:



                            mobile



                              ? 0



                              : 30,







                          marginTop:



                            0,



                        }}



                      >



                        {



                          q.displayTitle



                        }



                      </div>











                      <div



                        style={{



                          fontSize:



                            mobile



                              ? 14



                              : 16,







                          color:



                            "#657287",







                          lineHeight:



                            1.4,







                          minHeight:



                            mobile



                              ? 0



                              : 38,







                          marginTop:



                            5,







                          overflow:



                            "hidden",







                          display:



                            "-webkit-box",







                          WebkitBoxOrient:



                            "vertical",







                          WebkitLineClamp:



                            2,







                          textOverflow:



                            "ellipsis",



                        }}



                      >



                        {q.displayDescription ||



                          "\u00A0"}



                      </div>







                      {!mobile && twoColumn && (



                        <div



                          style={{



                            marginTop: 12,



                            display: "flex",



                            alignItems: "center",



                            justifyContent: "space-between",



                            gap: 10,



                          }}



                        >



                          <div



                            style={{



                              minWidth: 0,



                              color: "#58657a",



	                              fontSize: 14,



                              fontWeight: 800,



                              overflow: "hidden",



                              textOverflow: "ellipsis",



                              whiteSpace: "nowrap",



                            }}



                          >



                            {c[q.category] || c.other}



                            {" · "}



                            ▣ {q.question_count || 0} {c.questions}



                            {" · "}



                            ▶ {q.play_count || 0}



                          </div>







                          <div



                            style={{



                              flexShrink: 0,



                              padding: "8px 12px",



                              borderRadius: 8,



                              background: "#E53935",



                              color: "#fff",



                              fontSize: 14,



                              fontWeight: 950,



                            }}



                          >



                            {c.playNow}



                          </div>



                        </div>



                      )}



                    </div>











                    {/* PC 통계 */}







                    {!mobile && !twoColumn && (



                      <div



                        style={{



                          alignSelf:



                            "center",







                          padding:



                            "4px 20px",







                          borderLeft:



                            "1px solid #e1e6ee",







                          color:



                            "#465166",







                          fontSize:



                            16,







                          fontWeight:



                            850,







                          lineHeight:



                            1.9,



                        }}



                      >



                        <div



                          style={{



                            display:



                              "inline-flex",







                            maxWidth:



                              "100%",







                            padding:



                              "4px 10px",







                            marginBottom:



                              5,







                            borderRadius:



                              999,







                            background:



                              "#FFF1F1",







                            color:



                              "#C62828",







                            lineHeight:



                              1.3,







                            whiteSpace:



                              "nowrap",







                            overflow:



                              "hidden",







                            textOverflow:



                              "ellipsis",







                            fontSize:



                              14,



                          }}



                        >



                          {c[



                            q.category



                          ] ||



                            c.other}



                        </div>







                        <div>



                          ▣{" "}



                          {q.question_count ||



                            0}{" "}



                          {



                            c.questions



                          }



                        </div>







                        <div>



                          ▶{" "}



                          {q.play_count ||



                            0}



                        </div>







                        <div>



                          💬{" "}



                          {q.comment_count ||



                            0}



                        </div>



                      </div>



                    )}











                    {/* PC 시작 버튼 */}







                    {!mobile && !twoColumn && (



                      <div



                        style={{



                          alignSelf:



                            "center",







                          margin:



                            "0 18px",







                          minHeight:



                            62,







                          display:



                            "grid",







                          placeItems:



                            "center",







                          borderRadius:



                            10,







                          background:



                            "#E53935",







                          color:



                            "#fff",







                          fontSize:



                            19,







                          fontWeight:



                            950,







                          boxShadow:



                            "0 5px 12px rgba(229,57,53,.18)",



                        }}



                      >



                        {



                          c.playNow



                        }



                      </div>



                    )}



                  </Link>



                )



              )}



          </div>



        )}











        {/* 더보기 */}







        {!loading &&



          visibleCount <



            cards.length && (



            <div



              style={{



                display:



                  "flex",







                justifyContent:



                  "center",







                gap:



                  10,







                flexWrap:



                  "wrap",







                marginTop:



                  20,



              }}



            >



              <button



                type="button"







                onClick={() =>



                  setVisibleCount(



                    (



                      count



                    ) =>



                      count +



                      10



                  )



                }







                style={



                  primaryButton



                }



              >



                {



                  c.loadMoreQuizzes



                }



              </button>







              <button



                type="button"







                onClick={() =>



                  setVisibleCount(



                    cards.length



                  )



                }







                style={{



                  ...primaryButton,







                  background:



                    "#fff",







                  color:



                    "#C62828",



                }}



              >



                {



                  c.showAll



                }



              </button>



            </div>



          )}



      </div>



    </div>



  );



}











const primaryButton = {



  border:



    "1px solid #E53935",







  background:



    "#E53935",







  color:



    "#fff",







  borderRadius:



    8,







  padding:



    "11px 22px",







  fontWeight:



    900,







  cursor:



    "pointer",



};











function toggleButton(



  active



) {



  return {



    height:



      44,







    border:



      active



        ? "1.5px solid #E53935"



        : "1px solid #d6deea",







    background:



      active



        ? "#E53935"



        : "#fff",







    color:



      active



        ? "#fff"



        : "#3f4a5a",







    borderRadius:



      8,







    padding:



      "0 14px",







    fontWeight:



      800,







    cursor:



      "pointer",







    boxShadow:



      "none",



  };



}











function languageButton(



  active,



  mobile



) {



  return {



    border:



      active



        ? "1.5px solid #E53935"



        : "1px solid #d6deea",







    background:



      active



        ? "#E53935"



        : "#fff",







    color:



      active



        ? "#fff"



        : "#3f4a5a",







    borderRadius:



      9,







    padding:



      mobile



        ? "8px 12px"



        : "9px 15px",







    fontSize:



      mobile



        ? 15



        : 16,







    fontWeight:



      active



        ? 800



        : 700,







    cursor:



      "pointer",







    lineHeight:



      1.2,







    boxShadow:



      "none",



  };



}
