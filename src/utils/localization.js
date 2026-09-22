export const SUPPORTED_LANGS = [
  "en",
  "ko",
  "ja",
  "zh",
  "ru",
  "pt",
  "es",
  "fr",
  "id",
  "hi",
  "de",
  "vi",
  "ar",
  "bn",
  "th",
  "tr",
];

export function normalizeLang(lang) {
  return String(lang || "en").toLowerCase().split("-")[0];
}

export function readTranslationMap(value) {
  if (!value) return {};
  if (typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value !== "string") return {};

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
}

export function getLocalizedField(
  item,
  lang,
  fieldName,
  translationFieldName = `${fieldName}_translations`
) {
  const normalizedLang = normalizeLang(lang);
  const originalLanguage = normalizeLang(item?.original_language || "");
  const originalValue = item?.[fieldName] || "";
  const translations = readTranslationMap(item?.[translationFieldName]);

  if (normalizedLang && originalLanguage && normalizedLang === originalLanguage) {
    return originalValue || translations[normalizedLang] || "";
  }

  return translations[normalizedLang] || originalValue || "";
}

export function getWorldcupTitle(cup, lang) {
  return getLocalizedField(cup, lang, "title", "title_translations");
}

export function getWorldcupDescription(cup, lang) {
  return (
    getLocalizedField(cup, lang, "description", "description_translations") ||
    cup?.desc ||
    ""
  );
}
