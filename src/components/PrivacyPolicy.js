import React from "react";

export default function PrivacyPolicy() {
  return (
    <div style={{maxWidth: 900, margin: "50px auto", padding: 24, background: "#fff", borderRadius: 13, boxShadow: "0 2px 10px #0001"}}>
      <h2>개인정보처리방침 / Privacy Policy</h2>
      <p>
        본 사이트는 Google AdSense 등 광고 서비스를 이용할 수 있습니다.  
        Google 및 제3자는 쿠키를 사용해 사용자에게 맞춤 광고를 제공할 수 있습니다.<br />
        (This site may use Google AdSense and other advertising services. Google and third parties may use cookies to serve personalized ads.)
      </p>
      <ul>
        <li>서비스 운영을 위해 이메일, 닉네임 등 최소한의 개인정보만을 수집합니다. <br/>
        (We only collect minimal information such as email and nickname.)</li>
        <li>구글 등 광고 제공사는 쿠키/기타 기술로 IP, 방문 기록 등을 수집할 수 있습니다. <br/>
        (Third-party vendors may collect IP address and visit data via cookies or similar technologies.)</li>
        <li>
          더 자세한 내용은  
          <a href="https://policies.google.com/technologies/partner-sites?hl=ko" target="_blank" rel="noopener noreferrer"> 구글 광고 정책 </a>
          을 참고하세요.<br/>
          (See Google Ad Policy above.)
        </li>
      </ul>
      <p>
        궁금한 점은 yysgono@gmail.com 으로 문의해주세요 .<br/>
      </p>
    </div>
  );
}
