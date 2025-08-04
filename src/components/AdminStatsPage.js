import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabaseClient";

// 방문 기록 (하루 1회만 기록)
async function logVisit() {
  let anon_id = localStorage.getItem("anon_id");
  if (!anon_id) {
    anon_id = Math.random().toString(36).substr(2, 12);
    localStorage.setItem("anon_id", anon_id);
  }
  const today = new Date().toISOString().slice(0, 10);
  if (localStorage.getItem("visit_logged_" + today)) return;
  await supabase.from("visit_logs").insert([
    {
      anon_id,
      user_agent: window.navigator.userAgent,
    },
  ]);
  localStorage.setItem("visit_logged_" + today, "1");
}

// 오늘 방문자 수 (유니크)
async function getTodayVisitors() {
  const { data, error } = await supabase.rpc("get_today_visitors");
  if (error || !data) return 0;
  return data[0] || 0;
}

// 최근 7일 방문자 수 (유니크)
async function getRecent7Visitors() {
  const { data, error } = await supabase.rpc("get_recent7_visitors");
  if (error || !data) return [];
  // Supabase 함수에서 visit_date, unique_visitors로 옴
  return data.map(row => ({
    date: row.visit_date,
    count: row.unique_visitors,
  }));
}

export default function AdminStatsPage() {
  const navigate = useNavigate();

  const [worldcupCount, setWorldcupCount] = useState(0);
  const [recentComments, setRecentComments] = useState([]);
  const [todayUsers, setTodayUsers] = useState(0);
  const [recent7, setRecent7] = useState([]);
  const [deletingCommentId, setDeletingCommentId] = useState(null);

  useEffect(() => {
    // 방문자 기록 (최초 1회)
    logVisit();

    async function fetchStats() {
      // 월드컵 수 가져오기
      const { data: wcData, error: wcError, count: wcCount } = await supabase
        .from("worldcups")
        .select("id", { count: "exact" });

      if (wcError) {
        setWorldcupCount(0);
      } else {
        setWorldcupCount(wcCount ?? (wcData ? wcData.length : 0));
      }

      // 최근 7일 댓글 30개 가져오기
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const isoSevenDaysAgo = sevenDaysAgo.toISOString();

      const { data: commentsData, error: commentError } = await supabase
        .from("comments")
        .select("id, content, created_at, cup_id")
        .gte("created_at", isoSevenDaysAgo)
        .order("created_at", { ascending: false })
        .limit(30);

      if (!commentError && commentsData) {
        setRecentComments(commentsData);
      } else {
        setRecentComments([]);
      }

      // Supabase 함수로 오늘 방문자수/최근7일 방문자수 불러오기
      setTodayUsers(await getTodayVisitors());
      setRecent7(await getRecent7Visitors());
    }

    fetchStats();
  }, []);

  async function handleDeleteComment(commentId) {
    if (!window.confirm("이 댓글을 삭제하시겠습니까?")) return;
    setDeletingCommentId(commentId);

    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId);

    if (error) {
      alert("댓글 삭제 실패: " + error.message);
    } else {
      alert("댓글이 삭제되었습니다.");
      setRecentComments((prev) => prev.filter((c) => c.id !== commentId));
    }
    setDeletingCommentId(null);
  }

  function handleCommentClick(cupId) {
    const lang = window.location.pathname.match(/^\/([a-z]{2})(\/|$)/)?.[1] || "ko";
    navigate(`/${lang}/stats/${cupId}`);
  }

  const chartMax = Math.max(...recent7.map((r) => r.count), 1);

  return (
    <div
      style={{
        maxWidth: 950,
        margin: "40px auto",
        background: "#fff",
        borderRadius: 24,
        boxShadow: "0 4px 24px #e6ecfa",
        padding: "40px 16px 56px 16px",
      }}
    >
      <h2
        style={{
          fontWeight: 900,
          fontSize: 32,
          color: "#1976ed",
          marginBottom: 32,
          letterSpacing: -1,
          textAlign: "center",
          textShadow: "0 1px 10px #b1deff30",
        }}
      >
        관리자 통계 대시보드
      </h2>

      <div
        style={{
          display: "flex",
          gap: 30,
          flexWrap: "wrap",
          justifyContent: "center",
          marginBottom: 46,
        }}
      >
        <div
          style={{
            background: "linear-gradient(120deg, #fafdff 70%, #e3f0fb 100%)",
            borderRadius: 20,
            boxShadow: "0 4px 18px #1976ed13",
            minWidth: 210,
            padding: "34px 36px",
            textAlign: "center",
            cursor: "default",
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 700, color: "#3b4872", marginBottom: 8 }}>
            현존하는 월드컵 수
          </div>
          <div
            style={{
              fontSize: 40,
              fontWeight: 900,
              color: "#1976ed",
              textShadow: "0 2px 12px #1976ed13",
            }}
          >
            {worldcupCount}
          </div>
        </div>
        <div
          style={{
            background: "linear-gradient(120deg, #fafdff 70%, #e3f0fb 100%)",
            borderRadius: 20,
            boxShadow: "0 4px 18px #38b27a13",
            minWidth: 210,
            padding: "34px 36px",
            textAlign: "center",
            cursor: "default",
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 700, color: "#3b4872", marginBottom: 8 }}>
            오늘 접속자 수
          </div>
          <div
            style={{
              fontSize: 40,
              fontWeight: 900,
              color: "#38b27a",
              textShadow: "0 2px 12px #38b27a33",
            }}
          >
            {todayUsers}
          </div>
        </div>
      </div>

      <div
        style={{
          background: "#f5f7fb",
          borderRadius: 16,
          padding: 28,
          boxShadow: "0 1px 10px #dde5ef77",
          marginBottom: 32,
        }}
      >
        <h4
          style={{
            fontWeight: 800,
            marginBottom: 22,
            fontSize: 20,
            color: "#26326b",
          }}
        >
          최근 7일 접속자 수
        </h4>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 19,
            height: 120,
            marginBottom: 12,
          }}
        >
          {recent7.map((r) => (
            <div
              key={r.date}
              style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}
            >
              <div
                style={{
                  height: `${(r.count / chartMax) * 80 + 18}px`,
                  width: 21,
                  background: "linear-gradient(180deg, #4ea2f9 70%, #1976ed 100%)",
                  borderRadius: 8,
                  marginBottom: 6,
                  transition: "height 0.25s",
                }}
                title={r.count}
              />
              {/* 숫자 표시 */}
              <span
                style={{
                  fontSize: 13,
                  color: "#222",
                  fontWeight: 700,
                  marginBottom: 2,
                }}
              >
                {r.count}
              </span>
              <span
                style={{
                  fontSize: 12,
                  color: "#bbb",
                  letterSpacing: 0,
                  textAlign: "center",
                }}
              >
                {r.date.slice(5).replace("-", "/")}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          background: "#f9fbff",
          borderRadius: 16,
          padding: 28,
          boxShadow: "0 1px 10px #dde5ef77",
          marginBottom: 32,
        }}
      >
        <h4
          style={{
            fontWeight: 800,
            marginBottom: 20,
            fontSize: 20,
            color: "#26326b",
            textAlign: "center",
          }}
        >
          최근 댓글 (최근 7일 내 최대 30개)
        </h4>
        {recentComments.length === 0 ? (
          <div style={{ textAlign: "center", color: "#aaa", padding: 20 }}>
            댓글이 없습니다.
          </div>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, maxHeight: 400, overflowY: "auto", color: "#000" }}>
            {recentComments.map((comment) => (
              <li
                key={comment.id}
                style={{
                  padding: "8px 12px",
                  marginBottom: 10,
                  background: "#fff",
                  borderRadius: 10,
                  boxShadow: "0 1px 4px #ccc",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  color: "#000",
                }}
              >
                <div
                  onClick={() => handleCommentClick(comment.cup_id)}
                  style={{ flex: 1, marginRight: 10, wordBreak: "break-word" }}
                  title={comment.content}
                >
                  {comment.content.length > 100
                    ? comment.content.slice(0, 100) + "..."
                    : comment.content}
                </div>
                <button
                  onClick={() => handleDeleteComment(comment.id)}
                  disabled={deletingCommentId === comment.id}
                  style={{
                    background: "#e14444",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    padding: "5px 10px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                  title="댓글 삭제"
                >
                  {deletingCommentId === comment.id ? "삭제중..." : "삭제"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div
        style={{
          color: "#b6bbd2",
          textAlign: "center",
          fontSize: 13,
          marginTop: 32,
        }}
      >
        <span>onepickgame 관리자 통계 © {new Date().getFullYear()}</span>
      </div>
    </div>
  );
}
