import React from "react";
import { Helmet } from "react-helmet";

export default function PtPage() {
  return (
    <>
      <Helmet>
        <title>OnePickGame - Jogo de Brackets</title>
        <meta
          name="description"
          content="OnePickGame é um site de jogo de brackets. Crie seu próprio torneio eliminatório e jogue com pessoas do mundo todo!"
        />
        <meta property="og:title" content="OnePickGame - Jogo de Brackets" />
        <meta property="og:description" content="OnePickGame é um site de jogo de brackets. Crie seu próprio torneio eliminatório e jogue com pessoas do mundo todo!" />
      </Helmet>
      {/* Conteúdo da página */}
    </>
  );
}
