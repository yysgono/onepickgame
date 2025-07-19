import React from "react";
import { Helmet } from "react-helmet";

export default function EsPage() {
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
      </Helmet>
      {/* Contenido de la página */}
    </>
  );
}
