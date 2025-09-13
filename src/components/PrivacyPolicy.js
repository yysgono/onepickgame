import React from "react";
import { Link } from "react-router-dom";
import Seo from "../seo/Seo";

export default function PrivacyPolicy() {
  return (
    <>
      <Seo
        lang="en"
        slug="privacy-policy" // 실제 경로: /privacy-policy
        title="Privacy Policy"
        description="How we collect, use, and protect your personal data. Includes Google AdSense information."
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
          boxShadow: "0 2px 10px #0001",
          color: "#222",
        }}
      >
        <h2 style={{ fontWeight: 900, marginBottom: 12 }}>Privacy Policy</h2>
        <p>
          This website may use Google AdSense and other advertising services.<br />
          Google and third parties may use cookies to serve personalized ads to users.
        </p>
        <ul style={{ lineHeight: 1.7, paddingLeft: 18 }}>
          <li>
            <b>What Personal Data We Collect</b><br />
            We collect only the minimum personal data required to operate the service, such as email and nickname.
          </li>
          <li>
            <b>Use of Personal Data</b><br />
            Your personal information is used only for providing and operating the service, user identification, and customer support.
          </li>
          <li>
            <b>Retention &amp; Deletion</b><br />
            Your data is deleted immediately upon withdrawal from the service, except where retention is required by law.
          </li>
          <li>
            <b>Third-party Sharing &amp; Ads</b><br />
            Third-party vendors, including Google, may collect cookies, IP addresses, and visit logs to provide ads.
          </li>
          <li>
            For more information, please see the{" "}
            <a
              href="https://policies.google.com/technologies/partner-sites?hl=en"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google Advertising Policy
            </a>
            .
          </li>
          <li>
            <b>Your Rights</b><br />
            You may request access, correction, deletion, or restriction of your personal data at any time by contacting us by email.
          </li>
          <li>
            See also our <Link to="/terms-of-service">Terms of Service</Link>.
          </li>
        </ul>
        <p>
          Contact: <a href="mailto:yysgono@gmail.com">yysgono@gmail.com</a>
        </p>
        <p style={{ color: "#777", fontSize: 14, marginTop: 30 }}>
          This policy is effective from July 10, 2025.
        </p>
      </div>
    </>
  );
}
