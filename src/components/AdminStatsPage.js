import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabaseClient";

// ======================================================
// KST 날짜 유틸
// ======================================================

// 현재 한국 날짜 YYYY-MM-DD
function getTodayKstDateString() {
  const now = new Date();

  const kst = new Date(
    now.getTime() + 9 * 60 * 60 * 1000
  );

  return kst
    .toISOString()
    .slice(0, 10);
}

// YYYY-MM-DD에서 days 만큼 이동
function addDays(dateString, days) {
  const [year, month, day] = dateString
    .split("-")
    .map(Number);

  const date = new Date(
    Date.UTC(
      year,
      month - 1,
      day + days
    )
  );

  return date
    .toISOString()
    .slice(0, 10);
}

// 한국 날짜 00:00 ~ 다음날 00:00을 UTC ISO로 변환
function getKstDayRangeUtc(dateString) {
  const [year, month, day] = dateString
    .split("-")
    .map(Number);

  // KST 00:00 = UTC 전날 15:00
  const startUtc = new Date(
    Date.UTC(
      year,
      month - 1,
      day,
      0,
      0,
      0
    ) -
      9 * 60 * 60 * 1000
  );

  const endUtc = new Date(
    startUtc.getTime() +
      24 * 60 * 60 * 1000
  );

  return {
    start: startUtc.toISOString(),
    end: endUtc.toISOString(),
  };
}

// ======================================================
// 총 월드컵 참여 수
// winner_logs 1행 = 월드컵 1회 완료
// ======================================================
async function getTotalPlays() {
  try {
    const { count, error } =
      await supabase
        .from("winner_logs")
        .select("id", {
          count: "exact",
          head: true,
        });

    if (error) {
      console.error(
        "총 참여 수 조회 실패:",
        error
      );

      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error(
      "총 참여 수 조회 오류:",
      error
    );

    return 0;
  }
}

// ======================================================
// 특정 한국 날짜 참여 수
// ======================================================
async function getDailyPlayCount(
  dateString
) {
  try {
    const { start, end } =
      getKstDayRangeUtc(dateString);

    const { count, error } =
      await supabase
        .from("winner_logs")
        .select("id", {
          count: "exact",
          head: true,
        })
        .gte(
          "created_at",
          start
        )
        .lt(
          "created_at",
          end
        );

    if (error) {
      console.error(
        `${dateString} 참여 수 조회 실패:`,
        error
      );

      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error(
      `${dateString} 참여 수 조회 오류:`,
      error
    );

    return 0;
  }
}

// ======================================================
// 최근 7일 참여 수
// 한국시간 기준
// ======================================================
async function getRecent7Plays() {
  const today =
    getTodayKstDateString();

  const dates = [];

  // 6일 전 → 오늘
  for (let i = 6; i >= 0; i--) {
    dates.push(
      addDays(
        today,
        -i
      )
    );
  }

  const result =
    await Promise.all(
      dates.map(
        async (date) => {
          const count =
            await getDailyPlayCount(
              date
            );

          return {
            date,
            count,
          };
        }
      )
    );

  return result;
}

export default function AdminStatsPage() {
  const navigate =
    useNavigate();

  const [
    worldcupCount,
    setWorldcupCount,
  ] = useState(0);

  const [
    totalPlays,
    setTotalPlays,
  ] = useState(0);

  const [
    todayPlays,
    setTodayPlays,
  ] = useState(0);

  const [
    recent7,
    setRecent7,
  ] = useState([]);

  const [
    recentComments,
    setRecentComments,
  ] = useState([]);

  const [
    deletingCommentId,
    setDeletingCommentId,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  // ======================================================
  // 통계 불러오기
  // ======================================================
  useEffect(() => {
    let mounted = true;

    async function fetchStats() {
      setLoading(true);

      try {
        // ----------------------------------------------
        // 월드컵 수
        // ----------------------------------------------
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
                (
                  Array.isArray(
                    wcData
                  )
                    ? wcData.length
                    : 0
                )
            );
          }
        }

        // ----------------------------------------------
        // 총 참여 수
        // ----------------------------------------------
        const total =
          await getTotalPlays();

        if (mounted) {
          setTotalPlays(
            total
          );
        }

        // ----------------------------------------------
        // 최근 7일 참여 수
        // ----------------------------------------------
        const recent =
          await getRecent7Plays();

        if (mounted) {
          setRecent7(
            recent
          );

          const today =
            getTodayKstDateString();

          const todayRow =
            recent.find(
              (row) =>
                row.date ===
                today
            );

          setTodayPlays(
            todayRow?.count ||
              0
          );
        }

        // ----------------------------------------------
        // 최근 7일 댓글 최대 30개
        // ----------------------------------------------
        const sevenDaysAgo =
          new Date();

        sevenDaysAgo.setDate(
          sevenDaysAgo.getDate() -
            7
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

        if (!mounted) {
          return;
        }

        if (
          !commentError &&
          Array.isArray(
            commentsData
          )
        ) {
          setRecentComments(
            commentsData
          );
        } else {
          if (commentError) {
            console.error(
              "댓글 조회 실패:",
              commentError
            );
          }

          setRecentComments(
            []
          );
        }
      } catch (error) {
        console.error(
          "관리자 통계 조회 실패:",
          error
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
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
  // 댓글 클릭
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

  // ======================================================
  // 그래프 최대값
  // ======================================================
  const chartMax =
    Math.max(
      ...recent7.map(
        (row) =>
          row.count
      ),
      1
    );

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
          "0 4px 24px #e6ecfa",

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
            32,

          color:
            "#1976ed",

          marginBottom:
            32,

          letterSpacing:
            -1,

          textAlign:
            "center",

          textShadow:
            "0 1px 10px #b1deff30",
        }}
      >
        관리자 통계 대시보드
      </h2>

      {/* ==================================================
          상단 통계
      ================================================== */}
      <div
        style={{
          display:
            "flex",

          gap:
            20,

          flexWrap:
            "wrap",

          justifyContent:
            "center",

          marginBottom:
            40,
        }}
      >
        {/* 월드컵 수 */}
        <div
          style={{
            background:
              "linear-gradient(120deg, #fafdff 70%, #e3f0fb 100%)",

            borderRadius:
              20,

            boxShadow:
              "0 4px 18px #1976ed13",

            minWidth:
              190,

            flex:
              "1 1 190px",

            maxWidth:
              240,

            padding:
              "30px 24px",

            textAlign:
              "center",
          }}
        >
          <div
            style={{
              fontSize:
                17,

              fontWeight:
                700,

              color:
                "#3b4872",

              marginBottom:
                8,
            }}
          >
            현존하는 월드컵 수
          </div>

          <div
            style={{
              fontSize:
                40,

              fontWeight:
                900,

              color:
                "#1976ed",
            }}
          >
            {worldcupCount.toLocaleString()}
          </div>
        </div>

        {/* 총 참여 수 */}
        <div
          style={{
            background:
              "linear-gradient(120deg, #fafdff 70%, #e5f7ef 100%)",

            borderRadius:
              20,

            boxShadow:
              "0 4px 18px #38b27a13",

            minWidth:
              190,

            flex:
              "1 1 190px",

            maxWidth:
              240,

            padding:
              "30px 24px",

            textAlign:
              "center",
          }}
        >
          <div
            style={{
              fontSize:
                17,

              fontWeight:
                700,

              color:
                "#3b4872",

              marginBottom:
                8,
            }}
          >
            총 월드컵 참여 수
          </div>

          <div
            style={{
              fontSize:
                40,

              fontWeight:
                900,

              color:
                "#38b27a",
            }}
          >
            {loading
              ? "..."
              : totalPlays.toLocaleString()}
          </div>
        </div>

        {/* 오늘 참여 수 */}
        <div
          style={{
            background:
              "linear-gradient(120deg, #fafdff 70%, #fff1dd 100%)",

            borderRadius:
              20,

            boxShadow:
              "0 4px 18px #ffab4018",

            minWidth:
              190,

            flex:
              "1 1 190px",

            maxWidth:
              240,

            padding:
              "30px 24px",

            textAlign:
              "center",
          }}
        >
          <div
            style={{
              fontSize:
                17,

              fontWeight:
                700,

              color:
                "#3b4872",

              marginBottom:
                8,
            }}
          >
            오늘 참여 수
          </div>

          <div
            style={{
              fontSize:
                40,

              fontWeight:
                900,

              color:
                "#f39a22",
            }}
          >
            {loading
              ? "..."
              : todayPlays.toLocaleString()}
          </div>
        </div>
      </div>

      {/* ==================================================
          최근 7일 참여 그래프
      ================================================== */}
      <div
        style={{
          background:
            "#f5f7fb",

          borderRadius:
            16,

          padding:
            28,

          boxShadow:
            "0 1px 10px #dde5ef77",

          marginBottom:
            32,
        }}
      >
        <h4
          style={{
            fontWeight:
              800,

            margin:
              "0 0 26px 0",

            fontSize:
              20,

            color:
              "#26326b",

            textAlign:
              "center",
          }}
        >
          최근 7일 월드컵 참여 수
        </h4>

        {loading ? (
          <div
            style={{
              textAlign:
                "center",

              color:
                "#999",

              padding:
                30,
            }}
          >
            통계를 불러오는 중...
          </div>
        ) : (
          <div
            style={{
              display:
                "flex",

              alignItems:
                "flex-end",

              gap:
                14,

              minHeight:
                170,
            }}
          >
            {recent7.map(
              (row) => {
                const barHeight =
                  row.count === 0
                    ? 8
                    : Math.max(
                        18,
                        (
                          row.count /
                          chartMax
                        ) *
                          110
                      );

                return (
                  <div
                    key={
                      row.date
                    }
                    style={{
                      flex:
                        1,

                      minWidth:
                        0,

                      display:
                        "flex",

                      flexDirection:
                        "column",

                      alignItems:
                        "center",

                      justifyContent:
                        "flex-end",
                    }}
                  >
                    {/* 숫자 */}
                    <div
                      style={{
                        fontSize:
                          14,

                        fontWeight:
                          900,

                        color:
                          "#26326b",

                        marginBottom:
                          6,
                      }}
                    >
                      {row.count.toLocaleString()}
                    </div>

                    {/* 막대 */}
                    <div
                      title={`${row.date}: ${row.count}회`}
                      style={{
                        width:
                          "clamp(18px, 45%, 34px)",

                        height:
                          barHeight,

                        background:
                          row.count > 0
                            ? "linear-gradient(180deg, #4ea2f9 0%, #1976ed 100%)"
                            : "#dce4ef",

                        borderRadius:
                          "8px 8px 4px 4px",

                        boxShadow:
                          row.count > 0
                            ? "0 3px 10px #1976ed22"
                            : "none",

                        transition:
                          "height 0.25s",
                      }}
                    />

                    {/* 날짜 */}
                    <div
                      style={{
                        marginTop:
                          7,

                        fontSize:
                          12,

                        color:
                          "#8d96aa",

                        fontWeight:
                          700,

                        whiteSpace:
                          "nowrap",
                      }}
                    >
                      {row.date
                        .slice(5)
                        .replace(
                          "-",
                          "/"
                        )}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}

        <div
          style={{
            textAlign:
              "center",

            color:
              "#a0a8b9",

            fontSize:
              12,

            marginTop:
              18,
          }}
        >
          한국시간(KST) 기준
        </div>
      </div>

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
            "0 1px 10px #dde5ef77",

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
              20,

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
                "#aaa",

              padding:
                20,
            }}
          >
            댓글이 없습니다.
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
                      "0 1px 4px #ccc",

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
                        "#e14444",

                      color:
                        "#fff",

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
            "#b6bbd2",

          textAlign:
            "center",

          fontSize:
            13,

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