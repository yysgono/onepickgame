// Loaded only after the server HTML has had a chance to paint.
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./i18n";
import "./styles/light-theme.css";

// ⬇️ 추가
import { HelmetProvider } from "react-helmet-async";

export function mountApplication() {
const container = document.getElementById("root");
if (!container) throw new Error("Application root missing");
const root = ReactDOM.createRoot(container);
root.render(
  <HelmetProvider>
    <App />
    <FirstCommitMarker container={container} />
  </HelmetProvider>
);

}

function FirstCommitMarker({ container }) {
  React.useLayoutEffect(() => {
    container.dataset.appReady = "true";
    if (window.performance?.mark) window.performance.mark("onepick-app-committed");
  }, [container]);
  return null;
}
