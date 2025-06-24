import "./i18n";
import "./App.css";
import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useParams
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

function App() {
  const [worldcupList, setWorldcupList] = useState([]);
  const { i18n } = useTranslation();
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [nickname, setNickname] = useState("");
  const [nicknameLoading, setNicknameLoading] = useState(false);

  // 1. 유저 감지 및 닉네임 fetch (최초 1번만)
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

  // 2. 닉네임만 바뀔 때 리렌더링 (닉네임 변경 직후에)
  function updateNickname(nick) {
    setNickname(nick);
    setIsAdmin(nick === "admin");
  }

  // 월드컵 목록
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

  // onMakeWorldcup은 navigate 사용을 위해 래퍼에서 전달
  function AppRoutes() {
    const navigate = useNavigate();

    function handleMakeWorldcup() {
      if (!user) {
        alert("로그인이 필요합니다.");
        return;
      }
      navigate("/worldcup-maker"); // 새로고침 없이 이동
    }

    function HomeWrapper() {
      const navigate = useNavigate();
      return (
        <Home
          worldcupList={worldcupList}
          fetchWorldcups={fetchWorldcups}
          onSelect={cup => navigate(`/select-round/${cup.id}`)}
          onMakeWorldcup={handleMakeWorldcup}
          onDelete={async id => {
            try {
              await deleteWorldcupGame(id);
              setWorldcupList(list => list.filter(cup => cup.id !== id));
            } catch (e) {
              alert("삭제 실패! " + (e.message || e));
            }
          }}
        />
      );
    }

    function SelectRoundPageWrapper() {
      const { id } = useParams();
      const navigate = useNavigate();
      const cup = worldcupList.find(c => String(c.id) === id);
      if (!cup)
        return (
          <div style={{ padding: 80 }}>월드컵 정보를 찾을 수 없습니다.</div>
        );
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
      if (!cup)
        return (
          <div style={{ padding: 80 }}>월드컵 정보를 찾을 수 없습니다.</div>
        );
      return <StatsPage selectedCup={cup} />;
    }

    function WorldcupMakerWrapper() {
      const navigate = useNavigate();
      return (
        <WorldcupMaker
          fetchWorldcups={fetchWorldcups}
          onCreate={() => {
            window.location.href = "/";
          }}
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
        <div className="main-content-box" style={{ overflowX: "hidden" }}>
          <Routes>
            <Route path="/" element={<HomeWrapper />} />
            <Route path="/select-round/:id" element={<SelectRoundPageWrapper />} />
            <Route path="/match/:id/:round" element={<MatchPage worldcupList={worldcupList} />} />
            <Route path="/result/:id/:round" element={<ResultPage worldcupList={worldcupList} />} />
            <Route path="/stats/:id" element={<StatsPageWrapper />} />
            <Route path="/worldcup-maker" element={<WorldcupMakerWrapper />} />
            <Route path="/manage" element={<ManageWorldcupWrapper />} />
            <Route path="/backup" element={<BackupPage worldcupList={worldcupList} setWorldcupList={setWorldcupList} />} />
            <Route path="/edit-worldcup/:id" element={<EditWorldcupPageWrapper />} />
            <Route path="/admin" element={<AdminRoute />} />
            <Route path="/admin-stats" element={<AdminStatsRoute />} />
            {/* ▼▼▼ 회원가입/로그인/찾기 라우트들 ▼▼▼ */}
            <Route path="/signup" element={<SignupBox />} />
            <Route path="/login" element={<LoginBox />} />
            <Route path="/find-id" element={<FindIdBox />} />
            <Route path="/find-pw" element={<FindPwBox />} />
          </Routes>
        </div>
      </>
    );
  }

  return (
    <div className="app-main-wrapper" style={{ overflowX: "hidden" }}>
      <Router>
        <AppRoutes />
      </Router>
    </div>
  );
}
export default App;
