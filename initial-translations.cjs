// Server-only. Static require paths keep these resources in the server deployment,
// without putting every language in the browser's initial JavaScript.
const { translationAsset, languages } = require('./translation-assets.cjs');
const supported = new Set(['en', ...languages]);
function languageFor(req, html) {
  const candidates = [req.query?.lang,
    String(req.query?.path || req.path || '').replace(/^\//, '').split('/')[0],
    /<html\b[^>]*\blang=["']([^"']+)/i.exec(html)?.[1]];
  return candidates.find(value => typeof value === 'string' && supported.has(value)) || 'en';
}
// A blocking classic script runs before CRA's deferred application bundle.
// Its content-hashed URL can be reused across pages without repeating the JSON
// in each dynamic HTML response. English is already in the fallback bundle.
function injectInitialTranslations(html, language) {
  if (!/<\/head>/i.test(html) || /id=["']onepick-initial-translations["']/.test(html)) return html;
  const asset = translationAsset(language);
  if (!asset) return html;
  return html.replace(/<\/head>/i, () => `<script id="onepick-initial-translations" data-language="${language}" src="${asset.url}"></script></head>`);
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
