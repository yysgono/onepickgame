import "./i18n";
import "./App.css";
import React, { useEffect } from "react";
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

// 회원가입/아이디찾기/비밀번호찾기 추가
import SignupBox from "./components/SignupBox";
import FindIdBox from "./components/FindIdBox";
import FindPwBox from "./components/FindPwBox";

import { fetchWorldcupById, fetchWorldcups } from "./db"; // db 불러오기

function App() {
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

  // 월드컵 리스트 백업/복구는 로컬에 남기고 싶을 때만 사용!
  function handleBackup() {
    alert("DB 연동 버전에서는 백업/복구 기능이 비활성화 될 수 있습니다.");
  }
  function handleRestore(e) {
    alert("DB 연동 버전에서는 백업/복구 기능이 비활성화 될 수 있습니다.");
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

  // Home 페이지 Wrapper (DB에서 월드컵 전체를 불러옴)
  function HomeWrapper() {
    const [worldcupList, setWorldcupList] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const navigate = useNavigate();

    useEffect(() => {
      setLoading(true);
      fetchWorldcups()
        .then(setWorldcupList)
        .finally(() => setLoading(false));
    }, []);

    return (
      <Home
        worldcupList={worldcupList}
        onSelect={cup => navigate(`/select-round/${cup.id}`)}
        onMakeWorldcup={handleMakeWorldcup}
        loading={loading}
      />
    );
  }

  // SelectRoundPage Wrapper (DB에서 해당 월드컵을 불러옴)
  function SelectRoundPageWrapper() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [cup, setCup] = React.useState(null);
    const [loading, setLoading] = React.useState(true);

    useEffect(() => {
      setLoading(true);
      fetchWorldcupById(id)
        .then(setCup)
        .finally(() => setLoading(false));
    }, [id]);

    if (loading) return <div style={{padding: 80, textAlign:"center"}}>로딩 중...</div>;
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

  // MatchPage Wrapper (DB에서 해당 월드컵을 불러옴)
  function MatchPageWrapper() {
    const { id, round } = useParams();
    const [cup, setCup] = React.useState(null);
    const [loading, setLoading] = React.useState(true);

    useEffect(() => {
      setLoading(true);
      fetchWorldcupById(id)
        .then(setCup)
        .finally(() => setLoading(false));
    }, [id]);

    if (loading) return <div style={{padding: 80, textAlign:"center"}}>로딩 중...</div>;
    if (!cup) return <div style={{ padding: 80 }}>월드컵 정보를 찾을 수 없습니다.</div>;
    return (
      <MatchPage
        cup={cup}
        round={Number(round)}
      />
    );
  }

  // ResultPage Wrapper (DB에서 해당 월드컵을 불러옴)
  function ResultPageWrapper() {
    const { id, round } = useParams();
    const [cup, setCup] = React.useState(null);
    const [loading, setLoading] = React.useState(true);

    useEffect(() => {
      setLoading(true);
      fetchWorldcupById(id)
        .then(setCup)
        .finally(() => setLoading(false));
    }, [id]);

    if (loading) return <div style={{padding: 80, textAlign:"center"}}>로딩 중...</div>;
    if (!cup) return <div style={{ padding: 80 }}>월드컵 정보를 찾을 수 없습니다.</div>;
    return (
      <ResultPage
        cup={cup}
        round={Number(round)}
      />
    );
  }

  // StatsPage Wrapper (DB에서 해당 월드컵을 불러옴)
  function StatsPageWrapper() {
    const { id } = useParams();
    const [cup, setCup] = React.useState(null);
    const [loading, setLoading] = React.useState(true);

    useEffect(() => {
      setLoading(true);
      fetchWorldcupById(id)
        .then(setCup)
        .finally(() => setLoading(false));
    }, [id]);

    if (loading) return <div style={{padding: 80, textAlign:"center"}}>로딩 중...</div>;
    if (!cup) return <div style={{ padding: 80 }}>월드컵 정보를 찾을 수 없습니다.</div>;
    return <StatsPage selectedCup={cup} />;
  }

  // 월드컵 생성(로컬X, 추후 DB 저장 함수로 바꿔주세요)
  function WorldcupMakerWrapper() {
    const navigate = useNavigate();
    return (
      <WorldcupMaker
        onCreate={() => navigate("/")}
        onCancel={() => navigate("/")}
      />
    );
  }

  // 아래 관리페이지 등은 필요시 DB방식으로 교체
  function ManageWorldcupWrapper() {
    return <ManageWorldcup user={currentUser} isAdmin={isAdmin} />;
  }

  function EditWorldcupPageWrapper() {
    const { id } = useParams();
    return <EditWorldcupPage cupId={id} />;
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
    <div className="app-main-wrapper" style={{overflowX:"hidden"}}>
      <Router>
        {/* 최상단 고정 헤더 하나만 노출 */}
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
            <Route path="/match/:id/:round" element={<MatchPageWrapper />} />
            <Route path="/result/:id/:round" element={<ResultPageWrapper />} />
            <Route path="/result/:id/:round" element={<ResultPage />} />
                      <Route path="/stats/:id" element={<StatsPageWrapper />} />
            <Route path="/worldcup-maker" element={<WorldcupMakerWrapper />} />
            <Route path="/manage" element={<ManageWorldcupWrapper />} />
            <Route path="/backup" element={<BackupPage />} />
            <Route path="/edit-worldcup/:id" element={<EditWorldcupPageWrapper />} />
            <Route path="/admin" element={<AdminRoute />} />
            <Route path="/admin-stats" element={<AdminStatsRoute />} />

            {/* 회원가입/아이디찾기/비밀번호찾기 */}
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
