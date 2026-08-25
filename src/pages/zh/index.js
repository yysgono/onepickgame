import React, { useEffect } from "react";
import { Helmet } from "react-helmet-async";
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
    name: "OnePickGame",
    alternateName: [
      "One Pick Game",
      "Ideal Type World Cup"
    ],
    url: base,
    inLanguage: "zh",
    potentialAction: {
      "@type": "SearchAction",
      target: `${base}/zh?search={query}`,
      "query-input": "required name=query"
    }
  };

  return (
    <>
      <Helmet htmlAttributes={{ lang: "zh" }}>
        <title>淘汰赛游戏和对阵表 | OnePickGame</title>

        <meta
          name="description"
          content="在 OnePickGame 创建和游玩淘汰赛游戏。选择你最喜欢的选项，在每轮对决中投票，创建自己的对阵表，并与朋友分享最终结果。"
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
          content="淘汰赛游戏和对阵表 | OnePickGame"
        />

        <meta
          property="og:description"
          content="在 OnePickGame 创建和游玩淘汰赛游戏，选择你最喜欢的选项，在每轮对决中投票并分享最终结果。"
        />

        <meta property="og:image" content={`${base}/ogimg.png`} />

        <meta
          property="og:image:alt"
          content="OnePickGame - 淘汰赛游戏和对阵表"
        />

        <meta property="og:url" content={self} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="OnePickGame" />
        <meta property="og:locale" content="zh_CN" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />

        <meta
          name="twitter:title"
          content="淘汰赛游戏和对阵表 | OnePickGame"
        />

        <meta
          name="twitter:description"
          content="在 OnePickGame 创建自己的淘汰赛，为喜欢的选项投票，并分享最终结果。"
        />

        <meta name="twitter:image" content={`${base}/ogimg.png`} />

        <meta
          name="twitter:image:alt"
          content="OnePickGame - 淘汰赛游戏和对阵表"
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