import React from "react";
import { Helmet } from "react-helmet";
import Home from "../../components/Home";

export default function JaPage(props) {
  return (
    <>
      <Helmet>
        <title>OnePickGame - ワールドカップゲーム</title>
        <meta
          name="description"
          content="理想のタイプワールドカップが作れるOnePickGame。色々なテーマでワールドカップを作成して、世界中のユーザーと楽しもう！"
        />
      </Helmet>
      <Home {...props} />
    </>
  );
}
