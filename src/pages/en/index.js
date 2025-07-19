import React from "react";
import { Helmet } from "react-helmet";
import Home from "../../components/Home";

export default function EnPage(props) {
  return (
    <>
      <Helmet>
        <title>OnePickGame - Bracket Game</title>
        <meta
          name="description"
          content="Bracket game site OnePickGame. Create your own tournament bracket, enjoy fun matchups, and play with users around the world!"
        />
      </Helmet>
      <Home {...props} />
    </>
  );
}
