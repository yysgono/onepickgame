import React, { useEffect } from "react";
import { Helmet } from "react-helmet";
import Home from "../../components/Home";
import { useTranslation } from "react-i18next";

export default function EsPage(props) {
  const { i18n } = useTranslation();

  useEffect(() => {
    if (i18n.language !== "es") {
      i18n.changeLanguage("es");
      localStorage.setItem("onepickgame_lang", "es");
    }
  }, [i18n]);

  return (
    <>
      <Helmet>
        <title>One Pick Game - Sitio de Juegos de Brackets</title>
        <meta
          name="description"
          content="One Pick Game es un sitio de juegos de brackets. Crea tu propio torneo de eliminatorias y compite con usuarios de todo el mundo."
        />
        <meta property="og:title" content="One Pick Game - Sitio de Juegos de Brackets" />
        <meta property="og:description" content="One Pick Game es un sitio de juegos de brackets. Crea tu propio torneo de eliminatorias y compite con usuarios de todo el mundo." />
        <meta property="og:image" content="https://onepickgame.com/ogimg.png" />
        <meta property="og:url" content="https://onepickgame.com/es" />
      </Helmet>
      <Home {...props} />
    </>
  );
}
