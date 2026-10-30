import i18n from '../i18n';
const EXTRA_LANGUAGES = new Set(['it', 'pl', 'nl', 'cs']);
export function localizeExtraUi(value, language = i18n.language) {
 const code = String(language || 'en').split(/[-_]/)[0];
 if (!EXTRA_LANGUAGES.has(code)) return value;
 const messages = i18n.getResourceBundle(code, 'translation')?.__uiExtras || {};
 const translate = (item) => {
  if (typeof item === 'string') return messages[item] ?? item;
  if (Array.isArray(item)) return item.map(translate);
  if (item && typeof item === 'object') return Object.fromEntries(Object.entries(item).map(([key, val]) => [key, translate(val)]));
  return item;
 };
 return translate(value);
}
