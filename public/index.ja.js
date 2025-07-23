import React from "react";
import { Helmet } from "react-helmet";
import Home from "../../components/Home";

export default function Index(props) {
  return (
    <>
      <Helmet>
        <title>OnePickGame - 理想のタイプワールドカップ</title>
        <meta
          name="description"
          content="理想のタイプワールドカップが作れるOnePickGame。色々なテーマでワールドカップを作成して、世界中のユーザーと楽しもう！"
        />
        <meta property="og:title" content="OnePickGame - 理想のタイプワールドカップ" />
        <meta property="og:description" content="理想のタイプワールドカップが作れるOnePickGame。色々なテーマでワールドカップを作成して、世界中のユーザーと楽しもう！" />
        <meta property="og:image" content="https://onepickgame.com/ogimg.png" />
        <meta property="og:url" content="https://onepickgame.com/ja" />
      </Helmet>
      <Home {...props} />
    </>
  );
}
