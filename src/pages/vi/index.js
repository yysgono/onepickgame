import React, { useEffect } from "react";
import { Helmet } from "react-helmet";
import Home from "../../components/Home";
import { useTranslation } from "react-i18next";

export default function ViPage(props) {
  const { i18n } = useTranslation();

  useEffect(() => {
    if (i18n.language !== "vi") {
      i18n.changeLanguage("vi");
      localStorage.setItem("onepickgame_lang", "vi");
    }
  }, [i18n]);

  return (
    <>
      <Helmet>
        <title>One Pick Game - Trang web trò chơi Bracket</title>
        <meta
          name="description"
          content="One Pick Game là trang web trò chơi bracket. Tạo giải đấu loại trực tiếp của riêng bạn và chơi cùng người dùng trên toàn thế giới!"
        />
        <meta property="og:title" content="One Pick Game - Trang web trò chơi Bracket" />
        <meta property="og:description" content="One Pick Game là trang web trò chơi bracket. Tạo giải đấu loại trực tiếp của riêng bạn và chơi cùng người dùng trên toàn thế giới!" />
        <meta property="og:image" content="https://www.onepickgame.com/ogimg.png" />
        <meta property="og:url" content="https://www.onepickgame.com/vi" />
        {/* ✅ canonical 태그 추가! */}
        <link rel="canonical" href="https://www.onepickgame.com/vi/" />
      </Helmet>
      <Home {...props} />
    </>
  );
}
