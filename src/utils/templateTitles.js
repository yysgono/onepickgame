import { readTranslationMap, normalizeLang } from './localization';
export function templateTitle(cup, kind, language, fallback = '') {
  const lang = normalizeLang(language);
  const field = kind === 'tier' ? 'tier_preset_title_translations' : 'top_nine_title_translations';
  const own = readTranslationMap(cup?.[field]);
  const original = readTranslationMap(cup?.title_translations);
  const text = value => typeof value === 'string' ? value.trim() : '';
  return text(own[lang]) || text(own.en) || text(original[lang]) || text(original.en) || text(cup?.title) || fallback;
}
export const TEMPLATE_LANGUAGES = [
 ['en','English'],['ko','한국어'],['ja','日本語'],['zh','简体中文'],['es','Español'],['fr','Français'],['vi','Tiếng Việt'],['de','Deutsch'],['ru','Русский'],['id','Bahasa Indonesia'],['pt','Português'],['hi','हिन्दी'],['tr','Türkçe'],['th','ภาษาไทย'],['ar','العربية'],['bn','বাংলা'],['it','Italiano'],['pl','Polski'],['nl','Nederlands'],['cs','Čeština']
];
