// src/ads/AdGuard.jsx
import React from "react";
import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

/**
 * 특정 경로(정책/약관/제안/공지) 및 관리자 화면에서 Google AdSense를 전부 숨깁니다.
 * - 언어 프리픽스 (/:lang/...) 자동 대응
 * - Auto ads/수동 ads 공통 CSS 차단
 */
export default function AdGuard({ isAdmin = false }) {
  const { pathname } = useLocation();

  // 차단할 경로 패턴 (언어코드 2자)
  const BLOCK_REGEXES = [
    // 개인정보/약관/제안하기
    /^\/[a-z]{2}\/(?:privacy-policy|terms-of-service|suggestions)(?:\/|$)/i,
    // 공지 목록/상세
    /^\/[a-z]{2}\/notice(?:\/.*)?$/i,
    // 관리자 대시보드/통계 (하위 경로 포함)
    /^\/[a-z]{2}\/admin(?:\/.*)?$/i,
    /^\/[a-z]{2}\/admin-stats(?:\/.*)?$/i,
  ];

  const shouldBlock =
    isAdmin || BLOCK_REGEXES.some((re) => re.test(pathname || "/"));

  if (!shouldBlock) return null;

  return (
    <Helmet>
      <style>{`
        /* 대표 AdSense 셀렉터들 전부 숨김 */
        ins.adsbygoogle,
        .adsbygoogle,
        .google-auto-placed,
        [id^="google_ads_iframe_"],
        [id*="google_ads_iframe"],
        iframe[id^="google_ads_iframe_"],
        iframe[src*="googleads"],
        #google_image_div,
        div[data-ad-client],
        div[data-ad-slot] {
          display: none !important;
          visibility: hidden !important;
          width: 0 !important;
          height: 0 !important;
          min-width: 0 !important;
          min-height: 0 !important;
          overflow: hidden !important;
        }
      `}</style>
      {/* 광고만 숨기고, 페이지 자체는 인덱싱 허용 */}
      <meta name="robots" content="index,follow" />
    </Helmet>
  );
}
