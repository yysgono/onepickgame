import React, { useEffect } from "react";
import { Helmet } from "react-helmet";
import Home from "../../components/Home";
import { useTranslation } from "react-i18next";

export default function TrPage(props) {
  const { i18n } = useTranslation();

  useEffect(() => {
    if (i18n.language !== "tr") {
      i18n.changeLanguage("tr");
      localStorage.setItem("onepickgame_lang", "tr");
    }
  }, [i18n]);

  const base = "https://www.onepickgame.com";
  const self = `${base}/tr`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "One Pick Game",
    alternateName: ["OnePickGame", "Ideal Type World Cup Oyunu"],
    url: base,
    inLanguage: "tr",
    potentialAction: {
      "@type": "SearchAction",
      target: `${base}/tr?search={query}`,
      "query-input": "required name=query",
    },
  };

  return (
    <>
      <Helmet htmlAttributes={{ lang: "tr" }}>
        <title>One Pick Game - Ideal Type World Cup Turnuva Oyunu</title>
        <meta
          name="description"
          content="One Pick Game'de Ideal Type World Cup oynayın! Kendi turnuva parantezinizi oluşturun, favorilerinize oy verin ve dünya çapındaki kullanıcılarla eğlenin."
        />

        <link rel="canonical" href={self} />
        <meta property="og:title" content="One Pick Game - Ideal Type World Cup Turnuva Oyunu" />
        <meta
          property="og:description"
          content="One Pick Game Ideal Type World Cup sitesi. Kendi turnuvanı oluştur, maçlara katıl ve sonuçları dünyayla paylaş!"
        />
        <meta property="og:image" content={`${base}/ogimg.png`} />
        <meta property="og:url" content={self} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="One Pick Game" />
        <meta property="og:locale" content="tr_TR" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="One Pick Game - Ideal Type World Cup Turnuva Oyunu" />
        <meta
          name="twitter:description"
          content="One Pick Game Ideal Type World Cup sitesi. Kendi turnuvanı oluştur, maçlara katıl ve sonuçları dünyayla paylaş!"
        />
        <meta name="twitter:image" content={`${base}/ogimg.png`} />

        {/* hreflang 공통 */}
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

        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <Home {...props} />
    </>
  );
}
