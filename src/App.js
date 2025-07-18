// src/App.js
import "./i18n";
import "./App.css";
import React, { useState, useEffect, useRef } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useParams,
  useLocation,
} from "react-router-dom";
import { useTranslation } from "react-i18next";
import Header from "./components/Header";
import Home from "./components/Home";
import SelectRoundPage from "./components/SelectRoundPage";
import AuthBox from "./components/AuthBox";
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
import { getWorldcupGames, deleteWorldcupGame } from "./utils/supabaseWorldcupApi";
import { supabase } from "./utils/supabaseClient";
import AdBanner from "./components/AdBanner";
import PrivacyPolicy from "./components/PrivacyPolicy";
import TermsOfService from "./components/TermsOfService";
import Footer from "./components/Footer";

function useAdBannerHeight() {
  const [height, setHeight] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    function update() {
      if (ref.current) {
        setHeight(ref.current.offsetHeight || 0);
      }
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return [ref, height];
}

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

function App() {
  const [adRef, adHeight] = useAdBannerHeight();
  const isMobile = useIsMobile();

  const [worldcupList, setWorldcupList] = useState([]);
  const { i18n } = useTranslation();
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [nickname, setNickname] = useState("");
  const [nicknameLoading, setNicknameLoading] = useState(false);

  // === 고정 월드컵용 ===
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
    return () => { isMounted = false; }
  }, []);

  function updateNickname(nick) {
    setNickname(nick);
    setIsAdmin(nick === "admin");
  }

  const fetchWorldcups = async () => {
    try {
      const list = await getWorldcupGames();
      setWorldcupList(list);
    } catch (e) {
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
        setFixedWorldcupIds(data.map(d => String(d.worldcup_id)));
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
      .map(id => worldcupList.find(cup => String(cup.id) === String(id)))
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
        if (!Array.isArray(data)) throw new Error("형식 오류");
        setWorldcupList(data);
        alert("복구 성공! (프론트에만 적용, DB 반영은 별도)");
      } catch {
        alert("복구 실패!");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function useShowBottomAd() {
    const location = useLocation();
    return {
      showBig:
        /^\/select-round\//.test(location.pathname) ||
        /^\/match\//.test(location.pathname),
      showSmall: /^\/result\//.test(location.pathname),
    };
  }

  function MyWorldcupsWrapper() {
    const myId = user?.id;
    const myList = worldcupList.filter(w => w.owner === myId || w.creator === myId || w.creator_id === myId);
    return (
      <Home
        worldcupList={myList}
        fetchWorldcups={fetchWorldcups}
        onSelect={cup => window.location.href = `/select-round/${cup.id}`}
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
    } catch { }
    recents = recents.reverse().filter((id, i, arr) => arr.indexOf(id) === i);
    const recentCups = recents
      .map(id => worldcupList.find(w => String(w.id) === String(id)))
      .filter(Boolean);
    return (
      <Home
        worldcupList={recentCups}
        fetchWorldcups={fetchWorldcups}
        onSelect={cup => window.location.href = `/select-round/${cup.id}`}
        user={user}
        nickname={nickname}
        isAdmin={isAdmin}
        showFixedWorldcups={false}
      />
    );
  }

  function AppRoutes() {
    const navigate = useNavigate();

    function handleMakeWorldcup() {
      if (!user) {
        alert("로그인이 필요합니다.");
        return;
      }
      navigate("/worldcup-maker");
    }

    function HomeWrapper() {
      const navigate = useNavigate();
      return (
        <Home
          worldcupList={worldcupList}
          fetchWorldcups={fetchWorldcups}
          onSelect={cup => {
            let recent = [];
            try { recent = JSON.parse(localStorage.getItem("onepickgame_recentWorldcups") || "[]"); } catch { }
            localStorage.setItem("onepickgame_recentWorldcups",
              JSON.stringify([cup.id, ...recent.filter(id => id !== cup.id)].slice(0, 30))
            );
            navigate(`/select-round/${cup.id}`);
          }}
          onMakeWorldcup={handleMakeWorldcup}
          onDelete={async id => {
            try {
              await deleteWorldcupGame(id);
              setWorldcupList(list => list.filter(cup => cup.id !== id));
            } catch (e) {
              alert("삭제 실패! " + (e.message || e));
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
      const navigate = useNavigate();
      const cup = worldcupList.find(c => String(c.id) === id);
      if (!cup) return null;
      return (
        <SelectRoundPage
          cup={cup}
          maxRound={cup.data.length}
          candidates={cup.data}
          onSelect={round => navigate(`/match/${id}/${round}`)}
        />
      );
    }

    function StatsPageWrapper() {
      const { id } = useParams();
      const cup = worldcupList.find(c => String(c.id) === id);
      if (!cup) return null;
      return <StatsPage selectedCup={cup} showCommentBox={true} />;
    }

    function WorldcupMakerWrapper() {
      const navigate = useNavigate();
      return (
        <WorldcupMaker
          fetchWorldcups={fetchWorldcups}
          onCreate={() => { window.location.href = "/"; }}
          onCancel={() => navigate("/")}
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
        />
      );
    }

    function AdminRoute() {
      if (!isAdmin) {
        return (
          <div style={{ padding: 60, textAlign: "center", fontWeight: 700, fontSize: 22 }}>
            관리자만 접근할 수 있습니다.<br />아이디에 <b>admin</b>으로 로그인하세요.
          </div>
        );
      }
      return (
        <>
          <AdminBar onLogout={() => { supabase.auth.signOut().then(() => window.location.reload()); }} />
          <AdminDashboard />
        </>
      );
    }
    function AdminStatsRoute() {
      if (!isAdmin) {
        return (
          <div style={{ padding: 60, textAlign: "center", fontWeight: 700, fontSize: 22 }}>
            관리자만 접근할 수 있습니다.<br />아이디에 <b>admin</b>으로 로그인하세요.
          </div>
        );
      }
      return (
        <>
          <AdminBar onLogout={() => { supabase.auth.signOut().then(() => window.location.reload()); }} />
          <AdminStatsPage />
        </>
      );
    }

    return (
      <>
        <div className="header-wrapper" style={{ margin: 0, padding: 0, marginBottom: 0 }}>
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
        <div ref={adRef} className="ad-banner-top-static-wrap" style={{ marginTop: 0, paddingTop: 0 }}>
          <AdBanner position="top" img="ad2.png" />
        </div>
        <div className="main-content-box">
          <Routes>
            <Route path="/" element={<HomeWrapper />} />
            <Route path="/my-worldcups" element={<MyWorldcupsWrapper />} />
            <Route path="/recent-worldcups" element={<RecentWorldcupsWrapper />} />
            <Route path="/select-round/:id" element={<SelectRoundPageWrapper />} />
            <Route path="/match/:id/:round" element={<MatchPage worldcupList={worldcupList} />} />
            <Route path="/result/:id" element={<ResultPage worldcupList={worldcupList} />} />
            <Route path="/result/:id/:round" element={<ResultPage worldcupList={worldcupList} />} />
            <Route path="/stats/:id" element={<StatsPageWrapper />} />
            <Route path="/worldcup-maker" element={<WorldcupMakerWrapper />} />
            <Route path="/manage" element={<ManageWorldcupWrapper />} />
            <Route path="/backup" element={<BackupPage worldcupList={worldcupList} setWorldcupList={setWorldcupList} />} />
            <Route path="/edit-worldcup/:id" element={<EditWorldcupPageWrapper />} />
            <Route path="/admin" element={<AdminRoute />} />
            <Route path="/admin-stats" element={<AdminStatsRoute />} />
            <Route path="/signup" element={<SignupBox />} />
            {/* 여기만 수정 */}
            <Route path="/login" element={<LoginBox setUser={setUser} setNickname={updateNickname} />} />
            <Route path="/find-id" element={<FindIdBox />} />
            <Route path="/find-pw" element={<FindPwBox />} />
            <Route path="/reset-password" element={<ResetPwRedirect />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
          </Routes>
        </div>
      </>
    );
  }

  function BottomAdConditional() {
    const { showBig, showSmall } = useShowBottomAd();
    if (isMobile) {
      return (
        <AdBanner
          position="bottom"
          img="ad2.png"
          width={320}
          height={90}
          style={{
            left: "50%",
            transform: "translateX(-50%)",
            bottom: "0px",
          }}
        />
      );
    }
    if (showBig) {
      return (
        <AdBanner
          position="bottom"
          img="ad3.png"
          width={1200}
          height={160}
          style={{
            left: "50%",
            transform: "translateX(-50%)",
            bottom: "0px",
          }}
        />
      );
    }
    if (showSmall) {
      return (
        <AdBanner
          position="bottom"
          img="ad2.png"
          width={970}
          height={90}
          style={{
            left: "50%",
            transform: "translateX(-50%)",
            bottom: "0px",
          }}
        />
      );
    }
    return null;
  }

  // ===== [여기부터 전체 배경 적용!] =====
  return (
    <div className="app-main-wrapper" style={{ margin: 0, padding: 0, minHeight: "100vh", position: "relative" }}>
      {/* 배경이미지 + 오버레이 */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 0,
          pointerEvents: "none",
          background: `url("/onepick.png") center center / cover no-repeat fixed`,
        }}
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
      {/* 기존 컨텐츠 zIndex=2~로 띄우기 */}
      <div style={{ position: "relative", zIndex: 2 }}>
        <AdBanner position="left" img="ad1.png" style={{ top: "50%", left: 24, transform: "translateY(-50%)", maxHeight: "95vh", width: "300px" }} />
        <AdBanner position="right" img="ad1.png" style={{ top: "50%", right: 24, transform: "translateY(-50%)", maxHeight: "95vh", width: "300px" }} />
        <div className="main-content-outer" style={{ paddingTop: adHeight ? adHeight + 32 : 190, margin: 0 }}>
          <Router>
            <AppRoutes />
            <BottomAdConditional />
            <Footer />
          </Router>
        </div>
      </div>
    </div>
  );
}

export default App;