// Public metadata only: never select questions, answers or participant records.
const { COPY, LANGS, UUID, DEFAULT_QUIZ_LANGUAGE, getQuizSeo, quizLanguages, localized } = require('./src/seo/quizSeo.cjs');
const { loadSeoTemplate } = require('./seo-template.cjs');
const fields = 'id,title,title_translations,description,description_translations,original_language,content_languages,thumbnail_url';
const esc = (s = '') => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const safeJson = value => JSON.stringify(value).replace(/</g, '\\u003c');
const PUBLIC_CACHE = 'public, max-age=0, s-maxage=300, stale-while-revalidate=600';

function renderHtml(template, seo, body, indexable = true) {
  // Match quoted and minified attributes; retain verification/AdSense/asset tags.
  let html = template.replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, '')
    .replace(/<meta\b[^>]*(?:name|property)\s*=\s*(?:["'](?:description|robots|og:[^"']*|twitter:[^"']*)["']|(?:description|robots|og:[^\s>]+|twitter:[^\s>]+)(?=[\s/>]))[^>]*>/gi, '')
    .replace(/<link\b[^>]*rel\s*=\s*(?:["'](?:canonical|alternate)["']|(?:canonical|alternate)(?=[\s/>]))[^>]*>/gi, '')
    .replace(/<html\b[^>]*>/i, '<html lang="' + seo.lang + '" dir="' + (seo.lang === 'ar' ? 'rtl' : 'ltr') + '">');
  const meta = (attribute, key, value) => '<meta data-rh="true" ' + attribute + '="' + key + '" content="' + esc(value) + '">';
  const jsonLd = { '@context': 'https://schema.org', '@type': 'WebPage', name: seo.title, description: seo.description, url: seo.canonical, inLanguage: seo.lang, isPartOf: { '@type': 'WebSite', name: 'OnePickGame', url: new URL(seo.canonical).origin } };
  const head = [
    '<title data-rh="true">' + esc(seo.title) + '</title>',
    meta('name', 'description', seo.description),
    meta('name', 'robots', indexable ? 'index,follow,max-image-preview:large' : 'noindex,follow'),
    '<link data-rh="true" rel="canonical" href="' + esc(seo.canonical) + '">',
    ...(indexable ? seo.languages.map(l => '<link data-rh="true" rel="alternate" hreflang="' + l + '" href="' + esc(new URL('/' + l + '/' + seo.slug, seo.canonical).href) + '">') : []),
    ...(indexable && seo.languages.includes('en') ? ['<link data-rh="true" rel="alternate" hreflang="x-default" href="' + esc(new URL('/en/' + seo.slug, seo.canonical).href) + '">'] : []),
    ...Object.entries({ title: seo.title, description: seo.description, url: seo.canonical, type: 'website', site_name: 'OnePickGame', locale: seo.locale, image: seo.image, 'image:alt': seo.name }).map(([k, v]) => meta('property', 'og:' + k, v)),
    ...Object.entries({ card: 'summary_large_image', title: seo.title, description: seo.description, image: seo.image, 'image:alt': seo.name }).map(([k, v]) => meta('name', 'twitter:' + k, v)),
    '<script data-rh="true" type="application/ld+json">' + safeJson(jsonLd) + '</script>',
  ].join('\n');
  const rootPattern = /<div\s+id=["']?root["']?\s*>\s*<div\s+class=["']?loading-screen["']?\s*>\s*Loading\.\.\.\s*<\/div>\s*<\/div>/i;
  const emptyRootPattern = /<div\s+id=["']?root["']?\s*>\s*<\/div>/i;
  const root = () => '<div id="root">' + body + '</div>';
  if (rootPattern.test(html)) html = html.replace(rootPattern, root);
  else if (emptyRootPattern.test(html)) html = html.replace(emptyRootPattern, root);
  else throw new Error('Unexpected SPA root; refusing to serve another page as quiz HTML');
  return html.replace(/<\/head>/i, () => head + '\n</head>');
}

module.exports = function installQuizSeo(app, db, origin, options = {}) {
  const templateLoader = options.loadTemplate || (() => loadSeoTemplate(origin));

  async function sitemap(req, res) {
    try {
      const urls = new Set(LANGS.map(l => origin + '/' + l + '/quiz'));
      for (let from = 0; ; from += 1000) {
        const { data, error } = await db.from('quizzes')
          .select('id,original_language,content_languages').eq('is_published', true)
          .order('id').range(from, from + 999);
        if (error) throw error;
        for (const q of data || []) if (UUID.test(q.id)) {
          for (const l of quizLanguages(q)) urls.add(origin + '/' + l + '/quiz/' + q.id);
        }
        if (urls.size > 50000) throw new Error('Quiz sitemap exceeds 50000 URLs; split before publishing');
        if (!data || data.length < 1000) break;
      }
      const xml = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + [...urls].map(u => '<url><loc>' + esc(u) + '</loc></url>').join('') + '</urlset>';
      res.set('Cache-Control', PUBLIC_CACHE).type('application/xml').send(xml);
    } catch (error) {
      console.error('Quiz sitemap failed:', error.message);
      res.set('Cache-Control', 'no-store').status(503).send('Quiz sitemap temporarily unavailable');
    }
  }

  app.get(['/api/sitemap-quizzes', '/sitemap-quizzes.xml'], sitemap);
  app.use(async (req, res, next) => {
    if (!['GET', 'HEAD'].includes(req.method)) return next();
    if (req.query?.seo === 'quiz-sitemap') return sitemap(req, res);
    const path = req.path || '';
    const legacy = path.match(/^\/quiz(?:\/(.*))?\/?$/);
    if (legacy) {
      const suffix = legacy[1] ? '/' + legacy[1].replace(/\/+$/, '') : '';
      const query = new URL(req.originalUrl, origin).search;
      return res.redirect(308, '/' + DEFAULT_QUIZ_LANGUAGE + '/quiz' + suffix + query);
    }
    const route = path.match(/^\/([a-z]{2})\/quiz(?:\/([^/]+))?\/?$/i);
    const kind = route ? (route[2] === 'create' ? 'quiz-create' : route[2] ? 'quiz-detail' : 'quiz-list') : req.query?.seo;
    if (!['quiz-list', 'quiz-detail', 'quiz-create'].includes(kind)) return next();
    const lang = String(route?.[1] || req.query.lang || 'en').toLowerCase();
    if (!LANGS.includes(lang)) return res.set('Cache-Control', 'no-store').status(404).send('Unsupported language');
    const id = String(route?.[2] || req.query.id || '');
    const detail = kind === 'quiz-detail';
    const creator = kind === 'quiz-create';
    if (detail && !UUID.test(id)) return res.set('Cache-Control', 'no-store').status(404).send('Quiz not found');
    try {
      let data = null;
      if (!creator) {
        let query = db.from('quizzes').select(fields).eq('is_published', true);
        query = detail ? query.eq('id', id).maybeSingle() : query.contains('content_languages', [lang]).order('play_count', { ascending: false }).order('id').limit(60);
        const result = await query;
        if (result.error) throw result.error;
        data = result.data;
        if (detail && !data) return res.set('Cache-Control', 'no-store').status(404).send('Quiz not found');
      }
      const seo = getQuizSeo(lang, detail ? data : undefined, origin);
      if (creator) { seo.slug = 'quiz/create'; seo.canonical = origin + '/' + lang + '/quiz/create'; }
      const indexable = !creator && (!detail || seo.languages.includes(lang));
      const links = detail || creator
        ? '<a href="' + origin + '/' + lang + '/quiz">' + esc(COPY[lang].name) + '</a>'
        : '<ul>' + (data || []).map(q => '<li><a href="' + origin + '/' + lang + '/quiz/' + encodeURIComponent(q.id) + '">' + esc(localized(q.title_translations, q.title, lang)) + '</a></li>').join('') + '</ul>';
      const body = '<main><h1>' + esc(seo.name) + '</h1><p>' + esc(seo.description) + '</p>' + links + '</main>';
      const html = renderHtml(await templateLoader(), seo, body, indexable);
      res.set('Cache-Control', creator ? 'no-store' : PUBLIC_CACHE);
      res.type('html').send(html);
    } catch (error) {
      console.error('Quiz SEO failed:', error.message);
      res.set('Cache-Control', 'no-store').status(503).send('Quiz temporarily unavailable');
    }
  });
};
module.exports.renderHtml = renderHtml;
