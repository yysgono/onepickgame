import React from "react";
import { Link } from "react-router-dom";
import detailLinks from "../seo/detailLinks";

export default function RelatedContentLinks({ lang, category, sourceWorldcupId }) {
  const { heading, links } = detailLinks.getDetailLinks(lang, category, sourceWorldcupId);
  return (
    <nav aria-label={heading} dir={lang === "ar" ? "rtl" : undefined}
      style={{ margin: "20px auto", maxWidth: 900, padding: "12px 14px", border: "1px solid #ded8f3", borderRadius: 12, background: "#faf9ff", boxSizing: "border-box" }}>
      <h2 style={{ margin: "0 0 10px", fontSize: 16, color: "#3e326e" }}>{heading}</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {links.map(link => <Link key={link.href} to={link.href}
          style={{ color: "#5542b8", background: "#fff", border: "1px solid #d6cdef", borderRadius: 8, padding: "8px 11px", fontSize: 14, lineHeight: 1.5, textDecoration: "underline", overflowWrap: "anywhere" }}>{link.label}</Link>)}
      </div>
    </nav>
  );
}
