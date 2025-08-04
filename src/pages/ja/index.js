import React, { useEffect } from "react";
import { Helmet } from "react-helmet";
import Home from "../../components/Home";
import { useTranslation } from "react-i18next";

export default function JaPage(props) {
  const { i18n } = useTranslation();

  useEffect(() => {
    if (i18n.language !== "ja") {
      i18n.changeLanguage("ja");
      localStorage.setItem("onepickgame_lang", "ja");
    }
  }, [i18n]);

  return (
    <>
      <Helmet>
        <title>One Pick Game - 理想のタイプワールドカップ</title>
        <meta
          name="description"
          content="理想のタイプワールドカップが作れるOne Pick Game。色々なテーマでワールドカップを作成して、世界中のユーザーと楽しもう！"
        />
        <meta property="og:title" content="One Pick Game - 理想のタイプワールドカップ" />
        <meta property="og:description" content="理想のタイプワールドカップが作れるOne Pick Game。色々なテーマでワールドカップを作成して、世界中のユーザーと楽しもう！" />
        <meta property="og:image" content="https://onepickgame.com/ogimg.png" />
        <meta property="og:url" content="https://onepickgame.com/ja" />
        {/* ✅ canonical 태그 추가! */}
        <link rel="canonical" href="https://onepickgame.com/ja/" />
      </Helmet>
      <Home {...props} />
    </>
  );
}
