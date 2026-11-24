// Public home cards and bounded pages, shared by the server and the anonymous browser reader.
const COPY = require('./platformHomeCopy.json');
const PATHS = require('./sitePaths.js');
const modeConfig = require('./platformModes.js');
const tierPreview = require('./tierCardPreview.js');
const tierTitles = require('./tierCardTitles.js');
const worldcupContent = require('./worldcupCardContent.js');
const quizCopy = require('./quizCardCopy.json');
const collageLayout = require('../components/topNine/collageLayoutCore.js');
const languageCopy = require('../components/communityUiCopy.json');
const sharedCards = require('../utils/sharedWorldcupCards.js');
const { localizedBoardTitle } = require('../components/topNine/localizedBoardTitleCore.js');
const randomCopy = require('../components/randomPick/randomPickCopy.json');
const VERSION = 5, LIMIT = 5;
const LANGUAGES = [['en','English'],['ko','한국어'],['ja','日本語'],['zh','简体中文'],['es','Español'],['fr','Français'],['vi','Tiếng Việt'],['de','Deutsch'],['ru','Русский'],['id','Bahasa Indonesia'],['pt','Português'],['hi','हिन्दी'],['tr','Türkçe'],['th','ภาษาไทย'],['ar','العربية'],['bn','বাংলা'],['it','Italiano'],['pl','Polski'],['nl','Nederlands'],['cs','Čeština']];
const RANDOM_MODES = ['wheel','lotto','pinball','ladder','boxes','cards','order','dice','teams'];
const uuid = /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i;
const media = value => typeof value === 'string' && /^https?:\/\//i.test(value) ? value : '';
const map = value => { if (typeof value === 'string') { try { return JSON.parse(value) || {}; } catch { return {}; } } return value || {}; };
const local = (row, lang) => String(map(row.title_translations)[lang] || map(row.title_translations).en || row.title || '');
const hrefs = modeConfig.hrefs;
function optionsFor(options = {}) {
  const kind = options.kind || '', offset = Number(options.offset || 0), limit = Number(options.limit || LIMIT);
  if (kind && !modeConfig.MODES.some(mode => mode.kind === kind)) throw Error('UNSUPPORTED_HOME_KIND');
  if (!Number.isSafeInteger(offset) || offset < 0 || offset > 100000 || !Number.isSafeInteger(limit) || limit < 1 || limit > 40) throw Error('INVALID_HOME_PAGE');
  return { kind, offset, limit };
}
function empty(lang) { return { version: VERSION, lang, groups: hrefs(lang).map((href, i) => ({ kind: modeConfig.MODES[i].kind, href, rows: [], unavailable: true, hasMore: false, nextOffset: 0 })) }; }
function homeTierTitle(row, sources, lang) {
  // These are game/topic captions on the home, so use the administrator's configured preset title.
  // Stored result titles and authored translations are left untouched on result pages.
  const meta = map(row.tier_labels), source = sources.find(item => String(item.id) === String(row.source_worldcup_id || meta._sourceWorldcupId));
  const configured = map(source?.tier_preset_title_translations);
  return String(configured[lang] || configured.en || '').trim() || tierTitles.localizedTierCardTitle(row, sources, lang);
}
async function loadRaw(client, page) {
  const { offset, limit } = page;
  const active = kind => !page.kind || page.kind === kind;
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 6000);
  const read = async query => {
    try { if (query.abortSignal) query = query.abortSignal(controller.signal); const { data, error } = await query; return { rows: !error && Array.isArray(data) ? data : [], error: Boolean(error) }; }
    catch { return { rows: [], error: true }; }
  };
  const skip = () => Promise.resolve({ rows: [], error: false });
  const popular = (table, fields, key, filter) => {
    let query = client.from(table).select(fields); if (filter) query = filter(query);
    return read(query.order(key, { ascending: false, nullsFirst: false }).order('created_at', { ascending: false }).order('id').range(offset, offset + limit));
  };
  try {
    const [counts, tier, quiz, nine, random] = await Promise.all([
      active('worldcup') ? read(client.rpc('get_worldcup_play_counts').order('play_count', { ascending: false }).order('cup_id').range(offset, offset + limit)) : skip(),
      active('tier') ? popular('tier_list_home_cards', 'id,title,title_translations,tier_labels,source_worldcup_id,thumbnail_url,view_count,created_at,candidates,tiers,tier_preview_counts', 'view_count') : skip(),
      active('quiz') ? popular('quizzes', 'id,title,title_translations,thumbnail_url,question_count,play_count,created_at', 'play_count', query => query.is('deleted_at', null).eq('is_published', true)) : skip(),
      active('nine') ? popular('top_nine_public_boards', 'id,title,slots,source_worldcup_ids,view_count,created_at,title_is_custom', 'view_count') : skip(),
      active('random') ? read(client.from('random_pick_play_counts').select('mode,play_count')) : skip(),
    ]);
    if (tier.error && !controller.signal.aborted) {
      const fallback = await popular('tier_lists', 'id,title,title_translations,original_language,tier_labels,source_worldcup_id,thumbnail_url,view_count,created_at,candidates,tiers', 'view_count', query => query.is('deleted_at', null));
      tier.rows = fallback.rows; tier.error = fallback.error;
    }
    const tierRows = tier.rows.slice(0, limit), nineRows = nine.rows.slice(0, limit);
    const originalIds = tierRows.filter(row => !map(row.tier_labels)._originalLanguage).map(row => row.id).filter(id => uuid.test(String(id)));
    const sourceIds = Array.from(new Set(tierRows.map(row => row.source_worldcup_id || map(row.tier_labels)._sourceWorldcupId).concat(nineRows.flatMap(row => row.source_worldcup_ids || [])))).filter(id => uuid.test(String(id)));
    const worldcupIds = counts.rows.map(row => String(row.cup_id)).filter(id => uuid.test(id));
    const [cups, sources, settings, originals] = await Promise.all([
      worldcupIds.length ? read(client.from('worldcups').select('id,title,title_translations,description,description_translations,category,created_at,data').is('deleted_at', null).in('id', worldcupIds)) : skip(),
      sourceIds.length ? read(client.from('worldcups').select('id,title,title_translations,tier_preset_title_translations').is('deleted_at', null).in('id', sourceIds)) : skip(),
      sourceIds.length ? read(client.from('top_nine_templates').select('source_worldcup_id,title_translations').in('source_worldcup_id', sourceIds)) : skip(),
      originalIds.length ? read(client.from('tier_lists').select('id,original_language').is('deleted_at', null).in('id', originalIds)) : skip(),
    ]);
    const originalById = new Map(originals.rows.map(row => [String(row.id), row.original_language]));
    const byId = new Map(cups.rows.map(row => [String(row.id), row]));
    const ordered = counts.rows.filter(row => byId.has(String(row.cup_id))).slice(0, limit);
    const previews = await sharedCards.loadCards(client, ordered.map(row => row.cup_id));
    const byPreview = new Map(previews.map(row => [String(row.cup_id), row.images]));
    const titleSources = sources.rows.map(row => Object.assign({}, row, { top_nine_title_translations: settings.rows.find(setting => String(setting.source_worldcup_id) === String(row.id))?.title_translations }));
    return { counts, tier, quiz, nine, random, tierRows, nineRows, originalById, byId, ordered, byPreview, titleSources,
      partial: [counts, tier, quiz, nine, random, cups, sources, settings, originals].some(result => result.error),
      cupsError: cups.error };
  } finally { clearTimeout(timer); }
}
function localize(raw, lang, page) {
    const { offset, limit } = page;
    const active = kind => !page.kind || page.kind === kind;
    const { counts, tier, quiz, nine, random, tierRows, nineRows, originalById, byId, ordered, byPreview, titleSources, cupsError } = raw;
    const countsByMode = new Map(random.rows.map(row => [row.mode, Number(row.play_count) || 0]));
    const randomModes = RANDOM_MODES.slice().sort((a, b) => (countsByMode.get(b) || 0) - (countsByMode.get(a) || 0) || RANDOM_MODES.indexOf(a) - RANDOM_MODES.indexOf(b));
    const rows = {
      worldcup: ordered.map(row => {
        const cup = byId.get(String(row.cup_id)), candidates = Array.isArray(cup.data) ? cup.data : [];
        return { href: `/${lang}/select-round/${cup.id}`, statsHref: `/${lang}/result/${cup.id}`, label: local(cup, lang), plays: Number(row.play_count) || 0,
          description: worldcupContent.candidateLine(cup, [], lang), candidateCount: candidates.length, date: cup.created_at || '', accent: worldcupContent.accent(cup.category),
          images: byPreview.get(String(cup.id)) || candidates.slice(0, 2).map(candidate => media(candidate.image || candidate.image_url)).filter(Boolean) };
      }),
      tier: tierRows.map(row => {
        const item = Object.assign({}, row, { original_language: originalById.get(String(row.id)) || row.original_language });
        return { href: `/${lang}/tier-list/${row.id}`, label: homeTierTitle(item, titleSources, lang), image: media(row.thumbnail_url), tierPreview: tierPreview.snapshot(row) };
      }),
      quiz: quiz.rows.slice(0, limit).map(row => ({ href: `/${lang}/quiz/${row.id}`, label: local(row, lang), image: media(row.thumbnail_url), questionCount: Number(row.question_count) || 0, plays: Number(row.play_count) || 0 })),
      nine: nineRows.map(row => ({ href: `/${lang}/mytop9/${row.id}`, label: localizedBoardTitle(row, titleSources, lang), slots: (Array.isArray(row.slots) ? row.slots : []).slice(0, 9).map(slot => slot?.id === 'tn-empty-cell' || !media(slot?.src) ? null : { src: media(slot.src), zoom: slot.zoom, x: slot.x, y: slot.y }) })),
      random: active('random') ? randomModes.slice(offset, offset + limit).map(mode => ({ href: `/${lang}/random-pick/${mode}`, label: (randomCopy[lang] || randomCopy.en).modes[mode], mode })) : [],
    };
    const errors = { worldcup: counts.error || cupsError, tier: tier.error, quiz: quiz.error, nine: nine.error, random: random.error };
    const sizes = { worldcup: counts.rows.length, tier: tier.rows.length, quiz: quiz.rows.length, nine: nine.rows.length };
    const lastCupIndex = ordered.length ? counts.rows.findIndex(row => String(row.cup_id) === String(ordered[ordered.length - 1].cup_id)) + 1 : counts.rows.length;
    return { version: VERSION, lang, groups: hrefs(lang).map((href, index) => {
      const kind = modeConfig.MODES[index].kind;
      return { kind, href, rows: rows[kind], unavailable: Boolean(errors[kind]), hasMore: active(kind) && (kind === 'random' ? offset + limit < RANDOM_MODES.length : sizes[kind] > limit || kind === 'worldcup' && sizes[kind] === limit + 1), nextOffset: offset + (kind === 'worldcup' ? lastCupIndex : rows[kind].length) };
    }) };
}
async function load(client, language, options = {}) {
  const page = optionsFor(options);
  return localize(await loadRaw(client, page), PATHS.language(language), page);
}
function makeLoader(client) {
  // Query filters and selected columns are language-independent. Keep only a
  // small number of raw pages per client, then localize independently per call.
  const cache = new Map(), pending = new Map();
  return async (language, options = {}) => {
    const lang = PATHS.language(language), page = optionsFor(options), key = JSON.stringify([page.kind, page.offset, page.limit]);
    if (options.refresh) cache.delete(key);
    const cached = cache.get(key);
    if (cached && cached.until > Date.now()) return localize(cached.value, lang, page);
    let promise = pending.get(key);
    if (!promise) {
      promise = loadRaw(client, page).then(value => {
        cache.delete(key); cache.set(key, { until: Date.now() + (value.partial ? 5000 : 60000), value });
        while (cache.size > 8) cache.delete(cache.keys().next().value);
        return value;
      }).finally(() => pending.delete(key));
      pending.set(key, promise);
    }
    return localize(await promise, lang, page);
  };
}
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
function render(data, lang, css = '') {
  const copy = COPY[lang] || COPY.en, groups = data?.groups || empty(lang).groups, meta = worldcupContent.COPY[lang] || worldcupContent.COPY.en, quiz = quizCopy[lang] || quizCopy.en;
  const image = (url, name = '') => media(url) ? '<img src="'+escape(url)+'" alt="'+escape(name)+'" loading="lazy">' : '';
  const card = (row, index) => {
    const kind = modeConfig.MODES[index].kind;
    if (kind === 'quiz') return '<a class="quiz-category-card platform-card platform-card--quiz" href="'+escape(row.href)+'"><div class="quiz-category-image">'+(image(row.image, row.label)||'❓')+'</div><div class="quiz-category-card-body"><h3>'+escape(row.label)+'</h3><p>'+escape(row.questionCount)+' '+escape(quiz.questions)+' · '+escape(row.plays)+' '+escape(quiz.plays)+'</p><span class="quiz-category-play">'+escape(quiz.playNow)+' →</span></div></a>';
    const preview = row.tierPreview ? tierPreview.render(row.tierPreview) : row.images?.length ? '<div class="platform-duel">'+row.images.map(url => image(url)).join('')+(row.images.length>1?'<img class="platform-vs" src="/ui/vs-badge-v78.webp" alt="">':'')+'</div>' : row.slots ? '<div class="platform-collage" dir="ltr">'+row.slots.map((slot,i)=>{const style=collageLayout.layouts[i].style;return '<div class="platform-collage-cell" style="left:'+style.left+';top:'+style.top+';width:'+style.width+';height:'+style.height+';clip-path:'+style.clipPath+'">'+image(slot?.src)+'</div>';}).join('')+'<svg viewBox="0 0 100 100" aria-hidden="true"><path d="'+collageLayout.boundaryPath+'" vector-effect="non-scaling-stroke"/></svg></div>' : image(row.image)||'<span class="platform-placeholder" aria-hidden="true">'+modeConfig.MODES[index].icon+'</span>';
    const content = '<div class="platform-card-media">'+preview+'</div><strong><span>'+escape(row.label)+'</span></strong>';
    if (kind === 'worldcup') return '<article class="platform-card platform-card--worldcup" style="--card-accent:'+escape(row.accent||'#F97316')+'"><a class="platform-card-link" href="'+escape(row.href)+'">'+content+'<p class="platform-card-candidates"><span>'+escape(row.description)+'</span></p><div class="platform-card-meta"><span>👤 '+escape(meta.candidates)+' '+escape(row.candidateCount)+'</span><span>▶ '+escape(meta.plays)+' '+escape(row.plays)+'</span><span>🕒 '+escape(meta.updated)+' '+escape(worldcupContent.formatDate(row.date))+'</span></div></a><div class="platform-card-actions"><a href="'+escape(row.statsHref)+'">'+escape(copy.stats)+'</a><a href="'+escape(row.href)+'">'+escape(copy.start)+'</a></div></article>';
    return '<a class="platform-card platform-card--'+kind+'" href="'+escape(row.href)+'">'+content+'</a>';
  };
  const modeIcon = (index, size) => modeConfig.MODES[index].kind === 'nine' ? '<svg width="'+size+'" height="'+size+'" viewBox="0 0 48 48" aria-hidden="true" focusable="false"><rect x="3" y="3" width="42" height="42" rx="1" fill="white"/><rect x="17" y="17" width="14" height="14" fill="#a34eac"/><path d="M3 3H45V45H3ZM17 3V45M31 3V45M3 17H45M3 31H45" fill="none" stroke="#28222d" stroke-width="2"/></svg>' : modeConfig.MODES[index].icon;
  const brand = '<header class="onepick-header onepick-header--platform"><div class="onepick-header-main"><h1 class="onepick-header-brand-area"><a class="onepick-header-brand" href="'+PATHS.siteHome(lang)+'"><span class="onepick-logo-frame"><img src="/ui/onepick-logo-v78.webp" alt="" width="80" height="80"></span><span style="font-style:italic;font-size:1.14em;font-weight:900;white-space:nowrap">One Pick Game</span></a></h1></div></header>';
  const language = '<div class="platform-language"><div class="content-language-select"><label><span class="content-language-label">🌐 '+escape((languageCopy[lang]||languageCopy.en).language)+'</span><select aria-label="'+escape((languageCopy[lang]||languageCopy.en).language)+'">'+LANGUAGES.map(([code,label])=>'<option value="'+code+'"'+(code===lang?' selected':'')+'>'+escape(label)+'</option>').join('')+'</select></label></div></div>';
  return '<div id="seo-content"><style>'+css+'</style>'+brand+'<main class="platform-home" dir="'+(lang==='ar'?'rtl':'ltr')+'"><header class="platform-hero"><p>'+escape(copy.intro)+'</p><nav class="platform-modes" aria-label="'+escape(copy.titles.join(', '))+'">'+groups.map((group,index)=>'<a href="'+escape(group.href)+'" class="platform-mode platform-mode-'+group.kind+'"><span aria-hidden="true">'+modeIcon(index,56)+'</span><strong>'+escape(copy.titles[index])+'</strong><small>'+escape(copy.summaries[index])+'</small></a>').join('')+'</nav></header>'+language+groups.map((group,index)=>'<section class="platform-section platform-section-'+group.kind+'"><div class="platform-section-heading"><h2><a class="platform-section-main-link" href="'+escape(group.href)+'"><span aria-hidden="true">'+modeIcon(index,32)+' </span>'+escape(copy.titles[index])+'</a></h2><a href="'+escape(group.href)+'">'+escape(copy.all)+' →</a></div><p class="platform-section-intro">'+copy.descriptionLines[index].map(line=>'<span>'+escape(line)+'</span>').join(' ')+'</p><div class="platform-cards">'+(group.rows.length?group.rows.map(row=>card(row,index)).join(''):'<p>'+escape(group.unavailable?copy.failed:copy.empty)+'</p>')+'</div></section>').join('')+'</main></div>';
}
module.exports = { load, makeLoader, render, COPY, hrefs, empty, homeTierTitle, optionsFor, VERSION, MODES: modeConfig.MODES, LIMIT, LANGUAGES };
