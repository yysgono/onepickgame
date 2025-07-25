import React from "react";
import { Helmet } from "react-helmet";
import Home from "../../components/Home";

export default function RuPage(props) {
  return (
    <>
      <Helmet>
        <title>One Pick Game - Брэкеты</title>
        <meta
          name="description"
          content="One Pick Game — это сайт для игры в брэкет. Создавайте свои турниры и играйте с пользователями со всего мира!"
        />
        <meta property="og:title" content="One Pick Game - Брэкеты" />
        <meta property="og:description" content="One Pick Game — это сайт для игры в брэкет. Создавайте свои турниры и играйте с пользователями со всего мира!" />
        <meta property="og:image" content="https://onepickgame.com/ogimg.png" />
        <meta property="og:url" content="https://onepickgame.com/ru" />
      </Helmet>
      <Home {...props} />
    </>
  );
}
