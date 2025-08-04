import React, { useEffect } from "react";
import { Helmet } from "react-helmet";
import Home from "../../components/Home";
import { useTranslation } from "react-i18next";

export default function PtPage(props) {
  const { i18n } = useTranslation();

  useEffect(() => {
    if (i18n.language !== "pt") {
      i18n.changeLanguage("pt");
      localStorage.setItem("onepickgame_lang", "pt");
    }
  }, [i18n]);

  return (
    <>
      <Helmet>
        <title>One Pick Game - Jogo de Brackets</title>
        <meta
          name="description"
          content="One Pick Game é um site de jogo de brackets. Crie seu próprio torneio eliminatório e jogue com pessoas do mundo todo!"
        />
        <meta property="og:title" content="One Pick Game - Jogo de Brackets" />
        <meta property="og:description" content="One Pick Game é um site de jogo de brackets. Crie seu próprio torneio eliminatório e jogue com pessoas do mundo todo!" />
        <meta property="og:image" content="https://onepickgame.com/ogimg.png" />
        <meta property="og:url" content="https://onepickgame.com/pt" />
        {/* ✅ canonical 태그 추가! */}
        <link rel="canonical" href="https://onepickgame.com/pt/" />
      </Helmet>
      <Home {...props} />
    </>
  );
}
