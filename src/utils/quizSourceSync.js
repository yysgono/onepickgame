// Match by source ID; legacy candidates without IDs require an unambiguous image match.
export const sourceKey = q => q?.sourceWorldcupId != null && q?.sourceCandidateId != null
  ? JSON.stringify([String(q.sourceWorldcupId), String(q.sourceCandidateId)]) : null;
const nameOf = c => String(c?.name || '').trim();
const thumbnail = value => {
  const url = String(value || '');
  const match = url.match(/(?:youtu.be\/|youtube.com\/(?:embed\/|shorts\/|live\/|watch\?(?:.*&)?v=))([A-Za-z0-9_-]{11})/i);
  return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : url;
};
export function sourceCandidate(q, cups) {
  const cup = cups.find(c => String(c.id) === String(q.sourceWorldcupId));
  const candidates = Array.isArray(cup?.data) ? cup.data : [];
  const matches = candidates.filter(c => c?.id != null && String(c.id) === String(q.sourceCandidateId));
  if (matches.length === 1) return matches[0];
  if (matches.length) return null;
  const images = candidates.filter(c => c?.id == null && q.imageUrl && thumbnail(c.image) === q.imageUrl);
  return images.length === 1 ? images[0] : null;
}
export function syncSourceQuestions(questions, cups) {
  const renames = new Map();
  for (const q of questions) {
    const candidate = sourceCandidate(q, cups);
    const previous = q.sourceName || (q.type === 'short_answer' ? q.answers?.find(Boolean) : q.options?.[q.correctIndex]);
    if (!candidate || !nameOf(candidate) || !previous) continue;
    const key = JSON.stringify([String(q.sourceWorldcupId), previous]);
    const name = nameOf(candidate);
    if (!renames.has(key)) renames.set(key, name);
    else if (renames.get(key) !== name) renames.set(key, null); // Duplicate old names are ambiguous.
  }
  return questions.map(q => {
    const candidate = sourceCandidate(q, cups);
    const name = nameOf(candidate);
    if (!name) return q;
    const old = q.sourceName || (q.type === 'short_answer' ? q.answers?.find(Boolean) : q.options?.[q.correctIndex]);
    const replace = value => value === old ? name : value;
    const renameOption = value => renames.get(JSON.stringify([String(q.sourceWorldcupId), value])) || value;
    const options = (q.options || []).map((value, i) => i === q.correctIndex ? replace(value) : renameOption(value));
    return { ...q, sourceName: name, sourceAnswer: replace(q.sourceAnswer || old || name), options,
      answers: (q.answers || []).map(replace),
      translations: Object.fromEntries(Object.entries(q.translations || {}).map(([lang, tr]) => [lang, { ...tr,
        options: (tr.options || []).map((value, i) => i === q.correctIndex ? replace(value) : renameOption(value)),
        answers: (tr.answers || []).map(replace),
      }])) };
  });
}
export function sourceCandidatePool(cups) {
  return cups.flatMap(cup => (Array.isArray(cup.data) ? cup.data : []).map((c, index) => ({
    name: nameOf(c), image: thumbnail(c?.image), sourceWorldcupId: cup.id, sourceCandidateId: c?.id ?? String(index),
  })).filter(c => c.name));
}
export function mergeSourceQuestions(current, imported, cups) {
  const synced = syncSourceQuestions(current, cups);
  const used = new Set(synced.map(sourceKey).filter(Boolean));
  return [...synced, ...imported.filter(q => { const key = sourceKey(q); if (key && used.has(key)) return false; if (key) used.add(key); return true; })];
}
