import React, { useEffect } from "react";
import { Helmet } from "react-helmet";
import Home from "../../components/Home";
import { useTranslation } from "react-i18next";

export default function RuPage(props) {
  const { i18n } = useTranslation();

  useEffect(() => {
    if (i18n.language !== "ru") {
      i18n.changeLanguage("ru");
      localStorage.setItem("onepickgame_lang", "ru");
    }
  }, [i18n]);

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
        <meta property="og:image" content="https://www.onepickgame.com/ogimg.png" />
        <meta property="og:url" content="https://www.onepickgame.com/ru" />
        {/* ✅ canonical 태그 추가! */}
        <link rel="canonical" href="https://www.onepickgame.com/ru/" />
      </Helmet>
      <Home {...props} />
    </>
  );
}
