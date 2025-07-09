import React, { useState, useEffect } from "react";

function MediaRenderer({ url, alt }) {
  return (
    <img
      src={url}
      alt={alt}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        background: "#222",
        display: "block",
      }}
      draggable={false}
    />
  );
}

function FixedCupCarousel({ worldcupList }) {
  const [vw, setVw] = useState(window.innerWidth);

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
  const titleBg = "#171C27"; // 완전 같은 배경색

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
          fontSize: vw < 600 ? 19 : 24,
          marginBottom: vw < 600 ? 3 : 5,
          color: "#1976ed",
          letterSpacing: "-0.5px",
          textAlign: "center",
          width: "100%",
        }}
      >
        추천
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
        <button
          aria-label="이전"
          onClick={goPrev}
          style={{
            background: "#fff",
            border: "none",
            borderRadius: "50%",
            width: 36,
            height: 36,
            fontSize: 21,
            color: "#1976ed",
            fontWeight: 900,
            boxShadow: "0 2px 7px #1976ed22",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: 0.95,
            position: "relative",
            left: 0,
            marginRight: 5,
            zIndex: 10,
          }}
        >
          &#60;
        </button>
        <div
          style={{
            display: "flex",
            gap: 6,
            justifyContent: "center",
            alignItems: "flex-end",
            width: "100%",
            maxWidth: perPage * (typeof cardW === "number" ? cardW : 270) + (perPage - 1) * 6,
            minHeight: cardH,
            position: "relative",
            padding: "0 0",
          }}
        >
          {pageCups.map((cup, idx) => (
            <div
              key={cup.id}
              style={{
                width: cardW,
                height: cardH,
                background: "#fafdff",
                borderRadius: 15,
                boxShadow: "0 1.5px 8px #1976ed13",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-start",
                cursor: "pointer",
                overflow: "hidden",
                border: "none",
                margin: "0 1px",
                position: "relative",
                transition: "transform .14s, box-shadow .14s",
              }}
              onClick={() => window.location.href = `/select-round/${cup.id}`}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-2px) scale(1.024)";
                e.currentTarget.style.boxShadow = "0 7px 20px #1976ed18";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "0 1.5px 8px #1976ed13";
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
                  borderTopLeftRadius: 15,
                  borderTopRightRadius: 15,
                  borderBottom: "none",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    width: "50%",
                    height: "100%",
                    borderTopLeftRadius: 15,
                    overflow: "hidden",
                    background: "#eaf3fb",
                  }}
                >
                  {cup.data?.[0]?.image ? (
                    <MediaRenderer url={cup.data[0].image} alt="1위" />
                  ) : (
                    <div style={{ width: "100%", height: "100%", background: "#eee" }} />
                  )}
                </div>
                <div
                  style={{
                    width: "50%",
                    height: "100%",
                    borderTopRightRadius: 15,
                    overflow: "hidden",
                    background: "#eaf3fb",
                  }}
                >
                  {cup.data?.[1]?.image ? (
                    <MediaRenderer url={cup.data[1].image} alt="2위" />
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
              {/* 제목 (카드와 완전히 동일한 배경색) */}
              <div
                style={{
                  width: "100%",
                  height: titleH,
                  minHeight: titleH,
                  maxHeight: titleH * 1.1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: titleBg, // <---- 여기
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
          ))}
        </div>
        <button
          aria-label="다음"
          onClick={goNext}
          style={{
            background: "#fff",
            border: "none",
            borderRadius: "50%",
            width: 36,
            height: 36,
            fontSize: 21,
            color: "#1976ed",
            fontWeight: 900,
            boxShadow: "0 2px 7px #1976ed22",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: 0.95,
            position: "relative",
            right: 0,
            marginLeft: 5,
            zIndex: 10,
          }}
        >
          &#62;
        </button>
      </div>
      <div
        style={{
          marginTop: 7,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 8,
        }}
      >
        {Array.from({ length: totalPage }).map((_, i) => (
          <div
            key={i}
            onClick={() => setPage(i)}
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: page === i ? "#1976ed" : "#e2ecfa",
              border: "1.3px solid #e4edfb",
              cursor: "pointer",
              transition: "background 0.13s",
              boxShadow: page === i ? "0 2px 7px #1976ed22" : "none",
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default FixedCupCarousel;
