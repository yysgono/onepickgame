import React from "react";
import { Helmet } from "react-helmet";
import Home from "../../components/Home";

export default function FrPage(props) {
  return (
    <>
      <Helmet>
        <title>OnePickGame - Site de jeux de Brackets</title>
        <meta
          name="description"
          content="OnePickGame est un site de jeux de brackets. Créez votre propre tournoi à élimination directe et jouez avec des utilisateurs du monde entier !"
        />
        <meta property="og:title" content="OnePickGame - Site de jeux de Brackets" />
        <meta property="og:description" content="OnePickGame est un site de jeux de brackets. Créez votre propre tournoi à élimination directe et jouez avec des utilisateurs du monde entier !" />
        <meta property="og:image" content="https://onepickgame.com/ogimg.png" />
        <meta property="og:url" content="https://onepickgame.com/fr" />
      </Helmet>
      <Home {...props} />
    </>
  );
}
