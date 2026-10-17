import React from "react";

export default function GameBrandLabel() {
  return (
    <>
      <style>{`
        .onepick-game-brand-label { display: block; }
        @media (min-width: 701px) {
          .onepick-game-brand-label + .onepick-brand-game-title {
            margin-top: 2px !important;
            padding-top: 2px !important;
          }
        }
        @media (max-width: 700px) {
          .onepick-game-brand-label { display: none; }
        }
      `}</style>
      <div
        className="onepick-game-brand-label"
        lang="en"
        dir="ltr"
        style={{
          width: "100%",
          boxSizing: "border-box",
          textAlign: "center",
          color: "#2563eb",
          fontFamily: 'Arial, "Noto Sans", sans-serif',
          fontSize: "clamp(24px, 2.4vw, 32px)",
          fontWeight: 900,
          fontStyle: "italic",
          lineHeight: 1.3,
          letterSpacing: "-0.4px",
          margin: "0 0 2px",
          padding: "0 12px",
        }}
      >
        One Pick Game
      </div>
    </>
  );
}
