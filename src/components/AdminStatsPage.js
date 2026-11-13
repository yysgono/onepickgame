import {activityLanguageLabel,normalizeActivityLanguage} from '../utils/activityLanguage';
import AdminContentSummary from "./AdminContentSummary";
import AdminRecentActivity from "./AdminRecentActivity";
import { getAdminWorldcupCount, getAdminTodayWorldcupCompletions, getAdminTotalCompletions, getAdminRecentPlays, getAdminRecentContentActivity, getAdminRecentComments, getTodayKstDateString } from "../utils/adminReadApi";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabaseClient";

export default function AdminStatsPage() {
  const navigate =
    useNavigate();

  const [
    worldcupCount,
    setWorldcupCount,
  ] = useState(null);

  const [
    totalPlays,
    setTotalPlays,
  ] = useState(null);

  const [
    todayPlays,
    setTodayPlays,
  ] = useState(null);

  const [
    recentComments,
    setRecentComments,
  ] = useState([]);

  const [
  recentPlays,
  setRecentPlays,
] = useState([]);

  const [
    deletingCommentId,
    setDeletingCommentId,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [quizPlays, setQuizPlays] = useState([]);
  const [tierViews, setTierViews] = useState([]);
  const [sectionErrors, setSectionErrors] = useState({});
  const [refreshTick, setRefreshTick] = useState(0);

  // ======================================================
  // 통계 불러오기
  // ======================================================
  useEffect(() => {
    let mounted = true;
    const today = getTodayKstDateString();
    setLoading(true);
    const keys = ["worldcups", "total", "todayWorldcup", "plays", "comments", "quizPlays", "tierViews"];
    Promise.allSettled([
      getAdminWorldcupCount(), getAdminTotalCompletions(), getAdminTodayWorldcupCompletions(today),
      getAdminRecentPlays(), getAdminRecentComments(),
      getAdminRecentContentActivity("quiz"), getAdminRecentContentActivity("tier-list"),
    ]).then(results => {
      if (!mounted) return;
      const errors = {};
      results.forEach((result, index) => {
        if (result.status === "rejected") {
          errors[keys[index]] = result.reason?.message || "조회 실패";
          console.warn("Admin statistics unavailable:", keys[index], result.reason);
        }
      });
      setWorldcupCount(results[0].status === "fulfilled" ? results[0].value : null);
      setTotalPlays(results[1].status === "fulfilled" ? results[1].value : null);
      setTodayPlays(results[2].status === "fulfilled" ? results[2].value : null);
      if (results[3].status === "fulfilled") setRecentPlays(results[3].value);
      if (results[4].status === "fulfilled") setRecentComments(results[4].value);
      setQuizPlays(results[5].status === "fulfilled" ? results[5].value : []);
      setTierViews(results[6].status === "fulfilled" ? results[6].value : []);
      setSectionErrors(errors);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, [refreshTick]);

  // ======================================================
  // 댓글 삭제
  // ======================================================
  async function handleDeleteComment(
    commentId
  ) {
    if (
      !window.confirm(
        "이 댓글을 삭제하시겠습니까?"
      )
    ) {
      return;
    }

    setDeletingCommentId(
      commentId
    );

    try {
      const { error } =
        await supabase
          .from("comments")
          .delete()
          .eq(
            "id",
            commentId
          );

      if (error) {
        alert(
          "댓글 삭제 실패: " +
            error.message
        );
      } else {
        alert(
          "댓글이 삭제되었습니다."
        );

        setRecentComments(
          (prev) =>
            prev.filter(
              (comment) =>
                comment.id !==
                commentId
            )
        );
      }
    } catch (error) {
      alert(
        "댓글 삭제 실패: " +
          error.message
      );
    } finally {
      setDeletingCommentId(
        null
      );
    }
  }

  // ======================================================
  // 댓글 클릭
  // ======================================================
  function handleCommentClick(
    cupId,
    language
  ) {
    const lang = normalizeActivityLanguage(language) ||
      window.location.pathname.match(
        /^\/([a-z]{2})(\/|$)/
      )?.[1] || "ko";

    navigate(
      `/${lang}/stats/${cupId}`
    );
  }

  return (
    <div
      style={{
        maxWidth: 950,

        margin:
          "40px auto",

        background:
          "#fff",

        borderRadius:
          24,

        boxShadow:
          "0 4px 16px rgba(25,32,52,0.07)",

        padding:
          "40px 16px 56px 16px",
      }}
    >
      {/* 제목 */}
      <h2
        style={{
          fontWeight:
            900,

          fontSize:
            34,

          color:
            "#5542b8",

          marginBottom:
            32,

          letterSpacing:
            -1,

          textAlign:
            "center",

          textShadow:
            "none",
        }}
      >
        관리자 통계 대시보드
      </h2>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <button type="button" disabled={loading} onClick={() => setRefreshTick(value => value + 1)}>{loading ? "불러오는 중..." : "통계 새로고침"}</button>
      </div>
      {Object.keys(sectionErrors).length > 0 && <div role="alert" style={{ padding: 16, marginBottom: 20, background: "#fff5f5", color: "#a12626", border: "1px solid #f3b4b4", borderRadius: 10 }}>
        <strong>일부 통계를 불러오지 못했습니다. 실패한 수치는 0회로 표시하지 않습니다.</strong>
        <ul>{Object.keys(sectionErrors).map(key => <li key={key}>{{ worldcups: "월드컵 수", total: "총 완료 수", todayWorldcup: "오늘 월드컵 완료 수", plays: "최근 완료 목록", comments: "최근 댓글", quizPlays: "퀴즈 최근 플레이", tierViews: "티어표 최근 열람" }[key]} 조회 실패</li>)}</ul>
        <button type="button" disabled={loading} onClick={() => setRefreshTick(value => value + 1)}>다시 시도</button>
      </div>}


      <AdminContentSummary refreshTick={refreshTick} worldcupStats={{ existing: worldcupCount, total: totalPlays, today: todayPlays }} worldcupLoading={loading} />

      {/* ==================================================
    최근 플레이
================================================== */}
<div
  style={{
    background: "#f9fbff",
    borderRadius: 16,
    padding: 28,
    boxShadow: "0 4px 16px rgba(25,32,52,0.07)",
    marginBottom: 32,
  }}
>
  <h4
    style={{
      fontWeight: 800,
      marginBottom: 20,
      marginTop: 0,
      fontSize: 22,
      color: "#26326b",
      textAlign: "center",
    }}
  >
    🏆 월드컵 최근 플레이 (최근 완료 30개)
  </h4>

  {loading ? (
    <div
      style={{
        textAlign: "center",
        color: "#596579",
        padding: 20,
      }}
    >
      최근 플레이를 불러오는 중...
    </div>
  ) : recentPlays.length === 0 ? (
    <div
      style={{
        textAlign: "center",
        color: "#596579",
        padding: 20,
      }}
    >
      {sectionErrors.plays ? "최근 완료 기록 조회에 실패했습니다." : "최근 플레이 기록이 없습니다."}
    </div>
  ) : (
    <div
      style={{
        maxHeight: 430,
        overflowY: "auto",
      }}
    >
      {recentPlays.map((play) => {
        const playedAt =
          new Date(
            play.created_at
          ).toLocaleString("ko-KR", {
            timeZone: "Asia/Seoul",
          });

        return (
          <div
            key={play.id}
            onClick={() =>
              handleCommentClick(
                play.cup_id,
                play.page_language
              )
            }
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              gap: 14,
              padding: "11px 13px",
              marginBottom: 8,
              background: "#fff",
              borderRadius: 10,
              boxShadow:
                "0 4px 16px rgba(25,32,52,0.07)",
              cursor: "pointer",
            }}
            title="클릭하면 해당 월드컵 통계로 이동합니다."
          >
            <div
              style={{
                minWidth: 0,
                flex: 1,
              }}
            >
              <div
                style={{
                  fontSize: 17,
                  fontWeight: 800,
                  color: "#222",
                  overflow: "hidden",
                  textOverflow:
                    "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{fontSize:12,fontWeight:700,color:"#596579",marginRight:8}}>{activityLanguageLabel(play.page_language)}</span>{play.worldcup_title}
              </div>
            </div>

            <div
              style={{
                flexShrink: 0,
                fontSize: 14,
                fontWeight: 700,
                color: "#5542b8",
                whiteSpace: "nowrap",
              }}
            >
              {playedAt}
            </div>
          </div>
        );
      })}
    </div>
  )}

  <div
    style={{
      textAlign: "center",
      color: "#5542b8",
      fontSize: 14,
      marginTop: 16,
    }}
  >
    끝까지 완료된 플레이 · 한국시간(KST)
  </div>
</div>
<AdminRecentActivity kind="quiz" items={quizPlays} loading={loading} error={sectionErrors.quizPlays} />
<AdminRecentActivity kind="tier-list" items={tierViews} loading={loading} error={sectionErrors.tierViews} />


      {/* ==================================================
          최근 댓글
      ================================================== */}
      <div
        style={{
          background:
            "#f9fbff",

          borderRadius:
            16,

          padding:
            28,

          boxShadow:
            "0 4px 16px rgba(25,32,52,0.07)",

          marginBottom:
            32,
        }}
      >
        <h4
          style={{
            fontWeight:
              800,

            marginBottom:
              20,

            marginTop:
              0,

            fontSize:
              22,

            color:
              "#26326b",

            textAlign:
              "center",
          }}
        >
          최근 댓글
          {" "}
          (최근 7일 내 최대 30개)
        </h4>

        {recentComments.length === 0 ? (
          <div
            style={{
              textAlign:
                "center",

              color:
                "#596579",

              padding:
                20,
            }}
          >
            {loading ? "댓글을 불러오는 중..." : sectionErrors.comments ? "댓글 조회에 실패했습니다." : "댓글이 없습니다."}
          </div>
        ) : (
          <ul
            style={{
              listStyle:
                "none",

              padding:
                0,

              maxHeight:
                400,

              overflowY:
                "auto",

              color:
                "#000",
            }}
          >
            {recentComments.map(
              (comment) => (
                <li
                  key={
                    comment.id
                  }
                  style={{
                    padding:
                      "8px 12px",

                    marginBottom:
                      10,

                    background:
                      "#fff",

                    borderRadius:
                      10,

                    boxShadow:
                      "0 4px 16px rgba(25,32,52,0.07)",

                    display:
                      "flex",

                    justifyContent:
                      "space-between",

                    alignItems:
                      "center",

                    color:
                      "#000",
                  }}
                >
                  <div
                    onClick={() =>
                      handleCommentClick(
                        comment.cup_id
                      )
                    }
                    style={{
                      flex:
                        1,

                      marginRight:
                        10,

                      wordBreak:
                        "break-word",

                      cursor:
                        "pointer",
                    }}
                    title={
                      comment.content
                    }
                  >
                    {String(
                      comment.content ||
                        ""
                    ).length >
                    100
                      ? String(
                          comment.content ||
                            ""
                        ).slice(
                          0,
                          100
                        ) +
                        "..."
                      : comment.content}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleDeleteComment(
                        comment.id
                      )
                    }
                    disabled={
                      deletingCommentId ===
                      comment.id
                    }
                    style={{
                      background:
                        "#c83232",

                      color:
                        "#ffffff",

                      border:
                        "none",

                      borderRadius:
                        6,

                      padding:
                        "5px 10px",

                      cursor:
                        deletingCommentId ===
                        comment.id
                          ? "not-allowed"
                          : "pointer",

                      fontWeight:
                        "bold",

                      opacity:
                        deletingCommentId ===
                        comment.id
                          ? 0.6
                          : 1,
                    }}
                  >
                    {deletingCommentId ===
                    comment.id
                      ? "삭제중..."
                      : "삭제"}
                  </button>
                </li>
              )
            )}
          </ul>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          color:
            "#5542b8",

          textAlign:
            "center",

          fontSize:
            15,

          marginTop:
            32,
        }}
      >
        onepickgame 관리자 통계 ©{" "}
        {new Date().getFullYear()}
      </div>
    </div>
  );
}



