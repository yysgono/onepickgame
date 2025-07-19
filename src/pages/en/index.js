import React from "react";
import { Helmet } from "react-helmet";
import Home from "../../components/Home";

export default function EnPage(props) {
  return (
    <>
      <Helmet>
        <title>OnePickGame - Bracket Game Site</title>
        <meta
          name="description"
          content="Bracket game site OnePickGame. Create your own tournament bracket, enjoy fun matchups, and play with users around the world!"
        />
        <meta property="og:title" content="OnePickGame - Bracket Game Site" />
        <meta property="og:description" content="Bracket game site OnePickGame. Create your own tournament bracket, enjoy fun matchups, and play with users around the world!" />
        <meta property="og:image" content="https://onepickgame.com/ogimg.png" />
        <meta property="og:url" content="https://onepickgame.com/en" />
      </Helmet>
      <Home {...props} />
    </>
  );
}
