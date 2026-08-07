import React, { useEffect, useState } from "react";

import {
  getWorldcupGames,
  deleteWorldcupGame,
  softDeleteWorldcupGame,
  getDeletedWorldcupGames,
  restoreWorldcupGame,
  permanentlyDeleteWorldcupGame,
} from "../utils/supabaseWorldcupApi";

// =====================================================
// JSON 다운로드
// =====================================================
function downloadJson(filename, jsonObj) {
  const blob = new Blob(
    [JSON.stringify(jsonObj, null, 2)],
    {
      type: "application/json",
    }
  );

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

function ManageWorldcup({
  user,
  isAdmin,
  worldcupList,
  setWorldcupList,
}) {
  const userId =
    typeof user === "object"
      ? user?.id || user?.email
      : user;

  // =====================================================
  // 일반 사용자 → 본인 월드컵만
  // 관리자 → 전체 월드컵
  // =====================================================
  const myWorldcups = isAdmin
    ? worldcupList
    : worldcupList.filter(
        (w) =>
          w.creator === userId ||
          w.owner === userId ||
          w.creator_id === userId
      );

  const [backupText, setBackupText] = useState("");

  // 관리자 휴지통
  const [deletedWorldcups, setDeletedWorldcups] =
    useState([]);

  const [trashLoading, setTrashLoading] =
    useState(false);

  // =====================================================
  // 관리자면 처음 들어왔을 때 휴지통 조회
  // =====================================================
  useEffect(() => {
    if (!isAdmin) {
      setDeletedWorldcups([]);
      return;
    }

    loadTrash();
  }, [isAdmin]);

  // =====================================================
  // 휴지통 새로고침
  // =====================================================
  async function loadTrash() {
    if (!isAdmin) return;

    try {
      setTrashLoading(true);

      const data =
        await getDeletedWorldcupGames();

      setDeletedWorldcups(data);
    } catch (e) {
      console.error(
        "휴지통 조회 실패:",
        e
      );
    } finally {
      setTrashLoading(false);
    }
  }

  // =====================================================
  // 정상 월드컵 목록 새로고침
  // =====================================================
  async function refreshWorldcups() {
    const freshList =
      await getWorldcupGames();

    setWorldcupList(freshList);
  }

  // =====================================================
  // 백업
  // =====================================================
  function handleBackup() {
    const stats =
      localStorage.getItem("winnerStats");

    const comments =
      localStorage.getItem("comments");

    setBackupText(
      JSON.stringify(
        {
          worldcups: worldcupList,
          stats: stats
            ? JSON.parse(stats)
            : {},
          comments: comments
            ? JSON.parse(comments)
            : {},
        },
        null,
        2
      )
    );
  }

  // =====================================================
  // JSON 복구
  // 기존 기능 유지
  // =====================================================
  function handleRestore() {
    if (
      !window.confirm(
        "복구하면 기존 데이터가 모두 덮어써집니다. 진행할까요?"
      )
    ) {
      return;
    }

    try {
      const parsed =
        JSON.parse(backupText);

      if (parsed.worldcups) {
        localStorage.setItem(
          "onepickgame_worldcupList",
          JSON.stringify(parsed.worldcups)
        );

        setWorldcupList(
          parsed.worldcups
        );
      }

      if (parsed.stats) {
        localStorage.setItem(
          "winnerStats",
          JSON.stringify(parsed.stats)
        );
      }

      if (parsed.comments) {
        localStorage.setItem(
          "comments",
          JSON.stringify(parsed.comments)
        );
      }

      alert(
        "복구 완료! 새로고침 해주세요."
      );

      setBackupText("");
    } catch (e) {
      alert(
        "복구 실패: 올바른 JSON이 아닙니다."
      );
    }
  }

  // =====================================================
  // JSON 다운로드
  // =====================================================
  function handleDownload() {
    const stats =
      localStorage.getItem("winnerStats");

    const comments =
      localStorage.getItem("comments");

    const backupObj = {
      worldcups: worldcupList,

      stats: stats
        ? JSON.parse(stats)
        : {},

      comments: comments
        ? JSON.parse(comments)
        : {},
    };

    downloadJson(
      "onepickgame_backup.json",
      backupObj
    );
  }

  // =====================================================
  // 백업 복사
  // =====================================================
  function handleCopyBackup() {
    if (!backupText) return;

    navigator.clipboard
      .writeText(backupText)
      .then(() => {
        alert("클립보드에 복사됨!");
      });
  }

  // =====================================================
  // 삭제
  //
  // 관리자:
  // → 휴지통 이동
  //
  // 일반 사용자:
  // → 기존처럼 즉시 영구삭제
  // =====================================================
  async function handleDelete(cup) {
    const message = isAdmin
      ? `"${cup.title}" 월드컵을 휴지통으로 이동하시겠습니까?\n\n나중에 복구할 수 있습니다.`
      : `"${cup.title}" 월드컵을 정말 삭제하시겠습니까?\n\n삭제 후 복구할 수 없습니다.`;

    if (!window.confirm(message)) {
      return;
    }

    try {
      if (isAdmin) {
        // ⭐ 관리자 = 휴지통
        await softDeleteWorldcupGame(
          cup.id
        );
      } else {
        // ⭐ 일반 사용자 = 즉시 영구삭제
        await deleteWorldcupGame(
          cup.id
        );
      }

      await refreshWorldcups();

      if (isAdmin) {
        await loadTrash();

        alert(
          "월드컵이 휴지통으로 이동되었습니다."
        );
      } else {
        alert(
          "월드컵이 삭제되었습니다."
        );
      }
    } catch (e) {
      console.error(
        "월드컵 삭제 실패:",
        e
      );

      alert(
        e?.message ||
          "삭제 실패! 다시 시도해 주세요."
      );
    }
  }

  // =====================================================
  // 관리자 휴지통 복구
  // =====================================================
  async function handleTrashRestore(cup) {
    if (!isAdmin) return;

    if (
      !window.confirm(
        `"${cup.title}" 월드컵을 복구하시겠습니까?`
      )
    ) {
      return;
    }

    try {
      await restoreWorldcupGame(
        cup.id
      );

      await refreshWorldcups();
      await loadTrash();

      alert(
        "월드컵이 복구되었습니다!"
      );
    } catch (e) {
      console.error(
        "월드컵 복구 실패:",
        e
      );

      alert(
        e?.message ||
          "복구 실패! 다시 시도해 주세요."
      );
    }
  }

  // =====================================================
  // 관리자 휴지통 영구삭제
  // =====================================================
  async function handlePermanentDelete(cup) {
    if (!isAdmin) return;

    const confirmText =
      `"${cup.title}" 월드컵을 영구삭제하시겠습니까?\n\n` +
      "후보 이미지도 Storage에서 삭제되며 복구할 수 없습니다.";

    if (
      !window.confirm(confirmText)
    ) {
      return;
    }

    // 한 번 더 확인
    if (
      !window.confirm(
        "정말 영구삭제할까요?\n이 작업은 되돌릴 수 없습니다."
      )
    ) {
      return;
    }

    try {
      const result =
        await permanentlyDeleteWorldcupGame(
          cup.id
        );

      console.log(
        "영구삭제 결과:",
        result
      );

      await loadTrash();

      alert(
        `영구삭제 완료!\n삭제된 이미지: ${
          result?.deletedImageCount || 0
        }개`
      );
    } catch (e) {
      console.error(
        "영구삭제 실패:",
        e
      );

      alert(
        e?.message ||
          "영구삭제 실패! 다시 시도해 주세요."
      );
    }
  }

  // =====================================================
  // 삭제시간 표시
  // =====================================================
  function formatDeletedAt(value) {
    if (!value) {
      return "-";
    }

    try {
      return new Date(
        value
      ).toLocaleString();
    } catch {
      return value;
    }
  }

  return (
    <div
      style={{
        maxWidth: 700,
        margin: "50px auto",
        background: "#fff",
        borderRadius: 12,
        padding: 28,
        boxShadow:
          "0 2px 12px #0001",
      }}
    >
      <h2
        style={{
          fontWeight: 800,
          fontSize: 28,
          marginBottom: 22,
        }}
      >
        {isAdmin
          ? "전체 월드컵 관리 (관리자)"
          : "내가 만든 월드컵 관리"}
      </h2>

      {/* ============================================= */}
      {/* 백업 / 복구 */}
      {/* ============================================= */}
      <div
        style={{
          marginBottom: 38,
        }}
      >
        <h3
          style={{
            marginBottom: 10,
          }}
        >
          데이터 백업 · 복구
        </h3>

        <button
          onClick={handleBackup}
          style={{
            background: "#1976ed",
            color: "#fff",
            padding: "8px 20px",
            borderRadius: 8,
            border: "none",
            marginRight: 8,
            fontWeight: 700,
          }}
        >
          백업 불러오기
        </button>

        <button
          onClick={handleDownload}
          style={{
            background: "#2a313f",
            color: "#fff",
            padding: "8px 20px",
            borderRadius: 8,
            border: "none",
            marginRight: 8,
            fontWeight: 700,
          }}
        >
          JSON 다운로드
        </button>

        <button
          onClick={handleRestore}
          style={{
            background: "#d33",
            color: "#fff",
            padding: "8px 20px",
            borderRadius: 8,
            border: "none",
            fontWeight: 700,
          }}
        >
          복구
        </button>

        <button
          onClick={handleCopyBackup}
          style={{
            background: "#d1d5db",
            color: "#222",
            padding: "8px 18px",
            borderRadius: 8,
            border: "none",
            fontWeight: 700,
            marginLeft: 8,
            opacity: backupText
              ? 1
              : 0.6,
            cursor: backupText
              ? "pointer"
              : "not-allowed",
          }}
          disabled={!backupText}
        >
          복사
        </button>

        <textarea
          value={backupText}
          onChange={(e) =>
            setBackupText(
              e.target.value
            )
          }
          placeholder="여기에 백업 데이터를 붙여넣기 하세요"
          rows={8}
          style={{
            width: "100%",
            marginTop: 16,
            fontSize: 15,
            borderRadius: 7,
            border:
              "1px solid #ccc",
            padding: 12,
            background: "#fafaff",
            boxSizing:
              "border-box",
          }}
        />
      </div>

      {/* ============================================= */}
      {/* 월드컵 목록 */}
      {/* ============================================= */}
      <div>
        <h3
          style={{
            margin: "18px 0 6px",
            fontWeight: 700,
          }}
        >
          {isAdmin
            ? "전체 월드컵 목록"
            : "내가 만든 월드컵"}
        </h3>

        {myWorldcups.length === 0 ? (
          <div
            style={{
              color: "#bbb",
              margin:
                "28px 0 14px",
            }}
          >
            {isAdmin
              ? "등록된 월드컵이 없습니다."
              : "아직 생성한 월드컵이 없습니다."}
          </div>
        ) : (
          <ul
            style={{
              padding: 0,
              listStyle: "none",
            }}
          >
            {myWorldcups.map(
              (cup) => (
                <li
                  key={cup.id}
                  style={{
                    padding:
                      "13px 0",
                    borderBottom:
                      "1px solid #eee",
                    display: "flex",
                    alignItems:
                      "center",
                    gap: 13,
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <b
                      style={{
                        fontSize: 17,
                      }}
                    >
                      {cup.title}
                    </b>

                    {(cup.desc ||
                      cup.description) && (
                      <div
                        style={{
                          color:
                            "#888",
                          fontSize:
                            14,
                          marginTop:
                            3,
                        }}
                      >
                        {cup.desc ||
                          cup.description}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() =>
                      handleDelete(
                        cup
                      )
                    }
                    style={{
                      background:
                        "#d33",
                      color: "#fff",
                      border:
                        "none",
                      borderRadius:
                        8,
                      fontWeight:
                        700,
                      fontSize:
                        14,
                      padding:
                        "6px 14px",
                      cursor:
                        "pointer",
                      whiteSpace:
                        "nowrap",
                    }}
                  >
                    {isAdmin
                      ? "휴지통"
                      : "삭제"}
                  </button>
                </li>
              )
            )}
          </ul>
        )}
      </div>

      {/* ============================================= */}
      {/* ⭐ 관리자 전용 휴지통 */}
      {/* ============================================= */}
      {isAdmin && (
        <div
          style={{
            marginTop: 50,
            paddingTop: 26,
            borderTop:
              "2px solid #eee",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems:
                "center",
              marginBottom: 12,
            }}
          >
            <h3
              style={{
                margin: 0,
                fontWeight: 800,
                fontSize: 21,
              }}
            >
              🗑 관리자 휴지통
            </h3>

            <button
              type="button"
              onClick={loadTrash}
              disabled={trashLoading}
              style={{
                background:
                  "#e5e7eb",
                color: "#333",
                border: "none",
                borderRadius: 8,
                padding:
                  "7px 13px",
                fontWeight: 700,
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

          <div
            style={{
              color: "#777",
              fontSize: 13,
              marginBottom: 18,
              lineHeight: 1.6,
            }}
          >
            관리자가 삭제한
            월드컵은 여기에
            보관됩니다.
            <br />
            복구하면 즉시 다시
            사이트에 표시됩니다.
          </div>

          {trashLoading ? (
            <div
              style={{
                color: "#999",
                padding:
                  "20px 0",
              }}
            >
              휴지통을 불러오는
              중...
            </div>
          ) : deletedWorldcups.length ===
            0 ? (
            <div
              style={{
                color: "#bbb",
                padding:
                  "20px 0",
              }}
            >
              휴지통이
              비어있습니다.
            </div>
          ) : (
            <ul
              style={{
                padding: 0,
                margin: 0,
                listStyle:
                  "none",
              }}
            >
              {deletedWorldcups.map(
                (cup) => (
                  <li
                    key={cup.id}
                    style={{
                      padding:
                        "15px 0",
                      borderBottom:
                        "1px solid #eee",
                    }}
                  >
                    <div
                      style={{
                        marginBottom:
                          9,
                      }}
                    >
                      <b
                        style={{
                          fontSize:
                            16,
                        }}
                      >
                        {cup.title ||
                          "(제목 없음)"}
                      </b>

                      <div
                        style={{
                          color:
                            "#999",
                          fontSize:
                            12,
                          marginTop:
                            4,
                        }}
                      >
                        삭제:
                        {" "}
                        {formatDeletedAt(
                          cup.deleted_at
                        )}
                      </div>
                    </div>

                    <div
                      style={{
                        display:
                          "flex",
                        gap: 8,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          handleTrashRestore(
                            cup
                          )
                        }
                        style={{
                          background:
                            "#1976ed",
                          color:
                            "#fff",
                          border:
                            "none",
                          borderRadius:
                            8,
                          padding:
                            "7px 15px",
                          fontWeight:
                            700,
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
                          background:
                            "#222",
                          color:
                            "#fff",
                          border:
                            "none",
                          borderRadius:
                            8,
                          padding:
                            "7px 15px",
                          fontWeight:
                            700,
                          cursor:
                            "pointer",
                        }}
                      >
                        영구삭제
                      </button>
                    </div>
                  </li>
                )
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default ManageWorldcup;