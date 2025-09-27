// src/components/Spinner.js
import React from "react";

export default function Spinner({ size = 36, label = "Loading…" }) {
  const ring = {
    width: size,
    height: size,
    borderRadius: "50%",
    border: `${Math.max(2, Math.round(size / 9))}px solid #e8efff`,
    borderTopColor: "#1976ed",
    animation: "onepick-spin 0.9s linear infinite",
    boxSizing: "border-box",
  };
  const wrap = {
    display: "inline-flex",
    alignItems: "center",
    gap: 12,
  };
  const text = {
    fontWeight: 600,
    color: "#1976ed",
  };

  return (
    <div role="status" aria-live="polite" style={wrap}>
      <div style={ring} />
      {label ? <span style={text}>{label}</span> : null}
      <style>{`
        @keyframes onepick-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
