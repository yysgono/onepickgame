import React from "react";
import { Helmet } from "react-helmet";

export default function EsPage() {
  return (
    <>
      <Helmet>
        <title>OnePickGame - Juego de Brackets</title>
        <meta
          name="description"
          content="OnePickGame es un sitio de juegos de brackets. Crea tu propio torneo de eliminatorias y compite con usuarios de todo el mundo."
        />
      </Helmet>
      <div>
        <h1>Página en Español.</h1>
        {/* 실제 페이지 컴포넌트 내용 */}
      </div>
    </>
  );
}
