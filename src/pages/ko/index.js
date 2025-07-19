import React from "react";
import { Helmet } from "react-helmet";

export default function KoPage() {
  return (
    <>
      <Helmet>
        <title>OnePickGame - 이상형 월드컵 사이트</title>
        <meta
          name="description"
          content="이상형 월드컵 사이트 OnePickGame입니다. 다양한 주제의 월드컵 만들기 기능으로 해외 유저들과 함께 즐겨보세요."
        />
        <meta property="og:title" content="OnePickGame - 이상형 월드컵 사이트" />
        <meta property="og:description" content="이상형 월드컵 사이트 OnePickGame입니다. 다양한 주제의 월드컵 만들기 기능으로 해외 유저들과 함께 즐겨보세요." />
        <meta property="og:image" content="https://onepickgame.com/ogimg.png" />
        <meta property="og:url" content="https://onepickgame.com/ko" />
      </Helmet>
      {/* 실제 페이지 내용 */}
    </>
  );
}
