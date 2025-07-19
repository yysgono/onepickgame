import React from "react";
import { Helmet } from "react-helmet";
import Home from "../../components/Home";

export default function ViPage(props) {
  return (
    <>
      <Helmet>
        <title>OnePickGame - Trang web trò chơi Bracket</title>
        <meta
          name="description"
          content="OnePickGame là trang web trò chơi bracket. Tạo giải đấu loại trực tiếp của riêng bạn và chơi cùng người dùng trên toàn thế giới!"
        />
        <meta property="og:title" content="OnePickGame - Trang web trò chơi Bracket" />
        <meta property="og:description" content="OnePickGame là trang web trò chơi bracket. Tạo giải đấu loại trực tiếp của riêng bạn và chơi cùng người dùng trên toàn thế giới!" />
        <meta property="og:image" content="https://onepickgame.com/ogimg.png" />
        <meta property="og:url" content="https://onepickgame.com/vi" />
      </Helmet>
      <Home {...props} />
    </>
  );
}
