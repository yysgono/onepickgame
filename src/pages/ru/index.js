import React from "react";
import { Helmet } from "react-helmet";

export default function RuPage() {
  return (
    <>
      <Helmet>
        <title>OnePickGame - Брэкеты</title>
        <meta
          name="description"
          content="OnePickGame — это сайт для игры в брэкет. Создавайте свои турниры и играйте с пользователями со всего мира!"
        />
        <meta property="og:title" content="OnePickGame - Брэкеты" />
        <meta property="og:description" content="OnePickGame — это сайт для игры в брэкет. Создавайте свои турниры и играйте с пользователями со всего мира!" />
      </Helmet>
      {/* Содержимое страницы */}
    </>
  );
}
