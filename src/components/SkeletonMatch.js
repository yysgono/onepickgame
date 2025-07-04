// SkeletonMatch.js
import React from "react";
export default function SkeletonMatch({ isMobile }) {
  const size = isMobile ? "36vw" : 150;
  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      gap: isMobile ? 16 : 64,
      margin: isMobile ? "48px 0" : "100px 0",
    }}>
      {[1, 2].map((_, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div
            style={{
              width: size, height: size,
              background: "#e8eef7",
              borderRadius: 18,
              marginBottom: 13,
              animation: "skeletonPulse 1.2s infinite alternate",
            }}
          />
          <div
            style={{
              width: 80,
              height: 20,
              background: "#e8eef7",
              borderRadius: 6,
              animation: "skeletonPulse 1.2s infinite alternate",
            }}
          />
        </div>
      ))}
      <style>{`
        @keyframes skeletonPulse {
          0% { opacity: 0.7; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
