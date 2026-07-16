import React from "react";
import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

export default function SEOManager() {
  const { pathname } = useLocation();

  // /:lang 또는 /:lang/slug 형태에서 slug 추출
  // 예:
  // /ko                         → ""
  // /ko/blog                    → "blog"
  // /ko/blog/epidemic-sound-review
  //                             → "blog/epidemic-sound-review"
  const match = (pathname || "/").match(
    /^\/([a-z]{2})(?:\/(.*))?$/i
  );

  const slug = (match?.[2] || "").replace(
    /^\/+|\/+$/g,
    ""
  );

  // 색인을 허용하는 정적 경로
  const INDEX_ALLOW = new Set([
    "",                 // /:lang
    "blog",             // /:lang/blog
    "privacy-policy",   // /:lang/privacy-policy
    "terms-of-service", // /:lang/terms-of-service
    "suggestions",      // /:lang/suggestions
    "notice",           // /:lang/notice
  ]);

  // 색인을 허용하는 동적 경로
  const ALLOW_PATTERNS = [
    /^blog\/[^/]+$/,                    // /:lang/blog/:slug
    /^notice\/[^/]+$/,                  // /:lang/notice/:id
    /^select-round\/[^/]+$/,            // /:lang/select-round/:id
    /^result\/[^/]+(?:\/[^/]+)?$/,      // /:lang/result/:id(/:round)
    /^stats\/[^/]+$/,                   // /:lang/stats/:id
  ];

  // 색인에서 제외할 경로
  const NOINDEX_PATTERNS = [
    /^(login|signup|find-(id|pw)|reset-password)(\/|$)/,
    /^(admin|admin-stats)(\/|$)/,
    /^(worldcup-maker|edit-worldcup|manage)(\/|$)/,
    /^(my-worldcups|recent-worldcups)(\/|$)/,
    /^(backup)(\/|$)/,
  ];

  const isExplicitlyNoIndex = NOINDEX_PATTERNS.some(
    (pattern) => pattern.test(slug)
  );

  const isIndexAllowed =
    INDEX_ALLOW.has(slug) ||
    ALLOW_PATTERNS.some((pattern) =>
      pattern.test(slug)
    );

  const shouldNoIndex =
    isExplicitlyNoIndex || !isIndexAllowed;

  if (!shouldNoIndex) {
    return null;
  }

  return (
    <Helmet>
      <meta
        name="robots"
        content="noindex,follow"
      />
    </Helmet>
  );
}