import React from "react";

export default function TermsOfService() {
  return (
    <div style={{
      maxWidth: 900,
      margin: "50px auto",
      padding: 24,
      background: "#fff",
      borderRadius: 13,
      boxShadow: "0 2px 10px #0001"
    }}>
      <h2>이용약관 / Terms of Service</h2>
      <ul style={{ lineHeight: 1.8 }}>
        <li>
          본 서비스는 회원가입 없이 누구나 사용할 수 있습니다.<br />
          (Anyone can use this service without registration.)
        </li>
        <li>
          이용자는 서비스 이용 중 업로드하는 모든 콘텐츠(이미지, 텍스트 등)에 대한 저작권과 법적 책임을 스스로 부담합니다.<br />
          (Users are responsible for any content they upload or create, including copyrights and legal issues.)
        </li>
        <li>
          불법적이거나 타인의 권리를 침해하는 자료 업로드, 광고성 스팸 행위 등은 제한 또는 삭제될 수 있습니다.<br />
          (Uploading illegal, infringing, or spam content may be restricted or deleted.)
        </li>
        <li>
          운영자는 예고 없이 서비스의 일부 또는 전체를 변경하거나 중단할 수 있으며, 이로 인해 발생하는 손해에 대해 책임을 지지 않습니다.<br />
          (The service may change or terminate at any time without notice. The operator is not liable for any resulting damages.)
        </li>
        <li>
          서비스 내 표시되는 광고(예: Google AdSense) 등과 관련하여, 광고주 또는 제3자의 정보 수집(쿠키 등)이 있을 수 있습니다.<br />
          (Third-party ads and cookies may be displayed or used for personalized advertising.)
        </li>
        <li>
          개인정보 관련 정책은 개인정보처리방침(Privacy Policy)을 참고하시기 바랍니다.<br />
          (See Privacy Policy for details on personal data.)
        </li>
        <li>
          본 약관은 2024년 7월 10일부터 적용됩니다.<br />
          (Effective from July 10, 2024)
        </li>
        <li>
          서비스 이용 관련 문의: <a href="mailto:yysgono@gmail.com">yysgono@gmail.com</a>
        </li>
      </ul>
      <p style={{ marginTop: 28, color: "#777", fontSize: 15 }}>
        본 약관은 이용자가 서비스를 이용함과 동시에 동의한 것으로 간주합니다.<br />
        (By using this service, you agree to these terms.)
      </p>
    </div>
  );
}
