import React from "react";

// 색상 정의
const COLORS = {
  main: "#1976ed",
  danger: "#d33",
  lightBg: "#fafdff",
  border: "#e3f0fb",
};

function DataManager({ title, data, onDelete }) {
  return (
    <div style={{ margin: "38px 0", maxWidth: 650, background: "#fff", borderRadius: 16, boxShadow: "0 2px 12px #1976ed14", padding: "24px 18px" }}>
      <h3 style={{
        fontWeight: 800,
        fontSize: 21,
        color: COLORS.main,
        marginBottom: 17,
        letterSpacing: -1,
        borderBottom: `2px solid ${COLORS.border}`,
        paddingBottom: 7,
      }}>
        {title}
      </h3>
      {data.length === 0 ? (
        <div style={{ color: "#aaa", fontSize: 16, padding: "16px 0", textAlign: "center" }}>
          데이터가 없습니다.
        </div>
      ) : (
        <ul style={{ padding: 0, margin: 0 }}>
          {data.map((d, idx) => (
            <li
              key={idx}
              style={{
                background: COLORS.lightBg,
                borderRadius: 11,
                boxShadow: "0 1.5px 8px #1976ed0d",
                marginBottom: 13,
                padding: "13px 15px",
                display: "flex",
                alignItems: "center",
                fontSize: 15,
                wordBreak: "break-all",
              }}
            >
              <span style={{ flex: 1, color: "#333" }}>
                {typeof d === "object"
                  ? <span style={{ fontFamily: "monospace", color: "#275" }}>{JSON.stringify(d, null, 1)}</span>
                  : d}
              </span>
              <button
                onClick={() => onDelete(idx)}
                style={{
                  marginLeft: 18,
                  background: COLORS.danger,
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontWeight: 700,
                  padding: "7px 15px",
                  fontSize: 14,
                  cursor: "pointer",
                  boxShadow: "0 1.5px 7px #d334",
                  transition: "background 0.17s",
                }}
                onMouseOver={e => (e.currentTarget.style.background = "#a61616")}
                onMouseOut={e => (e.currentTarget.style.background = COLORS.danger)}
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
export default DataManager;
