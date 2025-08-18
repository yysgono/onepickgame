// src/seo/Seo.jsx
import React from "react";
import { Helmet } from "react-helmet-async";

const SUPPORTED_LANGS = [
  "en","ko","ja","zh","ru","pt","es","fr","id","hi","de","vi","ar","bn","th","tr"
];

// og:locale 매핑 (필수는 아니지만 있으면 좋음)
const OG_LOCALE_MAP = {
  en: "en_US",
  ko: "ko_KR",
  ja: "ja_JP",
  zh: "zh_CN",     // 필요시 zh-TW 등 분리 가능
  ru: "ru_RU",
  pt: "pt_BR",
  es: "es_ES",
  fr: "fr_FR",
  id: "id_ID",
  hi: "hi_IN",
  de: "de_DE",
  vi: "vi_VN",
  ar: "ar_AR",
  bn: "bn_IN",
  th: "th_TH",
  tr: "tr_TR",
};

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

// 절대 URL 보장
function toAbsoluteUrl(origin, url) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  const o = stripTrailingSlash(origin || "https://www.onepickgame.com");
  const u = String(url).startsWith("/") ? url : `/${url}`;
  return `${o}${u}`;
}

export default function Seo({
  lang = "en",
  slug = "",            // 예: "", "privacy-policy", "stats/123"
  title = "OnePickGame",
  description = "Create and play worldcup-style tournaments.",
  image = "/onepick-social.png", // OG/Twitter 카드 이미지
  // ✅ noindex 페이지라면 hreflang을 생략하기 위한 스위치
  indexable = true,
}) {
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://www.onepickgame.com";

  const canonical = normalizeCanonical(origin, lang, slug);
  const absoluteImage = image ? toAbsoluteUrl(origin, image) : "";

  // hreflang 세트 (indexable일 때만 출력)
  const hreflangs = indexable
    ? SUPPORTED_LANGS.map((l) => ({
        hreflang: l,
        href: normalizeCanonical(origin, l, slug),
      }))
    : [];

  const ogLocale = OG_LOCALE_MAP[(lang || "en").split("-")[0]] || "en_US";

  return (
    <Helmet>
      <html lang={lang} />
      <title>{title}</title>
      <meta name="description" content={description} />

      {/* Canonical */}
      <link rel="canonical" href={canonical} />

      {/* hreflang alternates (indexable일 때만) */}
      {hreflangs.map(({ hreflang, href }) => (
        <link key={hreflang} rel="alternate" hrefLang={hreflang} href={href} />
      ))}
      {indexable && (
        <link
          rel="alternate"
          hrefLang="x-default"
          href={normalizeCanonical(origin, "en", slug)}
        />
      )}

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="OnePickGame" />
      <meta property="og:locale" content={ogLocale} />
      {absoluteImage ? <meta property="og:image" content={absoluteImage} /> : null}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {absoluteImage ? <meta name="twitter:image" content={absoluteImage} /> : null}

      {/* robots는 SEOManager가 통제 (여기선 설정하지 않음) */}
    </Helmet>
  );
}
