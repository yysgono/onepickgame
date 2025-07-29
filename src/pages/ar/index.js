import React from "react";
import { Helmet } from "react-helmet";
import Home from "../../components/Home";

export default function ArPage(props) {
  return (
    <>
      <Helmet>
        <title>ون بيك جيم - موقع لعبة البطولة</title>
        <meta
          name="description"
          content="موقع ون بيك جيم للبطولات. أنشئ بطولة خاصة بك، استمتع بالتحديات، وشارك اللعب مع مستخدمين من جميع أنحاء العالم!"
        />
        <meta property="og:title" content="ون بيك جيم - موقع لعبة البطولة" />
        <meta property="og:description" content="موقع ون بيك جيم للبطولات. أنشئ بطولة خاصة بك، استمتع بالتحديات، وشارك اللعب مع مستخدمين من جميع أنحاء العالم!" />
        <meta property="og:image" content="https://onepickgame.com/ogimg.png" />
        <meta property="og:url" content="https://onepickgame.com/ar" />
        {/* RTL 지원: 필요하다면 아래 스타일 추가 */}
        <style>{`body { direction: rtl; }`}</style>
      </Helmet>
      <Home {...props} />
    </>
  );
}
