// src/components/AdsenseSide.js
import React, { useEffect } from "react";
import { useAdsAllowed } from "../ads/AdExclusionProvider";

export default function AdsenseSide() {
  const adsAllowed = useAdsAllowed();
  useEffect(() => {
    if (!adsAllowed) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {}
  }, [adsAllowed]);

  if (!adsAllowed) return null;

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
