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
          width: "100%", maxWidth: 520, fontSize: 16,
          marginBottom: 12, padding: "8px 12px",
          borderRadius: 10, border: "1.7px solid #1976ed44",
          outline: "none", background: "#101826", color: "#fff",
        }}
      />
      <div style={{
        marginBottom: 7,
        fontWeight: 700,
        color: "#9ed4ff",
        fontSize: 15,
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
        background: "rgba(30,40,65,0.52)",
        marginBottom: 8,
      }}>
        {filtered.length === 0 ? (
          <div style={{
            color: "#ccc", fontWeight: 700, padding: 24, textAlign: "center",
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
                background: selectedCandidates.some(x => x.id === c.id) ? "#2976ed" : "#202b3d",
                color: selectedCandidates.some(x => x.id === c.id) ? "#fff" : "#d6eaff",
                border: selectedCandidates.some(x => x.id === c.id) ? "2.5px solid #6fd6fc" : "2.5px solid #182345",
                borderRadius: 14,
                cursor: "pointer",
                padding: 12,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                transition: "all 0.14s",
                boxShadow: selectedCandidates.some(x => x.id === c.id)
                  ? "0 4px 18px #1976ed66"
                  : "0 1px 8px #1976ed33",
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
                  background: "#202030"
                }}
              />
              <span style={{
                fontWeight: 900,
                fontSize: 17,
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
        <div style={{ color: "#ff7272", fontWeight: 700 }}>
          {t("limit_select", { count: maxSelectable })}
        </div>
      )}
    </>
  );
}

export default CandidateList;
