import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { getMostWinner, getWinnerStatsSupabase } from "../utils";
import COLORS from "../styles/theme";
import {
  cardBoxStyle,
  mainButtonStyle,
  subButtonStyle,
  grayButtonStyle,
  editButtonStyle,
  delButtonStyle,
} from "../styles/common";
import MediaRenderer from "./MediaRenderer";

// 카드 슬라이드 애니메이션 훅
const useSlideFadeIn = (length) => {
  const refs = useRef([]);
  useEffect(() => {
    refs.current.forEach((ref, i) => {
      if (ref) {
        ref.style.opacity = "0";
        ref.style.transform = "translateY(24px) scale(0.98)";
        setTimeout(() => {
          ref.style.transition =
            "opacity 0.5s cubic-bezier(.35,1,.4,1), transform 0.48s cubic-bezier(.35,1,.4,1)";
          ref.style.opacity = "1";
          ref.style.transform = "translateY(0) scale(1)";
        }, 50 + 50 * i);
      }
    });
  }, [length]);
  return refs;
};

function Home({
  worldcupList,
  onSelect,
  onMakeWorldcup,
  onDelete,
  user,
  nickname,
  isAdmin,
}) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("popular");
  const [shakeBtn, setShakeBtn] = useState(null);

  // 월드컵별 통계 저장
  const [cupStats, setCupStats] = useState({}); // { [cup.id]: stats }

  // 월드컵별 통계 fetch
  useEffect(() => {
    async function fetchStats() {
      if (!worldcupList) return;
      const promises = worldcupList.map(async (cup) => {
        try {
          const stats = await getWinnerStatsSupabase(cup.id);
          return [cup.id, stats];
        } catch {
          return [cup.id, null];
        }
      });
      const results = await Promise.all(promises);
      const statObj = {};
      results.forEach(([id, stats]) => {
        statObj[id] = stats;
      });
      setCupStats(statObj);
    }
    fetchStats();
  }, [worldcupList]);

  const filtered = (worldcupList || [])
    .filter(
      (cup) =>
        cup.title.toLowerCase().includes(search.toLowerCase()) ||
        (cup.desc || "").toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sort === "recent") {
        return (b.created_at || b.id) > (a.created_at || a.id) ? 1 : -1;
      } else {
        // 인기순: 통계 win_count 기준으로 내림차순
        const statsA = cupStats[a.id] || {};
        const statsB = cupStats[b.id] || {};
        const winCountA = Object.values(statsA).reduce((acc, s) => acc + (s?.win_count || 0), 0);
        const winCountB = Object.values(statsB).reduce((acc, s) => acc + (s?.win_count || 0), 0);
        return winCountB - winCountA;
      }
    });

  const currentUserId = user?.id || "";
  const currentUserEmail = user?.email || "";
  const cardRefs = useSlideFadeIn(filtered.length);

  // 버튼 흔들림
  const handleBtnShake = (btnId, callback) => {
    setShakeBtn(btnId);
    setTimeout(() => {
      setShakeBtn(null);
      callback && callback();
    }, 300);
  };

  const vw = typeof window !== "undefined" ? window.innerWidth : 1024;
  const isMobile = vw < 700;

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 2100,
        margin: "0 auto",
        padding: isMobile
          ? "24px 4vw 80px 4vw"
          : "38px 100px 90px 100px",
        minHeight: "70vh",
        background: `linear-gradient(150deg, #fafdff 80%, #e3f0fb 100%)`,
        overflowX: "hidden",
        boxSizing: "border-box",
      }}
    >
      {/* 정렬/검색 */}
      <div
        style={{
          margin: "0 0 24px 0",
          display: "flex",
          alignItems: "center",
          gap: 14,
          flexWrap: "wrap",
        }}
      >
        <button
          style={{
            background:
              sort === "popular"
                ? `linear-gradient(90deg, ${COLORS.main} 60%, ${COLORS.sub} 100%)`
                : "#f3f6fa",
            color: sort === "popular" ? "#fff" : COLORS.main,
            fontWeight: 700,
            border: "none",
            borderRadius: 999,
            padding: isMobile ? "9px 20px" : "12px 30px",
            fontSize: isMobile ? 15 : 16,
            boxShadow: sort === "popular" ? "0 2px 8px #1976ed22" : "none",
            cursor: "pointer",
            transition: "all 0.16s",
          }}
          onClick={() => setSort("popular")}
        >
          인기순
        </button>
        <button
          style={{
            background:
              sort === "recent"
                ? `linear-gradient(90deg, ${COLORS.main} 60%, ${COLORS.sub} 100%)`
                : "#f3f6fa",
            color: sort === "recent" ? "#fff" : COLORS.main,
            fontWeight: 700,
            border: "none",
            borderRadius: 999,
            padding: isMobile ? "9px 20px" : "12px 30px",
            fontSize: isMobile ? 15 : 16,
            boxShadow: sort === "recent" ? "0 2px 8px #1976ed22" : "none",
            cursor: "pointer",
            transition: "all 0.16s",
          }}
          onClick={() => setSort("recent")}
        >
          최신순
        </button>
        <div style={{ flex: 1 }} />
        {/* 검색창 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            position: "relative",
            width: isMobile ? 180 : 340,
            minHeight: isMobile ? 40 : 48,
            maxWidth: "100%",
            background: COLORS.lightGray,
            borderRadius: 999,
            border: "1.5px solid #b4c4e4",
            boxShadow: "0 1px 8px #1976ed11",
          }}
        >
          <svg
            width="20"
            height="20"
            style={{
              position: "absolute",
              left: 16,
              top: "50%",
              transform: "translateY(-50%)",
              opacity: 0.43,
              pointerEvents: "none",
            }}
          >
            <circle
              cx="8"
              cy="8"
              r="7"
              stroke={COLORS.main}
              strokeWidth="2"
              fill="none"
            />
            <line
              x1="13"
              y1="13"
              x2="19"
              y2="19"
              stroke={COLORS.main}
              strokeWidth="2"
            />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="검색"
            style={{
              width: "100%",
              border: "none",
              outline: "none",
              background: "transparent",
              padding: isMobile
                ? "11px 12px 11px 42px"
                : "13px 17px 13px 46px",
              fontSize: isMobile ? 15 : 17,
              borderRadius: 999,
            }}
          />
        </div>
      </div>

      {/* 월드컵 카드 그리드 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile
            ? "repeat(auto-fit, minmax(160px, 1fr))"
            : "repeat(auto-fit, minmax(180px, 1fr))",
          gap: isMobile ? 17 : 32,
          width: "100%",
          maxWidth: 1200,
          margin: "0 auto",
          boxSizing: "border-box",
          justifyContent: "center",
        }}
      >
        {filtered.length === 0 && (
          <div
            style={{
              gridColumn: "1 / -1",
              color: "#aaa",
              fontSize: 22,
              textAlign: "center",
              marginTop: 64,
            }}
          >
            등록된 월드컵이 없습니다.
          </div>
        )}
        {filtered.map((cup, idx) => {
          const stats = cupStats[cup.id] || {};
          const topCandidate = getMostWinner(cup.id, cup.data, stats);
          const thumbnail = topCandidate
            ? topCandidate.image
            : cup.data[0]?.image || "";

          // owner, creator, creator_id를 user.id, user.email로 비교
          const isMine =
            isAdmin ||
            cup.owner === currentUserId ||
            cup.creator === currentUserId ||
            cup.creator_id === currentUserId ||
            cup.owner === currentUserEmail ||
            cup.creator === currentUserEmail ||
            cup.creator_id === currentUserEmail;

          return (
            <div
              key={cup.id}
              ref={(el) => (cardRefs.current[idx] = el)}
              style={{
                ...cardBoxStyle,
                maxWidth: 300,
                margin: "0 auto",
              }}
              onClick={(e) => {
                if (e.target.tagName !== "BUTTON") onSelect && onSelect(cup);
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 10px 40px #1976ed38, 0 6px 18px #45b7fa23";
                e.currentTarget.style.transform =
                  "translateY(-10px) scale(1.045)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 4px 24px #1976ed22, 0 2px 12px #b4c4e4";
                e.currentTarget.style.transform = "none";
              }}
            >
              {/* 썸네일 */}
              <div
                style={{
                  width: "100%",
                  aspectRatio: "1 / 1",
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  overflow: "hidden",
                  background: "#e7f3fd",
                  marginBottom: 0,
                  flexShrink: 0,
                  boxShadow: "0 2px 16px #e6f4fc70",
                  position: "relative",
                }}
              >
                {thumbnail ? (
                  <MediaRenderer url={thumbnail} alt={cup.title} />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      background: "#e7f3fd",
                    }}
                  />
                )}
                {topCandidate && (
                  <div
                    style={{
                      position: "absolute",
                      top: 6,
                      left: 8,
                      background: "#ffd700ee",
                      color: "#333",
                      fontWeight: 800,
                      fontSize: isMobile ? 12 : 15,
                      padding: "2px 8px",
                      borderRadius: 14,
                      boxShadow: "0 1px 4px #0001",
                    }}
                  >
                    🥇 최다우승
                  </div>
                )}
              </div>
              <div
                style={{
                  padding: isMobile
                    ? "13px 12px 12px 12px"
                    : "20px 20px 14px 20px",
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                }}
              >
                <div
                  style={{
                    fontWeight: 900,
                    fontSize: isMobile ? 17 : 21,
                    marginBottom: 8,
                    color: COLORS.darkText,
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                    textAlign: "center",
                    wordBreak: "break-all",
                    whiteSpace: "normal",
                    lineHeight: 1.25,
                    minHeight: isMobile ? 24 : 30,
                  }}
                >
                  {cup.title}
                </div>
                <div
                  style={{
                    color: "#5a6988",
                    fontSize: isMobile ? 13 : 15,
                    marginBottom: 7,
                    minHeight: 20,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {cup.desc}
                </div>
                <div
                  style={{
                    color: "#99b",
                    fontSize: isMobile ? 12 : 13,
                    marginBottom: 3,
                  }}
                >
                  후보 수: {cup.data?.length || 0}
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    margin: isMobile ? "13px 0 8px 0" : "16px 0 8px 0",
                    justifyContent: "center",
                  }}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBtnShake(`start-${cup.id}`, () =>
                        onSelect && onSelect(cup)
                      );
                    }}
                    className={shakeBtn === `start-${cup.id}` ? "shake-anim" : ""}
                    style={mainButtonStyle(isMobile)}
                  >
                    시작
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBtnShake(`stats-${cup.id}`, () =>
                        (window.location.href = `/stats/${cup.id}`)
                      );
                    }}
                    className={shakeBtn === `stats-${cup.id}` ? "shake-anim" : ""}
                    style={subButtonStyle(isMobile)}
                  >
                    통계
                  </button>
                </div>
                <div
                  style={{ display: "flex", gap: 8, justifyContent: "center" }}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBtnShake(`share-${cup.id}`, () => {
                        const url = `${window.location.origin}/select-round/${cup.id}`;
                        navigator.clipboard.writeText(url);
                        window?.toast?.success
                          ? window.toast.success("링크가 복사되었습니다!")
                          : alert("링크가 복사되었습니다!");
                      });
                    }}
                    className={shakeBtn === `share-${cup.id}` ? "shake-anim" : ""}
                    style={grayButtonStyle(isMobile)}
                  >
                    공유
                  </button>
                  {isMine && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBtnShake(
                            `edit-${cup.id}`,
                            () => (window.location.href = `/edit-worldcup/${cup.id}`)
                          );
                        }}
                        className={shakeBtn === `edit-${cup.id}` ? "shake-anim" : ""}
                        style={editButtonStyle(isMobile)}
                      >
                        수정
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBtnShake(`del-${cup.id}`, () => {
                            if (!window.confirm("정말 삭제하시겠습니까?")) return;
                            if (onDelete) onDelete(cup.id);
                            else window.location.reload();
                          });
                        }}
                        className={shakeBtn === `del-${cup.id}` ? "shake-anim" : ""}
                        style={delButtonStyle(isMobile)}
                      >
                        삭제
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <style>
        {`
        .shake-anim {
          animation: shakeX 0.32s cubic-bezier(.36,.07,.19,.97) both;
        }
        @keyframes shakeX {
          10%, 90% { transform: translateX(-2px); }
          20%, 80% { transform: translateX(4px); }
          30%, 50%, 70% { transform: translateX(-6px);}
          40%, 60% { transform: translateX(6px);}
        }
        `}
      </style>
    </div>
  );
}

export default Home;
