const COPY = require('./detailCopy.json');
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function getDetailLinks(language, category, sourceWorldcupId) {
  const requested = String(language || 'en').toLowerCase().split(/[-_]/)[0];
  const lang = COPY[requested] ? requested : 'en';
  const copy = COPY[lang];
  const raw = String(category || '').trim().toLowerCase();
  const worldcupCategory = ({ animation: 'anime-manga', anime_manga: 'anime-manga', entertainment: 'person', movie_drama: 'movie-drama', other: 'etc' })[raw] || raw;
  const validWorldcup = ['game', 'sports', 'food', 'person', 'music', 'korea', 'anime-manga', 'movie-drama', 'etc'].includes(worldcupCategory);
  const listCategory = ({ anime_manga: 'animation', 'anime-manga': 'animation', person: 'entertainment', music: 'entertainment', korea: 'entertainment', movie_drama: 'entertainment', 'movie-drama': 'entertainment', etc: 'other' })[raw] || raw;
  const validList = ['game', 'sports', 'food', 'animation', 'entertainment', 'other'].includes(listCategory);
  const quizCategory = listCategory === 'knowledge' ? 'knowledge' : validList ? listCategory : '';
  const links = [
    { href: validWorldcup ? `/${lang}/category/${worldcupCategory}` : (lang === 'en' ? '/' : `/${lang}`), label: copy[1] },
    { href: `/${lang}/tier-list` + (validList ? `?category=${listCategory}` : ''), label: copy[2] },
    { href: `/${lang}/quiz` + (quizCategory ? `?category=${quizCategory}` : ''), label: copy[3] },
  ];
  if (UUID.test(String(sourceWorldcupId || ''))) links.unshift({ href: `/${lang}/select-round/${sourceWorldcupId}`, label: copy[4] });
  return { lang, heading: copy[0], links };
}
function escape(value) { return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function renderDetailLinks(language, category, sourceWorldcupId) {
  const { heading, links } = getDetailLinks(language, category, sourceWorldcupId);
  return `<nav aria-label="${escape(heading)}"><h2>${escape(heading)}</h2><ul>${links.map(link => `<li><a href="${escape(link.href)}">${escape(link.label)}</a></li>`).join('')}</ul></nav>`;
}
module.exports = { getDetailLinks, renderDetailLinks };
