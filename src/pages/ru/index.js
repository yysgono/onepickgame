import React from "react";
import { Helmet } from "react-helmet";

export default function RuPage() {
  return (
    <>
      <Helmet>
        <title>OnePickGame - Брэкеты</title>
        <meta
          name="description"
          content="OnePickGame — это сайт для игры в брэкет. Создавайте свои турниры и играйте с пользователями со всего мира!"
        />
      </Helmet>
      <div>
        <h1>Русская страница.</h1>
        {/* 실제 페이지 컴포넌트 내용 */}
      </div>
    </>
  );
}
