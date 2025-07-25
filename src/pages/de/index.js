import React from "react";
import { Helmet } from "react-helmet";
import Home from "../../components/Home";

export default function DePage(props) {
  return (
    <>
      <Helmet>
        <title>One Pick Game - Bracket-Spielseite</title>
        <meta
          name="description"
          content="One Pick Game ist eine Bracket-Spielseite. Erstelle dein eigenes Turnier und spiele mit Nutzern aus aller Welt!"
        />
        <meta property="og:title" content="One Pick Game - Bracket-Spielseite" />
        <meta property="og:description" content="One Pick Game ist eine Bracket-Spielseite. Erstelle dein eigenes Turnier und spiele mit Nutzern aus aller Welt!" />
        <meta property="og:image" content="https://onepickgame.com/ogimg.png" />
        <meta property="og:url" content="https://onepickgame.com/de" />
      </Helmet>
      <Home {...props} />
    </>
  );
}
