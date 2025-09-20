import React, { useEffect } from "react";
import { Helmet } from "react-helmet";
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
  const self = `${base}/ko`; // trailingSlash:false와 일치

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "One Pick Game",
    "alternateName": ["원픽게임", "OnePickGame"],
    "url": base,
    "inLanguage": "ko",
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${base}/ko?search={query}`,
      "query-input": "required name=query"
    }
  };

  return (
    <>
      <Helmet htmlAttributes={{ lang: "ko" }}>
        {/* Title에 '해외' 키워드 포함 */}
        <title>One Pick Game – 이상형 월드컵 해외 사이트 | 원픽게임</title>

        <meta
          name="description"
          content="이상형 월드컵 해외 사이트 One Pick Game(원픽게임). 다양한 주제로 브라켓을 만들고 플레이하며 전 세계 유저들과 함께 즐겨보세요!"
        />

        {/* Canonical & OpenGraph */}
        <link rel="canonical" href={self} />

        <meta
          property="og:title"
          content="One Pick Game – 이상형 월드컵 해외 사이트 | 원픽게임"
        />
        <meta
          property="og:description"
          content="One Pick Game에서 직접 이상형 월드컵을 만들고 플레이하세요. 해외 유저들과 실시간으로 대결하며 즐기는 글로벌 원픽게임!"
        />
        <meta property="og:image" content={`${base}/ogimg.png`} />
        <meta property="og:url" content={self} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="One Pick Game" />
        <meta property="og:locale" content="ko_KR" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="One Pick Game – 이상형 월드컵 해외 사이트 | 원픽게임"
        />
        <meta
          name="twitter:description"
          content="이상형 월드컵 해외 사이트 원픽게임에서 브라켓을 만들고 전 세계 유저들과 함께 즐겨보세요!"
        />
        <meta name="twitter:image" content={`${base}/ogimg.png`} />

        {/* hreflang: 지원하는 모든 언어 */}
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
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <Home {...props} />
    </>
  );
}
