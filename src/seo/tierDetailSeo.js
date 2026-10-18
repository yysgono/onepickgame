// Shared metadata rules for Node server HTML and React. Never writes stored content.
const COPY = require('./tierDetailSeoCopy.json');
const { tierDescriptionFields } = require('./contentDescription.js');
const TIERS = ['S', 'A+', 'A', 'B', 'C', 'D', 'F'];
const map = value => {
  if (typeof value === 'string') { try { value = JSON.parse(value); } catch { return {}; } }
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
};
const list = value => {
  if (typeof value === 'string') { try { value = JSON.parse(value); } catch { return []; } }
  return Array.isArray(value) ? value : [];
};
const text = value => typeof value === 'string' || typeof value === 'number'
  ? String(value).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : '';
const short = (value, length) => {
  const chars = Array.from(text(value));
  return chars.length > length ? chars.slice(0, Math.max(0, length - 1)).join('') + '…' : chars.join('');
};
const normalizeLanguage = value => String(value || '').toLowerCase().split(/[-_]/)[0];
function metadata(tier) { return map(tier?.tier_labels); }
function titleTranslations(tier) {
  return Object.assign({}, map(tier?.title_translations), map(metadata(tier)._titleTranslations));
}
function getTierListTitle(tier, language, fallback = 'Tier List') {
  const lang = normalizeLanguage(language);
  const meta = metadata(tier);
  const original = normalizeLanguage(meta._originalLanguage || tier?.original_language);
  const translations = titleTranslations(tier);
  if (lang === original) return text(tier?.title) || text(translations[lang]) || fallback;
  return text(translations[lang]) || text(tier?.title) || text(translations.en) || fallback;
}
function getTierListDetailLanguages(tier, language) {
  const meta = metadata(tier);
  const fields = tierDescriptionFields(Object.assign({}, tier, { tier_labels: meta }));
  return [...new Set([normalizeLanguage(language), normalizeLanguage(meta._originalLanguage || tier?.original_language),
    ...Object.entries(titleTranslations(tier)).filter(([, value]) => text(value)).map(([key]) => normalizeLanguage(key)),
    ...Object.entries(map(fields.description_translations)).filter(([, value]) => text(value)).map(([key]) => normalizeLanguage(key))])]
    .filter(lang => Object.prototype.hasOwnProperty.call(COPY, lang));
}
function fill(template, values) { return template.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? ''); }
function getTierListDetailSeo(tier, language, nickname = '') {
  const requested = normalizeLanguage(language);
  const lang = Object.prototype.hasOwnProperty.call(COPY, requested) ? requested : 'en';
  const copy = COPY[lang];
  const meta = metadata(tier);
  const name = getTierListTitle(tier, lang, copy.fallbackTitle);
  const author = short(text(nickname) || (!tier?.user_id ? text(tier?.guest_nickname) : '') ||
    (tier?.user_id ? copy.unknownAuthor : copy.guestAuthor), 40);
  const owned = fill(copy.ownedTitle, { author });
  // Only remove a trailing site-brand suffix, not words from the game title itself.
  let base = name.replace(/\s*[|｜]\s*(?:One\s*Pick\s*Game|원픽게임)\s*$/iu, '').trim();
  const hasOwner = base.toLowerCase().includes(owned.toLowerCase());
  const hasRanking = copy.rankWords.some(word => base.toLowerCase().includes(word.toLowerCase()));
  if (!hasOwner && !hasRanking) {
    base += ` – ${tier?.category === 'animation' ? copy.characterRank : copy.ranking}`;
  }
  const suffix = `${hasOwner ? '' : ` ${owned}`} | ${copy.brand}`;
  const title = short(base, Math.max(60, 220 - Array.from(suffix).length)) + suffix;

  const candidates = list(tier?.candidates);
  const byId = new Map(candidates.filter(c => c?.id != null).map(c => [String(c.id), c]));
  const tiers = map(tier?.tiers);
  const sections = [];
  const used = new Set();
  let remaining = 5;
  const takeNames = (values, max) => {
    const names = [];
    for (const item of values) {
      const id = item && typeof item === 'object' ? item.id : item;
      if (id == null || used.has(String(id))) continue;
      const candidate = byId.get(String(id));
      const candidateName = text(candidate?.name || candidate?.title);
      if (!candidateName) continue; // Never invent a placement from an unknown/deleted ID.
      names.push(short(candidateName, 36)); used.add(String(id));
      if (names.length >= max) break;
    }
    remaining -= names.length;
    return names;
  };
  if (tiers.ONE_PICK != null) {
    const names = takeNames([tiers.ONE_PICK], 1);
    if (names.length) sections.push(`${copy.onePick}: ${names.join(', ')}`);
  }
  for (const key of TIERS) {
    if (remaining <= 0 || sections.length >= 3) break;
    const names = takeNames(list(tiers[key]), Math.min(3, remaining));
    if (names.length) sections.push(`${fill(copy.tier, { tier: key })}: ${names.join(', ')}`);
  }
  let summary = sections.join('; ');
  if (!summary) {
    const names = [...new Set(candidates.map(c => text(c?.name || c?.title)).filter(Boolean))].slice(0, 3);
    if (names.length) summary = `${copy.candidates}: ${names.map(n => short(n, 36)).join(', ')}`;
  }
  summary = short(summary, 170);
  const fields = tierDescriptionFields(Object.assign({}, tier, { tier_labels: meta }));
  const translations = map(fields.description_translations);
  const original = normalizeLanguage(meta._originalLanguage || tier?.original_language);
  const saved = lang === original ? text(fields.description) || text(translations[lang])
    : text(translations[lang]) || text(fields.description) || text(translations.en);
  const intro = fill(copy.intro, { author, title: short(name, 100) });
  const parts = [saved ? short(saved, 140) : '', short(intro, saved ? 100 : 160),
    summary ? `${short(summary, 150)}.` : ''].filter(Boolean);
  let description = parts.join(' ');
  if (Array.from(description + ' ' + copy.outro).length <= 400) description += ' ' + copy.outro;
  description = short(description, 400);
  return { lang, name, title, description, author, languages: getTierListDetailLanguages(tier, lang) };
}
module.exports = { getTierListDetailSeo, getTierListTitle, getTierListDetailLanguages };
