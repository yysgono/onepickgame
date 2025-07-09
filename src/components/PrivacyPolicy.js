import React from "react";

export default function PrivacyPolicy() {
  return (
    <div style={{
      maxWidth: 900,
      margin: "50px auto",
      padding: 24,
      background: "#fff",
      borderRadius: 13,
      boxShadow: "0 2px 10px #0001"
    }}>
      <h2>개인정보처리방침 / Privacy Policy</h2>
      <p>
        본 사이트는 Google AdSense 등 광고 서비스를 이용할 수 있습니다.<br />
        Google 및 제3자는 쿠키를 사용해 사용자에게 맞춤 광고를 제공할 수 있습니다.<br />
        (This site may use Google AdSense and other advertising services. Google and third parties may use cookies to serve personalized ads.)
      </p>
      <ul style={{ lineHeight: 1.7 }}>
        <li>
          <b>수집하는 개인정보 항목 (What we collect)</b><br />
          이메일, 닉네임 등 서비스 운영에 필요한 최소한의 정보만 수집합니다.<br />
          (Only minimal personal data such as email and nickname are collected.)
        </li>
        <li>
          <b>개인정보의 이용 목적 (Use of personal data)</b><br />
          서비스 제공, 운영, 사용자 식별 및 문의 응대 목적 외에는 사용하지 않습니다.<br />
          (Personal data is used only for service operation and user identification.)
        </li>
        <li>
          <b>보관 및 파기 (Retention & Deletion)</b><br />
          서비스 탈퇴 시 즉시 파기하며, 관련 법령에 따라 보관이 필요한 경우에만 일시 보관될 수 있습니다.<br />
          (Your data is deleted upon service withdrawal, except where retention is required by law.)
        </li>
        <li>
          <b>제3자 제공 및 광고 (Third-party sharing & Ads)</b><br />
          Google 등 제3자 광고사는 쿠키, IP, 방문기록 등을 수집할 수 있습니다.<br />
          (Third-party vendors may collect IP, cookies, or visit logs.)
        </li>
        <li>
          더 자세한 내용은&nbsp;
          <a href="https://policies.google.com/technologies/partner-sites?hl=ko" target="_blank" rel="noopener noreferrer">
            구글 광고 정책
          </a>
          &nbsp;을 참고하세요.<br />
          (See Google Ad Policy above.)
        </li>
        <li>
          <b>이용자 권리 (Your rights)</b><br />
          개인정보 열람, 정정, 삭제, 처리정지 요청이 가능합니다. 이메일로 문의해주세요.<br />
          (You can request access, correction, or deletion of your data by email.)
        </li>
      </ul>
      <p>
        문의: <a href="mailto:yysgono@gmail.com">yysgono@gmail.com</a>
      </p>
      <p style={{ color: "#777", fontSize: 14, marginTop: 30 }}>
        본 방침은 2024년 7월 10일부터 적용됩니다.<br />
        (Effective from July 10, 2024)
      </p>
    </div>
  );
}
