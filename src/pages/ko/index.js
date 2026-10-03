import React, { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import Home from "../../components/Home";
import { useTranslation } from "react-i18next";

export default function KoPage(props) {
  const { i18n } = useTranslation();

  useEffect(() => {
    if (i18n.language !== "ko") {
      i18n.changeLanguage("ko");
      localStorage.setItem("onepickgame_lang", "ko");
    }
  }, [i18n]);

  const base = "https://www.onepickgame.com";
  const self = `${base}/ko`;
  const pageTitle = "이상형 월드컵 사이트 | 원픽게임 - 무료 월드컵 만들기";
  const pageDescription =
    "원픽게임은 이상형 월드컵을 만들고 플레이하는 무료 이상형 월드컵 사이트입니다. K-POP, 애니, 게임, 영화, 음식 등 다양한 주제의 월드컵과 티어표, 퀴즈를 즐길 수 있습니다.";
  const pageKeywords =
    "이상형 월드컵, 이상형월드컵, 원픽게임, OnePickGame, 월드컵 만들기, 무료 이상형 월드컵, 티어표, 퀴즈";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "OnePickGame",
    alternateName: [
      "원픽게임",
      "One Pick Game",
      "Ideal Type World Cup"
    ],
    url: base,
    inLanguage: "ko",
    potentialAction: {
      "@type": "SearchAction",
      target: `${base}/ko?search={query}`,
      "query-input": "required name=query"
    }
  };

  return (
    <>
      <Helmet htmlAttributes={{ lang: "ko" }}>
        <title>{pageTitle}</title>

        <meta
          name="description"
          content={pageDescription}
        />

        <meta
          name="keywords"
          content={pageKeywords}
        />

        <meta
          name="robots"
          content="index, follow, max-image-preview:large"
        />

        {/* Canonical */}
        <link rel="canonical" href={self} />

        {/* Open Graph */}
        <meta
          property="og:title"
          content={pageTitle}
        />

        <meta
          property="og:description"
          content={pageDescription}
        />

        <meta property="og:image" content={`${base}/ogimg.png`} />

        <meta
          property="og:image:alt"
          content="OnePickGame - 이상형 월드컵, 티어표, 퀴즈 사이트"
        />

        <meta property="og:url" content={self} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="OnePickGame" />
        <meta property="og:locale" content="ko_KR" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />

        <meta
          name="twitter:title"
          content={pageTitle}
        />

        <meta
          name="twitter:description"
          content={pageDescription}
        />

        <meta name="twitter:image" content={`${base}/ogimg.png`} />

        <meta
          name="twitter:image:alt"
          content="OnePickGame - 이상형 월드컵, 티어표, 퀴즈 사이트"
        />

        {/* hreflang */}
        <link rel="alternate" hrefLang="ar" href={`${base}/ar`} />
        <link rel="alternate" hrefLang="bn" href={`${base}/bn`} />
        <link rel="alternate" hrefLang="de" href={`${base}/de`} />
        <link rel="alternate" hrefLang="en" href={`${base}/en`} />
        <link rel="alternate" hrefLang="es" href={`${base}/es`} />
        <link rel="alternate" hrefLang="fr" href={`${base}/fr`} />
        <link rel="alternate" hrefLang="hi" href={`${base}/hi`} />
        <link rel="alternate" hrefLang="id" href={`${base}/id`} />
        <link rel="alternate" hrefLang="ja" href={`${base}/ja`} />
        <link rel="alternate" hrefLang="ko" href={`${base}/ko`} />
        <link rel="alternate" hrefLang="pt" href={`${base}/pt`} />
        <link rel="alternate" hrefLang="ru" href={`${base}/ru`} />
        <link rel="alternate" hrefLang="th" href={`${base}/th`} />
        <link rel="alternate" hrefLang="tr" href={`${base}/tr`} />
        <link rel="alternate" hrefLang="vi" href={`${base}/vi`} />
        <link rel="alternate" hrefLang="zh" href={`${base}/zh`} />
        <link rel="alternate" hrefLang="x-default" href={`${base}/en`} />

        {/* JSON-LD */}
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      </Helmet>

      <Home {...props} />
    </>
  );
}
