import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// 언어별 번역 파일 불러오기
import translationEN from "./locales/en/translation.json";
import translationKO from "./locales/ko/translation.json";
import translationJA from "./locales/ja/translation.json";
import translationZH from "./locales/zh/translation.json";
import translationHI from "./locales/hi/translation.json";
import translationPT from "./locales/pt/translation.json";
import translationFR from "./locales/fr/translation.json";
import translationRU from "./locales/ru/translation.json";
import translationDE from "./locales/de/translation.json";

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
};

i18n
  .use(LanguageDetector) // 자동으로 브라우저 언어 감지
  .use(initReactI18next) // React에 i18next 연결
  .init({
    resources,
    fallbackLng: "en", // 기본 언어는 영어
    debug: false, // 개발시 true로 설정하면 콘솔에 디버그 메시지 출력됨
    interpolation: {
      escapeValue: false, // React는 기본적으로 XSS 방지
    },
    detection: {
      order: ['querystring', 'cookie', 'localStorage', 'navigator', 'htmlTag', 'path', 'subdomain'],
      caches: ['localStorage', 'cookie'],
    },
  });

export default i18n;
