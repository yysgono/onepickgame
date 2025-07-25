import React from "react";
import { Helmet } from "react-helmet";
import Home from "../../components/Home";

export default function KoPage(props) { // ★ props 꼭 받아야 함
  return (
    <>
      <Helmet>
        <title>One Pick Game - 이상형 월드컵 사이트</title>
        <meta
          name="description"
          content="이상형 월드컵 사이트 One Pick Game입니다. 다양한 주제의 월드컵 만들기 기능으로 해외 유저들과 함께 즐겨보세요."
        />
        <meta property="og:title" content="One Pick Game - 이상형 월드컵 사이트" />
        <meta property="og:description" content="이상형 월드컵 사이트 One Pick Game입니다. 다양한 주제의 월드컵 만들기 기능으로 해외 유저들과 함께 즐겨보세요." />
        <meta property="og:image" content="https://onepickgame.com/ogimg.png" />
        <meta property="og:url" content="https://onepickgame.com/ko" />
      </Helmet>
      <Home {...props} /> {/* ★ 이 줄이 꼭 필요! */}
    </>
  );
}
