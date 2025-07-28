import React, { useState, useEffect } from "react";
import MediaRenderer from "./MediaRenderer";
import { useTranslation } from "react-i18next";

// 네비게이션 버튼 스타일
const navBtnStyle = (hover = false) => ({
  background: hover
    ? "linear-gradient(135deg, #ecf6ff 30%, #e6eefe 90%)"
    : "rgba(255,255,255,0.78)",
  border: "none",
  outline: "none",
  borderRadius: "50%",
  width: 42,
  height: 42,
  fontSize: 23,
  color: "#1976ed",
  fontWeight: 900,
  boxShadow: hover
    ? "0 4px 18px #1976ed26, 0 1.5px 8px #9ebff425"
    : "0 2.5px 10px #b7d8ff1c",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  opacity: hover ? 1 : 0.92,
  position: "relative",
  transition: "all .14s cubic-bezier(.2,.95,.58,1.06)",
  zIndex: 10,
  userSelect: "none",
});

// [핵심] 승수(통계) 기반 1, 2위 후보 뽑기 (카드와 완전 동일)
function getTop2Winners(winStats, cupData) {
  if (!winStats?.length) return [cupData?.[0] || null, cupData?.[1] || null];
  const sorted = [...winStats]
    .map((row, i) => ({ ...row, _originIdx: i }))
    .sort((a, b) => {
      if ((b.win_count || 0) !== (a.win_count || 0))
        return (b.win_count || 0) - (a.win_count || 0);
      if ((b.match_wins || 0) !== (a.match_wins || 0))
        return (b.match_wins || 0) - (a.match_wins || 0);
      return a._originIdx - b._originIdx;
    });
  const first =
    cupData?.find((c) => c.id === sorted[0]?.candidate_id) ||
    cupData?.[0] ||
    null;
  const second =
    cupData?.find((c) => c.id === sorted[1]?.candidate_id) ||
    cupData?.[1] ||
    null;
  return [first, second];
}

function FixedCupCarousel({ worldcupList }) {
  const { t } = useTranslation();

  const [vw, setVw] = useState(window.innerWidth);
  const [hoverPrev, setHoverPrev] = useState(false);
  const [hoverNext, setHoverNext] = useState(false);

  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  let perPage = 4;
  if (vw < 1100) perPage = 3;
  if (vw < 780) perPage = 2;
  if (vw < 540) perPage = 1;

  const maxCount = 24;
  const cups = worldcupList ? worldcupList.slice(0, maxCount) : [];
  const totalPage = Math.ceil(cups.length / perPage);
  const [page, setPage] = useState(0);

  const cardW = vw < 540 ? "96vw" : vw < 780 ? 212 : 270;
  const cardH = vw < 540 ? 120 : vw < 780 ? 136 : 158;
  const titleH = 34;
  const titleBg = "#171C27";

  const pageCups = cups.slice(page * perPage, page * perPage + perPage);

  if (!cups.length) return null;

  function goPrev() {
    setPage((p) => (p === 0 ? totalPage - 1 : p - 1));
  }
  function goNext() {
    setPage((p) => (p === totalPage - 1 ? 0 : p + 1));
  }

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 1200,
        margin: "0 auto 10px auto",
        padding: vw < 600 ? "4px 0 5px 0" : "8px 0 7px 0",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
        userSelect: "none",
      }}
    >
      <div
        style={{
          fontWeight: 900,
          fontSize: vw < 600 ? 21 : 26,
          marginBottom: vw < 600 ? 3 : 5,
          color: "#fff",
          letterSpacing: "-0.5px",
          textAlign: "center",
          width: "100%",
        }}
      >
        {t("recommend")}
      </div>
      <div
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          minHeight: typeof cardH === "number" ? cardH + 38 : 158,
        }}
      >
        {/* Prev Button */}
        <button
          aria-label={t("previous")}
          onClick={goPrev}
          onMouseEnter={() => setHoverPrev(true)}
          onMouseLeave={() => setHoverPrev(false)}
          style={navBtnStyle(hoverPrev)}
        >
          <span
            style={{
              display: "inline-block",
              transform: hoverPrev ? "translateX(-2px) scale(1.09)" : "none",
              transition: "all .18s",
            }}
          >
            &#60;
          </span>
        </button>

        {/* Cards */}
        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "center",
            alignItems: "flex-end",
            width: "100%",
            maxWidth: perPage * (typeof cardW === "number" ? cardW : 270) + (perPage - 1) * 8,
            minHeight: cardH,
            position: "relative",
            padding: "0 0",
          }}
        >
          {pageCups.map((cup, idx) => {
            // [핵심!] 1, 2위 후보 VS 구조 (실제 승수 기준!)
            const [first, second] = getTop2Winners(cup.winStats, cup.data);

            return (
              <div
                key={cup.id}
                style={{
                  width: cardW,
                  height: cardH,
                  background: "#fafdff",
                  borderRadius: 17,
                  boxShadow: "0 2px 14px #1976ed17, 0 1.5px 8px #b2d1fa12",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  cursor: "pointer",
                  overflow: "hidden",
                  border: "none",
                  margin: "0 2px",
                  position: "relative",
                  transition: "transform .13s, box-shadow .14s",
                }}
                onClick={() => window.location.href = `/select-round/${cup.id}`}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "translateY(-2.5px) scale(1.03)";
                  e.currentTarget.style.boxShadow = "0 9px 28px #1976ed20, 0 1.5px 8px #1976ed13";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "0 2px 14px #1976ed17, 0 1.5px 8px #b2d1fa12";
                }}
                title={cup.title}
              >
                <div
                  style={{
                    width: "100%",
                    height: `calc(100% - ${titleH}px)`,
                    minHeight: 64,
                    display: "flex",
                    flexDirection: "row",
                    background: "linear-gradient(90deg, #F2F8FF 50%, #EDF7FF 100%)",
                    borderTopLeftRadius: 17,
                    borderTopRightRadius: 17,
                    borderBottom: "none",
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      width: "50%",
                      height: "100%",
                      borderTopLeftRadius: 17,
                      overflow: "hidden",
                      background: "#eaf3fb",
                    }}
                  >
                    {first?.image ? (
                      <MediaRenderer url={first.image} alt="1위" />
                    ) : (
                      <div style={{ width: "100%", height: "100%", background: "#eee" }} />
                    )}
                  </div>
                  <div
                    style={{
                      width: "50%",
                      height: "100%",
                      borderTopRightRadius: 17,
                      overflow: "hidden",
                      background: "#eaf3fb",
                    }}
                  >
                    {second?.image ? (
                      <MediaRenderer url={second.image} alt="2위" />
                    ) : (
                      <div style={{ width: "100%", height: "100%", background: "#eee" }} />
                    )}
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -56%)",
                      zIndex: 5,
                      pointerEvents: "none",
                      width: vw < 540 ? 45 : 54,
                      height: vw < 540 ? 45 : 54,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <img
                      src="/vs.png"
                      alt="vs"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        filter: "drop-shadow(0 1.2px 2.5px #2227b38c)",
                      }}
                    />
                  </div>
                </div>
                <div
                  style={{
                    width: "100%",
                    height: titleH,
                    minHeight: titleH,
                    maxHeight: titleH * 1.1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: titleBg,
                    fontWeight: 800,
                    fontSize: vw < 600 ? 14 : 16,
                    color: "#fff",
                    textAlign: "center",
                    letterSpacing: "-0.1px",
                    lineHeight: 1.25,
                    overflow: "hidden",
                    padding: "0 10px",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                    wordBreak: "keep-all",
                    borderBottomLeftRadius: 13,
                    borderBottomRightRadius: 13,
                  }}
                  title={cup.title}
                >
                  {cup.title}
                </div>
              </div>
            );
          })}
        </div>
        {/* Next Button */}
        <button
          aria-label={t("next")}
          onClick={goNext}
          onMouseEnter={() => setHoverNext(true)}
          onMouseLeave={() => setHoverNext(false)}
          style={navBtnStyle(hoverNext)}
        >
          <span
            style={{
              display: "inline-block",
              transform: hoverNext ? "translateX(2px) scale(1.09)" : "none",
              transition: "all .18s",
            }}
          >
            &#62;
          </span>
        </button>
      </div>
      {/* 페이지네이션 */}
      <div
        style={{
          marginTop: 11,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 11,
        }}
      >
        {Array.from({ length: totalPage }).map((_, i) => (
          <div
            key={i}
            onClick={() => setPage(i)}
            tabIndex={0}
            role="button"
            aria-label={`${i + 1} ${t("page")}`}
            style={{
              width: page === i ? 14 : 10,
              height: page === i ? 14 : 10,
              borderRadius: "50%",
              background: page === i
                ? "radial-gradient(circle, #1976ed 55%, #b6e2ff 100%)"
                : "linear-gradient(135deg, #e4edfa 40%, #eaf3ff 100%)",
              border: page === i ? "2.2px solid #1976ed" : "1.1px solid #d9e8fb",
              boxShadow: page === i ? "0 2px 9px #1976ed27" : "0 1px 4px #b7d8ff1a",
              cursor: "pointer",
              transition: "all .18s cubic-bezier(.29,.95,.58,1.08)",
              outline: "none",
              marginTop: page === i ? -1 : 0,
              marginBottom: page === i ? 1 : 0,
            }}
            onKeyDown={e => {
              if (e.key === "Enter" || e.key === " ") setPage(i);
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default FixedCupCarousel;
