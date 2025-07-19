import React from "react";
import { Helmet } from "react-helmet";
import Home from "../../components/Home";

export default function KoPage(props) {
  return (
    <>
      <Helmet>
        <title>OnePickGame - 이상형 월드컵</title>
        <meta
          name="description"
          content="이상형 월드컵 사이트 OnePickGame입니다. 다양한 주제의 월드컵 만들기 기능으로 해외 유저들과 함께 즐겨보세요."
        />
      </Helmet>
      <Home {...props} />
    </>
  );
}
