import React, { useEffect } from "react";
import { Helmet } from "react-helmet";
import Home from "../../components/Home";
import { useTranslation } from "react-i18next";

export default function FrPage(props) {
  const { i18n } = useTranslation();

  useEffect(() => {
    if (i18n.language !== "fr") {
      i18n.changeLanguage("fr");
      localStorage.setItem("onepickgame_lang", "fr");
    }
  }, [i18n]);

  return (
    <>
      <Helmet>
        <title>One Pick Game - Site de jeux de Brackets</title>
        <meta
          name="description"
          content="One Pick Game est un site de jeux de brackets. Créez votre propre tournoi à élimination directe et jouez avec des utilisateurs du monde entier !"
        />
        <meta property="og:title" content="One Pick Game - Site de jeux de Brackets" />
        <meta property="og:description" content="One Pick Game est un site de jeux de brackets. Créez votre propre tournoi à élimination directe et jouez avec des utilisateurs du monde entier !" />
        <meta property="og:image" content="https://onepickgame.com/ogimg.png" />
        <meta property="og:url" content="https://onepickgame.com/fr" />
      </Helmet>
      <Home {...props} />
    </>
  );
}
