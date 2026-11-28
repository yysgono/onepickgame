const { imageOf } = require('./src/seo/worldcupMetadata.js');
const { quizLanguages } = require('./src/seo/quizSeo.cjs');
const { getTierListDetailLanguages } = require('./src/seo/tierDetailSeo.js');
const COPY = require('./src/seo/detailCopy.json');
const LATEST = require('./src/seo/latestGamesCopy.json');
const LATEST_WORLDCUPS = require('./src/seo/recentWorldcupsCopy.json');
const UUID = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const LANGUAGE = new Set(Object.keys(COPY));
const KINDS = {
  worldcup: { table: 'worldcups', path: 'select-round', visibility: true },
  quiz: { table: 'quizzes', path: 'quiz', fields: 'original_language,content_languages,source_worldcup_ids', source: 'source_worldcup_ids' },
  tier: { table: 'tier_lists', path: 'tier-list', fields: 'original_language,tier_labels,source_worldcup_id', source: 'source_worldcup_id', visibility: true },
  nine: { table: 'top_nine_public_boards', path: 'mytop9', fields: 'source_worldcup_ids', source: 'source_worldcup_ids' },
};
const SITEMAPS = {
  worldcup: { file: 'sitemap-worldcups.xml', seo: 'worldcup-sitemap' },
  tier: { file: 'sitemap-tier-lists.xml', seo: 'tier-list-sitemap', fields: 'id,created_at,updated_at,original_language,title_translations,description_translations,tier_labels' },
  nine: { file: 'sitemap-top-nine.xml', seo: 'top-nine-sitemap', fields: 'id,created_at' },
  blog: { file: 'sitemaps/sitemap-blog.xml', seo: 'blog-sitemap', aliases: ['/api/sitemap-blog'], table: 'blog_posts', fields: 'id,language,slug' },
};
// Only read the preview URLs. A full candidate array can be large.
const WORLDCUP_LATEST_FIELDS = 'id,title,title_translations,first_image:data->0->>image,first_url:data->0->>url,second_image:data->1->>image,second_url:data->1->>url';
const SITEMAP_PAGE_SIZE = 500;
const SITEMAP_URL_LIMIT = 50000;
const SITEMAP_CACHE_HEADERS = 'public, max-age=0, s-maxage=300';
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
function map(value) {
  try { return typeof value === 'string' ? JSON.parse(value) || {} : value || {}; }
  catch { return {}; }
}
function label(row, lang) {
  const titles = { ...map(map(row.tier_labels)._titleTranslations), ...map(row.title_translations) };
  return String(titles[lang] || titles.en || row.title || '').trim();
}
function sources(kind, row = {}) {
  const list = kind === 'worldcup' ? [row.id] : kind === 'tier' ? [row.source_worldcup_id || map(row.tier_labels)._sourceWorldcupId] : row.source_worldcup_ids;
  return [...new Set((Array.isArray(list) ? list : []).filter(id => UUID.test(String(id))))].slice(0, 3);
}
function link(kind, row, lang) {
  if (kind === 'quiz' && !quizLanguages(row).includes(lang)) return null;
  if (kind === 'tier' && !getTierListDetailLanguages(row).includes(lang)) return null;
  const title = label(row, lang);
  return title && UUID.test(String(row.id)) ? { href: '/' + lang + '/' + KINDS[kind].path + '/' + row.id, label: title } : null;
}
function latestWorldcupImage(row) {
  for (const value of [row.first_image, row.first_url, row.second_image, row.second_url]) {
    if (typeof value !== 'string' || !/^https?:\/\//i.test(value.trim())) continue;
    try {
      const url = new URL(value);
      if (url.username || url.password || /\.(mp4|webm|mov|m4v|m3u8|mp3|wav|ogg)$/i.test(url.pathname)) continue;
      const host = url.hostname.replace(/^(?:www\.|m\.)/, '');
      if (['youtube.com', 'youtube-nocookie.com', 'youtu.be'].includes(host)) {
        const thumbnail = imageOf({ image: url.href });
        if (thumbnail.startsWith('https://i.ytimg.com/')) return thumbnail;
        continue;
      }
      return url.href;
    } catch { /* Try the next candidate URL. */ }
  }
  return '';
}
function makeCache(now, capacity = 96) {
  const cache = new Map(), pending = new Map();
  return async (key, load) => {
    const entry = cache.get(key);
    if (entry && entry.until > now()) return entry.data;
    if (pending.has(key)) return pending.get(key);
    const work = Promise.resolve().then(load).then(data => {
      cache.delete(key);
      cache.set(key, { data, until: now() + 120000 });
      while (cache.size > capacity) cache.delete(cache.keys().next().value);
      return data;
    }).finally(() => pending.delete(key));
    pending.set(key, work);
    return work;
  };
}
function createDiscovery(client, now = Date.now) {
  const cache = makeCache(now);
  // Some older installations have neither optional visibility field. Probe
  // absent columns only; auth, timeouts and other errors always fail closed.
  const missing = new Map();
  async function readRows(kind, fields, apply, signal) {
    if (!client) throw Error('Public database client unavailable');
    const config = KINDS[kind] || SITEMAPS[kind];
    const absent = missing.get(kind) || new Set();
    const extra = config.visibility ? ['is_public', 'visibility'].filter(name => !absent.has(name)) : [];
    let query = client.from(config.table).select([fields, ...extra].join(','));
    if (kind !== 'nine' && kind !== 'blog') query = query.is('deleted_at', null);
    if (kind === 'quiz') query = query.eq('is_published', true);
    // Exclude non-public rows in the query, before applying the result limit.
    if (extra.includes('is_public')) query = query.or('is_public.is.null,is_public.eq.true');
    if (extra.includes('visibility')) query = query.or('visibility.is.null,visibility.eq.public');
    query = apply(query);
    if (query.abortSignal) query = query.abortSignal(signal);
    const { data, error } = await query;
    if (error) {
      const field = ['42703','PGRST204'].includes(error.code) && extra.find(name => new RegExp('\\b' + name + '\\b').test(error.message || ''));
      if (field) {
        absent.add(field);
        missing.set(kind, absent);
        return readRows(kind, fields, apply, signal);
      }
      throw error;
    }
    if (!Array.isArray(data)) throw Error('Invalid discovery response');
    return data;
  }
  const isPublicRow = row => row && UUID.test(String(row.id)) && row.deleted_at == null &&
    row.is_public !== false && (!row.visibility || row.visibility === 'public') && row.unlisted !== true;
  async function read(kind, fields, apply, signal = AbortSignal.timeout(1800)) {
    return (await readRows(kind, fields, apply, signal)).filter(isPublicRow);
  }
  const fields = (kind, withSources = true) => ['id,title', kind === 'nine' ? '' : 'title_translations', !withSources && kind === 'quiz' ? 'original_language,content_languages' : KINDS[kind].fields].filter(Boolean).join(',');
  const newest = (q, size) => q.order('created_at', { ascending: false, nullsFirst: false }).order('id', { ascending: false }).limit(size);
  function latest(kind, lang, category = 'all') {
    const key = ['latest', kind, kind === 'quiz' ? lang : '', category].join(':');
    const select = kind === 'worldcup' ? WORLDCUP_LATEST_FIELDS : fields(kind,false);
    return cache(key, () => read(kind, select, q => {
      if (category !== 'all') q = q.eq('category', category);
      if (kind === 'quiz') q = q.or('content_languages.cs.{'+lang+'},original_language.eq.'+lang);
      return newest(q, 10);
    })).then(rows => rows.flatMap(row => {
      const item = link(kind,row,lang);
      if (!item) return [];
      const image = kind === 'worldcup' ? latestWorldcupImage(row) : '';
      return [image ? { ...item, image } : item];
    }).slice(0,6));
  }
  async function latestWorldcups(lang, currentId = '') {
    const links = await latest('worldcup', lang);
    return links.filter(item => !item.href.toLowerCase().endsWith('/' + currentId.toLowerCase())).slice(0, 4);
  }
  const jsonSources = new Set();
  async function loadRelated(target, ids) {
    const field = KINDS[target].source;
    if (target === 'worldcup') return read(target,fields(target),q=>q.in('id',ids).limit(3));
    if (!field.endsWith('_ids')) return read(target,fields(target),q=>newest(q.in(field,ids),12));
    if (!jsonSources.has(target)) {
      try {
        return await read(target,fields(target),q=>newest(q.overlaps(field,ids),12));
      } catch (error) {
        // The public board view can expose source arrays as JSONB on older deployments.
        // Array overlaps has no JSONB operator; do not broaden the source filter.
        if (error.code !== '42883' || !/jsonb.*&&|&&.*jsonb/i.test(error.message || '')) throw error;
        jsonSources.add(target);
      }
    }
    const result = await Promise.all(ids.map(id =>
      read(target,fields(target),q=>newest(q.contains(field,JSON.stringify([id])),12))));
    return [...new Map(result.flat().map(item=>[item.id,item])).values()];
  }
  async function related(kind, row, lang) {
    const ids = sources(kind, row).sort();
    if (!ids.length) return [];
    const wrapped = await Promise.allSettled(Object.keys(KINDS).filter(key => key !== kind).map(target =>
      cache(['related', target, ...ids].join(':'), () => loadRelated(target,ids)).then(rows =>
        rows.map(r => link(target,r,lang)).filter(Boolean).slice(0,target === 'worldcup' ? 2 : 1))));
    return wrapped.flatMap(item => item.status === 'fulfilled' ? item.value : []).slice(0,4);
  }
  const current = (kind,id) => cache('current:'+kind+':'+id, () => read(kind, fields(kind), q => q.eq('id',id).limit(1))).then(rows => rows[0]);
  // One XML snapshot per kind/origin, shared across concurrent requests in
  // this instance. The CDN serves most repeats without executing a function.
  const sitemapCache = new Map();
  async function buildSitemap(origin, kind) {
    if (kind === 'worldcup') {
      // Leave the existing recent-worldcup limit and ordering intact.
      const rows = await read('worldcup','id,created_at,updated_at', q => newest(q, 1000));
      return renderWorldcupSitemap(origin,rows);
    }
    const signal = AbortSignal.timeout(6000);
    const blog = kind === 'blog';
    const xml = blog ? blogSitemapWriter(origin) : sitemapWriter(origin, kind);
    let after = null;
    for (;;) {
      const rows = await readRows(kind, SITEMAPS[kind].fields, q => {
        q = q.order('id', { ascending: true }).limit(SITEMAP_PAGE_SIZE);
        return after === null ? q : q.gt('id', after);
      }, signal);
      if (blog) rows.forEach(xml.add);
      else rows.filter(isPublicRow).forEach(xml.add);
      if (rows.length < SITEMAP_PAGE_SIZE) return xml.finish();
      const next = rows[rows.length - 1]?.id;
      const numericId = blog && /^\d+$/.test(String(next));
      if (!numericId && !UUID.test(String(next))) throw Error('Invalid sitemap page cursor');
      if (after !== null && (numericId ? BigInt(next) <= BigInt(after) : String(next) <= String(after))) throw Error('Invalid sitemap page cursor');
      after = next;
    }
  }
  async function sitemap(origin, kind = 'worldcup') {
    if (!Object.hasOwn(SITEMAPS, kind)) throw Error('Unknown sitemap');
    const key = JSON.stringify([origin,kind]);
    let entry = sitemapCache.get(key);
    if (!entry) {
      entry = {};
      sitemapCache.set(key, entry);
    }
    if (entry.xml && entry.expires > now()) return entry.xml;
    if (entry.pending) return entry.pending;
    entry.pending = buildSitemap(origin,kind).then(xml => {
      entry.xml = xml;
      entry.expires = now() + 60000;
      return xml;
    }).finally(() => { entry.pending = null; });
    return entry.pending;
  }
  return {latest,latestWorldcups,related,current,sitemap};
}
function xmlSitemapWriter() {
  const seen = new Set(), items = [];
  return {
    add(url, lastmod = '') {
      if (seen.has(url)) return;
      if (items.length >= SITEMAP_URL_LIMIT) throw Error('Sitemap exceeds 50,000 URLs; split before publishing');
      seen.add(url);
      items.push('<url><loc>' + escape(url) + '</loc>' + lastmod + '</url>');
    },
    finish() {
      return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + items.join('') + '</urlset>';
    },
  };
}
function sitemapWriter(origin, kind) {
  const xml = xmlSitemapWriter();
  function add(row) {
    if (!UUID.test(String(row.id))) return;
    const available = kind === 'tier' ? getTierListDetailLanguages(row) : [];
    const languages = available.length ? available : LANGUAGE;
    const timestamp = [row.updated_at, row.created_at].map(value => Date.parse(value || '')).find(Number.isFinite);
    const lastmod = Number.isFinite(timestamp) ? '<lastmod>' + new Date(timestamp).toISOString() + '</lastmod>' : '';
    for (const lang of languages) xml.add(origin + '/' + lang + '/' + KINDS[kind].path + '/' + row.id, lastmod);
  }
  return {add,finish:xml.finish};
}
function blogSitemapWriter(origin) {
  const xml = xmlSitemapWriter();
  for (const lang of LANGUAGE) xml.add(origin + '/' + lang + '/blog');
  function add(row) {
    // Read through the anonymous public policy. Blog rows in the current
    // publishing flow are live; no title/body or draft editor state is read.
    const { language, slug } = row || {};
    if (!LANGUAGE.has(language) || typeof slug !== 'string' || !slug ||
        slug !== slug.trim() || /^[.]{1,2}$/.test(slug) || /[\\/\u0000-\u001f\u007f]/.test(slug) ||
        slug === 'write') return;
    let encoded;
    try { encoded = encodeURIComponent(slug); } catch { return; }
    // Do not use the fetch time as lastmod. The legacy blog schema does not
    // provide a verified content edit time.
    xml.add(origin + '/' + language + '/blog/' + encoded);
  }
  return {add,finish:xml.finish};
}
function renderWorldcupSitemap(origin, rows) {
  const xml = sitemapWriter(origin,'worldcup');
  rows.forEach(xml.add);
  return xml.finish();
}
function block(links, language, section) {
  if (!links?.length) return '';
  const heading = section === 'latest-worldcups' ? LATEST_WORLDCUPS[language] || LATEST_WORLDCUPS.en :
    section === 'latest' ? LATEST[language] || LATEST.en : (COPY[language] || COPY.en)[0];
  const items = links.map(item => {
    const preview = section === 'latest-worldcups' && item.image
      ? ' data-preview="' + escape(item.image) + '"' : '';
    return '<li><a href="' + escape(item.href) + '"' + preview + '>' + escape(item.label) + '</a></li>';
  }).join('');
  return '<section class="discovery-links" data-discovery="'+section+'" style="margin:20px auto;max-width:900px;padding:0 16px"><h2>'+escape(heading)+'</h2><ul>'+items+'</ul></section>';
}
async function optional(work) {
  try { return await work; } catch { return []; }
}
function install(app, discovery, origin) {
  async function serve(kind,res) {
    try {
      const xml = await discovery.sitemap(origin,kind);
      return res.set('Cache-Control',SITEMAP_CACHE_HEADERS).type('application/xml').send(xml);
    } catch {
      return res.set('Cache-Control','no-store').status(503).type('text/plain').send('Sitemap temporarily unavailable');
    }
  }
  const routeKinds = new Map();
  for (const [kind, {file, seo, aliases = []}] of Object.entries(SITEMAPS)) {
    app.get(['/' + file, ...aliases], (_req,res) => serve(kind,res));
    routeKinds.set(seo, kind);
  }
  app.get('/api/content-discovery',async (req,res) => {
    const {kind, lang, id} = req.query;
    if (Object.keys(req.query).some(key => !['kind','lang','id'].includes(key)) ||
        typeof kind !== 'string' || !Object.hasOwn(KINDS,kind) || !LANGUAGE.has(lang) ||
        (id !== undefined && (typeof id !== 'string' || !UUID.test(id))) ||
        (id === undefined && kind !== 'quiz' && kind !== 'tier')) {
      return res.set('Cache-Control','no-store').status(400).json({error:'INVALID_DISCOVERY_REQUEST'});
    }
    try {
      let payload;
      if (id === undefined) {
        payload = { links: await discovery.latest(kind,lang) };
      } else {
        const row = await discovery.current(kind,id);
        if (!row || !link(kind,row,lang)) payload = { links: [] };
        else if (kind === 'worldcup') {
          const [links, latestWorldcups] = await Promise.all([
            optional(discovery.related(kind,row,lang)), optional(discovery.latestWorldcups(lang,id)),
          ]);
          payload = { links, latestWorldcups };
        } else payload = { links: await discovery.related(kind,row,lang) };
      }
      // IDs can later become private. Keep response caching short and public-only.
      return res.set('Cache-Control','public, max-age=0, s-maxage=60').json(payload);
    } catch {
      return res.set('Cache-Control','no-store').status(503).json({error:'DISCOVERY_UNAVAILABLE'});
    }
  });
  app.use((req,res,next) => {
    const kind = routeKinds.get(req.query?.seo);
    return kind && ['GET','HEAD'].includes(req.method) ? serve(kind,res) : next();
  });
}
module.exports = { createDiscovery, renderWorldcupSitemap, block, optional, install };
