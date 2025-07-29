import React from "react";
import { Helmet } from "react-helmet";
import Home from "../../components/Home";

export default function TrPage(props) {
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
      </Helmet>
      <Home {...props} />
    </>
  );
}
