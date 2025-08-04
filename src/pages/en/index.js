import React, { useEffect } from "react";
import { Helmet } from "react-helmet";
import Home from "../../components/Home";
import { useTranslation } from "react-i18next";

export default function EnPage(props) {
  const { i18n } = useTranslation();

  useEffect(() => {
    if (i18n.language !== "en") {
      i18n.changeLanguage("en");
      localStorage.setItem("onepickgame_lang", "en");
    }
  }, [i18n]);

  return (
    <>
      <Helmet>
        <title>One Pick Game - Bracket Game Site</title>
        <meta
          name="description"
          content="Bracket game site One Pick Game. Create your own tournament bracket, enjoy fun matchups, and play with users around the world!"
        />
        <meta property="og:title" content="One Pick Game - Bracket Game Site" />
        <meta property="og:description" content="Bracket game site One Pick Game. Create your own tournament bracket, enjoy fun matchups, and play with users around the world!" />
        <meta property="og:image" content="https://onepickgame.com/ogimg.png" />
        <meta property="og:url" content="https://onepickgame.com/en" />
        {/* ✅ canonical 태그 추가! */}
        <link rel="canonical" href="https://onepickgame.com/en/" />
      </Helmet>
      <Home {...props} />
    </>
  );
}
