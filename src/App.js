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
import AdsenseTop from "./components/AdsenseTop";
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
     저장된 언어 적용
  =================================================== */

  useEffect(() => {
    const savedLang =
      localStorage.getItem(
        "onepickgame_lang"
      );

    if (
      savedLang &&
      savedLang !== i18n.language
    ) {
      i18n.changeLanguage(
        savedLang
      );
    }
  }, [i18n]);

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
      en: "Create and play bracket games. Build your own tournaments, vote for your favorites, and enjoy community rankings.",
      ko: "이상형 월드컵 만들기 다양한 토너먼트에 참여하고 인기 순위와 커뮤니티를 즐겨보세요.",
      ja: "トーナメントゲームを作成して遊ぼう。お気に入りに投票し、ランキングやコミュニティを楽しめます。",
      fr: "Créez et jouez à des tournois de vote. Votez pour vos favoris et découvrez les classements de la communauté.",
      es: "Crea y juega torneos de votación. Vota por tus favoritos y disfruta de las clasificaciones de la comunidad.",
      de: "Erstelle und spiele Abstimmungsturniere. Stimme für deine Favoriten ab und entdecke Community-Ranglisten.",
      pt: "Crie e jogue torneios de votação. Vote nos seus favoritos e confira os rankings da comunidade.",
      ru: "Создавайте и играйте в турниры голосований. Голосуйте за своих фаворитов и изучайте рейтинги сообщества.",
      id: "Buat dan mainkan turnamen voting. Pilih favoritmu dan nikmati peringkat komunitas.",
      hi: "वोटिंग टूर्नामेंट बनाएं और खेलें। अपने पसंदीदा को वोट दें और समुदाय की रैंकिंग देखें।",
      vi: "Tạo và chơi giải đấu bình chọn. Bình chọn mục yêu thích và khám phá bảng xếp hạng cộng đồng.",
      zh: "创建并游玩淘汰赛游戏，为你喜欢的角色投票，并查看社区排行榜。",
      ar: "أنشئ والعب بطولات التصويت، وصوّت لمفضلاتك واستمتع بتصنيفات المجتمع.",
      bn: "ভোটিং টুর্নামেন্ট তৈরি করুন ও খেলুন। আপনার প্রিয়দের ভোট দিন এবং কমিউনিটির র‍্যাঙ্কিং দেখুন।",
      th: "สร้างและเล่นเกมโหวตแบบทัวร์นาเมนต์ โหวตสิ่งที่คุณชื่นชอบและดูอันดับจากชุมชน",
      tr: "Turnuva oyunları oluştur ve oyna. Favorilerine oy ver ve topluluk sıralamalarını keşfet.",
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

      const bracketTitleMap = {
        en: "Bracket Game",
        ko: "이상형 월드컵",
        ja: "人気投票トーナメント",
        zh: "淘汰赛游戏",
        es: "Torneo de Votación",
        fr: "Tournoi de Vote",
        vi: "Giải đấu bình chọn",
        de: "Abstimmungsturnier",
        ru: "Турнир голосований",
        id: "Turnamen Voting",
        pt: "Torneio de Votação",
        hi: "वोटिंग टूर्नामेंट",
        tr: "Turnuva Oyunu",
        th: "เกมโหวตแบบทัวร์นาเมนต์",
        ar: "بطولة التصويت",
        bn: "ভোটিং টুর্নামেন্ট",
      };

      const bracketTitle =
        bracketTitleMap[
          normalizedLang
        ] ||
        bracketTitleMap.en;

      const translatedTitle =
        cup
          ?.title_translations?.[
          normalizedLang
        ] ||
        cup
          ?.title_translations
          ?.en ||
        cup?.title ||
        "";

      const translatedDescription =
        cup
          ?.description_translations?.[
          normalizedLang
        ] ||
        cup
          ?.description_translations
          ?.en ||
        cup?.description ||
        cup?.desc ||
        "";

      return (
        <>
          <Seo
            lang={
              normalizedLang
            }
            slug={`select-round/${cup.id}`}
            title={`${bracketTitle} | ${translatedTitle} | One Pick Game`}
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
    en: "Create an Ideal Type World Cup | bracket One Pick Game",
    ko: "이상형 월드컵 만들기 | One Pick Game",
    ja: "理想のタイプワールドカップを作成 | One Pick Game",
    zh: "创建理想型世界杯 | One Pick Game",
    ru: "Создать турнир | One Pick Game",
    pt: "Criar Torneio | One Pick Game",
    es: "Crear Torneo | One Pick Game",
    fr: "Créer un Tournoi | One Pick Game",
    id: "Buat Turnamen | One Pick Game",
    hi: "टूर्नामेंट बनाएँ | One Pick Game",
    de: "Turnier erstellen | One Pick Game",
    vi: "Tạo giải đấu | One Pick Game",
    ar: "إنشاء بطولة | One Pick Game",
    bn: "টুর্নামেন্ট তৈরি করুন | One Pick Game",
    th: "สร้างทัวร์นาเมนต์ | One Pick Game",
    tr: "Turnuva Oluştur | One Pick Game",
  };

  const makerDescMap = {
    en: "Create your own ideal type world cup. Add candidates and images, build your bracket, and share it with others.",
    ko: "나만의 이상형 월드컵을 만들어보세요. 이미지와 후보를 등록하고 토너먼트를 만들어 친구들과 공유할 수 있습니다.",
    ja: "候補と画像を登録して、自分だけの理想のタイプワールドカップを作成して共有できます。",
    zh: "添加候选项和图片，创建属于自己的理想型世界杯并与他人分享。",
    ru: "Создайте свой турнир, добавьте участников и изображения и поделитесь им с другими.",
    pt: "Crie seu próprio torneio, adicione candidatos e imagens e compartilhe com outras pessoas.",
    es: "Crea tu propio torneo, añade candidatos e imágenes y compártelo con otros.",
    fr: "Créez votre propre tournoi, ajoutez des candidats et des images, puis partagez-le.",
    id: "Buat turnamenmu sendiri, tambahkan kandidat dan gambar, lalu bagikan.",
    hi: "अपना टूर्नामेंट बनाएँ, उम्मीदवार और चित्र जोड़ें और दूसरों के साथ साझा करें।",
    de: "Erstelle dein eigenes Turnier, füge Kandidaten und Bilder hinzu und teile es mit anderen.",
    vi: "Tạo giải đấu của riêng bạn, thêm ứng viên và hình ảnh rồi chia sẻ với mọi người.",
    ar: "أنشئ بطولتك الخاصة وأضف المرشحين والصور وشاركها مع الآخرين.",
    bn: "নিজের টুর্নামেন্ট তৈরি করুন, প্রার্থী ও ছবি যোগ করুন এবং অন্যদের সঙ্গে শেয়ার করুন।",
    th: "สร้างทัวร์นาเมนต์ของคุณเอง เพิ่มผู้เข้าแข่งขันและรูปภาพ แล้วแชร์ให้ผู้อื่น",
    tr: "Kendi turnuvanı oluştur, adaylar ve görseller ekle ve başkalarıyla paylaş.",
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

        <AdsenseTop />

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
              path="/:lang"
              element={
                <>
                  <Seo
                    lang={
                      currentLang
                    }
                    slug=""
                    title={
                      titleMap[
                        currentLang
                      ] ||
                      titleMap.en
                    }
                    description={
                      descMap[
                        currentLang
                      ] ||
                      descMap.en
                    }
                  />

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
            paddingTop: 190,
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