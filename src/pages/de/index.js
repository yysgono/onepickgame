import React, { useEffect } from "react";
import { Helmet } from "react-helmet";
import Home from "../../components/Home";
import { useTranslation } from "react-i18next";

export default function DePage(props) {
  const { i18n } = useTranslation();

  useEffect(() => {
    if (i18n.language !== "de") {
      i18n.changeLanguage("de");
      localStorage.setItem("onepickgame_lang", "de");
    }
  }, [i18n]);

  return (
    <>
      <Helmet>
        <title>One Pick Game - Bracket-Spielseite</title>
        <meta
          name="description"
          content="One Pick Game ist eine Bracket-Spielseite. Erstelle dein eigenes Turnier und spiele mit Nutzern aus aller Welt!"
        />
        <meta property="og:title" content="One Pick Game - Bracket-Spielseite" />
        <meta property="og:description" content="One Pick Game ist eine Bracket-Spielseite. Erstelle dein eigenes Turnier und spiele mit Nutzern aus aller Welt!" />
        <meta property="og:image" content="https://onepickgame.com/ogimg.png" />
        <meta property="og:url" content="https://onepickgame.com/de" />
        {/* ✅ canonical 태그 추가! */}
        <link rel="canonical" href="https://onepickgame.com/de/" />
      </Helmet>
      <Home {...props} />
    </>
  );
}
