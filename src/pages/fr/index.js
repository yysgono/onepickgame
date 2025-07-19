import React from "react";
import { Helmet } from "react-helmet";

export default function FrPage() {
  return (
    <>
      <Helmet>
        <title>OnePickGame - Jeu de Brackets</title>
        <meta
          name="description"
          content="OnePickGame est un site de jeux de brackets. Créez votre propre tournoi à élimination directe et jouez avec des utilisateurs du monde entier !"
        />
      </Helmet>
      <div>
        <h1>Page en Français.</h1>
        {/* 실제 페이지 컴포넌트 내용 */}
      </div>
    </>
  );
}
