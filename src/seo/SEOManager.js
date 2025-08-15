// src/seo/SEOManager.js
import React from "react";
import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

export default function SEOManager() {
  const { pathname } = useLocation();
  const m = pathname.match(/^\/([a-z]{2})(?:\/(.*))?$/i);
  const slug = (m?.[2] || "").replace(/^\/+|\/+$/g, "");

  // 인덱스 허용(정적)
  const INDEX_ALLOW = new Set([
    "",                 // /:lang (홈)
    "privacy-policy",   // 개인정보처리방침
    "terms-of-service", // 이용약관
    "suggestions",      // 제안 게시판 목록
    "notice",           // 공지 목록
  ]);

  // 인덱스 허용(동적 패턴)
  const ALLOW_PATTERNS = [
    /^notice\/[^/]+$/,                 // /:lang/notice/:id
    /^select-round\/[^/]+$/,           // /:lang/select-round/:id
    /^result\/[^/]+(?:\/[^/]+)?$/,     // /:lang/result/:id(/:round)
    /^stats\/[^/]+$/,                  // /:lang/stats/:id
  ];

  // 인덱스 제외(기능성/개인화/관리)
  const NOINDEX_PATTERNS = [
    /^(login|signup|find-(id|pw)|reset-password)(\/|$)/,
    /^(admin|admin-stats)(\/|$)/,
    /^(worldcup-maker|edit-worldcup|manage)(\/|$)/,
    /^(my-worldcups|recent-worldcups)(\/|$)/,
    /^(backup)(\/|$)/,
  ];

  const isNoIndex = NOINDEX_PATTERNS.some((re) => re.test(slug));
  const isIndexAllowed = INDEX_ALLOW.has(slug) || ALLOW_PATTERNS.some((re) => re.test(slug));
  const shouldNoIndex = isNoIndex || !isIndexAllowed;

  return shouldNoIndex ? (
    <Helmet>
      <meta name="robots" content="noindex,follow" />
    </Helmet>
  ) : null;
}
