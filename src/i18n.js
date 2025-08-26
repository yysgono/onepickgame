import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// 번역 리소스 (네가 올린 그대로)
import translationEN from "./locales/en/translation.json";
import translationKO from "./locales/ko/translation.json";
import translationJA from "./locales/ja/translation.json";
import translationZH from "./locales/zh/translation.json";
import translationHI from "./locales/hi/translation.json";
import translationPT from "./locales/pt/translation.json";
import translationFR from "./locales/fr/translation.json";
import translationRU from "./locales/ru/translation.json";
import translationDE from "./locales/de/translation.json";
import translationVI from "./locales/vi/translation.json";
import translationID from "./locales/id/translation.json";
import translationTR from "./locales/tr/translation.json";
import translationTH from "./locales/th/translation.json";
import translationAR from "./locales/ar/translation.json";
import translationBN from "./locales/bn/translation.json";
import translationES from "./locales/es/translation.json";

const resources = {
  en: { translation: translationEN },
  ko: { translation: translationKO },
  ja: { translation: translationJA },
  zh: { translation: translationZH },
  hi: { translation: translationHI },
  pt: { translation: translationPT },
  fr: { translation: translationFR },
  ru: { translation: translationRU },
  de: { translation: translationDE },
  vi: { translation: translationVI },
  tr: { translation: translationTR },
  th: { translation: translationTH },
  ar: { translation: translationAR },
  bn: { translation: translationBN },
  id: { translation: translationID },
  es: { translation: translationES },
};

// 라우터와 정확히 맞추기 위한 지원 언어 목록
const SUPPORTED_LANGS = [
  "en","ko","ar","bn","de","es","fr","hi","id","ja","pt","ru","th","tr","vi","zh",
];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
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

export default i18n;
