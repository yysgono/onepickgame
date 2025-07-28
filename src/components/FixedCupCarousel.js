import React, { useState, useEffect } from "react";
import MediaRenderer from "./MediaRenderer";
import { useTranslation } from "react-i18next";

// Navigation button style
const navBtnStyle = (hover = false) => ({
  background: hover
    ? "linear-gradient(135deg, #ecf6ff 30%, #e6eefe 90%)"
    : "rgba(255,255,255,0.78)",
  border: "none",
  outline: "none",
  borderRadius: "50%",
  width: 44,
  height: 44,
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

// Top 2 winners extraction
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

function FixedCupCarousel({ worldcupList, hideTitle }) {
  const { t } = useTranslation();

  const [vw, setVw] = useState(window.innerWidth);
  const [hoverPrev, setHoverPrev] = useState(false);
  const [hoverNext, setHoverNext] = useState(false);

  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  let perPage = 3;
  if (vw < 1100) perPage = 2;
  if (vw < 780) perPage = 1;

  const maxCount = 24;
  const cups = worldcupList ? worldcupList.slice(0, maxCount) : [];
  const totalPage = Math.ceil(cups.length / perPage);
  const [page, setPage] = useState(0);

  const cardW = vw < 540 ? "95vw" : vw < 780 ? 290 : 340;
  const cardH = vw < 540 ? 126 : vw < 780 ? 172 : 192;
  const titleH = 36;
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
        maxWidth: 1300,
        margin: "0 auto 8px auto",
        padding: vw < 600 ? "4px 0 5px 0" : "8px 0 7px 0",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
        userSelect: "none",
      }}
    >
      {/* Recommend 텍스트와 페이지 도트 모두 숨김, 나머지 로직 동일 */}
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
        {/* Prev Button 숨김 */}
        <button
          aria-label={t("previous")}
          onClick={goPrev}
          onMouseEnter={() => setHoverPrev(true)}
          onMouseLeave={() => setHoverPrev(false)}
          style={{ ...navBtnStyle(hoverPrev), display: "none" }}
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
            gap: 18,
            justifyContent: "center",
            alignItems: "flex-end",
            width: "100%",
            maxWidth:
              perPage * (typeof cardW === "number" ? cardW : 320) +
              (perPage - 1) * 18,
            minHeight: cardH,
            position: "relative",
            padding: "0 0",
          }}
        >
          {pageCups.map((cup, idx) => {
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
                onClick={() => (window.location.href = `/select-round/${cup.id}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform =
                    "translateY(-2.5px) scale(1.03)";
                  e.currentTarget.style.boxShadow =
                    "0 9px 28px #1976ed20, 0 1.5px 8px #1976ed13";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow =
                    "0 2px 14px #1976ed17, 0 1.5px 8px #b2d1fa12";
                }}
                title={cup.title}
              >
                <div
                  style={{
                    width: "100%",
                    height: `calc(100% - ${titleH}px)`,
                    display: "flex",
                    flexDirection: "row",
                    background: "linear-gradient(90deg, #F2F8FF 50%, #EDF7FF 100%)",
                    overflow: "hidden",
                  }}
                >
                  <div style={{ width: "50%", background: "#eaf3fb" }}>
                    {first?.image ? (
                      <MediaRenderer url={first.image} alt="Winner 1" />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          background: "#eee",
                        }}
                      />
                    )}
                  </div>
                  <div style={{ width: "50%", background: "#eaf3fb" }}>
                    {second?.image ? (
                      <MediaRenderer url={second.image} alt="Winner 2" />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          background: "#eee",
                        }}
                      />
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
                      width: vw < 540 ? 47 : 59,
                      height: vw < 540 ? 47 : 59,
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
                    background: titleBg,
                    fontWeight: 800,
                    fontSize: vw < 600 ? 15 : 18,
                    color: "#fff",
                    textAlign: "center",
                    lineHeight: 1.25,
                    overflow: "hidden",
                    padding: "0 10px",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                  }}
                  title={cup.title}
                >
                  {cup.title}
                </div>
              </div>
            );
          })}
        </div>
        {/* Next Button 숨김 */}
        <button
          aria-label={t("next")}
          onClick={goNext}
          onMouseEnter={() => setHoverNext(true)}
          onMouseLeave={() => setHoverNext(false)}
          style={{ ...navBtnStyle(hoverNext), display: "none" }}
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
      {/* Pagination Dots 숨김 */}
      <div
        style={{
          marginTop: 11,
          display: "none",
        }}
      >
        {Array.from({ length: totalPage }).map((_, i) => (
          <div key={i} />
        ))}
      </div>
    </div>
  );
}

export default FixedCupCarousel;
