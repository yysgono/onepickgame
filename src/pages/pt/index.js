import React from "react";
import { Helmet } from "react-helmet";
import Home from "../../components/Home";

export default function PtPage(props) {
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
      </Helmet>
      <Home {...props} />
    </>
  );
}
