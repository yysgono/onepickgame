import React, { useEffect } from "react";
import { Helmet } from "react-helmet";
import Home from "../../components/Home";
import { useTranslation } from "react-i18next";

export default function EsPage(props) {
  const { i18n } = useTranslation();

  useEffect(() => {
    if (i18n.language !== "es") {
      i18n.changeLanguage("es");
      localStorage.setItem("onepickgame_lang", "es");
    }
  }, [i18n]);

  const base = "https://www.onepickgame.com";
  const self = `${base}/es`; // trailingSlash:false와 일치

  return (
    <>
      <Helmet htmlAttributes={{ lang: "es" }}>
        <title>One Pick Game - Sitio de Juegos de Brackets</title>
        <meta
          name="description"
          content="One Pick Game es un sitio de juegos de brackets. Crea tu propio torneo de eliminatorias y compite con usuarios de todo el mundo."
        />

        {/* Canonical & OpenGraph */}
        <link rel="canonical" href={self} />
        <meta property="og:title" content="One Pick Game - Sitio de Juegos de Brackets" />
        <meta
          property="og:description"
          content="One Pick Game es un sitio de juegos de brackets. Crea tu propio torneo de eliminatorias y compite con usuarios de todo el mundo."
        />
        <meta property="og:image" content={`${base}/ogimg.png`} />
        <meta property="og:url" content={self} />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="es_ES" />

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
      </Helmet>

      <Home {...props} />
    </>
  );
}
