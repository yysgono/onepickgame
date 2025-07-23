import React from "react";
import { Helmet } from "react-helmet";
import Home from "../../components/Home";

export default function Index(props) {
  return (
    <>
      <Helmet>
        <title>OnePickGame - Sitio de Juegos de Brackets</title>
        <meta
          name="description"
          content="OnePickGame es un sitio de juegos de brackets. Crea tu propio torneo de eliminatorias y compite con usuarios de todo el mundo."
        />
        <meta property="og:title" content="OnePickGame - Sitio de Juegos de Brackets" />
        <meta property="og:description" content="OnePickGame es un sitio de juegos de brackets. Crea tu propio torneo de eliminatorias y compite con usuarios de todo el mundo." />
        <meta property="og:image" content="https://onepickgame.com/ogimg.png" />
        <meta property="og:url" content="https://onepickgame.com/es" />
      </Helmet>
      <Home {...props} />
    </>
  );
}
