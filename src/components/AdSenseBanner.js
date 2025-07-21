import React, { useEffect, useRef } from "react";

const AdSenseBanner = ({ adClient, adSlot, style = {}, className = "" }) => {
  const adRef = useRef(null);

  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      // 광고 로딩 실패 시 에러 무시
      console.error("Adsense error:", e);
    }
  }, []);

  return (
    <ins
      className={`adsbygoogle ${className}`}
      style={{ display: "block", ...style }}
      data-ad-client={adClient}
      data-ad-slot={adSlot}
      data-ad-format="auto"
      data-full-width-responsive="true"
      ref={adRef}
    ></ins>
  );
};

export default AdSenseBanner;
