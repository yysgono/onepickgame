import { detectContentLanguage } from "./detectContentLanguage";

export const ORIGINAL_LANGUAGE_NAMES = {
  ko: "한국어", en: "English", ja: "日本語", zh: "简体中文",
  es: "Español", fr: "Français", vi: "Tiếng Việt", de: "Deutsch",
  ru: "Русский", id: "Bahasa Indonesia", pt: "Português", hi: "हिन्दी",
  tr: "Türkçe", th: "ไทย", ar: "العربية", bn: "বাংলা",
};

export function readOriginalTranslationMap(value) {
  if (typeof value === "string") {
    try { value = JSON.parse(value); } catch { return {}; }
  }
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

export function normalizeOriginalLanguage(value) {
  const code = String(value || "").trim().toLowerCase().split(/[-_]/)[0];
  return ORIGINAL_LANGUAGE_NAMES[code] ? code : "";
}

// Never infer existing content's language from the current header or URL.
export function resolveOriginalContentLanguage(content = {}) {
  const stored = normalizeOriginalLanguage(content.tier_labels?._originalLanguage) ||
    normalizeOriginalLanguage(content.original_language);
  if (stored) return stored;

  const title = String(content.title || content.name || "").trim();
  const maps = [readOriginalTranslationMap(content.title_translations),
    readOriginalTranslationMap(content.tier_labels?._titleTranslations)];
  const matching = [...new Set(maps.flatMap((map) => Object.entries(map)
    .filter(([code, value]) => normalizeOriginalLanguage(code) && title && String(value || "").trim() === title)
    .map(([code]) => normalizeOriginalLanguage(code))))];
  if (matching.length === 1) return matching[0];

  const available = (content.content_languages || []).map(normalizeOriginalLanguage).filter(Boolean);
  const fallback = matching[0] || (available.length === 1 ? available[0] : "en");
  return detectContentLanguage(`${title} ${content.description || content.desc || ""}`, fallback);
}

export function originalTitleLabel(uiLanguage, originalLanguage) {
  const labels = {
    ko: "원본 제목", en: "Original title", ja: "元のタイトル", zh: "原始标题",
    es: "Título original", fr: "Titre original", vi: "Tiêu đề gốc", de: "Originaltitel",
    ru: "Исходное название", id: "Judul asli", pt: "Título original", hi: "मूल शीर्षक",
    tr: "Orijinal başlık", th: "ชื่อเรื่องต้นฉบับ", ar: "العنوان الأصلي", bn: "মূল শিরোনাম",
  };
  const code = normalizeOriginalLanguage(originalLanguage) || "en";
  return `${labels[normalizeOriginalLanguage(uiLanguage)] || labels.en} · ${ORIGINAL_LANGUAGE_NAMES[code]} (${code})`;
}
