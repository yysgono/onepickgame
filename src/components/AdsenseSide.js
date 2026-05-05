// src/components/AdsenseSide.js
import React, { useEffect } from "react";

export default function AdsenseSide() {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {}
  }, []);

  return (
    <ins
      className="adsbygoogle"
      style={{
        display: "block",
        width: "160px",
        height: "600px"
      }}
      data-ad-client="ca-pub-2906270915716379"
      data-ad-slot="2170480333"   // ⭐ 이거 꼭 새로 만든 걸로 바꿔
      data-ad-format="auto"
    />
  );
}