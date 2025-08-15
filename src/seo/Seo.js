// src/seo/Seo.js
import React from "react";
import { Helmet } from "react-helmet-async";

export const LOCALES = [
  "en","ar","bn","de","es","fr","hi","id","ja","ko","pt","ru","th","tr","vi","zh",
];

// 본인 도메인으로 교체(https + www 권장)
export const SITE_URL = "https://www.onepickgame.com";

export default function Seo({ lang, slug = "", title, description, noindex = false }) {
  const norm = (s) => (s ? `/${s.replace(/^\/+|\/+$/g, "")}/` : "/");
  const slugPart = slug ? `${slug.replace(/^\/+|\/+$/g, "")}/` : "";

  const canonical = `${SITE_URL}${norm(lang)}${slugPart}`;

  const langMap = {};
  LOCALES.forEach((l) => {
    langMap[l] = `${SITE_URL}${norm(l)}${slugPart}`;
  });
  const xDefault = `${SITE_URL}/en/${slugPart}`;

  return (
    <Helmet>
      {title && <title>{title}</title>}
      {description && <meta name="description" content={description} />}

      {noindex && <meta name="robots" content="noindex,follow" />}

      <link rel="canonical" href={canonical} />

      {Object.entries(langMap).map(([l, href]) => (
        <link key={l} rel="alternate" hrefLang={l} href={href} />
      ))}
      <link rel="alternate" hrefLang="x-default" href={xDefault} />
    </Helmet>
  );
}
