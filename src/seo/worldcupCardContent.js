const metadata = require('./worldcupMetadata');
const COPY = require('./worldcupCardCopy.json');
function candidateName(candidate, lang) {
  return String(candidate?.name_translations?.[lang] || candidate?.name_translations?.en || candidate?.name || candidate?.title || '').trim();
}
function candidateLine(cup, winStats, lang, describe = metadata.worldcupDescription) {
  const candidates = Array.isArray(cup?.data) ? cup.data : [];
  if (!candidates.length) return describe(cup, lang);
  const rankedFromStats = Array.isArray(winStats) && winStats.length ? winStats.map((row, index) => Object.assign({}, row, { _originIdx: index }))
    .sort((a, b) => (b.win_count || 0) - (a.win_count || 0) || (b.match_wins || 0) - (a.match_wins || 0) || a._originIdx - b._originIdx)
    .map(row => candidates.find(candidate => String(candidate.id) === String(row.candidate_id))).filter(Boolean) : [];
  const ids = new Set(rankedFromStats.map(candidate => String(candidate.id)));
  const names = rankedFromStats.concat(candidates.filter(candidate => !ids.has(String(candidate.id)))).map(candidate => candidateName(candidate, lang)).filter(Boolean);
  return names.length ? names.join(' · ') : describe(cup, lang);
}
function formatDate(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return '-';
  return date.getFullYear()+'.'+String(date.getMonth()+1).padStart(2,'0')+'.'+String(date.getDate()).padStart(2,'0');
}
function accent(category) { return ({korea:'#F97316',person:'#de5276',anime_manga:'#db8a20',game:'#1687e8',sports:'#24945d',music:'#9a55cd',movie_drama:'#db6544',food:'#c38b17',animals_plants:'#38834d',travel:'#128c9e',brands:'#6470ba'})[category] || '#F97316'; }
module.exports = { candidateLine, candidateName, formatDate, accent, COPY };
