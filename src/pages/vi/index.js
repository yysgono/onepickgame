import React from "react";
import { Helmet } from "react-helmet";

export default function ViPage() {
  return (
    <>
      <Helmet>
        <title>OnePickGame - Trò chơi Bracket</title>
        <meta
          name="description"
          content="OnePickGame là trang web trò chơi bracket. Tạo giải đấu loại trực tiếp của riêng bạn và chơi cùng người dùng trên toàn thế giới!"
        />
      </Helmet>
      <div>
        <h1>Trang Tiếng Việt.</h1>
        {/* 실제 페이지 컴포넌트 내용 */}
      </div>
    </>
  );
}
