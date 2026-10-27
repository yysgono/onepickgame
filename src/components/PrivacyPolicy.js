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
          boxShadow: "0 4px 16px rgba(25,32,52,0.07)",
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
            Email registration uses an email address and password through Supabase Auth. Google sign-in uses your Google account identifier, email and basic profile information supplied by Google; you do not give OnePickGame your Google password. A site nickname is used for public attribution. Content, images, comments, game results and support messages are processed when you use those features.
          </li>
          <li>
            <b>Use of Personal Data</b><br />
            Account data is used to authenticate users, maintain sessions, associate content with its creator, prevent abuse, and handle support and withdrawal requests. Public content and game statistics are used to provide the corresponding features. Google sign-in does not request access to Gmail, Drive or Contacts. Advertising processing is described separately below.
          </li>
          <li>
            <b>Retention &amp; Deletion</b><br />
            A withdrawal request is reviewed by the operator; submitting it does not immediately delete the account. When withdrawal processing completes, the site login account and profile are removed. Previously published games, posts, comments and related statistics may remain with attribution to a withdrawn member. Names, photos or other personal information inside published content are not automatically removed by changing its attribution; contact us for a separate review of that content. Re-registering does not automatically restore ownership of previous content. This is not a promise that provider backups or all technical logs are erased immediately.
          </li>
          <li>
            <b>Third-party Sharing &amp; Ads</b><br />
            The site uses Supabase for authentication, database and file storage, and Vercel for hosting and server functions. These providers may process technical information such as IP addresses, request logs and security events. Google AdSense and its advertising partners may use cookies or similar storage, identifiers and usage information for ad delivery, measurement and, where permitted, personalization. Signup and Google authentication do not themselves constitute consent to personalized advertising. Where separate consent is required, it must be handled through the applicable advertising consent controls; a privacy-policy link alone does not replace those controls.
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
            You can contact us to request access, correction or deletion of personal information. Depending on the laws applicable to you, you may also have rights to restriction, portability, objection, withdrawal of consent, or complaint to a supervisory authority. We may need proportionate identity verification to protect your account. Do not send passwords, session tokens or authentication secrets. Mandatory rights under applicable local law are not waived by these terms or by using this site.
          </li>
          <li>
            <b>Google Account Connections</b><br />
            Site withdrawal does not delete your Google account or automatically revoke the app permission listed in your Google account. You can review or remove that connection at <a href="https://myaccount.google.com/connections" target="_blank" rel="noopener noreferrer">Google account connections</a>. Removing that connection alone is not a request to delete your OnePickGame account.
          </li>
          <li>
            <b>Browser Storage</b><br />
            Browser storage is used for the login session, language preference and saved random-picker candidates. Saved candidates on this device can be edited or removed using the site controls; clearing browser storage also removes local data and can sign you out. Device storage is separate from data saved to your online account.
          </li>
          <li>
            <b>International Processing</b><br />
            Our hosting, authentication, storage and advertising providers may process information outside your country. Applicable transfer safeguards and your local privacy rights must still be respected. Contact us about the processing of your information or a region-specific privacy request.
          </li>
          <li>
            See also our <Link to="/terms-of-service">Terms of Service</Link>.
          </li>
        </ul>
        <p>
          Privacy contact for OnePickGame (privately operated): <a href="mailto:yysgono@gmail.com">yysgono@gmail.com</a>
        </p>
        <p style={{ color: "#596579", fontSize: 16, marginTop: 30 }}>
          Account and Google sign-in information updated: October 28, 2026.
        </p>
      </div>
    </>
  );
}

