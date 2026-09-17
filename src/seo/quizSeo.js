// Browser-safe quiz SEO helpers.
// IMPORTANT: this is the client-side ESM version.
// CRA/Webpack treats .cjs files as static assets in this project, so React code
// must import this .js module instead of src/seo/quizSeo.cjs.
import COPY from "./quizSeoData.json";

export const LANGS = Object.keys(COPY);
export const SITE_URL = "https://www.onepickgame.com";
export const DEFAULT_QUIZ_LANGUAGE = "ko";
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const OG_LOCALES = {
  ko: "ko_KR",
  en: "en_US",
  ja: "ja_JP",
  zh: "zh_CN",
  es: "es_ES",
  fr: "fr_FR",
  vi: "vi_VN",
  de: "de_DE",
  ru: "ru_RU",
  id: "id_ID",
  pt: "pt_BR",
  hi: "hi_IN",
  tr: "tr_TR",
  th: "th_TH",
  ar: "ar_AR",
  bn: "bn_IN",
};

export function normalizeLanguage(value) {
  return String(value || "").toLowerCase().split(/[-_]/)[0];
}

function translationMap(value) {
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return {};
    }
  }

  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

function plainText(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function localized(map, fallback, lang) {
  const translations = translationMap(map);
  return (
    plainText(translations[lang]) ||
    plainText(translations.en) ||
    plainText(fallback)
  );
}

export function quizLanguages(quiz) {
  const configured = [
    ...(Array.isArray(quiz?.content_languages)
      ? quiz.content_languages
      : []),
    quiz?.original_language,
  ];

  return [...new Set(configured.map(normalizeLanguage))].filter((language) =>
    LANGS.includes(language)
  );
}

export function socialImage(value, origin = SITE_URL) {
  const fallback = `${origin}/ogimg.png`;
  if (!value) return fallback;

  try {
    const url = new URL(String(value), origin);

    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password
    ) {
      return fallback;
    }

    const host = url.hostname
      .toLowerCase()
      .replace(/^www\./, "")
      .replace(/^m\./, "");

    if (["youtube.com", "youtube-nocookie.com", "youtu.be"].includes(host)) {
      const parts = url.pathname.split("/").filter(Boolean);
      const id =
        host === "youtu.be"
          ? parts[0]
          : url.searchParams.get("v") ||
            (["embed", "shorts", "live"].includes(parts[0])
              ? parts[1]
              : "");

      return /^[a-zA-Z0-9_-]{11}$/.test(id || "")
        ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
        : fallback;
    }

    if (/\.(?:mp4|webm|mov|m4v|m3u8|mp3|ogg)$/i.test(url.pathname)) {
      return fallback;
    }

    return url.href;
  } catch {
    return fallback;
  }
}

export function getQuizSeo(language, quiz, origin = SITE_URL) {
  const requested = normalizeLanguage(language);
  const lang = LANGS.includes(requested) ? requested : "en";
  const copy = COPY[lang];
  const name = quiz
    ? localized(quiz.title_translations, quiz.title, lang) || copy.name
    : copy.name;
  const slug = quiz ? `quiz/${encodeURIComponent(quiz.id)}` : "quiz";

  return {
    lang,
    slug,
    name,
    title: quiz
      ? `${name} | ${lang === "ko" ? "원픽게임" : "OnePickGame"}`
      : copy.title,
    description: quiz
      ? localized(quiz.description_translations, quiz.description, lang) ||
        `${name} · ${copy.description}`
      : copy.description,
    image: socialImage(quiz?.thumbnail_url, origin),
    canonical: `${origin}/${lang}/${slug}`,
    languages: quiz ? quizLanguages(quiz) : LANGS,
    locale: OG_LOCALES[lang],
  };
}

export { COPY };
