import PageIntro from "./PageIntro";
import ContentNav from "./ContentNav";
import { normalizeTags } from "./TierTagTools";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";


import MediaRenderer from "./MediaRenderer";
import Seo from "../seo/Seo";
import { supabase } from "../utils/supabaseClient";
import { fetchWinnerStatsFromDB } from "../utils";

const PAGE_SIZE = 12;

const CATEGORY_VALUES = [
  "all",
  "game",
  "entertainment",
  "animation",
  "food",
  "sports",
  "other",
];

const SORT_VALUES = [
  "latest",
  "popular",
  "mostCreated",
];

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

const RECOMMENDED_PRESET_TITLE = {
  ko: "⭐ 추천 티어표 만들기",
  en: "⭐ Recommended Tier List Presets",
  ja: "⭐ おすすめTier表を作る",
  zh: "⭐ 推荐排行榜模板",
  es: "⭐ Plantillas de Tier List recomendadas",
  fr: "⭐ Modèles de Tier List recommandés",
  vi: "⭐ Mẫu Tier List đề xuất",
  de: "⭐ Empfohlene Tier-List-Vorlagen",
  ru: "⭐ Рекомендуемые шаблоны тир-листа",
  id: "⭐ Preset Tier List Rekomendasi",
  pt: "⭐ Modelos de Tier List recomendados",
  hi: "⭐ सुझाए गए Tier List प्रीसेट",
  tr: "⭐ Önerilen Tier List Şablonları",
  th: "⭐ เทมเพลต Tier List แนะนำ",
  ar: "⭐ قوالب Tier List مقترحة",
  bn: "⭐ প্রস্তাবিত Tier List প্রিসেট",
};

function readTranslationMap(value) {
  if (!value) return {};
  if (typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? parsed
        : {};
    } catch {
      return {};
    }
  }
  return {};
}

function getLocalizedWorldcupTitle(cup, lang) {
  const translations = readTranslationMap(cup?.title_translations);
  const legacyTranslations = readTranslationMap(cup?.translations?.title);

  return (
    translations?.[lang] ||
    translations?.en ||
    legacyTranslations?.[lang] ||
    legacyTranslations?.en ||
    cup?.[`title_${lang}`] ||
    cup?.title_en ||
    cup?.title ||
    ""
  );
}

function TierListPage({
  worldcupList = [],
}) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const lang = (
    i18n.language || "en"
  ).split("-")[0];

  const changeTierLanguage = async (newLang) => {
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
      LANGUAGES.some(
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
      "언어 변경 실패:",
      error
    );
  }
};

  const mineOnly = useMemo(() => {
    const params = new URLSearchParams(location.search || "");
    return params.get("mine") === "1";
  }, [location.search]);

  const sourceWorldcupFilter = useMemo(() => {
    const params = new URLSearchParams(location.search || "");
    return String(params.get("source") || "").trim();
  }, [location.search]);

  const presetNameFilter = useMemo(() => {
    const params = new URLSearchParams(location.search || "");
    return String(params.get("preset") || "").trim();
  }, [location.search]);

  const excludedTierId = useMemo(() => new URLSearchParams(location.search).get("exclude") || "", [location.search]);

  const tagFilter = useMemo(() => normalizeTags([new URLSearchParams(location.search).get("tag") || ""])[0] || "", [location.search]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setCurrentUserId(data?.user?.id || null);
      setAuthChecked(true);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;
        setCurrentUserId(session?.user?.id || null);
        setAuthChecked(true);
      }
    );

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe?.();
    };
  }, []);

  const [isMobile, setIsMobile] =
    useState(
      typeof window !== "undefined"
        ? window.innerWidth < 600
        : false
    );

  const [
    tierLists,
    setTierLists,
  ] = useState([]);

  const [
    profileMap,
    setProfileMap,
  ] = useState({});

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    loadingMore,
    setLoadingMore,
  ] = useState(false);

  const [
    loadError,
    setLoadError,
  ] = useState("");

  const [
    searchInput,
    setSearchInput,
  ] = useState("");

  const [
    searchKeyword,
    setSearchKeyword,
  ] = useState("");

  const [
    category,
    setCategory,
  ] = useState("all");

  const [
    sort,
    setSort,
  ] = useState("popular");

  const [
    page,
    setPage,
  ] = useState(0);

  const [
    hasMore,
    setHasMore,
  ] = useState(false);

  const [
    presetPlayCountMap,
    setPresetPlayCountMap,
  ] = useState({});

  const [
    presetTop2Map,
    setPresetTop2Map,
  ] = useState({});

  const [
    managedTierPresets,
    setManagedTierPresets,
  ] = useState([]);

  const [
    tierPresetLoaded,
    setTierPresetLoaded,
  ] = useState(false);

  /* =====================================================
     추천 프리셋 인기순 fallback용 참여 횟수
  ===================================================== */

  useEffect(() => {
    let cancelled = false;

    async function loadPresetPlayCounts() {
      try {
        const {
          data,
          error,
        } =
          await supabase.rpc(
            "get_worldcup_play_counts"
          );

        if (error) {
          throw error;
        }

        if (cancelled) {
          return;
        }

        const nextMap = {};

        (data || []).forEach(
          (row) => {
            nextMap[
              String(row.cup_id)
            ] =
              Number(
                row.play_count || 0
              );
          }
        );

        setPresetPlayCountMap(
          nextMap
        );
      } catch (error) {
        console.warn(
          "티어표 추천 프리셋 인기순 조회 실패:",
          error
        );
      }
    }

    loadPresetPlayCounts();

    return () => {
      cancelled = true;
    };
  }, []);

  /* =====================================================
     운영자 지정 티어 프리셋 직접 조회
  ===================================================== */

  useEffect(() => {
    let cancelled = false;

    async function loadTierPresets() {
      try {
        const {
          data,
          error,
        } =
          await supabase
            .from("worldcups")
            .select(
              `
              id,
              title,
              title_translations,
              data,
              is_tier_preset,
              tier_preset_order
              `
            )
            .eq(
              "is_tier_preset",
              true
            )
            .is(
              "deleted_at",
              null
            )
            .order(
              "tier_preset_order",
              {
                ascending: true,
                nullsFirst: false,
              }
            )
            .limit(5);

        if (error) {
          throw error;
        }

        if (cancelled) {
          return;
        }

        setManagedTierPresets(
          Array.isArray(data)
            ? data
            : []
        );

        setTierPresetLoaded(
          true
        );
      } catch (error) {
        console.warn(
          "티어표 운영자 프리셋 조회 실패:",
          error
        );

        if (!cancelled) {
          setManagedTierPresets(
            []
          );

          setTierPresetLoaded(
            true
          );
        }
      }
    }

    loadTierPresets();

    return () => {
      cancelled = true;
    };
  }, []);

  /* =====================================================
     추천 프리셋 결정

     1. 관리자 지정 우선
     2. 하나도 없으면 인기 TOP5
  ===================================================== */

  const recommendedPresets =
    useMemo(() => {
      if (!tierPresetLoaded) {
        return [];
      }

      if (
        managedTierPresets.length >
        0
      ) {
        return managedTierPresets.slice(0, 3);
      }

      return [...worldcupList]
        .sort((a, b) => {
          const aCount =
            presetPlayCountMap[
              String(a.id)
            ] || 0;

          const bCount =
            presetPlayCountMap[
              String(b.id)
            ] || 0;

          return (
            bCount - aCount
          );
        })
        .slice(0, 3);
    }, [
      tierPresetLoaded,
      managedTierPresets,
      worldcupList,
      presetPlayCountMap,
    ]);

  /* =====================================================
     추천 월드컵 실제 누적 1위 / 2위 후보 조회
  ===================================================== */

  useEffect(() => {
    if (
      !tierPresetLoaded ||
      recommendedPresets.length ===
        0
    ) {
      return;
    }

    let cancelled = false;

    async function loadPresetTop2() {
      const nextMap = {};

      await Promise.all(
        recommendedPresets.map(
          async (cup) => {
            try {
              const stats =
                await fetchWinnerStatsFromDB(
                  cup.id
                );

              const cupData =
                Array.isArray(
                  cup?.data
                )
                  ? cup.data
                  : [];

              if (
                !Array.isArray(
                  stats
                ) ||
                stats.length === 0
              ) {
                nextMap[
                  String(cup.id)
                ] = [
                  cupData[0] ||
                    null,
                  cupData[1] ||
                    null,
                ];

                return;
              }

              const sorted =
                [...stats]
                  .map(
                    (
                      row,
                      index
                    ) => ({
                      ...row,
                      _originIndex:
                        index,
                    })
                  )
                  .sort(
                    (a, b) => {
                      const winDiff =
                        Number(
                          b?.win_count ||
                            0
                        ) -
                        Number(
                          a?.win_count ||
                            0
                        );

                      if (
                        winDiff !== 0
                      ) {
                        return winDiff;
                      }

                      const matchDiff =
                        Number(
                          b?.match_wins ||
                            0
                        ) -
                        Number(
                          a?.match_wins ||
                            0
                        );

                      if (
                        matchDiff !==
                        0
                      ) {
                        return matchDiff;
                      }

                      return (
                        a._originIndex -
                        b._originIndex
                      );
                    }
                  );

              const firstId =
                sorted[0]
                  ?.candidate_id;

              const secondId =
                sorted[1]
                  ?.candidate_id;

              const first =
                cupData.find(
                  (
                    candidate
                  ) =>
                    String(
                      candidate?.id
                    ) ===
                    String(
                      firstId
                    )
                ) ||
                cupData[0] ||
                null;

              const second =
                cupData.find(
                  (
                    candidate
                  ) =>
                    String(
                      candidate?.id
                    ) ===
                    String(
                      secondId
                    )
                ) ||
                cupData[1] ||
                null;

              nextMap[
                String(cup.id)
              ] = [
                first,
                second,
              ];
            } catch (
              error
            ) {
              console.warn(
                "티어 추천 TOP2 조회 실패:",
                cup.id,
                error
              );

              const cupData =
                Array.isArray(
                  cup?.data
                )
                  ? cup.data
                  : [];

              nextMap[
                String(cup.id)
              ] = [
                cupData[0] ||
                  null,
                cupData[1] ||
                  null,
              ];
            }
          }
        )
      );

      if (!cancelled) {
        setPresetTop2Map(
          nextMap
        );
      }
    }

    loadPresetTop2();

    return () => {
      cancelled = true;
    };
  }, [
    tierPresetLoaded,
    recommendedPresets,
  ]);

  /* =====================================================
     모바일 체크
  ===================================================== */

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(
        window.innerWidth < 600
      );
    };

    window.addEventListener(
      "resize",
      handleResize
    );

    return () =>
      window.removeEventListener(
        "resize",
        handleResize
      );
  }, []);

  /* =====================================================
     티어표 작성자 닉네임
  ===================================================== */

  const loadProfiles =
    useCallback(async (rows) => {
      const ids =
        Array.from(
          new Set(
            rows
              .map(
                (row) =>
                  row?.user_id
              )
              .filter(Boolean)
          )
        );

      if (
        ids.length === 0
      ) {
        return;
      }

      const {
        data,
        error,
      } = await supabase
        .from("profiles")
        .select(
          "id, nickname"
        )
        .in(
          "id",
          ids
        );

      if (error) {
        console.warn(
          "Tier list profile lookup failed",
          error
        );
        return;
      }

      setProfileMap(
        (prev) => {
          const next = {
            ...prev,
          };

          (data || []).forEach(
            (profile) => {
              next[
                String(
                  profile.id
                )
              ] =
                profile.nickname ||
                "";
            }
          );

          return next;
        }
      );
    }, []);

  /* =====================================================
     티어표 목록 조회
  ===================================================== */

  const tierListRequestSeqRef = useRef(0);

  const loadTierLists =
    useCallback(
      async ({
        nextPage = 0,
        append = false,
      } = {}) => {
        const requestSeq = ++tierListRequestSeqRef.current;

        append
          ? setLoadingMore(true)
          : setLoading(true);

        setLoadError("");

        if (mineOnly && !authChecked) {
          append ? setLoadingMore(false) : setLoading(false);
          return;
        }

        if (mineOnly && !currentUserId) {
          setTierLists([]);
          setHasMore(false);
          append ? setLoadingMore(false) : setLoading(false);
          return;
        }

        try {
          const from =
            nextPage *
            PAGE_SIZE;

          const to =
            from +
            PAGE_SIZE;

          let query =
            supabase
              .from(
                "tier_lists"
              )
       .select(
  "id, user_id, guest_nickname, title, title_translations, source_worldcup_id, category, thumbnail_url, candidate_count, has_one_pick, view_count, like_count, comment_count, clone_count, created_at, tier_labels, tiers, candidates"
);


          if (tagFilter) query = query.contains("tier_labels", {_tags: [tagFilter]});

          if (mineOnly && currentUserId) {
            query = query.eq("user_id", currentUserId);
          }

          if (sourceWorldcupFilter) {
            query = query.eq("source_worldcup_id", sourceWorldcupFilter);
          } else if (presetNameFilter) {
            query = query.eq(
              "tier_labels->>_sourcePresetName",
              presetNameFilter
            );
          }

          if (
            category !== "all"
          ) {
            query =
              query.eq(
                "category",
                category
              );
          }

      const cleanSearch =
  normalizeTags([searchKeyword])[0] || "";

if (cleanSearch) {
  const safe =
    cleanSearch
      .replace(
        /[%_,()]/g,
        " "
      )
      .trim();

  if (safe) {
    // 예전에 NFKC 때문에
    // ㅁ -> ᄆ
    // ㅋ -> ᄏ
    // 형태로 저장된 태그도 같이 검색
    const legacySafe =
      safe.normalize("NFKC");

    const filters = [
      `title.ilike.%${safe}%`,
      `candidate_search_text.ilike.%${safe}%`,
      `tier_labels->>_tags.ilike.%${safe}%`,
    ];

    if (
      legacySafe !== safe
    ) {
      filters.push(
        `tier_labels->>_tags.ilike.%${legacySafe}%`
      );
    }

    query =
      query.or(
        filters.join(",")
      );
  }
}

          if (
            sort === "popular"
          ) {
            query =
              query
                .order(
                  "like_count",
                  {
                    ascending:
                      false,
                  }
                )
                .order(
                  "view_count",
                  {
                    ascending:
                      false,
                  }
                )
                .order(
                  "created_at",
                  {
                    ascending:
                      false,
                  }
                );
          } else if (
            sort ===
            "mostCreated"
          ) {
            query =
              query
                .order(
                  "clone_count",
                  {
                    ascending:
                      false,
                  }
                )
                .order(
                  "created_at",
                  {
                    ascending:
                      false,
                  }
                );
          } else {
            query =
              query.order(
                "created_at",
                {
                  ascending:
                    false,
                }
              );
          }

          const {
            data,
            error,
          } =
            await query.range(
              from,
              to
            );

          if (requestSeq !== tierListRequestSeqRef.current) {
            return;
          }

          if (error) {
            throw error;
          }

          const rows =
            Array.isArray(data)
              ? data
              : [];

          const visibleRows =
            rows.slice(
              0,
              PAGE_SIZE
            );

          setTierLists(
            (prev) =>
              append
                ? [
                    ...prev,
                    ...visibleRows,
                  ]
                : visibleRows
          );

          setHasMore(
            rows.length >
              PAGE_SIZE
          );

          setPage(
            nextPage
          );

          loadProfiles(
            visibleRows
          );
        } catch (
          error
        ) {
          if (requestSeq !== tierListRequestSeqRef.current) {
            return;
          }

          console.error(
            "Tier list page load failed",
            error
          );

          setLoadError(
            t(
              "tierList.page.loadFailed"
            )
          );
        } finally {
          if (requestSeq === tierListRequestSeqRef.current) {
            setLoading(false);
            setLoadingMore(false);
          }
        }
      },
      [
        category,
        searchKeyword,
        sort,
        mineOnly,
        authChecked,
        currentUserId,
        excludedTierId,
        tagFilter,
        sourceWorldcupFilter,
        presetNameFilter,
        loadProfiles,
        t,
      ]
    );

  useEffect(() => {
    loadTierLists({
      nextPage: 0,
      append: false,
    });
  }, [loadTierLists]);

  useEffect(() => {
    const timer = setTimeout(() => setSearchKeyword(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const submitSearch = (
    event
  ) => {
    event?.preventDefault?.();

    setSearchKeyword(
      searchInput.trim()
    );
  };

 const cards = useMemo(() => {
  return tierLists.map((item) => {
    const titleTranslations =
  readTranslationMap(item?.title_translations);

const displayTitle =
  titleTranslations?.[lang] ||
  titleTranslations?.en ||
  item?.title ||
  "Tier List";
    const candidates =
      Array.isArray(item?.candidates)
        ? item.candidates
        : [];

    /* =========================================
       1. 나만의 원픽 후보 찾기
    ========================================= */

    const onePickValue =
      item?.tiers?.ONE_PICK;

    let onePickCandidate = null;

    // ONE_PICK이 후보 id 하나인 경우
    if (
      onePickValue !== null &&
      onePickValue !== undefined
    ) {
      onePickCandidate =
        candidates.find(
          (candidate) =>
            String(candidate?.id) ===
            String(onePickValue)
        ) || null;
    }

    /* =========================================
       2. S/A/B/C/D에 들어간 첫 후보 찾기
    ========================================= */

    const rankedIds = [
      ...(Array.isArray(item?.tiers?.S)
        ? item.tiers.S
        : []),

      ...(Array.isArray(item?.tiers?.A)
        ? item.tiers.A
        : []),

      ...(Array.isArray(item?.tiers?.B)
        ? item.tiers.B
        : []),

      ...(Array.isArray(item?.tiers?.C)
        ? item.tiers.C
        : []),

      ...(Array.isArray(item?.tiers?.D)
        ? item.tiers.D
        : []),
    ];

    const firstRankedCandidate =
      rankedIds.length > 0
        ? candidates.find(
            (candidate) =>
              String(candidate?.id) ===
              String(rankedIds[0])
          ) || null
        : null;

    /* =========================================
       3. 그냥 이미지가 있는 첫 후보
    ========================================= */

    const firstImageCandidate =
      candidates.find(
        (candidate) =>
          Boolean(candidate?.image)
      ) || null;

    /* =========================================
       카드 미리보기 이미지

       우선순위:
       1. thumbnail_url
       2. 원픽
       3. 티어에 넣은 첫 후보
       4. 후보 중 첫 이미지
    ========================================= */

    const previewImage =
      item?.thumbnail_url ||
      onePickCandidate?.image ||
      firstRankedCandidate?.image ||
      firstImageCandidate?.image ||
      "";

    /* =========================================
       사용한 원본 월드컵 / 프리셋 찾기
    ========================================= */

    const sourceCup =
      item?.source_worldcup_id
        ? worldcupList.find(
            (cup) =>
              String(cup?.id) ===
              String(
                item.source_worldcup_id
              )
          )
        : null;

    const presetName =
      sourceCup
        ? getLocalizedWorldcupTitle(
            sourceCup,
            lang
          )
        : String(
            item?.tier_labels?._sourcePresetName || ""
          ).trim();

    /* =========================================
       목록 카드용 축약 티어 미리보기
       각 티어의 앞 4명만 보여주고 나머지는 +N으로 표시
    ========================================= */

    const candidateById = new Map(
      candidates.map((candidate) => [
        String(candidate?.id),
        candidate,
      ])
    );

    const tierPreview = ["S", "A", "B"].map((tier) => {
      const ids = Array.isArray(item?.tiers?.[tier])
        ? item.tiers[tier]
        : [];

      const previewCandidates = ids
        .map((candidateId) => candidateById.get(String(candidateId)))
        .filter(Boolean)
        .slice(0, 6);

      return {
        tier,
        candidates: previewCandidates,
        remaining: Math.max(0, ids.length - previewCandidates.length),
      };
    });

    const hasTierPreview = tierPreview.some(
      (row) => row.candidates.length > 0 || row.remaining > 0
    );

    /* =========================================
       최종 카드 데이터
    ========================================= */

  return {
  ...item,

  displayTitle,

  previewImage,
  presetName,
  tierPreview,
  hasTierPreview,

      author:
        item.user_id
          ? profileMap[
              String(item.user_id)
            ] ||
            t(
              "tierList.common.unknownAuthor"
            )
          : item.guest_nickname ||
            t(
              "tierList.common.guestAuthor"
            ),
    };
  });
}, [
  tierLists,
  profileMap,
  worldcupList,
  lang,
  t,
]);

  const seoTitle = t("tierList.seo.listTitle");
  const seoDescription = t("tierList.seo.listDescription");

  return (
    <>
      <Seo
        lang={lang}
        slug="tier-list"
        title={seoTitle}
        description={seoDescription}
        indexable={!mineOnly}
      />

    {mineOnly && <ContentNav active="tier-list" user={currentUserId} authChecked={authChecked} />}
    <div className={`tier-page${mineOnly ? " is-personal" : ""}`}
      style={{
        minHeight: "100vh",
        background: "transparent",
        color: "#202534",
      }}
    >
<div className="tier-page-container"
  style={{
    width: "100%",
maxWidth: isMobile ? 430 : 1480,
    margin: "0 auto",
    padding: isMobile
      ? "20px 10px"
      : "22px 22px",
    boxSizing: "border-box",
  }}
>
        

        <PageIntro icon="📊" title={t('tierList.page.title')} description={t('tierList.page.description')} buttonLabel={t('tierList.page.createButton')} onCreate={() => navigate(`/${lang}/tier-list/create`)} personal={mineOnly} accentColor="#2563EB" />
{/* 검색 위 언어 선택 */}
<div
  style={{
    margin: isMobile ? "6px 0 10px" : "8px 0 12px",
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    gap: isMobile ? 7 : 9,
  }}
>
  {LANGUAGES.map((item) => {
    const active = item.code === lang;

    return (
      <React.Fragment key={item.code}>
        {item.code === "id" && (
          <span aria-hidden="true" style={{ flexBasis: "100%", height: 0 }} />
        )}
        <button
          type="button"
          onClick={() => changeTierLanguage(item.code)}
          aria-pressed={active}
          style={{
            border: active
              ? "1.5px solid #2563EB"
              : "1px solid #d6deea",
            background: active
              ? "#2563EB"
              : "#ffffff",
            color: active
              ? "#ffffff"
              : "#3f4a5a",
            borderRadius: 9,
            padding: isMobile ? "8px 12px" : "9px 15px",
            fontSize: isMobile ? 15 : 16,
            fontWeight: active ? 800 : 700,
            cursor: "pointer",
            lineHeight: 1.2,
            boxShadow: "none",
          }}
        >
          {item.label}
        </button>
      </React.Fragment>
    );
  })}
</div>
<div
          style={{
            width: "100%", maxWidth: 980, margin: "0 auto 4px", boxSizing: "border-box",

            padding:
              isMobile
                ? 12
                : 16,

            border: "none",

            borderRadius: 0,

            background: "transparent",
          }}
        >
          <form className="tier-search-form"
            onSubmit={
              submitSearch
            }
            style={{
              display:
                "flex",

              gap: 8,

              flexWrap:
                "wrap",

              justifyContent:
                "center",
            }}
          >
            <div
              style={{
                width: isMobile ? "100%" : 560,
                position: "relative",
              }}
            >
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t("tierList.page.searchPlaceholder")}
                style={{
                  width: "100%",
                  height: 44,
                  boxSizing: "border-box",
                  padding: "0 44px 0 13px",
                  borderRadius: 8,
                  border: "1.5px solid #bccae0",
                  background: "#ffffff",
                  color: "#202534",
                  outline: "none",
                  fontWeight: 800,
                  fontSize: isMobile ? 16 : 18,
                }}
              />

              <button
                type="submit"
                aria-label={t("tierList.common.search")}
                title={t("tierList.common.search")}
                style={{
                  position: "absolute",
                  right: 5,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 36,
                  height: 36,
                  padding: 0,
                  border: "none",
                  borderRadius: 8,
                  background: "transparent",
                  color: "#2563EB",
                  fontSize: 18,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                🔍
              </button>
            </div>
          </form>


        </div>
{!mineOnly && recommendedPresets.length >
            0 && (
            <div className="tier-recommendations"
              style={{
                width: "100%",

                maxWidth: 1040,

                margin:
                  isMobile
                    ? "0 auto"
                    : "0 auto",

                padding:
                  isMobile
                    ? "4px 12px 16px"
                    : "4px 24px 20px",

                boxSizing:
                  "border-box",

                borderTop:
                  "none",

                borderBottom:
                  "none",
              }}
            >
        <div
  style={{
    textAlign: "center",
    color: "#1D4ED8",
fontSize: isMobile ? 24 : 34,
fontWeight: 900,
lineHeight: 1.2,
marginBottom: isMobile ? 12 : 16,
  }}
>
  {t("tierList.page.recommendedPresetTitle")}
</div>

      <div
  style={{
    display: "grid",
    gridTemplateColumns: isMobile
      ? "1fr"
      : "repeat(3, minmax(0, 1fr))",
    gap: isMobile ? 12 : 22,
    alignItems: "stretch",
  }}
>
                {recommendedPresets.map(
                  (cup) => {
                    const title =
                      getLocalizedWorldcupTitle(
                        cup,
                        lang
                      ) || "Tier List";

                    const top2 =
                      presetTop2Map[
                        String(
                          cup.id
                        )
                      ] || [];

                    const firstCandidate =
                      top2[0] ||
                      null;

                    const secondCandidate =
                      top2[1] ||
                      null;

                    const firstImage =
                      firstCandidate
                        ?.image ||
                      "";

                    const secondImage =
                      secondCandidate
                        ?.image ||
                      "";

                    return (
                      <button
                        key={
                          cup.id
                        }
                        type="button"
                        onClick={() =>
                          navigate(
                            `/${lang}/tier-list/create/${cup.id}`
                          )
                        }
                        title={
                          title
                        }
                        onMouseEnter={(e) => {
  if (isMobile) return;

  e.currentTarget.style.transform =
    "translateY(-6px) scale(1.015)";

  e.currentTarget.style.boxShadow =
    "0 6px 20px rgba(25,32,52,0.10)";

  e.currentTarget.style.borderColor =
    "#4aaeff";
}}

onMouseLeave={(e) => {
  if (isMobile) return;

  e.currentTarget.style.transform = "";

  e.currentTarget.style.boxShadow =
    "0 6px 20px rgba(25,32,52,0.10)";

  e.currentTarget.style.borderColor =
    "#315a8f";
}}
style={{
  width: "100%",
  minWidth: 0,
  maxWidth: "none",
  padding: 0,

  boxShadow:
    "0 4px 16px rgba(25,32,52,0.07)",

  transition:
    "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",

  willChange:
    "transform",

                          border:
                            "1px solid #dde2ea",

                          borderRadius:
                            10,

                          overflow:
                            "hidden",

                          background:
                            "#ffffff",

                          color:
                            "#202534",

                          cursor:
                            "pointer",

                          textAlign:
                            "left",

                          boxSizing:
                            "border-box",
                        }}
                      >
                        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "42% 58%" : "42% 58%", minHeight: isMobile ? 126 : 154, borderBottom: "1px solid #dde2ea" }}>
                        <div
                          style={{
                            width:
                              "100%",

                minHeight: isMobile ? 126 : 154,

                            display:
                              "grid",

                            gridTemplateColumns:
                              "minmax(0, 1fr) minmax(0, 1fr)",

                            overflow:
                              "hidden",

                            background:
                              "#ffffff",

                            position:
                              "relative",
                          }}
                        >
                          <div
                            style={{
                              minWidth:
                                0,

                              position:
                                "relative",

                              overflow:
                                "hidden",

                              background:
                                "#ffffff",
                            }}
                          >
                            {firstImage ? (
                              <MediaRenderer
                                url={
                                  firstImage
                                }
                                alt={
                                  title
                                }
                                playable={
                                  false
                                }
                                loading="eager"
                                style={{
                                  position:
                                    "absolute",

                                  inset:
                                    0,

                                  width:
                                    "100%",

                                  height:
                                    "100%",

                                  objectFit:
                                    "cover",

                                  display:
                                    "block",
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width:
                                    "100%",

                                  height:
                                    "100%",

                                  background:
                                    "#ffffff",
                                }}
                              />
                            )}
                          </div>

                          <div
                            style={{
                              minWidth:
                                0,

                              position:
                                "relative",

                              overflow:
                                "hidden",

                              background:
                                "#ffffff",
                            }}
                          >
                            {secondImage ? (
                              <MediaRenderer
                                url={
                                  secondImage
                                }
                                alt={
                                  title
                                }
                                playable={
                                  false
                                }
                                loading="eager"
                                style={{
                                  position:
                                    "absolute",

                                  inset:
                                    0,

                                  width:
                                    "100%",

                                  height:
                                    "100%",

                                  objectFit:
                                    "cover",

                                  display:
                                    "block",
                                }}
                              />
                            ) : firstImage ? (
                              <MediaRenderer
                                url={
                                  firstImage
                                }
                                alt={
                                  title
                                }
                                playable={
                                  false
                                }
                                loading="eager"
                                style={{
                                  position:
                                    "absolute",

                                  inset:
                                    0,

                                  width:
                                    "100%",

                                  height:
                                    "100%",

                                  objectFit:
                                    "cover",

                                  display:
                                    "block",
                                }}
                              />
                            ) : null}
                          </div>

                          <div
                            style={{
                              position:
                                "absolute",

                              left:
                                "50%",

                              top:
                                "50%",

                              transform:
                                "translate(-50%, -50%)",

                              width:
                                isMobile
                                  ? 30
                                  : 38,

                              height:
                                isMobile
                                  ? 30
                                  : 38,

                              borderRadius:
                                "50%",

                              background:
                                "#ffffff",

                              display:
                                "flex",

                              alignItems:
                                "center",

                              justifyContent:
                                "center",

                              color:
                                "#202534",

                              fontSize:
                                isMobile
                                  ? 12
                                  : 14,

                              fontWeight:
                                900,

                              border:
                                "1px solid rgba(255,255,255,0.35)",
                            }}
                          >
                            VS
                          </div>
                        </div>

                        <div style={{ padding: "8px 10px", borderLeft: "1px solid #dde2ea", display: "grid", alignContent: "center", gap: 4, background: "#fff" }}>
                          {[
                            { tier: "S", color: "#ff6b6b", candidate: firstCandidate },
                            { tier: "A", color: "#ff9f43", candidate: secondCandidate },
                            { tier: "B", color: "#ffd93d", candidate: null },
                          ].map((row) => (
                            <div key={row.tier} style={{ minHeight: 28, display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ width: 28, height: 28, borderRadius: 5, display: "grid", placeItems: "center", background: row.color, color: "#111", fontWeight: 950 }}>{row.tier}</span>
                              {row.candidate?.image ? (
                                <MediaRenderer url={row.candidate.image} alt={row.candidate.name || ""} playable={false} loading="lazy" style={{ width: 28, height: 28, borderRadius: 5, objectFit: "cover", border: "1px solid #dde2ea" }} />
                              ) : <span style={{ width: 28, height: 28, borderRadius: 5, border: "1px dashed #cfd8e6", background: "#f8fafc" }} />}
                              <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12, fontWeight: 800, color: "#596579" }}>{row.candidate?.name || ""}</span>
                            </div>
                          ))}
                        </div>
                        </div>

                        <div
                          style={{
                            padding:
                              isMobile
                                ? "9px 8px"
                                : "11px 10px",

                            minHeight:
                              isMobile
                                ? 54
                                : 72,

                            boxSizing:
                              "border-box",

                            display:
                              "flex",

                            alignItems:
                              "center",

                            justifyContent:
                              "center",

                            textAlign:
                              "center",

                            fontSize:
                              isMobile
                                ? 15
                                : 19,

                            fontWeight:
                              900,

                            lineHeight:
                              1.35,

                            overflow:
                              "hidden",
                          }}
                        >
                          <span
                            style={{
                              display:
                                "-webkit-box",

                              WebkitBoxOrient:
                                "vertical",

                              WebkitLineClamp:
                                2,

                              overflow:
                                "hidden",
                            }}
                          >
                            {
                              title
                            }
                          </span>
                        </div>
                        <div style={{ margin: "0 10px 11px", minHeight: 40, display: "grid", placeItems: "center", border: "1px solid #2563EB", borderRadius: 8, background: "#2563EB", color: "#fff", fontSize: 15, fontWeight: 900 }}>
                          {t("tierList.page.createButton")}
                        </div>
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          )}

<section className="tier-community-filters" aria-label={t("tierList.page.title")}>
<div
            style={{
              display:
                "flex",

              gap: 7,

              justifyContent:
                "center",

              flexWrap:
                "wrap",

              marginTop:
                12,
            }}
          >
            {CATEGORY_VALUES.map(
              (value) => (
                <button
                  key={
                    value
                  }
                  type="button"
                  aria-pressed={category === value}
                  className="tier-filter"
                  onClick={() =>
                    setCategory(
                      value
                    )
                  }
                  style={{
                    padding:
                      "7px 11px",

                    borderRadius: 999,

                    border:
                      category ===
                      value
                        ? "1px solid #19bfff"
                        : "1px solid #dde2ea",

                    background: category === value ? "#2563EB" : "#ffffff",

                    color: category === value ? "#ffffff" : "#202534",

                    fontSize:
                      isMobile ? 15 : 16,

                    fontWeight:
                      900,

                    cursor:
                      "pointer",
                  }}
                >
                  {t(
                    `tierList.categories.${value}`
                  )}
                </button>
              )
            )}
          </div>
<div
            style={{
              display:
                "flex",

              gap: 7,

              justifyContent:
                "center",

              flexWrap:
                "wrap",

              marginTop:
                10,
            }}
          >
            {SORT_VALUES.map(
              (value) => (
                <button
                  key={
                    value
                  }
                  type="button"
                  aria-pressed={sort === value}
                  className="tier-filter"
                  onClick={() =>
                    setSort(
                      value
                    )
                  }
                  style={{
                    padding:
                      "7px 11px",

                    borderRadius:
                      8,

                    border:
                      sort ===
                      value
                        ? "1px solid #55d6ff"
                        : "1px solid #dde2ea",

                    background: sort === value ? "#2563EB" : "#ffffff",

                    color: sort === value ? "#ffffff" : "#1D4ED8",

                    fontSize:
                      isMobile ? 15 : 16,

                    fontWeight:
                      900,

                    cursor:
                      "pointer",
                  }}
                >
                  {t(
                    `tierList.sort.${value}`
                  )}
                </button>
              )
            )}
          </div>

<h2
  style={{
    margin: "24px 0 4px",
    textAlign: "center",
    fontSize: isMobile ? 24 : 30,
    fontWeight: 950,
    color: "#202534",
  }}
>
  {t("tierList.page.allTitle", "전체 티어표")}
</h2>
</section>
        {loadError && (
          <div
            style={{
              marginTop: 18,

              padding: 12,

              borderRadius:
                8,

              background:
                "#ffffff",

              border:
                "1px solid #dde2ea",

              color:
                "#b42346",

              textAlign:
                "center",

              fontWeight:
                800,
            }}
          >
            {loadError}
          </div>
        )}

        {tagFilter && <div style={{textAlign:"center",color:"#1D4ED8",margin:12}}><button type="button" onClick={() => navigate(`/${lang}/tier-list`)} style={{color:"inherit",background:"#ffffff",border:"1px solid #19bfff",borderRadius:20,padding:"6px 12px",cursor:"pointer"}}>#{tagFilter} ×</button></div>}
        {loading ? (
          <div
            style={{
              padding:
                "54px 10px",

              textAlign:
                "center",

              color:
                "#1D4ED8",

              fontWeight:
                800,
            }}
          >
            {t(
              "tierList.common.loading"
            )}
          </div>
        ) : cards.length ===
          0 ? (
          <div
            style={{
              padding:
                "54px 10px",

              textAlign:
                "center",

              color:
                "#1D4ED8",

              fontWeight:
                800,
            }}
          >
            {t(
              "tierList.page.empty"
            )}
          </div>
        ) : (
          <>
            <div className="tier-cards-grid"
              style={{
                display:
                  "grid",

gridTemplateColumns:
  isMobile
    ? "1fr"
    : "repeat(4, minmax(0, 1fr))",

justifyContent:
  "center",

gap:
  isMobile
    ? 12
    : 14,

                marginTop:
                  20,
              }}
            >
              {cards.map(
                (item) => (
                  <button className="tier-list-card"
                    key={
                      item.id
                    }
                    type="button"
                    onClick={() =>
                      navigate(
                        `/${lang}/tier-list/${item.id}`
                      )
                    }
                    style={{
                      padding:
                        0,

                      border:
                        "1px solid #dde2ea",

                      borderRadius:
                        12,

                      overflow:
                        "hidden",

                      background:
                        "#ffffff",

                      color:
                        "#202534",

                      cursor:
                        "pointer",

                      textAlign:
                        "left",
                    }}
                  >
                    <div style={{ display: "grid", gridTemplateColumns: item.hasTierPreview ? "36% 64%" : "1fr", minHeight: isMobile ? 150 : 210, borderBottom: "1px solid #dde2ea" }}>
                    <div
                      style={{
                        width:
                          "100%",

                        minHeight: isMobile ? 150 : 210,

                        position:
                          "relative",

                        background:
                          "#ffffff",
                      }}
                    >
                {item.previewImage ? (
  <MediaRenderer
    url={item.previewImage}
   alt={item.displayTitle || ""}
    playable={false}
    loading="lazy"
    style={{
      position: "absolute",
      inset: 0,

      width: "100%",
      height: "100%",

      objectFit: "cover",
      display: "block",
    }}
  />
) : (
  <div
    style={{
      position: "absolute",
      inset: 0,

      display: "flex",
      alignItems: "center",
      justifyContent: "center",

      color: "#607086",
      fontWeight: 900,
    }}
  >
    TIER LIST
  </div>
)}

                    </div>

                    {item.hasTierPreview && (
                      <div
                        style={{
                          padding: isMobile ? "7px 8px" : "8px 10px",
                          background: "#ffffff",
                          borderLeft: "1px solid #dde2ea",
                          display: "grid",
                          alignContent: "center",
                          gap: 4,
                        }}
                      >
                        {item.tierPreview.map((row) => (
                          <div
                            key={row.tier}
                            style={{
                              minHeight: isMobile ? 36 : 52,
                              display: "flex",
                              alignItems: "center",
                              gap: 5,
                              minWidth: 0,
                            }}
                          >
                            <div
                              style={{
                                width: isMobile ? 34 : 46,
                                minWidth: isMobile ? 34 : 46,
                                height: isMobile ? 34 : 46,
                                borderRadius: 5,
                                background:
                                  row.tier === "S"
                                    ? "#ff6b6b"
                                    : row.tier === "A"
                                      ? "#ff9f43"
                                      : "#ffd93d",
                                color: "#111",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: isMobile ? 14 : 18,
                                fontWeight: 950,
                              }}
                            >
                              {row.tier}
                            </div>

                            <div
                              style={{
                                minWidth: 0,
                                flex: 1,
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                overflow: "hidden",
                              }}
                            >
                              {row.candidates.map((candidate, index) => (
                                <div
                                  key={`${row.tier}-${candidate?.id ?? index}`}
                                  title={candidate?.name || ""}
                                  style={{
                                    width: isMobile ? 34 : 42,
                                    minWidth: isMobile ? 34 : 42,
                                    height: isMobile ? 34 : 42,
                                    borderRadius: 5,
                                    overflow: "hidden",
                                    background: "#ffffff",
                                    border: "1px solid #dde2ea",
                                  }}
                                >
                                  {candidate?.image ? (
                                    <MediaRenderer
                                      url={candidate.image}
                                      alt={candidate?.name || ""}
                                      playable={false}
                                      loading="lazy"
                                      style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        display: "block",
                                      }}
                                    />
                                  ) : null}
                                </div>
                              ))}

                              {row.remaining > 0 && (
                                <span
                                  style={{
                                    color: "#1D4ED8",
                                    fontSize: isMobile ? 12 : 13,
                                    fontWeight: 900,
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  +{row.remaining}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    </div>

                    <div
                      style={{
                        padding:
                          13,
                      }}
                    >
                      <div
                        style={{
                          display:
                            "flex",

                          gap: 6,

                          alignItems:
                            "center",

                          flexWrap:
                            "wrap",
                        }}
                      >
                        <span
                          style={{
                            padding:
                              "3px 7px",

                            borderRadius:
                              999,

                            background:
                              "#ffffff",

                            color:
                              "#1D4ED8",

                            fontSize:
                              12,

                            fontWeight:
                              900,
                          }}
                        >
                          {t(
                            `tierList.categories.${
                              item.category ||
                              "other"
                            }`
                          )}
                        </span>

                        <span
                          style={{
                            color:
                              "#1D4ED8",

                            fontSize:
                              13,

                            fontWeight:
                              700,
                          }}
                        >
                          {
                            item.author
                          }
                        </span>
                      </div>

                      <div
                   className="tier-card-title" title={item.displayTitle || ""}
                        style={{
                          marginTop: 8,
                          fontSize: isMobile ? 18 : 20,
                          fontWeight: 900,
                          lineHeight: 1.35,
                          minHeight: isMobile ? 43 : 49,
                          maxHeight: isMobile ? 43 : 49,
                          display: "-webkit-box",
                          WebkitBoxOrient: "vertical",
                          WebkitLineClamp: 2,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          overflowWrap: "anywhere",
                          wordBreak: "break-word",
                        }}
                      >
                  {item.displayTitle}
                      </div>
<div
  style={{
    marginTop: 6,

    minHeight: 34,

    color:
      item.presetName
        ? "#1D4ED8"
        : "transparent",

    fontSize: isMobile ? 14 : 15,

    fontWeight: 800,

    lineHeight: 1.35,

    display:
      "-webkit-box",

    WebkitBoxOrient:
      "vertical",

    WebkitLineClamp:
      2,

    overflow:
      "hidden",
  }}
>
  {item.presetName
    ? `${
        t("tierList.page.presetLabel")
      }: ${item.presetName}`
    : "\u00A0"}
</div>
                      <div
                        style={{
                          marginTop:
                            10,

                          display:
                            "flex",

                          gap: 10,

                          flexWrap:
                            "wrap",

                          color:
                            "#1D4ED8",

                          fontSize:
                            isMobile ? 13 : 14,

                          fontWeight:
                            800,
                        }}
                      >
                        <span>
                          👤{" "}
                          {item.candidate_count ||
                            0}
                        </span>

                        <span>
                          👁{" "}
                          {item.view_count ||
                            0}
                        </span>

                        <span>
                          ♥{" "}
                          {item.like_count ||
                            0}
                        </span>

                        <span>
                          💬{" "}
                          {item.comment_count ||
                            0}
                        </span>

                        <span>
                          ↻{" "}
                          {item.clone_count ||
                            0}
                        </span>
                      </div>
                    </div>
                  </button>
                )
              )}
            </div>

            {hasMore && (
              <div
                style={{
                  textAlign:
                    "center",

                  marginTop:
                    20,
                }}
              >
                <button
                  type="button"
                  disabled={
                    loadingMore
                  }
                  onClick={() =>
                    loadTierLists({
                      nextPage:
                        page + 1,

                      append:
                        true,
                    })
                  }
                  style={{
                    padding:
                      "10px 18px",

                    borderRadius:
                      8,

                    border:
                      "1px solid #dde2ea",

                    background:
                      "#ffffff",

                    color:
                      "#202534",

                    fontWeight:
                      900,

                    cursor:
                      loadingMore
                        ? "default"
                        : "pointer",

                    opacity:
                      loadingMore
                        ? 0.6
                        : 1,
                  }}
                >
                  {loadingMore
                    ? t(
                        "tierList.common.loading"
                      )
                    : t(
                        "tierList.page.loadMore"
                      )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
    </>
  );
}

export default TierListPage;
