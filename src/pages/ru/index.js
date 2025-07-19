import React from "react";
import { Helmet } from "react-helmet";
import Home from "../../components/Home";

export default function RuPage(props) {
  return (
    <>
      <Helmet>
        <title>OnePickGame - Брэкеты</title>
        <meta
          name="description"
          content="OnePickGame — это сайт для игры в брэкет. Создавайте свои турниры и играйте с пользователями со всего мира!"
        />
      </Helmet>
      <Home {...props} />
    </>
  );
}
