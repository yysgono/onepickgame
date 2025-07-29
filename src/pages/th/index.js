import React from "react";
import { Helmet } from "react-helmet";
import Home from "../../components/Home";

export default function ThPage(props) {
  return (
    <>
      <Helmet>
        <title>One Pick Game - เว็บไซต์เกมจัดสายการแข่งขัน</title>
        <meta
          name="description"
          content="เว็บไซต์เกมจัดสายการแข่งขัน One Pick Game สร้างทัวร์นาเมนต์ของคุณเอง สนุกกับแมตช์สุดมันส์ และเล่นกับผู้ใช้งานทั่วโลก!"
        />
        <meta property="og:title" content="One Pick Game - เว็บไซต์เกมจัดสายการแข่งขัน" />
        <meta property="og:description" content="เว็บไซต์เกมจัดสายการแข่งขัน One Pick Game สร้างทัวร์นาเมนต์ของคุณเอง สนุกกับแมตช์สุดมันส์ และเล่นกับผู้ใช้งานทั่วโลก!" />
        <meta property="og:image" content="https://onepickgame.com/ogimg.png" />
        <meta property="og:url" content="https://onepickgame.com/th" />
      </Helmet>
      <Home {...props} />
    </>
  );
}
