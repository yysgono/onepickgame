const SUPPORTED_LANGUAGES = new Set([
  "ko", "en", "ja", "zh", "es", "fr", "vi", "ru",
  "de", "th", "bn", "ar", "tr", "pt", "id", "hi",
]);

function countMatches(text, regex) {
  return (String(text || "").match(regex) || []).length;
}

/**
 * Detects languages that have a distinctive writing system.
 * Latin-script languages intentionally fall back to the current UI language,
 * because English/Spanish/French/German/etc. cannot be identified reliably
 * from character ranges alone.
 */
export function detectContentLanguage(text, fallback = "en") {
  const value = String(text || "").trim();
  const safeFallback = SUPPORTED_LANGUAGES.has(fallback) ? fallback : "en";
  if (!value) return safeFallback;

  const scores = {
    ko: countMatches(value, /[\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF]/g),
    ja: countMatches(value, /[\u3040-\u30FF\u31F0-\u31FF]/g),
    zh: countMatches(value, /[\u3400-\u4DBF\u4E00-\u9FFF]/g),
    ar: countMatches(value, /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g),
    ru: countMatches(value, /[\u0400-\u04FF]/g),
    th: countMatches(value, /[\u0E00-\u0E7F]/g),
    hi: countMatches(value, /[\u0900-\u097F]/g),
    bn: countMatches(value, /[\u0980-\u09FF]/g),
  };

  // Kana is a strong Japanese signal even when the title also contains Kanji.
  if (scores.ja > 0) return "ja";

  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [bestLanguage, bestScore] = ranked[0];

  // Require at least two distinctive-script characters to avoid accidental
  // detection from a single symbol/name fragment.
  return bestScore >= 2 ? bestLanguage : safeFallback;
}

export function rekeyBaseTranslation(map, oldLanguage, newLanguage, baseValue) {
  const next = { ...(map || {}) };
  if (oldLanguage && newLanguage && oldLanguage !== newLanguage) {
    delete next[oldLanguage];
  }
  if (newLanguage) next[newLanguage] = String(baseValue || "").trim();
  return next;
}
