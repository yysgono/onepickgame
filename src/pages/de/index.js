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
      </Helmet>
      <div>
        <h1>Deutsche Seite.</h1>
        {/* 실제 페이지 컴포넌트 내용 */}
      </div>
    </>
  );
}
