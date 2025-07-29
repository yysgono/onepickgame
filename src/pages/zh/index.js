import React, { useEffect } from "react";
import { Helmet } from "react-helmet";
import Home from "../../components/Home";
import { useTranslation } from "react-i18next";

export default function ZhPage(props) {
  const { i18n } = useTranslation();

  useEffect(() => {
    if (i18n.language !== "zh") {
      i18n.changeLanguage("zh");
      localStorage.setItem("onepickgame_lang", "zh");
    }
  }, [i18n]);

  return (
    <>
      <Helmet>
        <title>One Pick Game - 理想型世界杯小游戏网站</title>
        <meta
          name="description"
          content="理想型世界杯小游戏网站One Pick Game。创建自己的淘汰赛，与全球用户一起参与有趣的对决！"
        />
        <meta property="og:title" content="One Pick Game - 理想型世界杯小游戏网站" />
        <meta property="og:description" content="理想型世界杯小游戏网站One Pick Game。创建自己的淘汰赛，与全球用户一起参与有趣的对决！" />
        <meta property="og:image" content="https://onepickgame.com/ogimg.png" />
        <meta property="og:url" content="https://onepickgame.com/zh" />
      </Helmet>
      <Home {...props} />
    </>
  );
}
