const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const babel = require('@babel/core');
const { JSDOM } = require('jsdom');
const i18next = require('i18next');
const { injectInitialTranslations, initialTranslationsMiddleware, languageFor } = require('../initial-translations.cjs');
function compile(file, req) {
  const mod = { exports: {} };
  const code = babel.transformSync(fs.readFileSync(file, 'utf8'), {
    presets: [['@babel/preset-env', { targets: { node: 'current' } }]], babelrc: false, configFile: false,
  }).code;
  new Function('require', 'module', 'exports', code)(req, mod, mod.exports);
  return mod.exports;
}
const helper = compile('src/utils/lazyTranslations.js', require);
const languages = Object.keys(require('../src/seo/siteHomeCopy.json'));
const shell = '<!doctype html><html lang="en"><head><title>Keep title</title><link rel="canonical" href="/ko"></head><body><div id="root"><main>Visible server content</main></div></body></html>';
(async () => {
  for (const language of languages) {
    const html = injectInitialTranslations(shell, language);
    const dom = new JSDOM(html, { url: `https://www.onepickgame.com/${language}` });
    Object.assign(global, { window: dom.window, document: dom.window.document });
    assert.equal(document.title, 'Keep title');
    assert.equal(document.querySelector('main').textContent, 'Visible server content');
    assert.equal(document.querySelector('link[rel="canonical"]').getAttribute('href'), '/ko');
    assert.equal(injectInitialTranslations(html, language), html, 'no duplicate initial bundle');
    const instance = i18next.createInstance();
    const reads = [];
    const req = name => {
      if (name === 'i18next') return instance;
      if (name === './utils/lazyTranslations') return helper;
      if (/locales\/[a-z]{2}\/translation.json$/.test(name)) reads.push(name);
      return name.startsWith('.') ? require(path.resolve('src', name)) : require(name);
    };
    const actual = compile('src/i18n.js', req).default;
    assert.equal(actual.language, language);
    assert.deepEqual(reads, ['./locales/en/translation.json'], 'initial non-English bundle must come from HTML, not another request');
    const expected = require(`../src/locales/${language}/translation.json`);
    assert.equal(actual.t('loading'), expected.loading);
    assert.equal(actual.t('create_worldcup'), expected.create_worldcup);
    assert.equal(actual.t('show_more_categories'), require('../src/locales/homeCommentUi.json')[language].show_more_categories);
    await actual.changeLanguage(language);
    assert.equal(reads.length, 1, 'reselecting initial language must not download it');
    dom.window.close();
  }
  const dom = new JSDOM('<div></div>');
  assert.equal(helper.readInitialTranslations(dom.window.document, languages), null);
  dom.window.document.body.innerHTML = '<script id="onepick-initial-translations" type="application/json">broken</script>';
  assert.equal(helper.readInitialTranslations(dom.window.document, languages), null);
  assert.equal(languageFor({ query: { lang: 'ko' }, path: '/server.js' }, shell), 'ko');
  assert.equal(languageFor({ query: { path: 'ja/quiz/create' }, path: '/server.js' }, shell), 'ja');
  assert.equal(languageFor({ query: {}, path: '/fr/blog' }, shell), 'fr');
  assert.equal(languageFor({ query: { lang: '../../other' }, path: '/' }, shell), 'en');
  let sent;
  const response = { getHeader: () => 'application/json', send(value) { sent = value; } };
  initialTranslationsMiddleware({ query: { lang: 'ko' }, path: '/ko' }, response, () => {});
  response.send(JSON.stringify({ html: shell }));
  assert.deepEqual(JSON.parse(sent), { html: shell }, 'JSON APIs must remain untouched');
  const resourcePath = require.resolve('../src/locales/ko/translation.json');
  const saved = require.cache[resourcePath].exports;
  try {
    require.cache[resourcePath].exports = { text: '</script><script>bad</script>\u2028\u2029' };
    const html = injectInitialTranslations(shell, 'ko');
    const parsed = new JSDOM(html);
    assert.equal(parsed.window.document.querySelectorAll('script').length, 1);
    assert.equal(JSON.parse(parsed.window.document.querySelector('script').textContent).messages.text, require.cache[resourcePath].exports.text);
  } finally { require.cache[resourcePath].exports = saved; }

  const instance = i18next.createInstance();
  await instance.init({ lng: 'en', fallbackLng: 'en', resources: { en: { translation: { title: 'English' } } } });
  let jaResolve, koResolve, calls = { ja: 0, ko: 0, fr: 0 }, fail = true;
  const controller = helper.installLazyTranslations(instance, { loadedLanguages: ['en'], loaders: {
    ja: () => { calls.ja++; return new Promise(resolve => { jaResolve = resolve; }); },
    ko: () => { calls.ko++; return new Promise(resolve => { koResolve = resolve; }); },
    fr: () => { calls.fr++; if (fail) throw new Error('offline'); return { title: 'Français' }; },
  } });
  // Simulate supplemental translations registering before the base file loads.
  instance.addResourceBundle('ja', 'translation', { title: 'Component override' }, true, true);
  const old = instance.changeLanguage('ja');
  const duplicate = instance.changeLanguage('ja');
  const latest = instance.changeLanguage('ko');
  await Promise.resolve();
  assert.equal(calls.ja, 1); assert.equal(calls.ko, 1);
  koResolve({ default: { title: '한국어' } }); await latest;
  jaResolve({ title: '日本語', missing: 'Loaded later' }); await Promise.all([old, duplicate]);
  assert.equal(instance.language, 'ko', 'slow obsolete request must not override latest language');
  assert.equal(instance.t('title'), '한국어');
  assert.equal(instance.getFixedT('ja')('title'), 'Component override');
  assert.equal(instance.getFixedT('ja')('missing'), 'Loaded later');
  await instance.changeLanguage('ja'); assert.equal(calls.ja, 1);
  const previousWarn = console.warn; console.warn = () => {};
  try { await instance.changeLanguage('fr'); } finally { console.warn = previousWarn; }
  assert.equal(instance.language, 'ja', 'failed language load must keep a working language');
  fail = false; await instance.changeLanguage('fr'); assert.equal(calls.fr, 2);
  assert.equal(instance.t('title'), 'Français');
  assert(controller.isLoaded('fr'));
  console.log('PASS: 16 initial languages without extra translation request; metadata/server DOM preserved; safe JSON injection; API isolation; deduplication, stale requests, overrides, failure/retry.');
})().catch(error => { console.error(error); process.exitCode = 1; });
