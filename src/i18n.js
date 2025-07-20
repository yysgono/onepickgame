// src/i18n.js
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// 각 언어별 번역 JSON 파일 import
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

i18n
  .use(LanguageDetector)        // 브라우저 언어 감지
  .use(initReactI18next)        // react-i18next 초기화
  .init({
    resources,                  // 번역 리소스
    fallbackLng: "en",          // 기본 언어 (영어)
    debug: false,
    interpolation: {
      escapeValue: false,       // React에서 XSS 방지 처리 때문에 false 설정
    },
    detection: {
      order: [
        "querystring",
        "localStorage",
        "cookie",
        "navigator",
        "htmlTag",
        "path",
        "subdomain",
      ],
      caches: ["localStorage", "cookie"], // 언어 설정 저장소
    },
    saveMissing: false,          // 없는 키를 서버에 저장할지 여부 (개발용)
    react: {
      useSuspense: false,        // Suspense 비활성화
    },
  });

export default i18n;
