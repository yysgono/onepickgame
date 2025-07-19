import React from "react";
import { Helmet } from "react-helmet";
import Home from "../../components/Home";

export default function EsPage(props) {
  return (
    <>
      <Helmet>
        <title>OnePickGame - Juego de Brackets</title>
        <meta
          name="description"
          content="OnePickGame es un sitio de juegos de brackets. Crea tu propio torneo de eliminatorias y compite con usuarios de todo el mundo."
        />
      </Helmet>
      <Home {...props} />
    </>
  );
}
