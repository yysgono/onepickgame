import React, { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import Home from "../../components/Home";
import { useTranslation } from "react-i18next";

export default function HiPage(props) {
  const { i18n } = useTranslation();

  useEffect(() => {
    if (i18n.language !== "hi") {
      i18n.changeLanguage("hi");
      localStorage.setItem("onepickgame_lang", "hi");
    }
  }, [i18n]);

  const base = "https://www.onepickgame.com";
  const self = `${base}/hi`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "OnePickGame",
    alternateName: ["One Pick Game", "Ideal Type World Cup"],
    url: base,
    inLanguage: "hi",
    potentialAction: {
      "@type": "SearchAction",
      target: `${base}/hi?search={query}`,
      "query-input": "required name=query"
    }
  };

  return (
    <>
      <Helmet htmlAttributes={{ lang: "hi" }}>
        <title>टूर्नामेंट और ब्रैकेट गेम | OnePickGame</title>

        <meta
          name="description"
          content="OnePickGame पर टूर्नामेंट और ब्रैकेट गेम बनाएं और खेलें। अपने पसंदीदा विकल्प चुनें, मुकाबलों में वोट करें, अपना टूर्नामेंट बनाएं और नतीजे शेयर करें।"
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
          content="टूर्नामेंट और ब्रैकेट गेम | OnePickGame"
        />

        <meta
          property="og:description"
          content="OnePickGame पर टूर्नामेंट और ब्रैकेट गेम बनाएं और खेलें। अपने पसंदीदा विकल्पों को वोट दें और नतीजे शेयर करें।"
        />

        <meta property="og:image" content={`${base}/ogimg.png`} />

        <meta
          property="og:image:alt"
          content="OnePickGame - टूर्नामेंट और ब्रैकेट गेम"
        />

        <meta property="og:url" content={self} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="OnePickGame" />
        <meta property="og:locale" content="hi_IN" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />

        <meta
          name="twitter:title"
          content="टूर्नामेंट और ब्रैकेट गेम | OnePickGame"
        />

        <meta
          name="twitter:description"
          content="OnePickGame पर अपना टूर्नामेंट और ब्रैकेट बनाएं, पसंदीदा विकल्पों को वोट दें और अपने नतीजे शेयर करें।"
        />

        <meta name="twitter:image" content={`${base}/ogimg.png`} />

        <meta
          name="twitter:image:alt"
          content="OnePickGame - टूर्नामेंट और ब्रैकेट गेम"
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