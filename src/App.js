// src/App.js
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

// 언어별 페이지 import
import DePage from "./pages/de/index";
import EnPage from "./pages/en/index";
import EsPage from "./pages/es/index";
import FrPage from "./pages/fr/index";
import HiPage from "./pages/hi/index";
import IdPage from "./pages/id/index";
import JaPage from "./pages/ja/index";
import KoPage from "./pages/ko/index";
import PtPage from "./pages/pt/index";
import RuPage from "./pages/ru/index";
import ViPage from "./pages/vi/index";
import ZhPage from "./pages/zh/index";
import ArPage from "./pages/ar/index";
import BnPage from "./pages/bn/index";
import ThPage from "./pages/th/index";
import TrPage from "./pages/tr/index";

import { getWorldcupGames, deleteWorldcupGame } from "./utils/supabaseWorldcupApi";
import { supabase } from "./utils/supabaseClient";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 700);
  useEffect(() => {
    function onResize() {
      setIsMobile(window.innerWidth <= 700);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return isMobile;
}

function ResetPwRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/");
  }, [navigate]);
  return null;
}

function LanguageWrapper(props) {
  const { lang } = useParams();
  const { i18n } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    const supportedLangs = [
      "ko", "en", "ru", "ja", "zh", "pt", "es", "fr", "id", "hi", "de", "vi",
      "ar", "bn", "th", "tr"
    ];
    if (!supportedLangs.includes(lang)) {
      navigate("/", { replace: true });
      return;
    }
    if (i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }
  }, [lang, i18n, navigate]);

  switch (lang) {
    case "ko": return <KoPage {...props} />;
    case "en": return <EnPage {...props} />;
    case "ru": return <RuPage {...props} />;
    case "ja": return <JaPage {...props} />;
    case "zh": return <ZhPage {...props} />;
    case "pt": return <PtPage {...props} />;
    case "es": return <EsPage {...props} />;
    case "fr": return <FrPage {...props} />;
    case "id": return <IdPage {...props} />;
    case "hi": return <HiPage {...props} />;
    case "de": return <DePage {...props} />;
    case "vi": return <ViPage {...props} />;
    case "ar": return <ArPage {...props} />;
    case "bn": return <BnPage {...props} />;
    case "th": return <ThPage {...props} />;
    case "tr": return <TrPage {...props} />;
    default: return <Home {...props} />;
  }
}

function App() {
  const isMobile = useIsMobile();

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
    return () => { isMounted = false; };
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

  function handleLangChange(lng) {
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
        alert(t("restore_success") || "Restore successful! (Front-end only, DB not affected)");
      } catch {
        alert(t("restore_fail") || "Restore failed!");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function MyWorldcupsWrapper() {
    const myId = user?.id;
    const myList = worldcupList.filter(
      (w) => w.owner === myId || w.creator === myId || w.creator_id === myId
    );
    return (
      <Home
        worldcupList={myList}
        fetchWorldcups={fetchWorldcups}
        onSelect={(cup) => {
          // 언어코드 붙여서 이동
          const lang = i18n.language || "ko";
          window.location.href = `/${lang}/select-round/${cup.id}`;
        }}
        user={user}
        nickname={nickname}
        isAdmin={isAdmin}
        showFixedWorldcups={false}
      />
    );
  }

  function RecentWorldcupsWrapper() {
    let recents = [];
    try {
      recents = JSON.parse(localStorage.getItem("onepickgame_recentWorldcups") || "[]");
    } catch {}
    recents = recents
      .reverse()
      .filter((id, i, arr) => arr.indexOf(id) === i);
    const recentCups = recents
      .map((id) => worldcupList.find((w) => String(w.id) === String(id)))
      .filter(Boolean);
    return (
      <Home
        worldcupList={recentCups}
        fetchWorldcups={fetchWorldcups}
        onSelect={(cup) => {
          const lang = i18n.language || "ko";
          window.location.href = `/${lang}/select-round/${cup.id}`;
        }}
        user={user}
        nickname={nickname}
        isAdmin={isAdmin}
        showFixedWorldcups={false}
      />
    );
  }

  function AppRoutes() {
    const navigate = useNavigate();
    const location = useLocation();
    const { i18n } = useTranslation();

    // 현재 URL에서 언어코드 추출
    const langMatch = location.pathname.match(/^\/([a-z]{2})(\/|$)/);
    const lang = langMatch ? langMatch[1] : i18n.language || "ko";

    function handleMakeWorldcup() {
      if (!user) {
        alert(t("login_required") || "Login required.");
        return;
      }
      navigate(`/${lang}/worldcup-maker`);
    }

    function HomeWrapper() {
      return (
        <Home
          worldcupList={worldcupList}
          fetchWorldcups={fetchWorldcups}
          onSelect={(cup) => {
            let recent = [];
            try {
              recent = JSON.parse(localStorage.getItem("onepickgame_recentWorldcups") || "[]");
            } catch {}
            localStorage.setItem(
              "onepickgame_recentWorldcups",
              JSON.stringify([cup.id, ...recent.filter((id) => id !== cup.id)].slice(0, 30))
            );
            navigate(`/${lang}/select-round/${cup.id}`);
          }}
          onMakeWorldcup={handleMakeWorldcup}
          onDelete={async (id) => {
            try {
              await deleteWorldcupGame(id);
              setWorldcupList((list) => list.filter((cup) => cup.id !== id));
            } catch (e) {
              alert((t("delete_failed") || "Delete failed!") + " " + (e.message || e));
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
      const { id } = useParams();
      const cup = worldcupList.find((c) => String(c.id) === id);
      const navigate = useNavigate();
      if (!cup) return null;
      return (
        <SelectRoundPage
          cup={cup}
          maxRound={cup.data.length}
          candidates={cup.data}
          onSelect={(roundOrCandidate) => {
            // roundOrCandidate: 라운드(숫자) or 후보객체
            if (typeof roundOrCandidate === "number") {
              // 라운드 시작
              navigate(`/${lang}/match/${cup.id}/${roundOrCandidate}`);
            } else if (typeof roundOrCandidate === "object" && roundOrCandidate?.id) {
              // 카드 클릭 시 → 1라운드부터 시작
              navigate(`/${lang}/match/${cup.id}/${maxRound}`);
            }
          }}
        />
      );
    }

    function StatsPageWrapper() {
      const { id } = useParams();
      const cup = worldcupList.find((c) => String(c.id) === id);
      if (!cup) return null;
      return <StatsPage selectedCup={cup} showCommentBox={true} />;
    }

    function WorldcupMakerWrapper() {
      const navigate = useNavigate();
      return (
        <WorldcupMaker
          fetchWorldcups={fetchWorldcups}
          onCreate={() => {
            navigate(`/${lang}`);
          }}
          onCancel={() => navigate(`/${lang}`)}
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
            onLogout={() => {
              supabase.auth.signOut().then(() => window.location.reload());
            }}
          />
          <AdminDashboard />
        </>
      );
    }

    function AdminStatsRoute() {
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
            onLogout={() => {
              supabase.auth.signOut().then(() => window.location.reload());
            }}
          />
          <AdminStatsPage />
        </>
      );
    }

    return (
      <>
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

        <div className="main-content-box">
          <Routes>
            {/* 언어별 전체 라우팅 */}
            <Route
              path="/:lang"
              element={
                <LanguageWrapper
                  worldcupList={worldcupList}
                  fetchWorldcups={fetchWorldcups}
                  user={user}
                  nickname={nickname}
                  isAdmin={isAdmin}
                  fixedWorldcups={fixedWorldcups}
                />
              }
            />
            <Route path="/:lang/select-round/:id" element={<SelectRoundPageWrapper />} />
            <Route path="/:lang/match/:id/:round" element={<MatchPage worldcupList={worldcupList} />} />
            <Route path="/:lang/result/:id" element={<ResultPage worldcupList={worldcupList} />} />
            <Route path="/:lang/result/:id/:round" element={<ResultPage worldcupList={worldcupList} />} />
            <Route path="/:lang/stats/:id" element={<StatsPageWrapper />} />
            <Route path="/:lang/worldcup-maker" element={<WorldcupMakerWrapper />} />
            <Route path="/:lang/manage" element={<ManageWorldcupWrapper />} />
            <Route path="/:lang/backup" element={<BackupPage worldcupList={worldcupList} setWorldcupList={setWorldcupList} />} />
            <Route path="/:lang/edit-worldcup/:id" element={<EditWorldcupPageWrapper />} />
            <Route path="/:lang/admin" element={<AdminRoute />} />
            <Route path="/:lang/admin-stats" element={<AdminStatsRoute />} />
            <Route path="/:lang/signup" element={<SignupBox />} />
            <Route path="/:lang/login" element={<LoginBox setUser={setUser} setNickname={updateNickname} />} />
            <Route path="/:lang/find-id" element={<FindIdBox />} />
            <Route path="/:lang/find-pw" element={<FindPwBox />} />
            <Route path="/:lang/reset-password" element={<ResetPwRedirect />} />
            <Route path="/:lang/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/:lang/terms-of-service" element={<TermsOfService />} />
            <Route path="/:lang/suggestions" element={<SuggestionsBoard user={user} isAdmin={isAdmin} />} />

            {/* 기본 루트(언어 없는 홈) */}
            <Route path="/" element={<HomeWrapper />} />
            <Route path="/my-worldcups" element={<MyWorldcupsWrapper />} />
            <Route path="/recent-worldcups" element={<RecentWorldcupsWrapper />} />
            {/* 없는 주소는 홈으로 */}
            <Route path="*" element={<Navigate to="/" replace />} />
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
      {/* ✅ 배경 이미지를 <img>로 표시 */}
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
        <div
          className="main-content-outer"
          style={{ paddingTop: 190, margin: 0 }}
        >
          <Router>
            <AppRoutes />
            <Footer />
          </Router>
        </div>
      </div>
    </div>
  );
}

export default App;
