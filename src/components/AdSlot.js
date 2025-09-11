// src/components/AdSlot.js
import React, { useEffect, useRef } from "react";

/**
 * 통합 광고 슬롯
 * - provider: 'coupang' | 'amazon'
 * - width, height: 숫자(px)
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

    // 렌더링 전 기존 내용 비우기
    if (containerRef.current) containerRef.current.innerHTML = "";

    if (provider === "coupang") {
      renderCoupang();
    } else if (provider === "amazon") {
      // 아직 아마존 연결 전: 플레이스홀더
      renderPlaceholder("Amazon Ads");
    } else {
      renderPlaceholder("Ad");
    }

    // 언마운트 시 정리
    return () => {
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
    // deps: provider/width/height/id가 바뀔 때만 다시 주입
  }, [provider, width, height, id]);

  // -------- helpers --------
  function renderPlaceholder(label) {
    if (!containerRef.current) return;
    const ph = document.createElement("div");
    ph.style.cssText =
      "width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#0f1422;border:1px solid #223355;border-radius:8px;color:#8fa7d9;font-weight:800;";
    ph.textContent = label;
    containerRef.current.appendChild(ph);
  }

  // g.js 로더(전역 싱글톤)
  function loadCoupangLib() {
    if (window.PartnersCoupang) return Promise.resolve();
    if (window.__coupangLoader) return window.__coupangLoader;

    window.__coupangLoader = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://ads-partners.coupang.com/g.js";
      s.async = true;
      s.onload = () => resolve();
      s.onerror = (e) => reject(e);
      document.head.appendChild(s);
    });
    return window.__coupangLoader;
  }

  async function renderCoupang() {
    try {
      if (!containerRef.current) return;

      // 1) 라이브러리 로드 보장
      await loadCoupangLib();

      // 2) 컨테이너 비우고, 그 안에 inline script를 추가
      //    쿠팡 위젯은 script의 "삽입 위치" 기준으로 렌더링됩니다.
      containerRef.current.innerHTML = "";
      const sc = document.createElement("script");
      sc.type = "text/javascript";
      // 배너 생성기 값: id=920431, trackingCode=AF6207831, template="carousel"
      sc.text = `
        try {
          new PartnersCoupang.G({
            "id":"920431",
            "template":"carousel",
            "trackingCode":"AF6207831",
            "width":"${width}",
            "height":"${height}",
            "tsource":""
          });
        } catch (e) {
          console && console.warn && console.warn('Coupang render error', e);
        }
      `;
      containerRef.current.appendChild(sc);
    } catch (e) {
      console.warn("Failed to load Coupang ads:", e);
      renderPlaceholder("Coupang (load failed)");
    }
  }

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
