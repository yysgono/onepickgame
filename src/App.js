import "./i18n";
import "./App.css";
import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
  useParams,
} from "react-router-dom";
import { useTranslation } from "react-i18next";
import Header from "./components/Header";
import Home from "./components/Home";
import SelectRoundPage from "./components/SelectRoundPage";
import MatchPage from "./components/MatchPage";
import ResultPage from "./components/ResultPage";
import StatsPage from "./components/StatsPage";
import WorldcupMaker from "./components/WorldcupMaker";
import BackupPage from "./components/BackupPage";
import ManageWorldcup from "./components/ManageWorldcup";
import EditWorldcupPage from "./components/EditWorldcupPage";
import AdminBar from "./components/AdminBar";
import AdminDashboard from "./components/AdminDashboard";
import AdminStatsPage from "./components/AdminStatsPage";
import SignupBox from "./components/SignupBox";
import LoginBox from "./components/LoginBox";
import FindIdBox from "./components/FindIdBox";
import FindPwBox from "./components/FindPwBox";
import PrivacyPolicy from "./components/PrivacyPolicy";
import TermsOfService from "./components/TermsOfService";
import Footer from "./components/Footer";
import SuggestionsBoard from "./components/SuggestionsBoard";
import SEOManager from "./seo/SEOManager";
import AdGuard from "./ads/AdGuard";
import BlogPage from "./components/BlogPage";
import BlogPostPage from "./components/BlogPostPage";
import CategoryPage from "./components/CategoryPage";

import DePage from "./pages/de";
import EnPage from "./pages/en";
import EsPage from "./pages/es";
import FrPage from "./pages/fr";
import HiPage from "./pages/hi";
import IdPage from "./pages/id";
import JaPage from "./pages/ja";
import KoPage from "./pages/ko";
import PtPage from "./pages/pt";
import RuPage from "./pages/ru";
import ViPage from "./pages/vi";
import ZhPage from "./pages/zh";
import ArPage from "./pages/ar";
import BnPage from "./pages/bn";
import ThPage from "./pages/th";
import TrPage from "./pages/tr";

import {
  getWorldcupGames,
  deleteWorldcupGame,
  softDeleteWorldcupGame,
  getWorldcupGame,
} from "./utils/supabaseWorldcupApi";

import { supabase } from "./utils/supabaseClient";
import Seo from "./seo/Seo";

/* =====================================================
   모바일 여부
===================================================== */

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined"
      ? window.innerWidth <= 700
      : false
  );

  useEffect(() => {
    function onResize() {
      if (typeof window !== "undefined") {
        setIsMobile(window.innerWidth <= 700);
      }
    }

    window.addEventListener("resize", onResize);

    return () =>
      window.removeEventListener("resize", onResize);
  }, []);

  return isMobile;
}

/* =====================================================
   현재 언어를 포함한 URL 생성
===================================================== */

function getLangPath(i18n, path = "") {
  const lang = (i18n.language || "en").split("-")[0];

  if (path.startsWith("/")) {
    path = path.slice(1);
  }

  return `/${lang}${path ? "/" + path : ""}`;
}

/* =====================================================
   언어별 홈 페이지
===================================================== */

function LanguageWrapper(props) {
  const { lang } = useParams();
  const { i18n } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    const supportedLangs = [
      "ko",
      "en",
      "ru",
      "ja",
      "zh",
      "pt",
      "es",
      "fr",
      "id",
      "hi",
      "de",
      "vi",
      "ar",
      "bn",
      "th",
      "tr",
    ];

    if (!supportedLangs.includes(lang)) {
      navigate("/en", {
        replace: true,
      });

      return;
    }

    if (i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }
  }, [lang, i18n, navigate]);

  const homeProps = {
    ...props,
  };

  switch (lang) {
    case "ko":
      return <KoPage {...homeProps} />;

    case "en":
      return <EnPage {...homeProps} />;

    case "ru":
      return <RuPage {...homeProps} />;

    case "ja":
      return <JaPage {...homeProps} />;

    case "zh":
      return <ZhPage {...homeProps} />;

    case "pt":
      return <PtPage {...homeProps} />;

    case "es":
      return <EsPage {...homeProps} />;

    case "fr":
      return <FrPage {...homeProps} />;

    case "id":
      return <IdPage {...homeProps} />;

    case "hi":
      return <HiPage {...homeProps} />;

    case "de":
      return <DePage {...homeProps} />;

    case "vi":
      return <ViPage {...homeProps} />;

    case "ar":
      return <ArPage {...homeProps} />;

    case "bn":
      return <BnPage {...homeProps} />;

    case "th":
      return <ThPage {...homeProps} />;

    case "tr":
      return <TrPage {...homeProps} />;

    default:
      return <EnPage {...homeProps} />;
  }
}

/* =====================================================
   페이지 이동 시 스크롤 최상단
===================================================== */

function ScrollToTopOnRouteChange() {
  const location = useLocation();

  useEffect(() => {
    try {
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "manual";
      }
    } catch (e) {
      // 무시
    }

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });

    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [
    location.pathname,
    location.search,
    location.hash,
  ]);

  return null;
}

/* =====================================================
   APP
===================================================== */

function App() {
  useIsMobile();

  const [worldcupList, setWorldcupList] = useState([]);

  const { t, i18n } = useTranslation();

  const [user, setUser] = useState(null);

  const [isAdmin, setIsAdmin] = useState(false);

  const [nickname, setNickname] = useState("");

  const [nicknameLoading, setNicknameLoading] =
    useState(false);

  const [fixedWorldcupIds, setFixedWorldcupIds] =
    useState([]);

  const [fixedWorldcups, setFixedWorldcups] =
    useState([]);

  /* ===================================================
     로그인 사용자 + 프로필 확인
  =================================================== */

  useEffect(() => {
    let isMounted = true;

    async function fetchUserAndProfile() {
      setNicknameLoading(true);

      try {
        const { data, error } =
          await supabase.auth.getUser();

        if (error) {
          console.error(
            "사용자 정보 조회 실패:",
            error
          );
        }

        const currentUser = data?.user || null;

        if (isMounted) {
          setUser(currentUser);
        }

        if (currentUser) {
          const {
            data: profile,
            error: profileError,
          } = await supabase
            .from("profiles")
            .select("nickname")
            .eq("id", currentUser.id)
            .single();

          if (profileError) {
            console.error(
              "프로필 조회 실패:",
              profileError
            );
          }

          if (isMounted) {
            const currentNickname =
              profile?.nickname || "";

            setNickname(currentNickname);

            setIsAdmin(
              currentNickname === "admin"
            );
          }
        } else {
          if (isMounted) {
            setNickname("");
            setIsAdmin(false);
          }
        }
      } catch (error) {
        console.error(
          "사용자 확인 중 오류:",
          error
        );

        if (isMounted) {
          setUser(null);
          setNickname("");
          setIsAdmin(false);
        }
      } finally {
        if (isMounted) {
          setNicknameLoading(false);
        }
      }
    }

    fetchUserAndProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  /* ===================================================
     닉네임 변경
  =================================================== */

  function updateNickname(nick) {
    setNickname(nick);

    setIsAdmin(
      nick === "admin"
    );
  }

  /* ===================================================
     월드컵 목록 다시 가져오기
  =================================================== */

  const fetchWorldcups = async () => {
    try {
      const list =
        await getWorldcupGames();

      setWorldcupList(list);
    } catch (error) {
      console.error(
        "월드컵 목록 로딩 실패:",
        error
      );

      setWorldcupList([]);
    }
  };

  /* ===================================================
     월드컵 삭제

     관리자:
       실제 삭제 X
       deleted_at 설정
       → 관리자 휴지통

     일반 사용자:
       Storage 이미지 삭제
       DB 실제 삭제
  =================================================== */

  const handleWorldcupDelete = async (id) => {
    if (!id) {
      throw new Error(
        "월드컵 ID가 없습니다."
      );
    }

    console.log(
      "🔥 월드컵 삭제 요청:",
      {
        id,
        isAdmin,
        nickname,
        mode: isAdmin
          ? "SOFT_DELETE"
          : "PERMANENT_DELETE",
      }
    );

    if (isAdmin) {
      await softDeleteWorldcupGame(id);

      console.log(
        "🗑️ 관리자 삭제 → 휴지통 이동 완료:",
        id
      );
    } else {
      await deleteWorldcupGame(id);

      console.log(
        "❌ 사용자 월드컵 영구삭제 완료:",
        id
      );
    }

    await fetchWorldcups();

    return true;
  };

  /* ===================================================
     최초 월드컵 로딩
  =================================================== */

  useEffect(() => {
    fetchWorldcups();
  }, []);

  /* ===================================================
     운영자 PICK ID 로딩
  =================================================== */

  useEffect(() => {
    async function fetchFixedWorldcups() {
      try {
        const {
          data,
          error,
        } = await supabase
          .from("fixed_worldcups")
          .select("worldcup_id")
          .order("id", {
            ascending: true,
          });

        if (error) {
          console.error(
            "운영자 PICK 조회 실패:",
            error
          );

          setFixedWorldcupIds([]);
          return;
        }

        if (Array.isArray(data)) {
          setFixedWorldcupIds(
            data.map((d) =>
              String(d.worldcup_id)
            )
          );
        } else {
          setFixedWorldcupIds([]);
        }
      } catch (error) {
        console.error(
          "운영자 PICK 조회 오류:",
          error
        );

        setFixedWorldcupIds([]);
      }
    }

    fetchFixedWorldcups();
  }, []);

  /* ===================================================
     운영자 PICK 실제 월드컵 데이터 구성
  =================================================== */

  useEffect(() => {
    if (
      !worldcupList.length ||
      !fixedWorldcupIds.length
    ) {
      setFixedWorldcups([]);
      return;
    }

    const fixeds =
      fixedWorldcupIds
        .map((id) =>
          worldcupList.find(
            (cup) =>
              String(cup.id) ===
              String(id)
          )
        )
        .filter(Boolean);

    setFixedWorldcups(fixeds);
  }, [
    worldcupList,
    fixedWorldcupIds,
  ]);

 

  /* ===================================================
     언어 변경
  =================================================== */

  function handleLangChange(
    lng,
    _options
  ) {
    i18n.changeLanguage(lng);

    localStorage.setItem(
      "onepickgame_lang",
      lng
    );
  }
    /* ===================================================
     백업
  =================================================== */

  function handleBackup() {
    const data =
      JSON.stringify(
        worldcupList || []
      );

    const blob =
      new Blob([data], {
        type: "application/json",
      });

    const url =
      URL.createObjectURL(blob);

    const a =
      document.createElement("a");

    a.href = url;

    a.download =
      `worldcup_backup_${Date.now()}.json`;

    a.click();

    URL.revokeObjectURL(url);
  }

  /* ===================================================
     복구
     현재는 프론트 목록만 복원
     DB에는 직접 반영하지 않음
  =================================================== */

  function handleRestore(e) {
    const file =
      e.target.files[0];

    if (!file) return;

    const reader =
      new FileReader();

    reader.onload = function (ev) {
      try {
        const data =
          JSON.parse(
            ev.target.result
          );

        if (
          !Array.isArray(data)
        ) {
          throw new Error(
            "Invalid format"
          );
        }

        setWorldcupList(data);

        alert(
          t("restore_success") ||
            "Restore successful! (Front-end only, DB not affected)"
        );
      } catch (error) {
        console.error(
          "복구 실패:",
          error
        );

        alert(
          t("restore_fail") ||
            "Restore failed!"
        );
      }
    };

    reader.readAsText(file);

    e.target.value = "";
  }

  /* ===================================================
     내가 만든 월드컵
  =================================================== */

  function MyWorldcupsWrapper() {
    const navigate =
      useNavigate();

    const myId =
      user?.id;

    const myList =
      worldcupList.filter(
        (w) =>
          w.owner === myId ||
          w.creator === myId ||
          w.creator_id === myId
      );

    return (
      <Home
        worldcupList={myList}
        fetchWorldcups={
          fetchWorldcups
        }
        onSelect={(cup) => {
          navigate(
            getLangPath(
              i18n,
              `select-round/${cup.id}`
            )
          );
        }}
        user={user}
        nickname={nickname}
        isAdmin={isAdmin}
        showFixedWorldcups={
          false
        }
        onDelete={async (id) => {
          try {
            await handleWorldcupDelete(
              id
            );
          } catch (e) {
            console.error(
              "삭제 실패:",
              e
            );

            alert(
              (t(
                "delete_failed"
              ) ||
                "Delete failed!") +
                " " +
                (e.message || e)
            );
          }
        }}
      />
    );
  }

  /* ===================================================
     최근 본 월드컵
  =================================================== */

  function RecentWorldcupsWrapper() {
    const navigate =
      useNavigate();

    let recents = [];

    try {
      recents =
        JSON.parse(
          localStorage.getItem(
            "onepickgame_recentWorldcups"
          ) || "[]"
        );
    } catch (error) {
      console.error(
        "최근 월드컵 목록 파싱 실패:",
        error
      );
    }

    recents = recents
      .reverse()
      .filter(
        (id, i, arr) =>
          arr.indexOf(id) === i
      );

    const recentCups =
      recents
        .map((id) =>
          worldcupList.find(
            (w) =>
              String(w.id) ===
              String(id)
          )
        )
        .filter(Boolean);

    return (
      <Home
        worldcupList={
          recentCups
        }
        fetchWorldcups={
          fetchWorldcups
        }
        onSelect={(cup) => {
          navigate(
            getLangPath(
              i18n,
              `select-round/${cup.id}`
            )
          );
        }}
        user={user}
        nickname={nickname}
        isAdmin={isAdmin}
        showFixedWorldcups={
          false
        }
        onDelete={async (id) => {
          try {
            await handleWorldcupDelete(
              id
            );
          } catch (e) {
            console.error(
              "삭제 실패:",
              e
            );

            alert(
              (t(
                "delete_failed"
              ) ||
                "Delete failed!") +
                " " +
                (e.message || e)
            );
          }
        }}
      />
    );
  }

  /* ===================================================
     통계 페이지
  =================================================== */

  function StatsPageWrapper() {
    const { id } =
      useParams();

    const { t } =
      useTranslation();

    const [
      cup,
      setCup,
    ] = useState(null);

    const [
      loading,
      setLoading,
    ] = useState(true);

    useEffect(() => {
      let mounted = true;

      async function fetchCup() {
        setLoading(true);

        let found =
          worldcupList.find(
            (c) =>
              String(c.id) ===
              String(id)
          );

        if (found) {
          if (mounted) {
            setCup(found);
            setLoading(false);
          }

          return;
        }

        try {
          const data =
            await getWorldcupGame(
              id
            );

          if (mounted) {
            setCup(data);
            setLoading(false);
          }
        } catch (error) {
          console.error(
            "통계용 월드컵 조회 실패:",
            error
          );

          if (mounted) {
            setCup(null);
            setLoading(false);
          }
        }
      }

      fetchCup();

      return () => {
        mounted = false;
      };
    }, [
      id,
      worldcupList,
    ]);

    if (loading) {
      return (
        <div
          style={{
            padding: 60,
            textAlign: "center",
          }}
        >
          {t("loading")}
        </div>
      );
    }

    if (!cup) {
      return (
        <div
          style={{
            padding: 60,
            textAlign: "center",
            color: "#d33",
          }}
        >
          {t(
            "error_no_data"
          )}
        </div>
      );
    }

    return (
      <StatsPage
        selectedCup={cup}
        showCommentBox={
          true
        }
      />
    );
  }

  /* ===================================================
     앱 라우트
  =================================================== */

  function AppRoutes() {
    const navigate =
      useNavigate();

    const location =
      useLocation();

    const { i18n } =
      useTranslation();

    const langMatch =
      location.pathname.match(
        /^\/([a-z]{2})(\/|$)/
      );

    const currentLang =
      (
        langMatch
          ? langMatch[1]
          : i18n.language || "en"
      ).split("-")[0];

    const titleMap = {
      en: "Bracket Game | Ideal Type World Cup | One Pick Game",
      ko: "이상형 월드컵 | One Pick Game",
      ja: "トーナメントゲーム | One Pick Game",
      fr: "Tournoi de Vote | One Pick Game",
      es: "Torneo de Votación | One Pick Game",
      de: "Abstimmungsturnier | One Pick Game",
      pt: "Torneio de Votação | One Pick Game",
      ru: "Турнир голосований | One Pick Game",
      id: "Turnamen Voting | One Pick Game",
      hi: "वोटिंग टूर्नामेंट | One Pick Game",
      vi: "Giải đấu bình chọn | One Pick Game",
      zh: "淘汰赛游戏 | One Pick Game",
      ar: "بطولة التصويت | One Pick Game",
      bn: "ভোটিং টুর্নামেন্ট | One Pick Game",
      th: "เกมโหวตแบบทัวร์นาเมนต์ | One Pick Game",
      tr: "Turnuva Oyunu | One Pick Game",
    };

const descMap = {
  en: "Create and play tournament bracket games on One Pick Game. Vote for your favorites, build your own brackets, and discover community rankings.",

  ko: "이상형 월드컵을 만들고 다양한 토너먼트 게임을 플레이해보세요. 좋아하는 후보를 선택하고 직접 월드컵을 만들며 인기 순위도 확인할 수 있습니다.",

  ja: "投票トーナメントを作成してプレイしよう。お気に入りを選んで対戦を楽しみ、自分だけのトーナメントを作成したり、人気ランキングをチェックできます。",

  zh: "创建并游玩投票淘汰赛，选择你最喜欢的候选项进行对决，还可以创建自己的比赛并查看社区人气排名。",

  es: "Crea y juega torneos de votación en One Pick Game. Elige tus favoritos, crea tus propios torneos y descubre los rankings de la comunidad.",

  fr: "Créez et jouez à des tournois de vote sur One Pick Game. Choisissez vos favoris, créez vos propres tournois et découvrez les classements de la communauté.",

  de: "Erstelle und spiele Abstimmungsturniere auf One Pick Game. Wähle deine Favoriten, erstelle eigene Turniere und entdecke die Ranglisten der Community.",

  pt: "Crie e jogue torneios de votação no One Pick Game. Escolha seus favoritos, monte seus próprios torneios e descubra os rankings da comunidade.",

  ru: "Создавайте и играйте в турниры с голосованием на One Pick Game. Выбирайте фаворитов, создавайте собственные турниры и смотрите рейтинги сообщества.",

  id: "Buat dan mainkan turnamen voting di One Pick Game. Pilih favoritmu, buat turnamen sendiri, dan lihat peringkat komunitas.",

  hi: "One Pick Game पर वोटिंग टूर्नामेंट बनाएं और खेलें। अपने पसंदीदा विकल्प चुनें, अपना टूर्नामेंट बनाएं और कम्युनिटी रैंकिंग देखें।",

  vi: "Tạo và chơi các giải đấu bình chọn trên One Pick Game. Chọn mục yêu thích, tạo giải đấu của riêng bạn và khám phá bảng xếp hạng cộng đồng.",

  ar: "أنشئ والعب بطولات التصويت على One Pick Game. اختر مفضلاتك، وأنشئ بطولاتك الخاصة، واكتشف تصنيفات المجتمع.",

  bn: "One Pick Game-এ ভোটিং টুর্নামেন্ট তৈরি করুন ও খেলুন। আপনার পছন্দের প্রতিযোগী বেছে নিন, নিজের টুর্নামেন্ট তৈরি করুন এবং কমিউনিটি র‍্যাঙ্কিং দেখুন।",

  th: "สร้างและเล่นเกมโหวตแบบทัวร์นาเมนต์บน One Pick Game เลือกรายการโปรด สร้างทัวร์นาเมนต์ของคุณเอง และดูอันดับยอดนิยมจากชุมชน",

  tr: "One Pick Game'de oylama turnuvaları oluştur ve oyna. Favorilerini seç, kendi turnuvanı oluştur ve topluluk sıralamalarını keşfet.",
};

    /* ===============================================
       월드컵 만들기
    =============================================== */

function handleMakeWorldcup() {
  navigate(
    `/${currentLang}/worldcup-maker`
  );
}

    /* ===============================================
       메인 홈
    =============================================== */

    function HomeWrapper() {
      return (
        <Home
          worldcupList={
            worldcupList
          }
          fetchWorldcups={
            fetchWorldcups
          }
          onSelect={(cup) => {
            let recent = [];

            try {
              recent =
                JSON.parse(
                  localStorage.getItem(
                    "onepickgame_recentWorldcups"
                  ) || "[]"
                );
            } catch (error) {
              console.error(
                "최근 목록 파싱 실패:",
                error
              );
            }

            localStorage.setItem(
              "onepickgame_recentWorldcups",
              JSON.stringify(
                [
                  cup.id,
                  ...recent.filter(
                    (id) =>
                      id !== cup.id
                  ),
                ].slice(
                  0,
                  30
                )
              )
            );

            navigate(
              getLangPath(
                i18n,
                `select-round/${cup.id}`
              )
            );
          }}
          onMakeWorldcup={
            handleMakeWorldcup
          }
          onDelete={async (id) => {
            try {
              await handleWorldcupDelete(
                id
              );
            } catch (e) {
              console.error(
                "홈 삭제 실패:",
                e
              );

              alert(
                (t(
                  "delete_failed"
                ) ||
                  "Delete failed!") +
                  " " +
                  (e.message || e)
              );
            }
          }}
          user={user}
          nickname={nickname}
          isAdmin={isAdmin}
          fixedWorldcups={
            fixedWorldcups
          }
        />
      );
    }

    /* ===============================================
       라운드 선택
    =============================================== */

    function SelectRoundPageWrapper() {
      const {
        id,
        lang = "en",
      } = useParams();

      const cup =
        worldcupList.find(
          (c) =>
            String(c.id) ===
            String(id)
        );

      if (!cup) {
        return (
          <div
            style={{
              minHeight: "60vh",
              display: "flex",
              alignItems: "center",
              justifyContent:
                "center",
              color: "#fff",
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            {t("loading") ||
              "Loading..."}
          </div>
        );
      }

      const normalizedLang =
        String(
          lang || "en"
        )
          .toLowerCase()
          .split("-")[0];

 const translatedTitle =
  cup?.title_translations?.[normalizedLang] ||
  cup?.title_translations?.en ||
  cup?.title ||
  "";

const worldCupKeywordMap = {
  ko: "이상형 월드컵",
  en: "Ideal Type World Cup",
  ja: "人気投票トーナメント",
  zh: "人气投票淘汰赛",
  es: "Torneo de Votación",
  fr: "Tournoi de Vote",
  de: "Abstimmungsturnier",
  pt: "Torneio de Votação",
  ru: "Турнир голосований",
  id: "Turnamen Voting",
  hi: "वोटिंग टूर्नामेंट",
  vi: "Giải đấu bình chọn",
  ar: "بطولة التصويت",
  bn: "ভোটিং টুর্নামেন্ট",
  th: "เกมโหวตแบบทัวร์นาเมนต์",
  tr: "Oylama Turnuvası",
};

const worldCupKeyword =
  worldCupKeywordMap[normalizedLang] ||
  worldCupKeywordMap.en;

const cleanEnglishTitle = translatedTitle
  .replace(/\s+(Bracket|Tournament)$/i, "")
  .trim();

const pageSeoTitle =
  normalizedLang === "en"
    ? `${cleanEnglishTitle} Tournament Bracket Game | Ideal Type World Cup | OnePickGame`
    : normalizedLang === "ko"
      ? `${worldCupKeyword} - ${translatedTitle} | 원픽게임`
      : `${worldCupKeyword} - ${translatedTitle} | OnePickGame`;
     const savedDescription =
  cup?.description_translations?.[normalizedLang] ||
  cup?.description_translations?.en ||
  cup?.description ||
  cup?.desc ||
  "";

const descriptionFallbackMap = {
  ko: `${translatedTitle} 이상형 월드컵을 원픽게임에서 플레이하세요. 좋아하는 후보를 선택하고 최종 우승자를 확인해보세요.`,

  en: `Play the ${cleanEnglishTitle} tournament bracket game on OnePickGame. Choose your favorites and find the ultimate winner.`,

  ja: `${translatedTitle}の人気投票トーナメントをOnePickGameでプレイしよう。お気に入りを選んで、最後の勝者を決めよう。`,

  zh: `在OnePickGame参加${translatedTitle}人气投票淘汰赛。选择你最喜欢的候选项，看看谁能成为最终赢家。`,

  es: `Juega el torneo de votación ${translatedTitle} en OnePickGame. Elige tus favoritos y descubre quién será el ganador final.`,

  fr: `Jouez au tournoi de vote ${translatedTitle} sur OnePickGame. Choisissez vos favoris et découvrez le grand gagnant.`,

  de: `Spiele das ${translatedTitle} Abstimmungsturnier auf OnePickGame. Wähle deine Favoriten und finde den endgültigen Gewinner.`,

  pt: `Jogue o torneio de votação ${translatedTitle} no OnePickGame. Escolha seus favoritos e descubra o grande vencedor.`,

  ru: `Играйте в турнир голосований ${translatedTitle} на OnePickGame. Выбирайте фаворитов и определите итогового победителя.`,

  id: `Mainkan turnamen voting ${translatedTitle} di OnePickGame. Pilih favoritmu dan temukan pemenang akhirnya.`,

  hi: `OnePickGame पर ${translatedTitle} वोटिंग टूर्नामेंट खेलें। अपने पसंदीदा विकल्प चुनें और अंतिम विजेता का फैसला करें।`,

  vi: `Chơi giải đấu bình chọn ${translatedTitle} trên OnePickGame. Chọn mục yêu thích và tìm ra người chiến thắng cuối cùng.`,

  ar: `العب بطولة التصويت ${translatedTitle} على OnePickGame. اختر مفضلاتك واكتشف الفائز النهائي.`,

  bn: `OnePickGame-এ ${translatedTitle} ভোটিং টুর্নামেন্ট খেলুন। আপনার পছন্দের প্রতিযোগী বেছে নিন এবং চূড়ান্ত বিজয়ী নির্ধারণ করুন।`,

  th: `เล่นเกมโหวตแบบทัวร์นาเมนต์ ${translatedTitle} บน OnePickGame เลือกรายการโปรดและค้นหาผู้ชนะสุดท้าย`,

  tr: `OnePickGame'de ${translatedTitle} oylama turnuvasını oyna. Favorilerini seç ve final kazananını belirle.`,
};

const translatedDescription =
  savedDescription ||
  descriptionFallbackMap[normalizedLang] ||
  descriptionFallbackMap.en;
      return (
        <>
          <Seo
            lang={
              normalizedLang
            }
            slug={`select-round/${cup.id}`}
       title={pageSeoTitle}
            description={
              translatedDescription
            }
            image={
              cup.thumbnail ||
              cup.image ||
              cup.data?.[0]
                ?.image ||
              "/onepick-social.png"
            }
          />

          <SelectRoundPage
            cup={cup}
            maxRound={
              cup.data.length
            }
            candidates={
              cup.data
            }
            onSelect={(
              roundOrCandidate
            ) => {
              if (
                typeof roundOrCandidate ===
                "number"
              ) {
                navigate(
                  getLangPath(
                    i18n,
                    `match/${cup.id}/${roundOrCandidate}`
                  )
                );
              } else if (
                typeof roundOrCandidate ===
                  "object" &&
                roundOrCandidate?.id
              ) {
                navigate(
                  getLangPath(
                    i18n,
                    `match/${cup.id}/${cup.data.length}`
                  )
                );
              }
            }}
          />
        </>
      );
    }
        /* ===============================================
       월드컵 만들기 래퍼
    =============================================== */

    function WorldcupMakerWrapper() {
  const navigate =
    useNavigate();

  const makerTitleMap = {
  en: "Create a Tournament Bracket Game | OnePickGame",
  ko: "이상형 월드컵 만들기 | 원픽게임",
  ja: "投票トーナメントを作成 | OnePickGame",
  zh: "创建投票淘汰赛 | OnePickGame",
  es: "Crear un Torneo de Votación | OnePickGame",
  fr: "Créer un Tournoi de Vote | OnePickGame",
  de: "Abstimmungsturnier erstellen | OnePickGame",
  pt: "Criar um Torneio de Votação | OnePickGame",
  ru: "Создать турнир с голосованием | OnePickGame",
  id: "Buat Turnamen Voting | OnePickGame",
  hi: "वोटिंग टूर्नामेंट बनाएं | OnePickGame",
  vi: "Tạo Giải Đấu Bình Chọn | OnePickGame",
  ar: "إنشاء بطولة تصويت | OnePickGame",
  bn: "ভোটিং টুর্নামেন্ট তৈরি করুন | OnePickGame",
  th: "สร้างเกมโหวตแบบทัวร์นาเมนต์ | OnePickGame",
  tr: "Oylama Turnuvası Oluştur | OnePickGame",
};

const makerDescMap = {
  en: "Create your own tournament bracket game on OnePickGame. Add candidates, build matchups, share your bracket, and let players vote for their favorites.",

  ko: "나만의 이상형 월드컵을 만들어보세요. 후보를 추가하고 대진을 구성해 공유한 뒤, 다른 사용자들과 함께 좋아하는 후보를 선택할 수 있습니다.",

  ja: "自分だけの投票トーナメントを作成できます。候補を追加して対戦を組み、共有してみんなでお気に入りに投票しましょう。",

  zh: "创建属于自己的投票淘汰赛。添加候选项、生成对战、分享比赛，并让大家为喜欢的候选项投票。",

  es: "Crea tu propio torneo de votación. Añade candidatos, organiza enfrentamientos, comparte el torneo y deja que los jugadores voten por sus favoritos.",

  fr: "Créez votre propre tournoi de vote. Ajoutez des candidats, organisez les duels, partagez le tournoi et laissez les joueurs voter pour leurs favoris.",

  de: "Erstelle dein eigenes Abstimmungsturnier. Füge Kandidaten hinzu, erstelle Duelle, teile das Turnier und lass Spieler für ihre Favoriten abstimmen.",

  pt: "Crie seu próprio torneio de votação. Adicione candidatos, monte os confrontos, compartilhe o torneio e deixe os jogadores votarem em seus favoritos.",

  ru: "Создайте собственный турнир с голосованием. Добавляйте участников, составляйте пары, делитесь турниром и голосуйте за любимых участников.",

  id: "Buat turnamen voting milikmu sendiri. Tambahkan kandidat, susun pertandingan, bagikan turnamen, dan biarkan pemain memilih favorit mereka.",

  hi: "अपना वोटिंग टूर्नामेंट बनाएं। प्रतियोगियों को जोड़ें, मुकाबले तैयार करें, टूर्नामेंट शेयर करें और खिलाड़ियों को अपने पसंदीदा विकल्प के लिए वोट करने दें।",

  vi: "Tạo giải đấu bình chọn của riêng bạn. Thêm ứng viên, tạo các cặp đấu, chia sẻ giải đấu và để người chơi bình chọn cho mục yêu thích.",

  ar: "أنشئ بطولة تصويت خاصة بك. أضف المتسابقين، وأنشئ المواجهات، وشارك البطولة، ودع اللاعبين يصوتون لمفضلاتهم.",

  bn: "নিজের ভোটিং টুর্নামেন্ট তৈরি করুন। প্রতিযোগী যোগ করুন, ম্যাচআপ তৈরি করুন, টুর্নামেন্ট শেয়ার করুন এবং খেলোয়াড়দের পছন্দের প্রতিযোগীকে ভোট দিতে দিন।",

  th: "สร้างเกมโหวตแบบทัวร์นาเมนต์ของคุณเอง เพิ่มผู้เข้าแข่งขัน จัดคู่การแข่งขัน แชร์ทัวร์นาเมนต์ และให้ผู้เล่นโหวตตัวเลือกที่ชื่นชอบ",

  tr: "Kendi oylama turnuvanı oluştur. Adayları ekle, eşleşmeleri hazırla, turnuvayı paylaş ve oyuncuların favorilerine oy vermesini sağla.",
};

  return (
    <>
      <Seo
        lang={currentLang}
        slug="worldcup-maker"
        title={
          makerTitleMap[currentLang] ||
          makerTitleMap.en
        }
        description={
          makerDescMap[currentLang] ||
          makerDescMap.en
        }
        indexable={true}
      />

      <WorldcupMaker
        fetchWorldcups={
          fetchWorldcups
        }
        onCreate={() => {
          navigate(
            getLangPath(
              i18n
            )
          );
        }}
        onCancel={() =>
          navigate(
            getLangPath(
              i18n
            )
          )
        }
        user={user}
        nickname={
          nickname
        }
      />
    </>
  );
}

    /* ===============================================
       월드컵 관리 래퍼
    =============================================== */

    function ManageWorldcupWrapper() {
      return (
        <ManageWorldcup
          user={user}
          isAdmin={
            isAdmin
          }
          worldcupList={
            worldcupList
          }
          setWorldcupList={
            setWorldcupList
          }
        />
      );
    }

    /* ===============================================
       월드컵 수정 래퍼
    =============================================== */

    function EditWorldcupPageWrapper() {
      const { id } =
        useParams();

      return (
        <EditWorldcupPage
          worldcupList={
            worldcupList
          }
          fetchWorldcups={
            fetchWorldcups
          }
          cupId={id}
          user={user}
          nickname={
            nickname
          }
          isAdmin={
            isAdmin
          }
        />
      );
    }

    /* ===============================================
       관리자 대시보드
    =============================================== */

    function AdminRoute() {
      if (
        nicknameLoading
      ) {
        return (
          <div
            style={{
              padding: 60,
              textAlign:
                "center",
              fontWeight:
                700,
              fontSize: 22,
            }}
          >
            Loading...
          </div>
        );
      }

      if (!isAdmin) {
        return (
          <div
            style={{
              padding: 60,
              textAlign:
                "center",
              fontWeight:
                700,
              fontSize: 22,
            }}
          >
            {t(
              "admin_only"
            ) ||
              "Admins only."}

            <br />

            {t(
              "login_with_admin"
            ) ||
              "Please log in as admin."}
          </div>
        );
      }

      return (
        <>
          <AdminBar
            adminName={
              nickname
            }
            onLogout={() => {
              supabase.auth
                .signOut()
                .then(() => {
                  window.location.href =
                    getLangPath(
                      i18n
                    );
                });
            }}
          />

          <AdminDashboard />
        </>
      );
    }

    /* ===============================================
       관리자 통계
    =============================================== */

    function AdminStatsRoute() {
      if (
        nicknameLoading
      ) {
        return (
          <div
            style={{
              padding: 60,
              textAlign:
                "center",
              fontWeight:
                700,
              fontSize: 22,
            }}
          >
            Loading...
          </div>
        );
      }

      if (!isAdmin) {
        return (
          <div
            style={{
              padding: 60,
              textAlign:
                "center",
              fontWeight:
                700,
              fontSize: 22,
            }}
          >
            {t(
              "admin_only"
            ) ||
              "Admins only."}

            <br />

            {t(
              "login_with_admin"
            ) ||
              "Please log in as admin."}
          </div>
        );
      }

      return (
        <>
          <AdminBar
            adminName={
              nickname
            }
            onLogout={() => {
              supabase.auth
                .signOut()
                .then(() => {
                  window.location.href =
                    getLangPath(
                      i18n
                    );
                });
            }}
          />

          <AdminStatsPage />
        </>
      );
    }

    /* ===============================================
       구 stats 주소 → result로 이동
    =============================================== */

    function RedirectStatsToResult() {
      const {
        lang,
        id,
      } = useParams();

      return (
        <Navigate
          to={`/${lang}/result/${id}`}
          replace
        />
      );
    }

    /* ===============================================
       ROUTES
    =============================================== */

    return (
      <>
        <SEOManager />

        <div
          className="header-wrapper"
          style={{
            margin: 0,
            padding: 0,
          }}
        >
          <Header
            onLangChange={
              handleLangChange
            }
            onBackup={
              handleBackup
            }
            onRestore={
              handleRestore
            }
            onMakeWorldcup={
              handleMakeWorldcup
            }
            isAdmin={
              isAdmin
            }
            user={user}
            nickname={
              nickname
            }
            nicknameLoading={
              nicknameLoading
            }
            setUser={
              setUser
            }
            setNickname={
              updateNickname
            }
          />
        </div>

<AdGuard
  isAdmin={
    isAdmin
  }
/>

        <div className="main-content-box">
          <Routes>
            <Route
              path="/privacy-policy"
              element={
                <PrivacyPolicy />
              }
            />

            <Route
              path="/terms-of-service"
              element={
                <TermsOfService />
              }
            />

            <Route
              path="/suggestions-board"
              element={
                <SuggestionsBoard
                  user={
                    user
                  }
                  isAdmin={
                    isAdmin
                  }
                />
              }
            />

            <Route
              path="/signup"
              element={
                <Navigate
                  to="/en/signup"
                  replace
                />
              }
            />

            <Route
              path="/find-id"
              element={
                <Navigate
                  to="/en/find-id"
                  replace
                />
              }
            />

            <Route
              path="/find-pw"
              element={
                <Navigate
                  to="/en/find-pw"
                  replace
                />
              }
            />

            <Route
              path="/:lang/blog"
              element={
                <BlogPage />
              }
            />

<Route
  path="/:lang/blog/:slug"
  element={
    <BlogPostPage />
  }
/>

<Route
  path="/:lang/category/:categorySlug"
  element={
<CategoryPage
  worldcupList={worldcupList}
  onDelete={handleWorldcupDelete}
  user={user}
  isAdmin={isAdmin}
/>
  }
/>

<Route
  path="/:lang"
  element={
                <>
                                    <LanguageWrapper
                    worldcupList={
                      worldcupList
                    }
                    fetchWorldcups={
                      fetchWorldcups
                    }
                    onMakeWorldcup={
                      handleMakeWorldcup
                    }
                    onDelete={async (
                      id
                    ) => {
                      try {
                        await handleWorldcupDelete(
                          id
                        );
                      } catch (e) {
                        console.error(
                          "언어 홈 삭제 실패:",
                          e
                        );

                        alert(
                          (t(
                            "delete_failed"
                          ) ||
                            "Delete failed!") +
                            " " +
                            (e.message ||
                              e)
                        );
                      }
                    }}
                    user={
                      user
                    }
                    nickname={
                      nickname
                    }
                    isAdmin={
                      isAdmin
                    }
                    fixedWorldcups={
                      fixedWorldcups
                    }
                  />
                </>
              }
            />

{/* ID 없는 잘못된 게임 URL → 해당 언어 홈으로 이동 */}
<Route
  path="/:lang/select-round"
  element={<Navigate to=".." replace relative="path" />}
/>

<Route
  path="/:lang/result"
  element={<Navigate to=".." replace relative="path" />}
/>

            <Route
              path="/:lang/select-round/:id"
              element={
                <SelectRoundPageWrapper />
              }
            />

            <Route
              path="/:lang/match/:id/:round"
              element={
                <MatchPage
                  worldcupList={
                    worldcupList
                  }
                />
              }
            />

            <Route
              path="/:lang/result/:id"
              element={
                <ResultPage
                  worldcupList={
                    worldcupList
                  }
                />
              }
            />

            <Route
              path="/:lang/result/:id/:round"
              element={
                <ResultPage
                  worldcupList={
                    worldcupList
                  }
                />
              }
            />

            <Route
              path="/:lang/stats/:id"
              element={
                <RedirectStatsToResult />
              }
            />

            <Route
              path="/:lang/worldcup-maker"
              element={
                <WorldcupMakerWrapper />
              }
            />

            <Route
              path="/:lang/manage"
              element={
                <ManageWorldcupWrapper />
              }
            />

            <Route
              path="/:lang/backup"
              element={
                <BackupPage
                  worldcupList={
                    worldcupList
                  }
                  setWorldcupList={
                    setWorldcupList
                  }
                />
              }
            />

            <Route
              path="/:lang/edit-worldcup/:id"
              element={
                <EditWorldcupPageWrapper />
              }
            />
                        <Route
              path="/:lang/admin"
              element={
                <AdminRoute />
              }
            />

            <Route
              path="/:lang/admin-stats"
              element={
                <AdminStatsRoute />
              }
            />

            <Route
              path="/:lang/signup"
              element={
                <SignupBox />
              }
            />

            <Route
              path="/:lang/login"
              element={
                <LoginBox
                  setUser={
                    setUser
                  }
                  setNickname={
                    updateNickname
                  }
                />
              }
            />

            <Route
              path="/:lang/find-id"
              element={
                <FindIdBox />
              }
            />

            <Route
              path="/:lang/find-pw"
              element={
                <FindPwBox />
              }
            />

            <Route
              path="/:lang/reset-password"
              element={
                <Navigate
                  to="/en"
                />
              }
            />

            <Route
              path="/:lang/privacy-policy"
              element={
                <PrivacyPolicy />
              }
            />

            <Route
              path="/:lang/terms-of-service"
              element={
                <TermsOfService />
              }
            />

            <Route
              path="/:lang/suggestions"
              element={
                <SuggestionsBoard
                  user={
                    user
                  }
                  isAdmin={
                    isAdmin
                  }
                />
              }
            />

            <Route
              path="/:lang/my-worldcups"
              element={
                <MyWorldcupsWrapper />
              }
            />

            <Route
              path="/:lang/recent-worldcups"
              element={
                <RecentWorldcupsWrapper />
              }
            />

            <Route
              path="/"
              element={
                <Navigate
                  to="/en"
                  replace
                />
              }
            />

            <Route
              path="*"
              element={
                <Navigate
                  to="/en"
                  replace
                />
              }
            />
          </Routes>
        </div>
      </>
    );
  }

  /* ===================================================
     최종 APP 렌더링
  =================================================== */

  return (
    <div
      className="app-main-wrapper"
      style={{
        margin: 0,
        padding: 0,
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <img
        src="/OnePickGame.avif"
        alt="OnePickGame 배경"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          width: "100vw",
          height: "100vh",
          minHeight: "100vh",
          minWidth: "100vw",
          objectFit: "cover",
          objectPosition: "center",
          pointerEvents: "none",
          userSelect: "none",
          opacity: 1,
        }}
        draggable={false}
        loading="eager"
        fetchpriority="high"
        aria-hidden="true"
      />

      <div
        style={{
          position: "fixed",
          inset: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 1,
          pointerEvents: "none",
          background: "rgba(0,0,0,0.0)",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 2,
        }}
      >
        <div
          className="main-content-outer"
          style={{
            paddingTop: 0,
            margin: 0,
          }}
        >
          <Router>
            <ScrollToTopOnRouteChange />

            <AppRoutes />

            <Footer />
          </Router>
        </div>
      </div>
    </div>
  );
}

export default App;