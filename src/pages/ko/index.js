import React from "react";
import { Helmet } from "react-helmet";

export default function KoPage() {
  return (
    <>
      <Helmet>
        <title>OnePickGame - 이상형 월드컵</title>
        <meta
          name="description"
          content="이상형 월드컵 사이트 OnePickGame입니다. 다양한 주제의 월드컵 만들기 기능으로 해외 유저들과 함께 즐겨보세요."
        />
      </Helmet>
      <div>
        <h1>한국어 페이지입니다.</h1>
        {/* 실제 페이지 컴포넌트 내용 */}
      </div>
    </>
  );
}
