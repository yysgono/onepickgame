import React from "react";
import { Helmet } from "react-helmet";

export default function ZhPage() {
  return (
    <>
      <Helmet>
        <title>OnePickGame - 理想型世界杯小游戏</title>
        <meta
          name="description"
          content="理想型世界杯小游戏网站OnePickGame。创建自己的淘汰赛，与全球用户一起参与有趣的对决！"
        />
      </Helmet>
      <div>
        <h1>简体中文页面。</h1>
        {/* 실제 페이지 컴포넌트 내용 */}
      </div>
    </>
  );
}
