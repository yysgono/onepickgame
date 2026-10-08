const { loadSeoTemplate } = require('./seo-template.cjs');
const { getCategorySeo } = require('./src/seo/categorySeo.js');
const paths = require('./spa-paths.json');
const languages = Object.keys(require('./src/seo/categoryLabels.json'));
const escape = value => String(value || '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const knownPaths = paths.map(path => new RegExp('^' + path.split('/').map(part => part === '*' ? '.*' : part.startsWith(':') ? '[^/]+' : part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('/') + '/?$'));
function isKnownPath(path) {
  path = path.length > 1 ? path.replace(/\/+$/, "") : path;
  if (!knownPaths.some(pattern => pattern.test(path))) return false;
  const first = path.split('/')[1];
  if (paths.some(route => !route.includes(':') && !route.includes('*') && route === path)) return true;
  return first === 'quiz' || languages.includes(first);
}
function cleanHead(html) {
  return html.replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, '')
    .replace(/<meta\b[^>]*(?:name=["'](?:description|robots|twitter:[^"']*)["']|property=["']og:[^"']*["'])[^>]*>/gi, '')
    .replace(/<link\b[^>]*rel=["'](?:canonical|alternate)["'][^>]*>/gi, '');
}
function inject(html, head, body, lang) {
  html = cleanHead(html).replace(/<html\b[^>]*>/i, `<html lang="${escape(lang)}" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">`);
  html = html.replace('</head>', head + '\n</head>');
  const root = /<div\s+id=["']root["']>\s*(?:<div\s+class=["']loading-screen["']>\s*Loading\.\.\.\s*<\/div>\s*)?<\/div>/i;
  if (!root.test(html)) throw new Error('SEO template root missing');
  return html.replace(root, `<div id="root">${body}</div>`);
}
async function notFound(res, origin, lang) {
  const html = await loadSeoTemplate(origin);
  const title = lang === 'ko' ? '페이지를 찾을 수 없습니다' : 'Page not found';
  const home = lang === 'en' ? '/' : `/${lang}`;
  res.setHeader('Cache-Control', 'no-store');
  return res.status(404).send(inject(html, `<title>${title} | OnePickGame</title><meta name="robots" content="noindex, follow">`, `<main style="max-width:800px;margin:60px auto;padding:24px"><h1>404 · ${title}</h1><a href="${home}">${lang === 'ko' ? '홈으로 돌아가기' : 'Back to home'}</a></main>`, lang));
}
module.exports = (app, supabase, origin) => {
  app.use(async (req, res, next) => {
    const type = String(req.query?.seo || '');
    if (type !== 'category' && type !== 'spa') return next();
    const rawPath = '/' + String(req.query.path || '').replace(/^\/+/, '');
    const requestedLang = type === 'category' ? String(req.query.lang || 'en') : rawPath.split('/')[1];
    const lang = languages.includes(requestedLang) ? requestedLang : 'en';
    try {
      if (type === 'spa') {
        if (!isKnownPath(rawPath)) return await notFound(res, origin, lang);
        const html = await loadSeoTemplate(origin);
        res.setHeader('Cache-Control', 'no-store');
        return res.send(html);
      }
      const slug = String(req.query.category || '');
      const meta = getCategorySeo(requestedLang, slug);
      if (!meta) return await notFound(res, origin, lang);
      let query = supabase.from('worldcups').select('id,title,title_translations,original_language').is('deleted_at', null);
      query = meta.key === 'etc' ? query.or('category.eq.etc,category.is.null') : query.eq('category', meta.key);
      const { data, error } = await query.order('created_at', { ascending: false }).limit(60);
      if (error) throw error;
      const canonical = `${origin}/${lang}/${meta.slug}`;
      const image = `${origin}/ogimg.png`;
      const links = (data || []).map(cup => {
        let translations = cup.title_translations || {};
        if (typeof translations === 'string') { try { translations = JSON.parse(translations); } catch { translations = {}; } }
        const title = translations[lang] || translations.en || cup.title || 'World Cup';
        return `<li><a href="${origin}/${lang}/select-round/${encodeURIComponent(cup.id)}">${escape(title)}</a></li>`;
      }).join('');
      const head = `<title>${escape(meta.title)}</title><meta name="description" content="${escape(meta.description)}"><meta name="robots" content="index, follow, max-image-preview:large"><link rel="canonical" href="${canonical}">`
        + languages.map(language => `<link rel="alternate" hreflang="${language}" href="${origin}/${language}/${meta.slug}">`).join('')
        + `<link rel="alternate" hreflang="x-default" href="${origin}/en/${meta.slug}"><meta property="og:type" content="website"><meta property="og:title" content="${escape(meta.title)}"><meta property="og:description" content="${escape(meta.description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${image}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escape(meta.title)}"><meta name="twitter:description" content="${escape(meta.description)}"><meta name="twitter:image" content="${image}">`;
      const body = `<main style="max-width:1000px;margin:32px auto;padding:24px;line-height:1.7"><a href="${lang === 'en' ? '/' : `/${lang}`}">OnePickGame</a><h1>${escape(meta.label)}</h1><p>${escape(meta.description)}</p><ul>${links}</ul></main>`;
      const html = inject(await loadSeoTemplate(origin), head, body, lang);
      res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
      return res.send(html);
    } catch (error) {
      console.error('Category/SPA HTML unavailable:', error.message);
      res.setHeader('Cache-Control', 'no-store');
      return res.status(503).send('Temporarily unavailable');
    }
  });
};
module.exports.isKnownPath = isKnownPath;
