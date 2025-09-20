import React, { useEffect } from "react";
import { Helmet } from "react-helmet";
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
    name: "One Pick Game",
    alternateName: ["OnePickGame", "आदर्श प्रकार विश्व कप"],
    url: base,
    inLanguage: "hi",
    potentialAction: {
      "@type": "SearchAction",
      target: `${base}/hi?search={query}`,
      "query-input": "required name=query",
    },
  };

  return (
    <>
      <Helmet htmlAttributes={{ lang: "hi" }}>
        <title>One Pick Game - आदर्श प्रकार वर्ल्ड कप टूर्नामेंट</title>
        <meta
          name="description"
          content="One Pick Game पर आदर्श प्रकार वर्ल्ड कप खेलें! अपने स्वयं के टूर्नामेंट ब्रैकेट बनाएं, पसंदीदा को वोट दें और दुनिया भर के उपयोगकर्ताओं के साथ मजेदार मुकाबलों का आनंद लें।"
        />

        {/* Canonical & OpenGraph */}
        <link rel="canonical" href={self} />
        <meta
          property="og:title"
          content="One Pick Game - आदर्श प्रकार वर्ल्ड कप टूर्नामेंट"
        />
        <meta
          property="og:description"
          content="One Pick Game आदर्श प्रकार वर्ल्ड कप साइट है। अपना खुद का ब्रैकेट बनाएं, टूर्नामेंट खेलें और दुनिया भर के दोस्तों के साथ परिणाम साझा करें!"
        />
        <meta property="og:image" content={`${base}/ogimg.png`} />
        <meta property="og:url" content={self} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="One Pick Game" />
        <meta property="og:locale" content="hi_IN" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="One Pick Game - आदर्श प्रकार वर्ल्ड कप टूर्नामेंट"
        />
        <meta
          name="twitter:description"
          content="One Pick Game आदर्श प्रकार वर्ल्ड कप साइट है। अपना खुद का ब्रैकेट बनाएं, टूर्नामेंट खेलें और दुनिया भर के दोस्तों के साथ परिणाम साझा करें!"
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
