// src/components/CandidateList.js
import React, { useState, useMemo } from "react";
import MediaRenderer from "./MediaRenderer";
import { useTranslation } from "react-i18next";

function CandidateList({
  candidates = [],
  maxSelectable = 4,
  selectedCandidates = [],
  onSelectionChange,
  isMobile,
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() =>
    candidates.filter(c =>
      c.name.toLowerCase().includes(query.toLowerCase())
    ), [candidates, query]);

  function toggleSelect(c) {
    if (selectedCandidates.find(x => x.id === c.id)) {
      onSelectionChange(selectedCandidates.filter(x => x.id !== c.id));
    } else if (selectedCandidates.length < maxSelectable) {
      onSelectionChange([...selectedCandidates, c]);
    }
  }

  return (
    <>
      <input
        placeholder={t("search_placeholder")}
        value={query}
        onChange={e => setQuery(e.target.value)}
        style={{
          width: "100%", maxWidth: 520, fontSize: 18,
          marginBottom: 12, padding: "8px 12px",
          borderRadius: 10, border: "1.7px solid #dde2ea",
          outline: "none", background: "#ffffff", color: "#202534",
        }}
      />
      <div style={{
        marginBottom: 7,
        fontWeight: 700,
        color: "#5542b8",
        fontSize: 17,
      }}>
        {t("candidates_count", { count: candidates.length })}
        &nbsp;|&nbsp;
        {t("select")} {maxSelectable}
      </div>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
        gap: 14,
        maxHeight: "54vh",
        overflowY: "auto",
        paddingBottom: 8,
        borderRadius: 12,
        background: "#ffffff",
        marginBottom: 8,
      }}>
        {filtered.length === 0 ? (
          <div style={{
            color: "#202534", fontWeight: 700, padding: 24, textAlign: "center",
            gridColumn: "1/-1"
          }}>
            {t("no_match_info")}
          </div>
        ) : (
          filtered.map(c => (
            <div
              key={c.id}
              onClick={() => toggleSelect(c)}
              style={{
                background: selectedCandidates.some(x => x.id === c.id) ? "#6650d8" : "#ffffff",
                color: selectedCandidates.some(x => x.id === c.id) ? "#ffffff" : "#202534",
                border: selectedCandidates.some(x => x.id === c.id) ? "2.5px solid #6fd6fc" : "2.5px solid #dde2ea",
                borderRadius: 14,
                cursor: "pointer",
                padding: 12,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                transition: "all 0.14s",
                boxShadow: selectedCandidates.some(x => x.id === c.id)
                  ? "0 4px 16px rgba(25,32,52,0.07)"
                  : "0 4px 16px rgba(25,32,52,0.07)",
                minHeight: 128,
                minWidth: 0,
              }}
            >
              <MediaRenderer
                url={c.image}
                alt={c.name}
                style={{
                  width: 62,
                  height: 62,
                  borderRadius: 8,
                  marginBottom: 9,
                  objectFit: "cover",
                  background: "#ffffff"
                }}
              />
              <span style={{
                fontWeight: 900,
                fontSize: 19,
                textAlign: "center",
                maxWidth: 145,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "normal",
                wordBreak: "break-all"
              }}>
                {c.name}
              </span>
            </div>
          ))
        )}
      </div>
      {selectedCandidates.length > maxSelectable && (
        <div style={{ color: "#b42346", fontWeight: 700 }}>
          {t("limit_select", { count: maxSelectable })}
        </div>
      )}
    </>
  );
}

export default CandidateList;
