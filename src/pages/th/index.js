import React, { useEffect } from "react";
import { Helmet } from "react-helmet";
import Home from "../../components/Home";
import { useTranslation } from "react-i18next";

export default function ThPage(props) {
  const { i18n } = useTranslation();

  useEffect(() => {
    if (i18n.language !== "th") {
      i18n.changeLanguage("th");
      localStorage.setItem("onepickgame_lang", "th");
    }
  }, [i18n]);

  const base = "https://www.onepickgame.com";
  const self = `${base}/th`; // trailingSlash:false와 일치

  return (
    <>
      <Helmet htmlAttributes={{ lang: "th" }}>
        <title>One Pick Game - เว็บไซต์เกมจัดสายการแข่งขัน</title>
        <meta
          name="description"
          content="เว็บไซต์เกมจัดสายการแข่งขัน One Pick Game สร้างทัวร์นาเมนต์ของคุณเอง สนุกกับแมตช์สุดมันส์ และเล่นกับผู้ใช้งานทั่วโลก!"
        />

        {/* Canonical & OpenGraph */}
        <link rel="canonical" href={self} />
        <meta property="og:title" content="One Pick Game - เว็บไซต์เกมจัดสายการแข่งขัน" />
        <meta
          property="og:description"
          content="เว็บไซต์เกมจัดสายการแข่งขัน One Pick Game สร้างทัวร์นาเมนต์ของคุณเอง สนุกกับแมตช์สุดมันส์ และเล่นกับผู้ใช้งานทั่วโลก!"
        />
        <meta property="og:image" content={`${base}/ogimg.png`} />
        <meta property="og:url" content={self} />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="th_TH" />

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
