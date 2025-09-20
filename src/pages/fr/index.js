import React, { useEffect } from "react";
import { Helmet } from "react-helmet";
import Home from "../../components/Home";
import { useTranslation } from "react-i18next";

export default function FrPage(props) {
  const { i18n } = useTranslation();

  useEffect(() => {
    if (i18n.language !== "fr") {
      i18n.changeLanguage("fr");
      localStorage.setItem("onepickgame_lang", "fr");
    }
  }, [i18n]);

  const base = "https://www.onepickgame.com";
  const self = `${base}/fr`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "One Pick Game",
    alternateName: ["OnePickGame", "Coupe du Monde du Type Idéal"],
    url: base,
    inLanguage: "fr",
    potentialAction: {
      "@type": "SearchAction",
      target: `${base}/fr?search={query}`,
      "query-input": "required name=query",
    },
  };

  return (
    <>
      <Helmet htmlAttributes={{ lang: "fr" }}>
        <title>One Pick Game - Coupe du Monde du Type Idéal Tournoi</title>
        <meta
          name="description"
          content="Jouez à la Coupe du Monde du Type Idéal sur One Pick Game ! Créez vos propres tournois, votez pour vos favoris et profitez de matchs amusants avec des utilisateurs du monde entier."
        />

        {/* Canonical & OpenGraph */}
        <link rel="canonical" href={self} />
        <meta
          property="og:title"
          content="One Pick Game - Coupe du Monde du Type Idéal Tournoi"
        />
        <meta
          property="og:description"
          content="One Pick Game est le site de la Coupe du Monde du Type Idéal. Créez votre propre tournoi, participez aux duels et partagez les résultats avec des amis partout dans le monde."
        />
        <meta property="og:image" content={`${base}/ogimg.png`} />
        <meta property="og:url" content={self} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="One Pick Game" />
        <meta property="og:locale" content="fr_FR" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="One Pick Game - Coupe du Monde du Type Idéal Tournoi"
        />
        <meta
          name="twitter:description"
          content="One Pick Game est le site de la Coupe du Monde du Type Idéal. Créez votre propre tournoi, participez aux duels et partagez les résultats avec des amis partout dans le monde."
        />
        <meta name="twitter:image" content={`${base}/ogimg.png`} />

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
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <Home {...props} />
    </>
  );
}
