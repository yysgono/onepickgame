// src/components/AdSlot.js
import React, { useEffect, useRef } from "react";

/**
 * 매우 단순화된 광고 슬롯 컴포넌트
 * - SSR 안전
 * - provider: "amazon" | "coupang"
 * - 중복 스크립트 로딩 방지
 * - 사이즈 박스 보장
 * 실제 광고 SDK 연결 시 이 파일에서 provider별 로더를 확장하세요.
 */
const loaded = {
  amazon: false,
  coupang: false,
};

export default function AdSlot({ id, provider = "amazon", width = 300, height = 250 }) {
  const ref = useRef(null);

  // SSR 가드
  if (typeof window === "undefined") {
    return null;
  }

  useEffect(() => {
    // provider별 스크립트 로딩(예시: 실제 광고 스크립트로 교체)
    async function loadScriptOnce(src, key) {
      if (loaded[key]) return;
      if (document.querySelector(`script[data-ad-${key}]`)) {
        loaded[key] = true;
        return;
      }
      return new Promise((resolve) => {
        const s = document.createElement("script");
        s.src = src;
        s.async = true;
        s.defer = true;
        s.dataset[`ad-${key}`] = "1";
        s.onload = () => {
          loaded[key] = true;
          resolve();
        };
        s.onerror = () => resolve(); // 실패해도 깨지지 않도록
        document.head.appendChild(s);
      });
    }

    // 데모 스크립트: 실제 상용 스크립트로 교체하세요.
    if (provider === "amazon") {
      // e.g., await loadScriptOnce("https://example.com/amazon-ads.js", "amazon");
      loaded.amazon = true; // 데모에선 바로 OK 처리
    } else if (provider === "coupang") {
      // e.g., await loadScriptOnce("https://example.com/coupang-ads.js", "coupang");
      loaded.coupang = true; // 데모에선 바로 OK 처리
    }

    // 슬롯 렌더링 (데모: iframe/placeholder)
    const node = ref.current;
    if (node) {
      // 기존 내용 제거
      while (node.firstChild) node.removeChild(node.firstChild);

      // 실제 광고 SDK가 제공하는 태그 삽입 자리
      // 여기서는 간단히 provider에 따라 내용만 다르게 표시
      const border = "1px solid #e5e7eb";
      const bg = provider === "coupang" ? "#fff8f2" : "#f7fbff";
      const label = provider === "coupang" ? "Coupang Ads" : "Amazon Ads";

      const frame = document.createElement("div");
      frame.style.width = `${width}px`;
      frame.style.height = `${height}px`;
      frame.style.background = bg;
      frame.style.border = border;
      frame.style.borderRadius = "8px";
      frame.style.display = "flex";
      frame.style.alignItems = "center";
      frame.style.justifyContent = "center";
      frame.style.fontSize = "14px";
      frame.style.color = "#374151";
      frame.style.fontWeight = "700";
      frame.style.boxShadow = "0 1px 8px rgba(0,0,0,0.06)";
      frame.textContent = `${label} (${width}×${height})`;

      node.appendChild(frame);
    }

    // cleanup (SDK가 요구하면 detach 작업 추가)
    return () => {
      const node = ref.current;
      if (node) {
        while (node.firstChild) node.removeChild(node.firstChild);
      }
    };
  }, [id, provider, width, height]);

  return (
    <div
      id={id}
      ref={ref}
      style={{
        width,
        height,
        overflow: "hidden",
        display: "block",
      }}
    />
  );
}
