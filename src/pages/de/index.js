import React from "react";
import { Helmet } from "react-helmet";
import Home from "../../components/Home";

export default function DePage(props) {
  return (
    <>
      <Helmet>
        <title>OnePickGame - Bracket-Spiel</title>
        <meta
          name="description"
          content="OnePickGame ist eine Bracket-Spielseite. Erstelle dein eigenes Turnier und spiele mit Nutzern aus aller Welt!"
        />
      </Helmet>
      <Home {...props} />
    </>
  );
}
