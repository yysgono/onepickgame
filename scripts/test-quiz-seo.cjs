// Read-only regression tests. Mock DB only; no production credentials or writes.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const express = require('express');
const { JSDOM } = require('jsdom');
const { pathToFileURL } = require('node:url');
const install = require('../quiz-seo.cjs');
const shared = require('../src/seo/quizSeo.cjs');
const root = path.resolve(__dirname, '..');
const origin = 'https://www.onepickgame.com';
const id = '6b8d552e-ba7e-48d0-aa94-3e84448aa8dc';
const id2 = '631a4968-c367-46d7-980c-754761fd6415';
const row = { id, is_published: true, title: '한국어 제목', title_translations: { ko: '한글 퀴즈', en: 'English quiz', ja: '日本語クイズ' }, description: '한국어 설명', description_translations: { ko: '한글 설명', en: 'English description', ja: '日本語の説明' }, content_languages: ['ko', 'en', 'ja'], original_language: 'ko', thumbnail_url: 'https://youtu.be/dQw4w9WgXcQ' };
const template = fs.readFileSync(path.join(root, 'public/index.html'), 'utf8').replace('</head>', '<script defer src="/static/js/test.js"></script></head>');
const parse = html => new JSDOM(html).window.document;

function mockDb(rows = [row], failure = false) {
  const calls = [];
  return {
    calls,
    from(table) {
      assert.equal(table, 'quizzes');
      const call = { table, filters: [], from: 0, to: Infinity, single: false };
      calls.push(call);
      const query = {
        select(fields) { call.fields = fields; assert.doesNotMatch(fields, /answers|correct_index|user_id|\*/); return this; },
        eq(key, value) { call.filters.push(r => r[key] === value); return this; },
        contains(key, values) { call.filters.push(r => values.every(v => (r[key] || []).includes(v))); return this; },
        order() { return this; },
        limit(value) { call.to = value - 1; return this; },
        range(from, to) { call.from = from; call.to = to; return this; },
        maybeSingle() { call.single = true; return this; },
        then(resolve, reject) {
          const data = rows.filter(r => call.filters.every(fn => fn(r))).slice(call.from, call.to + 1);
          return Promise.resolve({ data: call.single ? data[0] || null : data, error: failure ? new Error('fixture DB failure') : null }).then(resolve, reject);
        },
      };
      return query;
    },
  };
}

async function withApp(t, db, loadTemplate = async () => template) {
  const app = express();
  install(app, db, origin, { loadTemplate });
  app.use((req, res) => res.status(404).send('fallback'));
  const server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  t.after(() => new Promise(resolve => server.close(resolve)));
  return p => fetch('http://127.0.0.1:' + server.address().port + p, { redirect: 'manual' });
}

test('all 16 list locales have distinct, matching HTML/OG/Twitter/canonical metadata', async t => {
  const request = await withApp(t, mockDb());
  assert.equal(shared.LANGS.length, 16);
  for (const lang of shared.LANGS) {
    const response = await request('/' + lang + '/quiz');
    assert.equal(response.status, 200);
    const html = await response.text();
    const d = parse(html);
    const seo = shared.getQuizSeo(lang);
    assert.equal(d.title, seo.title);
    assert.equal(d.documentElement.lang, lang);
    assert.equal(d.querySelector('meta[name=description]').content, seo.description);
    assert.equal(d.querySelector('meta[property="og:title"]').content, seo.title);
    assert.equal(d.querySelector('meta[name="twitter:description"]').content, seo.description);
    assert.equal(d.querySelector('link[rel=canonical]').href, origin + '/' + lang + '/quiz');
    assert.equal(d.querySelectorAll('title').length, 1);
    assert.equal(d.querySelectorAll('link[rel=canonical]').length, 1);
    assert.equal(d.querySelectorAll('meta[name=description]').length, 1);
    assert.equal(d.querySelectorAll('link[rel=alternate]').length, 17);
    assert.equal(d.querySelector('h1').textContent, seo.name);
    assert.ok(d.querySelector('script[src="/static/js/test.js"]'));
    assert.doesNotMatch(html, /Bracket Game|onepick-social\.png|quiz_questions/);
    if (lang !== 'en') assert.notEqual(seo.description, shared.COPY.en.description);
  }
});

test('legacy /quiz and child URLs permanently redirect, keeping query strings', async t => {
  const request = await withApp(t, mockDb());
  for (const suffix of ['', '/', '/' + id, '/create?edit=' + id]) {
    const r = await request('/quiz' + suffix);
    assert.equal(r.status, 308);
    assert.equal(r.headers.get('location'), '/ko/quiz' + (suffix === '/' ? '' : suffix));
  }
});

test('localized details use declared languages, safe image and a real list link', async t => {
  const request = await withApp(t, mockDb());
  for (const lang of ['ko', 'en', 'ja']) {
    const r = await request('/' + lang + '/quiz/' + id);
    assert.equal(r.status, 200);
    const d = parse(await r.text());
    assert.equal(d.title, shared.getQuizSeo(lang, row).title);
    assert.equal(d.querySelector('meta[property="og:image"]').content, 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg');
    assert.equal(d.querySelectorAll('link[rel=alternate]').length, 4);
    assert.equal(d.querySelector('main a').href, origin + '/' + lang + '/quiz');
  }
  const d = parse(await (await request('/fr/quiz/' + id)).text());
  assert.match(d.querySelector('meta[name=robots]').content, /noindex/);
  assert.equal(d.querySelectorAll('link[rel=alternate]').length, 0);
});

test('draft/missing/invalid quizzes are 404; creation is noindex and never queries DB', async t => {
  const db = mockDb([{ ...row, is_published: false }]);
  const request = await withApp(t, db);
  for (const url of ['/ko/quiz/' + id, '/ko/quiz/' + id2, '/ko/quiz/not-a-uuid', '/xx/quiz']) {
    const r = await request(url);
    assert.equal(r.status, 404, url);
  }
  const count = db.calls.length;
  const d = parse(await (await request('/ko/quiz/create?edit=' + id)).text());
  assert.match(d.querySelector('meta[name=robots]').content, /noindex/);
  assert.equal(db.calls.length, count);
});

test('Vercel query routes work; unrelated routes stay untouched', async t => {
  const request = await withApp(t, mockDb());
  const list = parse(await (await request('/server.js?seo=quiz-list&lang=ko')).text());
  assert.equal(list.title, shared.COPY.ko.title);
  assert.equal((await request('/server.js?seo=quiz-detail&lang=ko&id=' + id)).status, 200);
  assert.equal((await request('/ko/tier-list')).status, 404);
  assert.equal((await request('/ko/select-round/' + id)).status, 404);
});

test('sitemap endpoints return only supported published quiz URLs, never drafts/creator/answers', async t => {
  const rows = [row, { ...row, id: id2, is_published: false }, { ...row, id: 'invalid', is_published: true }];
  const request = await withApp(t, mockDb(rows));
  for (const url of ['/sitemap-quizzes.xml', '/api/sitemap-quizzes', '/server.js?seo=quiz-sitemap']) {
    const r = await request(url);
    assert.equal(r.status, 200);
    assert.match(r.headers.get('content-type'), /application\/xml/);
    const xml = await r.text();
    const d = new JSDOM(xml, { contentType: 'application/xml' }).window.document;
    assert.equal(d.querySelectorAll('url').length, 19);
    assert.doesNotMatch(xml, new RegExp(id2 + '|invalid|create|admin|answers'));
  }
});

test('sitemap paginates beyond 1000 records without losing or duplicating rows', async t => {
  const rows = Array.from({ length: 1001 }, (_, i) => ({ ...row, id: String(i).padStart(8, '0') + '-0000-4000-8000-000000000000', content_languages: ['ko', 'ko'] }));
  const db = mockDb(rows);
  const request = await withApp(t, db);
  const xml = await (await request('/sitemap-quizzes.xml')).text();
  assert.equal((xml.match(/<loc>/g) || []).length, 1017);
  assert.deepEqual(db.calls.map(c => c.from), [0, 1000]);
});

test('DB/template failures are noncacheable 503, not indexed empty pages', async t => {
  t.mock.method(console, 'error', () => {});
  const request = await withApp(t, mockDb([row], true));
  for (const url of ['/ko/quiz', '/ko/quiz/' + id, '/sitemap-quizzes.xml']) {
    const r = await request(url);
    assert.equal(r.status, 503);
    assert.equal(r.headers.get('cache-control'), 'no-store');
  }
  const brokenTemplate = await withApp(t, mockDb(), async () => { throw new Error('fixture template failure'); });
  assert.equal((await brokenTemplate('/ko/quiz')).status, 503);
});

test('HTML escaping, JSON-LD and minified template replacement stay safe', () => {
  const seo = shared.getQuizSeo('ko', { ...row, title_translations: { ko: 'Quotes " & $& </script><script>alert(1)</script>' } });
  const minified = '<html lang=en><head><title>OLD</title><meta name=description content="OLD"><meta property=og:title content="OLD"><link rel=canonical href="https://example.com/"><meta name=google-site-verification content="KEEP"><script src="/static/js/main.js"></script></head><body><div id=root></div></body></html>';
  const html = install.renderHtml(minified, seo, '<main>safe</main>');
  const d = parse(html);
  assert.equal(d.title, seo.title);
  assert.equal(d.querySelectorAll('meta[name=description]').length, 1);
  assert.equal(d.querySelector('meta[name=google-site-verification]').content, 'KEEP');
  assert.doesNotMatch(html, /<script>alert/);
  assert.doesNotThrow(() => JSON.parse(d.querySelector('script[type="application/ld+json"]').textContent));
  assert.throws(() => install.renderHtml('<html><head></head><body>unexpected</body></html>', seo, ''), /Unexpected SPA root/);
});

test('social images normalize YouTube variants, reject unsafe/video URLs and keep images', () => {
  const id = 'dQw4w9WgXcQ';
  for (const url of ['https://youtu.be/' + id, 'https://www.youtube.com/watch?v=' + id + '&t=10', 'https://m.youtube.com/shorts/' + id, 'https://youtube-nocookie.com/embed/' + id, 'https://youtube.com/live/' + id]) {
    assert.equal(shared.socialImage(url), 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg');
  }
  for (const url of ['', 'javascript:alert(1)', 'data:text/html,test', 'https://youtube.com/watch?v=invalid', '/movie.mp4?t=4']) assert.equal(shared.socialImage(url), origin + '/ogimg.png');
  assert.equal(shared.socialImage('/default-thumb.png'), origin + '/default-thumb.png');
  assert.equal(shared.localized('{"ja":"日本語"}', 'base', 'ja'), '日本語');
  assert.deepEqual(shared.quizLanguages({ content_languages: ['en-US', 'EN', 'ko', 'xx'] }), ['en', 'ko']);
  assert.deepEqual(shared.quizLanguages({ original_language: 'ja', content_languages: ['en'] }), ['en', 'ja']);
});

test('Vercel rules route quiz forms/details/sitemaps and preserve legacy home/blog/worldcup routing', () => {
  const v = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json')));
  const target = pathname => v.routes.find(r => r.src && new RegExp('^' + r.src + '$').test(pathname))?.dest;
  const alias = v.redirects.find(r => r.source === '/quiz/:path*');
  assert.equal(alias.destination, '/ko/quiz/:path*');
  assert.equal(alias.permanent, true);
  for (const lang of shared.LANGS) {
    assert.match(target('/' + lang + '/quiz'), /seo=quiz-list/);
    assert.match(target('/' + lang + '/quiz/create'), /seo=quiz-create/);
    assert.match(target('/' + lang + '/quiz/' + id), /seo=quiz-detail/);
    assert.match(target('/' + lang), /seo=home/);
    assert.match(target('/' + lang + '/blog'), /seo=blog-list/);
    assert.match(target('/' + lang + '/select-round/' + id), /seo=worldcup/);
  }
  assert.match(target('/sitemap-quizzes.xml'), /seo=quiz-sitemap/);
});

test('canonical sitemap generation preserves cups/tiers without fabricated update dates or private pages', async () => {
  const generator = await import(pathToFileURL(path.join(root, 'scripts/generate-sitemap.mjs')));
  const index = generator.generateSitemapIndex();
  assert.match(index, /\/sitemap-quizzes\.xml/);
  assert.match(index, /\/api\/sitemap-blog/);
  assert.equal((index.match(/<sitemap>/g) || []).length, 18);
  const xml = generator.generateLanguageSitemap('ko', [{ id, created_at: '2000-01-01' }], [{ id: id2, created_at: '2000-01-01' }]);
  assert.match(xml, /\/ko\/select-round\//);
  assert.match(xml, /\/ko\/tier-list\//);
  assert.doesNotMatch(xml, /<lastmod>|\/create|\/admin|\/login|\/backup/);
  const dated = generator.generateLanguageSitemap('ko', [{ id, updated_at: '2026-09-17T01:02:03Z' }], []);
  assert.ok(dated.includes('<lastmod>2026-09-17</lastmod>'));
  assert.equal(fs.readFileSync(path.join(root, 'public/sitemap.xml'), 'utf8'), fs.readFileSync(path.join(root, 'public/sitemap_index-v2.xml'), 'utf8'));
});

function loadJsx(relative) {
  const filename = path.join(root, relative);
  const babel = require('@babel/core');
  const result = babel.transformSync(fs.readFileSync(filename, 'utf8'), { filename, configFile: false, babelrc: false, presets: [require.resolve('@babel/preset-react')], plugins: [require.resolve('@babel/plugin-transform-modules-commonjs')] });
  const instance = new Module(filename, module);
  instance.paths = Module._nodeModulePaths(path.dirname(filename));
  instance._compile(result.code, filename);
  return instance.exports.default;
}

test('actual client Seo component matches the server in all languages', () => {
  const React = require('react');
  const { renderToString } = require('react-dom/server');
  const { HelmetProvider } = require('react-helmet-async');
  const Seo = loadJsx('src/seo/Seo.js');
  for (const lang of shared.LANGS) {
    const seo = shared.getQuizSeo(lang);
    const context = {};
    renderToString(React.createElement(HelmetProvider, { context }, React.createElement(Seo, { lang, slug: seo.slug, title: seo.title, description: seo.description, image: seo.image, hreflangLangs: seo.languages })));
    const d = parse('<html><head>' + context.helmet.title.toString() + context.helmet.meta.toString() + context.helmet.link.toString() + '</head></html>');
    assert.equal(d.title, seo.title);
    assert.equal(d.querySelector('link[rel=canonical]').href, seo.canonical);
    assert.equal(d.querySelector('meta[name=description]').content, seo.description);
    assert.equal(d.querySelector('meta[property="og:image"]').content, seo.image);
  }
});

test('browser quiz SEO uses an ESM .js module instead of importing .cjs as a CRA asset', () => {
  const clientFiles = [
    'src/App.js',
    'src/components/QuizPage.js',
    'src/components/QuizDetailPage.js',
  ];
  for (const relative of clientFiles) {
    const source = fs.readFileSync(path.join(root, relative), 'utf8');
    assert.doesNotMatch(source, /quizSeo\.cjs/, relative + ' must not import quizSeo.cjs in browser code');
  }

  const filename = path.join(root, 'src/seo/quizSeo.js');
  const babel = require('@babel/core');
  const result = babel.transformSync(fs.readFileSync(filename, 'utf8'), {
    filename,
    configFile: false,
    babelrc: false,
    plugins: [require.resolve('@babel/plugin-transform-modules-commonjs')],
  });
  const instance = new Module(filename, module);
  instance.paths = Module._nodeModulePaths(path.dirname(filename));
  instance._compile(result.code, filename);

  assert.equal(typeof instance.exports.getQuizSeo, 'function');
  assert.equal(instance.exports.DEFAULT_QUIZ_LANGUAGE, 'ko');
  assert.match(instance.exports.getQuizSeo('ko').title, /퀴즈/);
});

test('template fetch coalesces concurrent requests and retries after failure', async t => {
  const { loadSeoTemplate } = require('../seo-template.cjs');
  t.mock.method(require('node:fs/promises'), 'readFile', async () => { throw Object.assign(new Error('fixture'), { code: 'ENOENT' }); });
  let calls = 0;
  t.mock.method(global, 'fetch', async () => { calls += 1; return { ok: true, text: async () => template }; });
  const [first, second] = await Promise.all([loadSeoTemplate('https://fixture.example'), loadSeoTemplate('https://fixture.example')]);
  assert.equal(first, second);
  assert.equal(calls, 1);
  global.fetch.mock.mockImplementation(async () => { calls += 1; throw new Error('fixture network failure'); });
  await assert.rejects(loadSeoTemplate('https://failure.example'));
  await assert.rejects(loadSeoTemplate('https://failure.example'));
  assert.equal(calls, 3);
});
