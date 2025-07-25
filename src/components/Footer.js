import React from "react";
import { useTranslation, Trans } from "react-i18next";
import { Link } from "react-router-dom";

export default function Footer() {
  const { t, i18n } = useTranslation();

  return (
    <footer
      style={{
        marginTop: 32,
        padding: "18px 0 6px 0",
        background: "none",
        borderTop: "none",
        color: "#e7f2ff",
        fontSize: 14,
        textAlign: "center",
        boxShadow: "none"
      }}
    >
      <div
        style={{
          marginBottom: 7,
          color: "#e7f2ff",
          fontSize: 14,
          lineHeight: 1.25,
          textShadow: "0 1.5px 8px #0a1725, 0 0px 2px #0008",
          fontWeight: 500,
          letterSpacing: 0.1
        }}
      >
        <Trans i18nKey="footer_description">
          Bracket game site <b>OnePickGame</b>. Create your own tournament
          bracket, enjoy fun matchups, and play with users around the world!
        </Trans>
      </div>

      {/* ✅ 건의사항 페이지 링크 */}
      <div style={{ marginBottom: 10 }}>
        <Link
          to="/suggestions"
          style={{
            marginRight: 16,
            color: "#ffda7f",
            textDecoration: "underline",
            fontSize: 14,
            fontWeight: "bold"
          }}
        >
          {t("footer_suggestions_link", {
            defaultValue: "Ideal Type World Cup Suggestions"
          })}
        </Link>
      </div>

      <div>
        <a
          href="/terms-of-service"
          style={{
            marginRight: 16,
            color: "#7fcaff",
            textDecoration: "underline",
            fontSize: 14
          }}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t("terms_of_service")}
        </a>
        <a
          href="/privacy-policy"
          style={{
            color: "#7fcaff",
            textDecoration: "underline",
            fontSize: 14
          }}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t("privacy_policy")}
        </a>
      </div>

      <div style={{ marginTop: 4, color: "#a1cfff", fontSize: 12 }}>
        &copy; {new Date().getFullYear()} OnePickGame
      </div>
    </footer>
  );
}
