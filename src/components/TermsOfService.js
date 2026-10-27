import React from "react";
import { Link } from "react-router-dom";
import Seo from "../seo/Seo";

export default function TermsOfService() {
  return (
    <>
      <Seo
        lang="en"
        slug="terms-of-service" // 실제 경로: /terms-of-service
        title="Terms of Service"
        description="Terms of using the service, user responsibilities, content rules, and advertising policy."
        langPrefix={false}      // ✅ /[lang]/[slug]가 아닌 /[slug]로 canonical/hreflang 생성
        hreflangLangs={["en"]}  // ✅ 영어 전용 페이지
      />
      <div
        style={{
          maxWidth: 900,
          margin: "50px auto",
          padding: 24,
          background: "#fff",
          borderRadius: 13,
          boxShadow: "0 4px 16px rgba(25,32,52,0.07)",
          color: "#222",
        }}
      >
        <h2 style={{ fontWeight: 900, marginBottom: 12 }}>Terms of Service</h2>
        <ul style={{ lineHeight: 1.8, paddingLeft: 18 }}>
          <li>Many browsing and game features are available without registration. Account features and certain creation, upload or management actions require sign-in. Registration is available by email or Google; other social sign-in providers are not offered.</li>
          <li>
            Use an account you are authorized to access and protect its credentials. Do not impersonate other people or bypass account restrictions. Where local law requires a minimum age or parental authorization, contact the operator before registering if you cannot meet those requirements.
          </li>
          <li>Only upload content you own or have permission to use. You retain your rights in your content and allow the site to store, reproduce and display it as needed to provide the features you use. Do not post unlawful or infringing material, private information without authorization, threats, harassment or spam. The operator may restrict abusive accounts or content and review reports; contact us if you believe a restriction or removal is mistaken.</li>
          <li>
            Features may change, experience downtime or be discontinued. We aim to give reasonable notice of material changes where practicable; urgent security, legal or abuse-related actions may require immediate changes. Nothing here excludes liability or statutory rights that cannot lawfully be excluded. The site does not guarantee uninterrupted availability or a particular search ranking.
          </li>
          <li>
            Third-party ads and cookies may be displayed or used for personalized advertising (for example, Google AdSense).
          </li>
          <li>
            Please refer to our <Link to="/privacy-policy">Privacy Policy</Link> for details on personal data.
          </li>
          <li>Account and Google sign-in information updated: October 28, 2026.</li>
          <li>
            Account withdrawal is requested through the site and completed by the operator. When completed, the site account is deleted while previously published content and statistics may remain under withdrawn-member attribution. Ask us separately about removing personal information contained inside that content. Google accounts and Google-side app permissions are managed separately. Re-registering does not restore previous content ownership automatically.
          </li>
          <li>
            Random-picker animations and outcomes are entertainment tools. Probability settings and physical game mechanics can affect results; they are not certified gambling or prize-allocation systems. Do not use them for unlawful gambling or activities prohibited by local law.
          </li>
          <li>
            Applicable mandatory consumer and privacy protections remain in force. We do not require users in every country to waive local protections or submit exclusively to a single jurisdiction through these terms.
          </li>
          <li>
            For any questions, contact: <a href="mailto:yysgono@gmail.com">yysgono@gmail.com</a>
          </li>
        </ul>
        <p style={{ marginTop: 28, color: "#596579", fontSize: 17 }}>
          Read these terms before registering or creating content. A signup notice or policy acknowledgement is not consent to personalized advertising or unrelated optional data processing.
        </p>
      </div>
    </>
  );
}

