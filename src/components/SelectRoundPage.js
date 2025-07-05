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

export default function SelectRoundPage({ cup, maxRound, candidates, onSelect }) {
  const { t } = useTranslation();
  const [selectedRound, setSelectedRound] = useState(maxRound);

  // 라운드 설정
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

  // 💡 카드 그리드 세팅
  const count = candidates.length;
  const { columns, size, max } = getGridSettings(count, isMobile);

  const getCardSize = () => (typeof size === "string" ? `min(${size}, ${max}px)` : Math.min(size, max));

  return (
    <div
      style={{
        textAlign: "center",
        padding: isMobile ? 8 : 40,
        maxWidth: isMobile ? "100%" : 1600,
        margin: "0 auto",
      }}
    >
      {cup && (
        <div
          style={{
            fontWeight: 900,
            fontSize: isMobile ? 23 : 48,
            color: COLORS.main,
            marginBottom: isMobile ? 7 : 30,
            letterSpacing: "-1.2px",
            lineHeight: 1.13,
            textAlign: "center",
          }}
        >
          {cup.title}
        </div>
      )}

      {/* 라운드/버튼 */}
      <div
        style={{
          marginBottom: isMobile ? 18 : 48,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6 }}>
          <select
            value={selectedRound}
            onChange={(e) => setSelectedRound(Number(e.target.value))}
            style={{
              ...selectStyle,
              fontSize: isMobile ? 14 : 18,
              padding: isMobile ? "7px 15px" : "12px 28px",
              borderRadius: isMobile ? 8 : 10,
              marginRight: isMobile ? 6 : 10,
              minWidth: isMobile ? 54 : 75,
              fontWeight: 800,
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
              padding: isMobile ? "7px 18px" : "12px 32px",
              borderRadius: isMobile ? 8 : 10,
              fontWeight: 900,
              fontSize: isMobile ? 15 : 18,
              marginLeft: 7,
              minWidth: isMobile ? 70 : 100,
              height: isMobile ? 38 : 48,
            }}
            onClick={() => {
              onSelect(selectedRound);
            }}
          >
            {t("start")}
          </button>
        </div>
        <div
          style={{
            fontSize: isMobile ? 13 : 20,
            fontWeight: 600,
            color: hasBye ? "#d9534f" : "#555",
            marginTop: 8,
          }}
        >
          {t("candidateCount", { count: candidates.length })}
          {hasBye && (
            <span style={{ marginLeft: 10 }}>
              ⚠️ {t("byeInfo") || "인원수가 맞지 않아 부전승이 발생합니다."}
            </span>
          )}
        </div>
      </div>

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
              background: "#fff",
              borderRadius: isMobile ? 12 : 16,
              boxShadow: "0 3px 16px #b0b8d655",
              transition: "box-shadow .18s, transform .18s",
              padding: isMobile ? 6 : 10,
              margin: "0 auto",
            }}
            onClick={() => onSelect && onSelect(c)}
          >
            <div
              style={{
                width: getCardSize(),
                height: getCardSize(),
                borderRadius: isMobile ? 10 : 15,
                overflow: "hidden",
                background: "#f8fafd",
                marginBottom: isMobile ? 8 : 12,
                boxShadow: "0 1px 8px #0001",
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
                fontWeight: 800,
                fontSize: isMobile ? 13.5 : 16,
                color: "#223",
                textAlign: "center",
                wordBreak: "break-all",
                overflow: "hidden",
                textOverflow: "ellipsis",
                lineHeight: 1.18,
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                display: "-webkit-box",
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
