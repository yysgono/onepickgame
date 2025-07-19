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
      </Helmet>
      <div>
        <h1>日本語ページです。</h1>
        {/* 실제 페이지 컴포넌트 내용 */}
      </div>
    </>
  );
}
