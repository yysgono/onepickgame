import React, { useEffect } from "react";
import { Helmet } from "react-helmet";
import Home from "../../components/Home";
import { useTranslation } from "react-i18next";

export default function TrPage(props) {
  const { i18n } = useTranslation();

  useEffect(() => {
    if (i18n.language !== "tr") {
      i18n.changeLanguage("tr");
      localStorage.setItem("onepickgame_lang", "tr");
    }
  }, [i18n]);

  return (
    <>
      <Helmet>
        <title>One Pick Game - Turnuva Oyun Sitesi</title>
        <meta
          name="description"
          content="Turnuva oyun sitesi One Pick Game. Kendi turnuva tablonuzu oluşturun, eğlenceli eşleşmelerin tadını çıkarın ve dünyanın her yerinden kullanıcılarla oynayın!"
        />
        <meta property="og:title" content="One Pick Game - Turnuva Oyun Sitesi" />
        <meta property="og:description" content="Turnuva oyun sitesi One Pick Game. Kendi turnuva tablonuzu oluşturun, eğlenceli eşleşmelerin tadını çıkarın ve dünyanın her yerinden kullanıcılarla oynayın!" />
        <meta property="og:image" content="https://onepickgame.com/ogimg.png" />
        <meta property="og:url" content="https://onepickgame.com/tr" />
        {/* ✅ canonical 태그 추가! */}
        <link rel="canonical" href="https://onepickgame.com/tr/" />
      </Helmet>
      <Home {...props} />
    </>
  );
}
