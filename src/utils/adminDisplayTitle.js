// Display only: never overwrite the original title or saved translations.
function titleMap(value) {
  if (typeof value === 'string') {
    try { value = JSON.parse(value); } catch { return {}; }
  }
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}
function titleText(value) { return typeof value === 'string' ? value.trim() : ''; }
export function adminDisplayTitle(item, fallback = '제목 없음') {
  const translated = titleMap(item?.title_translations);
  const legacy = titleMap(item?.title);
  return titleText(translated.ko) || titleText(legacy.ko) || titleText(item?.title) ||
    titleText(translated.en) || titleText(legacy.en) ||
    [...Object.values(translated), ...Object.values(legacy)].map(titleText).find(Boolean) || fallback;
}
