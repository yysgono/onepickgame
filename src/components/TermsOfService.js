import React from "react";

export default function TermsOfService() {
  return (
    <div style={{maxWidth: 900, margin: "50px auto", padding: 24, background: "#fff", borderRadius: 13, boxShadow: "0 2px 10px #0001"}}>
      <h2>이용약관 / Terms of Service</h2>
      <ul>
        <li>본 서비스는 회원가입 없이 누구나 사용할 수 있습니다.<br/>(Anyone can use this service without registration.)</li>
        <li>이용자는 서비스 내 모든 저작권 및 법적 책임을 스스로 부담합니다.<br/>(Users are responsible for any content they upload or create.)</li>
        <li>운영자는 사전 공지 없이 서비스 내용을 변경/종료할 수 있습니다.<br/>(The service may change or terminate at any time without notice.)</li>
      </ul>
      <p>본 약관은 2024.7.5부터 시행합니다.<br/>(Effective from July 5, 2024)</p>
    </div>
  );
}
