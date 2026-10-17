import React from "react";

export default function GameBrandLabel() {
  return (
    <>
      <style>{`
        .onepick-game-brand-label { display: block; }
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
          color: "#202534",
          fontFamily: 'Arial, "Noto Sans", sans-serif',
          fontSize: "clamp(18px, 2vw, 26px)",
          fontWeight: 900,
          fontStyle: "italic",
          lineHeight: 1.3,
          letterSpacing: "-0.4px",
          margin: "0 0 8px",
          padding: "0 12px",
        }}
      >
        One Pick Game
      </div>
    </>
  );
}
