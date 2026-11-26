// src/index.js
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { translationsReady } from "./i18n";
import "./styles/light-theme.css";

// ⬇️ 추가
import { HelmetProvider } from "react-helmet-async";

function renderApp() {
  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(
    <HelmetProvider>
      <App />
    </HelmetProvider>
  );
}
// On a translation download failure the lazy loader retains a working fallback.
translationsReady.then(renderApp, error => {
  console.warn("Initial language setup failed", error);
  renderApp();
});
