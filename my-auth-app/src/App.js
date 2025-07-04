import "./i18n";
import "./App.css";
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from "react-router-dom";
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
import FindIdBox from "./components/FindIdBox";
import FindPwBox from "./components/FindPwBox";
import AuthBox from "./components/AuthBox";

import { getWorldcupGames, deleteWorldcupGame } from "./utils/supabaseWorldcupApi"; // ← deleteWorldcupGame import 추가

function App() {
  const [worldcupList, setWorldcupList] = useState([]);
  const { i18n } = useTranslation();
  const currentUser = localStorage.getItem("onepickgame_user") || "";
  const isAdmin = currentUser === "admin";

  // DB에서 월드컵 리스트 불러오기
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
    const today = new Date().toISOString().slice(0, 10);
    let userId = localStorage.getItem("onepickgame_user");
    if (!userId) {
      userId = localStorage.getItem("onepickgame_guest_id");
      if (!userId) {
        userId = "guest-" + Date.now() + "-" + Math.floor(Math.random() * 1000000);
        localStorage.setItem("onepickgame_guest_id", userId);
      }
    }
    let logs = JSON.parse(localStorage.getItem("visitLogs") || "{}");
    if (!logs[today]) logs[today] = [];
    if (!logs[today].includes(userId)) logs[today].push(userId);
    localStorage.setItem("visitLogs", JSON.stringify(logs));
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
    reader.onload = function(ev) {
      try {
        const data = JSON.parse(ev.target.result);
        if (!Array.isArray(data)) throw new Error("형식 오류");
        setWorldcupList(data); // 단순 프론트 복구
        alert("복구 성공! (프론트에만 적용, DB 반영은 별도)");
      } catch {
        alert("복구 실패!");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function handleMakeWorldcup() {
    const currentUser = localStorage.getItem("onepickgame_user") || "";
    if (!currentUser) {
      alert("로그인이 필요합니다.");
      return;
    }
    window.location.href = "/worldcup-maker";
  }

  // HomeWrapper에서 삭제 반영!
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
            await deleteWorldcupGame(id); // DB 삭제
            setWorldcupList(list => list.filter(cup => cup.id !== id)); // 프론트에서도 삭제
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
    if (!cup) return <div style={{ padding: 80 }}>월드컵 정보를 찾을 수 없습니다.</div>;
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
    if (!cup) return <div style={{ padding: 80 }}>월드컵 정보를 찾을 수 없습니다.</div>;
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
      />
    );
  }

  function ManageWorldcupWrapper() {
    return (
      <ManageWorldcup
        user={currentUser}
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
        <AdminBar onLogout={() => {
          localStorage.removeItem("onepickgame_user");
          window.location.reload();
        }} />
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
        <AdminBar onLogout={() => {
          localStorage.removeItem("onepickgame_user");
          window.location.reload();
        }} />
        <AdminStatsPage />
      </>
    );
  }

  return (
    <div className="app-main-wrapper" style={{overflowX:"hidden"}}>
      <Router>
        <Header
          onLangChange={handleLangChange}
          onBackup={handleBackup}
          onRestore={handleRestore}
          onMakeWorldcup={handleMakeWorldcup}
          isAdmin={isAdmin}
        />
        <div className="main-content-box" style={{overflowX:"hidden"}}>
          <Routes>
            <Route path="/" element={<HomeWrapper />} />
            <Route path="/select-round/:id" element={<SelectRoundPageWrapper />} />
            <Route path="/match/:id/:round" element={<MatchPage worldcupList={worldcupList} />} />
            <Route path="/result/:id/:round" element={<ResultPage worldcupList={worldcupList} />} />
            <Route path="/stats/:id" element={<StatsPageWrapper />} />
            <Route path="/auth" element={<AuthBox />} />
            <Route path="/worldcup-maker" element={<WorldcupMakerWrapper />} />
            <Route path="/manage" element={<ManageWorldcupWrapper />} />
            <Route path="/backup" element={<BackupPage worldcupList={worldcupList} setWorldcupList={setWorldcupList} />} />
            <Route path="/edit-worldcup/:id" element={<EditWorldcupPageWrapper />} />
            <Route path="/admin" element={<AdminRoute />} />
            <Route path="/admin-stats" element={<AdminStatsRoute />} />
            <Route path="/signup" element={<SignupBox />} />
            <Route path="/find-id" element={<FindIdBox />} />
            <Route path="/find-pw" element={<FindPwBox />} />
          </Routes>
        </div>
      </Router>
    </div>
  );
}

export default App;
