import React, {
  useEffect,
  useState,
} from "react";

import { supabase } from "../utils/supabaseClient";

import {
  getWorldcupGames,
  getDeletedWorldcupGames,
  restoreWorldcupGame,
  permanentlyDeleteWorldcupGame,
} from "../utils/supabaseWorldcupApi";

/**
 * winner_stats에서
 * 최다 우승 후보 이미지 가져오기
 */
async function getMostWinnerThumbnail(
  cup_id
) {
  const { data, error } =
    await supabase
      .from("winner_stats")
      .select(
        "candidate_id, name, image, win_count"
      )
      .eq("cup_id", cup_id)
      .order("win_count", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data.image;
}

/**
 * 댓글 총 개수
 */
async function getTotalComments() {
  const { count, error } =
    await supabase
      .from("comments")
      .select("id", {
        count: "exact",
        head: true,
      });

  return error
    ? 0
    : count || 0;
}

/**
 * 운영자 PICK ID 목록
 */
async function getFixedCupIds() {
  const { data, error } =
    await supabase
      .from("fixed_worldcups")
      .select("worldcup_id")
      .order("order", {
        ascending: true,
      });

  if (error) {
    console.error(
      "운영자 PICK 조회 실패:",
      error
    );

    return [];
  }

  return (data || []).map(
    (row) => row.worldcup_id
  );
}

/**
 * 운영자 PICK 추가
 */
async function addFixedCupId(
  worldcup_id
) {
  const { error } =
    await supabase
      .from("fixed_worldcups")
      .insert([
        {
          worldcup_id,
        },
      ]);

  if (error) {
    throw error;
  }

  return true;
}

/**
 * 운영자 PICK 삭제
 */
async function removeFixedCupId(
  worldcup_id
) {
  const { error } =
    await supabase
      .from("fixed_worldcups")
      .delete()
      .eq(
        "worldcup_id",
        worldcup_id
      );

  if (error) {
    throw error;
  }

  return true;
}

export default function AdminDashboard() {
  const [
    totalWorldcups,
    setTotalWorldcups,
  ] = useState(0);

  const [
    totalComments,
    setTotalComments,
  ] = useState(0);

  const [
    allWorldcups,
    setAllWorldcups,
  ] = useState([]);

  const [
    fixedList,
    setFixedList,
  ] = useState([]);

  const [
    addId,
    setAddId,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  // 휴지통
  const [
    deletedWorldcups,
    setDeletedWorldcups,
  ] = useState([]);

  const [
    trashLoading,
    setTrashLoading,
  ] = useState(false);

  /**
   * ===================================================
   * 정상 월드컵/댓글 다시 로드
   * ===================================================
   */
  async function refreshDashboard() {
    try {
      const worldcups =
        await getWorldcupGames();

      setAllWorldcups(
        worldcups
      );

      setTotalWorldcups(
        worldcups.length
      );

      const comments =
        await getTotalComments();

      setTotalComments(
        comments
      );
    } catch (e) {
      console.error(
        "관리자 대시보드 조회 실패:",
        e
      );
    }
  }

  /**
   * ===================================================
   * 휴지통 조회
   * ===================================================
   */
  async function fetchTrash() {
    try {
      setTrashLoading(true);

      const data =
        await getDeletedWorldcupGames();

      setDeletedWorldcups(
        data
      );
    } catch (e) {
      console.error(
        "휴지통 조회 실패:",
        e
      );
    } finally {
      setTrashLoading(
        false
      );
    }
  }

  /**
   * 첫 로딩
   */
  useEffect(() => {
    refreshDashboard();
    fetchTrash();
  }, []);

  /**
   * ===================================================
   * 운영자 PICK 목록
   * ===================================================
   */
  async function fetchFixedList() {
    setLoading(true);

    try {
      const fixedIds =
        await getFixedCupIds();

      const cups = [];

      for (const id of fixedIds) {
        const cup =
          allWorldcups.find(
            (wc) =>
              String(wc.id) ===
              String(id)
          );

        // 휴지통에 있는 월드컵은 allWorldcups에 없으므로
        // 운영자 PICK에서도 자동으로 표시되지 않음
        if (cup) {
          const winnerThumb =
            await getMostWinnerThumbnail(
              id
            );

          const thumb =
            winnerThumb ||
            cup.data?.[0]
              ?.image ||
            "/default-thumb.png";

          cups.push({
            id: cup.id,
            title: cup.title,
            thumb,
          });
        }
      }

      setFixedList(cups);
    } catch (e) {
      console.error(
        "운영자 PICK 조회 실패:",
        e
      );
    } finally {
      setLoading(false);
    }
  }

  /**
   * 정상 월드컵이 갱신되면
   * 운영자 PICK도 동기화
   */
  useEffect(() => {
    if (
      allWorldcups.length >
      0
    ) {
      fetchFixedList();
    } else {
      setFixedList([]);
    }

    // eslint-disable-next-line
  }, [allWorldcups]);

  /**
   * ===================================================
   * 운영자 PICK 추가
   * ===================================================
   */
  async function handleAddFixedWorldcup(
    worldcupId
  ) {
    if (
      fixedList.some(
        (wc) =>
          String(wc.id) ===
          String(worldcupId)
      )
    ) {
      alert(
        "이미 추가된 월드컵입니다."
      );

      return;
    }

    const found =
      allWorldcups.find(
        (wc) =>
          String(wc.id) ===
          String(worldcupId)
      );

    if (!found) {
      alert(
        "존재하지 않는 월드컵 ID이거나 휴지통에 있는 월드컵입니다."
      );

      return;
    }

    try {
      await addFixedCupId(
        found.id
      );

      await fetchFixedList();
    } catch (e) {
      alert(
        "추가 실패: " +
          e.message
      );
    }
  }

  /**
   * ===================================================
   * 운영자 PICK 삭제
   * ===================================================
   */
  async function handleRemoveFixedWorldcup(
    worldcupId
  ) {
    if (
      !window.confirm(
        "운영자 PICK에서 제거할까요?"
      )
    ) {
      return;
    }

    try {
      await removeFixedCupId(
        worldcupId
      );

      await fetchFixedList();
    } catch (e) {
      alert(
        "삭제 실패: " +
          e.message
      );
    }
  }

  function handleAddClick(e) {
    e.preventDefault();

    if (!addId.trim()) {
      return;
    }

    handleAddFixedWorldcup(
      addId.trim()
    );

    setAddId("");
  }

  /**
   * ===================================================
   * 휴지통 복구
   * ===================================================
   */
  async function handleRestoreWorldcup(
    cup
  ) {
    if (
      !window.confirm(
        `"${cup.title}" 월드컵을 복구하시겠습니까?\n\n복구하면 사이트에 다시 표시됩니다.`
      )
    ) {
      return;
    }

    try {
      await restoreWorldcupGame(
        cup.id
      );

      await Promise.all([
        refreshDashboard(),
        fetchTrash(),
      ]);

      alert(
        "월드컵이 복구되었습니다!"
      );
    } catch (e) {
      console.error(
        "복구 실패:",
        e
      );

      alert(
        e?.message ||
          "복구 실패"
      );
    }
  }

  /**
   * ===================================================
   * 휴지통 영구삭제
   * ===================================================
   */
  async function handlePermanentDelete(
    cup
  ) {
    if (
      !window.confirm(
        `"${cup.title}"을 영구삭제하시겠습니까?\n\nStorage의 후보 이미지까지 삭제됩니다.`
      )
    ) {
      return;
    }

    if (
      !window.confirm(
        "정말 삭제할까요?\n\n이 작업은 복구할 수 없습니다."
      )
    ) {
      return;
    }

    try {
      const result =
        await permanentlyDeleteWorldcupGame(
          cup.id
        );

      await Promise.all([
        refreshDashboard(),
        fetchTrash(),
      ]);

      alert(
        `영구삭제 완료!\nStorage 이미지 ${
          result?.deletedImageCount ||
          0
        }개 삭제`
      );
    } catch (e) {
      console.error(
        "영구삭제 실패:",
        e
      );

      alert(
        e?.message ||
          "영구삭제 실패"
      );
    }
  }

  /**
   * 삭제 시간
   */
  function formatDeletedAt(
    deletedAt
  ) {
    if (!deletedAt) {
      return "-";
    }

    try {
      return new Date(
        deletedAt
      ).toLocaleString();
    } catch {
      return deletedAt;
    }
  }

  return (
    <div
      style={{
        maxWidth: 1050,
        margin:
          "40px auto",
        background: "#fff",
        borderRadius: 24,
        boxShadow:
          "0 4px 24px #e6ecfa",
        padding: 40,
      }}
    >
      <h2
        style={{
          fontWeight: 900,
          fontSize: 32,
          color: "#1976ed",
          marginBottom: 32,
          letterSpacing: -1,
        }}
      >
        🛡️ 관리자 대시보드
      </h2>

      {/* ============================================= */}
      {/* 통계 */}
      {/* ============================================= */}
      <div
        style={{
          display: "flex",
          gap: 30,
          flexWrap: "wrap",
          justifyContent:
            "center",
          marginBottom: 40,
        }}
      >
        <div
          style={{
            background:
              "#f6f8fc",
            borderRadius: 18,
            boxShadow:
              "0 2px 14px #dde4ef",
            minWidth: 210,
            padding:
              "30px 36px",
            textAlign:
              "center",
          }}
        >
          <div
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: "#666",
            }}
          >
            전체 월드컵 수
          </div>

          <div
            style={{
              fontSize: 38,
              fontWeight: 900,
              color:
                "#1976ed",
              marginTop: 10,
            }}
          >
            {totalWorldcups}
          </div>
        </div>

        <div
          style={{
            background:
              "#f6f8fc",
            borderRadius: 18,
            boxShadow:
              "0 2px 14px #dde4ef",
            minWidth: 210,
            padding:
              "30px 36px",
            textAlign:
              "center",
          }}
        >
          <div
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: "#666",
            }}
          >
            전체 댓글 수
          </div>

          <div
            style={{
              fontSize: 38,
              fontWeight: 900,
              color:
                "#1976ed",
              marginTop: 10,
            }}
          >
            {totalComments}
          </div>
        </div>
      </div>

      {/* ============================================= */}
      {/* 운영자 PICK */}
      {/* ============================================= */}
      <div
        style={{
          background:
            "#f9fafe",

          borderRadius:
            14,

          padding: 28,

          boxShadow:
            "0 1px 8px #dde5ef77",

          fontSize: 18,

          color: "#444",

          marginBottom:
            32,
        }}
      >
        <div
          style={{
            fontWeight:
              800,

            fontSize:
              21,

            marginBottom:
              18,

            color:
              "#174cd7",
          }}
        >
          👑 운영자 PICK 월드컵 관리
        </div>

        <form
          onSubmit={
            handleAddClick
          }
          style={{
            marginBottom:
              14,

            display:
              "flex",

            gap: 7,
          }}
        >
          <input
            value={addId}
            onChange={(e) =>
              setAddId(
                e.target.value
              )
            }
            placeholder="월드컵 ID 입력"
            style={{
              fontSize:
                16,

              padding:
                "8px 13px",

              borderRadius:
                7,

              border:
                "1.2px solid #bbb",

              width: 200,
            }}
            disabled={
              loading
            }
          />

          <button
            type="submit"
            style={{
              background:
                "#1976ed",

              color:
                "#fff",

              border:
                "none",

              borderRadius:
                7,

              fontWeight:
                700,

              fontSize:
                15,

              padding:
                "8px 16px",

              cursor:
                "pointer",
            }}
            disabled={
              loading
            }
          >
            추가
          </button>
        </form>

        <div
          style={{
            display:
              "flex",

            flexWrap:
              "wrap",

            gap: 18,

            marginTop:
              10,
          }}
        >
          {loading && (
            <div>
              고정 월드컵
              불러오는 중...
            </div>
          )}

          {fixedList.length ===
            0 &&
            !loading && (
              <div
                style={{
                  color:
                    "#888",

                  margin:
                    "18px 0",
                }}
              >
                아직 추가된
                고정 월드컵이
                없습니다.
              </div>
            )}

          {fixedList.map(
            (wc) => (
              <div
                key={wc.id}
                style={{
                  width: 120,

                  minHeight:
                    130,

                  background:
                    "#f6f8fa",

                  borderRadius:
                    9,

                  boxShadow:
                    "0 2px 8px #0001",

                  display:
                    "flex",

                  flexDirection:
                    "column",

                  alignItems:
                    "center",

                  position:
                    "relative",

                  marginBottom:
                    5,
                }}
              >
                <img
                  src={
                    wc.thumb
                  }
                  alt={
                    wc.title
                  }
                  style={{
                    width:
                      82,

                    height:
                      82,

                    objectFit:
                      "cover",

                    borderRadius:
                      6,

                    margin:
                      "10px 0 5px 0",

                    background:
                      "#eceff4",

                    cursor:
                      "pointer",
                  }}
                  onClick={() =>
                    window.open(
                      `/worldcup/${wc.id}`,
                      "_blank"
                    )
                  }
                />

                <div
                  style={{
                    fontWeight:
                      700,

                    fontSize:
                      13,

                    textAlign:
                      "center",

                    color:
                      "#174cd7",

                    maxWidth:
                      90,

                    whiteSpace:
                      "nowrap",

                    overflow:
                      "hidden",

                    textOverflow:
                      "ellipsis",
                  }}
                >
                  {wc.title}
                </div>

                <button
                  onClick={() =>
                    handleRemoveFixedWorldcup(
                      wc.id
                    )
                  }
                  style={{
                    position:
                      "absolute",

                    right: 4,
                    top: 4,

                    background:
                      "#e14444",

                    color:
                      "#fff",

                    border:
                      "none",

                    borderRadius:
                      6,

                    padding:
                      "2px 8px",

                    fontSize:
                      12,

                    cursor:
                      "pointer",

                    fontWeight:
                      700,
                  }}
                  disabled={
                    loading
                  }
                >
                  삭제
                </button>
              </div>
            )
          )}
        </div>
      </div>

      {/* ============================================= */}
      {/* ⭐ 관리자 월드컵 휴지통 */}
      {/* ============================================= */}
      <div
        style={{
          background:
            "#fff7f7",

          border:
            "1px solid #ffd7d7",

          borderRadius:
            14,

          padding: 28,

          boxShadow:
            "0 1px 8px #e5dede77",

          marginBottom:
            32,
        }}
      >
        <div
          style={{
            display:
              "flex",

            justifyContent:
              "space-between",

            alignItems:
              "center",

            gap: 10,

            marginBottom:
              16,
          }}
        >
          <div>
            <div
              style={{
                fontWeight:
                  900,

                fontSize:
                  22,

                color:
                  "#c53030",
              }}
            >
              🗑️ 월드컵 휴지통
            </div>

            <div
              style={{
                marginTop:
                  5,

                color:
                  "#777",

                fontSize:
                  13,
              }}
            >
              관리자가 삭제한
              월드컵만
              저장됩니다.
            </div>
          </div>

          <button
            type="button"
            onClick={
              fetchTrash
            }
            disabled={
              trashLoading
            }
            style={{
              border: 0,

              borderRadius:
                8,

              padding:
                "8px 14px",

              background:
                "#e5e7eb",

              color:
                "#333",

              fontWeight:
                700,

              cursor:
                trashLoading
                  ? "wait"
                  : "pointer",
            }}
          >
            {trashLoading
              ? "불러오는 중..."
              : "새로고침"}
          </button>
        </div>

        {trashLoading ? (
          <div
            style={{
              color: "#999",
              padding:
                "18px 0",
            }}
          >
            휴지통을
            불러오는 중...
          </div>
        ) : deletedWorldcups.length ===
          0 ? (
          <div
            style={{
              color: "#aaa",

              padding:
                "24px 0",

              textAlign:
                "center",
            }}
          >
            휴지통이
            비어 있습니다.
          </div>
        ) : (
          <div>
            {deletedWorldcups.map(
              (cup) => (
                <div
                  key={cup.id}
                  style={{
                    padding:
                      "15px 0",

                    borderBottom:
                      "1px solid #f1dede",

                    display:
                      "flex",

                    gap: 15,

                    alignItems:
                      "center",

                    flexWrap:
                      "wrap",
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      minWidth:
                        220,
                    }}
                  >
                    <div
                      style={{
                        fontSize:
                          17,

                        fontWeight:
                          800,

                        color:
                          "#333",
                      }}
                    >
                      {cup.title ||
                        "(제목 없음)"}
                    </div>

                    <div
                      style={{
                        fontSize:
                          12,

                        color:
                          "#888",

                        marginTop:
                          5,
                      }}
                    >
                      삭제 시간:{" "}
                      {formatDeletedAt(
                        cup.deleted_at
                      )}
                    </div>

                    <div
                      style={{
                        fontSize:
                          11,

                        color:
                          "#aaa",

                        marginTop:
                          3,

                        wordBreak:
                          "break-all",
                      }}
                    >
                      ID:{" "}
                      {cup.id}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleRestoreWorldcup(
                        cup
                      )
                    }
                    style={{
                      border:
                        "none",

                      borderRadius:
                        8,

                      padding:
                        "8px 16px",

                      background:
                        "#1976ed",

                      color:
                        "#fff",

                      fontWeight:
                        800,

                      cursor:
                        "pointer",
                    }}
                  >
                    복구
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handlePermanentDelete(
                        cup
                      )
                    }
                    style={{
                      border:
                        "none",

                      borderRadius:
                        8,

                      padding:
                        "8px 16px",

                      background:
                        "#222",

                      color:
                        "#fff",

                      fontWeight:
                        800,

                      cursor:
                        "pointer",
                    }}
                  >
                    영구삭제
                  </button>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* 안내 */}
      <div
        style={{
          background:
            "#f5f7fb",

          borderRadius:
            14,

          padding: 28,

          boxShadow:
            "0 1px 8px #dde5ef77",

          fontSize: 19,

          color: "#555",
        }}
      >
        월드컵/유저/댓글 관리 및 통계,
        데이터 백업은
        <br />
        상단 메뉴 또는 사이드바에서
        이동하세요.
      </div>
    </div>
  );
}