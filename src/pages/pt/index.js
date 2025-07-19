import React from "react";
import { Helmet } from "react-helmet";

export default function PtPage() {
  return (
    <>
      <Helmet>
        <title>OnePickGame - Jogo de Bracket</title>
        <meta
          name="description"
          content="OnePickGame é um site de jogo de brackets. Crie seu próprio torneio eliminatório e jogue com pessoas do mundo todo!"
        />
      </Helmet>
      <div>
        <h1>Página em Português.</h1>
        {/* 실제 페이지 컴포넌트 내용 */}
      </div>
    </>
  );
}
