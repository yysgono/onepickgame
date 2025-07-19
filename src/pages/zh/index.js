import React from "react";
import { Helmet } from "react-helmet";

export default function ZhPage() {
  return (
    <>
      <Helmet>
        <title>OnePickGame - 理想型世界杯小游戏网站</title>
        <meta
          name="description"
          content="理想型世界杯小游戏网站OnePickGame。创建自己的淘汰赛，与全球用户一起参与有趣的对决！"
        />
        <meta property="og:title" content="OnePickGame - 理想型世界杯小游戏网站" />
        <meta property="og:description" content="理想型世界杯小游戏网站OnePickGame。创建自己的淘汰赛，与全球用户一起参与有趣的对决！" />
      </Helmet>
      {/* 页面内容 */}
    </>
  );
}
