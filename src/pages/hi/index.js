import React from "react";
import { Helmet } from "react-helmet";

export default function HiPage() {
  return (
    <>
      <Helmet>
        <title>OnePickGame - ब्रैकेट गेम</title>
        <meta
          name="description"
          content="OnePickGame एक ब्रैकेट गेम साइट है। अपनी खुद की टूर्नामेंट ब्रैकेट बनाएं और दुनिया भर के यूज़र्स के साथ खेलें!"
        />
      </Helmet>
      <div>
        <h1>हिंदी पेज।</h1>
        {/* 실제 페이지 컴포넌트 내용 */}
      </div>
    </>
  );
}
