// src/seo/Seo.jsx
import React from "react";
import { Helmet } from "react-helmet-async";

const SUPPORTED_LANGS = [
  "en","ko","ja","zh","ru","pt","es","fr","id","hi","de","vi","ar","bn","th","tr"
];

const OG_LOCALE_MAP = {
  en: "en_US",
  ko: "ko_KR",
  ja: "ja_JP",
  zh: "zh_CN",
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

function normalizeCanonical(base, lang, slug = "", { langPrefix = true } = {}) {
  const b = stripTrailingSlash(base || "https://www.onepickgame.com");
  const l = String(lang || "en").split("-")[0];
  const s = stripSlashes(slug);

  // langPrefix=false 이면 /privacy-policy 같은 루트 경로 생성
  if (!langPrefix) return s ? `${b}/${s}` : b;

  // 기본: /{lang}/{slug}
  return s ? `${b}/${l}/${s}` : `${b}/${l}`;
}

function toAbsoluteUrl(origin, url) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  const o = stripTrailingSlash(origin || "https://www.onepickgame.com");
  const u = String(url).startsWith("/") ? url : `/${url}`;
  return `${o}${u}`;
}

export default function Seo({
  lang = "en",
  slug = "",                 // 예: "", "privacy-policy"
  title = "OnePickGame",
  description = "Create and play worldcup-style tournaments.",
  image = "/onepick-social.png",
  indexable = true,

  // 🔽 새로 추가된 옵션들
  langPrefix = true,         // false면 /[slug] (언어 prefix 제거)
  hreflangLangs,             // 지정 시 그 언어만 alternates 생성. 미지정 시 전체 세트
}) {
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://www.onepickgame.com";

  const canonical = normalizeCanonical(origin, lang, slug, { langPrefix });
  const absoluteImage = image ? toAbsoluteUrl(origin, image) : "";

  // hreflang 세트: 기본은 전체 언어. 단, langPrefix=false & 영어 전용이면 ["en"]만 권장
  const langsForHreflang = hreflangLangs ?? SUPPORTED_LANGS;

  const hreflangs = indexable
    ? langsForHreflang.map((l) => ({
        hreflang: l,
        href: normalizeCanonical(origin, l, slug, { langPrefix }),
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

      {/* hreflang alternates */}
      {hreflangs.map(({ hreflang, href }) => (
        <link key={hreflang} rel="alternate" hrefLang={hreflang} href={href} />
      ))}
      {indexable && (
        <link
          rel="alternate"
          hrefLang="x-default"
          href={normalizeCanonical(origin, "en", slug, { langPrefix })}
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
    </Helmet>
  );
}
