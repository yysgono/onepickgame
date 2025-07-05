import React from "react";
export default function Footer() {
  return (
    <footer style={{
      marginTop: 64, padding: "24px 0", background: "#f3f6fa",
      borderTop: "1.5px solid #e3f0fb", color: "#999", fontSize: 15, textAlign: "center"
    }}>
      <div>
        <a href="/terms-of-service" style={{marginRight: 18, color: "#1976ed"}}>이용약관</a>
        <a href="/privacy-policy" style={{color: "#1976ed"}}>개인정보처리방침</a>
      </div>
      <div style={{marginTop: 7}}>
        &copy; {new Date().getFullYear()} YourSiteName
      </div>
    </footer>
  );
}
