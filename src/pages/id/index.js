import React from "react";
import { Helmet } from "react-helmet";
import Home from "../../components/Home";

export default function IdPage(props) {
  return (
    <>
      <Helmet>
        <title>OnePickGame - Game Bracket</title>
        <meta
          name="description"
          content="OnePickGame adalah situs game bracket. Buat turnamen bracketmu sendiri dan mainkan bersama pengguna dari seluruh dunia!"
        />
      </Helmet>
      <Home {...props} />
    </>
  );
}
