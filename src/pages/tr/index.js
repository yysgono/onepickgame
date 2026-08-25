import React, { useEffect } from "react";
import { Helmet } from "react-helmet-async";
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
    name: "OnePickGame",
    alternateName: [
      "One Pick Game",
      "Ideal Type World Cup"
    ],
    url: base,
    inLanguage: "tr",
    potentialAction: {
      "@type": "SearchAction",
      target: `${base}/tr?search={query}`,
      "query-input": "required name=query"
    }
  };

  return (
    <>
      <Helmet htmlAttributes={{ lang: "tr" }}>
        <title>Turnuva ve Eşleşme Oyunu | OnePickGame</title>

        <meta
          name="description"
          content="OnePickGame'de turnuva ve eşleşme oyunları oluşturun ve oynayın. Favorilerinizi seçin, her turda oy verin, kendi turnuvanızı oluşturun ve sonuçları paylaşın."
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
          content="Turnuva ve Eşleşme Oyunu | OnePickGame"
        />

        <meta
          property="og:description"
          content="OnePickGame'de turnuvalar oluşturun ve oynayın. Favorilerinizi seçin, eşleşmelerde oy verin ve sonuçlarınızı paylaşın."
        />

        <meta property="og:image" content={`${base}/ogimg.png`} />

        <meta
          property="og:image:alt"
          content="OnePickGame - Turnuva ve Eşleşme Oyunu"
        />

        <meta property="og:url" content={self} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="OnePickGame" />
        <meta property="og:locale" content="tr_TR" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />

        <meta
          name="twitter:title"
          content="Turnuva ve Eşleşme Oyunu | OnePickGame"
        />

        <meta
          name="twitter:description"
          content="OnePickGame'de kendi turnuvanızı oluşturun, favorilerinize oy verin ve sonuçlarınızı paylaşın."
        />

        <meta name="twitter:image" content={`${base}/ogimg.png`} />

        <meta
          name="twitter:image:alt"
          content="OnePickGame - Turnuva ve Eşleşme Oyunu"
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