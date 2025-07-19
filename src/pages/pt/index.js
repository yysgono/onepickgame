import React from "react";
import { Helmet } from "react-helmet";
import Home from "../../components/Home";

export default function PtPage(props) {
  return (
    <>
      <Helmet>
        <title>OnePickGame - Jogo de Bracket</title>
        <meta
          name="description"
          content="OnePickGame é um site de jogo de brackets. Crie seu próprio torneio eliminatório e jogue com pessoas do mundo todo!"
        />
      </Helmet>
      <Home {...props} />
    </>
  );
}
