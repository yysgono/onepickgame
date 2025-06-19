import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { getThumbnail, getMostWinner } from "../utils";
import COLORS from "../styles/theme";
import {
  cardBoxStyle,
  mainButtonStyle,
  subButtonStyle,
  grayButtonStyle,
  editButtonStyle,
  delButtonStyle,
} from "../styles/common";

// 카드 슬라이드 애니메이션
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

function Home({ worldcupList, onSelect, onMakeWorldcup }) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("popular");
  const [shakeBtn, setShakeBtn] = useState(null);

  const filtered = worldcupList
    .filter(
      (cup) =>
        cup.title.toLowerCase().includes(search.toLowerCase()) ||
        (cup.desc || "").toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sort === "recent") {
        return (b.createdAt || b.id) > (a.createdAt || a.id) ? 1 : -1;
      } else {
        return (b.winCount || 0) - (a.winCount || 0);
      }
    });

  const currentUser = localStorage.getItem("onepickgame_user") || "";
  const cardRefs = useSlideFadeIn(filtered.length);

  const handleBtnShake = (btnId, callback) => {
    setShakeBtn(btnId);
    setTimeout(() => {
      setShakeBtn(null);
      callback && callback();
    }, 300);
  };

  const isMobile = window.innerWidth < 700;

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 2100,
        margin: "0 auto",
        padding: isMobile ? "24px 4vw 80px 4vw" : "38px 22px 90px 22px",
        minHeight: "70vh",
        background: `linear-gradient(150deg, #fafdff 80%, #e3f0fb 100%)`,
      }}
    >
      {/* 상단바/헤더 */}
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          background: `linear-gradient(90deg, ${COLORS.main} 72%, ${COLORS.sub} 100%)`,
          boxShadow: "0 3px 24px #1976ed18",
          zIndex: 100,
          padding: isMobile ? "13px 6vw" : "16px 2vw",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <span
            style={{
              fontWeight: 900,
              fontSize: isMobile ? 24 : 36,
              color: "#fff",
              letterSpacing: -1,
              lineHeight: 1.2,
              WebkitTextStroke: "1px #19489311",
            }}
          >
            OnePickGame
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={onMakeWorldcup}
            style={{
              background: `linear-gradient(90deg, #fff 0%, #b1deff 80%)`,
              color: COLORS.main,
              fontWeight: 800,
              fontSize: isMobile ? 15 : 18,
              padding: isMobile ? "8px 20px" : "11px 28px",
              border: "none",
              borderRadius: 999,
              marginLeft: 10,
              boxShadow: "0 1px 8px #7fd4ff38",
              cursor: "pointer",
              transition: "all 0.18s",
            }}
          >
            + 월드컵 만들기
          </button>
          <button
            style={{
              background: "#fff",
              color: COLORS.main,
              border: "none",
              borderRadius: 999,
              fontWeight: 700,
              fontSize: isMobile ? 13 : 15,
              padding: isMobile ? "8px 16px" : "8px 18px",
              boxShadow: "0 1px 8px #1976ed18",
              cursor: "pointer",
              marginLeft: 8,
            }}
          >
            {currentUser === "admin" ? "admin" : "로그인"}
          </button>
        </div>
      </header>
      <div style={{ height: isMobile ? 58 : 74 }} />

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

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile
            ? "repeat(auto-fit, minmax(160px, 1fr))"
            : "repeat(auto-fit, minmax(230px, 1fr))",
          gap: isMobile ? 17 : 32,
          width: "100%",
          margin: "0 auto",
          boxSizing: "border-box",
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
          const topCandidate = getMostWinner(cup.id, cup.data);
          const thumbnail = topCandidate
            ? getThumbnail(topCandidate.image)
            : (cup.data[0]?.image ? getThumbnail(cup.data[0]?.image) : "");
          return (
            <div
              key={cup.id}
              ref={(el) => (cardRefs.current[idx] = el)}
              style={{
                ...cardBoxStyle,
                maxWidth: 400,
                margin: "0 auto"
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
                  <img
                    src={thumbnail}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
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
                  <div style={{
                    position: "absolute",
                    top: 6,
                    left: 8,
                    background: "#ffd700ee",
                    color: "#333",
                    fontWeight: 800,
                    fontSize: isMobile ? 12 : 15,
                    padding: "2px 8px",
                    borderRadius: 14,
                    boxShadow: "0 1px 4px #0001"
                  }}>
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
                    margin: isMobile
                      ? "13px 0 8px 0"
                      : "16px 0 8px 0",
                    justifyContent: "center",
                  }}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBtnShake(
                        `start-${cup.id}`,
                        () => onSelect && onSelect(cup)
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
                        window.location.href = `/stats/${cup.id}`
                      );
                    }}
                    className={shakeBtn === `stats-${cup.id}` ? "shake-anim" : ""}
                    style={subButtonStyle(isMobile)}
                  >
                    통계
                  </button>
                </div>
                <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
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
                  {cup.owner === currentUser && (
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
                  )}
                  {(currentUser === "admin" || cup.owner === currentUser) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBtnShake(`del-${cup.id}`, () => {
                          if (!window.confirm("정말 삭제하시겠습니까?")) return;
                          const newList = worldcupList.filter((c) => c.id !== cup.id);
                          localStorage.setItem(
                            "onepickgame_worldcupList",
                            JSON.stringify(newList)
                          );
                          window.location.reload();
                        });
                      }}
                      className={shakeBtn === `del-${cup.id}` ? "shake-anim" : ""}
                      style={delButtonStyle(isMobile)}
                    >
                      삭제
                    </button>
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
