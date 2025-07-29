import React, { useEffect } from "react";
import { Helmet } from "react-helmet";
import Home from "../../components/Home";
import { useTranslation } from "react-i18next";

export default function HiPage(props) {
  const { i18n } = useTranslation();

  useEffect(() => {
    if (i18n.language !== "hi") {
      i18n.changeLanguage("hi");
      localStorage.setItem("onepickgame_lang", "hi");
    }
  }, [i18n]);

  return (
    <>
      <Helmet>
        <title>One Pick Game - ब्रैकेट गेम साइट</title>
        <meta
          name="description"
          content="One Pick Game एक ब्रैकेट गेम साइट है। अपनी खुद की टूर्नामेंट ब्रैकेट बनाएं और दुनिया भर के यूज़र्स के साथ खेलें!"
        />
        <meta property="og:title" content="One Pick Game - ब्रैकेट गेम साइट" />
        <meta property="og:description" content="One Pick Game एक ब्रैकेट गेम साइट है। अपनी खुद की टूर्नामेंट ब्रैकेट बनाएं और दुनिया भर के यूज़र्स के साथ खेलें!" />
        <meta property="og:image" content="https://onepickgame.com/ogimg.png" />
        <meta property="og:url" content="https://onepickgame.com/hi" />
      </Helmet>
      <Home {...props} />
    </>
  );
}
