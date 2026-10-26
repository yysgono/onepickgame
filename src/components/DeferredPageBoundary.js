import React, { Suspense } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

// Only the route body suspends: header, language selection and auth stay mounted.
class PageErrorBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error) { console.error("Page could not be loaded", error); }
  componentDidUpdate(previous) {
    if (this.state.failed && previous.pathname !== this.props.pathname) {
      this.setState({ failed: false });
    }
  }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

export default function DeferredPageBoundary({ children }) {
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const loading = <div role="status" style={{ minHeight: "50vh", display: "grid", placeContent: "center", justifyItems: "center", gap: 12 }}>
    <svg aria-hidden="true" width="38" height="38" viewBox="0 0 40 40" style={{ color: "#5542b8" }}>
      <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" strokeWidth="4" opacity="0.18" />
      <path d="M20 4a16 16 0 0 1 16 16" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round">
        <animateTransform attributeName="transform" type="rotate" from="0 20 20" to="360 20 20" dur="1s" repeatCount="indefinite" />
      </path>
    </svg>
    <span>{t("loading", { defaultValue: "Loading..." })}</span>
  </div>;
  const failure = <div role="alert" style={{ minHeight: "50vh", padding: 24, textAlign: "center", boxSizing: "border-box" }}>
    <p>{t("temporary_error", { defaultValue: "A temporary error occurred. Please try again." })}</p>
    <button type="button" onClick={() => window.location.reload()} style={{ padding: "12px 24px", cursor: "pointer" }}>
      {t("retry", { defaultValue: "Retry" })}
    </button>
  </div>;
  return <PageErrorBoundary pathname={pathname} fallback={failure}>
    <Suspense fallback={loading}>{children}</Suspense>
  </PageErrorBoundary>;
}
