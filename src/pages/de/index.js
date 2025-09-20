import React, { useEffect } from "react";
import { Helmet } from "react-helmet";
import Home from "../../components/Home";
import { useTranslation } from "react-i18next";

export default function DePage(props) {
  const { i18n } = useTranslation();

  useEffect(() => {
    if (i18n.language !== "de") {
      i18n.changeLanguage("de");
      localStorage.setItem("onepickgame_lang", "de");
    }
  }, [i18n]);

  const base = "https://www.onepickgame.com";
  const self = `${base}/de`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "One Pick Game",
    alternateName: ["OnePickGame", "Ideal Type World Cup"],
    url: base,
    inLanguage: "de",
    potentialAction: {
      "@type": "SearchAction",
      target: `${base}/de?search={query}`,
      "query-input": "required name=query"
    }
  };

  return (
    <>
      <Helmet htmlAttributes={{ lang: "de" }}>
        <title>One Pick Game - Idealtyp Weltcup Turnierspiel</title>
        <meta
          name="description"
          content="Spiele den Idealtyp Weltcup auf One Pick Game! Erstelle deine eigenen Turnier-Brackets, stimme für Favoriten ab und genieße spannende Duelle mit Nutzern weltweit."
        />

        {/* Canonical & OpenGraph */}
        <link rel="canonical" href={self} />
        <meta property="og:title" content="One Pick Game - Idealtyp Weltcup Turnierspiel" />
        <meta
          property="og:description"
          content="One Pick Game ist die Idealtyp Weltcup Seite. Erstelle dein eigenes Bracket, spiele Turniere und teile Ergebnisse mit Freunden auf der ganzen Welt!"
        />
        <meta property="og:image" content={`${base}/ogimg.png`} />
        <meta property="og:url" content={self} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="One Pick Game" />
        <meta property="og:locale" content="de_DE" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="One Pick Game - Idealtyp Weltcup Turnierspiel" />
        <meta
          name="twitter:description"
          content="One Pick Game ist die Idealtyp Weltcup Seite. Erstelle dein eigenes Bracket, spiele Turniere und teile Ergebnisse mit Freunden auf der ganzen Welt!"
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
