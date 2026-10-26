// Server-only. Static require paths keep these resources in the server deployment,
// without putting every language in the browser's initial JavaScript.
const loaders = {
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
function languageFor(req, html) {
  const candidates = [req.query?.lang,
    String(req.query?.path || req.path || '').replace(/^\//, '').split('/')[0],
    /<html\b[^>]*\blang=["']([^"']+)/i.exec(html)?.[1]];
  return candidates.find(value => typeof value === 'string' && (value === 'en' || Object.hasOwn(loaders, value))) || 'en';
}
function injectInitialTranslations(html, language) {
  // English is bundled as the existing fallback and needs no duplicate HTML copy.
  if (!Object.hasOwn(loaders, language) || !/<\/head>/i.test(html) || /id=["']onepick-initial-translations["']/.test(html)) return html;
  const payload = JSON.stringify({ language, messages: loaders[language]() })
    .replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  return html.replace(/<\/head>/i, () => `<script type="application/json" id="onepick-initial-translations">${payload}</script></head>`);
}
function initialTranslationsMiddleware(req, res, next) {
  const send = res.send;
  res.send = function (body) {
    const contentType = String(this.getHeader('Content-Type') || '');
    if (typeof body === 'string' && (!contentType || /text\/html/i.test(contentType)) && /^\s*(?:<!doctype[^>]*>\s*)?<html\b/i.test(body)) {
      body = injectInitialTranslations(body, languageFor(req, body));
    }
    return send.call(this, body);
  };
  next();
}
module.exports = { injectInitialTranslations, initialTranslationsMiddleware, languageFor };
