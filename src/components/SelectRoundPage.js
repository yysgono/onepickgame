import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import COLORS from "../styles/theme";
import { mainButtonStyle, selectStyle } from "../styles/common";
import MediaRenderer from "./MediaRenderer";

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

// 20글자마다 줄바꿈
function breakTitle(str, limit = 20) {
  if (!str) return "";
  let out = "";
  for (let i = 0; i < str.length; i += limit) {
    out += str.slice(i, i + limit) + (i + limit < str.length ? "\n" : "");
  }
  return out;
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

  return (
    <div
      style={{
        textAlign: "center",
        padding: isMobile ? 10 : 40,
        maxWidth: isMobile ? "100%" : 1600,
        margin: "0 auto",
      }}
    >
      {cup && (
        <div style={{ margin: "0 auto", maxWidth: isMobile ? "95vw" : 680, marginBottom: isMobile ? 10 : 23 }}>
          {/* 제목 */}
          <div
            style={{
              fontWeight: 900,
              fontSize: isMobile ? 23 : 32,
              color: "#fff",
              background: "#171C27",
              padding: isMobile ? "13px 7px 10px 7px" : "18px 18px 12px 18px",
              borderRadius: 12,
              letterSpacing: "-1px",
              whiteSpace: "pre-line",  // 줄바꿈
              boxShadow: "0 1px 10px #1976ed33",
              textAlign: "center",
              marginBottom: 0,
              wordBreak: "break-all",
            }}
            title={cup.title}
          >
            {breakTitle(cup.title)}
          </div>
          {/* 월드컵 설명 */}
          {cup.desc && (
            <div
              style={{
                color: "#cce6ff",
                background: "#16213a",
                borderRadius: 8,
                margin: isMobile ? "8px 2px 2px 2px" : "12px 0 4px 0",
                padding: isMobile ? "7px 10px" : "10px 14px",
                fontSize: isMobile ? 14 : 16,
                fontWeight: 600,
                whiteSpace: "pre-line",
                textAlign: "center",
                wordBreak: "break-all",
                boxShadow: "0 1px 7px #1976ed11",
              }}
            >
              {cup.desc}
            </div>
          )}
        </div>
      )}

      {/* 라운드/버튼 */}
      <div
        style={{
          marginBottom: isMobile ? 17 : 42,
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: "center",
          justifyContent: "center",
          gap: isMobile ? 8 : 16,
        }}
      >
        <select
          value={selectedRound}
          onChange={(e) => setSelectedRound(Number(e.target.value))}
          style={{
            ...selectStyle,
            fontSize: isMobile ? 14 : 18,
            padding: isMobile ? "8px 15px" : "12px 26px",
            borderRadius: isMobile ? 8 : 10,
            minWidth: isMobile ? 58 : 75,
            fontWeight: 800,
            background: "#16213a",
            color: "#fff",
            border: "2px solid #1976ed",
            height: isMobile ? 38 : 48,
          }}
        >
          {possibleRounds.map((r) => (
            <option key={r} value={r}>
              {r}강
            </option>
          ))}
        </select>
        <button
          style={{
            ...mainButtonStyle(),
            padding: isMobile ? "9px 20px" : "13px 32px",
            borderRadius: isMobile ? 8 : 10,
            fontWeight: 900,
            fontSize: isMobile ? 15 : 18,
            minWidth: isMobile ? 75 : 110,
            height: isMobile ? 38 : 48,
            background: "linear-gradient(90deg,#2999ff,#236de8 100%)",
            color: "#fff",
            boxShadow: "0 0 14px #1976ed33",
            border: "none",
          }}
          onClick={() => onSelect(selectedRound)}
        >
          {t("start") || "시작"}
        </button>
        {/* 후보 인원 표시 (흰색) */}
        <span
          style={{
            fontWeight: 800,
            fontSize: isMobile ? 15 : 19,
            color: "#fff",
            marginTop: isMobile ? 8 : 0,
            background: "#182340",
            borderRadius: 7,
            padding: isMobile ? "6px 13px" : "8px 17px",
            display: "inline-block",
            boxShadow: "0 1.5px 8px #1976ed22",
            border: "1.2px solid #1976ed",
            letterSpacing: "0.5px",
          }}
        >
          후보 {candidates.length}명
        </span>
      </div>
      {hasBye && (
        <div
          style={{
            fontSize: isMobile ? 13.5 : 17,
            fontWeight: 700,
            color: "#ffc452",
            marginTop: 8,
            marginBottom: isMobile ? 15 : 21,
            textShadow: "0 1px 8px #2227b344",
          }}
        >
          ⚠️ {t("byeInfo") || "인원수가 맞지 않아 부전승이 발생합니다."}
        </div>
      )}

      {/* === 후보 카드 그리드 === */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          gap: isMobile ? 10 : 28,
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
        {candidates.map((c) => (
          <div
            key={c.id}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              cursor: "pointer",
              background: "#171C27",
              borderRadius: isMobile ? 12 : 16,
              boxShadow: "0 3px 14px #171c2755",
              border: "1.2px solid #222941",
              transition: "box-shadow .18s, transform .18s",
              padding: isMobile ? 6 : 10,
              margin: "0 auto",
            }}
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
                width: getCardSize(),
                height: getCardSize(),
                borderRadius: isMobile ? 10 : 15,
                overflow: "hidden",
                background: "#222b3d",
                marginBottom: isMobile ? 8 : 12,
                boxShadow: "0 1px 8px #0003",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MediaRenderer url={c.image} alt={c.name} />
            </div>
            <div
              style={{
                width: getCardSize(),
                minHeight: 18,
                fontWeight: 900,
                fontSize: isMobile ? 13.5 : 16,
                color: "#fff",
                textAlign: "center",
                whiteSpace: "normal",
                wordBreak: "break-all",
                lineHeight: 1.18,
                padding: 0,
                margin: 0,
                textShadow: "0 1px 6px #222941dd",
                letterSpacing: "0.02em",
              }}
            >
              {c.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
