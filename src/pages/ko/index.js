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

  return (
    <>
      <Helmet htmlAttributes={{ lang: "ko" }}>
        <title>One Pick Game - 이상형 월드컵 해외 사이트 Ideal Type Tournament World Cup </title>
        <meta
          name="description"
          content="이상형 월드컵 사이트 해외 One Pick Game입니다. 원픽게임 사이트에서 다양한 주제의 월드컵 만들기 기능으로 해외 유저들과 함께 즐겨보세요. Ideal Type Tournament World Cup"
        />

        {/* Canonical & OpenGraph */}
        <link rel="canonical" href={self} />
        <meta property="og:title" content="One Pick Game - 이상형 월드컵 해외 사이트 Ideal Type Tournament World Cup" />
        <meta
          property="og:description"
          content="이상형 월드컵 해외 사이트 One Pick Game입니다. 원픽게임 사이트에서 다양한 주제의 월드컵 만들기 기능으로 해외 유저들과 함께 즐겨보세요. Ideal Type Tournament World Cup"
        />
        <meta property="og:image" content={`${base}/ogimg.png`} />
        <meta property="og:url" content={self} />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="ko_KR" />

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
