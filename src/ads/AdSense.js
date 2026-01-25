// src/ads/AdSense.jsx
import React, { useEffect, useRef } from "react";

/**
 * Google AdSense 수동 광고 컴포넌트
 * - index.html에 adsbygoogle.js가 이미 로드되어 있어야 함
 * - 광고가 안 뜨는 페이지는 AdGuard에서 CSS로 차단됨
 */
export default function AdSense({
  slot,
  format = "auto",
  responsive = true,
  style = {},
  className = "",
}) {
  const adRef = useRef(null);

  useEffect(() => {
    if (!adRef.current) return;

    try {
      // 광고 요청
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      // AdSense는 종종 에러를 던지므로 무시
      console.warn("Adsense error", e);
    }
  }, []);

  return (
    <ins
      ref={adRef}
      className={`adsbygoogle ${className}`}
      style={{
        display: "block",
        textAlign: "center",
        margin: "16px auto",
        ...style,
      }}
      data-ad-client="ca-pub-2906270915716379"
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={responsive ? "true" : "false"}
    />
  );
}
