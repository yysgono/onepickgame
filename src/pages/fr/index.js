import React from "react";
import { Helmet } from "react-helmet";
import Home from "../../components/Home";

export default function FrPage(props) {
  return (
    <>
      <Helmet>
        <title>OnePickGame - Jeu de Bracket</title>
        <meta
          name="description"
          content="OnePickGame est un site de jeux de brackets. Créez votre propre tournoi à élimination directe et jouez avec des utilisateurs du monde entier !"
        />
      </Helmet>
      <Home {...props} />
    </>
  );
}
