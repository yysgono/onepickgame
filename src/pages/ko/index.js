import React, { useEffect } from "react";
import { Helmet } from "react-helmet-async";
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
  const self = `${base}/ko`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "OnePickGame",
    alternateName: [
      "원픽게임",
      "One Pick Game",
      "Ideal Type World Cup"
    ],
    url: base,
    inLanguage: "ko",
    potentialAction: {
      "@type": "SearchAction",
      target: `${base}/ko?search={query}`,
      "query-input": "required name=query"
    }
  };

  return (
    <>
      <Helmet htmlAttributes={{ lang: "ko" }}>
        <title>이상형 월드컵 해외 사이트 - 토너먼트 게임 | OnePickGame</title>

        <meta
          name="description"
          content="OnePickGame(원픽 게임)에서 다양한 이상형 월드컵과 토너먼트 게임을 즐겨보세요. 직접 월드컵을 만들고, 최애를 선택하고, 결과를 친구들과 공유할 수 있습니다."
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
          content="이상형 월드컵 - 토너먼트 게임 | OnePickGame"
        />

        <meta
          property="og:description"
          content="OnePickGame에서 다양한 이상형 월드컵과 토너먼트 게임을 즐겨보세요. 직접 만들고 최애를 선택해 결과를 공유할 수 있습니다."
        />

        <meta property="og:image" content={`${base}/ogimg.png`} />

        <meta
          property="og:image:alt"
          content="OnePickGame - 이상형 월드컵 토너먼트 게임"
        />

        <meta property="og:url" content={self} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="OnePickGame" />
        <meta property="og:locale" content="ko_KR" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />

        <meta
          name="twitter:title"
          content="이상형 월드컵 - 토너먼트 게임 | OnePickGame"
        />

        <meta
          name="twitter:description"
          content="OnePickGame에서 이상형 월드컵을 만들고 플레이하세요. 최애를 선택하고 토너먼트 결과를 친구들과 공유할 수 있습니다."
        />

        <meta name="twitter:image" content={`${base}/ogimg.png`} />

        <meta
          name="twitter:image:alt"
          content="OnePickGame - 이상형 월드컵 토너먼트 게임"
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