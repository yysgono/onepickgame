import React from "react";
import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

export default function SEOManager() {
  const { pathname, search } = useLocation();

  // /:lang 또는 /:lang/slug에서 slug 추출
  // /ko                    -> ""
  // /ko/blog               -> "blog"
  // /ko/quiz/abc           -> "quiz/abc"
  const match = (pathname || "/").match(
    /^\/([a-z]{2})(?:\/(.*))?$/i
  );

  const slug = (match?.[2] || "").replace(
    /^\/+|\/+$/g,
    ""
  );

  // 색인을 허용하는 정적 경로
  const INDEX_ALLOW = new Set([
    "",
    "blog",
    "worldcup-maker",
    "privacy-policy",
    "terms-of-service",
    "suggestions",
    "notice",
    "tier-list",
    "tier-list/create",
    "quiz",
  ]);

  // 색인을 허용하는 동적 경로
  const ALLOW_PATTERNS = [
    /^blog\/[^/]+$/,
    /^notice\/[^/]+$/,
    /^select-round\/[^/]+$/,
    /^result\/[^/]+(?:\/[^/]+)?$/,
    /^stats\/[^/]+$/,
    /^tier-list\/(?!create(?:\/|$))[^/]+$/,
    /^quiz\/(?!create(?:\/|$))[^/]+$/,
  ];

  // 색인에서 제외할 경로
  const NOINDEX_PATTERNS = [
    /^(login|signup|find-(id|pw)|reset-password)(\/|$)/,
    /^(admin|admin-stats)(\/|$)/,
    /^(edit-worldcup|manage)(\/|$)/,
    /^(my-worldcups|recent-worldcups)(\/|$)/,
    /^(backup)(\/|$)/,
    /^quiz\/create(\/|$)/,
  ];

  const isExplicitlyNoIndex = NOINDEX_PATTERNS.some(
    (pattern) => pattern.test(slug)
  );

  const isIndexAllowed =
    INDEX_ALLOW.has(slug) ||
    ALLOW_PATTERNS.some((pattern) => pattern.test(slug));

  const searchParams = new URLSearchParams(search || "");

  const isTierEditOrClone =
    slug === "tier-list/create" &&
    (searchParams.has("edit") || searchParams.has("clone"));

  const shouldNoIndex =
    isExplicitlyNoIndex ||
    isTierEditOrClone ||
    !isIndexAllowed;

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