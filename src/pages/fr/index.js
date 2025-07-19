import React from "react";
import { Helmet } from "react-helmet";

export default function FrPage() {
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
      </Helmet>
      {/* Contenu de la page */}
    </>
  );
}
