const { loadSeoTemplate } = require('./seo-template.cjs');
const { getListSeo } = require('./src/seo/listSeo.js');
const COPY = require('./src/seo/tierListSeoData.json');
const LANGS = Object.keys(COPY);
const escape = value => String(value || '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const safeJson = value => JSON.stringify(value).replace(/</g, '\\u003c');
const LOCALES = { en: 'en_US', ko: 'ko_KR', ja: 'ja_JP', zh: 'zh_CN', ru: 'ru_RU', pt: 'pt_BR', es: 'es_ES', fr: 'fr_FR', id: 'id_ID', hi: 'hi_IN', de: 'de_DE', vi: 'vi_VN', ar: 'ar_AR', bn: 'bn_IN', th: 'th_TH', tr: 'tr_TR' };

module.exports = (app, supabase, origin) => {
  app.use(async (req, res, next) => {
    if (String(req.query?.seo || '') !== 'tier-list-list') return next();
    const lang = String(req.query?.lang || 'en').trim().toLowerCase();
    if (!LANGS.includes(lang)) return res.status(400).send('Unsupported language');
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(req.query || {})) {
      if (typeof value === 'string' && !['seo', 'lang'].includes(key)) params.set(key, value);
    }
    const meta = getListSeo('tier-list', lang, params);
    const canonical = `${origin}/${lang}/${meta.slug}`;
    const heading = meta.title.split('|')[0].trim();
    const image = `${origin}/ogimg.png`;
    try {
      let rows = [];
      // Personal or transient filters are rendered by React after auth, never as a public collection.
      if (meta.indexable) {
        let query = supabase.from('tier_lists')
          .select('id,title,title_translations,original_language,updated_at,candidate_count,category').is("deleted_at", null);
        if (meta.category !== 'all') query = query.eq('category', meta.category);
        const sort = params.get('sort');
        if (sort === 'latest') query = query.order('created_at', { ascending: false });
        else if (sort === 'mostCreated') query = query.order('clone_count', { ascending: false }).order('created_at', { ascending: false });
        else query = query.order('like_count', { ascending: false }).order('view_count', { ascending: false }).order('created_at', { ascending: false });
        const { data, error } = await query.limit(60);
        if (error) throw error;
        rows = data || [];
      }
      const links = rows.filter(item => item?.id).map(item => {
        let translations = item.title_translations || {};
        if (typeof translations === 'string') { try { translations = JSON.parse(translations); } catch { translations = {}; } }
        const title = translations?.[lang] || translations?.en || item.title || 'Tier List';
        return `<li><a href="${origin}/${lang}/tier-list/${encodeURIComponent(item.id)}">${escape(title)}</a></li>`;
      }).join('');
      const alternates = meta.indexable ? LANGS.map(language => `<link data-rh="true" rel="alternate" hreflang="${language}" href="${escape(`${origin}/${language}/${meta.slug}`)}">`).join('')
        + `<link data-rh="true" rel="alternate" hreflang="x-default" href="${escape(`${origin}/en/${meta.slug}`)}">` : '';
      const jsonLd = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: meta.title, description: meta.description, url: canonical, inLanguage: lang, isPartOf: { '@type': 'WebSite', name: 'OnePickGame', url: origin } };
      const head = `<title data-rh="true">${escape(meta.title)}</title>
<meta data-rh="true" name="description" content="${escape(meta.description)}">
<meta data-rh="true" name="robots" content="${meta.indexable ? 'index, follow, max-image-preview:large' : 'noindex, follow'}">
<link data-rh="true" rel="canonical" href="${escape(canonical)}">
${alternates}
<meta data-rh="true" property="og:type" content="website">
<meta data-rh="true" property="og:title" content="${escape(meta.title)}">
<meta data-rh="true" property="og:description" content="${escape(meta.description)}">
<meta data-rh="true" property="og:url" content="${escape(canonical)}">
<meta data-rh="true" property="og:site_name" content="OnePickGame">
<meta data-rh="true" property="og:locale" content="${LOCALES[lang]}">
<meta data-rh="true" property="og:image" content="${image}">
<meta data-rh="true" property="og:image:alt" content="${escape(heading)}">
<meta data-rh="true" name="twitter:card" content="summary_large_image">
<meta data-rh="true" name="twitter:title" content="${escape(meta.title)}">
<meta data-rh="true" name="twitter:description" content="${escape(meta.description)}">
<meta data-rh="true" name="twitter:image" content="${image}">
<script data-rh="true" type="application/ld+json">${safeJson(jsonLd)}</script>`;
      const body = `<main id="seo-content" style="max-width:900px;margin:40px auto;padding:24px;font-family:Arial,sans-serif"><h1>${escape(heading)}</h1><p>${escape(meta.description)}</p>${links ? `<ul>${links}</ul>` : ''}</main>`;
      const bootHead = `<style>
.tier-boot-spinner{display:none}
html.tier-booting .tier-seo-content{display:none}
html.tier-booting .tier-boot-spinner{display:flex;align-items:center;justify-content:center;min-height:65vh;background:#fff}
.tier-boot-spinner span{width:42px;height:42px;border:4px solid #dbeafe;border-top-color:#2563eb;border-radius:50%;animation:tier-boot-spin .8s linear infinite}
@keyframes tier-boot-spin{to{transform:rotate(360deg)}}
@media(prefers-reduced-motion:reduce){.tier-boot-spinner span{animation:none}}
</style><script>document.documentElement.classList.add('tier-booting');setTimeout(function(){document.documentElement.classList.remove('tier-booting')},8000);</script>`;
      let html = await loadSeoTemplate(origin);
      html = html.replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, '')
        .replace(/<meta\b[^>]*(?:name|property)=["'](?:description|robots|og:[^"']*|twitter:[^"']*)["'][^>]*>/gi, '')
        .replace(/<link\b[^>]*rel=["'](?:canonical|alternate)["'][^>]*>/gi, '')
        .replace(/<html\b[^>]*>/i, `<html lang="${lang}" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">`);
      const root = /<div\s+id=["']root["']>\s*(?:<div\s+class=["']loading-screen["']>\s*Loading\.\.\.\s*<\/div>\s*)?<\/div>/i;
      if (!root.test(html)) throw new Error('SEO template root missing');
      html = html.replace(root, () => `<div id="root"><div class="tier-seo-content">${body}</div><div class="tier-boot-spinner" role="status" aria-label="Loading"><span aria-hidden="true"></span></div></div>`).replace('</head>', () => `${head}${bootHead}\n</head>`);
      res.setHeader('Cache-Control', meta.indexable ? 'public, s-maxage=300, stale-while-revalidate=3600' : 'no-store');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      if (!meta.indexable) res.setHeader('X-Robots-Tag', 'noindex, follow');
      return res.status(200).send(html);
    } catch (error) {
      console.error('Tier list collection HTML unavailable:', error.message);
      res.setHeader('Cache-Control', 'no-store');
      return res.status(503).send('Tier list page temporarily unavailable');
    }
  });
};
