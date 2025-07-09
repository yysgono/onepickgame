import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import MediaRenderer from "./MediaRenderer";

const mainDark = "#171C27";
const blueLine = "#1976ed";
const white = "#fff";
const selectBg = "#16213a";

function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(
    typeof window !== "undefined" ? window.innerWidth < 700 : false
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => setIsMobile(window.innerWidth < 700);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return isMobile;
}

function getGridSettings(count, isMobile) {
  if (isMobile) {
    if (count <= 2) return { columns: count, size: "68vw", max: 180 };
    if (count <= 4) return { columns: 2, size: "44vw", max: 115 };
    if (count <= 6) return { columns: 3, size: "29vw", max: 82 };
    if (count <= 10) return { columns: 5, size: "17vw", max: 52 };
    return { columns: 10, size: "8vw", max: 40 };
  } else {
    if (count <= 2) return { columns: count, size: 310, max: 250 };
    if (count <= 4) return { columns: 2, size: 190, max: 150 };
    if (count <= 6) return { columns: 3, size: 120, max: 105 };
    if (count <= 10) return { columns: 6, size: 85, max: 95 };
    return { columns: 10, size: 65, max: 80 };
  }
}

function splitTitle(title = "") {
  if (!title) return "";
  const lines = [];
  for (let i = 0; i < title.length; i += 20) {
    lines.push(title.slice(i, i + 20));
  }
  return lines;
}

export default function SelectRoundPage({ cup, maxRound, candidates, onSelect }) {
  const { t } = useTranslation();
  const [selectedRound, setSelectedRound] = useState(maxRound);

  const maxPossibleRound = Math.min(candidates.length, 1024);
  let possibleRounds = [];
  for (let n = 1; Math.pow(2, n) <= maxPossibleRound; n++) {
    possibleRounds.push(Math.pow(2, n));
  }
  if (
    candidates.length >= 2 &&
    candidates.length <= 1024 &&
    !possibleRounds.includes(candidates.length)
  ) {
    possibleRounds.push(candidates.length);
  }
  possibleRounds = possibleRounds.sort((a, b) => a - b);

  const isMobile = useIsMobile();
  const hasBye = candidates.length < selectedRound;

  const count = candidates.length;
  const { columns, size, max } = getGridSettings(count, isMobile);
  const getCardSize = () => (typeof size === "string" ? `min(${size}, ${max}px)` : Math.min(size, max));

  const buttonHeight = isMobile ? 48 : 60;

  const wrapStyle = {
    textAlign: "center",
    padding: isMobile ? 12 : 38,
    maxWidth: isMobile ? "100%" : 800,
    margin: "0 auto",
  };
  const titleStyle = {
    fontWeight: 900,
    fontSize: isMobile ? 23 : 32,
    color: white,
    marginBottom: 6,
    letterSpacing: "-1.2px",
    lineHeight: 1.18,
    textAlign: "center",
    background: mainDark,
    borderRadius: 16,
    padding: isMobile ? "16px 0 8px 0" : "19px 0 9px 0",
    marginLeft: "auto",
    marginRight: "auto",
    whiteSpace: "pre-line",
    wordBreak: "break-all",
    maxWidth: isMobile ? "98vw" : 700,
    boxShadow: "0 3px 18px #1117",
  };
  const descStyle = {
    fontWeight: 400,
    fontSize: isMobile ? 17 : 21,
    color: white,
    textAlign: "center",
    background: "rgba(25,32,46,0.92)",
    borderRadius: 8,
    padding: isMobile ? "9px 5px 6px 5px" : "10px 16px 7px 16px",
    marginBottom: isMobile ? 8 : 16,
    marginLeft: "auto",
    marginRight: "auto",
    maxWidth: isMobile ? "94vw" : 600,
    lineHeight: 1.45,
    minHeight: 24,
    whiteSpace: "pre-line",
    wordBreak: "break-word",
  };
  const roundWrapStyle = {
    marginBottom: isMobile ? 10 : 20,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: isMobile ? 6 : 12,
  };
  const selectWrap = {
    position: "relative",
    display: "inline-block"
  };
  const selectStyle = {
    fontSize: isMobile ? 22 : 28,
    padding: isMobile ? "10px 20px" : "14px 30px",
    borderRadius: isMobile ? 8 : 10,
    minWidth: isMobile ? 110 : 130,
    fontWeight: 800,
    background: selectBg,
    color: white,
    border: `2px solid ${blueLine}`,
    height: buttonHeight,
    textAlign: "center",
    lineHeight: 1.1,
    boxSizing: "border-box",
    appearance: "none",
    MozAppearance: "none",
    WebkitAppearance: "none",
    marginRight: isMobile ? 0 : 4,
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    // select의 기본 드롭다운 화살표 숨기기
    backgroundImage: "none"
  };
  const selectArrowStyle = {
    position: "absolute",
    right: isMobile ? 14 : 22,
    top: "50%",
    transform: "translateY(-50%)",
    pointerEvents: "none",
    color: "#fff",
    fontSize: isMobile ? 18 : 24,
    zIndex: 1
  };
  const mainBtn = {
    background: blueLine,
    color: white,
    fontWeight: 900,
    border: "none",
    borderRadius: 10,
    fontSize: isMobile ? 16 : 18,
    padding: isMobile ? "10px 24px" : "13px 36px",
    minWidth: isMobile ? 90 : 120,
    cursor: "pointer",
    boxShadow: "0 1px 9px #1976ed33",
    marginLeft: 3,
    marginRight: 3,
    outline: "none",
    height: buttonHeight,
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  };
  const candidateCountText = {
    fontSize: isMobile ? 18 : 21,
    fontWeight: 800,
    color: white,
    background: "rgba(35,44,65,0.93)",
    borderRadius: 7,
    padding: isMobile ? "0 20px" : "0 30px",
    marginLeft: isMobile ? 0 : 10,
    height: buttonHeight,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    letterSpacing: "0.06em",
    whiteSpace: "nowrap",
    boxSizing: "border-box"
  };
  const gridStyle = {
    display: "grid",
    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
    gap: isMobile ? 10 : 28,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    maxWidth: 1200,
    margin: "0 auto",
  };
  const cardStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    cursor: "pointer",
    background: mainDark,
    borderRadius: isMobile ? 13 : 16,
    boxShadow: "0 3px 14px #171c2755",
    border: "1.4px solid #222941",
    transition: "box-shadow .17s, transform .17s",
    padding: 0,
    margin: "0 auto",
    willChange: "transform",
    overflow: "hidden"
  };
  const cardTitleStyle = {
    width: getCardSize(),
    minHeight: 18,
    fontWeight: 900,
    fontSize: isMobile ? 13.5 : 16,
    color: white,
    textAlign: "center",
    whiteSpace: "normal",
    wordBreak: "break-all",
    lineHeight: 1.18,
    padding: "0 2px",
    margin: 0,
    textShadow: "0 1px 6px #222941dd",
    letterSpacing: "0.02em",
    background: "transparent"
  };

  return (
    <div style={wrapStyle}>
      {cup && (
        <>
          <div style={titleStyle} title={cup.title}>
            {splitTitle(cup.title).join("\n")}
          </div>
          {cup.desc || cup.description ? (
            <div style={descStyle}>
              {(cup.desc || cup.description)}
            </div>
          ) : null}
        </>
      )}
      <div style={roundWrapStyle}>
        <span style={selectWrap}>
          <select
            value={selectedRound}
            onChange={(e) => setSelectedRound(Number(e.target.value))}
            style={selectStyle}
          >
            {possibleRounds.map((r) => (
              <option key={r} value={r} style={{ fontSize: isMobile ? 21 : 27 }}>{r}강</option>
            ))}
          </select>
          {/* ▼ 화살표 */}
          <span style={selectArrowStyle}>▼</span>
        </span>
        <button
          style={mainBtn}
          onClick={() => onSelect(selectedRound)}
        >
          {t("start") || "시작"}
        </button>
        <span style={candidateCountText}>
          전체후보: {candidates.length}
          {hasBye && (
            <span style={{ marginLeft: 7, color: "#FFD740" }}>
              ⚠️ {t("byeInfo") || "인원수가 맞지 않아 부전승이 발생합니다."}
            </span>
          )}
        </span>
      </div>
      <div style={gridStyle}>
        {candidates.map((c) => (
          <div
            key={c.id}
            style={cardStyle}
            onClick={() => onSelect && onSelect(c)}
            onMouseEnter={e => {
              e.currentTarget.style.boxShadow = "0 7px 22px #1976ed55";
              e.currentTarget.style.transform = "scale(1.032)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.boxShadow = "0 3px 14px #171c2755";
              e.currentTarget.style.transform = "none";
            }}
          >
            <div
              style={{
                width: "100%",
                aspectRatio: "1/1",
                borderRadius: 0,
                overflow: "hidden",
                background: "#222b3d",
                margin: 0,
                padding: 0,
                display: "flex",
                alignItems: "stretch",
                justifyContent: "stretch",
              }}
            >
              <MediaRenderer
                url={c.image}
                alt={c.name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: 0,
                  margin: 0,
                  display: "block"
                }}
              />
            </div>
            <div style={cardTitleStyle}>
              {c.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
