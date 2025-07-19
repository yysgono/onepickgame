import React from "react";
import { Helmet } from "react-helmet";

export default function EnPage() {
  return (
    <>
      <Helmet>
        <title>OnePickGame - Bracket Game</title>
        <meta
          name="description"
          content="Bracket game site OnePickGame. Create your own tournament bracket, enjoy fun matchups, and play with users around the world!"
        />
      </Helmet>
      <div>
        <h1>This is the English page.</h1>
        {/* 실제 페이지 컴포넌트 내용 */}
      </div>
    </>
  );
}
