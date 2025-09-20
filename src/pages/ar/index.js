import React, { useEffect } from "react";
import { Helmet } from "react-helmet";
import Home from "../../components/Home";
import { useTranslation } from "react-i18next";

export default function ArPage(props) {
  const { i18n } = useTranslation();

  useEffect(() => {
    if (i18n.language !== "ar") {
      i18n.changeLanguage("ar");
      localStorage.setItem("onepickgame_lang", "ar");
    }
  }, [i18n]);

  const base = "https://www.onepickgame.com";
  const self = `${base}/ar`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "One Pick Game",
    alternateName: ["OnePickGame", "Ideal Type World Cup"],
    url: base,
    inLanguage: "ar",
    potentialAction: {
      "@type": "SearchAction",
      target: `${base}/ar?search={query}`,
      "query-input": "required name=query"
    }
  };

  return (
    <>
      <Helmet htmlAttributes={{ lang: "ar", dir: "rtl" }}>
        <title>One Pick Game - كأس العالم لاختيار النوع المثالي</title>
        <meta
          name="description"
          content="العب كأس العالم لاختيار النوع المثالي على One Pick Game! أنشئ بطولاتك الخاصة، صوّت لمفضلّيك، واستمتع بمواجهات ممتعة مع مستخدمين من جميع أنحاء العالم."
        />

        {/* Canonical & OpenGraph */}
        <link rel="canonical" href={self} />
        <meta property="og:title" content="One Pick Game - كأس العالم لاختيار النوع المثالي" />
        <meta
          property="og:description"
          content="One Pick Game هو موقع كأس العالم لاختيار النوع المثالي. أنشئ البطولات الخاصة بك، العب الجولات، وشارك النتائج مع أصدقائك حول العالم!"
        />
        <meta property="og:image" content={`${base}/ogimg.png`} />
        <meta property="og:url" content={self} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="One Pick Game" />
        <meta property="og:locale" content="ar_AR" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="One Pick Game - كأس العالم لاختيار النوع المثالي" />
        <meta
          name="twitter:description"
          content="One Pick Game هو موقع كأس العالم لاختيار النوع المثالي. أنشئ البطولات الخاصة بك، العب الجولات، وشارك النتائج مع أصدقائك حول العالم!"
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
