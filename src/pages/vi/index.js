import React from "react";
import { Helmet } from "react-helmet";
import Home from "../../components/Home";

export default function ViPage(props) {
  return (
    <>
      <Helmet>
        <title>OnePickGame - Trò chơi Bracket</title>
        <meta
          name="description"
          content="OnePickGame là trang web trò chơi bracket. Tạo giải đấu loại trực tiếp của riêng bạn và chơi cùng người dùng trên toàn thế giới!"
        />
      </Helmet>
      <Home {...props} />
    </>
  );
}
