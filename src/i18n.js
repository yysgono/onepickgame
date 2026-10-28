import categoryLabels from "./seo/categoryLabels.json";
import homeCommentUi from "./locales/homeCommentUi.json";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import translationEN from "./locales/en/translation.json";
import { readInitialTranslations, installLazyTranslations } from "./utils/lazyTranslations";

const SUPPORTED_LANGS = ["en","ko","ar","bn","de","es","fr","hi","id","ja","pt","ru","th","tr","vi","zh"];
const loaders = {
  ko: () => import("./locales/ko/translation.json"),
  ja: () => import("./locales/ja/translation.json"),
  zh: () => import("./locales/zh/translation.json"),
  hi: () => import("./locales/hi/translation.json"),
  pt: () => import("./locales/pt/translation.json"),
  fr: () => import("./locales/fr/translation.json"),
  ru: () => import("./locales/ru/translation.json"),
  de: () => import("./locales/de/translation.json"),
  vi: () => import("./locales/vi/translation.json"),
  id: () => import("./locales/id/translation.json"),
  tr: () => import("./locales/tr/translation.json"),
  th: () => import("./locales/th/translation.json"),
  ar: () => import("./locales/ar/translation.json"),
  bn: () => import("./locales/bn/translation.json"),
  es: () => import("./locales/es/translation.json"),
};
function prepare(bundle, language) {
  const labels = categoryLabels[language] || {};
  const extra = homeCommentUi[language] || {};
  return { ...bundle,
    category_animals_plants: labels.animals_plants || bundle.category_animals_plants,
    category_travel: labels.travel || bundle.category_travel,
    category_brands: labels.brands || bundle.category_brands,
    show_more_categories: bundle.show_more_categories || extra.show_more_categories,
    comment: { ...bundle.comment,
      loginRequired: bundle.comment?.loginRequired || bundle.comment?.needLogin,
      unknownUser: bundle.comment?.unknownUser || extra.unknownUser,
    },
  };
}
// Non-executable JSON is added by the server per URL, not per user/cookie.
// The initial language therefore needs no extra request before the first render.
const initial = readInitialTranslations(typeof document === "undefined" ? null : document, SUPPORTED_LANGS);
const resources = { en: { translation: prepare(translationEN, "en") } };
if (initial && initial.language !== "en") {
  resources[initial.language] = { translation: prepare(initial.messages, initial.language) };
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    ...(initial ? { lng: initial.language } : {}),
    fallbackLng: "en",
    supportedLngs: SUPPORTED_LANGS, // 목록 밖 언어는 fallback
    load: "languageOnly",           // zh-CN -> zh 처럼 언어만 사용
    nonExplicitSupportedLngs: true, // zh-CN 같은 것도 zh로 매칭

    debug: false,
    interpolation: { escapeValue: false },

    // ✅ URL 경로의 첫 세그먼트( /:lang/... )를 최우선으로 사용
    detection: {
      order: ["path", "querystring", "cookie", "localStorage", "navigator", "htmlTag", "subdomain"],
      lookupFromPathIndex: 0,          // /en/..., /ko/... 에서 첫 세그먼트
      caches: ["cookie"],              // *원하면* localStorage 빼고 cookie만 저장
      cookieMinutes: 60 * 24 * 365,    // 1년 (원하면 조절)
    },

    react: { useSuspense: false },
  });


const lazyLanguages = installLazyTranslations(i18n, { loaders,
  loadedLanguages: Object.keys(resources), prepare,
});
function loadDetectedLanguage() {
  const language = String(i18n.language || "en").split(/[-_]/)[0];
  if (SUPPORTED_LANGS.includes(language) && !lazyLanguages.isLoaded(language)) i18n.changeLanguage(language);
}
if (i18n.isInitialized) loadDetectedLanguage();
else i18n.once("initialized", loadDetectedLanguage);
export default i18n;

