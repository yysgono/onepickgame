// src/components/AdSlot.js
import React, { useEffect, useRef } from "react";

/**
 * 통합 광고 슬롯 (안정형)
 * - Coupang: iframe 위젯 방식 (권장)
 * - Amazon: (아직 미연결) 플레이스홀더
 *
 * props:
 *  - id: 고유 DOM id
 *  - provider: 'coupang' | 'amazon'
 *  - width, height: 숫자(px)
 *  - style: 인라인 스타일 추가
 */
export default function AdSlot({
  id = "ad-slot",
  provider = "coupang",
  width = 300,
  height = 250,
  style = {},
}) {
  const ref = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined" || !ref.current) return;

    // 매 렌더마다 깨끗이 비우고 새로 생성
    ref.current.innerHTML = "";

    if (provider === "coupang") {
      // 👉 쿠팡 iframe 위젯 코드 (g.js 불필요, 리액트와 궁합 좋음)
      //   * 아래 3개 값은 본인 계정/배너 값으로 맞춰두세요.
      //     - id:      위젯 ID (예: 920431)
      //     - template: "carousel" (배너 만들기에서 선택한 템플릿)
      //     - trackingCode: 본인 트래킹코드 (예: AF6207831)
      const widgetId = "920431";
      const template = "carousel";
      const trackingCode = "AF6207831";
      const tsource = ""; // 필요시 채널/소스값

      const src = `https://ads-partners.coupang.com/widgets.html?id=${encodeURIComponent(
        widgetId
      )}&template=${encodeURIComponent(
        template
      )}&trackingCode=${encodeURIComponent(
        trackingCode
      )}&tsource=${encodeURIComponent(tsource)}`;

      const ifr = document.createElement("iframe");
      ifr.src = src;
      ifr.width = String(width);
      ifr.height = String(height);
      ifr.setAttribute("frameBorder", "0");
      ifr.setAttribute("scrolling", "no");
      ifr.setAttribute("referrerpolicy", "unsafe-url"); // 쿠팡 기본 코드가 이렇게 내려옵니다.
      ifr.style.border = "0";
      ifr.style.display = "block";
      ifr.style.width = `${width}px`;
      ifr.style.height = `${height}px`;
      ref.current.appendChild(ifr);
    } else if (provider === "amazon") {
      // TODO: 아마존 스폰서드 코드 받으면 여기서 iframe/JS로 교체
      const ph = document.createElement("div");
      ph.style.cssText =
        "width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#f6f8ff;border:1px dashed #bcd;border-radius:8px;color:#556;font-weight:700;";
      ph.textContent = "Amazon Ads (pending)";
      ref.current.appendChild(ph);
    } else {
      const ph = document.createElement("div");
      ph.style.cssText =
        "width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#f5f7fb;border:1px dashed #c9d4ee;border-radius:8px;color:#6c7aa6;font-weight:700;";
      ph.textContent = "Ad";
      ref.current.appendChild(ph);
    }
  }, [provider, width, height]);

  return (
    <div
      id={id}
      ref={ref}
      style={{
        width,
        height,
        overflow: "hidden",
        ...style,
      }}
    />
  );
}
