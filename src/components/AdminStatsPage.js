import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabaseClient";

// ======================================================
// 전체 월드컵 참여 수
// winner_stats의 win_count 전체 합계
// ======================================================
async function getTotalPlays() {
  try {
    const { data, error } = await supabase
      .from("winner_stats")
      .select("win_count");

    if (error) {
      console.error("총 월드컵 참여 수 조회 실패:", error);
      return 0;
    }

    if (!Array.isArray(data)) {
      return 0;
    }

    return data.reduce(
      (sum, row) => sum + Number(row?.win_count || 0),
      0
    );
  } catch (error) {
    console.error("총 월드컵 참여 수 계산 실패:", error);
    return 0;
  }
}

export default function AdminStatsPage() {
  const navigate = useNavigate();

  const [worldcupCount, setWorldcupCount] = useState(0);
  const [totalPlays, setTotalPlays] = useState(0);
  const [recentComments, setRecentComments] = useState([]);
  const [deletingCommentId, setDeletingCommentId] = useState(null);

  // ======================================================
  // 통계 불러오기
  // ======================================================
  useEffect(() => {
    let mounted = true;

    async function fetchStats() {
      try {
        // --------------------------------------------------
        // 월드컵 수
        // --------------------------------------------------
        const {
          data: wcData,
          error: wcError,
          count: wcCount,
        } = await supabase
          .from("worldcups")
          .select("id", {
            count: "exact",
          });

        if (mounted) {
          if (wcError) {
            console.error(
              "월드컵 수 조회 실패:",
              wcError
            );

            setWorldcupCount(0);
          } else {
            setWorldcupCount(
              wcCount ??
                (Array.isArray(wcData)
                  ? wcData.length
                  : 0)
            );
          }
        }

        // --------------------------------------------------
        // 전체 월드컵 참여 수
        // --------------------------------------------------
        const plays = await getTotalPlays();

        if (mounted) {
          setTotalPlays(plays);
        }

        // --------------------------------------------------
        // 최근 7일 댓글 30개
        // --------------------------------------------------
        const sevenDaysAgo = new Date();

        sevenDaysAgo.setDate(
          sevenDaysAgo.getDate() - 7
        );

        const isoSevenDaysAgo =
          sevenDaysAgo.toISOString();

        const {
          data: commentsData,
          error: commentError,
        } = await supabase
          .from("comments")
          .select(
            "id, content, created_at, cup_id"
          )
          .gte(
            "created_at",
            isoSevenDaysAgo
          )
          .order(
            "created_at",
            {
              ascending: false,
            }
          )
          .limit(30);

        if (!mounted) return;

        if (
          !commentError &&
          Array.isArray(commentsData)
        ) {
          setRecentComments(
            commentsData
          );
        } else {
          if (commentError) {
            console.error(
              "최근 댓글 조회 실패:",
              commentError
            );
          }

          setRecentComments([]);
        }
      } catch (error) {
        console.error(
          "관리자 통계 조회 실패:",
          error
        );
      }
    }

    fetchStats();

    return () => {
      mounted = false;
    };
  }, []);

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
  // 댓글 클릭 → 해당 월드컵 통계 페이지
  // ======================================================
  function handleCommentClick(
    cupId
  ) {
    const lang =
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
        margin: "40px auto",
        background: "#fff",
        borderRadius: 24,
        boxShadow:
          "0 4px 24px #e6ecfa",
        padding:
          "40px 16px 56px 16px",
      }}
    >
      {/* 제목 */}
      <h2
        style={{
          fontWeight: 900,
          fontSize: 32,
          color: "#1976ed",
          marginBottom: 32,
          letterSpacing: -1,
          textAlign: "center",
          textShadow:
            "0 1px 10px #b1deff30",
        }}
      >
        관리자 통계 대시보드
      </h2>

      {/* ==================================================
          상단 통계 카드
      ================================================== */}
      <div
        style={{
          display: "flex",
          gap: 30,
          flexWrap: "wrap",
          justifyContent:
            "center",
          marginBottom: 46,
        }}
      >
        {/* 현존하는 월드컵 수 */}
        <div
          style={{
            background:
              "linear-gradient(120deg, #fafdff 70%, #e3f0fb 100%)",

            borderRadius: 20,

            boxShadow:
              "0 4px 18px #1976ed13",

            minWidth: 210,

            padding:
              "34px 36px",

            textAlign:
              "center",

            cursor:
              "default",
          }}
        >
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#3b4872",
              marginBottom: 8,
            }}
          >
            현존하는 월드컵 수
          </div>

          <div
            style={{
              fontSize: 40,
              fontWeight: 900,
              color: "#1976ed",

              textShadow:
                "0 2px 12px #1976ed13",
            }}
          >
            {worldcupCount.toLocaleString()}
          </div>
        </div>

        {/* 총 월드컵 참여 수 */}
        <div
          style={{
            background:
              "linear-gradient(120deg, #fafdff 70%, #e5f7ef 100%)",

            borderRadius: 20,

            boxShadow:
              "0 4px 18px #38b27a13",

            minWidth: 210,

            padding:
              "34px 36px",

            textAlign:
              "center",

            cursor:
              "default",
          }}
        >
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#3b4872",
              marginBottom: 8,
            }}
          >
            총 월드컵 참여 수
          </div>

          <div
            style={{
              fontSize: 40,
              fontWeight: 900,
              color: "#38b27a",

              textShadow:
                "0 2px 12px #38b27a33",
            }}
          >
            {totalPlays.toLocaleString()}
          </div>
        </div>
      </div>

      {/* ==================================================
          최근 댓글
      ================================================== */}
      <div
        style={{
          background: "#f9fbff",

          borderRadius: 16,

          padding: 28,

          boxShadow:
            "0 1px 10px #dde5ef77",

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
          최근 댓글
          {" "}
          (최근 7일 내 최대 30개)
        </h4>

        {recentComments.length ===
        0 ? (
          <div
            style={{
              textAlign:
                "center",

              color: "#aaa",

              padding: 20,
            }}
          >
            댓글이 없습니다.
          </div>
        ) : (
          <ul
            style={{
              listStyle:
                "none",

              padding: 0,

              maxHeight:
                400,

              overflowY:
                "auto",

              color: "#000",
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
                      "0 1px 4px #ccc",

                    cursor:
                      "pointer",

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
                  {/* 댓글 내용 */}
                  <div
                    onClick={() =>
                      handleCommentClick(
                        comment.cup_id
                      )
                    }
                    style={{
                      flex: 1,

                      marginRight:
                        10,

                      wordBreak:
                        "break-word",
                    }}
                    title={
                      comment.content
                    }
                  >
                    {String(
                      comment.content ||
                        ""
                    ).length > 100
                      ? String(
                          comment.content ||
                            ""
                        ).slice(
                          0,
                          100
                        ) + "..."
                      : comment.content}
                  </div>

                  {/* 삭제 */}
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
                        "#e14444",

                      color: "#fff",

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
                    title="댓글 삭제"
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

      {/* 하단 */}
      <div
        style={{
          color: "#b6bbd2",

          textAlign:
            "center",

          fontSize: 13,

          marginTop: 32,
        }}
      >
        <span>
          onepickgame 관리자 통계 ©{" "}
          {new Date().getFullYear()}
        </span>
      </div>
    </div>
  );
}