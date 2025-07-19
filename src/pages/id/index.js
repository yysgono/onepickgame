import React from "react";
import { Helmet } from "react-helmet";

export default function IdPage() {
  return (
    <>
      <Helmet>
        <title>OnePickGame - Situs Game Bracket</title>
        <meta
          name="description"
          content="OnePickGame adalah situs game bracket. Buat turnamen bracketmu sendiri dan mainkan bersama pengguna dari seluruh dunia!"
        />
        <meta property="og:title" content="OnePickGame - Situs Game Bracket" />
        <meta property="og:description" content="OnePickGame adalah situs game bracket. Buat turnamen bracketmu sendiri dan mainkan bersama pengguna dari seluruh dunia!" />
        <meta property="og:image" content="https://onepickgame.com/ogimg.png" />
        <meta property="og:url" content="https://onepickgame.com/id" />
      </Helmet>
      {/* Konten halaman */}
    </>
  );
}
