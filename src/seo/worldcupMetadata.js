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
module.exports = { candidatesOf, candidateDescription, imageOf, fallbackImage, winnerImage };
