// src/ads/AdGuard.jsx
import React from "react";
import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

/**
 * 특정 경로에서는 Google AdSense 요소를 전부 숨깁니다.
 * (헤더/푸터/전역 배치 광고까지 강제 비표시)
 */
export default function AdGuard({ isAdmin = false }) {
  const { pathname } = useLocation();

  // 차단할 경로들 (언어 prefix 포함)
  const blockedStartsWith = [
    "/en/suggestions",      // 제안하기
    "/ko/suggestions",
    "/ja/suggestions",
    "/zh/suggestions",
    "/ru/suggestions",
    "/pt/suggestions",
    "/es/suggestions",
    "/fr/suggestions",
    "/id/suggestions",
    "/hi/suggestions",
    "/de/suggestions",
    "/vi/suggestions",
    "/ar/suggestions",
    "/bn/suggestions",
    "/th/suggestions",
    "/tr/suggestions",

    "/en/privacy-policy",   // 개인정보방침
    "/ko/privacy-policy",
    "/ja/privacy-policy",
    "/zh/privacy-policy",
    "/ru/privacy-policy",
    "/pt/privacy-policy",
    "/es/privacy-policy",
    "/fr/privacy-policy",
    "/id/privacy-policy",
    "/hi/privacy-policy",
    "/de/privacy-policy",
    "/vi/privacy-policy",
    "/ar/privacy-policy",
    "/bn/privacy-policy",
    "/th/privacy-policy",
    "/tr/privacy-policy",

    "/en/terms-of-service", // 이용약관
    "/ko/terms-of-service",
    "/ja/terms-of-service",
    "/zh/terms-of-service",
    "/ru/terms-of-service",
    "/pt/terms-of-service",
    "/es/terms-of-service",
    "/fr/terms-of-service",
    "/id/terms-of-service",
    "/hi/terms-of-service",
    "/de/terms-of-service",
    "/vi/terms-of-service",
    "/ar/terms-of-service",
    "/bn/terms-of-service",
    "/th/terms-of-service",
    "/tr/terms-of-service",

    "/en/admin",            // 관리자 대시보드
    "/ko/admin",
    "/ja/admin",
    "/zh/admin",
    "/ru/admin",
    "/pt/admin",
    "/es/admin",
    "/fr/admin",
    "/id/admin",
    "/hi/admin",
    "/de/admin",
    "/vi/admin",
    "/ar/admin",
    "/bn/admin",
    "/th/admin",
    "/tr/admin",

    "/en/admin-stats",      // 관리자 통계
    "/ko/admin-stats",
    "/ja/admin-stats",
    "/zh/admin-stats",
    "/ru/admin-stats",
    "/pt/admin-stats",
    "/es/admin-stats",
    "/fr/admin-stats",
    "/id/admin-stats",
    "/hi/admin-stats",
    "/de/admin-stats",
    "/vi/admin-stats",
    "/ar/admin-stats",
    "/bn/admin-stats",
    "/th/admin-stats",
    "/tr/admin-stats",
  ];

  const shouldBlock =
    isAdmin || blockedStartsWith.some((p) => pathname.startsWith(p));

  if (!shouldBlock) return null;

  // AdSense 대표 클래스들 강제 숨김
  return (
    <Helmet>
      <style>{`
        ins.adsbygoogle,
        .adsbygoogle,
        .google-auto-placed,
        iframe[src*="ads"],
        [id^="google_ads_iframe"] {
          display: none !important;
          visibility: hidden !important;
          width: 0 !important;
          height: 0 !important;
          min-width: 0 !important;
          min-height: 0 !important;
        }
      `}</style>
      {/* 선택: 로봇에도 광고 페이지 인덱싱 영향 없도록 */}
      <meta name="robots" content="index,follow" />
    </Helmet>
  );
}
