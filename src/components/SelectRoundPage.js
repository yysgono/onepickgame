import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import COLORS from "../styles/theme";
import { mainButtonStyle, selectStyle } from "../styles/common";
import MediaRenderer from "./MediaRenderer";

function isMobile() {
  if (typeof window !== "undefined") {
    return window.innerWidth <= 700;
  }
  return false;
}

function SelectRoundPage({ cup, maxRound, candidates, onSelect }) {
  const { t } = useTranslation();
  const [selectedRound, setSelectedRound] = useState(maxRound);

  const possibleRounds = [];
  for (let n = 2; n <= maxRound; n *= 2) {
    possibleRounds.push(n);
  }
  if (!possibleRounds.includes(candidates.length) && candidates.length >= 2) {
    possibleRounds.push(candidates.length);
  }
  possibleRounds.sort((a, b) => a - b);

  const mobile = isMobile();
  const hasBye = candidates.length < selectedRound;

  const startBtnStyle = {
    ...mainButtonStyle(),
    padding: mobile ? "6px 10px" : "12px 34px",
    borderRadius: mobile ? 7 : 11,
    fontWeight: 800,
    fontSize: mobile ? 14.4 : 25.2,
    marginLeft: 6,
    minWidth: mobile ? 63 : 108,
  };

  const gridColumn = mobile
    ? "repeat(2, minmax(0, 1fr))"
    : "repeat(auto-fit, minmax(186px, 1fr))";
  const imgSize = mobile ? "40vw" : 186;
  const fontSize = mobile ? 12 : 17;
  const cardGap = mobile ? 7 : 36;
  const cardRadius = mobile ? 9 : 18;
  const cardWidth = mobile ? "40vw" : "186px";
  const titleSize = mobile ? 23 : 91;
  const cardMargin = mobile ? 4 : 8;
  const nameMargin = mobile ? 4 : 7;

  return (
    <div
      style={{
        textAlign: "center",
        padding: mobile ? 8 : 40,
        maxWidth: mobile ? "100%" : 1600,
        margin: "0 auto",
      }}
    >
      {cup && (
        <div
          style={{
            fontWeight: 900,
            fontSize: titleSize,
            color: COLORS.main,
            marginBottom: mobile ? 7 : 30,
            letterSpacing: "-1.2px",
            lineHeight: 1.13,
            textAlign: "center",
          }}
        >
          {cup.title}
        </div>
      )}

      <div
        style={{
          marginBottom: mobile ? 12 : 38,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div>
          <select
            value={selectedRound}
            onChange={(e) => setSelectedRound(Number(e.target.value))}
            style={{
              ...selectStyle,
              fontSize: mobile ? 13 : 22,
              padding: mobile ? "6px 12px" : "12px 30px",
              borderRadius: mobile ? 8 : 16,
              marginRight: mobile ? 5 : 12,
            }}
          >
            {possibleRounds.map((r) => (
              <option key={r} value={r}>
                {r}강
              </option>
            ))}
          </select>
          <button style={startBtnStyle} onClick={() => onSelect(selectedRound)}>
            {t("start")}
          </button>
        </div>
        <div
          style={{
            fontSize: mobile ? 12 : 20,
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

      <div
        style={{
          display: "grid",
          gridTemplateColumns: gridColumn,
          gap: cardGap,
          justifyContent: "center",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        {candidates.map((c) => (
          <div
            key={c.id}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: imgSize,
                height: imgSize,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: cardMargin,
                background: "#f8fafd",
                borderRadius: cardRadius,
                overflow: "hidden",
                boxShadow: "0 2px 12px #0001",
              }}
            >
              <MediaRenderer url={c.image} alt={c.name} />
            </div>
            <div
              style={{
                fontSize,
                color: "#222",
                marginTop: nameMargin,
                textAlign: "center",
                wordBreak: "break-all",
                width: cardWidth,
                minHeight: 16,
                fontWeight: 700,
                lineHeight: 1.18,
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
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

export default SelectRoundPage;
