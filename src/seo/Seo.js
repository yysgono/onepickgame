// src/seo/Seo.jsx

import React from "react";
import { Helmet } from "react-helmet-async";

const SITE_URL = "https://www.onepickgame.com";

const SUPPORTED_LANGS = [
  "en",
  "ko",
  "ja",
  "zh",
  "ru",
  "pt",
  "es",
  "fr",
  "id",
  "hi",
  "de",
  "vi",
  "ar",
  "bn",
  "th",
  "tr",
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

function stripTrailingSlash(value = "") {
  return String(value).replace(/\/+$/, "");
}

function stripSlashes(value = "") {
  return String(value).replace(/^\/+|\/+$/g, "");
}

function normalizeCanonical(
  base,
  lang,
  slug = "",
  { langPrefix = true } = {}
) {
  const normalizedBase = stripTrailingSlash(base || SITE_URL);
  const normalizedLang = String(lang || "en").split("-")[0];
  const normalizedSlug = stripSlashes(slug);

  if (!langPrefix) {
    return normalizedSlug
      ? `${normalizedBase}/${normalizedSlug}`
      : normalizedBase;
  }

  return normalizedSlug
    ? `${normalizedBase}/${normalizedLang}/${normalizedSlug}`
    : `${normalizedBase}/${normalizedLang}`;
}

function toAbsoluteUrl(origin, url) {
  if (!url) return "";

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  const normalizedOrigin = stripTrailingSlash(origin || SITE_URL);
  const normalizedUrl = String(url).startsWith("/")
    ? url
    : `/${url}`;

  return `${normalizedOrigin}${normalizedUrl}`;
}

export default function Seo({
  lang = "en",
  slug = "",
  title = "OnePickGame",
  description = "Create and play worldcup-style tournaments.",
  image = "/onepick-social.png",

  indexable = true,

  langPrefix = true,

  hreflangLangs,

  type = "website",
}) {
const normalizedLang = String(lang || "en").split("-")[0];

const safeTitle = String(title || "OnePickGame")
  .replace(/\s+/g, " ")
  .trim();

const safeDescription = String(
  description || "Create and play tournament bracket games on OnePickGame."
)
  .replace(/\s+/g, " ")
  .trim();

// 항상 실제 서비스 도메인 사용
const origin = SITE_URL;

  const canonical = normalizeCanonical(origin, normalizedLang, slug, {
    langPrefix,
  });

  const absoluteImage = image
    ? toAbsoluteUrl(origin, image)
    : "";

  const langsForHreflang =
    hreflangLangs ?? SUPPORTED_LANGS;

  const hreflangs = indexable
    ? langsForHreflang.map((l) => ({
        hreflang: l,
        href: normalizeCanonical(origin, l, slug, {
          langPrefix,
        }),
      }))
    : [];

  const ogLocale =
    OG_LOCALE_MAP[normalizedLang] || "en_US";

  const alternateOgLocales = langsForHreflang
    .filter((l) => l !== normalizedLang)
    .map((l) => OG_LOCALE_MAP[l])
    .filter(Boolean);

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",

  name: safeTitle,
  description: safeDescription,

  url: canonical,
  inLanguage: normalizedLang,
    isPartOf: {
      "@type": "WebSite",
      name: "OnePickGame",
      url: SITE_URL,
    },
    ...(absoluteImage
      ? {
          primaryImageOfPage: {
            "@type": "ImageObject",
            url: absoluteImage,
          },
        }
      : {}),
  };

  return (
    <Helmet>
      {/* 기본 */}

      <html lang={normalizedLang} />

<title>{safeTitle}</title>

<meta
  name="description"
  content={safeDescription}
/>

<meta
  name="robots"
  content={
    indexable
      ? "index, follow, max-image-preview:large"
      : "noindex, follow"
  }
/>
      {/* Canonical */}

      <link
        rel="canonical"
        href={canonical}
      />

      {/* hreflang */}

      {hreflangs.map(({ hreflang, href }) => (
        <link
          key={hreflang}
          rel="alternate"
          hrefLang={hreflang}
          href={href}
        />
      ))}

      {indexable && (
        <link
          rel="alternate"
          hrefLang="x-default"
          href={normalizeCanonical(
            origin,
            "en",
            slug,
            {
              langPrefix,
            }
          )}
        />
      )}

      {/* Open Graph */}

      <meta
        property="og:type"
        content={type}
      />

   <meta
  property="og:title"
  content={safeTitle}
/>

<meta
  property="og:description"
  content={safeDescription}
/>

      <meta
        property="og:url"
        content={canonical}
      />

      <meta
        property="og:site_name"
        content="OnePickGame"
      />

      <meta
        property="og:locale"
        content={ogLocale}
      />

      {alternateOgLocales.map((locale) => (
        <meta
          key={locale}
          property="og:locale:alternate"
          content={locale}
        />
      ))}

      {absoluteImage && (
        <>
          <meta
            property="og:image"
            content={absoluteImage}
          />

<meta
  property="og:image:alt"
  content={safeTitle}
/>
        </>
      )}

      {/* Twitter */}

      <meta
        name="twitter:card"
        content="summary_large_image"
      />

<meta
  name="twitter:title"
  content={safeTitle}
/>

<meta
  name="twitter:description"
  content={safeDescription}
/>

      {absoluteImage && (
        <>
          <meta
            name="twitter:image"
            content={absoluteImage}
          />

<meta
  name="twitter:image:alt"
  content={safeTitle}
/>
        </>
      )}

      {/* JSON-LD */}

      <script type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </script>
    </Helmet>
  );
}