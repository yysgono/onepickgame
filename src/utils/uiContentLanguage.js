const UI_ONLY_LANGUAGES = new Set(['it', 'pl', 'nl', 'cs']);
export function uiContentLanguage(language) {
 return UI_ONLY_LANGUAGES.has(language) ? 'en' : language;
}
