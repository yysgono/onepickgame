import "./i18n";
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Header from "./components/Header";
import Home from "./components/Home";
import BackupPage from "./components/BackupPage";
import SelectRoundPage from "./components/SelectRoundPage";
import MatchPage from "./components/MatchPage";
import ResultPage from "./components/ResultPage";
import StatsPage from "./components/StatsPage";
import WorldcupMaker from "./components/WorldcupMaker";
import ManageWorldcup from "./components/ManageWorldcup";
import EditWorldcupPage from "./components/EditWorldcupPage";
import AdminBar from "./components/AdminBar";
import AdminDashboard from "./components/AdminDashboard";
import AdminStatsPage from "./components/AdminStatsPage";

// 회원가입, 아이디찾기, 비밀번호찾기 추가
import SignupBox from "./components/SignupBox";
import FindIdBox from "./components/FindIdBox";
import FindPwBox from "./components/FindPwBox";

const defaultWorldcupList = [
  {
    id: "default-1",
    title: "예시 월드컵",
    desc: "샘플 월드컵 설명",
    data: [
      { id: "1", name: "치킨", image: "https://picsum.photos/id/10/400/400" },
      { id: "2", name: "피자", image: "https://picsum.photos/id/20/400/400" },
      { id: "3", name: "햄버거", image: "https://picsum.photos/id/30/400/400" },
      { id: "4", name: "떡볶이", image: "https://picsum.photos/id/40/400/400" }
    ]
  }
];

function App() {
  const [worldcupList, setWorldcupList] = useState(() => {
    const saved = localStorage.getItem("onepickgame_worldcupList");
    if (saved) return JSON.parse(saved);
    return defaultWorldcupList;
  });

  const { i18n } = useTranslation();
  const currentUser = localStorage.getItem("onepickgame_user") || "";
  const isAdmin = currentUser === "admin";

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

  function handleAddWorldcup(cup) {
    const newList = [...worldcupList, cup];
    setWorldcupList(newList);
    localStorage.setItem("onepickgame_worldcupList", JSON.stringify(newList));
  }

  function handleBackup() {
    const data = localStorage.getItem("onepickgame_worldcupList") || "[]";
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
        localStorage.setItem("onepickgame_worldcupList", JSON.stringify(data));
        alert("복구 성공!");
        window.location.reload();
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

  // 홈 화면에서 월드컵 선택 시 라우팅
  function handleSelect(cup) {
    window.location.href = `/select-round/${cup.id}`;
  }

  // SelectRoundPage Wrapper - cup 객체 꼭 넘겨주기!
  function SelectRoundPageWrapper() {
    const { id } = useParams();
    const navigate = useNavigate();
    const cup = worldcupList.find(c => String(c.id) === id);
    if (!cup) return <div style={{ padding: 80 }}>월드컵 정보를 찾을 수 없습니다.</div>;
    return (
      <SelectRoundPage
        cup={cup}   // 반드시 cup 객체 전달!
        maxRound={cup.data.length}
        candidates={cup.data}
        onSelect={round => navigate(`/match/${id}/${round}`)}
      />
    );
  }

  // 통계 페이지 Wrapper
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
        onCreate={cup => {
          handleAddWorldcup(cup);
          navigate("/");
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
        setWorldcupList={setWorldcupList}
        cupId={id}
      />
    );
  }

  // 관리자 전용 Route
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
    <div className="app-main-wrapper">
      <Router>
        {/* 헤더는 라우터 바깥 최상단에 한 번만 렌더링 */}
        <Header
          onLangChange={handleLangChange}
          onBackup={handleBackup}
          onRestore={handleRestore}
          onMakeWorldcup={handleMakeWorldcup}
          isAdmin={isAdmin}
        />
        <div className="main-content-box">
          <Routes>
            <Route path="/" element={<Home worldcupList={worldcupList} onSelect={handleSelect} onMakeWorldcup={handleMakeWorldcup} />} />
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

            {/* 회원가입, 아이디찾기, 비밀번호찾기 페이지 */}
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
