import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import MediaRenderer from "./MediaRenderer";

// 모바일 체크
function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 700);
  React.useEffect(() => {
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

export default function SelectRoundPage({ cup, maxRound, candidates, onSelect, onResult }) {
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

  // ---- 버튼 스타일 ----
  const mainBtn = {
    background: "linear-gradient(90deg, #1976ed 80%, #45b7fa 100%)",
    color: "#fff",
    fontWeight: 900,
    border: "none",
    borderRadius: 11,
    fontSize: isMobile ? 17 : 19,
    padding: isMobile ? "10px 22px" : "13px 35px",
    minWidth: isMobile ? 87 : 115,
    cursor: "pointer",
    boxShadow: "0 1px 11px #1976ed22",
    marginLeft: 4,
    marginRight: 4,
    outline: "none",
    height: buttonHeight,
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  };
  const selectBtnStyle = {
    fontSize: isMobile ? 19 : 25,
    padding: isMobile ? "10px 17px" : "12px 33px",
    borderRadius: isMobile ? 9 : 12,
    minWidth: isMobile ? 85 : 130,
    fontWeight: 900,
    background: "#16213a",
    color: "#fff",
    border: "2px solid #1976ed",
    height: buttonHeight,
    textAlign: "left",
    boxSizing: "border-box",
    appearance: "none",
    margin: "0 auto",
    display: "block",
    cursor: "pointer",
    backgroundImage: "none",
    direction: "ltr"
  };
  const selectArrowStyle = {
    position: "absolute",
    right: isMobile ? 16 : 25,
    top: "50%",
    transform: "translateY(-50%)",
    pointerEvents: "none",
    color: "#fff",
    fontSize: isMobile ? 19 : 26,
    zIndex: 1
  };
  const candidateCountText = {
    fontSize: isMobile ? 15 : 19,
    fontWeight: 800,
    color: "#fff",
    background: "#243152",
    borderRadius: 8,
    padding: isMobile ? "6px 16px" : "8px 26px",
    marginLeft: isMobile ? 0 : 8,
    height: buttonHeight,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    letterSpacing: "0.07em",
    whiteSpace: "nowrap",
    boxSizing: "border-box",
    border: "1.5px solid #1976ed33"
  };
  const resultBtn = {
    position: "absolute",
    top: isMobile ? 11 : 23,
    right: isMobile ? 11 : 26,
    zIndex: 10,
    background: "linear-gradient(90deg, #13e67e 80%, #23d6a0 100%)",
    color: "#fff",
    fontWeight: 900,
    border: "none",
    borderRadius: 11,
    fontSize: isMobile ? 15 : 17,
    padding: isMobile ? "8px 19px" : "10px 30px",
    minWidth: isMobile ? 72 : 110,
    cursor: "pointer",
    boxShadow: "0 1px 11px #23e6ad22",
    outline: "none",
    height: isMobile ? 38 : 44,
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  };

  // --- UI ---
  return (
    <div
      style={{
        position: "relative",
        textAlign: "center",
        padding: isMobile ? 12 : 38,
        maxWidth: isMobile ? "100%" : 880,
        margin: "0 auto",
        background: "rgba(20, 24, 37, 0.95)",
        borderRadius: isMobile ? 0 : 23,
        boxShadow: isMobile ? "none" : "0 4px 44px #171c2747",
        marginTop: 26,
      }}
    >
      {/* 오른쪽 상단 결과보기 버튼만 이동 */}
      <button
        style={resultBtn}
        onClick={() => {
          if (onResult) onResult();
          else if (cup?.id) window.location.href = `/stats/${cup.id}`;
        }}
      >
        결과보기
      </button>
      {cup && (
        <>
          <div style={{
            fontWeight: 900,
            fontSize: isMobile ? 23 : 31,
            color: "#fff",
            marginBottom: 9,
            letterSpacing: "-1.2px",
            lineHeight: 1.18,
            textAlign: "center",
            background: "#171C27",
            borderRadius: 14,
            padding: isMobile ? "12px 0 8px 0" : "18px 0 9px 0",
            marginLeft: "auto",
            marginRight: "auto",
            whiteSpace: "pre-line",
            wordBreak: "break-all",
            maxWidth: isMobile ? "98vw" : 710,
            boxShadow: "0 2px 16px #1976ed18",
          }} title={cup.title}>
            {splitTitle(cup.title).join("\n")}
          </div>
          {cup.desc || cup.description ? (
            <div style={{
              fontWeight: 400,
              fontSize: isMobile ? 16 : 20,
              color: "#b9d3ff",
              textAlign: "center",
              background: "rgba(30,45,70,0.93)",
              borderRadius: 9,
              padding: isMobile ? "7px 6px 4px 6px" : "11px 18px 6px 18px",
              marginBottom: isMobile ? 9 : 17,
              marginLeft: "auto",
              marginRight: "auto",
              maxWidth: isMobile ? "95vw" : 590,
              lineHeight: 1.45,
              minHeight: 24,
              whiteSpace: "pre-line",
              wordBreak: "break-word",
            }}>
              {(cup.desc || cup.description)}
            </div>
          ) : null}
        </>
      )}
      {/* ---- 버튼 영역 ---- */}
      <div style={{
        marginBottom: isMobile ? 16 : 24,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: isMobile ? 8 : 16,
        width: "100%",
      }}>
        <span style={{ position: "relative", display: "inline-block", minWidth: 130, textAlign: "center" }}>
          <select
            value={selectedRound}
            onChange={(e) => setSelectedRound(Number(e.target.value))}
            style={selectBtnStyle}
          >
            {possibleRounds.map((r) => (
              <option key={r} value={r} style={{ fontSize: isMobile ? 21 : 27 }}>
                {r}강
              </option>
            ))}
          </select>
          <span style={selectArrowStyle}>▼</span>
        </span>
        <button
          style={mainBtn}
          onClick={() => onSelect(selectedRound)}
        >
          {t("start") || "시작"}
        </button>
        <span style={candidateCountText}>
          후보 {candidates.length}명
          {hasBye && (
            <span style={{
              marginLeft: 7,
              color: "#FFD740",
              fontSize: isMobile ? 12 : 15,
              fontWeight: 700
            }}>
              ⚠️ 부전승 발생
            </span>
          )}
        </span>
      </div>
      {/* 부전승 안내 */}
      {hasBye && (
        <div style={{
          margin: "6px auto 8px auto",
          padding: isMobile ? "7px 11px" : "10px 17px",
          color: "#a85c07",
          background: "#fffbe5",
          borderRadius: 7,
          fontSize: isMobile ? 13 : 15,
          fontWeight: 900,
          boxShadow: "0 1px 5px #1976ed09",
          display: "inline-block",
          maxWidth: 400,
          border: "1.1px solid #ffd452",
        }}>
          ⚠️ 인원수가 {selectedRound}명에 맞지 않아 부전승이 자동 처리됩니다.
        </div>
      )}
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gap: isMobile ? 10 : 22,
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        maxWidth: 1100,
        margin: "0 auto",
        marginTop: isMobile ? 10 : 22,
        marginBottom: 0,
      }}>
        {candidates.map((c) => (
          <div
            key={c.id}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              cursor: "pointer",
              background: "#21283a",
              borderRadius: isMobile ? 10 : 13,
              boxShadow: "0 2px 12px #1976ed13",
              border: "1.2px solid #1976ed18",
              transition: "box-shadow .14s, transform .15s",
              padding: 0,
              margin: "0 auto",
              willChange: "transform",
              overflow: "hidden"
            }}
            title={c.name}
            tabIndex={0}
            onClick={() => onSelect && onSelect(c)}
            onMouseEnter={e => {
              e.currentTarget.style.boxShadow = "0 6px 19px #1976ed45";
              e.currentTarget.style.transform = "scale(1.04)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.boxShadow = "0 2px 12px #1976ed13";
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
            <div style={{
              width: getCardSize(),
              minHeight: 18,
              fontWeight: 900,
              fontSize: isMobile ? 13.5 : 16,
              color: "#fff",
              textAlign: "center",
              whiteSpace: "normal",
              wordBreak: "break-all",
              lineHeight: 1.15,
              padding: "0 2px",
              margin: 0,
              textShadow: "0 1px 6px #1976ed44",
              letterSpacing: "0.01em",
              background: "transparent"
            }}>
              {c.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
