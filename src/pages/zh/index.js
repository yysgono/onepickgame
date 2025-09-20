import React, { useEffect } from "react";
import { Helmet } from "react-helmet";
import Home from "../../components/Home";
import { useTranslation } from "react-i18next";

export default function ZhPage(props) {
  const { i18n } = useTranslation();

  useEffect(() => {
    if (i18n.language !== "zh") {
      i18n.changeLanguage("zh");
      localStorage.setItem("onepickgame_lang", "zh");
    }
  }, [i18n]);

  const base = "https://www.onepickgame.com";
  const self = `${base}/zh`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "One Pick Game",
    alternateName: ["OnePickGame", "理想型世界杯 游戏"],
    url: base,
    inLanguage: "zh",
    potentialAction: {
      "@type": "SearchAction",
      target: `${base}/zh?search={query}`,
      "query-input": "required name=query",
    },
  };

  return (
    <>
      <Helmet htmlAttributes={{ lang: "zh" }}>
        <title>One Pick Game - 理想型世界杯 锦标赛游戏</title>
        <meta
          name="description"
          content="在 One Pick Game 上玩理想型世界杯！创建属于自己的锦标赛，为喜欢的选项投票，并与全球用户一起享受乐趣。"
        />

        <link rel="canonical" href={self} />
        <meta property="og:title" content="One Pick Game - 理想型世界杯 锦标赛游戏" />
        <meta
          property="og:description"
          content="One Pick Game 是理想型世界杯网站。创建属于你的锦标赛，参与比赛，并与全世界的朋友分享结果！"
        />
        <meta property="og:image" content={`${base}/ogimg.png`} />
        <meta property="og:url" content={self} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="One Pick Game" />
        <meta property="og:locale" content="zh_CN" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="One Pick Game - 理想型世界杯 锦标赛游戏" />
        <meta
          name="twitter:description"
          content="One Pick Game 是理想型世界杯网站。创建属于你的锦标赛，参与比赛，并与全世界的朋友分享结果！"
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
