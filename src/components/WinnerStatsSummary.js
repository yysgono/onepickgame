import React from "react";
import { useTranslation } from "react-i18next";
import copy from "./winnerSummaryCopy.json";

export default function WinnerStatsSummary({ summary, cupId, candidateId, lang = "en" }) {
  const { t } = useTranslation();
  const labels = copy[lang] || copy.en;
  const current = summary && String(summary.cupId) === String(cupId) &&
    String(summary.candidateId) === String(candidateId) ? summary : null;
  const state = current?.status || "loading";
  const number = value => Number(value).toLocaleString(lang);
  return (
    <div role="status" style={{ minHeight: 56, marginTop: 4, padding: "0 12px", textAlign: "center", lineHeight: 1.6 }}>
      {state === "ready" ? (
        <>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: "4px 14px", fontSize: 15, color: "#475569" }}>
            <strong style={{ color: "#2563eb", fontSize: 19 }}>{t("rank")} #{number(current.rank)}</strong>
            <span>{t("win_count")} <b>{number(current.winCount)}</b></span>
            <span>{t("win_rate")} <b>{current.winRate}</b></span>
            <span>{t("match_win_rate")} <b>{current.matchRate}</b></span>
          </div>
          <div style={{ color: "#64748b", fontSize: 12 }}>{labels[2]}</div>
        </>
      ) : <span style={{ color: "#64748b", fontSize: 14 }}>{state === "error" ? labels[0] : state === "empty" ? labels[1] : t("loading")}</span>}
    </div>
  );
}
