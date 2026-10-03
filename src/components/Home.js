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
import {
  getWorldcupDescription,
  getWorldcupTitle,
} from "../utils/localization";





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

const HOME_SIDE_PANEL_COPY = {
  ko: {
    recentCreated: "최근 만들어진 월드컵",
    recentPlayed: "최근 플레이",
    empty: "표시할 월드컵이 없습니다.",
  },
  en: {
    recentCreated: "Recently Created Brackets",
    recentPlayed: "Recent Plays",
    empty: "No brackets to show yet.",
  },
  ja: {
    recentCreated: "最近作成されたワールドカップ",
    recentPlayed: "最近のプレイ",
    empty: "表示できるワールドカップがありません。",
  },
  zh: {
    recentCreated: "最近创建的淘汰赛",
    recentPlayed: "最近游玩",
    empty: "暂无可显示的淘汰赛。",
  },
  es: {
    recentCreated: "Torneos creados recientemente",
    recentPlayed: "Jugadas recientes",
    empty: "No hay torneos para mostrar.",
  },
  fr: {
    recentCreated: "Tournois créés récemment",
    recentPlayed: "Parties récentes",
    empty: "Aucun tournoi à afficher.",
  },
  vi: {
    recentCreated: "Bracket mới tạo",
    recentPlayed: "Lượt chơi gần đây",
    empty: "Chưa có bracket để hiển thị.",
  },
  de: {
    recentCreated: "Neu erstellte Turniere",
    recentPlayed: "Letzte Spiele",
    empty: "Noch keine Turniere vorhanden.",
  },
  ru: {
    recentCreated: "Недавно созданные турниры",
    recentPlayed: "Недавние игры",
    empty: "Пока нечего показать.",
  },
  id: {
    recentCreated: "Bracket Terbaru",
    recentPlayed: "Baru Dimainkan",
    empty: "Belum ada bracket untuk ditampilkan.",
  },
  pt: {
    recentCreated: "Torneios recentes",
    recentPlayed: "Jogadas recentes",
    empty: "Nenhum torneio para mostrar.",
  },
  hi: {
    recentCreated: "हाल में बनाए गए ब्रैकेट",
    recentPlayed: "हाल की खेलें",
    empty: "दिखाने के लिए कोई ब्रैकेट नहीं है।",
  },
  tr: {
    recentCreated: "Yeni Oluşturulan Turnuvalar",
    recentPlayed: "Son Oynananlar",
    empty: "Gösterilecek turnuva yok.",
  },
  th: {
    recentCreated: "เวิลด์คัพที่สร้างล่าสุด",
    recentPlayed: "เล่นล่าสุด",
    empty: "ยังไม่มีรายการให้แสดง",
  },
  ar: {
    recentCreated: "بطولات أُنشئت حديثًا",
    recentPlayed: "آخر مرات اللعب",
    empty: "لا توجد بطولات لعرضها.",
  },
  bn: {
    recentCreated: "সাম্প্রতিক তৈরি ব্র্যাকেট",
    recentPlayed: "সাম্প্রতিক খেলা",
    empty: "দেখানোর মতো কোনো ব্র্যাকেট নেই।",
  },
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

const HOME_CATEGORY_SHORTCUT_KEYS = [
  "game",
  "anime_manga",
  "music",
  "movie_drama",
  "korea",
  "person",
  "sports",
  "food",
];

const KO_HOME_CATEGORY_SHORTCUT_LABELS = {
  game: "게임 월드컵",
  anime_manga: "애니 이상형 월드컵",
  music: "음악 월드컵",
  movie_drama: "영화·드라마 월드컵",
  korea: "K-POP 아이돌 월드컵",
  person: "인물 이상형 월드컵",
  sports: "스포츠 월드컵",
  food: "음식 이상형 월드컵",
};



const PRIMARY_HOME_CATEGORY_KEYS = new Set([

  "korea",

  "person",

  "anime_manga",

]);



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
  return getWorldcupTitle(cup, lang);

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

const [categorySorts, setCategorySorts] = useState({});

const getCategorySort = (categoryKey) =>
  categorySorts[categoryKey] || "popular";

const setCategorySort = (categoryKey, nextSort) => {
  setCategorySorts((current) => ({
    ...current,
    [categoryKey]: nextSort,
  }));
};

const sortCategoryCups = (cups, categoryKey) => {
  const selectedSort =
    getCategorySort(categoryKey);

  return [...(cups || [])].sort((a, b) => {
    if (selectedSort === "recent") {
      const aDate =
        a?.created_at || "";
      const bDate =
        b?.created_at || "";

      if (aDate === bDate) {
        return String(b?.id || "").localeCompare(
          String(a?.id || "")
        );
      }

      return bDate > aDate ? 1 : -1;
    }

    const aPlays =
      playCountMap[String(a?.id)] || 0;
    const bPlays =
      playCountMap[String(b?.id)] || 0;

    return bPlays - aPlays;
  });
};

const searchInputRef = useRef(null);



useEffect(() => {

  const params =

    new URLSearchParams(location.search);



  const searchParam = params.get("search");


  const focusParam = params.get("focus");



  if (searchParam) {

    setSearch(searchParam);

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

  const [showMoreCategories, setShowMoreCategories] = useState(false);

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

const collectSearchTextValues = (...values) => {

  const result = [];



  const visit = (value) => {

    if (value == null) {

      return;

    }



    if (Array.isArray(value)) {

      value.forEach(visit);

      return;

    }



    if (typeof value === "object") {

      Object.values(value).forEach(visit);

      return;

    }



    const text =

      normalizeSearchQuery(value);



    if (text) {

      result.push(text);

    }

  };



  values.forEach(visit);

  return result;

};

const searchTextMatches = (keyword, ...values) =>

  collectSearchTextValues(...values).some((value) =>

    value.includes(keyword)

  );

const cupMatchesSearch = (cup, keyword, lang) => {

  if (!keyword) {

    return true;

  }



  const hasMatchingMainText =

    searchTextMatches(

      keyword,

      getDisplayTitle(cup),

      getWorldcupDescription(cup, lang),

      cup?.title,

      cup?.description,

      cup?.desc,

      cup?.title_translations,

      cup?.description_translations

    );



  const hasMatchingCandidate =

    Array.isArray(cup?.data) &&

    cup.data.some((candidate) =>

      searchTextMatches(

        keyword,

        candidate?.name,

        candidate?.title,

        candidate?.name_translations,

        candidate?.title_translations

      )

    );



  const hasMatchingTag =

    Array.isArray(cup?.tags) &&

    cup.tags.some((tag) =>

      normalizeSearchQuery(tag).includes(keyword)

    );



  return (

    hasMatchingMainText ||

    hasMatchingCandidate ||

    hasMatchingTag

  );

};



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

const [recentPlayLogs, setRecentPlayLogs] = useState([]);



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
  let mounted = true;

  async function fetchRecentPlays() {
    try {
      const { data, error } = await supabase
        .from("winner_logs")
        .select("cup_id, created_at")
        .order("created_at", { ascending: false })
        .limit(30);

      if (error) {
        throw error;
      }

      if (mounted) {
        setRecentPlayLogs(data || []);
      }
    } catch (error) {
      console.error("최근 플레이 조회 오류:", error);
    }
  }

  fetchRecentPlays();

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

const CARD_HEIGHT = isMobile ? 418 : 452;

const CARD_GAP = isMobile ? 7 : 13;

const THUMB_HEIGHT = isMobile ? 196 : 214;



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



  return cupMatchesSearch(cup, keyword, lang);

})

  : [];

const sidePanelCopy =
  HOME_SIDE_PANEL_COPY[lang] ||
  HOME_SIDE_PANEL_COPY.en;

const cupById = new Map(
  (Array.isArray(worldcupList) ? worldcupList : [])
    .filter((cup) => cup?.id)
    .map((cup) => [String(cup.id), cup])
);

const recentCreatedCups = [...cupById.values()]
  .sort(
    (a, b) =>
      new Date(b?.created_at || 0).getTime() -
      new Date(a?.created_at || 0).getTime()
  )
  .slice(0, 6)
  .map((cup) => ({
    cup,
    time: cup?.created_at,
  }));

const seenRecentPlayIds = new Set();
const recentPlayedCups = (recentPlayLogs || [])
  .map((log) => {
    const cup = cupById.get(String(log?.cup_id));
    if (!cup) return null;

    const key = String(cup.id);
    if (seenRecentPlayIds.has(key)) return null;
    seenRecentPlayIds.add(key);

    return {
      cup,
      time: log?.created_at,
    };
  })
  .filter(Boolean)
  .slice(0, 6);

const showHomeActivityPanels =
  !isMobile &&
  !personalView &&
  !search.trim();

const useSideHomeActivityPanels =
  showHomeActivityPanels &&
  vw >= 1360;





  const categoryRowRefs = useRef({});

  const [categoryScrollState, setCategoryScrollState] = useState({});

const getInitialRowCount = () => {

  const horizontalPadding = isMobile ? 84 : 152;

  const availableWidth = Math.max(

    CARD_WIDTH,

    vw - horizontalPadding

  );



  return Math.max(

    1,

    Math.ceil(

      availableWidth / (CARD_WIDTH + CARD_GAP)

    )

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

        current + getInitialRowCount(),

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



const scrollCategoryRow = (

  rowKey,

  direction,

  totalCount = 0

) => {

  const el = categoryRowRefs.current[rowKey];

  if (!el) return;



  const amount = isMobile

    ? CARD_WIDTH + CARD_GAP

    : (CARD_WIDTH + CARD_GAP) * 2;



  const doScroll = () => {

    const target = categoryRowRefs.current[rowKey];

    if (!target) return;



    target.scrollBy({

      left: direction * amount,

      behavior: "smooth",

    });

  };



  if (

    direction > 0 &&

    getRowVisibleCount(rowKey) < totalCount

  ) {

    loadMoreRow(rowKey, totalCount);



    requestAnimationFrame(() => {

      requestAnimationFrame(doScroll);

    });



    return;

  }



  doScroll();

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

  function getCandidateName(candidate) {
    return (
      candidate?.name_translations?.[lang] ||
      candidate?.name_translations?.en ||
      candidate?.name ||
      candidate?.title ||
      ""
    ).toString().trim();
  }

  function getPopularCandidateLine(cup, winStats) {
    const candidates = Array.isArray(cup?.data) ? cup.data : [];

    if (!candidates.length) {
      return getWorldcupDescription(cup, lang);
    }

    const rankedFromStats = Array.isArray(winStats) && winStats.length
      ? [...winStats]
          .map((row, index) => ({ ...row, _originIdx: index }))
          .sort((a, b) => {
            if ((b.win_count || 0) !== (a.win_count || 0)) {
              return (b.win_count || 0) - (a.win_count || 0);
            }
            if ((b.match_wins || 0) !== (a.match_wins || 0)) {
              return (b.match_wins || 0) - (a.match_wins || 0);
            }
            return a._originIdx - b._originIdx;
          })
          .map((row) =>
            candidates.find((candidate) => String(candidate.id) === String(row.candidate_id))
          )
          .filter(Boolean)
      : [];

    const rankedIds = new Set(rankedFromStats.map((candidate) => String(candidate.id)));
    const ranked = [
      ...rankedFromStats,
      ...candidates.filter((candidate) => !rankedIds.has(String(candidate.id))),
    ];

    const names = ranked
      .map(getCandidateName)
      .filter(Boolean);

    if (!names.length) {
      return getWorldcupDescription(cup, lang);
    }

    return names.join(" · ");
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



  const mainDark =  "#fffaf7";

const buttonStyle = {

  background: "#fff7ed",

  color: "#9A3412",

  fontWeight: 900,

  border: "1px solid #fed7aa",

  borderRadius: 8,



fontSize: isMobile ? 17 : 19,

  padding: isMobile ? "6px 8px" : "7px 11px",



  outline: "none",

  cursor: "pointer",

  letterSpacing: "0.2px",

fontFamily: "'Pretendard', sans-serif",

  margin: "0 1px",

  boxShadow: "0 4px 12px rgba(234,88,12,0.10)",

  transition: "background 0.15s, color 0.15s, transform 0.15s, box-shadow 0.15s",

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

const startButtonStyle = {

  ...buttonStyle,

  background: "#F97316",

  color: "#ffffff",

  border: "1px solid #F97316",

  boxShadow: "0 8px 18px rgba(249,115,22,0.26)",

};





const cardDescStyle = {

  color: "#475569",

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

    height: 5,

    background: "#F97316",

    borderRadius: "0 0 18px 18px",

    margin: 0,

    marginTop: "auto",

    boxShadow: "none",

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

const renderHomeActivityPanel = ({
  title,
  items,
  accentColor = "#F97316",
}) => {
  return (
    <aside
      className="home-activity-panel"
      style={{
        minWidth: 0,
        background: "#ffffff",
        border: "1px solid #fed7aa",
        borderRadius: 10,
        padding: "18px 18px 16px",
        boxSizing: "border-box",
        minHeight: 302,
        boxShadow: "0 12px 28px rgba(249,115,22,0.10)",
      }}
    >
      <h2
        style={{
          margin: "0 0 13px",
          color: accentColor,
          fontSize: 22,
          lineHeight: 1.25,
          fontWeight: 900,
          textAlign: "left",
          borderLeft: `4px solid ${accentColor}`,
          paddingLeft: 9,
        }}
      >
        {title}
      </h2>

      {items.length ? (
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {items.map(({ cup, time }) => {
            const titleText = getDisplayTitle(cup);

            return (
              <li key={`${title}-${cup.id}`}>
                <button
                  type="button"
                  onClick={() =>
                    goto(
                      `/${lang}/select-round/${cup.id}`
                    )
                  }
                  title={titleText}
                  style={{
                    width: "100%",
                    border: "1px solid #ffedd5",
                    borderRadius: 8,
                    background: "#fffaf7",
                    color: "#202534",
                    padding: "12px 12px",
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
                      fontSize: 16,
                      fontWeight: 900,
                    }}
                  >
                    {titleText}
                  </span>

                  <span
                    style={{
                      color: "#C2410C",
                      fontSize: 14,
                      fontWeight: 800,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatWorldcupCardDate(time)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p
          style={{
            margin: 0,
            color: "#64748b",
            fontSize: 14,
            lineHeight: 1.45,
            fontWeight: 700,
          }}
        >
          {sidePanelCopy.empty}
        </p>
      )}
    </aside>
  );
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

    <div

      key={cup.id}

      className="worldcup-card"

       style={{

        width: "100%",

        height: CARD_HEIGHT,

        borderRadius: 16,

        background: "#ffffff",

        boxShadow:

          "0 16px 38px rgba(15,23,42,0.11)",

        border: "1px solid #fed7aa",

        display: "flex",

        flexDirection: "column",

        position: "relative",

        overflow: "hidden",

        transition:

          "box-shadow 0.18s, transform 0.16s, border-color 0.18s",

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

          "0 22px 48px rgba(15,23,42,0.16)";

        e.currentTarget.style.borderColor =

          "#fb923c";

      }}

      onMouseLeave={(e) => {

        e.currentTarget.style.transform = "";



        e.currentTarget.style.boxShadow =

          "0 16px 38px rgba(15,23,42,0.11)";

        e.currentTarget.style.borderColor =

          "#fed7aa";

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

            "linear-gradient(135deg, #fff7ed 0%, #eef6ff 100%)",

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

            background: "#fff7ed",

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

              loading="lazy"

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



        <div

          style={{

            width: "50%",

            height: "100%",

            background: "#eef6ff",

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

              loading="lazy"

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

            ? "7px 11px 3px 11px"

            : "8px 15px 3px 15px",

          background: "#fff7ed",
          borderTop: "1px solid #ffedd5",
          borderBottom: "1px solid #ffedd5",

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

            color: "#111827",

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

        {getPopularCandidateLine(cup, winStats)}

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
          background: "#fffaf7",
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
          <strong style={{ color: "#C2410C" }}>
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


      {/* 버튼 */}

      <div

        style={{

          width: "100%",

          display: "flex",

          alignItems: "center",

          justifyContent:

            "space-between",

          padding: isMobile
            ? "9px 7px 7px 7px"
            : "12px 10px 8px 10px",
          minHeight:
            isMobile ? 38 : 42,
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

                "/stats",

                cup.id

              )

            );

          }}

          style={buttonStyle}

          onMouseOver={(e) =>

            (e.currentTarget.style.background =

              "#ffedd5")

          }

          onMouseOut={(e) =>

            (e.currentTarget.style.background =

              "#fff7ed")

          }

        >

          {t("stats_comment")}

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

                "/select-round",

                cup.id

              )

            );

          }}

          style={startButtonStyle}

          onMouseOver={(e) =>

            (e.currentTarget.style.background =

              "#ea580c")

          }

          onMouseOut={(e) =>

            (e.currentTarget.style.background =

              "#F97316")

          }

        >

          {t("start")}

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

      <div

        className={featured ? "home-category-heading" : undefined}

        style={{

          width: "100%",

          maxWidth: featured ? 1400 : "none",

          margin: featured ? "0 auto" : 0,

          padding: isMobile

            ? "0 14px 6px"

            : featured

              ? "0 24px 8px"

              : "0 20px 8px",

          boxSizing: "border-box",

          display: "flex",

          alignItems: "center",

          justifyContent: featured ? "center" : "flex-start",

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

        {!featured && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginLeft: isMobile ? 0 : 4,
            }}
          >
            <button
              type="button"
              onClick={() =>
                setCategorySort(
                  rowKey,
                  "popular"
                )
              }
              aria-pressed={
                getCategorySort(rowKey) ===
                "popular"
              }
              style={{
                border:
                  getCategorySort(rowKey) ===
                  "popular"
                    ? "1.5px solid #F97316"
                    : "1px solid #dde2ea",
                background:
                  getCategorySort(rowKey) ===
                  "popular"
                    ? "#F97316"
                    : "#ffffff",
                color:
                  getCategorySort(rowKey) ===
                  "popular"
                    ? "#ffffff"
                    : "#C2410C",
                borderRadius: 7,
                padding: isMobile
                  ? "5px 9px"
                  : "6px 11px",
                fontSize: isMobile
                  ? 13
                  : 14,
                fontWeight: 900,
                cursor: "pointer",
                lineHeight: 1.1,
                whiteSpace: "nowrap",
              }}
            >
              {t("popular")}
            </button>

            <button
              type="button"
              onClick={() =>
                setCategorySort(
                  rowKey,
                  "recent"
                )
              }
              aria-pressed={
                getCategorySort(rowKey) ===
                "recent"
              }
              style={{
                border:
                  getCategorySort(rowKey) ===
                  "recent"
                    ? "1.5px solid #F97316"
                    : "1px solid #dde2ea",
                background:
                  getCategorySort(rowKey) ===
                  "recent"
                    ? "#F97316"
                    : "#ffffff",
                color:
                  getCategorySort(rowKey) ===
                  "recent"
                    ? "#ffffff"
                    : "#C2410C",
                borderRadius: 7,
                padding: isMobile
                  ? "5px 9px"
                  : "6px 11px",
                fontSize: isMobile
                  ? 13
                  : 14,
                fontWeight: 900,
                cursor: "pointer",
                lineHeight: 1.1,
                whiteSpace: "nowrap",
              }}
            >
              {t("latest")}
            </button>
          </div>
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

      scrollCategoryRow(rowKey, -1, cups.length)

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

{(

  getRowVisibleCount(rowKey) < cups.length ||

  categoryScrollState[rowKey]?.canScrollRight

) && (

  <button

    type="button"

    aria-label="Scroll right"

    onClick={() =>

      scrollCategoryRow(rowKey, 1, cups.length)

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



  const keyword = normalizeSearchQuery(search);



  return cupMatchesSearch(cup, keyword, lang);

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



    cups: sortCategoryCups(
      filtered.filter(
        (cup) =>
          (cup.category || "etc") ===
          category.key
      ),
      category.key
    ),

  })

);



const visibleCategorySections = categorySections.filter(

  (section) => section.cups.length > 0

);



const shouldShowAllCategories =

  showMoreCategories ||

  Boolean(search.trim()) ||

  Boolean(creatorFilter) ||

  personalView;



const primaryCategorySections =

  visibleCategorySections.filter((section) =>

    PRIMARY_HOME_CATEGORY_KEYS.has(section.key)

  );



const deferredCategorySections =

  visibleCategorySections.filter((section) =>

    !PRIMARY_HOME_CATEGORY_KEYS.has(section.key)

  );



const renderedCategorySections = shouldShowAllCategories

  ? visibleCategorySections

  : primaryCategorySections;

const worldcupIntroDescription =
  lang === "ko"
    ? "이상형 월드컵을 만들고 플레이하는 원픽게임입니다. 아이돌, 애니, 게임, 영화, 음식 등 다양한 주제의 월드컵을 무료로 즐기고 공유해보세요."
    : t("gameModeNav.introLine2", {
        defaultValue:
          "Create and play tournament bracket games, tier lists, quizzes, and blind rankings on One Pick Game.",
      });

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



  renderedCategorySections.forEach(

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

  categorySorts,

  playCountMap,

  worldcupList,

  showMoreCategories,

  creatorFilter,

  personalView,

]);

return (

  <div className={`home-page${personalView ? " is-personal" : ""}`}

    style={{

      width: "100%",

      minHeight: "100vh",

      background: "linear-gradient(180deg, #fff7ed 0%, #ffffff 220px, #f8fafc 100%)",

      position: "relative",

    }}

  >





  <div
    className="home-top-layout"
    style={{
      width: "100%",
      maxWidth: useSideHomeActivityPanels ? 1900 : isMobile ? 430 : 1000,
      margin: "0 auto",
      padding: useSideHomeActivityPanels ? "0 32px" : isMobile ? "0 12px" : "0 16px",
      boxSizing: "border-box",
      display: useSideHomeActivityPanels ? "grid" : "block",
      gridTemplateColumns: useSideHomeActivityPanels
        ? "minmax(280px, 1fr) minmax(660px, 860px) minmax(280px, 1fr)"
        : undefined,
      gap: useSideHomeActivityPanels ? 28 : undefined,
      alignItems: useSideHomeActivityPanels ? "start" : undefined,
    }}
  >
    {useSideHomeActivityPanels && (
      <div style={{ paddingTop: 18 }}>
        {renderHomeActivityPanel({
          title: sidePanelCopy.recentCreated,
          items: recentCreatedCups,
          accentColor: "#EA580C",
        })}
      </div>
    )}

    <div style={{ minWidth: 0 }}>
      <PageIntro icon="🏆" title={t('gameModeNav.worldcup')} description={worldcupIntroDescription} buttonLabel={t('create_worldcup')} onCreate={() => onMakeWorldcup ? onMakeWorldcup() : goto(`/${lang}/worldcup-maker`)} personal={false} accentColor="#F97316" />

      {/* 언어 선택 / 검색 */}

      <div

        style={{

          width: "100%",

          maxWidth: isMobile ? 430 : 1000,

          margin: isMobile ? "4px auto 14px" : "6px auto 18px",

          padding: useSideHomeActivityPanels ? "0" : isMobile ? "0 12px" : "0 16px",

          boxSizing: "border-box",

        }}

      >

    {/* 언어 선택 - 다른 홈과 동일하게 박스 없이 검색창 위 */}

    <div

      style={{

        display: "flex",

        flexWrap: "wrap",

        gap: isMobile ? 8 : 10,

        justifyContent: "center",

        alignItems: "center",

        marginBottom: isMobile ? 10 : 12,

      }}

    >

      {LANGUAGES.map((item) => {

        const active = item.code === lang;



        return (

          <React.Fragment key={item.code}>

            {item.code === "de" && (

              <span

                aria-hidden="true"

                style={{ flexBasis: isMobile ? "100%" : 0, height: 0 }}

              />

            )}



            <button

              type="button"

              onClick={() => changeHomeLanguage(item.code)}

              aria-pressed={active}

              style={{

                border: active

                  ? "1.5px solid #F97316"

                  : "1px solid #fed7aa",

                background: active ? "#F97316" : "#fffaf7",

                color: active ? "#ffffff" : "#9A3412",

                borderRadius: 999,

                padding: isMobile ? "8px 12px" : "9px 15px",

                fontSize: isMobile ? 15 : 16,

                fontWeight: active ? 900 : 800,

                cursor: "pointer",

                lineHeight: 1.2,
                boxShadow: active
                  ? "0 8px 16px rgba(249,115,22,0.22)"
                  : "0 3px 10px rgba(234,88,12,0.08)",

              }}

            >

              {item.label}

            </button>

          </React.Fragment>

        );

      })}

    </div>



    {/* 검색 */}

    <div

      style={{

        width: "100%",

        maxWidth: 760,

        margin: "0 auto",

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

            height: isMobile ? 50 : 56,

            background: "#ffffff",

            color: "#202534",

            border: "1.5px solid #fb923c",

            borderRadius: 14,

            padding: isMobile ? "0 40px 0 13px" : "0 46px 0 16px",

            boxSizing: "border-box",

            fontSize: isMobile ? 16 : 19,

            fontWeight: 700,

            outline: "none",
            boxShadow: "0 12px 30px rgba(249,115,22,0.15)",

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

            right: isMobile ? 10 : 12,

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

      </div>

      {showHomeActivityPanels && !useSideHomeActivityPanels && (
        <div
          style={{
            width: "100%",
            maxWidth: 760,
            margin: "18px auto 0",
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 14,
          }}
        >
          {renderHomeActivityPanel({
            title: sidePanelCopy.recentCreated,
            items: recentCreatedCups,
            accentColor: "#EA580C",
          })}
          {renderHomeActivityPanel({
            title: sidePanelCopy.recentPlayed,
            items: recentPlayedCups,
            accentColor: "#7C3AED",
          })}
        </div>
      )}
    </div>

    {useSideHomeActivityPanels && (
      <div style={{ paddingTop: 18 }}>
        {renderHomeActivityPanel({
          title: sidePanelCopy.recentPlayed,
          items: recentPlayedCups,
          accentColor: "#7C3AED",
        })}
      </div>
    )}
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

<section
  aria-label={
    lang === "ko"
      ? "월드컵 카테고리 바로가기"
      : "Worldcup category shortcuts"
  }
  style={{
    width: "100%",
    maxWidth: 1400,
    margin: isMobile ? "2px auto 10px" : "4px auto 14px",
    padding: isMobile ? "0 14px" : "0 24px",
    boxSizing: "border-box",
  }}
>
  <div
    style={{
      display: "flex",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: isMobile ? 8 : 10,
    }}
  >
    {HOME_CATEGORY_SHORTCUT_KEYS.map((categoryKey) => {
      const category = HOME_CATEGORIES.find(
        (item) => item.key === categoryKey
      );

      if (!category) return null;

      return (
        <button
          key={category.key}
          type="button"
          onClick={() => goto(`/${lang}/category/${category.slug}`)}
          style={{
            minHeight: isMobile ? 36 : 40,
            padding: isMobile ? "8px 13px" : "9px 16px",
            borderRadius: 999,
            border: "1px solid #fed7aa",
            background: "#fff7ed",
            color: "#9A3412",
            fontSize: isMobile ? 14 : 15,
            fontWeight: 900,
            lineHeight: 1.15,
            cursor: "pointer",
            boxShadow: "0 5px 14px rgba(249,115,22,0.08)",
          }}
        >
          {lang === "ko"
            ? KO_HOME_CATEGORY_SHORTCUT_LABELS[category.key] ||
              t(`category_${category.key}`, {
                defaultValue: category.label,
              })
            : t(`category_${category.key}`, {
                defaultValue: category.label,
              })}
        </button>
      );
    })}
  </div>
</section>

{renderCategorySection({

  rowKey: "featured",

  title: t("category_featured", {

    defaultValue: "Featured",

  }),

  cups: featuredCups,

  featured: true,

})}



{/* 카테고리 */}

{renderedCategorySections.map((section, index) => (

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



{!shouldShowAllCategories && deferredCategorySections.length > 0 && (

  <div

    style={{

      width: "100%",

      display: "flex",

      justifyContent: "center",

      padding: isMobile ? "8px 16px 24px" : "14px 24px 34px",

      boxSizing: "border-box",

    }}

  >

    <button

      type="button"

      onClick={() => setShowMoreCategories(true)}

      style={{

        minWidth: isMobile ? 220 : 280,

        minHeight: 48,

        padding: isMobile ? "11px 18px" : "13px 24px",

        borderRadius: 12,

        border: "1.5px solid #F97316",

        background: "#ffffff",

        color: "#C2410C",

        fontSize: isMobile ? 16 : 18,

        fontWeight: 900,

        cursor: "pointer",

      }}

    >

      {t("show_more_categories", {

        defaultValue: "More categories",

      })} ↓

    </button>

  </div>

)}





{lang === "ko" && !personalView && (
  <section
    aria-label="이상형 월드컵 소개"
    style={{
      width: "100%",
      maxWidth: 1000,
      margin: isMobile ? "4px auto 30px" : "10px auto 44px",
      padding: isMobile ? "0 18px" : "0 24px",
      boxSizing: "border-box",
      color: "#202534",
    }}
  >
    <div
      style={{
        borderTop: "1px solid #fed7aa",
        paddingTop: isMobile ? 20 : 26,
      }}
    >
      <h2
        style={{
          margin: "0 0 10px",
          fontSize: isMobile ? 22 : 28,
          fontWeight: 900,
          lineHeight: 1.25,
          letterSpacing: 0,
        }}
      >
        이상형 월드컵이란?
      </h2>
      <p
        style={{
          margin: "0 0 14px",
          fontSize: isMobile ? 15 : 17,
          lineHeight: 1.75,
          color: "#475569",
          fontWeight: 700,
        }}
      >
        이상형 월드컵은 두 후보 중 더 마음에 드는 쪽을 선택하며 최종
        우승자를 고르는 토너먼트 게임입니다. 원픽게임에서는 아이돌,
        애니, 게임, 영화, 음식, 스포츠 등 다양한 주제의 이상형 월드컵을
        무료로 플레이하고 직접 만들 수 있습니다.
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
          gap: isMobile ? 10 : 14,
          marginTop: 18,
        }}
      >
        {[
          {
            title: "무료 이상형 월드컵 만들기",
            body:
              "사진과 후보 이름을 추가하면 나만의 월드컵을 만들고 링크로 공유할 수 있습니다.",
          },
          {
            title: "카테고리별 월드컵 탐색",
            body:
              "게임 월드컵, 애니 이상형 월드컵, 음식 이상형 월드컵처럼 관심 주제별로 찾을 수 있습니다.",
          },
          {
            title: "결과와 통계 확인",
            body:
              "플레이 후 우승 후보와 순위를 확인하고 다른 사람들의 선택과 비교할 수 있습니다.",
          },
        ].map((item) => (
          <article
            key={item.title}
            style={{
              border: "1px solid #fed7aa",
              borderRadius: 10,
              background: "#fffaf7",
              padding: isMobile ? "14px 14px" : "16px 16px",
              boxSizing: "border-box",
            }}
          >
            <h3
              style={{
                margin: "0 0 8px",
                fontSize: isMobile ? 16 : 18,
                fontWeight: 900,
                lineHeight: 1.3,
                color: "#9A3412",
              }}
            >
              {item.title}
            </h3>
            <p
              style={{
                margin: 0,
                fontSize: isMobile ? 14 : 15,
                lineHeight: 1.65,
                color: "#64748b",
                fontWeight: 700,
              }}
            >
              {item.body}
            </p>
          </article>
        ))}
      </div>
      <div
        style={{
          marginTop: 22,
          display: "grid",
          gap: 10,
        }}
      >
        {[
          {
            q: "로그인 없이 이상형 월드컵을 플레이할 수 있나요?",
            a: "네. 공개된 월드컵은 로그인 없이 바로 플레이할 수 있습니다.",
          },
          {
            q: "직접 월드컵을 만들 수 있나요?",
            a: "네. 월드컵 만들기에서 후보를 추가해 나만의 이상형 월드컵을 만들 수 있습니다.",
          },
          {
            q: "티어표나 퀴즈도 이용할 수 있나요?",
            a: "네. 원픽게임에서는 이상형 월드컵뿐 아니라 티어표와 퀴즈도 함께 만들고 즐길 수 있습니다.",
          },
        ].map((item) => (
          <details
            key={item.q}
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              background: "#ffffff",
              padding: isMobile ? "12px 13px" : "13px 15px",
            }}
          >
            <summary
              style={{
                cursor: "pointer",
                fontSize: isMobile ? 15 : 16,
                fontWeight: 900,
                color: "#202534",
              }}
            >
              {item.q}
            </summary>
            <p
              style={{
                margin: "9px 0 0",
                fontSize: isMobile ? 14 : 15,
                lineHeight: 1.65,
                color: "#64748b",
                fontWeight: 700,
              }}
            >
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </div>
  </section>
)}

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
