import React, { useEffect } from "react";
import { Helmet } from "react-helmet";
import Home from "../../components/Home";
import { useTranslation } from "react-i18next";

export default function KoPage(props) {
  const { i18n } = useTranslation();

  useEffect(() => {
    if (i18n.language !== "ko") {
      i18n.changeLanguage("ko");
      localStorage.setItem("onepickgame_lang", "ko");
    }
  }, [i18n]);

  return (
    <>
      <Helmet>
        <title>One Pick Game - 이상형 월드컵 사이트</title>
        <meta
          name="description"
          content="이상형 월드컵 사이트 One Pick Game입니다. 다양한 주제의 월드컵 만들기 기능으로 해외 유저들과 함께 즐겨보세요."
        />
        <meta property="og:title" content="One Pick Game - 이상형 월드컵 사이트" />
        <meta property="og:description" content="이상형 월드컵 사이트 One Pick Game입니다. 다양한 주제의 월드컵 만들기 기능으로 해외 유저들과 함께 즐겨보세요." />
        <meta property="og:image" content="https://onepickgame.com/ogimg.png" />
        <meta property="og:url" content="https://onepickgame.com/ko" />
        {/* ✅ canonical 태그 추가! */}
        <link rel="canonical" href="https://onepickgame.com/ko/" />
      </Helmet>
      <Home {...props} />
    </>
  );
}
