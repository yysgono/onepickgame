const home = require('./platformHome');
const KINDS = home.MODES.map(mode => mode.kind);

function valid(value, lang) {
  return value?.version === home.VERSION && value.lang === lang && Array.isArray(value.groups) && value.groups.length === 5 &&
    value.groups.every((group, i) => group?.kind === KINDS[i] && Array.isArray(group.rows) && typeof group.hasMore === 'boolean' && Number.isSafeInteger(group.nextOffset) && group.nextOffset >= 0);
}
const empty = home.empty;

function merge(primary, fallback, lang) {
  const data = empty(lang);
  if (Array.isArray(primary?.latestWorldcups)) data.latestWorldcups = primary.latestWorldcups;
  data.groups = data.groups.map((missing, i) => {
    const first = primary?.groups[i], second = fallback?.groups[i];
    if (first && !first.unavailable) return first;
    if (second && (!second.unavailable || !first?.rows.length)) return second;
    return first || second || missing;
  });
  return data;
}
function abortError() { const error = new Error('Home request cancelled'); error.name = 'AbortError'; return error; }
async function load({ lang, initial, fetch: fetcher, readPublic, signal, refresh = false, timeoutMs = 11000, kind = '', offset = 0, limit = home.LIMIT }) {
  let data = valid(initial, lang) ? initial : null;
  if (signal?.aborted) throw abortError();
  if (!data) {
    const controller = new AbortController(), abort = () => controller.abort();
    signal?.addEventListener('abort', abort, { once: true });
    const timer = setTimeout(abort, timeoutMs);
    try {
      const query = new URLSearchParams({lang});
      if(kind){query.set('kind',kind);query.set('offset',String(offset));query.set('limit',String(limit));}
      const response = await fetcher('/api/platform-home?' + query, { signal: controller.signal, cache: refresh ? 'no-store' : 'default' });
      if (response.ok) { const value = await response.json(); if (valid(value, lang)) data = value; }
    } catch { /* A missing API or HTML response in CRA development must use the public reader. */ }
    finally { clearTimeout(timer); signal?.removeEventListener('abort', abort); }
  }
  if (signal?.aborted) throw abortError();
  if (!data || data.groups.some(group => group.unavailable)) {
    try {
      const fallback = await readPublic(lang, { refresh, kind, offset, limit });
      if (valid(fallback, lang)) data = merge(data, fallback, lang);
    } catch { /* Preserve any successful server sections and keep failed sections retryable. */ }
  }
  if (signal?.aborted) throw abortError();
  return data || empty(lang);
}
module.exports = { valid, empty, merge, load };
