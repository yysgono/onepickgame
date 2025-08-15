import React from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import Seo from "../seo/Seo";

export default function TermsOfService() {
  const { i18n } = useTranslation();
  const { lang: paramLang } = useParams();
  const lang = (paramLang || i18n.language || "en").split("-")[0];

  return (
    <>
      <Seo
        lang={lang}
        slug="terms-of-service"
        title="Terms of Service"
        description="Terms of using the service, user responsibilities, content rules, and advertising policy."
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
        <h2>Terms of Service</h2>
        <ul style={{ lineHeight: 1.8 }}>
          <li>Anyone can use this service without registration.</li>
          <li>
            Users are responsible for any content they upload or create, including copyrights and legal issues.
          </li>
          <li>Uploading illegal, infringing, or spam content may be restricted or deleted.</li>
          <li>
            The service may change or terminate at any time without notice. The operator is not liable for any resulting damages.
          </li>
          <li>
            Third-party ads and cookies may be displayed or used for personalized advertising (for example, Google AdSense).
          </li>
          <li>
            Please refer to our&nbsp;
            <Link to={`/${lang}/privacy-policy`}>Privacy Policy</Link>
            &nbsp;for details on personal data.
          </li>
          <li>These terms are effective from July 10, 2025.</li>
          <li>
            For any questions, contact: <a href="mailto:yysgono@gmail.com">yysgono@gmail.com</a>
          </li>
        </ul>
        <p style={{ marginTop: 28, color: "#777", fontSize: 15 }}>
          By using this service, you agree to these terms.
        </p>
      </div>
    </>
  );
}
