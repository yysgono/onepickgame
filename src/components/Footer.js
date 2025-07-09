import React from "react";
export default function Footer() {
  return (
    <footer style={{
      marginTop: 64,
      padding: "24px 0",
      background: "none",            // 완전 투명하게
      borderTop: "none",             // 테두리 제거
      color: "#e6eeff",              // 밝은 글자색 (어두운 배경 위에서 잘 보임)
      fontSize: 15,
      textAlign: "center",
      boxShadow: "none"
    }}>
      <div>
        <a
          href="/terms-of-service"
          style={{ marginRight: 18, color: "#81b7ff", textDecoration: "underline" }}
          target="_blank" rel="noopener noreferrer"
        >
          이용약관
        </a>
        <a
          href="/privacy-policy"
          style={{ color: "#81b7ff", textDecoration: "underline" }}
          target="_blank" rel="noopener noreferrer"
        >
          개인정보처리방침
        </a>
      </div>
      <div style={{ marginTop: 7, color: "#aacfff", fontSize: 13 }}>
        &copy; {new Date().getFullYear()} OnePickGame
      </div>
    </footer>
  );
}
