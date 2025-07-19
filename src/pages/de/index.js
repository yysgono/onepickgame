import React from "react";
import { Helmet } from "react-helmet";

export default function DePage() {
  return (
    <>
      <Helmet>
        <title>OnePickGame - Bracket-Spielseite</title>
        <meta
          name="description"
          content="OnePickGame ist eine Bracket-Spielseite. Erstelle dein eigenes Turnier und spiele mit Nutzern aus aller Welt!"
        />
        <meta property="og:title" content="OnePickGame - Bracket-Spielseite" />
        <meta property="og:description" content="OnePickGame ist eine Bracket-Spielseite. Erstelle dein eigenes Turnier und spiele mit Nutzern aus aller Welt!" />
        <meta property="og:image" content="https://onepickgame.com/ogimg.png" />
        <meta property="og:url" content="https://onepickgame.com/de" />
      </Helmet>
      {/* Seiteninhalt */}
    </>
  );
}
