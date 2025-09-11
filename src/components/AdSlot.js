// src/components/AdSlot.js
import React, { useEffect, useRef } from "react";

/**
 * 통합 광고 슬롯
 * props:
 *  - id: DOM id
 *  - provider: 'coupang' | 'amazon'
 *  - width, height: 숫자(px)
 */
export default function AdSlot({
  id = "ad-slot",
  provider = "coupang",
  width = 300,
  height = 250,
  style = {},
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (provider === "coupang") {
      renderCoupang();
    } else if (provider === "amazon") {
      renderPlaceholder("Amazon Ads");
    } else {
      renderPlaceholder("Ad");
    }

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [provider, width, height, id]);

  // ---------- helpers ----------
  const renderPlaceholder = (label) => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";
    const ph = document.createElement("div");
    ph.style.cssText =
      "width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#f5f7fb;border:1px dashed #c9d4ee;border-radius:8px;color:#6c7aa6;font-weight:700;";
    ph.textContent = label;
    containerRef.current.appendChild(ph);
  };

  // 쿠팡 라이브러리 로더 (전역 싱글톤)
  const loadCoupangLib = () => {
    if (window.PartnersCoupang) return Promise.resolve();
    if (window.__coupangLoader) return window.__coupangLoader;

    window.__coupangLoader = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://ads-partners.coupang.com/g.js";
      s.async = true;
      s.onload = () => {
        // 라이브러리가 전역에 붙을 때까지 체크
        const check = () => {
          if (window.PartnersCoupang) resolve();
          else setTimeout(check, 30);
        };
        check();
      };
      s.onerror = (e) => reject(e);
      document.head.appendChild(s);
    });

    return window.__coupangLoader;
  };

  const renderCoupang = async () => {
    try {
      if (!containerRef.current) return;
      containerRef.current.innerHTML = "";

      // 1) 라이브러리 로드
      await loadCoupangLib();

      // 2) 광고 실행
      new window.PartnersCoupang.G({
        id: "920431",               // 쿠팡 배너 생성기에서 받은 id
        template: "carousel",
        trackingCode: "AF6207831", // 쿠팡 파트너스 trackingCode
        width: String(width),
        height: String(height),
        tsource: "",
        slotId: id,                 // DOM id 지정
      });
    } catch (e) {
      console.warn("Failed to load Coupang ads:", e);
      renderPlaceholder("Coupang (load failed)");
    }
  };

  return (
    <div
      id={id}
      ref={containerRef}
      style={{
        width,
        height,
        overflow: "hidden",
        ...style,
      }}
    />
  );
}
