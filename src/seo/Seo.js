import React from "react";
import { Helmet } from "react-helmet-async";

const SUPPORTED_LANGS = [
  "en","ko","ja","zh","ru","pt","es","fr","id","hi","de","vi","ar","bn","th","tr"
];

function stripTrailingSlash(s = "") {
  return String(s).replace(/\/+$/,"");
}
function stripSlashes(s = "") {
  return String(s).replace(/^\/+|\/+$/g, "");
}
function normalizeCanonical(base, lang, slug = "") {
  // base: https://www.onepickgame.com 또는 window.location.origin
  const b = stripTrailingSlash(base || "https://www.onepickgame.com");
  const l = String(lang || "en").split("-")[0];
  const s = stripSlashes(slug);
  return s ? `${b}/${l}/${s}` : `${b}/${l}`;
}

export default function Seo({
  lang = "en",
  slug = "",            // 예: "", "privacy-policy", "stats/123"
  title = "OnePickGame",
  description = "Create and play worldcup-style tournaments.",
  image = "/onepick-social.png", // 있으면 OG/Twitter 카드에 사용
}) {
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://www.onepickgame.com";

  const canonical = normalizeCanonical(origin, lang, slug);

  // hreflang 세트 생성
  const hreflangs = SUPPORTED_LANGS.map(l => ({
    hreflang: l,
    href: normalizeCanonical(origin, l, slug),
  }));

  return (
    <Helmet>
      <html lang={lang} />
      <title>{title}</title>
      <meta name="description" content={description} />

      {/* Canonical */}
      <link rel="canonical" href={canonical} />

      {/* hreflang alternates */}
      {hreflangs.map(({ hreflang, href }) => (
        <link key={hreflang} rel="alternate" hrefLang={hreflang} href={href} />
      ))}
      {/* x-default는 영어로 */}
      <link rel="alternate" hrefLang="x-default" href={normalizeCanonical(origin, "en", slug)} />

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="OnePickGame" />
      {image ? <meta property="og:image" content={image} /> : null}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {image ? <meta name="twitter:image" content={image} /> : null}

      {/* robots는 여기서 설정하지 않음 → SEOManager가 통제 */}
    </Helmet>
  );
}
