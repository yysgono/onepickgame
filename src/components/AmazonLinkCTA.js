// src/components/AmazonLinkCTA.js
import React from "react";

/**
 * Amazon 텍스트/버튼 CTA 컴포넌트
 * props:
 *  - url: amzn.to/... 짧은 링크
 *  - title: 표시할 상품명/카테고리명
 *  - bullets: ["핵심 포인트1","포인트2"] (선택)
 *  - note: 추가 코멘트 (선택)
 */
export default function AmazonLinkCTA({ url, title, bullets = [], note }) {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 728,
        margin: "10px auto",
        padding: "14px 16px",
        borderRadius: 12,
        border: "1.5px solid #e5e7eb",
        background: "#ffffff",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: "#0f766e",
            background: "#ecfdf5",
            border: "1px solid #a7f3d0",
            borderRadius: 6,
            padding: "2px 8px",
            letterSpacing: "0.2px",
            whiteSpace: "nowrap",
          }}
        >
          🔗 추천 링크
        </span>
        <div
          style={{
            fontWeight: 900,
            fontSize: 16,
            color: "#111827",
            lineHeight: 1.2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={title}
        >
          {title}
        </div>
      </div>

      {bullets.length > 0 && (
        <ul style={{ margin: "10px 0 0 0", padding: "0 0 0 18px", color: "#374151" }}>
          {bullets.map((b, i) => (
            <li key={i} style={{ margin: "6px 0", fontSize: 14, lineHeight: 1.35 }}>
              {b}
            </li>
          ))}
        </ul>
      )}

      {note && (
        <div style={{ marginTop: 8, fontSize: 13, color: "#6b7280" }}>{note}</div>
      )}

      <div
        style={{
          marginTop: 12,
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer nofollow sponsored"
          style={{
            display: "inline-block",
            background: "#ff9900",
            color: "#111",
            fontWeight: 900,
            padding: "10px 16px",
            borderRadius: 10,
            textDecoration: "none",
            boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
          }}
        >
          Amazon에서 보기
        </a>

        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer nofollow sponsored"
          style={{ color: "#0066c0", fontWeight: 800, textDecoration: "underline" }}
        >
          텍스트 링크(새창)
        </a>

        <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600 }}>
          * 제휴 링크입니다.
        </span>
      </div>
    </div>
  );
}
