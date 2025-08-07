import React, { useEffect } from "react";
import { Helmet } from "react-helmet";
import Home from "../../components/Home";
import { useTranslation } from "react-i18next";

export default function IdPage(props) {
  const { i18n } = useTranslation();

  useEffect(() => {
    if (i18n.language !== "id") {
      i18n.changeLanguage("id");
      localStorage.setItem("onepickgame_lang", "id");
    }
  }, [i18n]);

  return (
    <>
      <Helmet>
        <title>One Pick Game - Situs Game Bracket</title>
        <meta
          name="description"
          content="One Pick Game adalah situs game bracket. Buat turnamen bracketmu sendiri dan mainkan bersama pengguna dari seluruh dunia!"
        />
        <meta property="og:title" content="One Pick Game - Situs Game Bracket" />
        <meta property="og:description" content="One Pick Game adalah situs game bracket. Buat turnamen bracketmu sendiri dan mainkan bersama pengguna dari seluruh dunia!" />
        <meta property="og:image" content="https://www.onepickgame.com/ogimg.png" />
        <meta property="og:url" content="https://www.onepickgame.com/id" />
        {/* ✅ canonical 태그 추가! */}
        <link rel="canonical" href="https://www.onepickgame.com/id/" />
      </Helmet>
      <Home {...props} />
    </>
  );
}
