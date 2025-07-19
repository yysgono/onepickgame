import React from "react";
import { Helmet } from "react-helmet";
import Home from "../../components/Home";

export default function ZhPage(props) {
  return (
    <>
      <Helmet>
        <title>OnePickGame - 理想型世界杯小游戏</title>
        <meta
          name="description"
          content="理想型世界杯小游戏网站OnePickGame。创建自己的淘汰赛，与全球用户一起参与有趣的对决！"
        />
      </Helmet>
      <Home {...props} />
    </>
  );
}
