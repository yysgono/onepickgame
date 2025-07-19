import React from "react";
import { Helmet } from "react-helmet";

export default function IdPage() {
  return (
    <>
      <Helmet>
        <title>OnePickGame - Situs Game Bracket</title>
        <meta
          name="description"
          content="OnePickGame adalah situs game bracket. Buat turnamen bracketmu sendiri dan mainkan bersama pengguna dari seluruh dunia!"
        />
      </Helmet>
      <div>
        <h1>Halaman Bahasa Indonesia.</h1>
        {/* 실제 페이지 컴포넌트 내용 */}
      </div>
    </>
  );
}
