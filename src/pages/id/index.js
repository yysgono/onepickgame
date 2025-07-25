import React from "react";
import { Helmet } from "react-helmet";
import Home from "../../components/Home";

export default function IdPage(props) {
  return (
    <>
      <Helmet>
        <title>One Pick Game - Situs Game Bracket</title>
        <meta
          name="description"
          content="One Pick Game adalah situs game bracket. Buat turnamen bracketmu sendiri dan mainkan bersama pengguna dari seluruh dunia!"
        />
        <meta property="og:title" content="One Pick Game - Situs Game Bracket" />
        <meta property="og:description" content="One Pick Game adalah situs game bracket. Buat turnamen bracketmu sendiri dan mainkan bersama pengguna dari seluruh dunia!" />
        <meta property="og:image" content="https://onepickgame.com/ogimg.png" />
        <meta property="og:url" content="https://onepickgame.com/id" />
      </Helmet>
      <Home {...props} />
    </>
  );
}
