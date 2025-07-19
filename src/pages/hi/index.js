import React from "react";
import { Helmet } from "react-helmet";
import Home from "../../components/Home";

export default function HiPage(props) {
  return (
    <>
      <Helmet>
        <title>OnePickGame - ब्रैकेट गेम</title>
        <meta
          name="description"
          content="OnePickGame एक ब्रैकेट गेम साइट है। अपनी खुद की टूर्नामेंट ब्रैकेट बनाएं और दुनिया भर के यूज़र्स के साथ खेलें!"
        />
      </Helmet>
      <Home {...props} />
    </>
  );
}
