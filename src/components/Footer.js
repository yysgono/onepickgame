// src/components/Footer.js
import React from "react";
import { useTranslation, Trans } from "react-i18next";
import { Link, useLocation } from "react-router-dom";

export default function Footer() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  // 현재 경로에서 언어코드 추출
  const langMatch = location.pathname.match(/^\/([a-z]{2})(\/|$)/);
  const lang = langMatch ? langMatch[1] : i18n.language || "ko";

  return (
    <footer
      style={{
        width: "100vw",
        maxWidth: "100vw",
        background: "rgba(18,24,37,0.94)",
        borderTop: "3px solid #1976ed",
        marginTop: 50,
        padding: "30px 0 20px 0",
        position: "relative",
        zIndex: 20,
        boxShadow: "0 -3px 24px #1976ed19",
      }}
    >
      <div
        style={{
          maxWidth: 800,
          margin: "0 auto",
          padding: "0 14px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            color: "#e7f2ff",
            fontSize: 16,
            fontWeight: 600,
            marginBottom: 13,
            letterSpacing: 0.12,
            textShadow: "0 2px 11px #111a, 0 0.5px 2px #157be966",
            lineHeight: 1.5,
          }}
        >
          <Trans i18nKey="footer_description">
            Bracket game site <b>One Pick Game</b>. Create your own tournament
            bracket, enjoy fun matchups, and play with users around the world!
          </Trans>
        </div>
        <div style={{ marginBottom: 10 }}>
          <Link
            to={`/${lang}/suggestions`}
            style={{
              color: "#ffd980",
              textDecoration: "underline",
              fontSize: 15,
              fontWeight: 700,
              margin: "0 12px",
            }}
          >
            {t("footer_suggestions_link", {
              defaultValue: "Ideal Type World Cup Suggestions",
            })}
          </Link>
        </div>
        <div style={{ marginTop: 4 }}>
          <Link
            to={`/${lang}/terms-of-service`}
            style={{
              color: "#7fcaff",
              textDecoration: "underline",
              fontSize: 15,
              fontWeight: 700,
              margin: "0 14px 0 0",
            }}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("terms_of_service", { defaultValue: "Terms of Service" })}
          </Link>
          <Link
            to={`/${lang}/privacy-policy`}
            style={{
              color: "#7fcaff",
              textDecoration: "underline",
              fontSize: 15,
              fontWeight: 700,
              margin: "0 0 0 0",
            }}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("privacy_policy", { defaultValue: "Privacy Policy" })}
          </Link>
        </div>
        <div
          style={{
            marginTop: 14,
            color: "#b1d5ff",
            fontSize: 13,
            letterSpacing: 0.1,
            fontWeight: 600,
            opacity: 0.86,
            userSelect: "none",
          }}
        >
          &copy; {new Date().getFullYear()} One Pick Game
        </div>
      </div>
    </footer>
  );
}
