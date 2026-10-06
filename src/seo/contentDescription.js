// Shared by Node and React; .js is required for CRA to bundle this as code.
function list(value) {
  if (typeof value === 'string') { try { value = JSON.parse(value); } catch { return []; } }
  return Array.isArray(value) ? value : [];
}
function text(value) { return String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(); }
function localized(map, fallback, lang) {
  if (typeof map === 'string') { try { map = JSON.parse(map); } catch { map = {}; } }
  return text(map?.[lang]) || text(map?.en) || text(fallback);
}
function join(values, max = 400) {
  let result = '';
  for (const value of [...new Set(values.map(text).filter(Boolean))]) {
    const next = result ? `${result}, ${value}` : value;
    if (next.length > max) { if (!result) result = value.slice(0, max); break; }
    result = next;
  }
  return result;
}
function tierDescription(tier, lang) {
  return localized(tier?.description_translations, tier?.description, lang) ||
    join(list(tier?.candidates).map(c => c?.name || c?.title));
}
function quizDescription(quiz, questions, lang) {
  return localized(quiz?.description_translations, quiz?.description, lang) ||
    join(list(questions).map(q => localized(q?.question_translations, q?.question_text, lang)));
}
module.exports = { tierDescription, quizDescription };
