import React from "react";
import { Helmet } from "react-helmet";

export default function JaPage() {
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
      </Helmet>
      {/* ページの内容 */}
    </>
  );
}
