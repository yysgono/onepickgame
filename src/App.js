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
  getWorldcupGame,
} from "./utils/supabaseWorldcupApi";
import { supabase } from "./utils/supabaseClient";

import Seo from "./seo/Seo";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 700 : false
  );
  useEffect(() => {
    function onResize() {
      if (typeof window !== "undefined") {
        setIsMobile(window.innerWidth <= 700);
      }
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return isMobile;
}

function getLangPath(i18n, path = "") {
  const lang = (i18n.language || "en").split("-")[0];
  if (path.startsWith("/")) path = path.slice(1);
  return `/${lang}${path ? "/" + path : ""}`;
}

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
      navigate("/en", { replace: true });
      return;
    }
    if (i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }
  }, [lang, i18n, navigate]);

  const homeProps = { ...props };

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

function ScrollToTopOnRouteChange() {
  const location = useLocation();
  useEffect(() => {
    try {
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "manual";
      }
    } catch {}
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [location.pathname, location.search, location.hash]);
  return null;
}

function App() {
  useIsMobile();
  const [worldcupList, setWorldcupList] = useState([]);
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [nickname, setNickname] = useState("");
  const [nicknameLoading, setNicknameLoading] = useState(false);

  const [fixedWorldcupIds, setFixedWorldcupIds] = useState([]);
  const [fixedWorldcups, setFixedWorldcups] = useState([]);

  useEffect(() => {
    let isMounted = true;
    async function fetchUserAndProfile() {
      setNicknameLoading(true);
      const { data } = await supabase.auth.getUser();
      if (isMounted) setUser(data?.user || null);
      if (data?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("nickname")
          .eq("id", data.user.id)
          .single();
        if (isMounted) {
          setNickname(profile?.nickname || "");
          setIsAdmin(profile?.nickname === "admin");
        }
      } else {
        setNickname("");
        setIsAdmin(false);
      }
      setNicknameLoading(false);
    }
    fetchUserAndProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  function updateNickname(nick) {
    setNickname(nick);
    setIsAdmin(nick === "admin");
  }

  const fetchWorldcups = async () => {
    try {
      const list = await getWorldcupGames();
      setWorldcupList(list);
    } catch {
      setWorldcupList([]);
    }
  };

  useEffect(() => {
    fetchWorldcups();
  }, []);

  useEffect(() => {
    async function fetchFixedWorldcups() {
      let { data, error } = await supabase
        .from("fixed_worldcups")
        .select("worldcup_id")
        .order("id", { ascending: true });
      if (!error && Array.isArray(data)) {
        setFixedWorldcupIds(data.map((d) => String(d.worldcup_id)));
      } else {
        setFixedWorldcupIds([]);
      }
    }
    fetchFixedWorldcups();
  }, []);

  useEffect(() => {
    if (!worldcupList.length || !fixedWorldcupIds.length) {
      setFixedWorldcups([]);
      return;
    }
    const fixeds = fixedWorldcupIds
      .map((id) => worldcupList.find((cup) => String(cup.id) === String(id)))
      .filter(Boolean);
    setFixedWorldcups(fixeds);
  }, [worldcupList, fixedWorldcupIds]);

  useEffect(() => {
    const savedLang = localStorage.getItem("onepickgame_lang");
    if (savedLang && savedLang !== i18n.language) {
      i18n.changeLanguage(savedLang);
    }
  }, [i18n]);

  function handleLangChange(lng, _options) {
    i18n.changeLanguage(lng);
    localStorage.setItem("onepickgame_lang", lng);
  }

  function handleBackup() {
    const data = JSON.stringify(worldcupList || []);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `worldcup_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleRestore(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (ev) {
      try {
        const data = JSON.parse(ev.target.result);
        if (!Array.isArray(data)) throw new Error("Invalid format");
        setWorldcupList(data);
        alert(
          t("restore_success") ||
            "Restore successful! (Front-end only, DB not affected)"
        );
      } catch {
        alert(t("restore_fail") || "Restore failed!");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function MyWorldcupsWrapper() {
    const navigate = useNavigate();
    const myId = user?.id;
    const myList = worldcupList.filter(
      (w) => w.owner === myId || w.creator === myId || w.creator_id === myId
    );
    return (
      <Home
        worldcupList={myList}
        fetchWorldcups={fetchWorldcups}
        onSelect={(cup) => {
          navigate(getLangPath(i18n, `select-round/${cup.id}`));
        }}
        user={user}
        nickname={nickname}
        isAdmin={isAdmin}
        showFixedWorldcups={false}
        onDelete={async (id) => {
          try {
            await deleteWorldcupGame(id);
            const freshList = await getWorldcupGames();
            setWorldcupList(freshList);
          } catch (e) {
            alert(
              (t("delete_failed") || "Delete failed!") + " " + (e.message || e)
            );
          }
        }}
      />
    );
  }

  function RecentWorldcupsWrapper() {
    const navigate = useNavigate();
    let recents = [];
    try {
      recents = JSON.parse(
        localStorage.getItem("onepickgame_recentWorldcups") || "[]"
      );
    } catch {}
    recents = recents.reverse().filter((id, i, arr) => arr.indexOf(id) === i);
    const recentCups = recents
      .map((id) => worldcupList.find((w) => String(w.id) === String(id)))
      .filter(Boolean);
    return (
      <Home
        worldcupList={recentCups}
        fetchWorldcups={fetchWorldcups}
        onSelect={(cup) => {
          navigate(getLangPath(i18n, `select-round/${cup.id}`));
        }}
        user={user}
        nickname={nickname}
        isAdmin={isAdmin}
        showFixedWorldcups={false}
        onDelete={async (id) => {
          try {
            await deleteWorldcupGame(id);
            const freshList = await getWorldcupGames();
            setWorldcupList(freshList);
          } catch (e) {
            alert(
              (t("delete_failed") || "Delete failed!") + " " + (e.message || e)
            );
          }
        }}
      />
    );
  }

  function StatsPageWrapper() {
    const { id } = useParams();
    const { t } = useTranslation();
    const [cup, setCup] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      let mounted = true;
      async function fetchCup() {
        setLoading(true);
        let found = worldcupList.find((c) => String(c.id) === String(id));
        if (found) {
          if (mounted) {
            setCup(found);
            setLoading(false);
          }
        } else {
          try {
            const data = await getWorldcupGame(id);
            if (mounted) {
              setCup(data);
              setLoading(false);
            }
          } catch {
            if (mounted) {
              setCup(null);
              setLoading(false);
            }
          }
        }
      }
      fetchCup();
      return () => {
        mounted = false;
      };
    }, [id, worldcupList]);

    if (loading)
      return (
        <div style={{ padding: 60, textAlign: "center" }}>{t("loading")}</div>
      );
    if (!cup)
      return (
        <div style={{ padding: 60, textAlign: "center", color: "#d33" }}>
          {t("error_no_data")}
        </div>
      );

    return <StatsPage selectedCup={cup} showCommentBox={true} />;
  }

  function AppRoutes() {
    const navigate = useNavigate();
    const location = useLocation();
    const { i18n } = useTranslation();

    const langMatch = location.pathname.match(/^\/([a-z]{2})(\/|$)/);
    const currentLang = (
      langMatch ? langMatch[1] : i18n.language || "en"
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
  tr: "Turnuva oyunları oluştur ve oyna. Favorilerine oy ver ve topluluk sıralamalarını keşfet."
};

    function handleMakeWorldcup() {
      if (!user) {
        alert(t("login_required") || "Login required.");
        return;
      }
      navigate(`/${currentLang}/worldcup-maker`);
    }

    function HomeWrapper() {
      return (
        <Home
          worldcupList={worldcupList}
          fetchWorldcups={fetchWorldcups}
          onSelect={(cup) => {
            let recent = [];
            try {
              recent = JSON.parse(
                localStorage.getItem("onepickgame_recentWorldcups") || "[]"
              );
            } catch {}
            localStorage.setItem(
              "onepickgame_recentWorldcups",
              JSON.stringify(
                [cup.id, ...recent.filter((id) => id !== cup.id)].slice(0, 30)
              )
            );
            navigate(getLangPath(i18n, `select-round/${cup.id}`));
          }}
          onMakeWorldcup={handleMakeWorldcup}
          onDelete={async (id) => {
            try {
              await deleteWorldcupGame(id);
              const freshList = await getWorldcupGames();
              setWorldcupList(freshList);
            } catch (e) {
              alert(
                (t("delete_failed") || "Delete failed!") + " " + (e.message || e)
              );
            }
          }}
          user={user}
          nickname={nickname}
          isAdmin={isAdmin}
          fixedWorldcups={fixedWorldcups}
        />
      );
    }

function SelectRoundPageWrapper() {
  const { id, lang = "en" } = useParams();
const cup = worldcupList.find((c) => String(c.id) === String(id));

if (!cup) {
  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontSize: 18,
        fontWeight: 700,
      }}
    >
      {t("loading") || "Loading..."}
    </div>
  );
}

  const normalizedLang = String(lang || "en")
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
    bracketTitleMap[normalizedLang] || bracketTitleMap.en;

  const translatedTitle =
    cup?.title_translations?.[normalizedLang] ||
    cup?.title_translations?.en ||
    cup?.title ||
    "";

  const translatedDescription =
    cup?.description_translations?.[normalizedLang] ||
    cup?.description_translations?.en ||
    cup?.description ||
    cup?.desc ||
    "";

  return (
    <>
      <Seo
        lang={normalizedLang}
        slug={`select-round/${cup.id}`}
        title={`${bracketTitle} | ${translatedTitle} | One Pick Game`}
        description={translatedDescription}
        image={
          cup.thumbnail ||
          cup.image ||
          cup.data?.[0]?.image ||
          "/onepick-social.png"
        }
      />

    <SelectRoundPage
      cup={cup}
      maxRound={cup.data.length}
      candidates={cup.data}
      onSelect={(roundOrCandidate) => {
        if (typeof roundOrCandidate === "number") {
          navigate(getLangPath(i18n, `match/${cup.id}/${roundOrCandidate}`));
        } else if (
          typeof roundOrCandidate === "object" &&
          roundOrCandidate?.id
        ) {
          navigate(getLangPath(i18n, `match/${cup.id}/${cup.data.length}`));
        }
      }}
    />
  </>
);
}

    function WorldcupMakerWrapper() {
      const navigate = useNavigate();
      return (
        <WorldcupMaker
          fetchWorldcups={fetchWorldcups}
          onCreate={() => {
            navigate(getLangPath(i18n));
          }}
          onCancel={() => navigate(getLangPath(i18n))}
          user={user}
          nickname={nickname}
        />
      );
    }

    function ManageWorldcupWrapper() {
      return (
        <ManageWorldcup
          user={user}
          isAdmin={isAdmin}
          worldcupList={worldcupList}
          setWorldcupList={setWorldcupList}
        />
      );
    }

    function EditWorldcupPageWrapper() {
      const { id } = useParams();
      return (
        <EditWorldcupPage
          worldcupList={worldcupList}
          fetchWorldcups={fetchWorldcups}
          cupId={id}
          user={user}
          nickname={nickname}
          isAdmin={isAdmin}
        />
      );
    }

    function AdminRoute() {
      if (nicknameLoading) {
        return (
          <div
            style={{ padding: 60, textAlign: "center", fontWeight: 700, fontSize: 22 }}
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
              textAlign: "center",
              fontWeight: 700,
              fontSize: 22,
            }}
          >
            {t("admin_only") || "Admins only."}
            <br />
            {t("login_with_admin") || "Please log in as admin."}
          </div>
        );
      }
      return (
        <>
          <AdminBar
            adminName={nickname}
            onLogout={() => {
              supabase.auth.signOut().then(() => {
                window.location.href = getLangPath(i18n);
              });
            }}
          />
          <AdminDashboard />
        </>
      );
    }

    function AdminStatsRoute() {
      if (nicknameLoading) {
        return (
          <div
            style={{ padding: 60, textAlign: "center", fontWeight: 700, fontSize: 22 }}
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
              textAlign: "center",
              fontWeight: 700,
              fontSize: 22,
            }}
          >
            {t("admin_only") || "Admins only."}
            <br />
            {t("login_with_admin") || "Please log in as admin."}
          </div>
        );
      }
      return (
        <>
          <AdminBar
            adminName={nickname}
            onLogout={() => {
              supabase.auth.signOut().then(() => {
                window.location.href = getLangPath(i18n);
              });
            }}
          />
          <AdminStatsPage />
        </>
      );
    }

    function RedirectStatsToResult() {
      const { lang, id } = useParams();
      return <Navigate to={`/${lang}/result/${id}`} replace />;
    }

    return (
      <>
        <SEOManager />
<div className="header-wrapper" style={{ margin: 0, padding: 0 }}>
  <Header
    onLangChange={handleLangChange}
    onBackup={handleBackup}
    onRestore={handleRestore}
    onMakeWorldcup={handleMakeWorldcup}
    isAdmin={isAdmin}
    user={user}
    nickname={nickname}
    nicknameLoading={nicknameLoading}
    setUser={setUser}
    setNickname={updateNickname}
  />
</div>

{/* 🔥 여기 추가 (상단 광고) */}
<AdsenseTop />

<AdGuard isAdmin={isAdmin} />

        <div className="main-content-box">
          <Routes>
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route
              path="/suggestions-board"
              element={<SuggestionsBoard user={user} isAdmin={isAdmin} />}
            />

            <Route
              path="/signup"
              element={<Navigate to="/en/signup" replace />}
            />
            <Route
              path="/find-id"
              element={<Navigate to="/en/find-id" replace />}
            />
            <Route
              path="/find-pw"
              element={<Navigate to="/en/find-pw" replace />}
            />
    {/* 블로그 목록 */}
    <Route
      path="/:lang/blog"
      element={<BlogPage />}
    />

    {/* 블로그 상세 글 */}
    <Route
      path="/:lang/blog/:slug"
      element={<BlogPostPage />}
    />
            <Route
              path="/:lang"
              element={
                <>
                  <Seo
                    lang={currentLang}
                    slug=""
                    title={titleMap[currentLang] || titleMap.en}
                    description={descMap[currentLang] || descMap.en}
                  />
                  <LanguageWrapper
                    worldcupList={worldcupList}
                    fetchWorldcups={fetchWorldcups}
                    onMakeWorldcup={handleMakeWorldcup}
                    onDelete={async (id) => {
                      try {
                        await deleteWorldcupGame(id);
                        const freshList = await getWorldcupGames();
                        setWorldcupList(freshList);
                      } catch (e) {
                        alert(
                          (t("delete_failed") || "Delete failed!") +
                            " " +
                            (e.message || e)
                        );
                      }
                    }}
                    user={user}
                    nickname={nickname}
                    isAdmin={isAdmin}
                    fixedWorldcups={fixedWorldcups}
                  />
                </>
              }
            />

            <Route
              path="/:lang/select-round/:id"
              element={<SelectRoundPageWrapper />}
            />
            <Route
              path="/:lang/match/:id/:round"
              element={<MatchPage worldcupList={worldcupList} />}
            />
            <Route
              path="/:lang/result/:id"
              element={<ResultPage worldcupList={worldcupList} />}
            />
            <Route
              path="/:lang/result/:id/:round"
              element={<ResultPage worldcupList={worldcupList} />}
            />

            <Route path="/:lang/stats/:id" element={<RedirectStatsToResult />} />

            <Route path="/:lang/worldcup-maker" element={<WorldcupMakerWrapper />} />
            <Route path="/:lang/manage" element={<ManageWorldcupWrapper />} />
            <Route
              path="/:lang/backup"
              element={
                <BackupPage
                  worldcupList={worldcupList}
                  setWorldcupList={setWorldcupList}
                />
              }
            />
            <Route
              path="/:lang/edit-worldcup/:id"
              element={<EditWorldcupPageWrapper />}
            />

            <Route path="/:lang/admin" element={<AdminRoute />} />
            <Route path="/:lang/admin-stats" element={<AdminStatsRoute />} />

            <Route path="/:lang/signup" element={<SignupBox />} />
            <Route
              path="/:lang/login"
              element={
                <LoginBox setUser={setUser} setNickname={updateNickname} />
              }
            />
            <Route path="/:lang/find-id" element={<FindIdBox />} />
            <Route path="/:lang/find-pw" element={<FindPwBox />} />
            <Route path="/:lang/reset-password" element={<Navigate to="/en" />} />

            <Route path="/:lang/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/:lang/terms-of-service" element={<TermsOfService />} />
            <Route
              path="/:lang/suggestions"
              element={<SuggestionsBoard user={user} isAdmin={isAdmin} />}
            />

            <Route path="/:lang/my-worldcups" element={<MyWorldcupsWrapper />} />
            <Route
              path="/:lang/recent-worldcups"
              element={<RecentWorldcupsWrapper />}
            />

            {/* ✅ Notice 관련 경로 완전 삭제됨 */}

            <Route path="/" element={<Navigate to="/en" replace />} />
            <Route path="*" element={<Navigate to="/en" replace />} />
          </Routes>
        </div>
      </>
    );
  }

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
      <div style={{ position: "relative", zIndex: 2 }}>
        <div className="main-content-outer" style={{ paddingTop: 190, margin: 0 }}>
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
