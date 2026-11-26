// Server/build only. The URL changes whenever a language resource changes.
const { createHash } = require('node:crypto');
const loaders = {
  it: () => require('./src/locales/it/translation.json'),
  pl: () => require('./src/locales/pl/translation.json'),
  nl: () => require('./src/locales/nl/translation.json'),
  cs: () => require('./src/locales/cs/translation.json'),
  ko: () => require('./src/locales/ko/translation.json'),
  ja: () => require('./src/locales/ja/translation.json'),
  zh: () => require('./src/locales/zh/translation.json'),
  es: () => require('./src/locales/es/translation.json'),
  fr: () => require('./src/locales/fr/translation.json'),
  vi: () => require('./src/locales/vi/translation.json'),
  de: () => require('./src/locales/de/translation.json'),
  ru: () => require('./src/locales/ru/translation.json'),
  id: () => require('./src/locales/id/translation.json'),
  pt: () => require('./src/locales/pt/translation.json'),
  hi: () => require('./src/locales/hi/translation.json'),
  tr: () => require('./src/locales/tr/translation.json'),
  th: () => require('./src/locales/th/translation.json'),
  ar: () => require('./src/locales/ar/translation.json'),
  bn: () => require('./src/locales/bn/translation.json'),
};

const cache = new Map();
function translationAsset(language) {
  if (!Object.hasOwn(loaders, language)) return null;
  const messages = loaders[language]();
  const previous = cache.get(language);
  if (previous?.messages === messages) return previous;
  const json = JSON.stringify({ language, messages });
  const literal = JSON.stringify(json).replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  const source = 'globalThis.__onepickInitialTranslations=JSON.parse(' + literal + ');\n';
  const hash = createHash('sha256').update(source).digest('hex').slice(0, 20);
  const asset = { messages, source, url: `/static/initial-translations/${language}.${hash}.js` };
  cache.set(language, asset);
  return asset;
}
module.exports = { translationAsset, languages: Object.keys(loaders) };
