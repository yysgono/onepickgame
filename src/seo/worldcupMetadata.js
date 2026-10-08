function candidatesOf(cup = {}) {
  for (let value of [cup.data, cup.candidates]) {
    if (typeof value === 'string') { try { value = JSON.parse(value); } catch { continue; } }
    if (Array.isArray(value) && value.length) return value;
  }
  return [];
}
function candidateDescription(cup, maxLength = 400) {
  const names = [...new Set(candidatesOf(cup).map(c => String(c?.name || '').trim()).filter(Boolean))];
  let text = '';
  for (const name of names) {
    const next = text ? `${text}, ${name}` : name;
    if (next.length > maxLength) break;
    text = next;
  }
  return text;
}
const introCopy = require('./worldcupIntroCopy.json');
function cleanText(value) { return String(value || '').replace(/\s+/g, ' ').trim(); }
function translationMap(value) {
 if (typeof value === 'string') { try { value = JSON.parse(value); } catch { return {}; } }
 return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}
function worldcupDescription(cup = {}, language = 'en') {
 cup = cup || {};
 const lang = String(language || 'en').toLowerCase().split(/[-_]/)[0];
 const original = String(cup.original_language || '').toLowerCase().split(/[-_]/)[0];
 const descriptions = translationMap(cup.description_translations);
 const saved = (lang === original ? [cup.description, descriptions[lang], cup.desc] : [descriptions[lang], cup.description, descriptions.en, cup.desc]).map(cleanText).find(Boolean) || ''; 
 // Old create/edit forms saved this exact candidate-list fallback as the description.
 // Recognize that format without overwriting the stored text.
 const legacyDescription = cleanText(candidateDescription(cup));
 if (saved && (!legacyDescription || saved !== legacyDescription)) return saved;
 const titles = translationMap(cup.title_translations);
 const title = cleanText((lang === original ? cup.title : titles[lang]) || cup.title || titles.en || 'OnePickGame');
 const candidates = candidatesOf(cup);
 const names = [];
 for (const name of [...new Set(candidates.map(c => cleanText(c?.name || c?.title)).filter(Boolean))]) {
  if (names.length >= 3) break;
  if ([...names, name].join(', ').length > 160) continue;
  names.push(name);
 }
 const copy = introCopy[lang] || introCopy.en;
 return [copy[0].replace('{title}', title), candidates.length ? copy[1].replace('{n}', String(candidates.length)) : '', names.length ? copy[2].replace('{names}', names.join(', ')) : ''].filter(Boolean).join(' ');
}
function imageOf(candidate) {
  const source = String(candidate?.image || candidate?.url || candidate?.videoUrl || candidate?.video_url || candidate?.youtubeUrl || candidate?.youtube_url || '').trim();
  const match = source.match(/youtu\.be\/([\w-]+)/i) || source.match(/[?&]v=([\w-]+)/i) || source.match(/youtube(?:-nocookie)?\.com\/(?:embed|shorts)\/([\w-]+)/i);
  return match ? `https://i.ytimg.com/vi/${match[1]}/hqdefault.jpg` : source;
}
function fallbackImage(cup) {
  for (const candidate of candidatesOf(cup)) { const image = imageOf(candidate); if (image) return image; }
  return imageOf({image: cup.image || cup.thumbnail}) || '/ogimg.png';
}
function winnerImage(cup, stats) {
  const byId = new Map(candidatesOf(cup).map(c => [String(c.id), c]));
  let winner = null, wins = 0;
  for (const row of stats || []) {
    const candidate = byId.get(String(row.candidate_id));
    if (candidate && Number(row.win_count || 0) > wins) { winner = candidate; wins = Number(row.win_count); }
  }
  return imageOf(winner) || fallbackImage(cup);
}
module.exports = { candidatesOf, candidateDescription, worldcupDescription, imageOf, fallbackImage, winnerImage };
